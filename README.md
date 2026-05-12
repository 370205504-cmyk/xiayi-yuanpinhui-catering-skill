# 夏邑缘品荟智能餐饮服务系统 v3.5.0

<div align="center">

![Version](https://img.shields.io/badge/version-3.5.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-orange)

**夏邑缘品荟智能餐饮服务系统，支持语音点餐、文字聊天、AI Agent接入（扣子/龙虾/Dify）、多门店管理、完整订单生命周期、安全加固95个漏洞**
</div>

## 功能特性

### 🍽️ 核心功能

| 功能 | 说明 |
|------|------|
| **多渠道点餐** | 语音点餐(Alexa)、文字聊天、Web/移动端点餐、AI Agent对话 |
| **AI Agent适配** | 支持扣子/龙虾/Dify等AI平台接入，16个MCP标准工具 |
| **美团排队取号** | 智能排队叫号、实时进度查询、取消排队 |
| **完整购物车** | 加菜、减菜、口味备注、多人点餐 |
| **订单生命周期** | 待确认→已接单→制作中→已出餐→已完成/已取消 |
| **支付集成** | 微信支付、支付宝、余额支付、扫码支付 |
| **会员系统** | 积分、充值、优惠券、会员等级 |

### 🛠️ 技术特性

| 特性 | 说明 |
|------|------|
| **数据存储** | MySQL + Redis缓存 + 数据库连接池 |
| **安全防护** | Helmet + CSRF + XSS + API限流 |
| **响应式界面** | 移动端点餐、管理后台、顾客端 |
| **打印服务** | ESC/POS热敏打印机自动打印 |
| **云端部署** | 腾讯云函数一键部署 |

### 🎯 商业服务查询

支持20+种自然语言服务查询：
- 📍 门店地址、📞 联系电话、🕐 营业时间
- 📶 WiFi密码、🅿️ 停车信息、📅 包间预订
- 🥡 外卖指引、🧾 发票开具、👶 儿童服务
- 🔋 充电宝、🐾 宠物政策、🎁 活动公告

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- MySQL >= 8.0
- Redis >= 6.0 (可选)
- Docker (可选)

### 一键启动（推荐）

```bash
# 克隆项目
git clone https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill.git
cd xiayi-yuanpinhui-catering-skill

# 一键启动
chmod +x quick-start.sh
./quick-start.sh
```

### 手动启动

```bash
# 安装依赖
cd lambda
npm install

# 配置环境变量
cp ../.env.example ../.env
# 编辑.env文件

# 初始化数据库
npm run migrate

# 导入示例数据
npm run import-sample

# 启动服务
npm start
```

### Docker部署

```bash
docker-compose up -d
```

### 访问地址

- **顾客端**: http://localhost:3000
- **移动端**: http://localhost:3000/mobile
- **管理后台**: http://localhost:3000/admin

### ⚠️ 安全提示

- 首次登录后请立即修改默认密码
- 生产环境请务必配置强JWT密钥
- Redis建议设置密码保护

## AI Agent接入

### MCP工具列表

系统提供16个MCP标准工具，可接入任意AI Agent平台：

```json
{
  "tools": [
    {"name": "text_chat", "description": "自然语言对话点餐"},
    {"name": "get_menu", "description": "获取菜单"},
    {"name": "recommend_dishes", "description": "智能推荐菜品"},
    {"name": "add_to_cart", "description": "添加购物车"},
    {"name": "get_cart", "description": "查看购物车"},
    {"name": "create_order", "description": "创建订单"},
    {"name": "get_orders", "description": "查询订单"},
    {"name": "cancel_order", "description": "取消订单"},
    {"name": "queue_take", "description": "排队取号"},
    {"name": "query_queue", "description": "查询排队"},
    {"name": "cancel_queue", "description": "取消排队"},
    {"name": "get_store_info", "description": "门店信息"},
    {"name": "get_wifi_info", "description": "WiFi信息"}
  ]
}
```

### 对话示例

```
用户: 给我推荐几道招牌菜
AI: 🌟 今日推荐：
     1. 招牌大鱼头泡饭 ¥88 - 缘品荟头牌菜
     2. 招牌烧肉 ¥58 - 肥而不腻

用户: 来一份招牌大鱼头泡饭，少辣
AI: ✅ 已添加到购物车：招牌大鱼头泡饭 x1

用户: 帮我排个3人桌
AI: 🎫 取号成功！排队号：A025，预计等待30分钟
```

## API接口文档

### 认证接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/auth/register` | POST | 用户注册 |
| `/api/v1/auth/login` | POST | 用户登录 |
| `/api/v1/auth/wechat/login` | POST | 微信登录 |
| `/api/v1/auth/profile` | GET | 获取用户信息 |

### 菜品接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/dishes/dishes` | GET | 获取菜品列表 |
| `/api/v1/dishes/dish/:id` | GET | 获取菜品详情 |
| `/api/v1/dishes/dish` | POST | 添加菜品(管理员) |
| `/api/v1/dishes/dish/:id` | PUT | 更新菜品(管理员) |

### 订单接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/order/create` | POST | 创建订单 |
| `/api/v1/order/list` | GET | 获取订单列表 |
| `/api/v1/order/:orderNo` | GET | 获取订单详情 |
| `/api/v1/order/:orderNo/cancel` | PUT | 取消订单 |

### 排队接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/queue/take` | POST | 排队取号 |
| `/api/v1/queue/query/:queueId` | GET | 查询排队进度 |
| `/api/v1/queue/cancel/:queueId` | POST | 取消排队 |
| `/api/v1/queue/call` | POST | 叫号(商家) |

### 会员接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/member/info` | GET | 获取会员信息 |
| `/api/v1/member/recharge` | POST | 余额充值 |
| `/api/v1/member/coupons` | GET | 获取优惠券 |

### 支付接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/payment/create` | POST | 创建支付 |
| `/api/v1/payment/status/:orderNo` | GET | 查询支付状态 |
| `/api/v1/payment/refund` | POST | 申请退款 |

### 管理接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/admin/dashboard` | GET | 仪表盘数据 |
| `/api/v1/admin/orders` | GET | 订单管理 |
| `/api/v1/admin/dishes` | POST/PUT/DELETE | 菜品管理 |
| `/api/v1/admin/queues` | GET | 排队管理 |
| `/api/v1/admin/stats` | GET | 数据统计 |

### 统计接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/analytics/revenue` | GET | 营收统计 |
| `/api/v1/analytics/dishes` | GET | 菜品统计 |
| `/api/v1/analytics/customers` | GET | 客户统计 |
| `/api/v1/analytics/export` | GET | 导出报表 |

### AI对话接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/agent/text` | POST | 自然语言对话 |
| `/agent/menu` | GET | 获取菜单 |
| `/agent/recommend` | POST | 智能推荐 |

## 统一API响应格式

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

## 目录结构

```
xiayi-yuanpinhui-foodie-skill/
├── lambda/
│   ├── database/          # 数据库层
│   │   ├── db.js         # 数据库连接
│   │   ├── migrate.js    # 数据迁移
│   │   ├── backup.js      # 备份恢复
│   │   └── import-sample.js # 示例数据
│   ├── routes/           # 路由层
│   │   ├── auth.js       # 认证路由
│   │   ├── order.js      # 订单路由
│   │   ├── queue.js      # 排队路由
│   │   ├── payment.js    # 支付路由
│   │   ├── wechat.js     # 微信路由
│   │   ├── admin.js      # 管理路由
│   │   └── ...
│   ├── services/         # 业务逻辑层
│   │   ├── authService.js
│   │   ├── queueService.js
│   │   ├── paymentService.js
│   │   ├── memberService.js
│   │   ├── wechatService.js
│   │   └── ...
│   ├── middleware/       # 中间件
│   │   ├── security.js  # 安全中间件
│   │   ├── auth.js      # 认证中间件
│   │   └── upload.js    # 文件上传
│   ├── web/              # Web界面
│   │   ├── mobile.html  # 移动端点餐
│   │   ├── admin.html   # 管理后台
│   │   └── index.html   # 顾客端
│   ├── data/             # 数据文件
│   │   ├── dishes.json  # 菜品数据(120道)
│   │   └── stores.json  # 门店数据
│   └── server.js         # 服务器入口
├── SKILL.md              # AI Skill文档
├── skill.json            # MCP配置
├── deploy-tencent.sh      # 腾讯云部署脚本
├── docker-compose.yml    # Docker编排
└── README.md
```

## 配置说明

### 必需配置 (.env)

```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=xiayi_restaurant
JWT_SECRET=your_jwt_secret
```

### 微信配置

```env
WECHAT_APPID=your_appid
WECHAT_SECRET=your_secret
WECHAT_MCHID=your_mchid
WECHAT_APIKEY=your_apikey
WECHAT_PAY_NOTIFY_URL=https://your-domain.com/api/v1/payment/wechat/callback
```

### 支付宝配置

```env
ALIPAY_APPID=your_appid
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=your_public_key
```

## 腾讯云部署

```bash
# 安装腾讯云CLI
npm install -g @cloudbase/cli

# 登录
tcb login

# 配置环境变量
cp .env.example .env
# 编辑.env填写配置

# 执行部署
chmod +x deploy-tencent.sh
./deploy-tencent.sh
```

## 商业价值

### 适用场景
- 🍜 中小餐厅、快餐店、火锅店
- 🏬 美食广场、食堂
- 🏨 酒店、民宿餐饮服务
- 🤖 无人餐厅、智慧餐厅

### 商业优势
- 💰 **低成本**: 相比传统收银系统，部署和维护成本更低
- 🤖 **AI赋能**: AI Agent实现智能推荐和客户服务
- 🔧 **可定制**: 开源代码允许二次开发
- 🌐 **生态扩展**: 可对接外卖平台、供应链系统等

## 技术支持

- **GitHub**: https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill
- **问题反馈**: https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill/issues
- **开发者**: 石中伟

## License

MIT License - 石中伟
