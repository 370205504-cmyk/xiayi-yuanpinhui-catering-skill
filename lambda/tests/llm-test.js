require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const llmService = require('../services/llm-service');

console.log('=== 大模型服务测试 ===\n');

console.log('服务状态:');
console.log(`- 是否启用: ${llmService.isEnabled}`);
console.log(`- 提供商: ${llmService.enabledProvider || '未配置'}`);
console.log();

const testCases = [
  '你好',
  'WiFi密码是多少？',
  '营业时间是几点？',
  '推荐几个招牌菜',
  '来一份招牌大鱼头',
];

const mockStoreInfo = {
  name: '雨姗AI收银助手创味菜',
  address: '县孔祖大道南段188号',
  phone: '0370-628-9999',
  businessHours: '10:00-22:00',
  wifi_name: 'XYYP_005_VIP',
  wifi_password: '99999999',
};

const mockDishes = [
  { name: '招牌大鱼头泡饭', price: 88, category: '招牌菜' },
  { name: '招牌烧肉', price: 58, category: '招牌菜' },
  { name: '黄焖大甲鱼', price: 238, category: '特色硬菜' },
  { name: '清炒时蔬', price: 28, category: '家常炒菜' },
  { name: '番茄蛋花汤', price: 18, category: '汤羹主食' },
];

async function runTests() {
  if (!llmService.isEnabled) {
    console.log('⚠️ 大模型服务未启用，请在.env中配置LLM_PROVIDER和对应API密钥');
    console.log('\n当前测试规则模式下的意图检测:');
    for (const test of testCases) {
      const intent = llmService.detectIntent(test);
      console.log(`- "${test}" => ${intent}`);
    }
    return;
  }

  console.log('正在测试大模型回复...\n');

  for (let i = 0; i < testCases.length; i++) {
    const test = testCases[i];
    console.log(`[测试${i + 1}] 用户: ${test}`);
    try {
      const result = await llmService.generateResponse(
        test,
        testCases.slice(0, i).map((q, idx) => ({
          role: idx % 2 === 0 ? 'user' : 'assistant',
          content: q,
        })),
        mockStoreInfo,
        mockDishes
      );
      if (result?.success) {
        console.log(`         AI: ${result.content}`);
        console.log(`         意图: ${result.intent}`);
      } else {
        console.log('         ❌ 生成失败');
      }
    } catch (error) {
      console.log(`         ❌ 错误: ${error.message}`);
    }
    console.log();
  }
}

runTests().catch(console.error);
