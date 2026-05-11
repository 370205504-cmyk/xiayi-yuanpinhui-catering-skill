const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config.json');
const apiRoutes = require('./routes/api');
const agentRoutes = require('./routes/agent');
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'web')));

app.use((req, res, next) => {
  logger.info('API请求', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

app.use('/api/v1', apiRoutes);
app.use('/agent', agentRoutes);
app.use('/admin', adminRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'admin.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || config.server?.port || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🍽️  夏邑缘品荟创味菜 - 智能餐饮服务系统');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`🚀 服务已启动: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`📱 顾客端: http://localhost:${PORT}/`);
  console.log(`⚙️  管理端: http://localhost:${PORT}/admin`);
  console.log(`🔌 API文档: http://localhost:${PORT}/api/v1/docs`);
  console.log('═══════════════════════════════════════════════════════════');
  console.log('系统状态: 正常运行');
  console.log('═══════════════════════════════════════════════════════════');
  
  logger.info('服务启动成功', { port: PORT, host: HOST });
});

process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务...');
  logger.info('服务关闭中');
  server.close(() => {
    console.log('服务已关闭');
    process.exit(0);
  });
});

process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常', { error: error.message, stack: error.stack });
  console.error('未捕获的异常:', error);
  process.exit(1);
});

module.exports = app;
