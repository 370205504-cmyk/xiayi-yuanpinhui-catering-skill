/**
 * MCP处理器 - 自然语义理解升级 + 自动转人工机制
 */

const MCPTools = require('./tools');
const ContextManager = require('./context');

class MCPHandler {
  constructor() {
    this.tools = new MCPTools();
    this.context = new ContextManager();
    this.intents = [
      {
        name: 'ORDER_DISH',
        patterns: ['来个', '我要', '给我来', '点一份', '再加一份', '再来一个'],
        keywords: ['份', '个', '盘', '碗']
      },
      {
        name: 'REMOVE_FROM_CART',
        patterns: ['不要了', '退掉', '取消', '去掉'],
        keywords: ['不要', '取消', '退']
      },
      {
        name: 'VIEW_CART',
        patterns: ['看看购物车', '我的订单', '点了什么'],
        keywords: ['购物车', '订单']
      },
      {
        name: 'MODIFY_ORDER',
        patterns: ['不要香菜', '少辣', '加辣', '微辣', '不要葱'],
        keywords: ['不要', '少', '多', '加', '辣', '香菜', '葱']
      },
      {
        name: 'CONFIRM_ORDER',
        patterns: ['好的', '可以', '就这样', '下单', '提交'],
        keywords: ['下单', '提交', '确认']
      },
      {
        name: 'ASK_QUESTION',
        patterns: ['问一下', '请问', '怎么', '什么'],
        keywords: ['?', '？', '怎么', '什么', '为什么']
      },
      {
        name: 'QUERY_MENU',
        patterns: ['有什么', '推荐', '菜单', '招牌'],
        keywords: ['菜单', '推荐', '招牌', '有什么']
      },
      {
        name: 'REPEAT_ORDER',
        patterns: ['跟上次一样', '和上次一样', '老样子'],
        keywords: ['上次', '一样', '老样子']
      }
    ];
  }

  /**
   * 识别用户意图
   */
  recognizeIntent(message) {
    const msg = message.toLowerCase();
    
    for (const intent of this.intents) {
      const patternMatch = intent.patterns.some(p => msg.includes(p));
      const keywordMatch = intent.keywords.some(k => msg.includes(k));
      
      if (patternMatch || keywordMatch) {
        return intent.name;
      }
    }
    
    return 'UNKNOWN';
  }

  /**
   * 检查是否需要转人工
   */
  needsHumanTransfer(intent, message) {
    const lowerMsg = message.toLowerCase();
    
    // 复杂问题转人工
    const complexPatterns = ['投诉', '退款', '开发票', '吵架', '生气', '骂', '投诉'];
    if (complexPatterns.some(p => lowerMsg.includes(p))) {
      return true;
    }
    
    // 连续3次未知意图转人工
    return false;
  }

  /**
   * 生成转人工回复
   */
  getHumanTransferReply() {
    return {
      type: 'transfer_human',
      reply: '抱歉，这个问题我处理不了，我来帮您联系人工客服！',
      qrcode: 'https://example.com/human-service-qrcode.png' // 这里应该是真实的二维码
    };
  }

  /**
   * 处理用户消息
   */
  async handleMessage(sessionId, customerId, message) {
    try {
      // 1. 记录用户消息
      this.context.addMessage(sessionId, 'user', message);
      
      // 2. 识别意图
      const intent = this.recognizeIntent(message);
      
      // 3. 检查是否需要转人工
      if (this.needsHumanTransfer(intent, message)) {
        return this.getHumanTransferReply();
      }
      
      // 4. 根据意图处理
      let result;
      
      switch (intent) {
        case 'ORDER_DISH':
          result = await this.handleOrderDish(sessionId, message);
          break;
        case 'REMOVE_FROM_CART':
          result = await this.handleRemoveFromCart(sessionId, message);
          break;
        case 'VIEW_CART':
          result = await this.handleViewCart(sessionId);
          break;
        case 'MODIFY_ORDER':
          result = await this.handleModifyOrder(sessionId, message);
          break;
        case 'CONFIRM_ORDER':
          result = await this.handleConfirmOrder(sessionId, customerId);
          break;
        case 'QUERY_MENU':
          result = await this.handleQueryMenu(sessionId, message);
          break;
        case 'REPEAT_ORDER':
          result = await this.handleRepeatOrder(sessionId, customerId);
          break;
        case 'ASK_QUESTION':
          result = await this.handleQuestion(sessionId, message);
          break;
        default:
          result = await this.handleUnknown(sessionId, message);
      }
      
      // 5. 记录AI回复
      this.context.addMessage(sessionId, 'assistant', result.reply);
      
      return result;
    } catch (e) {
      console.error('MCP处理错误:', e);
      return {
        type: 'error',
        reply: '抱歉，系统有点问题，请稍后再试！'
      };
    }
  }

  /**
   * 处理点餐
   */
  async handleOrderDish(sessionId, message) {
    const dishesResult = await this.tools.getDishes();
    if (!dishesResult.success) {
      return { type: 'text', reply: '抱歉，暂时无法获取菜单' };
    }
    
    // 简单的匹配逻辑（实际项目这里应该用LLM解析）
    const dishNames = dishesResult.dishes.map(d => d.name);
    let matchedDish = null;
    
    for (const name of dishNames) {
      if (message.includes(name)) {
        matchedDish = dishesResult.dishes.find(d => d.name === name);
        break;
      }
    }
    
    if (matchedDish) {
      this.context.addToCart(sessionId, matchedDish);
      return {
        type: 'cart_updated',
        reply: `好的，已为您添加「${matchedDish.name}」到购物车！还需要其他什么吗？`,
        cart: this.context.getOrCreateSession(sessionId).currentCart
      };
    }
    
    return {
      type: 'text',
      reply: '抱歉，我没找到您要点的菜，您可以看看菜单告诉我菜名！'
    };
  }

  /**
   * 处理移除购物车
   */
  async handleRemoveFromCart(sessionId, message) {
    const session = this.context.getOrCreateSession(sessionId);
    if (session.currentCart.length === 0) {
      return { type: 'text', reply: '购物车是空的哦！' };
    }
    
    // 简化逻辑：默认移除最后添加的
    const lastItem = session.currentCart[session.currentCart.length - 1];
    this.context.removeFromCart(sessionId, lastItem.dishId);
    
    return {
      type: 'cart_updated',
      reply: `好的，已为您移除「${lastItem.name}」`,
      cart: this.context.getOrCreateSession(sessionId).currentCart
    };
  }

  /**
   * 查看购物车
   */
  async handleViewCart(sessionId) {
    const session = this.context.getOrCreateSession(sessionId);
    if (session.currentCart.length === 0) {
      return { type: 'text', reply: '购物车是空的哦，您可以开始点餐啦！' };
    }
    
    const total = session.currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemsText = session.currentCart.map(i => `${i.name} x${i.quantity} - ¥${i.price * i.quantity}`).join('\n');
    
    return {
      type: 'cart_view',
      reply: `您的购物车：\n${itemsText}\n\n总计：¥${total}\n\n确认下单吗？`,
      cart: session.currentCart,
      total
    };
  }

  /**
   * 处理订单修改（口味等）
   */
  async handleModifyOrder(sessionId, message) {
    // 记录口味偏好
    if (message.includes('辣')) {
      const customerId = sessionId; // 简化：用sessionId当customerId
      if (message.includes('不要辣') || message.includes('不辣')) {
        this.context.addDislike(customerId, '辣');
      } else if (message.includes('微辣')) {
        this.context.addTastePreference(customerId, '微辣');
      } else if (message.includes('中辣')) {
        this.context.addTastePreference(customerId, '中辣');
      } else if (message.includes('特辣')) {
        this.context.addTastePreference(customerId, '特辣');
      }
    }
    
    if (message.includes('香菜')) {
      this.context.addDislike(sessionId, '香菜');
    }
    
    if (message.includes('葱')) {
      this.context.addDislike(sessionId, '葱');
    }
    
    return {
      type: 'text',
      reply: '好的，我记住您的口味要求了！'
    };
  }

  /**
   * 确认下单
   */
  async handleConfirmOrder(sessionId, customerId) {
    const session = this.context.getOrCreateSession(sessionId);
    if (session.currentCart.length === 0) {
      return { type: 'text', reply: '购物车是空的哦！' };
    }
    
    const total = session.currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderNo = `YS${Date.now()}`;
    
    // 同步订单到收银
    const syncResult = await this.tools.syncOrder({
      orderNo,
      items: session.currentCart,
      total
    });
    
    if (syncResult.success) {
      // 记录订单
      this.context.recordOrder(customerId, {
        orderNo,
        items: session.currentCart,
        total
      });
      
      // 清空购物车
      this.context.clearCart(sessionId);
      
      return {
        type: 'order_confirmed',
        reply: `✅ 下单成功！\n订单号：${orderNo}\n金额：¥${total}\n\n感谢您的惠顾！`,
        orderNo,
        total
      };
    }
    
    return {
      type: 'error',
      reply: '抱歉，下单失败了，请稍后再试！'
    };
  }

  /**
   * 处理菜单查询
   */
  async handleQueryMenu(sessionId, message) {
    const result = await this.tools.getDishes();
    if (!result.success) {
      return { type: 'text', reply: '抱歉，暂时无法获取菜单' };
    }
    
    const menuText = result.dishes.slice(0, 6).map(d => `${d.name} - ¥${d.price}`).join('\n');
    return {
      type: 'menu',
      reply: `这是我们的招牌菜品：\n${menuText}\n\n您想点什么？`,
      dishes: result.dishes
    };
  }

  /**
   * 处理重复上次订单
   */
  async handleRepeatOrder(sessionId, customerId) {
    const profile = this.context.getCustomerProfile(customerId);
    if (profile.orderHistory.length === 0) {
      return { type: 'text', reply: '抱歉，我没有找到您的历史订单！' };
    }
    
    const lastOrder = profile.orderHistory[0];
    for (const item of lastOrder.items) {
      this.context.addToCart(sessionId, item);
    }
    
    return {
      type: 'cart_updated',
      reply: `好的，已为您复刻上次的订单！确认下单吗？`,
      cart: this.context.getOrCreateSession(sessionId).currentCart
    };
  }

  /**
   * 处理问题
   */
  async handleQuestion(sessionId, message) {
    if (message.includes('WIFI') || message.includes('wifi') || message.includes('无线')) {
      return { type: 'text', reply: 'WIFI账号：Restaurant，密码：12345678' };
    }
    if (message.includes('停车') || message.includes('停车场')) {
      return { type: 'text', reply: '停车场在地下B1层，消费满100元可免2小时停车费！' };
    }
    if (message.includes('营业时间') || message.includes('几点')) {
      return { type: 'text', reply: '我们的营业时间是：10:00 - 22:00' };
    }
    if (message.includes('外卖') || message.includes('配送')) {
      return { type: 'text', reply: '我们支持美团、饿了么外卖，您也可以到店自提！' };
    }
    
    return { type: 'text', reply: '抱歉，这个问题我不太清楚，您可以问我WIFI、停车、营业时间等问题！' };
  }

  /**
   * 处理未知意图
   */
  async handleUnknown(sessionId, message) {
    return {
      type: 'text',
      reply: '您好！想吃点什么？我可以帮您推荐招牌菜，或者告诉我菜名直接点！'
    };
  }
}

module.exports = MCPHandler;
