const express = require('express');
const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');
const stockService = require('../services/stockService');
const memberService = require('../services/memberService');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/security');
const inputValidator = require('../services/inputValidator');

const router = express.Router();

router.post('/create',
  optionalAuth,
  [
    body('items').isArray({ min: 1 }),
    body('type').isIn(['dine_in', 'takeout', 'delivery']),
    body('tableNo').optional().isLength({ max: 20 }),
    body('guestCount').optional().isInt({ min: 1 })
  ],
  validate,
  async (req, res) => {
    try {
      const { items, type, tableNo, guestCount, remarks, address, contactPhone } = req.body;
      const userId = req.userId || null;

      if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: '购物车不能为空' });
      }

      if (req.body.totalAmount !== undefined || req.body.finalAmount !== undefined) {
        return res.status(400).json({ success: false, message: '非法请求参数' });
      }

      const orderNo = `ORD${Date.now()}${uuidv4().slice(0, 6).toUpperCase()}`;

      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        if (!item.dishId || !item.quantity) {
          return res.status(400).json({ success: false, message: '无效的菜品数据' });
        }
        if (item.price !== undefined) {
          return res.status(400).json({ success: false, message: '非法请求参数' });
        }

        const dishes = await db.query('SELECT * FROM dishes WHERE id = ? AND is_available = 1', [item.dishId]);
        if (dishes.length === 0) {
          return res.status(400).json({ success: false, message: `菜品不存在: ${item.dishId}` });
        }
        const dish = dishes[0];
        const quantity = parseInt(item.quantity);
        if (quantity <= 0 || quantity > 99) {
          return res.status(400).json({ success: false, message: '无效的数量' });
        }
        const subtotal = dish.price * quantity;
        totalAmount += subtotal;
        orderItems.push({
          dishId: dish.id,
          dishName: dish.name,
          quantity: quantity,
          unitPrice: dish.price,
          subtotal: subtotal,
          remarks: inputValidator ? inputValidator.validateOrderRemarks(item.remarks) : ''
        });
      }

      let discountAmount = 0;
      let couponId = null;
      if (req.body.couponId && userId) {
        const coupons = await db.query(
          `SELECT uc.*, c.value, c.min_amount, c.max_discount, c.type
           FROM user_coupons uc JOIN coupons c ON uc.coupon_id = c.id
           WHERE uc.id = ? AND uc.user_id = ? AND uc.status = 'unused'`,
          [req.body.couponId, userId]
        );
        if (coupons.length > 0) {
          const coupon = coupons[0];
          if (totalAmount >= coupon.min_amount) {
            couponId = coupon.id;
            if (coupon.type === 'discount') {
              discountAmount = Math.min(totalAmount * coupon.value / 100, coupon.max_discount || totalAmount);
            } else {
              discountAmount = coupon.value;
            }
          }
        }
      }

      const finalAmount = Math.max(0, totalAmount - discountAmount);
      const pointsEarned = Math.floor(finalAmount);

      await db.transaction(async (connection) => {
        const [orderResult] = await connection.query(
          `INSERT INTO orders (order_no, user_id, type, total_amount, discount_amount, final_amount,
            points_earned, coupon_id, table_no, guest_count, remarks, address, contact_phone)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderNo, userId, type, totalAmount, discountAmount, finalAmount, pointsEarned,
           couponId, tableNo, guestCount || 1, remarks, address, contactPhone]
        );

        for (const item of orderItems) {
          await connection.query(
            `INSERT INTO order_items (order_id, dish_id, dish_name, quantity, unit_price, subtotal, remarks)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [orderResult.insertId, item.dishId, item.dishName, item.quantity, item.unitPrice, item.subtotal, item.remarks]
          );
        }

        if (couponId) {
          await connection.query('UPDATE user_coupons SET status = ? WHERE id = ?', ['used', couponId]);
        }
      });

      logger.info(`订单创建: ${orderNo}, 金额: ${finalAmount}`);
      res.json({
        success: true,
        order: { orderNo, totalAmount, discountAmount, finalAmount, pointsEarned }
      });
    } catch (error) {
      logger.error('订单创建失败:', error);
      res.status(500).json({ success: false, message: '订单创建失败' });
    }
  }
);

router.get('/list',
  requireAuth,
  async (req, res) => {
    try {
      const { status, page = 1, pageSize = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(pageSize);

      let sql = 'SELECT * FROM orders WHERE user_id = ?';
      const params = [req.userId];

      if (status) {
        sql += ' AND status = ?';
        params.push(status);
      }

      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(pageSize), offset);

      const orders = await db.query(sql, params);

      for (const order of orders) {
        const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        order.items = items;
      }

      res.json({ success: true, orders });
    } catch (error) {
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

router.get('/:orderNo',
  optionalAuth,
  async (req, res) => {
    try {
      const orders = await db.query('SELECT * FROM orders WHERE order_no = ?', [req.params.orderNo]);
      if (orders.length === 0) {
        return res.status(404).json({ success: false, message: '订单不存在' });
      }

      const order = orders[0];
      const items = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = items;

      res.json({ success: true, order });
    } catch (error) {
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

router.put('/:orderNo/cancel',
  requireAuth,
  async (req, res) => {
    try {
      const orders = await db.query('SELECT * FROM orders WHERE order_no = ? AND user_id = ?', [req.params.orderNo, req.userId]);
      if (orders.length === 0) {
        return res.status(404).json({ success: false, message: '订单不存在' });
      }

      const order = orders[0];
      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({ success: false, message: '订单无法取消' });
      }

      await db.transaction(async (connection) => {
        await connection.query('UPDATE orders SET status = ? WHERE order_no = ?', ['cancelled', req.params.orderNo]);

        const items = await connection.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        for (const item of items) {
          await connection.query('UPDATE dishes SET stock = stock + ? WHERE id = ?', [item.quantity, item.dish_id]);
        }
      });

      res.json({ success: true, message: '订单已取消' });
    } catch (error) {
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

module.exports = router;
