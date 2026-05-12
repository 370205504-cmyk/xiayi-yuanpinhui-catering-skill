const db = require('../database/db');
const logger = require('../utils/logger');

const BLOOM_FILTER_KEY = 'bloom:dishes';
const CHECK_PROBABILITY = 0.01;

class CacheProtection {
  static async add(key, count = 1) {
    try {
      if (!db.redis || !db.redis.isOpen) {
        return false;
      }
      
      const script = `
        local key = KEYS[1]
        local count = tonumber(ARGV[1])
        for i = 1, count do
          local hash = redis.call('HINCRBY', key, tostring(i), 1)
        end
        redis.call('EXPIRE', key, 86400)
        return 1
      `;
      
      await db.redis.eval(script, 1, BLOOM_FILTER_KEY, count);
      return true;
    } catch (error) {
      logger.error('Bloom filter add failed:', error);
      return false;
    }
  }

  static async mightExist(key) {
    try {
      if (!db.redis || !db.redis.isOpen) {
        return true;
      }
      
      if (Math.random() > CHECK_PROBABILITY) {
        return true;
      }
      
      const count = await db.redis.hget(BLOOM_FILTER_KEY, String(key));
      return count !== null && parseInt(count) > 0;
    } catch (error) {
      logger.error('Bloom filter check failed:', error);
      return true;
    }
  }

  static async getOrSet(key, fetchFn, ttl = 300) {
    try {
      if (!db.redis || !db.redis.isOpen) {
        return await fetchFn();
      }

      const cached = await db.redis.get(`cache:${key}`);
      if (cached !== null) {
        return JSON.parse(cached);
      }

      if (Math.random() < 0.1) {
        const exists = await this.mightExist(key);
        if (!exists) {
          logger.info('Bloom filter: cache miss detected for key:', key);
          return null;
        }
      }

      const data = await fetchFn();
      
      if (data !== null && data !== undefined) {
        await db.redis.setEx(`cache:${key}`, ttl, JSON.stringify(data));
        await this.add(key);
      }
      
      return data;
    } catch (error) {
      logger.error('Cache getOrSet failed:', error);
      return await fetchFn();
    }
  }

  static async invalidate(key) {
    try {
      if (db.redis && db.redis.isOpen) {
        await db.redis.del(`cache:${key}`);
      }
      return true;
    } catch (error) {
      logger.error('Cache invalidation failed:', error);
      return false;
    }
  }

  static async invalidatePattern(pattern) {
    try {
      if (!db.redis || !db.redis.isOpen) {
        return false;
      }
      
      const keys = await db.redis.keys(`cache:${pattern}`);
      if (keys.length > 0) {
        await db.redis.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache pattern invalidation failed:', error);
      return false;
    }
  }

  static getMutexLock(key, ttl = 10) {
    const lockKey = `lock:${key}`;
    const lockValue = Date.now().toString();

    return {
      acquire: async () => {
        try {
          if (!db.redis || !db.redis.isOpen) {
            return true;
          }
          
          const result = await db.redis.set(lockKey, lockValue, 'EX', ttl, 'NX');
          return result === 'OK';
        } catch (error) {
          logger.error('Mutex acquire failed:', error);
          return false;
        }
      },
      release: async () => {
        try {
          if (!db.redis || !db.redis.isOpen) {
            return true;
          }
          
          const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
              return redis.call("del", KEYS[1])
            else
              return 0
            end
          `;
          await db.redis.eval(script, 1, lockKey, lockValue);
          return true;
        } catch (error) {
          logger.error('Mutex release failed:', error);
          return false;
        }
      }
    };
  }

  static async warmupCache(cacheItems) {
    try {
      if (!db.redis || !db.redis.isOpen) {
        return;
      }

      const pipeline = db.redis.pipeline();
      
      for (const item of cacheItems) {
        pipeline.setEx(`cache:${item.key}`, item.ttl || 300, JSON.stringify(item.data));
      }
      
      await pipeline.exec();
      logger.info(`Cache warmed up with ${cacheItems.length} items`);
    } catch (error) {
      logger.error('Cache warmup failed:', error);
    }
  }

  static async getCacheStats() {
    try {
      if (!db.redis || !db.redis.isOpen) {
        return { enabled: false };
      }

      const info = await db.redis.info('memory');
      const keys = await db.redis.dbsize();
      
      return {
        enabled: true,
        totalKeys: keys,
        memoryInfo: info
      };
    } catch (error) {
      logger.error('Failed to get cache stats:', error);
      return { enabled: false, error: error.message };
    }
  }
}

module.exports = CacheProtection;
