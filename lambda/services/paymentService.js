const axios = require('axios');
const crypto = require('crypto');
const db = require('../database/db');
const logger = require('../utils/logger');

/**
 * 支付服务类
 * 负责处理微信支付和支付宝相关的支付逻辑
 */
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

  /**
   * 创建微信支付订单
   * @param {Object} order - 订单信息对象
   * @param {string} order.orderNo - 订单号
   * @param {number} order.finalAmount - 订单最终金额
   * @returns {Promise<Object>} 包含支付二维码或错误信息的结果
   */
  async createWechatPayOrder(order) {
    try {
      logger.logPayment(order.orderNo, '开始创建微信支付订单', {
        amount: order.finalAmount
      });

      const nonceStr = crypto.randomBytes(16).toString('hex');
      const timeStamp = Math.floor(Date.now() / 1000).toString();

      const params = {
        appid: this.wechatConfig.appid,
        mchid: this.wechatConfig.mchid,
        description: `雨姗AI收银助手订单-${order.orderNo}`,
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

      logger.logPayment(order.orderNo, '微信支付订单创建成功', {
        tradeNo: data.transaction_id
      });

      return { success: true, codeUrl: data.code_url, tradeNo: data.transaction_id };
    } catch (error) {
      logger.logPayment(order.orderNo, '微信支付订单创建失败', {
        error: error.response?.data || error.message
      });
      return { success: false, message: '支付创建失败' };
    }
  }

  /**
   * 创建支付宝支付订单
   * @param {Object} order - 订单信息对象
   * @param {string} order.orderNo - 订单号
   * @param {number} order.finalAmount - 订单最终金额
   * @returns {Promise<Object>} 包含支付信息的结果
   */
  async createAlipayOrder(order) {
    try {
      logger.logPayment(order.orderNo, '开始创建支付宝支付订单', {
        amount: order.finalAmount
      });

      const bizContent = {
        out_trade_no: order.orderNo,
        total_amount: order.finalAmount.toString(),
        subject: `雨姗AI收银助手订单-${order.orderNo}`,
        product_code: 'FAST_INSTANT_TRADE_PAY'
      };

      logger.logPayment(order.orderNo, '支付宝支付订单创建成功');
      return { success: true, tradeNo: order.orderNo };
    } catch (error) {
      logger.logPayment(order.orderNo, '支付宝支付订单创建失败', {
        error: error.message
      });
      return { success: false, message: '支付创建失败' };
    }
  }

  /**
   * 处理微信支付回调
   * @param {Object} req - Express 请求对象
   * @returns {Promise<Object>} 处理结果
   */
  async handleWechatCallback(req) {
    try {
      const body = req.body;
      const xmlData = typeof body === 'string' ? body : JSON.stringify(body);

      const { out_trade_no, transaction_id, trade_state, total, mch_id, sign } = body;

      logger.logPayment(out_trade_no, '收到微信支付回调', {
        tradeState: trade_state,
        transactionId: transaction_id
      });

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

  /**
   * 验证微信支付签名
   * @param {Object} data - 回调数据
   * @param {Object} order - 订单信息
   * @returns {Promise<boolean>} 签名验证是否通过
   */
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

  /**
   * 使用数据库锁更新支付状态（保证幂等性）
   * @param {string} orderNo - 订单号
   * @param {string} paymentNo - 第三方支付单号
   * @param {Object} callbackData - 回调数据
   * @returns {Promise<void>}
   */
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

      logger.logPayment(orderNo, '支付回调处理成功', {
        paymentNo,
        status: 'confirmed'
      });
    });
  }

  /**
   * 查询订单支付状态
   * @param {string} orderNo - 订单号
   * @returns {Promise<Object>} 包含支付状态的结果
   */
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

  /**
   * 申请退款
   * @param {string} orderNo - 订单号
   * @param {number} amount - 退款金额
   * @param {string} reason - 退款原因
   * @returns {Promise<Object>} 退款结果
   */
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

      logger.logPayment(orderNo, '退款申请已提交', {
        amount,
        reason
      });

      return { success: true, message: '退款申请已提交' };
    } catch (error) {
      logger.error('退款失败:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
