const cartService = require('../services/cartService');
const contextManager = require('../session/contextManager');
const dishesService = require('../services/dishesService');
const orderService = require('../services/orderServiceV2');
const inputValidator = require('../services/inputValidator');
const logger = require('../utils/logger');
const storeService = require('../services/storeService');

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|all|your)/i,
  /forget\s+(everything|instructions)/i,
  /disregard\s+(your|previous)/i,
  /you\s+are\s+now/i,
  /you\s+are\s+a/i,
  /sql\s+(select|insert|update|delete|drop)/i,
  /select\s+\*\s+from/i,
  /delete\s+from/i,
  /drop\s+(table|database)/i,
  /\bexec\b|\beval\b|\beval\s*\(/i,
  /\{\{.*\}\}/,
  /<script/i,
  /javascript:/i,
  /on\w+\s*=/i
];

function detectPromptInjection(query) {
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(query)) {
      return true;
    }
  }
  return false;
}

async function agentAdapter(req, res, next) {
  try {
    const { query, user_id, session_id, context = {} } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        code: 'INVALID_QUERY',
        message: '缺少必要参数：query'
      });
    }

    if (detectPromptInjection(query)) {
      logger.warn('Prompt注入攻击检测', { query: query.substring(0, 100) });
      return res.status(400).json({
        success: false,
        code: 'INVALID_INPUT',
        message: '输入内容包含无效指令'
      });
    }

    const safeQuery = inputValidator.validateSearchQuery(query);
    if (!safeQuery) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_QUERY',
        message: '查询内容无效'
      });
    }

    const userId = user_id ? inputValidator.validateUserId(user_id) : null;
    const sessionId = session_id || `session-${Date.now()}`;

    logger.info('Agent请求', { userId, sessionId, query: safeQuery });

    const userContext = contextManager.getContext(userId || sessionId);
    const result = await processAgentQuery(safeQuery, userId, sessionId, userContext);

    contextManager.updateContext(userId || sessionId, result.context);

    res.json({
      success: true,
      reply: result.response,
      actions: result.actions || [],
      data: result.data || {},
      sessionId: sessionId,
      requiresConfirmation: result.requiresConfirmation || false,
      clarification: result.clarification || null
    });
  } catch (error) {
    logger.error('Agent处理失败', { error: error.message });
    next(error);
  }
}

async function processAgentQuery(query, userId, sessionId, context) {
  const lowerQuery = query.toLowerCase();
  context = context || {};
  context.lastQuery = query;

  if (lowerQuery.includes('菜单') || lowerQuery.includes('有什么菜') || lowerQuery.includes('看看菜')) {
    return await handleMenuQuery(query, userId, context);
  }

  if (lowerQuery.includes('推荐') || lowerQuery.includes('好吃') || lowerQuery.includes('特色')) {
    return await handleRecommendQuery(query, userId, context);
  }

  if (lowerQuery.includes('点') || lowerQuery.includes('要') || lowerQuery.includes('来一份') || lowerQuery.includes('加') || lowerQuery.includes('一份')) {
    return await handleOrderQuery(query, userId, context);
  }

  if (lowerQuery.includes('购物车') || lowerQuery.includes('看看我点的') || lowerQuery.includes('我点的')) {
    return await handleCartQuery(userId, context);
  }

  if (lowerQuery.includes('下单') || lowerQuery.includes('确认') || lowerQuery.includes('结账') || lowerQuery.includes('买单')) {
    return await handleCheckoutQuery(query, userId, context);
  }

  if (lowerQuery.includes('取消') || lowerQuery.includes('不要了') || lowerQuery.includes('退')) {
    return await handleCancelQuery(query, userId, context);
  }

  if (lowerQuery.includes('门店') || lowerQuery.includes('地址') || lowerQuery.includes('在哪') || lowerQuery.includes('怎么去')) {
    return await handleStoreQuery(query, context);
  }

  if (lowerQuery.includes('wifi') || lowerQuery.includes('无线') || lowerQuery.includes('密码') || lowerQuery.includes('网络')) {
    return await handleWifiQuery(context);
  }

  if (lowerQuery.includes('价格') || lowerQuery.includes('多少钱') || lowerQuery.includes('多少')) {
    return await handlePriceQuery(query, context);
  }

  if (lowerQuery.includes('排队') || lowerQuery.includes('取号') || lowerQuery.includes('排号')) {
    return await handleQueueQuery(query, userId, context);
  }

  if (lowerQuery.includes('电话') || lowerQuery.includes('联系') || lowerQuery.includes('营业')) {
    return await handleContactQuery(query, context);
  }

  if (lowerQuery.includes('帮助') || lowerQuery.includes('怎么用') || lowerQuery.includes('help')) {
    return await handleHelpQuery(context);
  }

  return {
    response: '您好！我是雨姗AI收银助手创味菜的智能助手。请问有什么可以帮您？',
    actions: [{ type: 'show_help', data: {} }],
    data: {},
    context: context
  };
}

async function handleMenuQuery(query, userId, context) {
  const dishes = await dishesService.getAllDishes();

  let category = null;
  if (query.includes('凉菜') || query.includes('冷菜') || query.includes('开胃')) {
    category = '餐前开胃菜';
  } else if (query.includes('招牌') || query.includes('特色')) {
    category = '招牌菜';
  } else if (query.includes('硬菜') || query.includes('主菜') || query.includes('大菜')) {
    category = '特色硬菜';
  } else if (query.includes('汤') || query.includes('羹') || query.includes('主食')) {
    category = '汤羹主食';
  } else if (query.includes('宴请') || query.includes('聚会')) {
    category = '宴请首选菜';
  } else if (query.includes('家常') || query.includes('炒菜')) {
    category = '家常炒菜';
  }

  const filteredDishes = category
    ? dishes.filter(d => d.category === category)
    : dishes;

  const displayDishes = filteredDishes.slice(0, 12);

  const dishList = displayDishes.map(d => {
    const tags = [];
    if (d.isRecommend || d.isSignature) {
      tags.push('⭐');
    }
    if (d.spicyLevel > 0) {
      tags.push('🌶️'.repeat(d.spicyLevel));
    }
    return `${d.name} ¥${d.price} ${tags.join('')}`;
  }).join('\n');

  const categoryText = category ? `【${category}】` : '【全部菜品】';

  context.lastIntent = 'menu';
  context.lastCategory = category;

  return {
    response: `${categoryText}\n\n${dishList}\n\n共${filteredDishes.length}道菜品，回复菜品名称即可添加到购物车。`,
    actions: [{ type: 'show_menu', data: displayDishes, category: category }],
    data: { dishes: displayDishes, total: filteredDishes.length, category },
    context: context
  };
}

async function handleRecommendQuery(query, userId, context) {
  let taste = null;
  let budget = null;

  if (query.includes('辣的') || query.includes('辣') || query.includes('川菜')) {
    taste = '辣';
  } else if (query.includes('清淡') || query.includes('不辣') || query.includes('养生')) {
    taste = '清淡';
  } else if (query.includes('甜的') || query.includes('甜')) {
    taste = '甜';
  }

  if (query.includes('便宜') || query.includes('实惠') || query.includes('经济')) {
    budget = 'low';
  } else if (query.includes('贵') || query.includes('好') || query.includes('档次') || query.includes('请客')) {
    budget = 'high';
  }

  const peopleMatch = query.match(/(\d)[人位桌]/);
  const people = peopleMatch ? parseInt(peopleMatch[1]) : null;

  const recommendations = await dishesService.recommendDishes({
    taste,
    budget,
    people,
    count: 5
  });

  const dishList = recommendations.map((d, i) =>
    `${i + 1}. ${d.name} ¥${d.price}\n   ${d.description || '精选推荐'}`
  ).join('\n\n');

  context.lastIntent = 'recommend';

  return {
    response: `🌟 为您推荐：\n\n${dishList}\n\n请问想点哪几道？直接说菜品名称即可`,
    actions: [{ type: 'recommend', data: recommendations, reason: { taste, budget, people } }],
    data: { recommendations },
    context: context
  };
}

async function handleOrderQuery(query, userId, context) {
  const cart = await cartService.getCart(userId);
  const existingItems = cart.items || [];

  const dishInfo = extractDishInfo(query);

  if (dishInfo.name) {
    const dishes = await dishesService.getAllDishes();
    const dish = dishes.find(d =>
      d.name.includes(dishInfo.name) ||
      dishInfo.name.includes(d.name) ||
      d.name.includes(dishInfo.name.replace(/[来点加要一份]/g, ''))
    );

    if (dish) {
      const remarks = [];
      if (query.includes('少辣') || query.includes('微辣')) {
        remarks.push('少辣');
      }
      if (query.includes('不要') || query.includes('不加')) {
        const notMatch = query.match(/不要([^，,。]+)/);
        if (notMatch) {
          remarks.push(`不要${notMatch[1]}`);
        }
      }
      if (query.includes('加辣')) {
        remarks.push('加辣');
      }

      await cartService.addItem(userId, dish.id, dishInfo.quantity, remarks.join('、'));

      const cartTotal = await cartService.getCart(userId);

      context.lastIntent = 'order';
      context.lastDishId = dish.id;

      return {
        response: `✅ 已添加到购物车：\n${dish.name} x${dishInfo.quantity} ¥${dish.price}\n${remarks.length ? `备注：${ remarks.join('、')}` : ''}\n\n当前购物车：共${cartTotal.items.length}件，合计¥${cartTotal.total}\n\n继续点餐或说"下单"确认`,
        actions: [{ type: 'add_to_cart', data: { dish, quantity: dishInfo.quantity, remarks }, cart: cartTotal }],
        data: { cart: cartTotal, addedDish: dish },
        context: context
      };
    } else {
      return {
        response: `❌ 抱歉，菜单中没有找到「${inputValidator.sanitizeForDisplay(dishInfo.name)}」，请确认菜品名称后重新点餐。\n\n您可以说"给我看看菜单"查看所有菜品。`,
        actions: [{ type: 'show_menu', data: [] }],
        data: { notFound: dishInfo.name },
        context: context,
        requiresConfirmation: true,
        clarification: {
          type: 'dish_not_found',
          message: `没有找到"${dishInfo.name}"这道菜`,
          suggestions: ['给我看看菜单', '推荐几道招牌菜']
        }
      };
    }
  }

  if (existingItems.length > 0) {
    return {
      response: `您的购物车已有${existingItems.length}件菜品。\n\n请问还需要点什么？直接说菜品名称即可添加。`,
      actions: [{ type: 'show_cart', data: existingItems }],
      data: { cart: { items: existingItems, total: cart.total } },
      context: context
    };
  }

  return {
    response: '请告诉我您想点哪些菜，例如：\n• "来一份招牌大鱼头泡饭"\n• "加一份香辣酥排骨"\n• "要一个糖醋里脊"\n\n您也可以说"推荐招牌菜"让我帮您推荐',
    actions: [{ type: 'prompt_order', data: existingItems }],
    data: { cart: { items: existingItems, total: 0 } },
    context: context,
    requiresConfirmation: true,
    clarification: {
      type: 'need_order',
      message: '请告诉我您想点的菜品'
    }
  };
}

async function handleCartQuery(userId, context) {
  const cart = await cartService.getCart(userId);

  if (!cart.items || cart.items.length === 0) {
    return {
      response: '🛒 购物车是空的\n\n您可以说"给我看看菜单"开始点餐',
      actions: [{ type: 'show_cart', data: { items: [], total: 0 } }],
      data: { cart: { items: [], total: 0 } },
      context: context
    };
  }

  const itemList = cart.items.map((item, i) =>
    `${i + 1}. ${item.name} x${item.quantity} ¥${item.price * item.quantity}${item.remarks ? ` (${item.remarks})` : ''}`
  ).join('\n');

  context.lastIntent = 'cart';

  return {
    response: `🛒 购物车（共${cart.items.length}件）：\n\n${itemList}\n\n─────────────────\n合计：¥${cart.total}\n\n回复"下单"确认订单，或继续添加菜品`,
    actions: [{ type: 'show_cart', data: cart }],
    data: { cart },
    context: context
  };
}

async function handleCheckoutQuery(query, userId, context) {
  const cart = await cartService.getCart(userId);

  if (!cart.items || cart.items.length === 0) {
    return {
      response: '❌ 购物车是空的，请先选择想吃的菜品\n\n您可以说"给我看看菜单"开始点餐',
      actions: [{ type: 'show_menu', data: [] }],
      data: {},
      context: context
    };
  }

  const remarks = [];
  if (query.includes('加辣')) {
    remarks.push('加辣');
  }
  if (query.includes('少盐')) {
    remarks.push('少盐');
  }
  if (query.includes('打包')) {
    remarks.push('打包');
  }

  try {
    const order = await orderService.createOrder({
      userId,
      remarks: remarks.length > 0 ? remarks.join('、') : '',
      items: cart.items
    });

    await cartService.clearCart(userId);

    context.lastIntent = 'checkout';
    context.lastOrderId = order.orderId;

    return {
      response: `🎉 订单创建成功！\n\n📋 订单号：${order.orderId}\n💰 金额：¥${order.totalAmount}\n${remarks.length ? `📝 备注：${remarks.join('、')}` : ''}\n\n请到前台出示订单号结账，祝您用餐愉快！🍽️`,
      actions: [{ type: 'create_order', data: order }],
      data: { order },
      context: context
    };
  } catch (error) {
    logger.error('下单失败', { error: error.message, userId });
    return {
      response: `❌ 下单失败：${error.message}\n\n请稍后重试，或联系服务员`,
      actions: [{ type: 'error', data: { code: 'ORDER_FAILED' } }],
      data: { error: error.message },
      context: context
    };
  }
}

async function handleCancelQuery(query, userId, context) {
  if (query.includes('订单')) {
    return {
      response: '取消订单请告诉我订单号，或访问 http://localhost:3000/mobile 查看订单后取消',
      actions: [],
      data: {},
      context: context
    };
  }

  if (query.includes('购物车') || query.includes('刚点的')) {
    await cartService.clearCart(userId);
    return {
      response: '✅ 购物车已清空\n\n您可以说"给我看看菜单"重新点餐',
      actions: [{ type: 'clear_cart', data: {} }],
      data: {},
      context: context
    };
  }

  return {
    response: '好的，已取消\n\n请问还需要什么帮助？',
    actions: [],
    data: {},
    context: context
  };
}

async function handleStoreQuery(query, context) {
  const result = await storeService.getStoreInfo();
  if (result.success && result.store) {
    const store = result.store;
    const settings = result.settings || {};
    return {
      response: `📍 门店信息\n\n名称：${store.name}\n地址：${store.address}\n电话：${store.phone}\n营业时间：${store.businessHours}\n${store.hasParking ? '\n🅿️ 提供停车场' : ''}\n${store.hasWifi ? `\n📶 WiFi：${store.wifiName} 密码：${store.wifiPassword}` : ''}\n\n期待您的光临！`,
      actions: [{ type: 'show_store', data: store }],
      data: { store, settings },
      context: context
    };
  }
  return {
    response: '📍 雨姗AI收银助手创味菜\n\n地址：河南省商丘市县府前路188号\n电话：0370-628-9999\n营业时间：09:00-22:00',
    actions: [],
    data: {},
    context: context
  };
}

async function handleWifiQuery(context) {
  const result = await storeService.getWifiInfo();
  if (result.success) {
    const wifi = result;
    if (wifi.has_wifi) {
      return {
        response: `📶 WiFi信息\n\n名称：${wifi.wifi_name || '雨姗AI收银助手免费WiFi'}\n密码：${wifi.wifi_password || '88888888'}\n\n免密码连接，祝您用餐愉快！`,
        actions: [{ type: 'show_wifi', data: wifi }],
        data: { wifi },
        context: context
      };
    }
    return {
      response: '抱歉，该门店暂无WiFi服务',
      actions: [],
      data: {},
      context: context
    };
  }
  return {
    response: '📶 WiFi信息\n\n名称：雨姗AI收银助手免费WiFi\n密码：88888888\n\n免密码连接，祝您用餐愉快！',
    actions: [],
    data: {},
    context: context
  };
}

async function handlePriceQuery(query, context) {
  const dishName = extractDishName(query);

  if (dishName) {
    const dishes = await dishesService.getAllDishes();
    const dish = dishes.find(d =>
      d.name.includes(dishName) || dishName.includes(d.name)
    );

    if (dish) {
      return {
        response: `「${dish.name}」¥${dish.price}/份\n\n${dish.description || '美味可口，欢迎品尝'}\n\n回复"来一份${dish.name}"添加到购物车`,
        actions: [{ type: 'show_price', data: dish }],
        data: { dish },
        context: context
      };
    }
  }

  return {
    response: '请告诉我您想查询价格的菜品名称，例如"招牌大鱼头泡饭多少钱"',
    actions: [],
    data: {},
    context: context
  };
}

async function handleQueueQuery(query, userId, context) {
  const peopleMatch = query.match(/(\d)[人位桌]/);
  const people = peopleMatch ? parseInt(peopleMatch[1]) : 3;

  let tableType = 'small';
  if (query.includes('中桌') || query.includes('4') || query.includes('5') || query.includes('6')) {
    tableType = 'medium';
  }
  if (query.includes('大桌') || query.includes('7') || query.includes('8') || query.includes('包间')) {
    tableType = 'large';
  }

  const queueService = require('../services/queueService');

  try {
    const result = await queueService.takeQueue('store001', tableType, people, userId);

    context.queueId = result.data.queueId;

    return {
      response: `🎫 取号成功！\n\n排队号：${result.data.queueNo}\n桌型：${result.data.tableType}\n人数：${people}人\n当前等待：${result.data.waitCount}桌\n预计等待：约${result.data.estimatedTime}分钟\n\n请留意叫号，到号后请入座消费`,
      actions: [{ type: 'take_queue', data: result.data }],
      data: result.data,
      context: context
    };
  } catch (error) {
    return {
      response: `❌ 取号失败：${error.message}\n\n请稍后重试或联系服务员`,
      actions: [{ type: 'error', data: { code: 'QUEUE_FAILED' } }],
      data: { error: error.message },
      context: context
    };
  }
}

async function handleContactQuery(query, context) {
  if (query.includes('电话') || query.includes('联系')) {
    const result = await storeService.getPhone();
    if (result.success) {
      return {
        response: `📞 联系电话\n\n${result.phone}\n\n门店：${result.store_name}`,
        actions: [{ type: 'show_phone', data: result }],
        data: result,
        context: context
      };
    }
    return {
      response: '📞 联系电话\n\n0370-628-9999',
      actions: [],
      data: {},
      context: context
    };
  }

  if (query.includes('营业')) {
    const result = await storeService.getBusinessHours();
    if (result.success) {
      return {
        response: `🕐 营业时间\n\n${result.business_hours}\n\n门店：${result.store_name}`,
        actions: [{ type: 'show_business_hours', data: result }],
        data: result,
        context: context
      };
    }
    return {
      response: `🕐 营业时间\n\n09:00-22:00\n\n节假日可能有调整，请以门店公告为准`,
      actions: [],
      data: {},
      context: context
    };
  }

  if (query.includes('停车') || query.includes('车位')) {
    const result = await storeService.getParkingInfo();
    if (result.success) {
      const parkingInfo = result.has_parking ? `提供停车位\n${result.parking_info || ''}` : '暂无停车场';
      return {
        response: `🅿️ 停车信息\n\n${parkingInfo}\n\n门店：${result.store_name}`,
        actions: [{ type: 'show_parking', data: result }],
        data: result,
        context: context
      };
    }
    return {
      response: '🅿️ 停车信息\n\n提供免费停车场，欢迎光临',
      actions: [],
      data: {},
      context: context
    };
  }

  if (query.includes('活动') || query.includes('优惠') || query.includes('公告')) {
    const result = await storeService.getAnnouncements();
    if (result.success && result.announcements && result.announcements.length > 0) {
      const announcements = result.announcements.map(a => `【${a.title}】\n${a.content}`).join('\n\n');
      return {
        response: `📢 最新活动公告\n\n${announcements}`,
        actions: [{ type: 'show_announcements', data: result.announcements }],
        data: result,
        context: context
      };
    }
    return {
      response: '📢 最新活动公告\n\n暂无活动，敬请期待',
      actions: [],
      data: {},
      context: context
    };
  }

  if (query.includes('充电宝') || query.includes('租借充电宝')) {
    const result = await storeService.getStoreServices();
    if (result.success) {
      const hasPowerBank = result.services.powerBank;
      const response = hasPowerBank ? '提供充电宝租借服务' : '暂无充电宝服务';
      return {
        response: `🔋 充电宝\n\n${response}`,
        actions: [],
        data: result,
        context: context
      };
    }
    return {
      response: '🔋 充电宝\n\n提供充电宝租借服务',
      actions: [],
      data: {},
      context: context
    };
  }

  if (query.includes('宠物') || query.includes('带狗') || query.includes('带猫')) {
    const result = await storeService.getStoreServices();
    if (result.success) {
      const petFriendly = result.services.petFriendly;
      const response = petFriendly ? '欢迎携带宠物入店' : '抱歉，暂时不允许携带宠物入店';
      return {
        response: `🐕 宠物政策\n\n${response}`,
        actions: [],
        data: result,
        context: context
      };
    }
    return {
      response: '🐕 宠物政策\n\n抱歉，暂时不允许携带宠物入店',
      actions: [],
      data: {},
      context: context
    };
  }

  if (query.includes('发票') || query.includes('开发票')) {
    const result = await storeService.getStoreServices();
    if (result.success) {
      const invoice = result.services.invoiceAvailable;
      const response = invoice ? '可以开具发票，请联系前台' : '暂时无法提供发票服务';
      return {
        response: `📄 发票服务\n\n${response}`,
        actions: [],
        data: result,
        context: context
      };
    }
    return {
      response: '📄 发票服务\n\n可以开具发票，请联系前台',
      actions: [],
      data: {},
      context: context
    };
  }

  const result = await storeService.getStoreInfo();
  if (result.success && result.store) {
    return {
      response: `📍 门店信息\n\n名称：${result.store.name}\n地址：${result.store.address}\n电话：${result.store.phone}\n营业时间：${result.store.businessHours}`,
      actions: [{ type: 'show_store_info', data: result }],
      data: result,
      context: context
    };
  }

  return {
    response: `📍 雨姗AI收银助手创味菜\n\n地址：河南省商丘市县府前路188号\n电话：0370-628-9999\n营业时间：09:00-22:00`,
    actions: [],
    data: {},
    context: context
  };
}

async function handleHelpQuery(context) {
  return {
    response: '🤖 我可以帮您：\n\n【点餐】\n• "给我看看菜单" - 查看所有菜品\n• "推荐招牌菜" - 获取推荐\n• "来一份xxx" - 添加到购物车\n• "查看购物车" - 查看已选菜品\n• "下单" - 确认订单\n\n【查询】\n• "门店地址在哪" - 获取地址\n• "WiFi密码" - 获取WiFi\n• "电话多少" - 联系电话\n\n【排队】\n• "帮我排个3人桌" - 排队取号\n\n还有什么可以帮您？',
    actions: [{ type: 'show_help', data: {} }],
    data: {},
    context: context
  };
}

function extractDishInfo(query) {
  const name = extractDishName(query);
  const quantity = extractQuantity(query);
  return { name, quantity };
}

function extractDishName(query) {
  const patterns = [
    /来?一?份?(.+?)(?:少辣|微辣|不要|加辣|多少钱|价格|可以吗)/,
    /加?一?份?(.+?)(?:可以吗|谢谢|好)/,
    /(?:点|要)(.+?)(?:吧|呢|好|，|。)/
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  const simpleMatch = query.match(/来?一?份?(.+)/);
  if (simpleMatch && simpleMatch[1]) {
    return simpleMatch[1].trim();
  }

  return null;
}

function extractQuantity(query) {
  if (query.includes('两份') || query.includes('两个') || query.includes('2')) {
    return 2;
  } else if (query.includes('三份') || query.includes('三个') || query.includes('3')) {
    return 3;
  } else if (query.includes('四份') || query.includes('四个') || query.includes('4')) {
    return 4;
  }
  return 1;
}

module.exports = agentAdapter;
