const cartService = require('../services/cartService');
const contextManager = require('../session/contextManager');
const dishesService = require('../services/dishesService');
const orderService = require('../services/orderServiceV2');
const logger = require('../utils/logger');

async function agentAdapter(req, res, next) {
  try {
    const { query, user_id, session_id, context = {} } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：query'
      });
    }
    
    const userId = user_id || 'agent-user';
    const sessionId = session_id || `agent-${Date.now()}`;
    
    logger.info('Agent请求', { userId, sessionId, query });
    
    const result = await processAgentQuery(query, userId, sessionId, context);
    
    res.json({
      success: true,
      reply: result.response,
      actions: result.actions,
      data: result.data,
      sessionId: sessionId
    });
  } catch (error) {
    next(error);
  }
}

async function processAgentQuery(query, userId, sessionId, context) {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('菜单') || lowerQuery.includes('有什么菜') || lowerQuery.includes('看看菜')) {
    return await handleMenuQuery(query, userId);
  }
  
  if (lowerQuery.includes('推荐') || lowerQuery.includes('好吃') || lowerQuery.includes('特色')) {
    return await handleRecommendQuery(query, userId);
  }
  
  if (lowerQuery.includes('点') || lowerQuery.includes('要') || lowerQuery.includes('来一份') || lowerQuery.includes('加')) {
    return await handleOrderQuery(query, userId);
  }
  
  if (lowerQuery.includes('购物车') || lowerQuery.includes('看看我点的')) {
    return await handleCartQuery(userId);
  }
  
  if (lowerQuery.includes('下单') || lowerQuery.includes('确认') || lowerQuery.includes('结账')) {
    return await handleCheckoutQuery(query, userId);
  }
  
  if (lowerQuery.includes('门店') || lowerQuery.includes('地址') || lowerQuery.includes('在哪')) {
    return await handleStoreQuery(query);
  }
  
  if (lowerQuery.includes('wifi') || lowerQuery.includes('无线') || lowerQuery.includes('密码')) {
    return await handleWifiQuery();
  }
  
  if (lowerQuery.includes('价格') || lowerQuery.includes('多少钱')) {
    return await handlePriceQuery(query);
  }
  
  return {
    response: '您好！我是夏邑缘品荟创味菜的智能助手。请问有什么可以帮您的？您可以询问菜单、推荐菜品、点餐、查询门店和WiFi等信息。',
    actions: [],
    data: {}
  };
}

async function handleMenuQuery(query, userId) {
  const dishes = await dishesService.getAllDishes();
  
  let category = null;
  if (query.includes('凉菜') || query.includes('冷菜')) {
    category = '餐前开胃菜';
  } else if (query.includes('招牌') || query.includes('特色')) {
    category = '招牌菜';
  } else if (query.includes('硬菜') || query.includes('主菜')) {
    category = '特色硬菜';
  } else if (query.includes('汤') || query.includes('羹')) {
    category = '汤羹主食饮品';
  } else if (query.includes('宴请')) {
    category = '宴请首选菜';
  } else if (query.includes('家常')) {
    category = '家常炒菜';
  }
  
  const filteredDishes = category 
    ? dishes.filter(d => d.category === category)
    : dishes;
  
  const dishList = filteredDishes.slice(0, 10).map(d => 
    `${d.name} - ${d.price}元`
  ).join('\\n');
  
  const categoryText = category ? `${category}：` : '我们的菜品：';
  
  return {
    response: `${categoryText}\\n${dishList}\\n\\n共${filteredDishes.length}道菜品，更多请查看完整菜单。`,
    actions: [{ type: 'show_menu', data: filteredDishes.slice(0, 10) }],
    data: { dishes: filteredDishes.slice(0, 10) }
  };
}

async function handleRecommendQuery(query, userId) {
  let taste = null;
  let budget = null;
  
  if (query.includes('辣的') || query.includes('辣')) {
    taste = '辣';
  } else if (query.includes('清淡') || query.includes('不辣')) {
    taste = '清淡';
  } else if (query.includes('甜的') || query.includes('甜')) {
    taste = '甜';
  }
  
  if (query.includes('便宜') || query.includes('实惠') || query.includes('便宜点')) {
    budget = 'low';
  } else if (query.includes('贵') || query.includes('好') || query.includes('档次')) {
    budget = 'high';
  }
  
  const recommendations = await dishesService.recommendDishes({
    taste,
    budget,
    count: 5
  });
  
  const dishList = recommendations.map(d => 
    `${d.name} - ${d.price}元 (${d.description || '推荐'})`
  ).join('\\n');
  
  return {
    response: `为您推荐：\\n${dishList}`,
    actions: [{ type: 'recommend', data: recommendations }],
    data: { recommendations }
  };
}

async function handleOrderQuery(query, userId) {
  const cart = await cartService.getCart(userId);
  const existingItems = cart.items || [];
  
  const dishName = extractDishName(query);
  const quantity = extractQuantity(query);
  
  if (dishName) {
    const dishes = await dishesService.getAllDishes();
    const dish = dishes.find(d => 
      d.name.includes(dishName) || dishName.includes(d.name)
    );
    
    if (dish) {
      await cartService.addItem(userId, dish.id, quantity, '');
      
      const cartTotal = await cartService.getCart(userId);
      
      return {
        response: `已将「${dish.name}」添加到购物车，共${quantity}份。\\n当前购物车总计：${cartTotal.total}元\\n\\n继续点餐或说"下单"确认订单。`,
        actions: [{ type: 'add_to_cart', data: dish }],
        data: { cart: cartTotal }
      };
    } else {
      return {
        response: `抱歉，菜单中没有找到「${dishName}」，请确认菜品名称后重新点餐。`,
        actions: [],
        data: {}
      };
    }
  }
  
  return {
    response: `请告诉我您想点哪些菜，例如"来一份招牌大鱼头泡饭"或"加一份香辣酥排骨"。`,
    actions: [{ type: 'prompt_order', data: existingItems }],
    data: { cart: cartTotal || existingItems }
  };
}

async function handleCartQuery(userId) {
  const cart = await cartService.getCart(userId);
  
  if (!cart.items || cart.items.length === 0) {
    return {
      response: '您的购物车是空的，请问想点什么菜？',
      actions: [],
      data: { cart: { items: [], total: 0 } }
    };
  }
  
  const itemList = cart.items.map(item => 
    `${item.name} x${item.quantity} = ${item.price * item.quantity}元`
  ).join('\\n');
  
  return {
    response: `您的购物车：\\n${itemList}\\n\\n总计：${cart.total}元\\n\\n确认下单请说"下单"，继续加菜请直接告诉我。`,
    actions: [{ type: 'show_cart', data: cart }],
    data: { cart }
  };
}

async function handleCheckoutQuery(query, userId) {
  const cart = await cartService.getCart(userId);
  
  if (!cart.items || cart.items.length === 0) {
    return {
      response: '您的购物车是空的，请先选择想吃的菜品。',
      actions: [],
      data: {}
    };
  }
  
  const order = await orderService.createOrder({
    userId,
    remarks: query.includes('加辣') ? '微辣' : (query.includes('少盐') ? '少盐' : '')
  });
  
  await cartService.clearCart(userId);
  
  return {
    response: `订单创建成功！\\n订单号：${order.orderId}\\n金额：${order.totalAmount}元\\n\\n请到前台出示订单号结账，祝您用餐愉快！🍽️`,
    actions: [{ type: 'create_order', data: order }],
    data: { order }
  };
}

async function handleStoreQuery(query) {
  const storeService = require('../utils/storeService');
  const stores = await storeService.getAllStores();
  
  if (stores.length > 0) {
    const store = stores[0];
    return {
      response: `门店信息：\\n名称：${store.name}\\n地址：${store.address}\\n营业时间：${store.hours}\\n\\n期待您的光临！`,
      actions: [{ type: 'show_store', data: store }],
      data: { store }
    };
  }
  
  return {
    response: '暂无门店信息，请联系商家。',
    actions: [],
    data: {}
  };
}

async function handleWifiQuery() {
  const wifiService = require('../utils/wifiService');
  const wifi = await wifiService.getWifiPassword();
  
  return {
    response: `WiFi信息：\\n名称：${wifi.ssid}\\n密码：${wifi.password}\\n\\n祝您用餐愉快！`,
    actions: [{ type: 'show_wifi', data: wifi }],
    data: { wifi }
  };
}

async function handlePriceQuery(query) {
  const dishName = extractDishName(query);
  
  if (dishName) {
    const dishes = await dishesService.getAllDishes();
    const dish = dishes.find(d => 
      d.name.includes(dishName) || dishName.includes(d.name)
    );
    
    if (dish) {
      return {
        response: `「${dish.name}」的价格是${dish.price}元${dish.priceUnit || '/份'}。\\n${dish.description || ''}`,
        actions: [],
        data: { dish }
      };
    }
  }
  
  return {
    response: '请告诉我您想查询价格的菜品名称。',
    actions: [],
    data: {}
  };
}

function extractDishName(query) {
  const patterns = [
    /来?一?份?(.+?)(?:多少钱|价格|多少)/,
    /加?一?份?(.+?)(?:可以吗|谢谢|好)/,
    /(?:点|要)(.+?)(?:吧|呢|好)/
  ];
  
  for (const pattern of patterns) {
    const match = query.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
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
