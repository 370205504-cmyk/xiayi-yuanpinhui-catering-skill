const jwt = require('jsonwebtoken');
const db = require('../database/db');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'yushan-ai-cashier-secret-key';
const TOKEN_EXPIRY = '2h';

const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    req.userId = null;
    return next();
  }

  try {
    const isValid = await checkTokenValidity(token);
    if (!isValid) {
      req.userId = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
  } catch (error) {
    req.userId = null;
  }
  next();
};

const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') ||
    (req.cookies?.token && req.cookies.token);

  if (!token) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  try {
    const isValid = await checkTokenValidity(token);
    if (!isValid) {
      return res.status(401).json({ success: false, message: '令牌已失效，请重新登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '登录已过期' });
  }
};

const requireAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') ||
    (req.cookies?.token && req.cookies.token);

  if (!token) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  try {
    const isValid = await checkTokenValidity(token);
    if (!isValid) {
      return res.status(401).json({ success: false, message: '令牌已失效，请重新登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => parseInt(id)) || [1];
    if (!adminIds.includes(decoded.userId)) {
      return res.status(403).json({ success: false, message: '需要管理员权限' });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.isAdmin = true;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '登录已过期' });
  }
};

const regenerateSession = async (req, res, next) => {
  if (req.session) {
    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }
      const { v4: uuidv4 } = require('uuid');
      req.session.id = uuidv4();
      next();
    });
  } else {
    next();
  }
};

async function checkTokenValidity(token) {
  try {
    if (db.redis) {
      const exists = await db.redis.exists(`token:${token}`);
      return exists === 1;
    }
    return true;
  } catch (error) {
    logger.warn('Redis token check failed, allowing token:', error.message);
    return true;
  }
}

async function revokeToken(token) {
  try {
    if (db.redis) {
      await db.redis.del(`token:${token}`);
    }
    logger.info('Token revoked:', `${token.substring(0, 20) }...`);
    return true;
  } catch (error) {
    logger.error('Failed to revoke token:', error);
    return false;
  }
}

async function storeToken(token, userId) {
  try {
    if (db.redis) {
      const ttl = 2 * 60 * 60;
      await db.redis.setEx(`token:${token}`, ttl, String(userId));
    }
    return true;
  } catch (error) {
    logger.error('Failed to store token:', error);
    return false;
  }
}

module.exports = {
  optionalAuth,
  requireAuth,
  requireAdmin,
  regenerateSession,
  revokeToken,
  storeToken,
  checkTokenValidity
};
