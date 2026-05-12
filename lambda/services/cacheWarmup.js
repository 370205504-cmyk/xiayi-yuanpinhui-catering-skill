const logger = require('../utils/logger');
const dishesService = require('../services/dishesService');
const storeService = require('../utils/storeService');
const cacheService = require('../services/cacheService');

class CacheWarmup {
  constructor() {
    this.warmupCompleted = false;
  }

  async warmup() {
    if (this.warmupCompleted) {
      logger.info('缓存预热已完成，跳过');
      return;
    }

    logger.info('开始缓存预热...');

    const startTime = Date.now();
    let successCount = 0;
    let failCount = 0;

    try {
      await this.warmupDishes();
      successCount++;
    } catch (error) {
      logger.error('菜品缓存预热失败:', error.message);
      failCount++;
    }

    try {
      await this.warmupStores();
      successCount++;
    } catch (error) {
      logger.error('门店缓存预热失败:', error.message);
      failCount++;
    }

    try {
      await this.warmupCategories();
      successCount++;
    } catch (error) {
      logger.error('分类缓存预热失败:', error.message);
      failCount++;
    }

    try {
      await this.warmupBloomFilter();
      successCount++;
    } catch (error) {
      logger.error('Bloom Filter预热失败:', error.message);
      failCount++;
    }

    try {
      await this.warmupEvents();
      successCount++;
    } catch (error) {
      logger.error('活动缓存预热失败:', error.message);
      failCount++;
    }

    const duration = Date.now() - startTime;
    this.warmupCompleted = true;

    logger.info(`缓存预热完成，耗时${duration}ms，成功${successCount}项，失败${failCount}项`);

    return {
      success: failCount === 0,
      successCount,
      failCount,
      duration
    };
  }

  async warmupDishes() {
    logger.info('预热菜品缓存...');
    
    const dishes = await dishesService.getAllDishes();
    
    await cacheService.set('cache:dishes', JSON.stringify(dishes), 300);
    
    for (const dish of dishes) {
      await cacheService.set(`cache:dish:${dish.id}`, JSON.stringify(dish), 3600);
    }
    
    logger.info(`预热菜品缓存完成，共${dishes.length}道菜品`);
  }

  async warmupStores() {
    logger.info('预热门店缓存...');
    
    const stores = await storeService.getAllStores();
    
    await cacheService.set('cache:stores', JSON.stringify(stores), 3600);
    
    for (const store of stores) {
      await cacheService.set(`cache:store:${store.id}`, JSON.stringify(store), 3600);
    }
    
    logger.info(`预热门店缓存完成，共${stores.length}家门店`);
  }

  async warmupCategories() {
    logger.info('预热分类缓存...');
    
    const dishes = await dishesService.getAllDishes();
    const categories = [...new Set(dishes.map(d => d.category))];
    
    await cacheService.set('cache:categories', JSON.stringify(categories), 3600);
    
    for (const category of categories) {
      const categoryDishes = dishes.filter(d => d.category === category);
      await cacheService.set(`cache:category:${encodeURIComponent(category)}`, JSON.stringify(categoryDishes), 300);
    }
    
    logger.info(`预热分类缓存完成，共${categories.length}个分类`);
  }

  async warmupBloomFilter() {
    logger.info('预热Bloom Filter...');
    
    const dishes = await dishesService.getAllDishes();
    const cacheProtection = require('../services/cacheProtection');
    
    for (const dish of dishes) {
      await cacheProtection.addToBloomFilter(`dish:${dish.id}`);
    }
    
    logger.info(`预热Bloom Filter完成，共${dishes.length}个菜品ID`);
  }

  async warmupEvents() {
    logger.info('预热活动缓存...');
    
    const eventService = require('../services/eventService');
    const events = await eventService.getCurrentEvents();
    
    await cacheService.set('cache:events:current', JSON.stringify(events), 300);
    
    logger.info(`预热活动缓存完成，共${events.length}个活动`);
  }

  async schedulePeriodicWarmup() {
    setInterval(async () => {
      if (process.env.NODE_ENV === 'production') {
        logger.info('执行定时缓存预热...');
        await this.warmup();
      }
    }, 60 * 60 * 1000);

    logger.info('定时缓存预热已启动，每小时执行一次');
  }

  reset() {
    this.warmupCompleted = false;
  }

  isCompleted() {
    return this.warmupCompleted;
  }
}

module.exports = new CacheWarmup();