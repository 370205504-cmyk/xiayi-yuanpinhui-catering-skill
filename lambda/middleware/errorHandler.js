const logger = require('../utils/logger');

const ErrorCodes = {
  1001: { message: '参数错误或缺少必要参数', httpStatus: 400 },
  1002: { message: '业务逻辑错误', httpStatus: 400 },
  1003: { message: '权限不足', httpStatus: 403 },
  1004: { message: '资源不存在', httpStatus: 404 },
  1005: { message: '需要修改密码', httpStatus: 403 },
  1006: { message: '请求过于频繁', httpStatus: 429 },
  1007: { message: '签名验证失败', httpStatus: 401 },
  1008: { message: '请求包含非法字符', httpStatus: 400 },
  1009: { message: '幂等键无效或已使用', httpStatus: 400 },
  1010: { message: 'CSRF验证失败', httpStatus: 403 },
  2001: { message: '订单不存在', httpStatus: 404 },
  2002: { message: '菜品不存在', httpStatus: 404 },
  2003: { message: '库存不足', httpStatus: 400 },
  2004: { message: '订单状态不允许此操作', httpStatus: 400 },
  2005: { message: '订单已支付', httpStatus: 400 },
  3001: { message: '排队不存在', httpStatus: 404 },
  3002: { message: '排队已取消', httpStatus: 400 },
  3003: { message: '排队已叫号', httpStatus: 400 },
  4001: { message: '租户不存在或已禁用', httpStatus: 401 },
  4002: { message: 'API Key无效或已过期', httpStatus: 401 },
  5001: { message: '支付失败', httpStatus: 500 },
  5002: { message: '退款失败', httpStatus: 500 }
};

class AppError extends Error {
  constructor(code, message = null, details = null) {
    super(message || ErrorCodes[code]?.message || '未知错误');
    this.code = code;
    this.httpStatus = ErrorCodes[code]?.httpStatus || 500;
    this.details = details;
    this.name = 'AppError';
  }
}

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  let code = err.code || 1002;
  let message = err.message || '服务器内部错误';
  let httpStatus = err.httpStatus || 500;
  let details = err.details || null;

  if (err.name === 'ValidationError') {
    code = 1001;
    message = '参数验证失败';
    httpStatus = 400;
    details = err.details || err.message;
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    code = 1007;
    message = '认证失败';
    httpStatus = 401;
  }

  if (err.name === 'TokenExpiredError') {
    code = 1007;
    message = '登录已过期';
    httpStatus = 401;
  }

  if (err.code === 'ER_DUP_ENTRY') {
    code = 1002;
    message = '数据已存在';
    httpStatus = 400;
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    code = 1004;
    message = '关联数据不存在';
    httpStatus = 400;
  }

  if (err.code === 'ECONNREFUSED') {
    code = 1002;
    message = '服务暂时不可用';
    httpStatus = 503;
  }

  if (err.code === 'ETIMEDOUT') {
    code = 1002;
    message = '请求超时';
    httpStatus = 504;
  }

  const logLevel = httpStatus >= 500 ? 'error' : 'warn';
  logger.log(logLevel, 'API Error', {
    code,
    message,
    details,
    path: req.path,
    method: req.method,
    userId: req.userId,
    tenantId: req.tenantId,
    ip: req.ip,
    stack: httpStatus >= 500 ? err.stack : undefined
  });

  const response = {
    success: false,
    code,
    message,
    timestamp: new Date().toISOString()
  };

  if (details && process.env.NODE_ENV !== 'production') {
    response.details = details;
  }

  if (process.env.NODE_ENV !== 'production' && err.stack && httpStatus >= 500) {
    response.stack = err.stack;
  }

  res.status(httpStatus).json(response);
};

const notFoundHandler = (req, res, next) => {
  const error = new AppError(1004, '请求的资源不存在');
  next(error);
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const throwError = (code, message = null, details = null) => {
  throw new AppError(code, message, details);
};

module.exports = {
  AppError,
  ErrorCodes,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  throwError
};