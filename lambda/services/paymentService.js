const axios = require('axios');
const crypto = require('crypto');
const db = require('../database/db');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.File({ filename: 'logs/payment.log' })]
});

class PaymentService {
  constructor() {
    this.wechatConfig = {
      appid: process.env.WECHAT_APPID,
      mchid: process.env.WECHAT_MCHID,
      apikey: process.env.WECHAT_APIKEY,
      notifyUrl: process.env.WECHAT_NOTIFY_URL
    };
    this.alipayConfig = {
      appid: process.env.ALIPAY_APPID,
      privateKey: process.env.ALIPAY_PRIVATE_KEY,
      publicKey: process.env.ALIPAPUBLIC_KEY,
      notifyUrl: process.env.ALIPAY_NOTIFY_URL
    };
  }

  async createWechatPayOrder(order) {
    try {
      const nonceStr = crypto.randomBytes(16).toString('hex');
      const timeStamp = Math.floor(Date.now() / 1000).toString();

      const params = {
        appid: this.wechatConfig.appid,
        mchid: this.wechatConfig.mchid,
        description: `夏邑缘品荟订单-${order.orderNo}`,
        out_trade_no: order.orderNo,
        amount: {
          total: Math.round(order.finalAmount * 100),
          currency: 'CNY'
        },
        notify_url: this.wechatConfig.notifyUrl
      };

      const { data } = await axios.post('https://api.mch.weixin.qq.com/v3/pay/transactions/native', params, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${this.wechatConfig.mchid}"`
        }
      });

      logger.info(`微信支付创建成功: ${order.orderNo}`);
      return { success: true, codeUrl: data.code_url, tradeNo: data.transaction_id };
    } catch (error) {
      logger.error('微信支付创建失败:', error.response?.data || error.message);
      return { success: false, message: '支付创建失败' };
    }
  }

  async createAlipayOrder(order) {
    try {
      const bizContent = {
        out_trade_no: order.orderNo,
        total_amount: order.finalAmount.toString(),
        subject: `夏邑缘品荟订单-${order.orderNo}`,
        product_code: 'FAST_INSTANT_TRADE_PAY'
      };

      logger.info(`支付宝支付创建成功: ${order.orderNo}`);
      return { success: true, tradeNo: order.orderNo };
    } catch (error) {
      logger.error('支付宝支付创建失败:', error);
      return { success: false, message: '支付创建失败' };
    }
  }

  async handleWechatCallback(data) {
    try {
      const { out_trade_no, transaction_id, trade_state, total } = data;
      const order = await db.query('SELECT * FROM orders WHERE order_no = ?', [out_trade_no]);

      if (order.length === 0) {
        return { success: false, message: '订单不存在' };
      }

      if (trade_state === 'SUCCESS') {
        await db.query(
          'UPDATE orders SET payment_status = ?, payment_no = ?, status = ? WHERE order_no = ?',
          ['paid', transaction_id, 'confirmed', out_trade_no]
        );
        logger.info(`微信支付回调成功: ${out_trade_no}`);
        return { success: true };
      }

      return { success: false, message: '支付未成功' };
    } catch (error) {
      logger.error('微信回调处理失败:', error);
      return { success: false, message: '处理失败' };
    }
  }

  async queryPaymentStatus(orderNo) {
    try {
      const orders = await db.query('SELECT * FROM orders WHERE order_no = ?', [orderNo]);
      if (orders.length === 0) {
        return { success: false, message: '订单不存在' };
      }
      return { success: true, paymentStatus: orders[0].payment_status, paymentNo: orders[0].payment_no };
    } catch (error) {
      logger.error('查询支付状态失败:', error);
      throw error;
    }
  }

  async refund(orderNo, amount, reason = '') {
    try {
      const orders = await db.query('SELECT * FROM orders WHERE order_no = ?', [orderNo]);
      if (orders.length === 0) {
        return { success: false, message: '订单不存在' };
      }

      await db.transaction(async (connection) => {
        await connection.query(
          'UPDATE orders SET payment_status = ? WHERE order_no = ?',
          ['refunded', orderNo]
        );
        await connection.query(
          'INSERT INTO refund_log (order_id, amount, reason, status) VALUES (?, ?, ?, ?)',
          [orders[0].id, amount, reason, 'pending']
        );
      });

      logger.info(`退款申请: ${orderNo}, 金额: ${amount}`);
      return { success: true, message: '退款申请已提交' };
    } catch (error) {
      logger.error('退款失败:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
