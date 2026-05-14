# 雨姗AI收银助手 v4.1.0

雨姗AI收银助手 - 市面所有收银系统通用AI智能增强助手。不用换收银，不用重新录菜品，不用培训员工，5分钟上线AI点餐、语音点餐、企业微信机器人点餐。

## 功能特点

- 多渠道点餐：语音点餐、文字聊天、Web/移动端点餐、AI Agent对话
- AI Agent适配：支持扣子/龙虾/Dify等AI平台，完整MCP标准工具集
- 商业服务查询：20+种自然语言查询（WiFi、停车、营业时间等）
- 智能排队：排队叫号、实时进度查询、取消排队
- 完整购物车：加菜、减菜、口味备注、多人点餐
- 订单生命周期：待确认→已接单→制作中→已出餐→已完成/已取消
- 支付集成：微信支付、支付宝、余额支付、扫码支付
- 会员系统：积分、充值、优惠券、会员等级
- 多租户支持：SaaS架构，支持多门店

## 快速开始

### 系统要求

- Node.js >= 18.0.0
- MySQL 8.0+
- Redis 7.0+

### 安装部署

1. 下载项目到本地
2. 复制 `.env.example` 为 `.env` 并配置数据库连接
3. 运行 `npm install` 安装依赖
4. 运行 `node lambda/database/init.js` 初始化数据库
5. 运行 `npm start` 启动服务

### Windows 用户

- 双击 `一键启动.bat` 即可启动
- 选择模式1（完整版）体验完整功能
- 选择模式2（简化版）快速体验基础功能

### Docker 部署

```bash
docker-compose up -d
```

## 访问地址

- 顾客端：http://localhost:3000
- 管理后台：http://localhost:3000/admin
- 移动端点餐：http://localhost:3000/mobile

## 项目结构

```
yushan-ai-cashier-assistant/
├── lambda/
│   ├── server.js              # 完整版服务器
│   ├── server-simple.js       # 简化版服务器
│   ├── routes/                # API路由
│   ├── services/              # 业务逻辑
│   ├── database/              # 数据库相关
│   ├── utils/                 # 工具函数
│   └── web/                   # 前端页面
├── .env.example               # 环境变量示例
├── package.json               # 项目配置
├── docker-compose.yml         # Docker配置
└── README.md                  # 项目说明
```

## 技术栈

- Node.js + Express
- MySQL + Redis
- Vanilla JavaScript (前端)
- Docker (可选)

## 开发团队

雨姗科技

## 许可证

Apache License 2.0
