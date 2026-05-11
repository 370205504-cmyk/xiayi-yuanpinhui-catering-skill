const express = require('express');
const { body } = require('express-validator');
const paymentService = require('../services/paymentService');
const { requireAuth } = require('../middleware/auth');
const { paymentLimiter, validate } = require('../middleware/security');

const router = express.Router();

router.post('/create',
  requireAuth,
  paymentLimiter,
  [
    body('orderNo').notEmpty(),
    body('method').isIn(['wechat', 'alipay']),
    body('finalAmount').isFloat({ min: 0.01 })
  ],
  validate,
  async (req, res) => {
    try {
      const { orderNo, method, finalAmount } = req.body;
      const order = { orderNo, finalAmount };

      let result;
      if (method === 'wechat') {
        result = await paymentService.createWechatPayOrder(order);
      } else if (method === 'alipay') {
        result = await paymentService.createAlipayOrder(order);
      }

      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

router.post('/wechat/callback',
  async (req, res) => {
    try {
      const result = await paymentService.handleWechatCallback(req.body);
      if (result.success) {
        res.status(200).json({ code: 'SUCCESS', message: '成功' });
      } else {
        res.status(400).json({ code: 'FAIL', message: result.message });
      }
    } catch (error) {
      res.status(500).json({ code: 'FAIL', message: '处理失败' });
    }
  }
);

router.get('/status/:orderNo',
  requireAuth,
  async (req, res) => {
    try {
      const { orderNo } = req.params;
      const result = await paymentService.queryPaymentStatus(orderNo);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

router.post('/refund',
  requireAuth,
  [
    body('orderNo').notEmpty(),
    body('amount').isFloat({ min: 0.01 }),
    body('reason').optional().isLength({ max: 255 })
  ],
  validate,
  async (req, res) => {
    try {
      const { orderNo, amount, reason } = req.body;
      const result = await paymentService.refund(orderNo, amount, reason);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, message: '服务器错误' });
    }
  }
);

module.exports = router;
