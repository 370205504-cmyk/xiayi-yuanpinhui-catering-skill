const db = require('../database/db');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.File({ filename: 'logs/stock.log' })]
});

class StockService {
  async getStock(dishId) {
    const cacheKey = `stock:${dishId}`;
    const cached = await db.cacheGet(cacheKey);
    if (cached !== null) {
      return { success: true, stock: cached.stock, warning: cached.warning };
    }

    const dishes = await db.query('SELECT stock, stock_warning FROM dishes WHERE id = ?', [dishId]);
    if (dishes.length === 0) {
      return { success: false, message: '菜品不存在' };
    }

    const data = { stock: dishes[0].stock, warning: dishes[0].stock_warning };
    await db.cacheSet(cacheKey, data, 300);
    return { success: true, ...data };
  }

  async updateStock(dishId, quantity, operatorId = null, reason = '') {
    const type = quantity > 0 ? 'add' : 'deduct';
    const actualQuantity = Math.abs(quantity);

    await db.transaction(async (connection) => {
      await connection.query(
        'UPDATE dishes SET stock = stock + ? WHERE id = ?',
        [quantity, dishId]
      );
      await connection.query(
        'INSERT INTO replenish_log (dish_id, quantity, type, operator_id, reason) VALUES (?, ?, ?, ?, ?)',
        [dishId, actualQuantity, type, operatorId, reason]
      );
    });

    await db.cacheDel(`stock:${dishId}`);
    logger.info(`库存更新: 菜品${dishId}, 变更${quantity}, 原因: ${reason}`);
    return { success: true };
  }

  async checkLowStock() {
    const dishes = await db.query(
      'SELECT * FROM dishes WHERE stock > 0 AND stock <= stock_warning AND is_available = 1'
    );

    if (dishes.length > 0) {
      logger.warn(`低库存预警: ${dishes.length}个菜品库存不足`);
    }
    return { success: true, items: dishes };
  }

  async deductStock(orderItems) {
    await db.transaction(async (connection) => {
      for (const item of orderItems) {
        const [dishes] = await connection.query(
          'SELECT stock FROM dishes WHERE id = ? FOR UPDATE',
          [item.dishId]
        );

        if (dishes.length === 0) {
          throw new Error(`菜品不存在: ${item.dishId}`);
        }

        if (dishes[0].stock >= 0 && dishes[0].stock < item.quantity) {
          throw new Error(`库存不足: ${item.dishName}`);
        }

        await connection.query(
          'UPDATE dishes SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.dishId]
        );
      }
    });

    for (const item of orderItems) {
      await db.cacheDel(`stock:${item.dishId}`);
    }
    return { success: true };
  }

  async getReplenishHistory(dishId, page = 1, pageSize = 50) {
    const offset = (page - 1) * pageSize;
    const history = await db.query(
      'SELECT * FROM replenish_log WHERE dish_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [dishId, pageSize, offset]
    );
    return { success: true, history };
  }
}

module.exports = new StockService();
