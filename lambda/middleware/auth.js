const authService = require('../services/authService');
const { v4: uuidv4 } = require('uuid');

const optionalAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    req.userId = null;
    return next();
  }

  const decoded = authService.verifyToken(token);
  if (decoded) {
    req.userId = decoded.userId;
  } else {
    req.userId = null;
  }
  next();
};

const requireAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: '登录已过期' });
  }

  req.userId = decoded.userId;
  next();
};

const requireAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }

  const decoded = authService.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, message: '登录已过期' });
  }

  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => parseInt(id)) || [1];
  if (!adminIds.includes(decoded.userId)) {
    return res.status(403).json({ success: false, message: '需要管理员权限' });
  }

  req.userId = decoded.userId;
  req.isAdmin = true;
  next();
};

const regenerateSession = async (req, res, next) => {
  if (req.session) {
    const oldSessionId = req.session.id;
    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }
      req.session.id = uuidv4();
      next();
    });
  } else {
    next();
  }
};

module.exports = { optionalAuth, requireAuth, requireAdmin, regenerateSession };
