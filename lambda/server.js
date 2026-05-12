require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const winston = require('winston');
const compression = require('compression');
const db = require('./database/db');
const backupService = require('./database/backup');

const authRoutes = require('./routes/auth');
const wechatRoutes = require('./routes/wechat');
const paymentRoutes = require('./routes/payment');
const memberRoutes = require('./routes/member');
const stockRoutes = require('./routes/stock');
const dishesRoutes = require('./routes/dishes');
const orderRoutes = require('./routes/order');
const deliveryRoutes = require('./routes/delivery');
const queueRoutes = require('./routes/queue');
const analyticsRoutes = require('./routes/analytics');
const storeRoutes = require('./routes/store');
const apiRoutes = require('./routes/api');
const agentRoutes = require('./routes/agent');
const adminRoutes = require('./routes/admin');
const monitorRoutes = require('./routes/monitor');
const exportRoutes = require('./routes/export');
const userDataRoutes = require('./routes/userData');
const paymentConfigRoutes = require('./routes/paymentConfig');

const { apiLimiter, helmetConfig, corsConfig, inputSanitize, xssProtection, ipProtection } = require('./middleware/security');

const app = express();

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: 'logs/access.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.Console()
  ]
});

app.use(compression());
app.use(helmetConfig);
app.use(corsConfig);
app.use(ipProtection);
app.use(inputSanitize);
app.use(xssProtection);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'web'), {
  maxAge: '1d',
  etag: true,
  lastModified: true,
  index: false
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  index: false
}));

app.use((req, res, next) => {
  logger.info('请求', { method: req.method, path: req.path, ip: req.ip });
  next();
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth/wechat', wechatRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/member', memberRoutes);
app.use('/api/v1/stock', stockRoutes);
app.use('/api/v1/dishes', dishesRoutes);
app.use('/api/v1/order', orderRoutes);
app.use('/api/v1/delivery', deliveryRoutes);
app.use('/api/v1/queue', queueRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/store', storeRoutes);
app.use('/api/v1/payment-config', paymentConfigRoutes);
app.use('/api/v1', apiLimiter, apiRoutes);
app.use('/agent', agentRoutes);
app.use('/admin', adminRoutes);
app.use('/monitor', monitorRoutes);
app.use('/api/v1/export', exportRoutes);
app.use('/api/v1/user', userDataRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'admin.html'));
});

app.get('/mobile', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'mobile.html'));
});

app.get('/api/v1/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '3.4.0',
    services: {
      database: 'unknown',
      redis: 'unknown',
      circuitBreaker: 'closed'
    }
  };

  try {
    if (db.pool) {
      await db.pool.query('SELECT 1');
      health.services.database = 'connected';
    }
  } catch (e) {
    health.services.database = 'disconnected';
    health.status = 'degraded';
  }

  try {
    if (db.redis && db.redis.isOpen) {
      await db.redis.ping();
      health.services.redis = 'connected';
    }
  } catch (e) {
    health.services.redis = 'disconnected';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

app.post('/api/v1/backup', async (req, res) => {
  try {
    const result = await backupService.backupDatabase();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '备份失败' });
  }
});

app.get('/api/v1/backups', async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    res.json({ success: true, backups });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取备份列表失败' });
  }
});

app.post('/api/v1/restore', async (req, res) => {
  try {
    const result = await backupService.restoreDatabase(req.body.filename);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: '恢复失败' });
  }
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.status(404).json({ success: false, code: 1004, message: '接口不存在' });
  } else {
    res.status(404).sendFile(path.join(__dirname, 'web', '404.html'));
  }
});

app.use((err, req, res, next) => {
  const DataSanitizer = require('./services/dataSanitizer');
  logger.error('错误', { error: err.message, stack: err.stack, timestamp: new Date().toISOString() });

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, code: 1001, message: '无效的JSON数据' });
  }

  if (process.env.NODE_ENV === 'production') {
    if (req.path.startsWith('/api/')) {
      res.status(500).json({ success: false, code: 1000, message: '服务器内部错误' });
    } else {
      res.status(500).sendFile(path.join(__dirname, 'web', '500.html'));
    }
  } else {
    res.status(500).json({ success: false, code: 1000, message: err.message, stack: err.stack });
  }
});

cron.schedule('0 3 * * *', async () => {
  logger.info('开始执行定时备份...');
  try {
    await backupService.backupDatabase();
    logger.info('定时备份完成');
  } catch (error) {
    logger.error('定时备份失败:', error);
  }
});

cron.schedule('0 0 * * *', async () => {
  logger.info('检查微信支付证书有效期...');
  try {
    const certificateExpiry = process.env.WECHAT_CERT_EXPIRY;
    if (certificateExpiry) {
      const expiryDate = new Date(certificateExpiry);
      const daysRemaining = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      if (daysRemaining <= 30) {
        logger.warn(`微信支付证书即将过期，剩余${daysRemaining}天`);
      }
    }
  } catch (error) {
    logger.error('检查证书有效期失败:', error);
  }
});

cron.schedule('0 2 * * 0', async () => {
  logger.info('开始执行数据库索引优化...');
  try {
    const { databaseMonitor } = require('./services/databaseMonitor');
    await databaseMonitor.optimizeIndexes();
    logger.info('数据库索引优化完成');
  } catch (error) {
    logger.error('数据库索引优化失败:', error);
  }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    const circuitBreaker = require('./services/circuitBreaker');
    logger.info('熔断器服务已初始化');

    if (process.env.DB_HOST) {
      await db.initialize();
      logger.info('数据库连接成功');
    } else {
      logger.warn('未配置数据库，将以离线模式运行');
    }

    try {
      const { diskMonitor } = require('./services/diskMonitor');
      diskMonitor.start(60 * 1000);
      logger.info('磁盘监控已启动');
    } catch (error) {
      logger.warn('磁盘监控启动失败:', error.message);
    }

    try {
      const { systemMonitor } = require('./services/systemMonitor');
      systemMonitor.start(60 * 1000);
      logger.info('系统资源监控已启动');
    } catch (error) {
      logger.warn('系统资源监控启动失败:', error.message);
    }

    try {
      const { databaseMonitor } = require('./services/databaseMonitor');
      databaseMonitor.start();
      logger.info('数据库连接池监控已启动');
    } catch (error) {
      logger.warn('数据库连接池监控启动失败:', error.message);
    }

    app.listen(PORT, HOST, () => {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🍽️  夏邑缘品荟创味菜 - 智能餐饮服务系统 v3.4.0');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`🚀 服务已启动: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
      console.log(`📱 顾客端: http://localhost:${PORT}/`);
      console.log(`📲 移动端: http://localhost:${PORT}/mobile`);
      console.log(`⚙️  管理端: http://localhost:${PORT}/admin`);
      console.log(`🔌 API基础: http://localhost:${PORT}/api/v1`);
      console.log(`📖 API文档: http://localhost:${PORT}/api-docs`);
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ 数据存储: MySQL + Redis缓存');
      console.log('✅ 安全防护: JWT令牌吊销 + XSS + CSRF + 限流');
      console.log('✅ 熔断器: 数据库/支付接口熔断降级');
      console.log('✅ 系统监控: 磁盘/内存/CPU/连接池监控');
      console.log('✅ 统一错误码: 标准化API响应');
      console.log('✅ 会员系统: 积分/充值/优惠券');
      console.log('✅ 支付功能: 微信支付/支付宝');
      console.log('✅ 压缩优化: Gzip静态资源压缩');
      console.log('✅ 灰度发布: PM2 Cluster + 内存阈值重启');
      console.log('═══════════════════════════════════════════════════════════');
      logger.info('服务启动成功', { port: PORT, host: HOST, version: '3.4.0' });
    });
  } catch (error) {
    logger.error('服务启动失败:', error);
    console.error('服务启动失败:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号，正在关闭服务...');
  try {
    const { diskMonitor } = require('./services/diskMonitor');
    diskMonitor.stop();
  } catch (e) {}
  try {
    const { systemMonitor } = require('./services/systemMonitor');
    systemMonitor.stop();
  } catch (e) {}
  try {
    const { databaseMonitor } = require('./services/databaseMonitor');
    databaseMonitor.stop();
  } catch (e) {}
  await db.close();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', { error: error.message, stack: error.stack, name: error.name, timestamp: new Date().toISOString() });
  if (error.message && error.message.includes('printer')) {
    logger.warn('打印机异常，但服务继续运行');
    return;
  }
  if (process.env.NODE_ENV === 'production') {
    console.error('发生严重错误，服务将在重启后恢复');
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝', { reason: String(reason), timestamp: new Date().toISOString() });
});

startServer();

module.exports = app;
