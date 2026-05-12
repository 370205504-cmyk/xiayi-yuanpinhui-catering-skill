const crypto = require('crypto');
const logger = require('../utils/logger');
const db = require('../database/db');

const IDEMPOTENCY_HEADER = 'X-Idempotency-Key';
const IDEMPOTENCY_TTL = 24 * 60 * 60;

class IdempotencyService {
  constructor() {
    this.prefix = 'idempotency:';
  }

  async processRequest(req, res, next) {
    const idempotencyKey = req.headers[IDEMPOTENCY_HEADER.toLowerCase()];
    
    if (!idempotencyKey) {
      return next();
    }

    if (!this.isValidIdempotencyKey(idempotencyKey)) {
      logger.warn('无效的幂等键格式', { key: idempotencyKey.substring(0, 20) });
      return res.status(400).json({ success: false, code: 1009, message: '无效的幂等键' });
    }

    const cacheKey = `${this.prefix}${idempotencyKey}`;

    try {
      if (db.redis && db.redis.isOpen) {
        const cachedResponse = await db.redis.get(cacheKey);
        
        if (cachedResponse) {
          logger.info(`幂等请求命中缓存: ${idempotencyKey.substring(0, 20)}`);
          const parsed = JSON.parse(cachedResponse);
          return res.status(parsed.statusCode).json(parsed.body);
        }

        await db.redis.setEx(cacheKey, IDEMPOTENCY_TTL, 'PROCESSING');
        
        res.on('finish', async () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const responseBody = res.locals.responseBody || { success: true };
              await db.redis.setEx(
                cacheKey,
                IDEMPOTENCY_TTL,
                JSON.stringify({ statusCode: res.statusCode, body: responseBody })
              );
            } else {
              await db.redis.del(cacheKey);
            }
          } catch (error) {
            logger.error('保存幂等响应失败:', error);
          }
        });
      }
    } catch (error) {
      logger.warn('幂等性处理失败，继续处理请求:', error.message);
    }

    next();
  }

  isValidIdempotencyKey(key) {
    return /^[a-f0-9]{32,64}$/.test(key);
  }

  generateIdempotencyKey() {
    return crypto.randomBytes(32).toString('hex');
  }
}

const xssPatterns = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<img[^>]*src\s*=\s*["']?javascript:/gi,
  /expression\s*\(/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /<svg[^>]*on/gi
];

class XSSProtection {
  sanitizeInput(input) {
    if (!input) return input;
    
    if (typeof input === 'string') {
      let result = input;
      for (const pattern of xssPatterns) {
        result = result.replace(pattern, '');
      }
      return result
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object') {
      const sanitized = {};
      for (const key in input) {
        sanitized[key] = this.sanitizeInput(input[key]);
      }
      return sanitized;
    }
    
    return input;
  }

  middleware(req, res, next) {
    if (req.body) {
      req.body = this.sanitizeInput(req.body);
    }
    
    if (req.query) {
      for (const key in req.query) {
        req.query[key] = this.sanitizeInput(req.query[key]);
      }
    }
    
    if (req.params) {
      for (const key in req.params) {
        req.params[key] = this.sanitizeInput(req.params[key]);
      }
    }

    next();
  }
}

class CSRFProtection {
  constructor() {
    this.tokenLength = 32;
    this.tokenHeader = 'X-CSRF-Token';
    this.tokenCookie = 'csrf-token';
  }

  generateToken() {
    return crypto.randomBytes(this.tokenLength).toString('hex');
  }

  async validateToken(req, res, next) {
    const bypassMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (bypassMethods.includes(req.method.toUpperCase())) {
      return next();
    }

    const headerToken = req.headers[this.tokenHeader.toLowerCase()];
    const cookieToken = req.cookies?.[this.tokenCookie];

    if (!headerToken || !cookieToken) {
      logger.warn('CSRF token缺失', { ip: req.ip });
      return res.status(403).json({ success: false, code: 1010, message: 'CSRF验证失败' });
    }

    if (!crypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(cookieToken))) {
      logger.warn('CSRF token不匹配', { ip: req.ip });
      return res.status(403).json({ success: false, code: 1010, message: 'CSRF验证失败' });
    }

    next();
  }

  async setToken(req, res, next) {
    let token = req.cookies?.[this.tokenCookie];
    
    if (!token) {
      token = this.generateToken();
      res.cookie(this.tokenCookie, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000
      });
    }

    res.setHeader(this.tokenHeader, token);
    next();
  }
}

module.exports = {
  IdempotencyService: new IdempotencyService(),
  XSSProtection: new XSSProtection(),
  CSRFProtection: new CSRFProtection()
};