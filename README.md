# 雨姗AI收银助手 v5.0.0

---

## ⚠️ 重要说明

**本项目是正在开发中的项目，请仔细阅读以下说明：**

1. **微信小程序部分** - 来自开源项目 [orderFood-wxCloud](https://github.com/yangxiaohan168/orderFood-wxCloud)，是完整可用的点餐系统
2. **后端服务部分** - 框架实现，AI智能推荐、收银系统对接等功能为模拟数据或未实现
3. **适用场景** - 适合学习、研究、二次开发，不建议直接用于生产环境

---

## 📦 项目结构

```
yushan-ai-cashier-assistant/
├── miniprogram/              ← 【完整可用】微信点餐小程序
│   ├── cloudfunctions/       ← 云函数（来自orderFood-wxCloud）
│   ├── pages/                ← 页面
│   ├── components/           ← 组件
│   └── README.md
├── lambda/                   ← 【框架实现】后端服务
│   ├── server.js            ← Express服务入口
│   ├── services/            ← 业务服务（部分为模拟实现）
│   ├── routes/              ← API路由
│   └── database/            ← 数据库支持（SQLite/MySQL）
├── cloudfunctions/          ← 【独立】云函数文件夹（与miniprogram/cloudfunctions重复）
├── docs/                    ← 文档
└── README.md
```

---

## ✨ 功能状态

### ✅ 已完整实现（微信小程序）

| 模块 | 功能 | 来源 |
|------|------|------|
| 顾客端 | 在线点餐（堂食/打包） | orderFood-wxCloud |
| | 微信支付/余额支付 | orderFood-wxCloud |
| | 会员充值 | orderFood-wxCloud |
| | 订单管理 | orderFood-wxCloud |
| | 免单机会 | orderFood-wxCloud |
| 商家端 | 菜品管理 | orderFood-wxCloud |
| | 会员管理 | orderFood-wxCloud |
| | 订单管理 | orderFood-wxCloud |
| | 充值套餐设置 | orderFood-wxCloud |
| | 桌码生成 | orderFood-wxCloud |
| | 打印机管理 | orderFood-wxCloud |

### ⚠️ 框架实现（后端服务）

| 模块 | 状态 | 说明 |
|------|------|------|
| AI智能推荐 | ❌ 随机选择 | 使用Math.random()生成推荐 |
| AI经营简报 | ❌ 模拟数据 | 返回硬编码数据 |
| 语音/图片识别 | ❌ 未实现 | 直接返回错误 |
| 收银系统适配器 | ❌ 仅Mock数据 | 未真实对接 |
| FAQ问答系统 | ⚠️ 框架实现 | 需要配置内容 |

---

## 🚀 快速开始

### 方式一：使用微信小程序（推荐）

这是目前最完整可用的部分。

```bash
# 1. 克隆项目
git clone https://github.com/370205504-cmyk/yushan-ai-cashier-assistant.git
cd yushan-ai-cashier-assistant

# 2. 打开微信开发者工具，导入 miniprogram 目录
# 3. 配置云开发环境ID
# 4. 上传云函数
# 5. 创建数据库集合
```

详细步骤见：[miniprogram/README.md](miniprogram/README.md)

### 方式二：使用后端服务

后端服务可以独立运行，但部分功能为模拟实现。

```bash
# 1. 安装依赖
npm install

# 2. 启动服务
node lambda/server.js

# 3. 访问 http://localhost:3000
```

---

## 📋 环境要求

- **Node.js**: >=18.0.0 <22.0.0
- **微信开发者工具**: 最新版本
- **微信小程序账号**: 需要认证（30元）
- **云开发**: 需要开通微信云开发

---

## 💰 成本估算

| 项目 | 费用 | 说明 |
|------|------|------|
| 小程序认证 | 30元 | 微信官方一次性收费 |
| 打印小票机 | ~259元 | 可选，趋势科技购买 |
| 服务器 | 0元 | 使用微信云开发 |
| **总计** | **30元起** | |

---

## 🎯 项目目标（规划中）

本项目的长期目标是：

1. **自动识别收银系统** - 扫描本地收银系统并自动适配
2. **全量数据同步** - 从现有收银系统自动拉取菜品、订单、会员数据
3. **AI智能推荐** - 基于真实销售数据的智能推荐
4. **自动打印小票** - 支持多品牌打印机

这些功能目前处于框架或规划阶段，尚未完整实现。

---

## 📞 技术支持

- **GitHub Issues**: https://github.com/370205504-cmyk/yushan-ai-cashier-assistant/issues
- **功能建议**: 提交 Issue 或 Pull Request

---

## 🙏 致谢

本项目整合了以下开源项目：
- [orderFood-wxCloud](https://github.com/yangxiaohan168/orderFood-wxCloud) - 完整的微信点餐小程序

---

## 📄 许可证

Apache License 2.0
