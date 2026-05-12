const crypto = require('crypto');
const logger = require('../utils/logger');

const SIGNATURE_HEADER = 'X-Signature';
const TIMESTAMP_HEADER = 'X-Timestamp';
const NONCE_HEADER = 'X-Nonce';

const SIGNING_SECRET = process.env.SIGNING_SECRET || 'xiayi-yuanpinhui-signature-secret';

function generateSignature(params, timestamp, nonce) {
  const sortedParams = Object.keys(params).sort().map(key => `${key}=${params[key]}`).join('&');
  const signStr = `${sortedParams}&timestamp=${timestamp}&nonce=${nonce}&key=${SIGNING_SECRET}`;
  return crypto.createHash('sha256').update(signStr).digest('hex');
}

function validateSignature(req) {
  const signature = req.headers[SIGNATURE_HEADER.toLowerCase()];
  const timestamp = req.headers[TIMESTAMP_HEADER.toLowerCase()];
  const nonce = req.headers[NONCE_HEADER.toLowerCase()];

  if (!signature || !timestamp || !nonce) {
    return { valid: false, reason: '缺少签名参数' };
  }

  const now = Date.now();
  const requestTime = parseInt(timestamp);
  
  if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
    return { valid: false, reason: '请求已过期' };
  }

  const params = { ...req.body, ...req.query, ...req.params };
  const expectedSignature = generateSignature(params, timestamp, nonce);

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return { valid: false, reason: '签名验证失败' };
  }

  return { valid: true };
}

const requireSignature = (req, res, next) => {
  const bypassPaths = ['/api/v1/auth/login', '/api/v1/auth/register', '/agent/text', '/api/v1/health'];
  
  if (bypassPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  const validation = validateSignature(req);
  
  if (!validation.valid) {
    logger.warn('签名验证失败', { 
      path: req.path, 
      reason: validation.reason,
      ip: req.ip 
    });
    return res.status(401).json({ 
      success: false, 
      code: 1007, 
      message: `签名验证失败: ${validation.reason}` 
    });
  }

  next();
};

const sqlInjectionPatterns = [
  /(\%27)|(\')|(--)|(\%23)|(#)/gi,
  /((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
  /\w*((\%27)|('))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
  /union.*select/gi,
  /insert.*into/gi,
  /update.*set/gi,
  /delete.*from/gi,
  /drop.*table/gi,
  /exec.*(execute|xp_|sp_|dbms_)/gi,
  /(\%27)(\s|(\%20))*((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi
];

function detectSqlInjection(input) {
  if (!input) return false;
  
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  
  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(str)) {
      return true;
    }
  }
  return false;
}

const sqlInjectionProtection = (req, res, next) => {
  const body = req.body;
  const query = req.query;
  const params = req.params;

  if (detectSqlInjection(body) || detectSqlInjection(query) || detectSqlInjection(params)) {
    logger.warn('SQL注入攻击检测', { 
      path: req.path, 
      body: JSON.stringify(body).substring(0, 200),
      ip: req.ip 
    });
    return res.status(400).json({ 
      success: false, 
      code: 1008, 
      message: '请求包含非法字符' 
    });
  }

  next();
};

module.exports = {
  requireSignature,
  sqlInjectionProtection,
  generateSignature
};