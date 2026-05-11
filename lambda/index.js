'use strict';

const Alexa = require('ask-sdk-core');

// 导入数据
const dishes = require('./data/dishes.json');
const stores = require('./data/stores.json');
const recipes = require('./data/recipes.json');
const customerProfiles = require('./data/customerProfiles.json');

// 导入服务
const OrderService = require('./utils/orderService');
const ReservationService = require('./utils/reservationService');
const StoreService = require('./utils/storeService');
const ShareService = require('./utils/shareService');
const WifiService = require('./utils/wifiService');
const PrinterService = require('./utils/printerService');
const SelfOrderService = require('./utils/selfOrderService');
const RecommendationService = require('./utils/recommendationService');

// 初始化服务
const orderService = new OrderService();
const reservationService = new ReservationService();
const storeService = new StoreService(stores);
const shareService = new ShareService();
const wifiService = new WifiService();
const printerService = new PrinterService();
const selfOrderService = new SelfOrderService();
const recommendationService = new RecommendationService(dishes, customerProfiles);

// ============ Launch Request ============
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = `欢迎使用夏邑缘品荟创味菜！我是您的智能餐饮助手。\n\n开发者：石中伟\n\n您可以：\n\n🎯 智能推荐 - 根据您的喜好推荐菜品\n📜 查看菜单 - 展示完整菜单\n📶 查询WiFi - 获取WiFi密码\n📱 自主下单 - 扫码点餐\n🖨️ 打印服务 - 连接打印机\n🛵 点外卖\n📅 预约堂食\n🏪 查询门店\n\n请问有什么可以帮您的？`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// ============ 智能推荐意图 ============
const SmartRecommendIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput) === 'SmartRecommendIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    const preference = slots.Preference?.value;
    const history = slots.History?.value;
    const customerId = slots.CustomerId?.value || 'guest';
    
    // 获取或创建客户档案
    let customerProfile = recommendationService.getCustomerProfile(customerId);
    
    // 根据用户偏好进行推荐
    let recommendedDishes = [];
    
    if (preference) {
      // 根据偏好推荐
      recommendedDishes = recommendationService.recommendByPreference(
        preference, 
        customerProfile
      );
      
      // 更新客户偏好
      recommendationService.updateCustomerPreference(customerId, preference);
    } else if (history) {
      // 根据历史推荐
      recommendedDishes = recommendationService.recommendByHistory(
        history, 
        customerProfile
      );
    } else {
      // 综合推荐
      recommendedDishes = recommendationService.getComprehensiveRecommendation(
        customerProfile
      );
    }
    
    if (recommendedDishes.length === 0) {
      // 如果没有偏好，返回随机推荐
      recommendedDishes = [dishes[Math.floor(Math.random() * dishes.length)]];
    }
    
    const dish = recommendedDishes[0];
    
    // 保存推荐记录
    handlerInput.attributesManager.setSessionAttributes({
      recommendedDish: dish,
      customerId: customerId,
      lastIntent: 'SmartRecommendIntent'
    });
    
    const speakOutput = `根据您的${preference ? '喜好' : history ? '历史记录' : '口味'}\n\n为您推荐：${dish.name}！\n\n这是一道${dish.cuisine}，口味${dish.taste}，难度${dish.difficulty}，价格${dish.price}元。\n\n主要食材：${dish.ingredients.slice(0, 3).join('、')}等\n\n${dish.canDeliver ? '✅ 支持外卖' : '❌ 暂不支持外卖'}\n${dish.isSignature ? '⭐ 招牌菜' : ''}\n${dish.isVegetarian ? '🥬 素菜' : ''}\n${dish.forKids ? '👶 适合儿童' : ''}\n\n需要我帮您：\n1. 显示菜单详情\n2. 点这道菜\n3. 推荐其他菜品\n4. 扫码自主下单`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('请问您想怎么做？')
      .getResponse();
  }
};

// ============ 显示菜单意图 ============
const ShowMenuIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput) === 'ShowMenuIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    const category = slots.Category?.value;
    const dishType = slots.DishType?.value;
    
    let filteredDishes = [...dishes];
    let filterDescription = '';
    
    // 按分类筛选
    if (category) {
      if (category.includes('招牌')) {
        filteredDishes = filteredDishes.filter(d => d.isSignature);
        filterDescription = '招牌菜';
      } else if (category.includes('素') || category.includes('斋')) {
        filteredDishes = filteredDishes.filter(d => d.isVegetarian);
        filterDescription = '素菜';
      } else if (category.includes('儿童') || category.includes('小孩')) {
        filteredDishes = filteredDishes.filter(d => d.forKids);
        filterDescription = '儿童餐';
      } else if (category.includes('套餐') || category.includes('Combo')) {
        filteredDishes = filteredDishes.filter(d => d.isCombo);
        filterDescription = '套餐';
      }
    }
    
    // 按类型筛选
    if (dishType) {
      if (dishType.includes('凉')) {
        filteredDishes = filteredDishes.filter(d => d.type === 'cold');
        filterDescription += '凉菜';
      } else if (dishType.includes('热') || dishType.includes('主')) {
        filteredDishes = filteredDishes.filter(d => d.type === 'hot');
        filterDescription += '热菜';
      } else if (dishType.includes('汤')) {
        filteredDishes = filteredDishes.filter(d => d.type === 'soup');
        filterDescription += '汤品';
      } else if (dishType.includes('主食')) {
        filteredDishes = filteredDishes.filter(d => d.type === 'staple');
        filterDescription += '主食';
      }
    }
    
    // 保存菜单数据
    handlerInput.attributesManager.setSessionAttributes({
      displayedMenu: filteredDishes,
      menuFilter: filterDescription,
      lastIntent: 'ShowMenuIntent'
    });
    
    let speakOutput = filterDescription ? `以下是${filterDescription}菜单：` : '以下是完整菜单：';
    speakOutput += `\n\n共${filteredDishes.length}道菜品\n\n`;
    
    filteredDishes.slice(0, 10).forEach((dish, index) => {
      speakOutput += `${index + 1}. ${dish.name} - ${dish.price}元\n`;
      speakOutput += `   ${dish.taste} | ${dish.difficulty}\n\n`;
    });
    
    if (filteredDishes.length > 10) {
      speakOutput += `...还有${filteredDishes.length - 10}道菜，您可以告诉我想看哪一类`;
    }
    
    speakOutput += `\n\n您可以说「我要点第几个」或者「显示招牌菜」来选择菜品`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('请问您想点什么菜？')
      .getResponse();
  }
};


// ============ WiFi密码意图 ============
const GetWifiPasswordIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput) === 'GetWifiPasswordIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    const storeName = slots.StoreName?.value;
    
    let store;
    
    if (storeName) {
      store = storeService.getStoreByName(storeName);
    } else {
      store = storeService.getNearestStore();
    }
    
    if (!store) {
      return handlerInput.responseBuilder
        .speak('抱歉，没有找到该门店信息。请告诉我您所在的门店名称。')
        .reprompt('请问您在哪家门店？')
        .getResponse();
    }
    
    const wifiInfo = wifiService.getStoreWifi(store.id);
    
    handlerInput.attributesManager.setSessionAttributes({
      currentStore: store,
      lastIntent: 'GetWifiPasswordIntent'
    });
    
    let speakOutput = `${store.name}的WiFi信息：\n\n`;
    speakOutput += `📶 WiFi名称：${wifiInfo.ssid}\n`;
    speakOutput += `🔐 密码：${wifiInfo.password}\n`;
    
    if (wifiInfo.securityType) {
      speakOutput += `🔒 安全类型：${wifiInfo.securityType}\n`;
    }
    
    speakOutput += `\n请连接WiFi后输入密码即可上网。\n\n需要其他帮助吗？`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('请问还需要什么帮助？')
      .getResponse();
  }
};

// ============ 自主下单意图 ============
const SelfOrderIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput) === 'SelfOrderIntent';
  },
  handle(handlerInput) {
    const store = storeService.getNearestStore();
    
    // 生成分店订单二维码
    const orderQRCode = selfOrderService.generateStoreOrderQRCode(store.id);
    const menuQRCode = selfOrderService.generateMenuQRCode(store.id);
    
    handlerInput.attributesManager.setSessionAttributes({
      currentStore: store,
      orderQRCode: orderQRCode,
      menuQRCode: menuQRCode,
      lastIntent: 'SelfOrderIntent'
    });
    
    let speakOutput = `自主下单服务已准备就绪！\n\n请扫描以下二维码进行操作：\n\n📱 点餐二维码：${orderQRCode.url}\n📜 菜单二维码：${menuQRCode.url}\n\n您也可以直接说「我要点川菜」「我要一份宫保鸡丁」来语音下单。\n\n请问需要我帮您做什么？`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('请问需要什么帮助？')
      .getResponse();
  }
};

// ============ 连接打印机意图 ============
const ConnectPrinterIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput) === 'ConnectPrinterIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    const action = slots.PrinterAction?.value;
    
    let printerStatus;
    let speakOutput;
    
    if (action && (action.includes('连接') || action.includes('连接'))) {
      // 连接打印机
      printerStatus = printerService.connectPrinter();
      speakOutput = printerStatus.connected 
        ? `✅ 打印机连接成功！\n\n型号：${printerStatus.printerModel}\n状态：${printerStatus.status}\n\n您现在可以说「打印订单」或「打印小票」了。`
        : `❌ 打印机连接失败。请检查打印机是否开机并处于可发现状态。`;
    } else if (action && (action.includes('状态') || action.includes('状态'))) {
      // 检查状态
      printerStatus = printerService.checkPrinterStatus();
      speakOutput = `打印机状态：\n\n${printerStatus.connected ? '✅ 已连接' : '❌ 未连接'}\n型号：${printerStatus.printerModel || '未知'}\n墨水：${printerStatus.inkLevel || '未知'}\n纸张：${printerStatus.paperLevel || '未知'}`;
    } else if (action && (action.includes('订单') || action.includes('小票'))) {
      // 打印订单
      const sessionAttr = handlerInput.attributesManager.getSessionAttributes();
      const order = sessionAttr.currentOrder;
      
      if (order) {
        const printResult = printerService.printReceipt(order);
        speakOutput = printResult.success 
          ? `✅ 订单小票已发送到打印机，请稍候...`
          : `❌ 打印失败：${printResult.error}`;
      } else {
        speakOutput = `没有找到可打印的订单。请先创建订单。`;
      }
    } else if (action && (action.includes('菜单'))) {
      // 打印菜单
      const printResult = printerService.printMenu(dishes);
      speakOutput = printResult.success 
        ? `✅ 菜单已发送到打印机，请稍候...`
        : `❌ 打印失败：${printResult.error}`;
    } else {
      // 默认检查状态
      printerStatus = printerService.checkPrinterStatus();
      speakOutput = `打印机当前状态：\n\n${printerStatus.connected ? '✅ 已连接' : '❌ 未连接'}\n\n您可以说「连接打印机」「打印订单」或「打印菜单」。`;
    }

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('请问还需要其他帮助吗？')
      .getResponse();
  }
};

// ============ 套餐查询意图 ============
const ShowComboIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput) === 'ShowComboIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    const comboType = slots.ComboType?.value;
    
    // 获取套餐列表
    const combos = recommendationService.getCombos(comboType);
    
    handlerInput.attributesManager.setSessionAttributes({
      displayedCombos: combos,
      lastIntent: 'ShowComboIntent'
    });
    
    if (combos.length === 0) {
      return handlerInput.responseBuilder
        .speak('抱歉，目前没有找到符合条件的套餐。请告诉我您想要的套餐类型，比如单人餐、双人餐或家庭餐。')
        .reprompt('请问您想要什么类型的套餐？')
        .getResponse();
    }
    
    let speakOutput = comboType ? `以下是${comboType}套餐：` : '以下是所有套餐：';
    speakOutput += `\n\n`;
    
    combos.forEach((combo, index) => {
      speakOutput += `📦 套餐${index + 1}：${combo.name}\n`;
      speakOutput += `💰 价格：${combo.price}元（原价值${combo.originalPrice}元）\n`;
      speakOutput += `👥 适合：${combo.forPeople}\n`;
      speakOutput += `🍽️ 包含：${combo.dishes.join('、')}\n\n`;
    });
    
    speakOutput += `您可以说「我要订第几个套餐」来下单。`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('请问您想要哪个套餐？')
      .getResponse();
  }
};

// ============ 菜品推荐意图 ============
const RecommendDishIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput) === 'RecommendDishIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    
    let cuisine = slots.Cuisine?.value;
    let ingredient = slots.Ingredient?.value;
    let taste = slots.Taste?.value;

    let filteredDishes = [...dishes];
    let filters = [];

    if (cuisine) {
      filteredDishes = filteredDishes.filter(d => 
        d.cuisine.toLowerCase().includes(cuisine.toLowerCase())
      );
      filters.push(`菜系：${cuisine}`);
    }

    if (ingredient) {
      filteredDishes = filteredDishes.filter(d => 
        d.ingredients.some(i => i.toLowerCase().includes(ingredient.toLowerCase()))
      );
      filters.push(`食材：${ingredient}`);
    }

    if (taste) {
      filteredDishes = filteredDishes.filter(d => 
        d.taste.toLowerCase().includes(taste.toLowerCase())
      );
      filters.push(`口味：${taste}`);
    }

    if (filteredDishes.length === 0) {
      return handlerInput.responseBuilder
        .speak(`抱歉，根据您的筛选条件（${filters.join('、')}），没有找到合适的菜品。试试其他条件吧！`)
        .reprompt('您可以尝试：推荐一道川菜、用鸡肉做的菜、或者辣一点的菜')
        .getResponse();
    }

    const dish = filteredDishes[Math.floor(Math.random() * filteredDishes.length)];
    
    handlerInput.attributesManager.setSessionAttributes({
      recommendedDish: dish,
      lastIntent: 'RecommendDishIntent'
    });

    const speakOutput = `为您推荐：${dish.name}！\n\n这是一道${dish.cuisine}，口味${dish.taste}，难度${dish.difficulty}，价格${dish.price}元。\n\n${dish.canDeliver ? '✅ 支持外卖' : '❌ 暂不支持外卖'}\n\n需要我帮您：\n1. 显示菜单详情\n2. 点这道菜\n3. 推荐其他菜品`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('请问您想怎么做？')
      .getResponse();
  }
};

// ============ 随机推荐意图 ============
const RandomDishIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput) === 'RandomDishIntent';
  },
  handle(handlerInput) {
    const dish = dishes[Math.floor(Math.random() * dishes.length)];
    
    handlerInput.attributesManager.setSessionAttributes({
      recommendedDish: dish,
      lastIntent: 'RandomDishIntent'
    });

    const speakOutput = `今天的随机推荐是：${dish.name}！\n\n这是一道${dish.cuisine}，口味${dish.taste}，难度${dish.difficulty}，价格${dish.price}元。\n\n这道菜怎么样？需要我帮您做什么？`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('请问您想怎么做？')
      .getResponse();
  }
};

// ============ 菜单生成意图 ============
const GenerateMenuIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput) === 'GenerateMenuIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    
    const mealType = slots.MealType?.value || 'all';
    const personCount = parseInt(slots.PersonCount?.value) || 2;

    const menu = recommendationService.generateMenuForPeople(personCount, mealType);

    let speakOutput = `${personCount}人的菜单已为您准备好！\n\n`;

    if (menu.breakfast && menu.breakfast.length > 0) {
      speakOutput += `🌅 早餐：${menu.breakfast.map(d => d.name).join('、')}\n\n`;
    }
    if (menu.lunch && menu.lunch.length > 0) {
      speakOutput += `☀️ 午餐：${menu.lunch.map(d => d.name).join('、')}\n\n`;
    }
    if (menu.dinner && menu.dinner.length > 0) {
      speakOutput += `🌙 晚餐：${menu.dinner.map(d => d.name).join('、')}\n\n`;
    }

    speakOutput += `总价格：约${menu.totalPrice}元\n\n`;
    speakOutput += `请问需要我帮您：\n1. 点外卖\n2. 预约堂食\n3. 查看某个菜的详细做法\n4. 显示菜单`;

    handlerInput.attributesManager.setSessionAttributes({
      generatedMenu: menu,
      personCount: personCount,
      lastIntent: 'GenerateMenuIntent'
    });

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('请问需要我帮您做什么？')
      .getResponse();
  }
};

// ============ 菜谱查询意图 ============
const GetRecipeIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput) === 'GetRecipeIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    const dishName = slots.DishName?.value;
    
    let dish;
    let recipe;

    if (!dishName) {
      const sessionAttr = handlerInput.attributesManager.getSessionAttributes();
      dish = sessionAttr.recommendedDish;
    } else {
      dish = dishes.find(d => 
        d.name.toLowerCase().includes(dishName.toLowerCase())
      );
    }

    if (!dish) {
      return handlerInput.responseBuilder
        .speak(`抱歉，没有找到您想要的菜品。您可以说「告诉我宫保鸡丁的做法」或者「我想学做川菜」。`)
        .reprompt('请告诉我您想学做的菜品名称')
        .getResponse();
    }

    recipe = recipes.find(r => r.dishId === dish.id);

    handlerInput.attributesManager.setSessionAttributes({
      currentDish: dish,
      currentRecipe: recipe,
      lastIntent: 'GetRecipeIntent'
    });

    let speakOutput = `${dish.name}的做法如下：\n\n`;
    
    if (recipe) {
      speakOutput += `📝 主要食材：${dish.ingredients.join('、')}\n\n`;
      speakOutput += `📖 步骤：\n`;
      recipe.steps.forEach((step, index) => {
        speakOutput += `第${index + 1}步：${step}\n`;
      });
      
      if (recipe.tips && recipe.tips.length > 0) {
        speakOutput += `\n💡 小贴士：${recipe.tips.join('；')}`;
      }
    } else {
      speakOutput += `主要食材：${dish.ingredients.join('、')}\n`;
      speakOutput += `这是一道${dish.cuisine}，口味${dish.taste}。\n`;
    }

    speakOutput += `\n\n需要我帮您：\n1. 点这道菜\n2. 显示菜单\n3. 推荐其他菜品`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('请问还需要什么帮助？')
      .getResponse();
  }
};

// ============ 门店查询意图 ============
const FindStoreIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput) === 'FindStoreIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    const location = slots.Location?.value;
    const storeName = slots.StoreName?.value;

    let filteredStores = storeService.getAllStores();

    if (location) {
      filteredStores = storeService.getStoresByDistrict(location);
    }

    if (storeName) {
      filteredStores = filteredStores.filter(s => 
        s.name.toLowerCase().includes(storeName.toLowerCase())
      );
    }

    if (filteredStores.length === 0) {
      return handlerInput.responseBuilder
        .speak(`抱歉，在您指定的区域没有找到门店。`)
        .reprompt('请问您想查询哪个区域的门店？')
        .getResponse();
    }

    handlerInput.attributesManager.setSessionAttributes({
      foundStores: filteredStores,
      lastIntent: 'FindStoreIntent'
    });

    let speakOutput = `找到了${filteredStores.length}家门店：\n\n`;
    
    filteredStores.forEach((store, index) => {
      speakOutput += `🏪 ${store.name}\n`;
      speakOutput += `📍 地址：${store.address}\n`;
      speakOutput += `📞 电话：${store.phone}\n`;
      speakOutput += `🕐 营业时间：${store.businessHours}\n`;
      speakOutput += `📶 WiFi：${store.hasWifi ? '✅ 支持' : '❌ 不支持'}\n`;
      speakOutput += `🖨️ 打印机：${store.hasPrinter ? '✅ 支持' : '❌ 不支持'}\n`;
      speakOutput += `${store.canDeliver ? '✅ 支持外卖' : '❌ 暂不支持外卖'}\n\n`;
    });

    speakOutput += `请问需要我帮您：\n1. 点外卖\n2. 预约座位\n3. 查询WiFi密码`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('请问还需要什么帮助？')
      .getResponse();
  }
};

// ============ 外卖点餐意图 ============
const OrderFoodIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput) === 'OrderFoodIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    const dishName = slots.DishName?.value;
    const quantity = parseInt(slots.Quantity?.value) || 1;
    const address = slots.Address?.value;

    let dish;
    
    if (!dishName) {
      const sessionAttr = handlerInput.attributesManager.getSessionAttributes();
      dish = sessionAttr.recommendedDish || sessionAttr.currentDish;
    } else {
      dish = dishes.find(d => 
        d.name.toLowerCase().includes(dishName.toLowerCase())
      );
    }

    if (!dish) {
      return handlerInput.responseBuilder
        .speak(`抱歉，没有找到您想要的菜品。请先告诉我您想点什么菜。`)
        .reprompt('请告诉我您想点的菜品名称')
        .getResponse();
    }

    if (!dish.canDeliver) {
      return handlerInput.responseBuilder
        .speak(`抱歉，${dish.name}暂不支持外卖配送。您可以到店品尝，或者选择其他支持外卖的菜品。`)
        .reprompt('请问您想点其他菜品吗？')
        .getResponse();
    }

    if (!address) {
      handlerInput.attributesManager.setSessionAttributes({
        pendingOrder: {
          dish: dish,
          quantity: quantity,
          status: 'awaiting_address'
        },
        lastIntent: 'OrderFoodIntent'
      });

      return handlerInput.responseBuilder
        .speak(`${dish.name} ${quantity}份，确认下单！\n\n请问您的配送地址是？`)
        .reprompt('请告诉我您的配送地址')
        .getResponse();
    }

    const order = orderService.createOrder({
      dish: dish,
      quantity: quantity,
      address: address,
      customerPhone: '用户手机号',
      storeId: storeService.getNearestStore()?.id
    });

    handlerInput.attributesManager.setSessionAttributes({
      currentOrder: order,
      lastIntent: 'OrderFoodIntent'
    });

    // 自动打印小票
    printerService.printReceipt(order);

    let speakOutput = `✅ 订单创建成功！\n\n订单号：${order.orderId}\n菜品：${dish.name} x ${quantity}\n金额：¥${order.totalPrice}\n配送地址：${address}\n\n小票已发送至打印机。\n\n请问还需要其他帮助吗？`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('请问还需要其他帮助吗？')
      .getResponse();
  }
};

// ============ 堂食预约意图 ============
const MakeReservationIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput) === 'MakeReservationIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    const date = slots.Date?.value;
    const time = slots.Time?.value;
    const personCount = parseInt(slots.PersonCount?.value) || 2;

    if (!date || !time) {
      handlerInput.attributesManager.setSessionAttributes({
        pendingReservation: {
          personCount: personCount,
          status: 'awaiting_details'
        },
        lastIntent: 'MakeReservationIntent'
      });

      let question = '好的，我来帮您预约！';
      if (!date) question += '请问您想预约哪一天？';
      else question += `预约日期是${date}，`;
      
      if (!time) question += '请问想预约几点？';
      
      return handlerInput.responseBuilder
        .speak(question)
        .reprompt('请告诉我预约的日期和时间')
        .getResponse();
    }

    const reservation = reservationService.createReservation({
      date: date,
      time: time,
      personCount: personCount,
      storeId: storeService.getNearestStore()?.id,
      customerPhone: '用户手机号'
    });

    if (!reservation.success) {
      return handlerInput.responseBuilder
        .speak(`抱歉，${reservation.message}。请您选择其他时间。`)
        .reprompt('请问您想选择其他时间吗？')
        .getResponse();
    }

    handlerInput.attributesManager.setSessionAttributes({
      currentReservation: reservation,
      lastIntent: 'MakeReservationIntent'
    });

    let speakOutput = `✅ 预约成功！\n\n预约号：${reservation.reservationId}\n日期：${date}\n时间：${time}\n人数：${personCount}人\n门店：${reservation.storeName}\n\n请您按时到店，到店后出示预约号即可。\n\n请问还需要其他帮助吗？`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('请问还需要其他帮助吗？')
      .getResponse();
  }
};

// ============ 社交分享意图 ============
const ShareDishIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput) === 'ShareDishIntent';
  },
  handle(handlerInput) {
    const { slots } = handlerInput.requestEnvelope.request.intent;
    const platform = slots.Platform?.value || 'xiaohongshu';
    const dishName = slots.DishName?.value;

    let dish;
    
    if (!dishName) {
      const sessionAttr = handlerInput.attributesManager.getSessionAttributes();
      dish = sessionAttr.recommendedDish || sessionAttr.currentDish;
    } else {
      dish = dishes.find(d => 
        d.name.toLowerCase().includes(dishName.toLowerCase())
      );
    }

    if (!dish) {
      return handlerInput.responseBuilder
        .speak(`抱歉，没有找到您想要分享的菜品。请先推荐或选择一个菜品。`)
        .reprompt('请先告诉我您想分享的菜品名称')
        .getResponse();
    }

    const shareContent = shareService.generateShareContent(dish, platform);
    const shareLink = shareService.generateShareLink(platform, dish.id);

    handlerInput.attributesManager.setSessionAttributes({
      sharedDish: dish,
      sharePlatform: platform,
      lastIntent: 'ShareDishIntent'
    });

    let platformName = platform === 'xiaohongshu' ? '小红书' : 
                       platform === 'wechat' ? '微信' : platform;

    let speakOutput = `📤 已为您生成${platformName}分享内容！\n\n`;
    
    if (platform === 'xiaohongshu') {
      speakOutput += `📝 标题：${shareContent.title}\n`;
      speakOutput += `📖 正文：${shareContent.content}\n\n`;
    } else if (platform === 'wechat') {
      speakOutput += `📝 标题：${shareContent.title}\n`;
      speakOutput += `📖 摘要：${shareContent.summary}\n\n`;
    }
    
    speakOutput += `🔗 分享链接：${shareLink}\n\n`;
    speakOutput += `链接已生成，您可以复制到${platformName}分享给朋友！`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('请问还需要其他帮助吗？')
      .getResponse();
  }
};

// ============ Help Intent ============
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speakOutput = `夏邑缘品荟创味菜可以帮您：\n\n🍳 智能推荐 - 说「我喜欢辣的」\n📜 显示菜单 - 说「给我看看菜单」\n📶 WiFi密码 - 说「WiFi密码是多少」\n📱 自主下单 - 说「我要扫码下单」\n🖨️ 打印服务 - 说「连接打印机」\n🍽️ 菜品推荐 - 说「推荐一道川菜」\n📋 生成菜单 - 说「帮我安排午餐菜单」\n📖 菜谱查询 - 说「告诉我宫保鸡丁的做法」\n🏪 门店查询 - 说「附近有哪些门店」\n🛵 外卖点餐 - 说「帮我点一份宫保鸡丁」\n📅 堂食预约 - 说「我想预约明天晚上6点」\n📤 社交分享 - 说「分享到小红书」\n🎲 随机推荐 - 说「随机推荐一道菜」\n\n开发者：石中伟\n\n请问有什么可以帮您？`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// ============ Cancel/Stop Intent ============
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speakOutput = '感谢使用夏邑缘品荟创味菜！祝您用餐愉快，再见！\n\n开发者：石中伟';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};

// ============ Session Ended Request ============
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  }
};

// ============ Error Handler ============
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    const speakOutput = `抱歉，我遇到了一些问题。请您重新说明您的需求。`;
    
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// ============ Skill Builder ============
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    SmartRecommendIntentHandler,
    ShowMenuIntentHandler,
    GetWifiPasswordIntentHandler,
    SelfOrderIntentHandler,
    ConnectPrinterIntentHandler,
    ShowComboIntentHandler,
    RecommendDishIntentHandler,
    RandomDishIntentHandler,
    GenerateMenuIntentHandler,
    GetRecipeIntentHandler,
    FindStoreIntentHandler,
    OrderFoodIntentHandler,
    MakeReservationIntentHandler,
    ShareDishIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
