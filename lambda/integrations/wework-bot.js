/**
 * 企业微信机器人对接 - 扣子平台集成
 */

const MCPHandler = require('../mcp/handler');
const AIAgent = require('../services/ai-agent');
const ContextManager = require('../mcp/context');

class WeWorkBot {
  constructor() {
    this.handler = new MCPHandler();
    this.agent = new AIAgent();
    this.context = new ContextManager();
    this.subscribers = new Set(); // 订单状态订阅用户
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
    
    // 语音消息处理（简化版）
    if (message.type === 'voice') {
      // 这里应该调用语音转文字API
      message.text = this.simulateVoiceToText(message);
    }
    
    const result = await this.handler.handleMessage(sessionId, customerId, message.text || message);
    
    // 如果订单成功，订阅状态推送
    if (result.type === 'order_confirmed') {
      this.subscribers.add(userId);
    }
    
    return this.formatWeWorkMessage(result);
  }

  /**
   * 模拟语音转文字
   */
  simulateVoiceToText(voiceMessage) {
    // 实际项目这里应该调用真实的语音识别API
    return '宫保鸡丁一份';
  }

  /**
   * 推送订单状态
   */
  async pushOrderStatus(userId, orderNo, status) {
    const statusMessage = this.agent.getOrderStatusUpdate(status);
    return {
      type: 'text',
      content: `订单 ${orderNo} 更新：${statusMessage}`
    };
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
   * 处理扣子平台的回调
   */
  async handleKouZiCallback(callbackData) {
    const { type, userId, message } = callbackData;
    
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
}

module.exports = WeWorkBot;
