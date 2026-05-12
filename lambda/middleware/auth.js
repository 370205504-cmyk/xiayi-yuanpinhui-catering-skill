const jwt = require('jsonwebtoken');
const db = require('../database/db');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'xiayi-foodie-secret-key-change-in-production';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'xiayi-refresh-secret-change-in-production';
const TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';
const BLACKLIST_PREFIX = 'token:blacklist:';

const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    req.userId = null;
    return next();
  }

  try {
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      req.userId = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.tokenType = 'access';
  } catch (error) {
    req.userId = null;
  }
  next();
};

const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') ||
    (req.cookies?.token && req.cookies.token);

  if (!token) {
    return res.status(401).json({ success: false, code: 1001, message: '请先登录' });
  }

  try {
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({ success: false, code: 1001, message: '令牌已失效，请重新登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, code: 1001, message: '用户不存在' });
    }
    
    if (user.must_change_password) {
      return res.status(403).json({ 
        success: false, 
        code: 1005, 
        message: '首次登录必须修改密码',
        requirePasswordChange: true 
      });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.tokenType = 'access';
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, code: 1001, message: '登录已过期，请刷新令牌' });
    }
    return res.status(401).json({ success: false, code: 1001, message: '令牌无效' });
  }
};

const requireAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '') ||
    (req.cookies?.token && req.cookies.token);

  if (!token) {
    return res.status(401).json({ success: false, code: 1001, message: '请先登录' });
  }

  try {
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({ success: false, code: 1001, message: '令牌已失效，请重新登录' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const user = await getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ success: false, code: 1001, message: '用户不存在' });
    }
    
    if (user.must_change_password) {
      return res.status(403).json({ 
        success: false, 
        code: 1005, 
        message: '首次登录必须修改密码',
        requirePasswordChange: true 
      });
    }
    
    const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => parseInt(id)) || [];
    if (adminIds.length > 0 && !adminIds.includes(decoded.userId)) {
      return res.status(403).json({ success: false, code: 1003, message: '需要管理员权限' });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.isAdmin = true;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, code: 1001, message: '登录已过期' });
    }
    return res.status(401).json({ success: false, code: 1001, message: '令牌无效' });
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

async function getUserById(userId) {
  try {
    const users = await db.query('SELECT id, role, must_change_password FROM users WHERE id = ?', [userId]);
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    logger.error('Failed to get user:', error);
    return null;
  }
}

async function isTokenBlacklisted(token) {
  try {
    if (db.redis && db.redis.isOpen) {
      const exists = await db.redis.exists(`${BLACKLIST_PREFIX}${token}`);
      return exists === 1;
    }
    return false;
  } catch (error) {
    logger.warn('Redis blacklist check failed:', error.message);
    return false;
  }
}

async function blacklistToken(token, expiresIn = 7200) {
  try {
    if (db.redis && db.redis.isOpen) {
      await db.redis.setEx(`${BLACKLIST_PREFIX}${token}`, expiresIn, '1');
      logger.info('Token blacklisted');
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Failed to blacklist token:', error);
    return false;
  }
}

async function revokeToken(token) {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await blacklistToken(token, ttl);
      }
    }
    logger.info('Token revoked');
    return true;
  } catch (error) {
    logger.error('Failed to revoke token:', error);
    return false;
  }
}

async function storeToken(token, userId) {
  try {
    if (db.redis && db.redis.isOpen) {
      await db.redis.setEx(`token:${token}`, 3600, String(userId));
    }
    return true;
  } catch (error) {
    logger.error('Failed to store token:', error);
    return false;
  }
}

function generateTokens(userId, role = 'user') {
  const accessToken = jwt.sign(
    { userId, role, type: 'access' },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId, role, type: 'refresh' },
    REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
}

async function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    if (decoded.type !== 'refresh') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

async function refreshAccessToken(refreshToken) {
  const decoded = await verifyRefreshToken(refreshToken);
  if (!decoded) {
    return null;
  }

  const isBlacklisted = await isTokenBlacklisted(refreshToken);
  if (isBlacklisted) {
    return null;
  }

  return generateTokens(decoded.userId, decoded.role);
}

async function revokeAllUserTokens(userId) {
  try {
    if (db.redis && db.redis.isOpen) {
      const keys = await db.redis.keys(`token:*:${userId}`);
      if (keys.length > 0) {
        await db.redis.del(...keys);
      }
    }
    logger.info(`All tokens revoked for user ${userId}`);
    return true;
  } catch (error) {
    logger.error('Failed to revoke all tokens:', error);
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
  generateTokens,
  refreshAccessToken,
  revokeAllUserTokens,
  isTokenBlacklisted,
  blacklistToken
};
