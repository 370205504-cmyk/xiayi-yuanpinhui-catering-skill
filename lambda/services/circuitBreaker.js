const CircuitBreaker = require('opossum');

const db = require('../database/db');
const logger = require('../utils/logger');

const dbFallback = () => {
  logger.error('数据库熔断器已触发');
  return { success: false, message: '系统繁忙，请稍后再试' };
};

const payFallback = () => {
  logger.error('支付熔断器已触发');
  return { success: false, message: '支付系统繁忙，请前往前台付款' };
};

const externalApiFallback = (error) => {
  logger.error(`外部API熔断器已触发: ${error.message}`);
  return { success: false, message: '外部服务暂时不可用，请稍后再试' };
};

const dbBreaker = new CircuitBreaker(db.query, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
  fallback: dbFallback,
  name: 'database'
});

const payBreaker = new CircuitBreaker(async (params) => {
  const wechatPay = require('../integrations/wechatPay');
  return await wechatPay.createOrder(params);
}, {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
  fallback: payFallback,
  name: 'payment'
});

const externalApiBreaker = new CircuitBreaker(async (fn) => {
  return await fn();
}, {
  timeout: 10000,
  errorThresholdPercentage: 50,
  resetTimeout: 15000,
  fallback: externalApiFallback,
  name: 'external-api'
});

dbBreaker.on('open', () => {
  logger.error('数据库熔断器已打开');
});

dbBreaker.on('close', () => {
  logger.info('数据库熔断器已关闭');
});

dbBreaker.on('halfOpen', () => {
  logger.info('数据库熔断器进入半开状态');
});

payBreaker.on('open', () => {
  logger.error('支付熔断器已打开');
});

payBreaker.on('close', () => {
  logger.info('支付熔断器已关闭');
});

payBreaker.on('halfOpen', () => {
  logger.info('支付熔断器进入半开状态');
});

module.exports = {
  dbBreaker,
  payBreaker,
  externalApiBreaker,
  CircuitBreaker
};
