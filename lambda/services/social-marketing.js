/**
 * Restaurant Social SaaS - 菜品营销系统
 * 功能：AI菜品图片分析、自动生成海报/文案、社交媒体发布
 */

class SocialMarketingService {
  constructor() {
    this.marketingTemplates = this.initTemplates();
    this.postHistory = [];
    this.platforms = ['wechat', 'weibo', 'douyin', 'xiaohongshu'];
  }

  initTemplates() {
    return {
      newDish: [
        '🍳 新品上市！{dishName} 新鲜出炉，{dishDesc} 快来品尝吧！',
        '✨ 今日推荐 {dishName}！{dishDesc} 限时优惠{discount}！',
        '🔥 热门菜品 {dishName}！{dishDesc} 错过等一年！'
      ],
      promotion: [
        '🎉 {promotionTitle}！{promotionDesc} 快来参与吧！',
        '💰 {discount} 优惠活动！{promotionDesc} 仅限{days}天！',
        '🎁 {promotionTitle}！消费满{amount}送{gift}！'
      ],
      holiday: [
        '🎊 {holiday}快乐！今日特供 {specialDish}！',
        '✨ {holiday}特惠！全场{discount}！',
        '🎉 欢度{holiday}！到店即送{gift}！'
      ],
      daily: [
        '☀️ 今日推荐：{dishName}，{dishDesc}',
        '🌙 晚间特惠：{dishName}，{discount}',
        '🍽️ 今日特色：{dishName}，{dishDesc}'
      ]
    };
  }

  /**
   * AI菜品图片分析（模拟）
   */
  analyzeDishImage(imageData) {
    const dishTypes = ['热菜', '凉菜', '汤品', '主食', '甜点', '饮品'];
    const ingredients = ['鸡肉', '牛肉', '猪肉', '蔬菜', '海鲜', '豆腐', '鸡蛋'];
    const tastes = ['麻辣', '鲜香', '酸甜', '清淡', '咸香', '香辣'];

    const randomDishType = dishTypes[Math.floor(Math.random() * dishTypes.length)];
    const randomIngredients = ingredients
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const randomTaste = tastes[Math.floor(Math.random() * tastes.length)];

    return {
      success: true,
      dishType: randomDishType,
      ingredients: randomIngredients,
      taste: randomTaste,
      attractivenessScore: Math.floor(Math.random() * 20) + 80, // 80-100
      recommendedTags: [randomDishType, randomTaste, ...randomIngredients],
      suggestedPrice: Math.floor(Math.random() * 30) + 20, // 20-50
      analysis: `这是一道${randomTaste}口味的${randomDishType}，主要食材包括${randomIngredients.join('、')}，视觉吸引力${randomDishType.includes('甜点') || randomDishType.includes('饮品') ? '极佳' : '良好'}，适合作为${randomDishType.includes('汤') || randomDishType.includes('甜点') ? '餐后' : '主菜'}推荐。`
    };
  }

  /**
   * 自动生成营销文案
   */
  generateMarketingContent(options) {
    const {
      type = 'newDish',
      dishName,
      dishDesc = '美味可口',
      discount = '8折',
      promotionTitle = '限时特惠',
      promotionDesc = '超值优惠',
      days = 7,
      amount = 100,
      gift = '精美小食',
      holiday = '节日',
      specialDish = '特色菜品'
    } = options;

    const templates = this.marketingTemplates[type];
    if (!templates) {
      return {
        success: false,
        error: '不支持的营销类型'
      };
    }

    const template = templates[Math.floor(Math.random() * templates.length)];
    let content = template
      .replace(/{dishName}/g, dishName || '特色菜品')
      .replace(/{dishDesc}/g, dishDesc)
      .replace(/{discount}/g, discount)
      .replace(/{promotionTitle}/g, promotionTitle)
      .replace(/{promotionDesc}/g, promotionDesc)
      .replace(/{days}/g, days)
      .replace(/{amount}/g, amount)
      .replace(/{gift}/g, gift)
      .replace(/{holiday}/g, holiday)
      .replace(/{specialDish}/g, specialDish);

    const hashtags = this.generateHashtags(options);

    return {
      success: true,
      type,
      content,
      hashtags,
      platforms: this.platforms,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 生成话题标签
   */
  generateHashtags(options) {
    const baseTags = ['#美食', '#餐饮', '#餐厅推荐'];
    const typeTags = {
      newDish: ['#新品上市', '#美食推荐'],
      promotion: ['#优惠活动', '#限时特惠'],
      holiday: ['#节日特惠', '#庆祝活动'],
      daily: ['#今日推荐', '#美食日常']
    };

    const tags = [...baseTags, ...(typeTags[options.type] || [])];

    if (options.dishName) {
      tags.push(`#${options.dishName}`);
    }

    return tags.slice(0, 8); // 最多8个标签
  }

  /**
   * 生成海报内容配置
   */
  generatePosterConfig(options) {
    const colorSchemes = [
      { primary: '#FF6B35', secondary: '#F7931E', accent: '#FFD23F' },
      { primary: '#2EC4B6', secondary: '#004E89', accent: '#00A8E8' },
      { primary: '#E63946', secondary: '#1D3557', accent: '#457B9D' },
      { primary: '#2A9D8F', secondary: '#264653', accent: '#8AC926' }
    ];

    const scheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)];

    return {
      success: true,
      title: options.title || options.dishName || '美食推荐',
      subtitle: options.subtitle || options.dishDesc || '美味佳肴',
      price: options.price || '¥' + (Math.floor(Math.random() * 30) + 20),
      discount: options.discount || '限时特惠',
      colorScheme: scheme,
      layout: Math.floor(Math.random() * 3) + 1, // 1-3种布局
      qrCode: true,
      storeInfo: {
        name: '雨姗AI餐厅',
        address: '美食街88号',
        phone: '400-888-8888'
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 模拟发布到社交媒体
   */
  publishToSocial(options) {
    const { platform, content, hashtags, imageData } = options;

    if (!this.platforms.includes(platform)) {
      return {
        success: false,
        error: '不支持的平台'
      };
    }

    const post = {
      id: Date.now().toString(),
      platform,
      content: content + ' ' + hashtags.join(' '),
      status: 'published',
      publishedAt: new Date().toISOString(),
      views: Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 200),
      comments: Math.floor(Math.random() * 50),
      shares: Math.floor(Math.random() * 30)
    };

    this.postHistory.push(post);

    return {
      success: true,
      post,
      message: `成功发布到 ${this.getPlatformName(platform)}`
    };
  }

  getPlatformName(platform) {
    const names = {
      wechat: '微信朋友圈',
      weibo: '微博',
      douyin: '抖音',
      xiaohongshu: '小红书'
    };
    return names[platform] || platform;
  }

  /**
   * 获取发布历史
   */
  getPostHistory(limit = 10) {
    return {
      success: true,
      posts: this.postHistory.slice(-limit).reverse(),
      total: this.postHistory.length
    };
  }

  /**
   * 获取营销数据统计
   */
  getMarketingStats() {
    const totalViews = this.postHistory.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalLikes = this.postHistory.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalComments = this.postHistory.reduce((sum, p) => sum + (p.comments || 0), 0);

    const platformStats = {};
    this.platforms.forEach(p => {
      platformStats[p] = {
        posts: this.postHistory.filter(h => h.platform === p).length,
        views: this.postHistory.filter(h => h.platform === p).reduce((sum, h) => sum + (h.views || 0), 0),
        likes: this.postHistory.filter(h => h.platform === p).reduce((sum, h) => sum + (h.likes || 0), 0)
      };
    });

    return {
      success: true,
      totalPosts: this.postHistory.length,
      totalViews,
      totalLikes,
      totalComments,
      platformStats,
      bestPlatform: Object.entries(platformStats).sort((a, b) => b[1].views - a[1].views)[0]?.[0] || 'wechat',
      engagementRate: totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100).toFixed(1) + '%' : '0%'
    };
  }

  /**
   * 获取智能营销建议
   */
  getSmartMarketingSuggestions() {
    const hour = new Date().getHours();
    const day = new Date().getDay();

    const suggestions = [];

    // 时间建议
    if (hour >= 7 && hour < 10) {
      suggestions.push({
        type: 'time_based',
        priority: 'high',
        suggestion: '现在是早餐时间，建议发布早餐相关营销内容',
        recommendedDish: '豆浆油条套餐',
        bestPlatform: 'wechat'
      });
    } else if (hour >= 11 && hour < 14) {
      suggestions.push({
        type: 'time_based',
        priority: 'high',
        suggestion: '午餐高峰，建议发布午餐套餐优惠',
        recommendedDish: '招牌套餐',
        bestPlatform: 'douyin'
      });
    } else if (hour >= 17 && hour < 21) {
      suggestions.push({
        type: 'time_based',
        priority: 'high',
        suggestion: '晚餐时间，推荐发布特色菜品',
        recommendedDish: '招牌菜',
        bestPlatform: 'xiaohongshu'
      });
    }

    // 周末建议
    if (day === 0 || day === 6) {
      suggestions.push({
        type: 'weekend',
        priority: 'medium',
        suggestion: '周末客流量大，建议发布家庭/朋友聚餐套餐',
        recommendedDish: '全家福套餐',
        bestPlatform: 'weibo'
      });
    }

    // 数据驱动建议
    const stats = this.getMarketingStats();
    if (stats.bestPlatform) {
      suggestions.push({
        type: 'data_driven',
        priority: 'medium',
        suggestion: `${this.getPlatformName(stats.bestPlatform)} 表现最好，建议增加发布频率`,
        bestPlatform: stats.bestPlatform
      });
    }

    return {
      success: true,
      suggestions,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = SocialMarketingService;
