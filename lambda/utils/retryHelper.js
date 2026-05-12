const logger = require('../utils/logger');

async function retryWithBackoff(fn, options = {}) {
  const {
    retries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    jitter = true,
    onRetry = null
  } = options;

  let delay = initialDelay;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) {
        logger.error(`重试${retries}次后失败: ${error.message}`);
        throw error;
      }

      if (onRetry) {
        onRetry(attempt, error);
      }

      logger.warn(`第${attempt}次调用失败，等待${delay}ms后重试: ${error.message}`);

      await new Promise(resolve => setTimeout(resolve, delay));

      delay = Math.min(delay * factor, maxDelay);

      if (jitter) {
        delay = delay * (0.8 + Math.random() * 0.4);
      }
    }
  }
}

async function retryWithExponentialBackoff(fn, retries = 3) {
  return retryWithBackoff(fn, {
    retries,
    initialDelay: 1000,
    maxDelay: 16000,
    factor: 2,
    jitter: true
  });
}

module.exports = {
  retryWithBackoff,
  retryWithExponentialBackoff
};
