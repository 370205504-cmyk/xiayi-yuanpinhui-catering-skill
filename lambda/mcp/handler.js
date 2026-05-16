/**
 * MCP处理器 v3.0 - AI虚拟前台核心
 * 整合：自然语义理解 + 智能推荐 + FAQ答疑 + 多模态交互 + 自动转人工
 * 增强：25种意图识别 + 多轮对话状态机 + 深度上下文理解
 */

const MCPTools = require('./tools');
const ContextManager = require('./context');
const RecommendationEngine = require('../services/recommendation-engine');
const FAQSystem = require('../services/faq-system');
const MultimodalProcessor = require('../services/multimodal-processor');

const DialogState = {
  INITIAL: 'INITIAL',
  GREETING: 'GREETING',
  ORDERING: 'ORDERING',
  MODIFYING: 'MODIFYING',
  CONFIRMING: 'CONFIRMING',
  PAYMENT: 'PAYMENT',
  RESERVATION: 'RESERVATION',
  FEEDBACK: 'FEEDBACK',
  TRANSFER_HUMAN: 'TRANSFER_HUMAN'
};

class MCPHandler {
  constructor() {
    this.tools = new MCPTools();
    this.context = new ContextManager();
    this.recommendationEngine = null;
    this.faqSystem = new FAQSystem();
    this.multimodalProcessor = new MultimodalProcessor();
    
    this.unknownIntentCount = new Map();
    this.dialogState = new Map();
    
    this.intents = this.buildIntents();
    this.entityPatterns = this.buildEntityPatterns();
  }

  /**
   * 构建25种意图识别模式
   */
  buildIntents() {
    return [
      // ========== 1. 点餐相关 ==========
      {
        name: 'ORDER_DISH',
        patterns: ['来个', '我要', '给我来', '点一份', '再加一份', '再来一个', '份', '两个', '打包一份', '外带一份'],
        keywords: ['份', '个', '盘', '碗', '打包', '外带'],
        confidence: 0.9
      },
      {
        name: 'REMOVE_FROM_CART',
        patterns: ['不要了', '退掉', '取消', '去掉', '不要这个', '移除', '删掉'],
        keywords: ['不要', '取消', '退', '移除', '删'],
        confidence: 0.85
      },
      {
        name: 'VIEW_CART',
        patterns: ['看看购物车', '我的订单', '点了什么', '查看订单', '购物车', '当前订单'],
        keywords: ['购物车', '订单', '查看'],
        confidence: 0.9
      },
      {
        name: 'MODIFY_ORDER',
        patterns: ['不要香菜', '少辣', '加辣', '微辣', '不要葱', '多放', '少放', '改一下', '调整'],
        keywords: ['不要', '少', '多', '加', '改', '调整', '辣', '香菜', '葱'],
        confidence: 0.8
      },
      {
        name: 'CONFIRM_ORDER',
        patterns: ['好的', '可以', '就这样', '下单', '提交', '确认', '要了', '行', '完成了', '好了'],
        keywords: ['下单', '提交', '确认', '要', '完成', '好'],
        confidence: 0.9
      },
      {
        name: 'CANCEL_ORDER',
        patterns: ['取消订单', '退单', '不点了', '不要订单', '撤销订单'],
        keywords: ['取消', '退', '撤销', '不点'],
        confidence: 0.85
      },
      
      // ========== 2. 菜单查询 ==========
      {
        name: 'QUERY_MENU',
        patterns: ['有什么', '推荐', '菜单', '招牌', '有什么好吃的', '菜品有哪些', '都有什么菜'],
        keywords: ['菜单', '推荐', '招牌', '有什么', '菜品'],
        confidence: 0.85
      },
      {
        name: 'QUERY_PRICE',
        patterns: ['多少钱', '价格', '怎么卖', '贵不贵', '报价', '价位'],
        keywords: ['钱', '价格', '贵', '便宜', '价位'],
        confidence: 0.9
      },
      {
        name: 'QUERY_SPECIFIC_DISH',
        patterns: ['宫保鸡丁', '鱼香肉丝', '红烧肉', '糖醋里脊', '麻婆豆腐'],
        keywords: [],
        confidence: 0.95,
        isDishName: true
      },
      
      // ========== 3. 历史订单 ==========
      {
        name: 'REPEAT_ORDER',
        patterns: ['跟上次一样', '和上次一样', '老样子', '还点那个', '再来一份', '再点一次'],
        keywords: ['上次', '一样', '老样子', '再来'],
        confidence: 0.9
      },
      
      // ========== 4. 预约相关 ==========
      {
        name: 'RESERVE_TABLE',
        patterns: ['预约', '订座', '订位', '预订', '订包间', '订包厢', '提前订'],
        keywords: ['预约', '订座', '订位', '预订', '包间', '包厢'],
        confidence: 0.9
      },
      {
        name: 'RESERVATION_INFO',
        patterns: ['几位', '多少人', '几个人', '座位', '位置', '靠窗', '安静'],
        keywords: ['位', '人', '座位', '位置', '靠窗', '安静'],
        confidence: 0.8
      },
      
      // ========== 5. 配送相关 ==========
      {
        name: 'QUERY_DELIVERY',
        patterns: ['外卖', '送餐', '可以送吗', '能送外卖吗', '配送', '送到家'],
        keywords: ['外卖', '送', '配送', '到家'],
        confidence: 0.85
      },
      {
        name: 'DELIVERY_TIME',
        patterns: ['多久送到', '配送时间', '多长时间', '什么时候到', '等多久'],
        keywords: ['多久', '时间', '等', '到'],
        confidence: 0.85
      },
      
      // ========== 6. 支付相关 ==========
      {
        name: 'PAYMENT_METHOD',
        patterns: ['怎么付款', '支付方式', '能用什么付', '支持什么支付', '微信', '支付宝', '现金'],
        keywords: ['支付', '微信', '支付宝', '现金', '付款'],
        confidence: 0.85
      },
      {
        name: 'APPLY_COUPON',
        patterns: ['优惠券', '用券', '打折', '优惠码', '促销码', '满减'],
        keywords: ['券', '优惠', '打折', '满减', '折扣'],
        confidence: 0.85
      },
      {
        name: 'SPLIT_BILL',
        patterns: ['分单', '分开付', 'AA', '各付各的', '分开结账'],
        keywords: ['分', 'AA', '各', '开'],
        confidence: 0.85
      },
      
      // ========== 7. 会员相关 ==========
      {
        name: 'QUERY_POINT',
        patterns: ['积分', '多少积分', '积分查询', '积分怎么用'],
        keywords: ['积分'],
        confidence: 0.9
      },
      {
        name: 'RECHARGE',
        patterns: ['充值', '充钱', '充会员', '续费'],
        keywords: ['充值', '充'],
        confidence: 0.9
      },
      {
        name: 'BIRTHDAY_VIP',
        patterns: ['生日', '寿星', '过生日', '生日优惠', '生日礼物'],
        keywords: ['生日', '寿星'],
        confidence: 0.9
      },
      {
        name: 'MEMBER_REGISTER',
        patterns: ['成为会员', '注册会员', '加入会员', '新会员'],
        keywords: ['会员', '注册', '加入'],
        confidence: 0.85
      },
      
      // ========== 8. FAQ问答 ==========
      {
        name: 'ASK_FAQ',
        patterns: ['几点', '怎么', '什么', '能不能', '可以', '有没有', 'WiFi', '停车', '包间', '地址', '电话'],
        keywords: ['?', '？', '怎么', '什么', '为什么', 'WiFi', '停车', '包间', '打包', '地址', '电话', '营业'],
        confidence: 0.8,
        useFAQ: true
      },
      {
        name: 'WIFI_QUERY',
        patterns: ['WiFi', '无线网', 'wifi密码', '上网', '无线网络'],
        keywords: ['WiFi', 'wifi', '无线', '上网'],
        confidence: 0.95,
        useFAQ: true
      },
      {
        name: 'PARKING_QUERY',
        patterns: ['停车', '停车场', '停车位', '停车费'],
        keywords: ['停车', '车场', '车位'],
        confidence: 0.95,
        useFAQ: true
      },
      {
        name: 'BUSINESS_HOURS',
        patterns: ['几点开门', '几点营业', '营业时间', '什么时候开门', '几点关门', '营业到几点'],
        keywords: ['开门', '营业', '关门', '时间'],
        confidence: 0.95,
        useFAQ: true
      },
      
      // ========== 9. 反馈投诉 ==========
      {
        name: 'FEEDBACK',
        patterns: ['投诉', '意见', '反馈', '不好吃', '上菜慢', '退款', '差评'],
        keywords: ['投诉', '意见', '反馈', '退款', '差评', '不好'],
        confidence: 0.85
      },
      {
        name: 'COMPLIMENT',
        patterns: ['好吃', '表扬', '夸一下', '写好评', '赞', '不错'],
        keywords: ['好吃', '表扬', '夸', '赞', '不错', '好'],
        confidence: 0.85
      },
      
      // ========== 10. 特殊需求 ==========
      {
        name: 'ALLERGEN_QUERY',
        patterns: ['过敏', '食物过敏', '忌口', '不能吃', '不要放'],
        keywords: ['过敏', '忌口', '不能'],
        confidence: 0.9
      },
      {
        name: 'SPICY_LEVEL',
        patterns: ['微辣', '中辣', '特辣', '不辣', '少辣', '要辣', '不要辣'],
        keywords: ['辣'],
        confidence: 0.9
      },
      {
        name: 'TASTE_PREFERENCE',
        patterns: ['清淡', '少油', '少盐', '甜', '咸', '酸'],
        keywords: ['清淡', '油', '盐', '甜', '咸', '酸'],
        confidence: 0.85
      },
      
      // ========== 11. 社交礼仪 ==========
      {
        name: 'GREETING',
        patterns: ['你好', '您好', 'hi', 'hello', '嗨', '在吗', '有人吗', '在不在'],
        keywords: ['你好', '您好', 'hi', 'hello', '嗨', '在', '有人'],
        confidence: 0.9
      },
      {
        name: 'GOODBYE',
        patterns: ['再见', '拜拜', '走了', '走了', '谢谢', '感谢', '辛苦了'],
        keywords: ['再见', '拜拜', '走', '谢谢', '辛苦'],
        confidence: 0.9
      },
      
      // ========== 12. 其他 ==========
      {
        name: 'VOICE_MESSAGE',
        patterns: ['语音'],
        keywords: ['语音'],
        confidence: 0.5,
        isVoice: true
      },
      {
        name: 'EXTRA_REQUEST',
        patterns: ['多要', '再加', '还要', '帮我', '麻烦', '麻烦您'],
        keywords: ['多', '再', '还要', '帮', '麻烦'],
        confidence: 0.7
      },
      {
        name: 'TABLE_NUMBER',
        patterns: ['桌号', '桌位', '座位号', '几桌'],
        keywords: ['桌', '位号'],
        confidence: 0.8
      }
    ];
  }

  /**
   * 构建实体识别模式
   */
  buildEntityPatterns() {
    return {
      dishName: /宫保鸡丁|鱼香肉丝|红烧肉|糖醋里脊|麻婆豆腐|水煮肉片|回锅肉|宫保鸡丁|酸菜鱼|剁椒鱼头|糖醋排骨|红烧狮子头|东坡肉|狮子头|京酱肉丝|木须肉|四季豆|土豆丝|酸辣土豆丝|炒时蔬|蚝油生菜|干煸四季豆|蒜蓉西兰花|香菇油菜|番茄炒蛋|蛋炒饭|扬州炒饭|西红柿鸡蛋面|牛肉面|刀削面|炸酱面|担担面|小笼包|蒸饺|煎饺|锅贴|豆浆|油条|豆腐脑|紫菜蛋花汤|酸辣汤|西红柿鸡蛋汤|疙瘩汤|米饭|馒头|花卷|烙饼/g,
      number: /\d+/,
      spiceLevel: /微辣|中辣|特辣|不辣|少辣/g,
      dietaryRestriction: /不要香菜|不要葱|不要蒜|不要辣|不放香菜|不放葱|不放蒜|少油|少盐|少糖|清淡/g,
      timeExpression: /现在|马上|立刻|等一下|稍等|一会儿|马上|十分钟|二十分钟|半小时|一个小时/g
    };
  }

  /**
   * 初始化推荐引擎
   */
  async init(adapter) {
    if (!this.recommendationEngine) {
      this.recommendationEngine = new RecommendationEngine();
      await this.recommendationEngine.init(adapter);
    }
  }

  /**
   * 识别用户意图（增强版）
   */
  recognizeIntent(message, context = {}) {
    const msg = message.toLowerCase().trim();
    
    let bestMatch = null;
    let bestScore = 0;
    
    for (const intent of this.intents) {
      let score = 0;
      
      // 精确模式匹配
      const patternMatch = intent.patterns.some(p => msg.includes(p.toLowerCase()));
      if (patternMatch) {
        score += intent.confidence;
      }
      
      // 关键词匹配
      const keywordMatch = intent.keywords.some(k => msg.includes(k));
      if (keywordMatch) {
        score += 0.3;
      }
      
      // 菜品名称匹配
      if (intent.isDishName) {
        const dishMatch = msg.includes(intent.name.replace('_', ''));
        if (dishMatch) {
          score += intent.confidence;
        }
      }
      
      // 上下文增强
      if (context.dialogState === DialogState.ORDERING && intent.name === 'ORDER_DISH') {
        score += 0.2;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { ...intent, score };
      }
    }
    
    if (bestScore >= 0.5) {
      return { intent: bestMatch.name, confidence: bestMatch.score, useFAQ: bestMatch.useFAQ };
    }
    
    return { intent: 'UNKNOWN', confidence: 0, useFAQ: false };
  }

  /**
   * 提取实体信息
   */
  extractEntities(message) {
    const entities = {
      dishes: [],
      numbers: [],
      spiceLevel: null,
      dietaryRestrictions: [],
      timeExpression: null
    };
    
    // 提取菜品
    const dishMatches = message.match(this.entityPatterns.dishName);
    if (dishMatches) {
      entities.dishes = [...new Set(dishMatches)];
    }
    
    // 提取数量
    const numberMatches = message.match(/\d+/g);
    if (numberMatches) {
      entities.numbers = numberMatches.map(n => parseInt(n));
    }
    
    // 提取辣度
    const spiceMatch = message.match(this.entityPatterns.spiceLevel);
    if (spiceMatch) {
      entities.spiceLevel = spiceMatch[0];
    }
    
    // 提取忌口
    const dietaryMatches = message.match(this.entityPatterns.dietaryRestriction);
    if (dietaryMatches) {
      entities.dietaryRestrictions = [...new Set(dietaryMatches)];
    }
    
    // 提取时间
    const timeMatch = message.match(this.entityPatterns.timeExpression);
    if (timeMatch) {
      entities.timeExpression = timeMatch[0];
    }
    
    return entities;
  }

  /**
   * 检查是否需要转人工
   */
  needsHumanTransfer(sessionId, intent, message) {
    const lowerMsg = message.toLowerCase();
    
    // 1. 复杂问题直接转人工
    const complexPatterns = [
      '投诉', '退款', '开发票', '吵架', '生气', '要投诉', 
      '叫你们老板', '经理', '赔偿', '报警', '曝光', '媒体',
      '法律', '律师', '起诉'
    ];
    if (complexPatterns.some(p => lowerMsg.includes(p))) {
      return true;
    }

    // 2. 连续3次未知意图转人工
    const count = this.unknownIntentCount.get(sessionId) || 0;
    if (intent === 'UNKNOWN' && count >= 3) {
      this.unknownIntentCount.set(sessionId, 0);
      return true;
    }

    // 3. 更新计数
    if (intent === 'UNKNOWN') {
      this.unknownIntentCount.set(sessionId, count + 1);
    } else {
      this.unknownIntentCount.set(sessionId, 0);
    }

    return false;
  }

  /**
   * 生成转人工回复
   */
  getHumanTransferReply() {
    return {
      type: 'transfer_human',
      reply: '抱歉，这个问题我处理不了，让我帮您转接人工客服~',
      qrcode: 'https://example.com/human-service-qrcode.png',
      waitMessage: '人工客服正在赶来，请稍候...'
    };
  }

  /**
   * 更新对话状态
   */
  updateDialogState(sessionId, newState) {
    this.dialogState.set(sessionId, newState);
  }

  /**
   * 获取对话状态
   */
  getDialogState(sessionId) {
    return this.dialogState.get(sessionId) || DialogState.INITIAL;
  }

  /**
   * 处理用户消息（主入口 - 增强版）
   */
  async handleMessage(sessionId, customerId, message, inputType = 'text') {
    try {
      // 1. 记录用户消息
      this.context.addMessage(sessionId, 'user', message);
      
      // 2. 多模态处理
      let textMessage = message;
      if (inputType !== 'text') {
        const multiResult = await this.multimodalProcessor.process(message, inputType);
        if (multiResult.success && multiResult.text) {
          textMessage = multiResult.text;
        } else if (!multiResult.success) {
          return multiResult;
        }
      }

      // 3. 提取实体信息
      const entities = this.extractEntities(textMessage);
      
      // 4. 获取上下文
      const context = {
        session: this.context.getOrCreateSession(sessionId),
        profile: this.context.getCustomerProfile(customerId),
        dialogState: this.getDialogState(sessionId)
      };

      // 5. 识别意图
      const { intent, confidence, useFAQ } = this.recognizeIntent(textMessage, context);

      // 6. 检查是否需要转人工
      if (this.needsHumanTransfer(sessionId, intent, textMessage)) {
        this.updateDialogState(sessionId, DialogState.TRANSFER_HUMAN);
        return this.getHumanTransferReply();
      }

      // 7. 更新对话状态
      this.updateSessionState(sessionId, intent);

      // 8. 优先使用FAQ系统回答问题
      if (useFAQ || intent === 'ASK_FAQ' || intent === 'WIFI_QUERY' || 
          intent === 'PARKING_QUERY' || intent === 'BUSINESS_HOURS') {
        const faqResult = this.faqSystem.answer(textMessage, { customerProfile: context.profile });
        
        if (faqResult.type === 'transfer_human') {
          return faqResult;
        }

        this.context.addMessage(sessionId, 'assistant', faqResult.reply);
        return faqResult;
      }

      // 9. 根据意图处理
      let result;
      switch (intent) {
        case 'ORDER_DISH':
        case 'QUERY_SPECIFIC_DISH':
          result = await this.handleOrderDish(sessionId, textMessage, entities);
          break;
        case 'REMOVE_FROM_CART':
          result = await this.handleRemoveFromCart(sessionId, textMessage);
          break;
        case 'VIEW_CART':
          result = await this.handleViewCart(sessionId);
          break;
        case 'MODIFY_ORDER':
        case 'SPICY_LEVEL':
        case 'TASTE_PREFERENCE':
        case 'ALLERGEN_QUERY':
          result = await this.handleModifyOrder(sessionId, customerId, textMessage, entities);
          break;
        case 'CONFIRM_ORDER':
          result = await this.handleConfirmOrder(sessionId, customerId);
          break;
        case 'CANCEL_ORDER':
          result = await this.handleCancelOrder(sessionId);
          break;
        case 'QUERY_MENU':
          result = await this.handleQueryMenu(sessionId, context);
          break;
        case 'QUERY_PRICE':
          result = await this.handleQueryPrice(sessionId, textMessage, entities);
          break;
        case 'REPEAT_ORDER':
          result = await this.handleRepeatOrder(sessionId, customerId);
          break;
        case 'RESERVE_TABLE':
          result = await this.handleReserveTable(sessionId, textMessage, entities);
          break;
        case 'QUERY_DELIVERY':
        case 'DELIVERY_TIME':
          result = await this.handleQueryDelivery(sessionId);
          break;
        case 'PAYMENT_METHOD':
          result = await this.handlePaymentMethod(sessionId);
          break;
        case 'APPLY_COUPON':
          result = await this.handleApplyCoupon(sessionId, textMessage);
          break;
        case 'SPLIT_BILL':
          result = await this.handleSplitBill(sessionId);
          break;
        case 'QUERY_POINT':
          result = await this.handleQueryPoint(customerId);
          break;
        case 'RECHARGE':
          result = await this.handleRecharge(sessionId);
          break;
        case 'BIRTHDAY_VIP':
          result = await this.handleBirthdayVip(customerId);
          break;
        case 'MEMBER_REGISTER':
          result = await this.handleMemberRegister(sessionId);
          break;
        case 'FEEDBACK':
          result = await this.handleFeedback(sessionId, textMessage);
          break;
        case 'COMPLIMENT':
          result = await this.handleCompliment(sessionId);
          break;
        case 'GREETING':
          result = await this.handleGreeting(sessionId, customerId);
          break;
        case 'GOODBYE':
          result = await this.handleGoodbye(sessionId);
          break;
        case 'TABLE_NUMBER':
          result = await this.handleTableNumber(sessionId, textMessage);
          break;
        default:
          result = await this.handleWelcome(sessionId, customerId);
      }

      // 10. 记录AI回复
      if (result.reply) {
        this.context.addMessage(sessionId, 'assistant', result.reply);
      }

      // 11. 主动推荐（每次回复都可以附带推荐）
      if (result.type === 'text' && !result.excludeRecommendation && 
          intent !== 'GREETING' && intent !== 'GOODBYE' && intent !== 'FEEDBACK') {
        const recommendations = await this.getActiveRecommendations(sessionId, customerId);
        if (recommendations) {
          result.reply += '\n\n' + recommendations;
        }
      }

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
   * 更新会话状态
   */
  updateSessionState(sessionId, intent) {
    const stateMap = {
      'ORDER_DISH': DialogState.ORDERING,
      'QUERY_SPECIFIC_DISH': DialogState.ORDERING,
      'REMOVE_FROM_CART': DialogState.MODIFYING,
      'MODIFY_ORDER': DialogState.MODIFYING,
      'CONFIRM_ORDER': DialogState.CONFIRMING,
      'CANCEL_ORDER': DialogState.ORDERING,
      'QUERY_MENU': DialogState.ORDERING,
      'RESERVE_TABLE': DialogState.RESERVATION,
      'FEEDBACK': DialogState.FEEDBACK,
      'GREETING': DialogState.GREETING,
      'GOODBYE': DialogState.INITIAL
    };
    
    const newState = stateMap[intent] || DialogState.ORDERING;
    this.updateDialogState(sessionId, newState);
  }

  /**
   * 获取主动推荐
   */
  async getActiveRecommendations(sessionId, customerId) {
    if (!this.recommendationEngine) {
      return null;
    }

    const session = this.context.getOrCreateSession(sessionId);
    const profile = this.context.getCustomerProfile(customerId);

    const recommendations = await this.recommendationEngine.getComprehensiveRecommendation(
      profile,
      session.currentCart
    );

    return this.recommendationEngine.getRecommendationMessage(recommendations, profile);
  }

  /**
   * 处理点餐（增强版）
   */
  async handleOrderDish(sessionId, message, entities) {
    const dishesResult = await this.tools.getDishes();
    if (!dishesResult.success) {
      return { type: 'text', reply: '抱歉，暂时无法获取菜单，请稍后再试~' };
    }

    // 1. 优先从实体中提取菜品
    let matchedDish = null;
    
    if (entities.dishes.length > 0) {
      const dishName = entities.dishes[0];
      matchedDish = dishesResult.dishes.find(d => d.name.includes(dishName) || dishName.includes(d.name));
    }
    
    // 2. 如果没有实体匹配，尝试从消息中匹配
    if (!matchedDish) {
      const dishNames = dishesResult.dishes.map(d => d.name);
      for (const name of dishNames) {
        if (message.includes(name)) {
          matchedDish = dishesResult.dishes.find(d => d.name === name);
          break;
        }
      }
    }

    if (matchedDish) {
      const quantity = entities.numbers.length > 0 ? entities.numbers[0] : 1;
      matchedDish.quantity = quantity;
      this.context.addToCart(sessionId, matchedDish);

      const cart = this.context.getOrCreateSession(sessionId).currentCart;
      const total = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

      return {
        type: 'cart_updated',
        reply: `好的，已添加「${matchedDish.name}」x${quantity} 到购物车~\n\n当前购物车：\n${cart.map(i => `${i.name} x${i.quantity || 1} - ¥${i.price * (i.quantity || 1)}`).join('\n')}\n\n总计：¥${total}`,
        cart,
        excludeRecommendation: false
      };
    }

    return {
      type: 'text',
      reply: '抱歉，我没找到您说的菜品，您可以告诉我完整菜名，或者说"推荐"我帮您推荐~'
    };
  }

  /**
   * 移除购物车
   */
  async handleRemoveFromCart(sessionId, message) {
    const session = this.context.getOrCreateSession(sessionId);
    if (session.currentCart.length === 0) {
      return { type: 'text', reply: '购物车是空的哦~' };
    }

    for (const item of session.currentCart) {
      if (message.includes(item.name)) {
        this.context.removeFromCart(sessionId, item.dishId);
        return {
          type: 'cart_updated',
          reply: `好的，已移除「${item.name}」`,
          cart: this.context.getOrCreateSession(sessionId).currentCart,
          excludeRecommendation: true
        };
      }
    }

    const lastItem = session.currentCart[session.currentCart.length - 1];
    this.context.removeFromCart(sessionId, lastItem.dishId);
    return {
      type: 'cart_updated',
      reply: `好的，已移除最后一个「${lastItem.name}」`,
      cart: this.context.getOrCreateSession(sessionId).currentCart,
      excludeRecommendation: true
    };
  }

  /**
   * 查看购物车
   */
  async handleViewCart(sessionId) {
    const session = this.context.getOrCreateSession(sessionId);
    if (session.currentCart.length === 0) {
      return { type: 'text', reply: '购物车是空的哦，想吃点什么呢？' };
    }

    const total = session.currentCart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const itemsText = session.currentCart.map(i => `${i.name} x${i.quantity || 1} - ¥${i.price * (i.quantity || 1)}`).join('\n');

    return {
      type: 'cart_view',
      reply: `您的购物车：\n\n${itemsText}\n\n总计：¥${total}\n\n确认下单吗？`,
      cart: session.currentCart,
      total,
      excludeRecommendation: true
    };
  }

  /**
   * 处理订单修改（增强版）
   */
  async handleModifyOrder(sessionId, customerId, message, entities) {
    const lowerMsg = message.toLowerCase();

    // 记录忌口
    if (lowerMsg.includes('香菜')) {
      this.context.addDislike(customerId, '香菜');
    }
    if (lowerMsg.includes('葱')) {
      this.context.addDislike(customerId, '葱');
    }
    if (lowerMsg.includes('蒜')) {
      this.context.addDislike(customerId, '蒜');
    }
    
    // 记录辣度偏好
    if (entities.spiceLevel) {
      this.context.addTastePreference(customerId, entities.spiceLevel);
    } else if (lowerMsg.includes('辣') && !lowerMsg.includes('不辣')) {
      if (lowerMsg.includes('微辣')) {
        this.context.addTastePreference(customerId, '微辣');
      } else if (lowerMsg.includes('中辣')) {
        this.context.addTastePreference(customerId, '中辣');
      } else if (lowerMsg.includes('特辣')) {
        this.context.addTastePreference(customerId, '特辣');
      }
    }
    if (lowerMsg.includes('不要辣') || lowerMsg.includes('不辣')) {
      this.context.addDislike(customerId, '辣');
      this.context.addTastePreference(customerId, '不辣');
    }

    return {
      type: 'text',
      reply: '好的，已记录您的口味要求~'
    };
  }

  /**
   * 确认下单
   */
  async handleConfirmOrder(sessionId, customerId) {
    const session = this.context.getOrCreateSession(sessionId);
    if (session.currentCart.length === 0) {
      return { type: 'text', reply: '购物车是空的哦，先选点菜吧~' };
    }

    const total = session.currentCart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const orderNo = `YS${Date.now()}`;

    const syncResult = await this.tools.syncOrder({
      orderNo,
      items: session.currentCart,
      total
    });

    if (syncResult.success) {
      this.context.recordOrder(customerId, {
        orderNo,
        items: session.currentCart,
        total
      });
      this.context.clearCart(sessionId);

      return {
        type: 'order_confirmed',
        reply: `✅ 下单成功！\n\n订单号：${orderNo}\n金额：¥${total}\n\n感谢惠顾，请稍候~`,
        orderNo,
        total
      };
    }

    return {
      type: 'error',
      reply: '下单失败了，稍后再试可以吗？'
    };
  }

  /**
   * 取消订单
   */
  async handleCancelOrder(sessionId) {
    const session = this.context.getOrCreateSession(sessionId);
    if (session.currentCart.length === 0) {
      return { type: 'text', reply: '购物车是空的哦~' };
    }
    
    this.context.clearCart(sessionId);
    return {
      type: 'text',
      reply: '好的，已为您取消订单。欢迎下次光临~'
    };
  }

  /**
   * 查询菜单
   */
  async handleQueryMenu(sessionId, context) {
    if (!this.recommendationEngine) {
      const result = await this.tools.getDishes();
      if (!result.success) {
        return { type: 'text', reply: '抱歉，暂时无法获取菜单~' };
      }
      const menuText = result.dishes.slice(0, 6).map(d => `${d.name} - ¥${d.price}`).join('\n');
      return {
        type: 'menu',
        reply: `我们的菜品：\n\n${menuText}\n\n想点什么？`,
        dishes: result.dishes
      };
    }

    const session = context.session;
    const profile = context.profile;
    const recommendations = await this.recommendationEngine.getComprehensiveRecommendation(profile, session.currentCart);

    let reply = '我们的招牌菜品：\n\n';
    if (recommendations.popular?.length > 0) {
      reply += '🔥 今日爆款：\n';
      recommendations.popular.slice(0, 3).forEach(dish => {
        reply += `  • ${dish.name} - ¥${dish.price}\n`;
      });
    }
    if (recommendations.combo?.length > 0) {
      reply += '\n🍱 超值套餐：\n';
      recommendations.combo.slice(0, 2).forEach(combo => {
        reply += `  • ${combo.name} - ¥${combo.comboPrice}（省${combo.discount}元）\n`;
      });
    }

    return {
      type: 'menu',
      reply
    };
  }

  /**
   * 查询价格
   */
  async handleQueryPrice(sessionId, message, entities) {
    if (entities.dishes.length > 0) {
      const result = await this.tools.getDishes();
      const dish = result.dishes.find(d => d.name.includes(entities.dishes[0]) || entities.dishes[0].includes(d.name));
      if (dish) {
        return {
          type: 'text',
          reply: `「${dish.name}」的价格是 ¥${dish.price}`,
          excludeRecommendation: true
        };
      }
    }
    
    return {
      type: 'text',
      reply: '请问您想查询哪个菜品的价格？',
      excludeRecommendation: true
    };
  }

  /**
   * 重复上次订单
   */
  async handleRepeatOrder(sessionId, customerId) {
    const profile = this.context.getCustomerProfile(customerId);
    if (profile.orderHistory.length === 0) {
      return { type: 'text', reply: '抱歉，我找不到您的历史订单~' };
    }

    const lastOrder = profile.orderHistory[0];
    for (const item of lastOrder.items) {
      this.context.addToCart(sessionId, item);
    }

    const total = lastOrder.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    return {
      type: 'cart_updated',
      reply: `已复刻您上次的订单：\n\n${lastOrder.items.map(i => `${i.name} x${i.quantity || 1}`).join('\n')}\n\n总计：¥${total}\n\n确认下单吗？`,
      cart: this.context.getOrCreateSession(sessionId).currentCart
    };
  }

  /**
   * 预约桌位
   */
  async handleReserveTable(sessionId, message, entities) {
    const peopleCount = entities.numbers.length > 0 ? entities.numbers[0] : null;
    
    return {
      type: 'reservation',
      reply: peopleCount 
        ? `好的，帮您预约${peopleCount}位！请问您想预约什么时间？`
        : '请问您几位用餐？我来帮您安排~',
      excludeRecommendation: true
    };
  }

  /**
   * 查询配送
   */
  async handleQueryDelivery(sessionId) {
    return {
      type: 'text',
      reply: '我们支持外卖配送！一般情况下，制作完成后30分钟左右送达。请问您想点些什么？',
      excludeRecommendation: false
    };
  }

  /**
   * 支付方式
   */
  async handlePaymentMethod(sessionId) {
    return {
      type: 'text',
      reply: '我们支持以下支付方式：\n• 微信支付\n• 支付宝\n• 现金\n• 会员卡余额\n\n请问您想用哪种方式支付？',
      excludeRecommendation: true
    };
  }

  /**
   * 使用优惠券
   */
  async handleApplyCoupon(sessionId, message) {
    const couponMatch = message.match(/[A-Z0-9]{4,}/i);
    if (couponMatch) {
      return {
        type: 'text',
        reply: `正在验证优惠码 ${couponMatch[0]}...`,
        excludeRecommendation: true
      };
    }
    return {
      type: 'text',
      reply: '请告诉我您的优惠码~',
      excludeRecommendation: true
    };
  }

  /**
   * 分单
   */
  async handleSplitBill(sessionId) {
    return {
      type: 'text',
      reply: '好的，支持分开结账！请问您想怎么分？',
      excludeRecommendation: true
    };
  }

  /**
   * 查询积分
   */
  async handleQueryPoint(customerId) {
    const profile = this.context.getCustomerProfile(customerId);
    return {
      type: 'text',
      reply: `您当前有 ${profile.totalSpent || 0} 积分，100积分可抵扣1元现金~`,
      excludeRecommendation: true
    };
  }

  /**
   * 充值
   */
  async handleRecharge(sessionId) {
    return {
      type: 'text',
      reply: '会员充值有优惠！\n• 充值200送20\n• 充值500送80\n• 充值1000送200\n\n请问您想充多少？',
      excludeRecommendation: true
    };
  }

  /**
   * 生日优惠
   */
  async handleBirthdayVip(customerId) {
    return {
      type: 'text',
      reply: '🎂 会员生日当天享受菜品8折优惠（酒水除外），还送长寿面一份！请问您是会员吗？',
      excludeRecommendation: true
    };
  }

  /**
   * 会员注册
   */
  async handleMemberRegister(sessionId) {
    return {
      type: 'text',
      reply: '成为会员可以享受积分返利、会员折扣、生日优惠等多重权益！请问您的手机号是多少？',
      excludeRecommendation: true
    };
  }

  /**
   * 反馈投诉
   */
  async handleFeedback(sessionId, message) {
    return {
      type: 'feedback',
      reply: '非常抱歉给您带来不好的体验！请您告诉我具体情况，我会及时反馈给店长处理~',
      excludeRecommendation: true
    };
  }

  /**
   * 表扬
   */
  async handleCompliment(sessionId) {
    return {
      type: 'text',
      reply: '谢谢您的认可！您的支持是我们最大的动力~请问还有什么需要吗？',
      excludeRecommendation: false
    };
  }

  /**
   * 问候
   */
  async handleGreeting(sessionId, customerId) {
    const profile = this.context.getCustomerProfile(customerId);
    const isReturning = profile.visitCount > 0;

    if (isReturning) {
      return {
        type: 'greeting',
        reply: `😊 欢迎回来！${profile.preferences?.tastes?.join('、') || ''}对吧？\n\n想吃点什么呢？`,
        isReturning,
        excludeRecommendation: false
      };
    }
    
    return {
      type: 'greeting',
      reply: '👋 您好！欢迎光临！\n\n我是您的AI点餐助手，有什么可以帮您？',
      isReturning: false,
      excludeRecommendation: false
    };
  }

  /**
   * 告别
   */
  async handleGoodbye(sessionId) {
    this.context.clearCart(sessionId);
    return {
      type: 'goodbye',
      reply: '感谢光临！祝您用餐愉快~欢迎下次再来！👋',
      excludeRecommendation: true
    };
  }

  /**
   * 桌号识别
   */
  async handleTableNumber(sessionId, message) {
    const tableMatch = message.match(/(\d+)桌|(\d+)号桌|桌号(\d+)/);
    if (tableMatch) {
      const tableNum = tableMatch[1] || tableMatch[2] || tableMatch[3];
      return {
        type: 'text',
        reply: `好的，您是${tableNum}号桌~`,
        excludeRecommendation: true
      };
    }
    return {
      type: 'text',
      reply: '请问您的桌号是多少？',
      excludeRecommendation: true
    };
  }

  /**
   * 欢迎消息
   */
  async handleWelcome(sessionId, customerId) {
    const profile = this.context.getCustomerProfile(customerId);
    const isReturning = profile.visitCount > 0;

    let welcome = '';
    if (isReturning) {
      welcome = `😊 欢迎回来！`;
      if (profile.preferences?.tastes?.length > 0) {
        welcome += `喜欢${profile.preferences.tastes.join('、')}的对吧~\n\n`;
      }
    } else {
      welcome = `👋 欢迎光临！\n\n`;
    }

    return {
      type: 'welcome',
      reply: welcome + '想吃点什么？我可以帮您推荐菜品，或者直接告诉我菜名~',
      isReturning
    };
  }
}

module.exports = MCPHandler;
