# 夏邑缘品荟创味菜 - 智能餐饮服务系统 v3.0.0

<div align="center">

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green)
![License](https://img.shields.io/badge/license-MIT-orange)

**夏邑缘品荟创味菜 - 智能餐饮服务 Skill，支持语音点餐、文字聊天、AI Agent 接入（扣子 / 龙虾 / Dify）、购物车管理、完整订单生命周期**

</div>

## 功能特性

### 核心功能
- 🍽️ **多渠道点餐**: 语音点餐(Alexa)、文字聊天、Web/移动端点餐
- 🤖 **AI Agent适配**: 支持扣子/龙虾/Dify等AI平台接入
- 🛒 **完整购物车**: 加菜、减菜、口味备注、多人点餐
- 📦 **订单生命周期**: 待确认→已下单→后厨接单→制作中→已出餐→已取消
- 💳 **支付集成**: 微信支付、支付宝、余额支付
- 🎫 **会员系统**: 积分、充值、优惠券、会员等级

### 数据存储升级
- 🗄️ **MySQL数据库**: 关系型数据存储，支持复杂查询
- ⚡ **Redis缓存**: 热门数据缓存，提升系统性能
- 🔄 **连接池**: 数据库连接池，提高并发处理能力
- 💾 **备份恢复**: 自动化备份，支持手动恢复

### 安全性增强
- 🛡️ **Helmet**: HTTP安全头保护
- 🚫 **CSRF防护**: 跨站请求伪造防护
- 🧹 **XSS防护**: 跨站脚本攻击防护
- ⏱️ **API限流**: 防止恶意请求
- 🔒 **输入验证**: 全面的数据验证和清洗
- 🌐 **HTTPS强制**: 生产环境强制HTTPS

### 用户体验
- 📱 **响应式设计**: 完美适配移动端
- 🖼️ **图片上传**: 支持菜品图片展示
- 📊 **数据统计**: 经营数据可视化
- 🖨️ **小票打印**: 支持ESC/POS热敏打印机

## 技术栈

- **后端**: Node.js + Express.js
- **数据库**: MySQL + Redis
- **安全**: Helmet + express-validator + bcryptjs
- **认证**: JWT
- **部署**: Docker + Docker Compose

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- MySQL >= 8.0
- Redis >= 6.0 (可选，用于缓存)
- Docker (可选)

### 一键启动（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/370205504-cmyk/xiayi-youpinhui-foodie-skill.git
cd xiayi-youpinhui-foodie-skill

# 2. 使用快速启动脚本
chmod +x quick-start.sh
./quick-start.sh
```

### 手动启动

```bash
# 1. 克隆项目
git clone https://github.com/370205504-cmyk/xiayi-youpinhui-foodie-skill.git
cd xiayi-youpinhui-foodie-skill

# 2. 安装依赖
cd lambda
npm install

# 3. 配置环境变量
cp ../.env.example ../.env
# 编辑 .env 文件，配置数据库等信息

# 4. 初始化数据库
npm run migrate

# 5. 导入示例数据（可选，快速体验）
npm run import-sample

# 6. 启动服务
npm start
```

### Docker部署

```bash
# 启动所有服务（包含MySQL + Redis）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 访问地址

启动成功后可以访问：
- **顾客端**: http://localhost:3000
- **移动端**: http://localhost:3000/mobile
- **管理端**: http://localhost:3000/admin

### 测试账号

如果导入了示例数据，可以使用以下账号测试：
- 手机号: 13800138000
- 密码: 123456

## API接口

### 认证接口
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/auth/register` | POST | 用户注册 |
| `/api/v1/auth/login` | POST | 用户登录 |
| `/api/v1/auth/wechat` | POST | 微信登录 |
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

### 会员接口
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/member/info` | GET | 获取会员信息 |
| `/api/v1/member/recharge` | POST | 余额充值 |
| `/api/v1/member/coupons` | GET | 获取优惠券 |
| `/api/v1/member/coupons/claim` | POST | 领取优惠券 |

### 支付接口
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/payment/create` | POST | 创建支付 |
| `/api/v1/payment/status/:orderNo` | GET | 查询支付状态 |
| `/api/v1/payment/refund` | POST | 申请退款 |

### 库存接口
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/stock/:dishId` | GET | 获取库存 |
| `/api/v1/stock/update` | PUT | 更新库存(管理员) |
| `/api/v1/stock/warning/low` | GET | 低库存预警(管理员) |

### 配送接口
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/delivery/create` | POST | 创建配送单 |
| `/api/v1/delivery/:deliveryNo` | GET | 获取配送信息 |
| `/api/v1/delivery/:deliveryNo/assign` | PUT | 分配配送员(管理员) |
| `/api/v1/delivery/:deliveryNo/status` | PUT | 更新配送状态 |
| `/api/v1/delivery/driver/:driverId/list` | GET | 配送员订单列表 |
| `/api/v1/delivery/nearby` | GET | 获取附近订单 |

### 统计接口
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/analytics/dashboard` | GET | 仪表盘数据(管理员) |
| `/api/v1/analytics/revenue` | GET | 营收统计(管理员) |
| `/api/v1/analytics/dishes` | GET | 菜品统计(管理员) |
| `/api/v1/analytics/customers` | GET | 客户统计(管理员) |
| `/api/v1/analytics/hourly` | GET | 时段统计(管理员) |
| `/api/v1/analytics/categories` | GET | 分类统计(管理员) |
| `/api/v1/analytics/retention` | GET | 留存分析(管理员) |
| `/api/v1/analytics/export` | GET | 导出报表(管理员) |

### 门店接口
| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/v1/store/stores` | GET | 获取门店列表 |
| `/api/v1/store/stores/:id` | GET | 获取门店详情 |
| `/api/v1/store/stores/:id/stats` | GET | 门店统计(管理员) |
| `/api/v1/store/stores/:id/settings` | GET | 门店设置(管理员) |
| `/api/v1/store/stores/:id/settings` | PUT | 更新门店设置(管理员) |
| `/api/v1/store/stores` | POST | 创建门店(管理员) |
| `/api/v1/store/stores/:id` | PUT | 更新门店(管理员) |
| `/api/v1/store/stores/:id/default` | PUT | 设置默认门店(管理员) |

## 目录结构

```
xiayi-youpinhui-foodie-skill/
├── lambda/
│   ├── database/          # 数据库层
│   │   ├── db.js         # 数据库连接
│   │   ├── migrate.js    # 数据迁移
│   │   └── backup.js     # 备份恢复
│   ├── routes/           # 路由层
│   │   ├── auth.js       # 认证路由
│   │   ├── order.js      # 订单路由
│   │   ├── payment.js    # 支付路由
│   │   ├── member.js     # 会员路由
│   │   └── ...
│   ├── services/         # 业务逻辑层
│   │   ├── authService.js
│   │   ├── paymentService.js
│   │   ├── memberService.js
│   │   ├── stockService.js
│   │   └── ...
│   ├── middleware/       # 中间件
│   │   ├── security.js  # 安全中间件
│   │   ├── auth.js      # 认证中间件
│   │   └── upload.js    # 文件上传
│   ├── web/              # Web界面
│   │   ├── mobile.html  # 移动端点餐
│   │   └── admin.html   # 管理后台
│   └── server.js        # 服务器入口
├── .env.example         # 环境变量示例
├── docker-compose.yml   # Docker编排
└── README.md
```

## 配置说明

### 必需配置
```env
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=xiayi_restaurant
JWT_SECRET=your_jwt_secret
```

### 微信支付配置
```env
WECHAT_APPID=your_appid
WECHAT_MCHID=your_mchid
WECHAT_APIKEY=your_apikey
WECHAT_NOTIFY_URL=https://your-domain.com/api/v1/payment/wechat/callback
```

### 支付宝配置
```env
ALIPAY_APPID=your_appid
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=your_public_key
ALIPAY_NOTIFY_URL=https://your-domain.com/api/v1/payment/alipay/callback
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

## 开发计划

- [x] 数据存储升级 - MySQL + Redis
- [x] 用户注册登录系统
- [x] 微信/支付宝支付对接
- [x] 会员积分系统
- [x] 菜品库存管理
- [x] 外卖订单和配送跟踪
- [x] 订单推送通知
- [x] 多门店连锁管理
- [x] 数据分析报表
- [ ] SaaS云端版本
- [ ] 更多AI功能增强

## License

MIT License - 石中伟

## 联系方式

- GitHub: https://github.com/370205504-cmyk/xiayi-youpinhui-foodie-skill
- 开发者: 石中伟
