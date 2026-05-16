# 雨姗AI收银助手 v5.0.0

> 真正可落地的餐饮智能收银系统，企业微信机器人 + 微信小程序 + 后端全栈方案

---

## 🎯 项目概述

雨姗AI收银助手是一套完整的餐饮解决方案，包含：

1. **微信小程序**（完整点餐系统，来自 [orderFood-wxCloud](https://github.com/yangxiaohan168/orderFood-wxCloud)）
2. **后端服务**（完整的API、数据库、AI助手）
3. **企业微信机器人**（扣子平台集成，AI虚拟前台）

---

## ✨ 完整功能清单

### ✅ 微信小程序（完整可用）

| 功能模块 | 功能 | 状态 |
|---------|------|------|
| **顾客端** | 扫码点餐（堂食/打包） | ✅ |
| | 菜品浏览 | ✅ |
| | 购物车管理 | ✅ |
| | 微信支付 | ✅ |
| | 余额支付 | ✅ |
| | 会员充值 | ✅ |
| | 我的订单 | ✅ |
| | 个人中心 | ✅ |
| | 免单机会 | ✅ |
| **商家端** | 菜品管理（增删改查） | ✅ |
| | 会员管理 | ✅ |
| | 订单管理 | ✅ |
| | 充值套餐设置 | ✅ |
| | 桌码生成 | ✅ |
| | 打印机管理 | ✅ |
| | 店铺设置 | ✅ |
| | 公告管理 | ✅ |

### 🤖 AI Agent 技能最大化

#### 🎯 核心AI能力

| 功能 | 状态 | 说明 |
|------|------|------|
| **意图识别（25种）** | ✅ | [handler.js](lambda/mcp/handler.js) |
| **FAQ问答系统（300+问题）** | ✅ | [faq-system.js](lambda/services/faq-system.js) |
| **多轮对话状态机** | ✅ | 8种对话状态 |
| **实体识别** | ✅ | 菜品/数量/辣度/忌口 |
| **上下文理解** | ✅ | 顾客画像、会话记忆 |
| **自动转人工** | ✅ | 连续3次未知意图 |
| **主动推荐** | ✅ | 时间/场景/个性化 |
| **主动关怀** | ✅ | 节日/生日/复购提醒 |

#### 🎯 25种意图识别

| 类别 | 意图类型 |
|------|----------|
| **点餐相关** | ORDER_DISH, REMOVE_FROM_CART, VIEW_CART, MODIFY_ORDER, CONFIRM_ORDER, CANCEL_ORDER |
| **菜单查询** | QUERY_MENU, QUERY_PRICE, QUERY_SPECIFIC_DISH |
| **历史订单** | REPEAT_ORDER |
| **预约相关** | RESERVE_TABLE, RESERVATION_INFO |
| **配送相关** | QUERY_DELIVERY, DELIVERY_TIME |
| **支付相关** | PAYMENT_METHOD, APPLY_COUPON, SPLIT_BILL |
| **会员相关** | QUERY_POINT, RECHARGE, BIRTHDAY_VIP, MEMBER_REGISTER |
| **FAQ问答** | ASK_FAQ, WIFI_QUERY, PARKING_QUERY, BUSINESS_HOURS |
| **反馈投诉** | FEEDBACK, COMPLIMENT |
| **特殊需求** | ALLERGEN_QUERY, SPICY_LEVEL, TASTE_PREFERENCE |
| **社交礼仪** | GREETING, GOODBYE |
| **其他** | VOICE_MESSAGE, EXTRA_REQUEST, TABLE_NUMBER |

#### 🎯 300+FAQ知识库

| 分类 | 问题数量 |
|------|----------|
| 基础信息 | 5+ |
| 营业相关 | 6+ |
| 菜品咨询 | 15+ |
| 点餐服务 | 10+ |
| 支付相关 | 7+ |
| 会员服务 | 10+ |
| 促销活动 | 8+ |
| 外卖配送 | 6+ |
| 特殊需求 | 10+ |
| 投诉建议 | 7+ |
| 节日专题 | 8+ |
| 会员权益 | 7+ |
| 营销活动 | 8+ |
| 食品安全 | 6+ |

#### 🎯 AI主动技能

| 功能 | 说明 |
|------|------|
| 主动迎宾 | 分时段问候语（早/午/下午/晚） |
| 主动推荐 | 爆款/套餐/季节性推荐 |
| 主动提醒 | 忌口/优惠/订单状态 |
| 主动关怀 | 节日祝福/生日优惠/复购提醒 |
| 会员升级提醒 | 银卡/金卡升级进度 |
| 智能复购 | 7天未到店自动提醒 |

### ✅ 后端服务

#### 🔒 安全与权限

| 功能 | 状态 | 说明 |
|------|------|------|
| 用户认证（JWT） | ✅ | [authService.js](lambda/services/authService.js) |
| 角色权限管理 | ✅ | [roleService.js](lambda/services/roleService.js) |
| Helmet安全头 | ✅ | 已配置 |
| 速率限制 | ✅ | API限流 |
| XSS防护 | ✅ | 输入过滤 |
| CSRF防护 | ✅ | Token验证 |
| 密码加密（bcrypt） | ✅ | [secureAuthService.js](lambda/services/secureAuthService.js) |

#### 🗄️ 数据库

| 功能 | 状态 | 说明 |
|------|------|------|
| SQLite本地数据库 | ✅ | [sqlite-adapter.js](lambda/database/sqlite-adapter.js) |
| MySQL数据库支持 | ⚠️ | 框架实现 |
| 数据库初始化脚本 | ✅ | [init-sqlite.js](lambda/database/init-sqlite.js) |
| 示例数据（20+菜品） | ✅ | 一碗面快餐店演示数据 |
| 数据备份 | ✅ | [backup.js](lambda/services/backup.js) |
| 数据表设计 | ✅ | 菜品、订单、会员、配置等 |

#### 🍜 菜品与订单

| 功能 | 状态 | 说明 |
|------|------|------|
| 菜品分类管理 | ✅ | [sqlite-adapter.js](lambda/database/sqlite-adapter.js) |
| 菜品信息管理 | ✅ | 价格、描述、推荐等 |
| 桌台管理 | ✅ | 桌台状态、容量 |
| 订单创建 | ✅ | 订单号、顾客数、备注 |
| 订单明细管理 | ✅ | 订单项、小计 |
| 订单总额计算 | ✅ | 自动统计 |
| 订单查询 | ✅ | 按ID、订单号查询 |

#### 💬 企业微信机器人

| 功能 | 状态 | 说明 |
|------|------|------|
| 企业微信集成 | ✅ | [wework-bot.js](lambda/integrations/wework-bot.js) |
| 扣子平台回调 | ✅ | 签名验证、消息解密 |
| 消息加密/解密 | ✅ | AES-256-CBC |
| 好友添加处理 | ✅ | 欢迎消息 |
| 私聊消息处理 | ✅ | AI自动回复 |
| 订单状态推送 | ✅ | 主动通知 |
| 群发消息 | ✅ | 优惠推送 |
| 重试机制 | ✅ | 3次自动重试 |

---

## 🚀 快速开始

### 方式一：使用微信小程序（推荐）

1. **导入项目**
   ```bash
   git clone https://github.com/370205504-cmyk/yushan-ai-cashier-assistant.git
   cd yushan-ai-cashier-assistant
   ```

2. **打开微信开发者工具**
   - 导入 `miniprogram` 目录
   - 配置云开发环境
   - 上传云函数
   - 创建数据库集合

3. **开始使用**
   - 顾客端扫码点餐
   - 商家端进入管理后台（我的页面右下角连续点击5次）

详细说明见：[miniprogram/README.md](miniprogram/README.md)

### 方式二：使用后端服务

1. **安装依赖**
   ```bash
   npm install
   ```

2. **初始化数据库**
   ```bash
   node lambda/database/init-sqlite.js
   ```

3. **启动服务**
   ```bash
   npm start
   # 或
   node lambda/server.js
   ```

4. **访问**
   - 首页：http://localhost:3000
   - 管理后台：http://localhost:3000/admin
   - 移动端：http://localhost:3000/mobile

5. **登录**
   - 用户名：`admin`
   - 密码：`admin123`
   - ⚠️ 首次登录后请修改密码！

---

## 📊 数据库初始化数据

运行 `node lambda/database/init-sqlite.js` 会自动创建：

| 数据类型 | 数量 | 内容 |
|---------|------|------|
| 菜品分类 | 4 | 招牌面食、精美小菜、饮料酒水、特色套餐 |
| 菜品 | 20 | 红烧牛肉面、番茄鸡蛋面等 |
| 桌台 | 20 | 1-20号桌 |
| 店铺配置 | 12 | 店名、WiFi、营业时间、地址等 |
| 管理员 | 1 | admin/admin123 |

---

## 🏗️ 项目结构

```
yushan-ai-cashier-assistant/
├── miniprogram/              # 微信小程序（来自orderFood-wxCloud）
│   ├── pages/               # 页面
│   ├── components/          # 组件
│   ├── cloudfunctions/      # 云函数
│   └── README.md
├── cloudfunctions/          # 云函数（独立文件夹）
│   ├── login/
│   ├── doBuy/
│   ├── pay/
│   └── ...
├── lambda/                  # 后端服务
│   ├── server.js           # 服务入口
│   ├── services/           # 业务服务
│   │   ├── faq-system.js  # FAQ问答系统（300+问题）
│   │   ├── ai-agent.js    # AI主动技能
│   │   ├── qrcodeGenerator.js # 二维码生成
│   │   └── ...
│   ├── mcp/                # MCP处理器（AI核心）
│   │   ├── handler.js     # 25种意图识别
│   │   ├── context.js     # 上下文管理
│   │   └── tools.js       # MCP工具
│   ├── integrations/       # 集成（企业微信机器人）
│   │   └── wework-bot.js  # 扣子平台集成
│   ├── adapters/           # 收银系统适配器
│   ├── routes/             # API路由
│   ├── database/           # 数据库
│   │   ├── sqlite-adapter.js
│   │   └── init-sqlite.js
│   ├── middleware/         # 中间件
│   └── web/                # Web界面
├── docs/                    # 文档
│   ├── AI-Agent开发计划.md  # AI Agent开发计划
│   └── 功能扩展参考.md      # 8个开源项目整合规划
├── build/                   # Windows打包相关
└── README.md
```

---

## 🔧 AI Agent 技能详解

### 意图识别示例

```
用户: "来个宫保鸡丁，微辣，不要香菜"
识别结果: 
  - 意图: ORDER_DISH
  - 实体: 菜品=宫保鸡丁, 数量=1, 辣度=微辣, 忌口=香菜
  - 处理: 添加到购物车，记录口味偏好

用户: "多少钱"
识别结果:
  - 意图: QUERY_PRICE
  - 处理: 查询宫保鸡丁价格

用户: "我有会员卡"
识别结果:
  - 意图: MEMBER_REGISTER
  - 处理: 查询会员信息
```

### FAQ问答示例

```
用户: "WiFi密码多少"
回复: "WiFi账号：Yushan-Free，密码：88888888~"

用户: "有停车位吗"
回复: "我们地下有停车场，B1层有专属车位。消费满100元可免2小时停车费~"

用户: "会员有什么优惠"
回复: "会员权益包括：积分返利、会员折扣、生日优惠、会员日双倍积分、专属优惠券等~"
```

---

## 📚 功能扩展参考

本项目整合了以下优秀开源项目的设计思路和功能规划：

| 项目 | 功能 | 参考价值 |
|------|------|----------|
| [orderFood-wxCloud](https://github.com/yangxiaohan168/orderFood-wxCloud) | 微信点餐小程序 | ✅ 完整实现 |
| [Foodix](https://github.com/StreetLamp05/foodix) | AI库存预测（99.5%准确率） | ⏳ 规划中 |
| [OpenSkedge](https://github.com/OfficeStack/OpenSkedge) | 智能排班系统 | ⏳ 规划中 |
| [Restaurant Social SaaS](https://github.com/LCHEROURI/restaurant-social-saas) | AI菜品营销（自动生成海报/文案） | ⏳ 规划中 |
| [DPT-Agent](https://github.com/meituan-longcat/DPT-Agent) | 美团多智能体框架 | ⏳ 规划中 |
| [Kitchen Display System](https://github.com/deeputkarsh/Kitchen-Display-System) | 厨房KDS显示系统 | ⏳ 规划中 |
| [Recipe Costing](https://github.com/GarvitTech/Recipe-Costing-Application) | 菜品成本核算系统 | ⏳ 规划中 |
| [fuintCatering](https://github.com/Avey777/fuintCatering) | 会员AI营销系统 | ⏳ 规划中 |

详细整合规划见：[docs/功能扩展参考.md](docs/%E5%8A%9F%E8%83%BD%E6%89%A9%E5%B1%95%E5%8F%82%E8%80%83.md)

AI Agent开发计划见：[docs/AI-Agent开发计划.md](docs/AI-Agent%E5%BC%80%E5%8F%91%E8%AE%A1%E5%88%92.md)

---

## 🤝 致谢

本项目整合了以下优秀开源项目：

- [orderFood-wxCloud](https://github.com/yangxiaohan168/orderFood-wxCloud) - 完整的微信点餐小程序

---

## 📄 许可证

Apache License 2.0

---

**版本**: v5.0.0 | **更新日期**: 2026-05-16
