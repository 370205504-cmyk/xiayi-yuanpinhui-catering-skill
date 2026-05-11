'use strict';

const Alexa = require('ask-sdk-core');

// 导入数据
const dishes = require('./data/dishes.json');
const stores = require('./data/stores.json');
const recipes = require('./data/recipes.json');

// 导入服务
const OrderService = require('./utils/orderService');
const ReservationService = require('./utils/reservationService');
const StoreService = require('./utils/storeService');
const ShareService = require('./utils/shareService');

// 初始化服务
const orderService = new OrderService();
const reservationService = new ReservationService();
const storeService = new StoreService(stores);
const shareService = new ShareService();

// ============ Launch Request ============
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = `欢迎使用夏邑缘品荟创味菜！我是您的智能餐饮助手。\n
您可以：\n
🎯 推荐一道菜品\n📋 生成菜单规划\n🏪 查询附近门店\n🛵 点外卖\n📅 预约堂食\n📤 分享菜品到社交平台\n\n请问有什么可以帮您的？`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
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
    
    // 保存推荐记录用于后续操作
    handlerInput.attributesManager.setSessionAttributes({
      recommendedDish: dish,
      lastIntent: 'RecommendDishIntent'
    });

    const speakOutput = `为您推荐：${dish.name}！\n\n这是一道${dish.cuisine}，口味${dish.taste}，难度${dish.difficulty}，预计${dish.cookingTime}完成，约${dish.calories}卡路里。\n\n${dish.canDeliver ? '✅ 支持外卖' : '❌ 暂不支持外卖'}\n\n需要我帮您：\n1. 告诉您详细做法\n2. 点外卖\n3. 分享到社交平台\n4. 继续推荐其他菜品`;

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

    const speakOutput = `今天的随机推荐是：${dish.name}！\n\n这是一道${dish.cuisine}，口味${dish.taste}，难度${dish.difficulty}，预计${dish.cookingTime}完成，约${dish.calories}卡路里。\n\n这道菜怎么样？需要我帮您做什么？`;

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

    const menu = {
      breakfast: [],
      lunch: [],
      dinner: []
    };

    // 为每餐推荐合适的菜品
    const getDishesForMeal = (meal) => {
      const suitableDishes = dishes.filter(d => {
        if (meal === 'breakfast') return d.calories < 300;
        if (meal === 'lunch') return true;
        if (meal === 'dinner') return d.calories < 400;
        return true;
      });
      
      const count = Math.min(Math.ceil(personCount / 2) + 1, 3);
      const selected = [];
      
      while (selected.length < count && suitableDishes.length > 0) {
        const randomIndex = Math.floor(Math.random() * suitableDishes.length);
        selected.push(suitableDishes.splice(randomIndex, 1)[0]);
      }
      
      return selected;
    };

    if (mealType === 'breakfast' || mealType === 'all') {
      menu.breakfast = getDishesForMeal('breakfast');
    }
    if (mealType === 'lunch' || mealType === 'all') {
      menu.lunch = getDishesForMeal('lunch');
    }
    if (mealType === 'dinner' || mealType === 'all') {
      menu.dinner = getDishesForMeal('dinner');
    }

    let speakOutput = `${personCount}人的菜单已为您准备好！\n\n`;

    if (menu.breakfast.length > 0) {
      speakOutput += `🌅 早餐：${menu.breakfast.map(d => d.name).join('、')}\n\n`;
    }
    if (menu.lunch.length > 0) {
      speakOutput += `☀️ 午餐：${menu.lunch.map(d => d.name).join('、')}\n\n`;
    }
    if (menu.dinner.length > 0) {
      speakOutput += `🌙 晚餐：${menu.dinner.map(d => d.name).join('、')}\n\n`;
    }

    speakOutput += `请问需要我帮您：\n1. 点外卖\n2. 预约堂食\n3. 查看某个菜的详细做法\n4. 分享菜单到社交平台`;

    // 保存菜单用于后续操作
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

    // 如果没有指定菜品，尝试使用上次推荐的
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
      speakOutput += `详细做法您可以查看我们的官方菜谱。`;
    }

    speakOutput += `\n\n需要我帮您：\n1. 点这道菜的外卖\n2. 分享做法到社交平台\n3. 推荐其他菜品`;

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

    let filteredStores = [...stores];

    if (location) {
      filteredStores = filteredStores.filter(s => 
        s.district.toLowerCase().includes(location.toLowerCase()) ||
        s.area.toLowerCase().includes(location.toLowerCase())
      );
    }

    if (storeName) {
      filteredStores = filteredStores.filter(s => 
        s.name.toLowerCase().includes(storeName.toLowerCase())
      );
    }

    if (filteredStores.length === 0) {
      return handlerInput.responseBuilder
        .speak(`抱歉，在您指定的区域没有找到门店。您可以说「附近有哪些门店」来查看所有门店。`)
        .reprompt('请问您想查询哪个区域的门店？')
        .getResponse();
    }

    // 保存查询结果
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
      speakOutput += `${store.canDeliver ? '✅ 支持外卖' : '❌ 暂不支持外卖'}\n`;
      speakOutput += `${store.canReserve ? '✅ 支持预约' : '❌ 暂不支持预约'}\n`;
      
      if (store.distance) {
        speakOutput += `📏 距离您：约${store.distance}公里\n`;
      }
      
      speakOutput += '\n';
    });

    speakOutput += `请问需要我帮您：\n1. 点外卖\n2. 预约座位\n3. 获取导航指引\n4. 查看其他门店`;

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
    
    // 尝试从会话中获取上次推荐的菜品
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

    // 如果没有地址，需要询问
    if (!address) {
      const sessionAttr = handlerInput.attributesManager.getSessionAttributes();
      const defaultStore = storeService.getNearestStore();
      
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

    // 创建订单
    const order = orderService.createOrder({
      dish: dish,
      quantity: quantity,
      address: address,
      customerPhone: '用户手机号', // 实际应用中从用户资料获取
      storeId: storeService.getNearestStore()?.id
    });

    handlerInput.attributesManager.setSessionAttributes({
      currentOrder: order,
      lastIntent: 'OrderFoodIntent'
    });

    const estimatedTime = orderService.estimateDeliveryTime(address);

    let speakOutput = `✅ 订单创建成功！\n\n订单号：${order.orderId}\n菜品：${dish.name} x ${quantity}\n金额：¥${order.totalPrice}\n配送地址：${address}\n预计送达时间：${estimatedTime}分钟\n\n请问还需要其他帮助吗？`;

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

    // 如果缺少信息，需要询问
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

    // 创建预约
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
    
    // 尝试从会话中获取菜品
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

    // 生成分享内容
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
      speakOutput += `📖 正文：${shareContent.content}\n`;
      speakOutput += `🏷️ 标签：${shareContent.hashtags.join(' ')}\n\n`;
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
    const speakOutput = `夏邑缘品荟创味菜可以帮您：\n\n🍳 菜品推荐 - 说「推荐一道川菜」\n📋 生成菜单 - 说「帮我安排午餐菜单」\n📖 菜谱查询 - 说「告诉我宫保鸡丁的做法」\n🏪 门店查询 - 说「附近有哪些门店」\n🛵 外卖点餐 - 说「帮我点一份宫保鸡丁」\n📅 堂食预约 - 说「我想预约明天晚上6点」\n📤 社交分享 - 说「分享到小红书」\n🎲 随机推荐 - 说「随机推荐一道菜」\n\n请问有什么可以帮您？`;

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
    const speakOutput = '感谢使用夏邑缘品荟创味菜！祝您用餐愉快，再见！';
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
