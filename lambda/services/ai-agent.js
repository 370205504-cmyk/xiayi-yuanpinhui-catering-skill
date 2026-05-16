/**
 * AI主动技能 v2.0
 * 主动迎宾、主动推荐、主动提醒、主动关怀
 */

class AIAgent {
  constructor() {
    this.greetings = {
      morning: [
        '早上好！来份早餐开启美好一天吧~',
        '早安！我们已经准备好了新鲜的早餐~'
      ],
      lunch: [
        '中午好！午餐推荐我们的招牌套餐~',
        '午餐时间到！要不要来份实惠的午餐？'
      ],
      afternoon: [
        '下午好！来份下午茶休息一下吧~',
        '下午茶时间！推荐您试试我们的甜点~'
      ],
      dinner: [
        '晚上好！晚餐推荐我们的特色菜~',
        '晚餐时间！招牌菜等着您~'
      ]
    };
    
    this.recommendations = {
      popular: [
        '今天的招牌菜「宫保鸡丁」卖得特别好，您要不要试试？',
        '「鱼香肉丝」是今日点击率最高的菜品，推荐您尝尝！',
        '「红烧肉」是我们家的经典菜品，很多回头客都点这个~'
      ],
      combo: [
        '2人套餐只要68元，比单点省17元，很划算哦~',
        '3人套餐98元，包含三菜一汤，够吃又实惠~',
        '单人简餐32元，适合一个人用餐~'
      ],
      seasonal: [
        '天冷了，来份热气腾腾的砂锅菜暖暖身子~',
        '夏天来了，推荐您试试我们的凉菜，清爽开胃~',
        '秋天正是吃蟹的季节，要不要来份蟹菜？'
      ]
    };
    
    this.reminders = {
      dietary: [
        '我记得您不吃{dislike}，会特别注意的~',
        '您喜欢{like}，这次给您推荐同类型的菜品~'
      ],
      promotion: [
        '温馨提示：今天有满100减15的优惠活动哦~',
        '会员日双倍积分，今天消费积分翻倍~',
        '新用户首单立减10元，首次使用很划算~'
      ],
      order: [
        '您的订单已开始制作，预计15分钟后上菜~',
        '您的菜正在烹饪中，请稍候~',
        '您的餐已准备好，请到取餐口取餐~'
      ]
    };
  }

  /**
   * 获取欢迎消息
   */
  getWelcomeMessage(customerInfo = {}) {
    const timeOfDay = this.getTimeOfDay();
    const greetingList = this.greetings[timeOfDay] || this.greetings.lunch;
    const greeting = greetingList[Math.floor(Math.random() * greetingList.length)];
    
    if (customerInfo.isReturning) {
      return `欢迎回来！${greeting}`;
    }
    
    return greeting;
  }

  /**
   * 获取时间场景
   */
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) {
      return 'morning';
    } else if (hour >= 11 && hour < 14) {
      return 'lunch';
    } else if (hour >= 14 && hour < 18) {
      return 'afternoon';
    } else {
      return 'dinner';
    }
  }

  /**
   * 主动推荐
   */
  getRecommendation(customerProfile = {}) {
    const recommendationList = this.recommendations.popular;
    return recommendationList[Math.floor(Math.random() * recommendationList.length)];
  }

  /**
   * 获取套餐推荐
   */
  getComboRecommendation(peopleCount = 2) {
    if (peopleCount === 1) {
      return this.recommendations.combo[2];
    } else if (peopleCount === 2) {
      return this.recommendations.combo[0];
    } else if (peopleCount >= 3) {
      return this.recommendations.combo[1];
    }
    return this.recommendations.combo[0];
  }

  /**
   * 获取季节性推荐
   */
  getSeasonalRecommendation() {
    const seasonalList = this.recommendations.seasonal;
    const season = this.getCurrentSeason();
    return seasonalList[season] || seasonalList[0];
  }

  /**
   * 获取当前季节
   */
  getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) {
      return 0;
    } else if (month >= 6 && month <= 8) {
      return 1;
    } else if (month >= 9 && month <= 11) {
      return 2;
    } else {
      return 0;
    }
  }

  /**
   * 主动提醒忌口
   */
  getDietaryReminder(customerProfile) {
    const reminders = [];
    
    if (customerProfile?.preferences?.dislikes?.length > 0) {
      const dislike = customerProfile.preferences.dislikes[0];
      const reminderTemplate = this.reminders.dietary[0];
      reminders.push(reminderTemplate.replace('{dislike}', dislike));
    }
    
    if (customerProfile?.preferences?.tastes?.length > 0) {
      const like = customerProfile.preferences.tastes[0];
      const reminderTemplate = this.reminders.dietary[1];
      reminders.push(reminderTemplate.replace('{like}', like));
    }
    
    return reminders;
  }

  /**
   * 获取优惠提醒
   */
  getPromotionReminder() {
    const reminderList = this.reminders.promotion;
    return reminderList[Math.floor(Math.random() * reminderList.length)];
  }

  /**
   * 获取订单状态提醒
   */
  getOrderReminder(status) {
    return this.getOrderStatusUpdate(status);
  }

  /**
   * 订单状态主动推送
   */
  getOrderStatusUpdate(orderStatus) {
    const statusMessages = {
      'CONFIRMED': '您的订单已确认，厨房正在准备中...',
      'COOKING': '您的菜正在烹饪中，请稍候！',
      'READY': '您的餐准备好了！请到前台取餐！',
      'COMPLETED': '您的订单已完成，感谢您的惠顾！',
      'CANCELLED': '您的订单已取消，欢迎下次光临~'
    };
    return statusMessages[orderStatus] || '您的订单正在处理中';
  }

  /**
   * 根据时间场景化推荐
   */
  getTimeBasedRecommendation() {
    const hour = new Date().getHours();
    if (hour >= 7 && hour < 10) {
      return '现在是早餐时间，推荐试试我们的豆浆油条套餐！';
    } else if (hour >= 11 && hour < 14) {
      return '现在是午餐高峰，推荐您点我们的招牌套餐！';
    } else if (hour >= 17 && hour < 21) {
      return '晚餐时间到！可以试试我们的特色菜！';
    }
    return '来份小吃或饮品放松一下吧！';
  }

  /**
   * 获取顾客关怀消息
   */
  getCustomerCareMessage(customerProfile) {
    const careMessages = [];
    
    if (customerProfile?.orderHistory?.length > 0) {
      careMessages.push('感谢您再次光临！');
    }
    
    if (customerProfile?.totalSpent > 500) {
      careMessages.push('您是我们的VIP顾客，感谢长期支持！');
    }
    
    if (customerProfile?.birthday) {
      const today = new Date();
      const birthday = new Date(customerProfile.birthday);
      if (today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate()) {
        careMessages.push('🎂 生日快乐！今天享受菜品8折优惠，还送长寿面一份~');
      }
    }
    
    return careMessages.length > 0 ? careMessages[0] : null;
  }

  /**
   * 获取节日祝福
   */
  getHolidayGreeting() {
    const month = new Date().getMonth() + 1;
    const day = new Date().getDate();
    
    const holidays = {
      '1-1': '🎉 新年快乐！祝您新的一年万事如意！',
      '1-28': '🧧 春节快乐！祝您新春大吉！',
      '2-14': '💕 情人节快乐！和心爱的人一起享用美食吧~',
      '5-1': '🌟 劳动节快乐！致敬每一位努力的人！',
      '5-10': '🌸 母亲节快乐！带妈妈来吃顿好的吧~',
      '6-1': '🎈 儿童节快乐！大朋友小朋友都有优惠哦~',
      '6-20': '💝 父亲节快乐！带爸爸来吃顿大餐吧~',
      '8-15': '🌕 中秋节快乐！月圆人团圆~',
      '10-1': '🎊 国庆节快乐！祝祖国繁荣昌盛！',
      '12-24': '🎄 平安夜快乐！今晚有特别优惠~',
      '12-25': '🎁 圣诞节快乐！节日快乐！'
    };
    
    const holidayKey = `${month}-${day}`;
    return holidays[holidayKey] || null;
  }

  /**
   * 获取智能复购提醒
   */
  getRepeatOrderReminder(customerProfile) {
    if (!customerProfile?.orderHistory?.length) {
      return null;
    }
    
    const lastOrder = customerProfile.orderHistory[0];
    if (!lastOrder?.timestamp) {
      return null;
    }
    
    const daysSinceLastOrder = Math.floor(
      (Date.now() - new Date(lastOrder.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastOrder >= 7) {
      return `您已经${daysSinceLastOrder}天没来了，上次点的「${lastOrder.items?.[0]?.name || '菜品'}」很受欢迎，要不要再来一份？`;
    }
    
    return null;
  }

  /**
   * 获取升级提醒
   */
  getUpgradeReminder(customerProfile) {
    if (!customerProfile?.totalSpent) {
      return null;
    }
    
    const totalSpent = customerProfile.totalSpent;
    
    if (totalSpent < 1000) {
      const remaining = 1000 - totalSpent;
      return `再消费${remaining}元即可升级为银卡会员，享受9.5折优惠~`;
    } else if (totalSpent < 5000) {
      const remaining = 5000 - totalSpent;
      return `再消费${remaining}元即可升级为金卡会员，享受9折优惠~`;
    }
    
    return null;
  }

  /**
   * 获取结账提醒
   */
  getCheckoutReminder(total, paymentMethods = []) {
    let reminder = `您的消费共${total}元`;
    
    if (paymentMethods.includes('会员卡')) {
      reminder += '，使用会员卡可享受折扣~';
    }
    
    if (total >= 100) {
      reminder += '\n温馨提示：消费满100元可免2小时停车费哦~';
    }
    
    return reminder;
  }

  /**
   * 获取服务满意度调查
   */
  getSatisfactionSurvey() {
    return '请问今天的用餐体验如何？有什么建议吗？';
  }

  /**
   * 获取告别消息
   */
  getGoodbyeMessage(customerInfo = {}) {
    const goodbyeMessages = [
      '感谢光临！祝您用餐愉快~欢迎下次再来！',
      '祝您用餐愉快！期待下次为您服务~',
      '再见！祝您一天好心情~'
    ];
    
    const message = goodbyeMessages[Math.floor(Math.random() * goodbyeMessages.length)];
    
    if (customerInfo?.orderNo) {
      return `您的订单号是${customerInfo.orderNo}，请保存好哦~\n\n${message}`;
    }
    
    return message;
  }

  /**
   * 生成完整推荐消息
   */
  generateRecommendationMessage(customerProfile = {}, cart = []) {
    const messages = [];
    
    if (customerProfile.visitCount === 0) {
      messages.push(this.getWelcomeMessage({ isReturning: false }));
    } else {
      const careMsg = this.getCustomerCareMessage(customerProfile);
      if (careMsg) {
        messages.push(careMsg);
      }
      
      const repeatMsg = this.getRepeatOrderReminder(customerProfile);
      if (repeatMsg) {
        messages.push(repeatMsg);
      }
    }
    
    if (cart.length === 0) {
      messages.push(this.getTimeBasedRecommendation());
    } else {
      const promotionMsg = this.getPromotionReminder();
      messages.push(promotionMsg);
    }
    
    const upgradeMsg = this.getUpgradeReminder(customerProfile);
    if (upgradeMsg) {
      messages.push(upgradeMsg);
    }
    
    return messages.join('\n\n');
  }
}

module.exports = AIAgent;
