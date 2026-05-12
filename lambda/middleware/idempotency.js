const crypto = require('crypto');
const db = require('../database/db');
const logger = require('../utils/logger');

class IdempotencyService {
  constructor() {
    this.cachePrefix = 'idempotency:';
    this.ttl = 24 * 60 * 60;
  }

  async process(req, res, next) {
    const requestId = req.headers['x-request-id'];
    
    if (!requestId) {
      return next();
    }

    if (!/^[a-f0-9]{32,64}$/i.test(requestId)) {
      return res.status(400).json({
        success: false,
        code: 1009,
        message: '无效的幂等键格式'
      });
    }

    const tenantId = req.tenantId || 'default';
    const cacheKey = `${this.cachePrefix}${tenantId}:${requestId}`;

    try {
      if (db.redis && db.redis.isOpen) {
        const cached = await db.redis.get(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          logger.info('Idempotent request cache hit', { requestId });
          return res.status(data.statusCode).json(data.body);
        }
      }

      const [existing] = await db.query(
        'SELECT * FROM idempotency WHERE tenant_id = ? AND request_id = ? AND expire_at > NOW()',
        [tenantId, requestId]
      );

      if (existing && existing.length > 0) {
        const data = JSON.parse(existing[0].response);
        logger.info('Idempotent request database hit', { requestId });
        return res.status(existing[0].status_code).json(data);
      }

      const originalJson = res.json;
      res.json = function(body) {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          IdempotencyService.saveIdempotency(tenantId, requestId, req.path, body, res.statusCode);
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Idempotency error', { error: error.message });
      next();
    }
  }

  static async saveIdempotency(tenantId, requestId, endpoint, responseBody, statusCode) {
    try {
      const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      const cacheKey = `idempotency:${tenantId}:${requestId}`;
      if (db.redis && db.redis.isOpen) {
        await db.redis.setEx(cacheKey, 24 * 60 * 60, JSON.stringify({
          statusCode,
          body: responseBody
        }));
      }

      await db.query(
        `INSERT INTO idempotency (tenant_id, request_id, endpoint, response, status_code, expire_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE updated_at = NOW()`,
        [tenantId, requestId, endpoint, JSON.stringify(responseBody), statusCode, expireAt]
      );
    } catch (error) {
      logger.error('Failed to save idempotency', { error: error.message });
    }
  }
}

const idempotencyService = new IdempotencyService();

module.exports = {
  idempotencyService,
  requireIdempotency: idempotencyService.process.bind(idempotencyService)
};
