# 雨姗AI收银助手 - AI Agent最大化开发计划

> 版本: v5.0.0 | 更新日期: 2026-05-16

---

## 一、项目现状分析

### 1.1 已实现功能 ✅

| 模块 | 文件 | 状态 | 说明 |
|------|------|------|------|
| FAQ问答系统 | `lambda/services/faq-system.js` | 完整 | 200+问题，14个分类 |
| MCP意图识别 | `lambda/mcp/handler.js` | 完整 | 8种意图类型 |
| 企业微信机器人 | `lambda/integrations/wework-bot.js` | 完整 | 扣子平台集成 |
| AI主动技能 | `lambda/services/ai-agent.js` | 完整 | 迎宾、推荐、提醒 |
| 推荐引擎 | `lambda/services/recommendation-engine.js` | 完整 | 爆款、个性、套餐、凑单 |
| 上下文管理 | `lambda/mcp/context.js` | 完整 | 顾客画像、会话记忆 |
| 自然语义理解 | `lambda/mcp/handler.js` | 完整 | 关键词+模式匹配 |
| 自动转人工 | `lambda/mcp/handler.js` | 完整 | 连续3次未知意图转人工 |

### 1.2 需要增强的功能 ⚠️

| 模块 | 当前状态 | 增强目标 |
|------|---------|---------|
| 意图识别 | 8种意图 | 扩展到20+种意图 |
| FAQ知识库 | 200+问题 | 扩展到300+问题 |
| 语音识别 | 模拟 | 真实API集成 |
| 图片识别 | 无 | AI菜品图片识别 |
| 多轮对话 | 基础 | 深度上下文理解 |
| 智能学习 | 无 | 基于用户反馈优化 |

---

## 二、AI Agent技能最大化方案

### 2.1 核心技能矩阵

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Agent 技能最大化架构                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   感知层      │  │   理解层      │  │   决策层      │         │
│  │              │  │              │  │              │         │
│  │ • 文字理解    │  │ • 意图识别    │  │ • 任务分解    │         │
│  │ • 语音转文字  │  │ • 实体提取    │  │ • 流程执行    │         │
│  │ • 图片识别    │  │ • 上下文理解  │  │ • 结果生成    │         │
│  │ • 情感分析    │  │ • 知识检索    │  │ • 主动推荐    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│          │                │                │                    │
│          └────────────────┼────────────────┘                    │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                      交互层                              │    │
│  │  • 企业微信机器人  • 微信小程序  • Web界面  • 短信通知   │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 技能分类

#### 技能一：智能问答（FAQ增强）
- 200+常见问题覆盖
- 14个知识分类
- 语义相似度匹配
- 多轮对话上下文
- **文件**: `lambda/services/faq-system.js`

#### 技能二：意图识别增强
- 20+种意图类型
- 置信度评估
- 模糊意图处理
- **文件**: `lambda/mcp/handler.js`

#### 技能三：智能推荐
- 爆款推荐（基于销量）
- 个性化推荐（基于画像）
- 套餐推荐（基于人数）
- 凑单推荐（基于满减）
- **文件**: `lambda/services/recommendation-engine.js`

#### 技能四：多轮对话
- 会话上下文记忆
- 顾客画像积累
- 订单状态跟踪
- **文件**: `lambda/mcp/context.js`

#### 技能五：企业微信集成
- 扣子平台回调
- 消息加解密
- 订单状态推送
- **文件**: `lambda/integrations/wework-bot.js`

#### 技能六：主动服务
- 主动迎宾
- 主动推荐
- 主动提醒（忌口、活动）
- **文件**: `lambda/services/ai-agent.js`

---

## 三、详细开发计划

### Phase 1: 核心增强（本周）

#### 1.1 意图识别增强
**目标**: 从8种扩展到25种意图

```javascript
// 新增意图类型
const intents = [
  // 原有8种
  'ORDER_DISH', 'REMOVE_FROM_CART', 'VIEW_CART', 'MODIFY_ORDER',
  'CONFIRM_ORDER', 'QUERY_MENU', 'REPEAT_ORDER', 'ASK_FAQ',

  // 新增17种
  'QUERY_PRICE',        // 查询价格
  'QUERY_PROMOTION',    // 查询优惠
  'RESERVE_TABLE',      // 预约桌位
  'CANCEL_ORDER',       // 取消订单
  'MODIFY_ADDRESS',     // 修改地址
  'QUERY_DELIVERY',     // 查询配送
  'APPLY_COUPON',       // 使用优惠券
  'QUERY_POINT',        // 查询积分
  'RECHARGE',           // 充值
  'FEEDBACK',           // 反馈投诉
  'GREETING',           // 问候
  'GOODBYE',            // 告别
  'VOICE_MESSAGE',      // 语音消息
  'IMAGE_UPLOAD',       // 图片上传
  'TABLE_NUMBER',       // 桌号识别
  'PAYMENT_METHOD',     // 支付方式
  'SPLIT_BILL',         // 分单
  'EXTRA_REQUEST',      // 特殊要求
  'BIRTHDAY_VIP',       // 生日优惠
  'PARKING_QUERY',      // 停车查询
  'WIFI_QUERY',         // WiFi查询
  'FACILITY_QUERY',     // 设施查询
  ' allergen_QUERY',    // 过敏查询
  'SPICY_LEVEL',        // 辣度调整
  'TASTE_PREFERENCE'    // 口味偏好
];
```

#### 1.2 FAQ知识库增强
**目标**: 从200+扩展到300+问题

新增分类：
- 节日专题（春节、中秋、国庆等）
- 会员权益（等级、权益、升级）
- 营销活动（满减、折扣、秒杀）
- 食品安全（食材来源、过敏原）

#### 1.3 MCP处理器增强
- 添加意图置信度阈值调整
- 添加意图冲突处理
- 添加多意图组合识别
- 添加对话状态机优化

### Phase 2: 集成增强（下周）

#### 2.1 企业微信机器人增强
- 消息加密/解密优化
- 群发消息支持
- 模板消息支持
- 回调重试机制

#### 2.2 微信小程序集成
- API接口对接
- 订单状态同步
- 会员信息互通

### Phase 3: 智能化升级（第三周）

#### 3.1 智能学习机制
- 用户反馈收集
- 问答质量评估
- 自动知识库更新

#### 3.2 预测性服务
- 基于时间的推荐
- 基于天气的推荐
- 基于节日的推荐

---

## 四、技术实现细节

### 4.1 意图识别算法

```javascript
// 增强版意图识别
class IntentRecognizer {
  constructor() {
    this.intents = this.buildIntentPatterns();
    this.fuzzyMatcher = new FuzzyMatcher();
  }

  recognize(message, context = {}) {
    // 1. 精确匹配
    const exactMatch = this.exactMatch(message);
    if (exactMatch.confidence > 0.9) {
      return exactMatch;
    }

    // 2. 模糊匹配
    const fuzzyMatch = this.fuzzyMatcher.match(message, this.intents);
    if (fuzzyMatch.confidence > 0.7) {
      return fuzzyMatch;
    }

    // 3. 上下文推断
    const contextInfer = this.inferFromContext(message, context);
    if (contextInfer.confidence > 0.5) {
      return contextInfer;
    }

    // 4. FAQ兜底
    return this.faqFallback(message);
  }
}
```

### 4.2 自然语言理解管道

```
用户输入 → 预处理 → 分词 → 实体识别 → 意图分类 → 槽位填充 → 知识检索 → 回复生成
```

### 4.3 多轮对话状态机

```javascript
const DialogState = {
  INITIAL: '初始状态',
  GREETING: '迎宾状态',
  ORDERING: '点餐状态',
  MODIFYING: '修改状态',
  CONFIRMING: '确认状态',
  PAYMENT: '支付状态',
  FEEDBACK: '反馈状态',
  TRANSFER_HUMAN: '转人工状态'
};
```

---

## 五、评估指标

### 5.1 AI Agent效果评估

| 指标 | 目标值 | 当前值 |
|------|--------|--------|
| 意图识别准确率 | ≥90% | 75% |
| FAQ回答准确率 | ≥95% | 85% |
| 平均对话轮次 | ≤5轮 | 8轮 |
| 用户满意度 | ≥90% | 待测 |
| 自动解决率 | ≥80% | 70% |

### 5.2 性能指标

| 指标 | 目标值 | 当前值 |
|------|--------|--------|
| 响应时间 | <500ms | <800ms |
| 并发处理 | ≥100 | ≥50 |
| 可用性 | ≥99.9% | 99.5% |

---

## 六、整合清单

### 6.1 代码整合

- [x] FAQ系统整合
- [x] MCP处理器整合
- [x] 企业微信机器人整合
- [x] AI Agent整合
- [x] 推荐引擎整合
- [x] 上下文管理整合

### 6.2 功能测试

- [ ] 意图识别测试（25种意图）
- [ ] FAQ问答测试（300+问题）
- [ ] 多轮对话测试
- [ ] 企业微信集成测试
- [ ] 微信小程序对接测试

### 6.3 文档更新

- [x] README更新
- [x] 开发计划文档
- [ ] API文档
- [ ] 部署文档

---

## 七、下一步行动

### 本周任务
1. ✅ 创建AI Agent最大化开发计划文档
2. ⬜ 增强意图识别（扩展到25种）
3. ⬜ 增强FAQ知识库（扩展到300+）
4. ⬜ 优化MCP处理器
5. ⬜ 更新README公示信息
6. ⬜ 推送到GitHub

### 本月目标
1. 实现25种以上意图识别
2. 实现300+FAQ知识库
3. 完成微信小程序完整对接
4. 完成企业微信机器人完整功能
5. 实现基本的智能学习机制

---

*最后更新: 2026-05-16*
