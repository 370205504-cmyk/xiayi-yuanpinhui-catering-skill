const db = require('../database/db');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.File({ filename: 'logs/store.log' })]
});

class StoreService {
  async getStores(storeId = null) {
    try {
      if (storeId) {
        const stores = await db.query('SELECT * FROM stores WHERE id = ? AND status = ?', [storeId, 'active']);
        if (stores.length === 0) {
          return { success: false, message: '门店不存在' };
        }
        return { success: true, store: stores[0] };
      }

      const stores = await db.query('SELECT * FROM stores WHERE status = ? ORDER BY sort_order ASC', ['active']);
      return { success: true, stores };
    } catch (error) {
      logger.error('获取门店列表失败:', error);
      throw error;
    }
  }

  async createStore(data) {
    try {
      const result = await db.query(
        `INSERT INTO stores (name, name_en, address, phone, business_hours, lat, lng, image, description, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.name, data.name_en, data.address, data.phone, data.business_hours,
          data.lat, data.lng, data.image, data.description, data.status || 'active'
        ]
      );

      logger.info(`门店创建: ${data.name}`);
      return { success: true, storeId: result.insertId };
    } catch (error) {
      logger.error('创建门店失败:', error);
      throw error;
    }
  }

  async updateStore(storeId, data) {
    try {
      const fields = ['name', 'name_en', 'address', 'phone', 'business_hours', 'lat', 'lng', 'image', 'description', 'status'];
      const updates = [];
      const values = [];

      for (const field of fields) {
        if (data[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(data[field]);
        }
      }

      if (updates.length === 0) {
        return { success: false, message: '没有可更新的字段' };
      }

      values.push(storeId);
      await db.query(`UPDATE stores SET ${updates.join(', ')} WHERE id = ?`, values);

      logger.info(`门店更新: ${storeId}`);
      return { success: true };
    } catch (error) {
      logger.error('更新门店失败:', error);
      throw error;
    }
  }

  async getNearbyStores(lat, lng, radius = 10) {
    try {
      const stores = await db.query(
        `SELECT *,
          (6371 * acos(cos(radians(?)) * cos(radians(lat))
           * cos(radians(lng) - radians(?)) + sin(radians(?))
           * sin(radians(lat)))) AS distance
         FROM stores
         WHERE status = 'active'
         HAVING distance <= ?
         ORDER BY distance ASC`
        , [lat, lng, lat, radius]
      );

      return { success: true, stores };
    } catch (error) {
      logger.error('获取附近门店失败:', error);
      throw error;
    }
  }

  async getStoreSettings(storeId) {
    try {
      const settings = await db.query('SELECT * FROM store_settings WHERE store_id = ?', [storeId]);
      if (settings.length === 0) {
        return { success: true, settings: {} };
      }

      const result = {};
      settings.forEach(s => {
        result[s.setting_key] = s.setting_value;
      });

      return { success: true, settings: result };
    } catch (error) {
      logger.error('获取门店设置失败:', error);
      throw error;
    }
  }

  async updateStoreSettings(storeId, settings) {
    try {
      await db.transaction(async (connection) => {
        for (const [key, value] of Object.entries(settings)) {
          await connection.query(
            `INSERT INTO store_settings (store_id, setting_key, setting_value)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE setting_value = ?`,
            [storeId, key, value, value]
          );
        }
      });

      logger.info(`门店设置更新: ${storeId}`);
      return { success: true };
    } catch (error) {
      logger.error('更新门店设置失败:', error);
      throw error;
    }
  }

  async getStoreStats(storeId, startDate, endDate) {
    try {
      const stats = await db.query(`
        SELECT
          COUNT(DISTINCT o.id) as total_orders,
          SUM(o.final_amount) as total_revenue,
          COUNT(DISTINCT o.user_id) as total_customers
        FROM orders o
        WHERE o.store_id = ?
          AND o.created_at BETWEEN ? AND ?
          AND o.payment_status = 'paid'
      `, [storeId, `${startDate} 00:00:00`, `${endDate} 23:59:59`]);

      const hourlyStats = await db.query(`
        SELECT HOUR(created_at) as hour, COUNT(*) as orders
        FROM orders
        WHERE store_id = ?
          AND DATE(created_at) = ?
        GROUP BY HOUR(created_at)
      `, [storeId, new Date().toISOString().split('T')[0]]);

      return {
        success: true,
        stats: stats[0],
        hourlyStats
      };
    } catch (error) {
      logger.error('获取门店统计失败:', error);
      throw error;
    }
  }

  async setDefaultStore(storeId) {
    try {
      await db.transaction(async (connection) => {
        await connection.query('UPDATE stores SET is_default = 0');
        await connection.query('UPDATE stores SET is_default = 1 WHERE id = ?', [storeId]);
      });

      logger.info(`设置默认门店: ${storeId}`);
      return { success: true };
    } catch (error) {
      logger.error('设置默认门店失败:', error);
      throw error;
    }
  }
}

module.exports = new StoreService();
