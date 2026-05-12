const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('../database/db');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.File({ filename: 'logs/payment.log' })]
});

const WECHAT_PAY_IPS = [
  '101.226.103.0/24',
  '101.226.62.0/24',
  '101.226.249.0/24',
  '103.235.46.0/24',
  '103.41.164.0/24',
  '106.53.113.0/24',
  '119.28.182.0/24',
  '119.29.141.0/24',
  '120.232.145.0/24',
  '140.207.60.0/24',
  '180.101.52.0/24',
  '180.101.54.0/24',
  '183.3.232.0/24',
  '183.3.235.0/24',
  '192.168.0.0/16',
  '172.16.0.0/12',
  '10.0.0.0/8'
];

class PaymentService {
  constructor() {
    this.wechatConfig = {
      appid: process.env.WECHAT_APPID,
      mchid: process.env.WECHAT_MCHID,
      apikey: process.env.WECHAT_APIKEY,
      notifyUrl: process.env.WECHAT_NOTIFY_URL,
      certPath: process.env.WECHAT_CERT_PATH,
      keyPath: process.env.WECHAT_KEY_PATH
    };
    this.alipayConfig = {
      appid: process.env.ALIPAY_APPID,
      privateKey: process.env.ALIPAY_PRIVATE_KEY,
      publicKey: process.env.ALIPAY_PUBLIC_KEY,
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

      const authToken = await this.getWechatAuthToken();

      const { data } = await axios.post('https://api.mch.weixin.qq.com/v3/pay/transactions/native', params, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `WECHATPAY2-SHA256-RSA2048 ${authToken}`
        }
      });

      logger.info(`微信支付创建成功: ${order.orderNo}`);
      return { success: true, codeUrl: data.code_url, tradeNo: data.transaction_id };
    } catch (error) {
      logger.error('微信支付创建失败:', error.response?.data || error.message);
      return { success: false, message: '支付创建失败' };
    }
  }

  async getWechatAuthToken() {
    const privateKey = fs.readFileSync(this.wechatConfig.keyPath, 'utf8');
    const nonceStr = crypto.randomBytes(16).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const url = '/v3/pay/transactions/native';
    
    const signStr = `${timestamp}\n${nonceStr}\nPOST\n${url}\n\n`;
    const sign = crypto.createSign('RSA-SHA256')
      .update(signStr)
      .sign(privateKey, 'base64');

    return `mchid="${this.wechatConfig.mchid}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${this.getCertificateSerial()}",signature="${sign}"`;
  }

  getCertificateSerial() {
    return process.env.WECHAT_CERT_SERIAL || '';
  }

  async createAlipayOrder(order) {
    try {
      const bizContent = {
        out_trade_no: order.orderNo,
        total_amount: order.finalAmount.toString(),
        subject: `夏邑缘品荟订单-${order.orderNo}`,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        notify_url: this.alipayConfig.notifyUrl
      };

      const params = this.buildAlipayParams(bizContent);
      const sign = this.signAlipayParams(params);
      params.sign = sign;

      logger.info(`支付宝支付创建成功: ${order.orderNo}`);
      return { success: true, tradeNo: order.orderNo, params };
    } catch (error) {
      logger.error('支付宝支付创建失败:', error);
      return { success: false, message: '支付创建失败' };
    }
  }

  buildAlipayParams(bizContent) {
    return {
      app_id: this.alipayConfig.appid,
      method: 'alipay.trade.create',
      format: 'JSON',
      charset: 'UTF-8',
      sign_type: 'RSA2',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      version: '1.0',
      biz_content: JSON.stringify(bizContent)
    };
  }

  signAlipayParams(params) {
    const sortedKeys = Object.keys(params).sort();
    const signStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
    return crypto.createSign('RSA-SHA256')
      .update(signStr, 'utf8')
      .sign(this.alipayConfig.privateKey, 'base64');
  }

  async handleWechatCallback(req, ip) {
    try {
      if (!this.validateWechatCallbackIP(ip)) {
        logger.error(`微信回调IP不在白名单: ${ip}`);
        return { success: false, message: 'IP验证失败' };
      }

      const body = req.body;
      
      if (!body || typeof body !== 'object') {
        logger.error('微信回调请求体为空或格式错误');
        return { success: false, message: '请求体格式错误' };
      }

      const { out_trade_no, transaction_id, trade_state, amount, mchid } = body;

      if (!out_trade_no) {
        logger.error('微信回调缺少订单号');
        return { success: false, message: '缺少订单号' };
      }

      const order = await db.query('SELECT * FROM orders WHERE order_no = ?', [out_trade_no]);

      if (order.length === 0) {
        logger.warn(`支付回调订单不存在: ${out_trade_no}`);
        return { success: false, message: '订单不存在' };
      }

      const orderInfo = order[0];

      if (!await this.verifyWechatV3Signature(req)) {
        logger.error(`支付回调签名验证失败: ${out_trade_no}`);
        return { success: false, message: '签名验证失败' };
      }

      const expectedTotal = Math.round(orderInfo.final_amount * 100);
      const actualTotal = amount?.total || amount;
      
      if (actualTotal !== undefined && actualTotal !== expectedTotal) {
        logger.warn(`支付回调金额不匹配: ${out_trade_no}, 期望: ${expectedTotal}, 实际: ${actualTotal}`);
        return { success: false, message: '金额不匹配' };
      }

      if (mchid && mchid !== this.wechatConfig.mchid) {
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

  validateWechatCallbackIP(ip) {
    if (!ip) return false;
    
    const ipParts = ip.split('.').map(Number);
    
    for (const ipRange of WECHAT_PAY_IPS) {
      const [rangeIp, prefix] = ipRange.split('/');
      const rangeParts = rangeIp.split('.').map(Number);
      const mask = 0xFFFFFFFF << (32 - parseInt(prefix));
      
      const ipInt = (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];
      const rangeInt = (rangeParts[0] << 24) | (rangeParts[1] << 16) | (rangeParts[2] << 8) | rangeParts[3];
      
      if ((ipInt & mask) === (rangeInt & mask)) {
        return true;
      }
    }
    
    return process.env.NODE_ENV !== 'production';
  }

  async verifyWechatV3Signature(req) {
    const signature = req.headers['wechatpay-signature'];
    const timestamp = req.headers['wechatpay-timestamp'];
    const nonce = req.headers['wechatpay-nonce'];
    const serial = req.headers['wechatpay-serial'];

    if (!signature || !timestamp || !nonce || !serial) {
      logger.warn('微信回调缺少签名参数');
      return false;
    }

    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const signStr = `${timestamp}\n${nonce}\n${body}\n`;

    try {
      const certificate = await this.getWechatCertificate(serial);
      if (!certificate) {
        return false;
      }

      return crypto.verify(
        'RSA-SHA256',
        Buffer.from(signStr),
        certificate,
        Buffer.from(signature, 'base64')
      );
    } catch (error) {
      logger.error('微信签名验证异常:', error);
      return false;
    }
  }

  async getWechatCertificate(serial) {
    if (!this.wechatConfig.certPath) {
      logger.warn('未配置微信证书路径');
      return null;
    }
    
    try {
      const cert = fs.readFileSync(this.wechatConfig.certPath, 'utf8');
      const certMatch = cert.match(/-+BEGIN CERTIFICATE-+([\s\S]*)-+END CERTIFICATE-+/);
      if (certMatch) {
        return crypto.createPublicKey({
          key: certMatch[1],
          format: 'pem',
          type: 'spki'
        });
      }
    } catch (error) {
      logger.error('读取微信证书失败:', error);
    }
    
    return null;
  }

  async handleAlipayCallback(req) {
    try {
      const sign = req.body.sign;
      const signType = req.body.sign_type || 'RSA2';
      
      const params = { ...req.body };
      delete params.sign;
      delete params.sign_type;

      const sortedKeys = Object.keys(params).sort();
      const signStr = sortedKeys.map(k => `${k}=${params[k]}`).join('&');

      const isValid = crypto.verify(
        signType === 'RSA2' ? 'RSA-SHA256' : 'RSA-SHA1',
        Buffer.from(signStr, 'utf8'),
        this.alipayConfig.publicKey,
        Buffer.from(sign, 'base64')
      );

      if (!isValid) {
        logger.error('支付宝回调签名验证失败');
        return { success: false, message: '签名验证失败' };
      }

      const { out_trade_no, trade_status, total_amount } = req.body;

      const order = await db.query('SELECT * FROM orders WHERE order_no = ?', [out_trade_no]);
      if (order.length === 0) {
        return { success: false, message: '订单不存在' };
      }

      const orderInfo = order[0];
      if (parseFloat(total_amount) !== orderInfo.final_amount) {
        return { success: false, message: '金额不匹配' };
      }

      if (trade_status === 'TRADE_SUCCESS' || trade_status === 'TRADE_FINISHED') {
        await this.updatePaymentStatusWithLock(out_trade_no, req.body.trade_no, req.body);
        return { success: true };
      }

      return { success: false, message: '支付未成功' };
    } catch (error) {
      logger.error('支付宝回调处理失败:', error);
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
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const [order] = await connection.query(
        'SELECT * FROM orders WHERE order_no = ? FOR UPDATE',
        [orderNo]
      );

      if (!order[0]) {
        logger.error(`订单不存在: ${orderNo}`);
        await connection.rollback();
        return;
      }

      if (order[0].payment_status === 'paid') {
        logger.info(`订单已支付，幂等返回: ${orderNo}`);
        await connection.commit();
        return;
      }

      await connection.query(
        'UPDATE orders SET payment_status = ?, payment_no = ?, status = ?, updated_at = NOW() WHERE order_no = ?',
        ['paid', paymentNo, 'confirmed', orderNo]
      );

      const [orderItems] = await connection.query(
        'SELECT * FROM order_items WHERE order_id = ?',
        [order[0].id]
      );

      for (const item of orderItems) {
        await connection.query(
          'UPDATE dishes SET stock = stock - ? WHERE id = ? AND stock >= ?',
          [item.quantity, item.dish_id, item.quantity]
        );
      }

      const { printerService } = require('../utils/printerService');
      try {
        await printerService.printOrder(order[0]);
      } catch (printError) {
        logger.error('打印失败，但订单已处理:', printError);
      }

      await connection.commit();
      logger.info(`支付回调处理成功: ${orderNo}`);
    } catch (error) {
      await connection.rollback();
      logger.error('更新支付状态失败:', error);
      throw error;
    } finally {
      connection.release();
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

      const order = orders[0];
      if (order.payment_status !== 'paid') {
        return { success: false, message: '订单未支付，无法退款' };
      }

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        await connection.query(
          'UPDATE orders SET payment_status = ? WHERE order_no = ?',
          ['refunded', orderNo]
        );

        await connection.query(
          'INSERT INTO refund_log (order_id, amount, reason, status, created_at) VALUES (?, ?, ?, ?, NOW())',
          [order.id, amount, reason, 'pending']
        );

        await connection.query(
          'UPDATE dishes d JOIN order_items oi ON d.id = oi.dish_id SET d.stock = d.stock + oi.quantity WHERE oi.order_id = ?',
          [order.id]
        );

        await connection.commit();
        logger.info(`退款申请: ${orderNo}, 金额: ${amount}`);
        return { success: true, message: '退款申请已提交' };
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      logger.error('退款失败:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();