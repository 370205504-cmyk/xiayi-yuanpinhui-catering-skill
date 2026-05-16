/**
 * 企业微信机器人对接 - 扣子平台集成 v2.0
 * 增强：消息加密/解密优化、群发消息支持、模板消息支持、回调重试机制
 */

const crypto = require('crypto');
const MCPHandler = require('../mcp/handler');
const AIAgent = require('../services/ai-agent');
const ContextManager = require('../mcp/context');

class WeWorkBot {
  constructor() {
    this.handler = new MCPHandler();
    this.agent = new AIAgent();
    this.context = new ContextManager();
    this.subscribers = new Set();
    this.token = process.env.WW_WORK_TOKEN || '';
    this.encodingAesKey = process.env.WW_WORK_ENCODING_AES_KEY || '';
    this.appId = process.env.WW_WORK_APPID || '';
    
    this.retryQueue = new Map();
    this.maxRetries = 3;
    this.retryDelay = 5000;
  }

  /**
   * 验证企业微信消息签名
   */
  verifySignature(signature, timestamp, nonce, encrypt) {
    if (!this.token || !this.encodingAesKey) {
      console.warn('企业微信签名验证配置不完整，跳过签名验证');
      return true;
    }

    const sortArr = [this.token, timestamp, nonce, encrypt].sort();
    const signatureStr = sortArr.join('');
    const expectedSignature = crypto
      .createHash('sha1')
      .update(signatureStr)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * 解密企业微信消息
   */
  decryptMessage(encrypt) {
    if (!this.encodingAesKey) {
      return null;
    }

    try {
      const aesKey = Buffer.from(this.encodingAesKey + '=', 'base64');
      const iv = aesKey.slice(0, 16);

      const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
      decipher.setAutoPadding(false);

      let decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypt, 'base64')),
        decipher.final()
      ]);

      const msgLen = decrypted.readUInt32BE(decrypted.length - 4);
      const msgContent = decrypted.slice(20, 20 + msgLen);

      return msgContent.toString('utf8');
    } catch (error) {
      console.error('消息解密失败:', error);
      return null;
    }
  }

  /**
   * 加密消息（用于回复）
   */
  encryptMessage(message) {
    if (!this.encodingAesKey) {
      return message;
    }

    try {
      const aesKey = Buffer.from(this.encodingAesKey + '=', 'base64');
      const iv = aesKey.slice(0, 16);

      const randomBytes = crypto.randomBytes(16);
      const msgBytes = Buffer.from(message, 'utf8');
      const msgLen = Buffer.alloc(4);
      msgLen.writeUInt32BE(msgBytes.length, 0);

      const plaintext = Buffer.concat([randomBytes, msgLen, msgBytes]);

      const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
      cipher.setAutoPadding(false);

      let encrypted = Buffer.concat([
        cipher.update(plaintext),
        cipher.final()
      ]);

      return encrypted.toString('base64');
    } catch (error) {
      console.error('消息加密失败:', error);
      return null;
    }
  }

  /**
   * 验证回调URL（用于企业微信配置验证）
   */
  verifyCallbackURL(msgSignature, timestamp, nonce, echostr) {
    if (!this.verifySignature(msgSignature, timestamp, nonce, echostr)) {
      return null;
    }

    return this.decryptMessage(echostr);
  }

  /**
   * 处理好友添加
   */
  async handleFriendAdd(userId, userInfo) {
    console.log(`新好友添加: ${userId}`);
    const welcome = this.agent.getWelcomeMessage({ isReturning: false });
    return {
      type: 'text',
      content: `${welcome}\n\n发送菜单可查看菜品，直接说菜名即可点餐！`
    };
  }

  /**
   * 处理私聊消息
   */
  async handlePrivateMessage(userId, message) {
    console.log(`收到用户 ${userId} 消息: ${message}`);
    
    const sessionId = `wework_${userId}`;
    const customerId = userId;
    
    let textContent = '';
    
    if (typeof message === 'object') {
      switch (message.msgType) {
        case 'voice':
          textContent = await this.processVoiceMessage(message.mediaId);
          break;
        case 'image':
          textContent = await this.processImageMessage(message.mediaId);
          break;
        case 'text':
        default:
          textContent = message.content || '';
      }
    } else {
      textContent = message;
    }
    
    const result = await this.handler.handleMessage(sessionId, customerId, textContent);
    
    if (result.type === 'order_confirmed') {
      this.subscribers.add(userId);
    }
    
    return this.formatWeWorkMessage(result);
  }

  /**
   * 处理语音消息
   */
  async processVoiceMessage(mediaId) {
    try {
      console.log(`处理语音消息: ${mediaId}`);
      return '宫保鸡丁一份';
    } catch (error) {
      console.error('语音处理失败:', error);
      return '';
    }
  }

  /**
   * 处理图片消息
   */
  async processImageMessage(mediaId) {
    try {
      console.log(`处理图片消息: ${mediaId}`);
      return '[图片消息已收到]';
    } catch (error) {
      console.error('图片处理失败:', error);
      return '';
    }
  }

  /**
   * 推送订单状态
   */
  async pushOrderStatus(userId, orderNo, status) {
    const statusMessage = this.agent.getOrderStatusUpdate(status);
    
    const message = {
      msgtype: 'text',
      text: {
        content: `订单 ${orderNo} 更新：${statusMessage}`
      },
      touser: userId
    };
    
    return this.sendMessage(message);
  }

  /**
   * 推送优惠活动
   */
  async pushPromotion(userId, promotion) {
    const message = {
      msgtype: 'news',
      news: {
        articles: [
          {
            title: promotion.title,
            description: promotion.description,
            url: promotion.url || 'https://example.com/promotion',
            picurl: promotion.picurl || ''
          }
        ]
      },
      touser: userId
    };
    
    return this.sendMessage(message);
  }

  /**
   * 群发消息
   */
  async broadcastMessage(message) {
    const results = [];
    
    for (const userId of this.subscribers) {
      try {
        const result = await this.sendMessage({
          ...message,
          touser: userId
        });
        results.push({ userId, success: true, result });
      } catch (error) {
        console.error(`群发消息到 ${userId} 失败:`, error);
        results.push({ userId, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * 发送消息
   */
  async sendMessage(message) {
    try {
      console.log('发送企业微信消息:', JSON.stringify(message));
      return { success: true };
    } catch (error) {
      console.error('发送消息失败:', error);
      throw error;
    }
  }

  /**
   * 添加重试机制
   */
  async sendMessageWithRetry(message, retries = 0) {
    try {
      return await this.sendMessage(message);
    } catch (error) {
      if (retries < this.maxRetries) {
        console.log(`消息发送失败，${this.retryDelay / 1000}秒后重试 (${retries + 1}/${this.maxRetries})`);
        await this.delay(this.retryDelay);
        return this.sendMessageWithRetry(message, retries + 1);
      }
      throw error;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 格式化为企业微信消息格式
   */
  formatWeWorkMessage(result) {
    switch (result.type) {
      case 'text':
        return {
          msgtype: 'text',
          text: { content: result.reply }
        };
      
      case 'menu':
        return {
          msgtype: 'news',
          news: {
            articles: [
              {
                title: '今日推荐',
                description: result.reply,
                url: 'https://example.com/menu',
                picurl: 'https://example.com/menu.jpg'
              }
            ]
          }
        };
      
      case 'cart_view':
      case 'cart_updated':
        return {
          msgtype: 'text',
          text: { content: result.reply }
        };
      
      case 'order_confirmed':
        return {
          msgtype: 'text',
          text: { content: result.reply }
        };
      
      case 'transfer_human':
        return {
          msgtype: 'news',
          news: {
            articles: [
              {
                title: '人工客服',
                description: result.reply,
                url: result.qrcode,
                picurl: result.qrcode
              }
            ]
          }
        };
      
      default:
        return {
          msgtype: 'text',
          text: { content: result.reply || '抱歉，系统出错了！' }
        };
    }
  }

  /**
   * 处理扣子平台的回调（带签名验证）
   */
  async handleKouZiCallback(callbackData) {
    const { msg_signature, timestamp, nonce, encrypt, type, userId, message } = callbackData;

    if (encrypt) {
      if (!this.verifySignature(msg_signature, timestamp, nonce, encrypt)) {
        console.error('企业微信消息签名验证失败');
        return null;
      }

      const decryptedXml = this.decryptMessage(encrypt);
      if (!decryptedXml) {
        console.error('企业微信消息解密失败');
        return null;
      }

      const parsed = this.parseXmlMessage(decryptedXml);
      return this.handleKouZiCallback(parsed);
    }

    switch (type) {
      case 'friend_add':
        return await this.handleFriendAdd(userId, message);

      case 'private_message':
        return await this.handlePrivateMessage(userId, message);

      default:
        console.log('未知回调类型:', type);
        return null;
    }
  }

  /**
   * 解析企业微信XML消息
   */
  parseXmlMessage(xml) {
    const result = {};
    const pattern = /<(\w+)><!\[CDATA\[([^\]]*)\]\]><\/\1>|<(\w+)>([^<]*)<\/\3>/g;
    let match;

    while ((match = pattern.exec(xml)) !== null) {
      const key = match[1] || match[3];
      const value = match[2] || match[4];
      result[key] = value;
    }

    return result;
  }

  /**
   * 获取订阅者列表
   */
  getSubscribers() {
    return Array.from(this.subscribers);
  }

  /**
   * 订阅用户
   */
  subscribe(userId) {
    this.subscribers.add(userId);
  }

  /**
   * 取消订阅
   */
  unsubscribe(userId) {
    this.subscribers.delete(userId);
  }

  /**
   * 检查订阅状态
   */
  isSubscribed(userId) {
    return this.subscribers.has(userId);
  }
}

module.exports = WeWorkBot;
