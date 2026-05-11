require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const winston = require('winston');
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

app.use(helmetConfig);
app.use(corsConfig);
app.use(ipProtection);
app.use(inputSanitize);
app.use(xssProtection);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'web')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/v1', apiLimiter, apiRoutes);
app.use('/agent', agentRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'admin.html'));
});

app.get('/mobile', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'mobile.html'));
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

app.use((err, req, res, next) => {
  logger.error('错误', { error: err.message, stack: err.stack });
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: '无效的JSON数据' });
  }
  res.status(500).json({ success: false, message: '服务器内部错误' });
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

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    if (process.env.DB_HOST) {
      await db.initialize();
      logger.info('数据库连接成功');
    } else {
      logger.warn('未配置数据库，将以离线模式运行');
    }

    app.listen(PORT, HOST, () => {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🍽️  夏邑缘品荟创味菜 - 智能餐饮服务系统 v3.0.0');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`🚀 服务已启动: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
      console.log(`📱 顾客端: http://localhost:${PORT}/`);
      console.log(`📲 移动端: http://localhost:${PORT}/mobile`);
      console.log(`⚙️  管理端: http://localhost:${PORT}/admin`);
      console.log(`🔌 API基础: http://localhost:${PORT}/api/v1`);
      console.log('═══════════════════════════════════════════════════════════');
      console.log('✅ 数据存储: MySQL + Redis缓存');
      console.log('✅ 安全防护: Helmet + CSRF + XSS + 限流');
      console.log('✅ 会员系统: 积分/充值/优惠券');
      console.log('✅ 支付功能: 微信支付/支付宝');
      console.log('═══════════════════════════════════════════════════════════');
      logger.info('服务启动成功', { port: PORT, host: HOST });
    });
  } catch (error) {
    logger.error('服务启动失败:', error);
    console.error('服务启动失败:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('收到SIGTERM信号，正在关闭服务...');
  await db.close();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', { error: error.message, stack: error.stack, name: error.name });
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
  logger.error('未处理的Promise拒绝', { reason: String(reason) });
});

startServer();

module.exports = app;
