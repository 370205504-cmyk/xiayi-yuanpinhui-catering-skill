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

  async handleWechatCallback(req) {
    try {
      const body = req.body;
      const xmlData = typeof body === 'string' ? body : JSON.stringify(body);

      const { out_trade_no, transaction_id, trade_state, total, mch_id, sign } = body;

      const order = await db.query('SELECT * FROM orders WHERE order_no = ?', [out_trade_no]);

      if (order.length === 0) {
        logger.warn(`支付回调订单不存在: ${out_trade_no}`);
        return { success: false, message: '订单不存在' };
      }

      const orderInfo = order[0];

      const isSignValid = await this.verifyWechatPaySign(body, orderInfo);
      if (!isSignValid) {
        logger.error(`支付回调签名验证失败: ${out_trade_no}`);
        return { success: false, message: '签名验证失败' };
      }

      const expectedTotal = Math.round(orderInfo.final_amount * 100);
      if (total !== undefined && total !== expectedTotal) {
        logger.warn(`支付回调金额不匹配: ${out_trade_no}, 期望: ${expectedTotal}, 实际: ${total}`);
        return { success: false, message: '金额不匹配' };
      }

      if (mch_id && mch_id !== this.wechatConfig.mchid) {
        logger.error(`支付回调商户号不匹配: ${out_trade_no}`);
        return { success: false, message: '商户号不匹配' };
      }

      if (trade_state === 'SUCCESS') {
        await this.updatePaymentStatusWithLock(out_trade_no, transaction_id, body);
        return { success: true };
      }

      return { success: false, message: '支付未成功' };
    } catch (error) {
      logger.error('微信回调处理失败:', error);
      return { success: false, message: '处理失败' };
    }
  }

  async verifyWechatPaySign(data, order) {
    try {
      const obj = { ...data };
      const receivedSign = obj.sign;
      delete obj.sign;

      const sortedKeys = Object.keys(obj).sort();
      let signStr = sortedKeys.map(k => `${k}=${obj[k]}`).join('&');
      signStr += `&key=${this.wechatConfig.apikey}`;

      const calculatedSign = crypto.createHash('md5')
        .update(signStr, 'utf8')
        .digest('hex')
        .toUpperCase();

      return crypto.timingSafeEqual(
        Buffer.from(calculatedSign),
        Buffer.from(receivedSign || '')
      );
    } catch (error) {
      logger.error('签名验证异常:', error);
      return false;
    }
  }

  async updatePaymentStatusWithLock(orderNo, paymentNo, callbackData) {
    await db.transaction(async (connection) => {
      const [order] = await connection.query(
        'SELECT * FROM orders WHERE order_no = ? FOR UPDATE',
        [orderNo]
      );

      if (order[0].payment_status === 'paid') {
        logger.info(`订单已支付，幂等返回: ${orderNo}`);
        return;
      }

      await connection.query(
        'UPDATE orders SET payment_status = ?, payment_no = ?, status = ?, updated_at = NOW() WHERE order_no = ?',
        ['paid', paymentNo, 'confirmed', orderNo]
      );

      const { printerService } = require('../utils/printerService');
      try {
        await printerService.printOrder(order[0]);
      } catch (printError) {
        logger.error('打印失败，但订单已处理:', printError);
      }

      logger.info(`支付回调处理成功: ${orderNo}`);
    });
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
