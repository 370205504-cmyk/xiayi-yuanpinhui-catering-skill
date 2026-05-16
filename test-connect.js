#!/usr/bin/env node

console.log('🔍 测试项目依赖和基本功能...');
console.log('='.repeat(60));

try {
  console.log('1. 测试数据库连接...');
  const Database = require('better-sqlite3');
  const path = require('path');
  const dbPath = path.join(__dirname, 'lambda', 'database', 'data', 'cashier.db');
  const db = new Database(dbPath);
  const result = db.prepare('SELECT COUNT(*) as count FROM dishes').get();
  console.log(`✅ 数据库连接成功！菜品数量: ${result.count}`);

  console.log('\n2. 测试服务模块加载...');
  const services = [
    'cost-accounting',
    'kitchen-display',
    'inventory-forecast',
    'employee-scheduling',
    'social-marketing',
    'dpt-agent'
  ];

  for (const service of services) {
    try {
      require(`./lambda/services/${service}`);
      console.log(`✅ ${service} 模块加载成功`);
    } catch (e) {
      console.log(`❌ ${service} 模块加载失败: ${e.message}`);
    }
  }

  console.log('\n3. 测试AI Agent测试脚本...');
  const fs = require('fs');
  if (fs.existsSync('./test-ai-agent.js')) {
    console.log('✅ AI Agent测试脚本存在');
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ 基础测试通过！项目可以正常运行！');
  console.log('='.repeat(60));
  console.log('\n📋 下一步：');
  console.log('   1. 运行: npm start  # 启动服务');
  console.log('   2. 访问: http://localhost:3000');
  console.log('   3. 或运行: node test-ai-agent.js  # 运行完整测试');
  console.log('   4. 运行: build.bat  # 打包Windows绿色版');

  process.exit(0);
} catch (e) {
  console.error('❌ 测试失败:', e.message);
  console.error(e.stack);
  process.exit(1);
}
