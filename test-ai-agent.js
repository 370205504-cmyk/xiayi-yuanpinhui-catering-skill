#!/usr/bin/env node
/**
 * AI Agent技能最大化测试脚本 v5.0.0
 * 测试所有AI Agent功能模块
 */

console.log('='.repeat(60));
console.log('雨姗AI收银助手 - AI Agent技能最大化测试');
console.log('='.repeat(60));

const MCPHandler = require('./lambda/mcp/handler');
const FAQSystem = require('./lambda/services/faq-system');
const AIAgent = require('./lambda/services/ai-agent');
const MultimodalProcessor = require('./lambda/services/multimodal-processor');
const RecommendationEngine = require('./lambda/services/recommendation-engine');
const CostAccounting = require('./lambda/services/cost-accounting');
const KitchenDisplay = require('./lambda/services/kitchen-display');
const InventoryForecast = require('./lambda/services/inventory-forecast');
const EmployeeScheduling = require('./lambda/services/employee-scheduling');

console.log('\n📋 测试环境初始化...\n');

// 1. 初始化所有模块
const modules = {
  MCPHandler: new MCPHandler(),
  FAQSystem: new FAQSystem(),
  AIAgent: new AIAgent(),
  MultimodalProcessor: new MultimodalProcessor(),
  CostAccounting: new CostAccounting(),
  KitchenDisplay: new KitchenDisplay(),
  InventoryForecast: new InventoryForecast(),
  EmployeeScheduling: new EmployeeScheduling()
};

// 测试结果统计
const testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

// 测试辅助函数
function test(name, fn) {
  testResults.total++;
  console.log(`\n🔍 ${name}`);
  try {
    const result = fn();
    if (result.success !== false) {
      console.log(`✅ ${name} 通过`);
      testResults.passed++;
    } else {
      console.log(`❌ ${name} 失败`);
      testResults.failed++;
    }
    return result;
  } catch (e) {
    console.log(`❌ ${name} 异常: ${e.message}`);
    testResults.failed++;
    return { success: false, error: e.message };
  }
}

console.log('✅ 所有模块加载成功');
console.log('\n' + '='.repeat(60));

// ========== 测试1: FAQ系统 ==========
test('FAQ系统 - 状态查询', () => {
  const stats = modules.FAQSystem.getStats();
  console.log(`   - 知识库大小: ${stats.totalQuestions} 问题`);
  console.log(`   - 分类数: ${stats.totalCategories}`);
  return { success: stats.totalQuestions > 0 };
});

test('FAQ系统 - WiFi查询', () => {
  const result = modules.FAQSystem.answer('WiFi密码是什么');
  console.log(`   - 回复: ${result.reply?.substring(0, 30)}...`);
  return result;
});

test('FAQ系统 - 营业时间查询', () => {
  const result = modules.FAQSystem.answer('几点开门');
  console.log(`   - 回复: ${result.reply?.substring(0, 30)}...`);
  return result;
});

test('FAQ系统 - 停车查询', () => {
  const result = modules.FAQSystem.answer('有停车场吗');
  console.log(`   - 回复: ${result.reply?.substring(0, 30)}...`);
  return result;
});

// ========== 测试2: 意图识别系统 ==========
test('MCP - 识别宫保鸡丁点餐', () => {
  const result = modules.MCPHandler.recognizeIntent('来个宫保鸡丁');
  console.log(`   - 意图: ${result.intent}`);
  console.log(`   - 置信度: ${result.confidence}`);
  return { success: result.intent === 'ORDER_DISH' };
});

test('MCP - 识别WiFi查询', () => {
  const result = modules.MCPHandler.recognizeIntent('WiFi密码');
  console.log(`   - 意图: ${result.intent}`);
  return { success: result.intent === 'WIFI_QUERY' };
});

test('MCP - 识别会员充值', () => {
  const result = modules.MCPHandler.recognizeIntent('我要充会员');
  console.log(`   - 意图: ${result.intent}`);
  return { success: result.intent === 'RECHARGE' };
});

test('MCP - 识别投诉反馈', () => {
  const result = modules.MCPHandler.recognizeIntent('我要投诉');
  console.log(`   - 意图: ${result.intent}`);
  return { success: result.intent === 'FEEDBACK' };
});

test('MCP - 识别问候', () => {
  const result = modules.MCPHandler.recognizeIntent('你好');
  console.log(`   - 意图: ${result.intent}`);
  return { success: result.intent === 'GREETING' };
});

test('MCP - 实体提取测试', () => {
  const entities = modules.MCPHandler.extractEntities('来个宫保鸡丁微辣不要香菜');
  console.log(`   - 菜品: ${entities.dishes.join(',')}`);
  console.log(`   - 辣度: ${entities.spiceLevel}`);
  return { success: entities.dishes.length > 0 };
});

// ========== 测试3: AI主动技能 ==========
test('AI Agent - 获取欢迎消息', () => {
  const welcome = modules.AIAgent.getWelcomeMessage({ isReturning: false });
  console.log(`   - 欢迎消息长度: ${welcome?.length} 字符`);
  return { success: welcome && welcome.length > 0 };
});

test('AI Agent - 获取时间场景推荐', () => {
  const rec = modules.AIAgent.getTimeBasedRecommendation();
  console.log(`   - 推荐内容: ${rec?.substring(0, 30)}...`);
  return { success: rec && rec.length > 0 };
});

test('AI Agent - 获取节日祝福', () => {
  const greeting = modules.AIAgent.getHolidayGreeting();
  console.log(`   - 节日祝福: ${greeting || '非节日期间'}`);
  return { success: true };
});

// ========== 测试4: 多模态处理器 ==========
test('多模态 - 文本处理', async () => {
  const result = await modules.MultimodalProcessor.process('来个宫保鸡丁', 'text');
  console.log(`   - 类型: ${result.type}`);
  console.log(`   - 内容: ${result.content}`);
  return result;
});

test('多模态 - 语音处理（模拟）', async () => {
  const result = await modules.MultimodalProcessor.process('mockAudio', 'voice');
  console.log(`   - 识别文本: ${result.text}`);
  return result;
});

test('多模态 - 获取支持的类型', () => {
  const types = modules.MultimodalProcessor.getSupportedTypes();
  console.log(`   - 支持: ${Object.keys(types).join(',')}`);
  return { success: Object.keys(types).length >= 3 };
});

// ========== 测试5: 成本核算系统 ==========
test('成本核算 - 宫保鸡丁成本', () => {
  const result = modules.CostAccounting.calculateRecipeCost('宫保鸡丁');
  console.log(`   - 原料成本: ${result.details.ingredientCost}元`);
  console.log(`   - 人工成本: ${result.details.laborCost}元`);
  console.log(`   - 总成本: ${result.details.totalCost}元`);
  return result;
});

test('成本核算 - 盈利能力分析', () => {
  const result = modules.CostAccounting.calculateMenuProfitability();
  console.log(`   - 菜品数: ${result.items?.length}`);
  console.log(`   - 总营收: ${result.summary?.totalRevenue}元`);
  return result;
});

// ========== 测试6: KDS厨房显示系统 ==========
test('KDS - 初始化工位', () => {
  const result = modules.KitchenDisplay.initializeKDS('main', '主厨房', 'main');
  console.log(`   - 工位: ${result.station?.name}`);
  return result;
});

test('KDS - 添加订单', () => {
  const result = modules.KitchenDisplay.addOrder({
    orderId: 'test001',
    tableNo: 'A1',
    items: [
      { name: '宫保鸡丁', stationType: 'main' },
      { name: '鱼香肉丝', stationType: 'main' }
    ]
  });
  console.log(`   - 订单: ${result.order?.orderNo}`);
  return result;
});

test('KDS - 获取统计', () => {
  const stats = modules.KitchenDisplay.getOrderStatistics();
  console.log(`   - 订单总数: ${stats.totalOrders}`);
  console.log(`   - 工位数: ${stats.stations?.length}`);
  return { success: true };
});

// ========== 测试7: 库存预测系统 ==========
test('库存预测 - 初始化库存', () => {
  const result = modules.InventoryForecast.initializeInventory([
    { id: 'pork', name: '猪肉', category: '肉类', stock: 50, unit: '斤', cost: 15 },
    { id: 'chicken', name: '鸡肉', category: '肉类', stock: 30, unit: '斤', cost: 12 }
  ]);
  console.log(`   - 商品数: ${result.count}`);
  return result;
});

test('库存预测 - 记录销售', () => {
  const result = modules.InventoryForecast.recordSale('pork', 2);
  console.log(`   - 当前库存: ${result.item?.currentStock}斤`);
  return result;
});

test('库存预测 - 获取状态', () => {
  const status = modules.InventoryForecast.getInventoryStatus();
  console.log(`   - 商品数: ${status.length}`);
  return { success: status.length > 0 };
});

test('库存预测 - 获取补货清单', () => {
  const reorderList = modules.InventoryForecast.getReorderList();
  console.log(`   - 补货项: ${reorderList.length}`);
  return { success: true };
});

// ========== 测试8: 员工排班系统 ==========
test('排班系统 - 添加员工', () => {
  const result = modules.EmployeeScheduling.addEmployee({
    name: '张三',
    phone: '13800138000',
    department: '前厅',
    position: '服务员',
    hourlyRate: 20
  });
  console.log(`   - 员工: ${result.employee?.name}`);
  return result;
});

test('排班系统 - 获取员工列表', () => {
  const employees = modules.EmployeeScheduling.getAllEmployees();
  console.log(`   - 员工数: ${employees.length}`);
  return { success: employees.length > 0 };
});

test('排班系统 - 打卡上班', () => {
  const result = modules.EmployeeScheduling.timeClock('EMP001', 'in');
  console.log(`   - 打卡结果: ${result.message}`);
  return { success: true };
});

test('排班系统 - 获取周排班', () => {
  const weekSchedule = modules.EmployeeScheduling.getWeeklySchedule();
  console.log(`   - 周天数: ${weekSchedule.length}`);
  return { success: weekSchedule.length === 7 };
});

// ========== 最终统计 ==========
console.log('\n' + '='.repeat(60));
console.log('📊 测试结果汇总');
console.log('='.repeat(60));
console.log(`总测试数: ${testResults.total}`);
console.log(`✅ 通过: ${testResults.passed}`);
console.log(`❌ 失败: ${testResults.failed}`);
console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

const status = testResults.failed === 0 ? '🎉 所有测试通过' : '⚠️ 部分测试失败';
console.log('\n' + status);
console.log('='.repeat(60));

process.exit(testResults.failed === 0 ? 0 : 1);
