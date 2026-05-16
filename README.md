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

### ✅ 后端服务（可实现功能）

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

#### 🎫 会员与积分

| 功能 | 状态 | 说明 |
|------|------|------|
| 会员注册 | ✅ | [memberService.js](lambda/services/memberService.js) |
| 积分管理 | ✅ | 等级、积分 |
| 会员信息查询 | ✅ | 手机号、姓名 |

#### 🎨 二维码与打印

| 功能 | 状态 | 说明 |
|------|------|------|
| 店铺二维码生成 | ✅ | [qrcodeGenerator.js](lambda/services/qrcodeGenerator.js) |
| 桌码二维码生成 | ✅ | 批量生成 |
| 二维码打印模板 | ✅ | HTML打印模板 |
| 批量桌码生成 | ✅ | 1-20桌 |

#### 🤖 AI智能助手

| 功能 | 状态 | 说明 |
|------|------|------|
| FAQ问答系统（200+问题） | ✅ | [faq-system.js](lambda/services/faq-system.js) |
| 营业时间、WiFi、停车等 | ✅ | 完整知识库 |
| 自然语义理解 | ✅ | [mcp/handler.js](lambda/mcp/handler.js) |
| 意图识别 | ✅ | 点餐、查询、FAQ等 |
| 主动迎宾 | ✅ | [ai-agent.js](lambda/services/ai-agent.js) |
| 智能推荐 | ⚠️ | 框架实现 |
| AI经营报告 | ⚠️ | 框架实现 |
| 自动转人工 | ✅ | 复杂问题自动转人工 |

#### 💬 企业微信机器人

| 功能 | 状态 | 说明 |
|------|------|------|
| 企业微信集成 | ✅ | [wework-bot.js](lambda/integrations/wework-bot.js) |
| 扣子平台回调 | ✅ | 签名验证、消息解密 |
| 好友添加处理 | ✅ | 欢迎消息 |
| 私聊消息处理 | ✅ | AI自动回复 |
| 订单状态推送 | ✅ | 主动通知 |

#### 🌐 Web界面

| 功能 | 状态 | 说明 |
|------|------|------|
| 首页（展示页） | ✅ | [index.html](lambda/web/index.html) |
| 管理后台 | ✅ | [admin.html](lambda/web/admin.html) |
| 移动端点餐页 | ✅ | [mobile.html](lambda/web/mobile.html) |
| 404/500错误页 | ✅ | 完整错误处理 |

#### 🛠️ 其他服务

| 功能 | 状态 | 说明 |
|------|------|------|
| 支付服务 | ✅ | [paymentService.js](lambda/services/paymentService.js) |
| 通知服务 | ✅ | [notificationService.js](lambda/services/notificationService.js) |
| 店铺配置 | ✅ | [storeService.js](lambda/services/storeService.js) |
| 监控服务 | ✅ | [monitoringService.js](lambda/services/monitoringService.js) |
| 系统监控 | ✅ | [systemMonitor.js](lambda/services/systemMonitor.js) |
| 熔断机制 | ✅ | [circuitBreaker.js](lambda/services/circuitBreaker.js) |
| 定时任务 | ✅ | [schedulerService.js](lambda/services/schedulerService.js) |

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
│   │   ├── faq-system.js  # FAQ问答系统
│   │   ├── qrcodeGenerator.js # 二维码生成
│   │   ├── ai-agent.js    # AI助手
│   │   └── ...
│   ├── mcp/                # MCP处理器（AI核心）
│   ├── integrations/       # 集成（企业微信机器人）
│   ├── adapters/           # 收银系统适配器
│   ├── routes/             # API路由
│   ├── database/           # 数据库
│   │   ├── sqlite-adapter.js
│   │   └── init-sqlite.js
│   ├── middleware/         # 中间件
│   └── web/                # Web界面
├── docs/                    # 文档
├── build/                   # Windows打包相关
└── README.md
```

---

## ⚠️ 重要说明

### 已完整实现 ✅
- 微信小程序点餐系统（完整可用）
- 后端API框架（Express）
- SQLite本地数据库（完整实现）
- FAQ问答系统（200+问题）
- 企业微信机器人集成
- 二维码生成（桌码、店铺码）
- 用户认证与权限
- 菜品、订单、会员管理
- 安全中间件

### 框架实现 ⚠️
- AI智能推荐（当前为随机）
- AI经营报告（模拟数据）
- 收银系统适配器（仅Mock）
- MySQL数据库（框架）
- 多模态（语音/图片）处理

---

## 🤝 致谢

本项目整合了以下优秀开源项目：

- [orderFood-wxCloud](https://github.com/yangxiaohan168/orderFood-wxCloud) - 完整的微信点餐小程序

---

## 📄 许可证

Apache License 2.0
