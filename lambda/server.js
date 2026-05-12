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
const servicesRoutes = require('./routes/services');

const { apiLimiter, helmetConfig, corsConfig, inputSanitize, xssProtection, ipProtection } = require('./middleware/security');
const { requireSignature, sqlInjectionProtection } = require('./middleware/signature');
const { IdempotencyService, CSRFProtection } = require('./middleware/securityEnhancements');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requireTenant, tenantDataFilter } = require('./services/tenantService');

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
app.use(sqlInjectionProtection);
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

app.use(requireSignature);
app.use(IdempotencyService.processRequest.bind(IdempotencyService));
app.use(CSRFProtection.setToken.bind(CSRFProtection));

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
  
  const originalJson = res.json;
  res.json = function(data) {
    res.locals.responseBody = data;
    return originalJson.call(this, data);
  };
  
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
app.use('/api/v1', apiLimiter, apiRoutes);
app.use('/api/v1/services', servicesRoutes);
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
    version: '3.6.0',
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

app.use(notFoundHandler);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    const circuitBreaker = require('./services/circuitBreaker');
    logger.info('熔断器服务已初始化');

    if (process.env.DB_HOST) {
      await db.initialize();
      logger.info('数据库连接成功');

      if (process.env.DB_READ_HOST) {
        const dbReadWrite = require('./database/dbReadWrite');
        await dbReadWrite.initialize();
        logger.info('数据库读写分离已启用');
      }
    } else {
      logger.warn('未配置数据库，将以离线模式运行');
    }

    try {
      const cacheWarmup = require('./services/cacheWarmup');
      const warmupResult = await cacheWarmup.warmup();
      await cacheWarmup.schedulePeriodicWarmup();
      logger.info(`缓存预热完成，成功${warmupResult.successCount}项`);
    } catch (error) {
      logger.warn('缓存预热失败:', error.message);
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
      console.log('🍽️  夏邑缘品荟创味菜 - 智能餐饮服务系统 v3.6.0');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`🌐 服务地址: http://${HOST}:${PORT}`);
      console.log(`📚 API文档: http://${HOST}:${PORT}/api/v1/health`);
      console.log(`🔧 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log('═══════════════════════════════════════════════════════════');
      console.log('支持的MCP工具: 18个');
      console.log('  - text_chat: 自然语言对话');
      console.log('  - get_menu: 获取菜单');
      console.log('  - add_to_cart: 添加购物车');
      console.log('  - create_order: 创建订单');
      console.log('  - queue_take: 排队取号');
      console.log('  - ...更多工具请查看skill.json');
      console.log('═══════════════════════════════════════════════════════════');
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;