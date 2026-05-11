const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { body, param, query, validationResult } = require('express-validator');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.File({ filename: 'logs/security.log' })]
});

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, message: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: '登录尝试次数过多，请15分钟后重试' }
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: '支付请求过于频繁' }
});

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.bootcdn.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.bootcdn.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
});

const isProduction = process.env.NODE_ENV === 'production';

const corsConfig = cors({
  origin: isProduction 
    ? (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',')
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400
});

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '输入验证失败',
      errors: errors.array()
    });
  }
  next();
};

const inputSanitize = (req, res, next) => {
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/[<>\"\'\\/;`]/g, '').trim();
  };

  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => typeof item === 'string' ? sanitizeString(item) : item);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);

  next();
};

const ipBlacklist = new Set();
const ipRequestCounts = new Map();

const ipProtection = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  if (ipBlacklist.has(ip)) {
    logger.warn(`黑名单IP访问: ${ip}`);
    return res.status(403).json({ success: false, message: '访问被拒绝' });
  }

  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 60;

  let count = ipRequestCounts.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > count.resetAt) {
    count = { count: 0, resetAt: now + windowMs };
  }

  count.count++;
  ipRequestCounts.set(ip, count);

  if (count.count > maxRequests) {
    logger.warn(`IP请求超限: ${ip}`);
  }

  next();
};

const addToBlacklist = (ip) => {
  ipBlacklist.add(ip);
  logger.info(`IP加入黑名单: ${ip}`);
};

const removeFromBlacklist = (ip) => {
  ipBlacklist.delete(ip);
  logger.info(`IP移出黑名单: ${ip}`);
};

const xssProtection = (req, res, next) => {
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
};

const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (process.env.NODE_ENV === 'production' && sessionToken && token !== sessionToken) {
    logger.warn(`CSRF攻击尝试: ${req.ip}`);
    return res.status(403).json({ success: false, message: '无效的请求令牌' });
  }

  next();
};

module.exports = {
  apiLimiter,
  authLimiter,
  paymentLimiter,
  helmetConfig,
  corsConfig,
  validate,
  inputSanitize,
  ipProtection,
  xssProtection,
  csrfProtection,
  addToBlacklist,
  removeFromBlacklist
};
