# 🍽️ 智餐通 - 智慧餐饮AI助手

<div align="center">

**智餐通**是基于MCP协议的专业餐饮服务技能，让您的AI助手瞬间变身为智能餐饮管家。

[![Version](https://img.shields.io/badge/version-4.0.0-blue)](https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-1.0-orange)](https://modelcontextprotocol.io/)

</div>

---

## ✨ 功能特色

### 🤖 智能服务
- **菜单查询** - 支持分类筛选、分页浏览、模糊搜索
- **智能推荐** - 基于用户偏好、季节节日、用餐场景个性化推荐
- **自然语言** - 支持口语化点餐，如"来份糖醋里脊，少辣"

### 🛒 完整交易
- **购物车管理** - 添加、删除、修改、清空
- **订单处理** - 创建、查询、取消（带幂等性保证）
- **支付集成** - 微信、支付宝、会员余额

### 🎫 会员服务
- **会员信息** - 积分、余额、等级查询
- **优惠券** - 领取、使用、查询
- **发票开具** - 个人/公司发票

### ⏰ 排队管理
- **排队取号** - 实时排队、叫号通知
- **进度查询** - 预估等待时间
- **包间预订** - 提前预约包厢

---

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis >= 6.0

### 安装部署

```bash
# 1. 克隆项目
git clone https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill.git
cd xiayi-yuanpinhui-catering-skill

# 2. 安装依赖
cd lambda && npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填写数据库、Redis、支付等配置

# 4. 初始化数据库
npm run migrate:tenant

# 5. 启动服务
npm start
```

### 配置说明

在 `.env` 文件中配置以下环境变量：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=xiayi_restaurant

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT配置
JWT_SECRET=your_jwt_secret_change_in_production

# 微信支付配置
WECHAT_APP_ID=your_app_id
WECHAT_MCH_ID=your_mch_id
WECHAT_API_KEY=your_api_key

# 支付宝配置
ALIPAY_APP_ID=your_app_id
ALIPAY_PRIVATE_KEY=your_private_key
```

---

## 📡 API文档

### 认证方式

智餐通支持两种认证方式：

#### 1. API Key认证（推荐用于Agent）

```http
X-API-Key: sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
X-Tenant-Id: tenant_default
```

#### 2. JWT Token认证

```http
Authorization: Bearer <jwt_token>
```

### 工具列表

| 工具名称 | 功能描述 | 适用场景 |
|---------|---------|---------|
| `get_menu` | 获取菜单 | 查看菜品列表 |
| `get_dish_detail` | 菜品详情 | 了解菜品信息 |
| `recommend_dishes` | 智能推荐 | 不知道吃什么 |
| `add_to_cart` | 添加购物车 | 确定要点某道菜 |
| `remove_from_cart` | 移除购物车 | 取消某个菜品 |
| `get_cart` | 查看购物车 | 确认已点菜品 |
| `clear_cart` | 清空购物车 | 重新开始 |
| `create_order` | 创建订单 | 确认下单（幂等） |
| `get_orders` | 订单列表 | 查看历史订单 |
| `get_order_detail` | 订单详情 | 查看某个订单 |
| `cancel_order` | 取消订单 | 取消未支付订单 |
| `queue_take` | 排队取号 | 到店需要排队 |
| `query_queue` | 排队进度 | 查看等待时间 |
| `cancel_queue` | 取消排队 | 不想等了 |
| `get_store_info` | 门店信息 | 查看地址、营业时间 |
| `get_wifi_info` | WiFi信息 | 连接门店WiFi |
| `issue_invoice` | 开具发票 | 需要报销 |
| `reserve_room` | 预订包间 | 预约包厢 |
| `get_events` | 活动查询 | 查看优惠活动 |
| `get_coupons` | 优惠券 | 查看可用优惠券 |
| `get_member_info` | 会员信息 | 查看积分余额 |

---

## 🔌 接入AI平台

### 扣子 (Coze)

1. 登录 [扣子平台](https://coze.cn)
2. 创建新的Bot或Agent
3. 添加自定义技能
4. 上传 `skill.json` 文件
5. 配置API端点和认证信息
6. 测试并发布

### 龙虾 (Dify)

1. 登录 Dify
2. 进入"工具" -> "自定义工具"
3. 导入 `skill.json`
4. 配置认证信息
5. 在工作流中使用

### 其他MCP兼容平台

智餐通完全遵循MCP 1.0协议，可接入任何支持MCP的AI平台：

- Claude Desktop
- Cursor
- VS Code Copilot
- 自建AI助手

---

## 🛡️ 安全特性

智餐通内置企业级安全防护：

| 安全特性 | 说明 |
|---------|------|
| **多租户隔离** | 每个商家的数据完全隔离 |
| **幂等性保证** | 防止重复下单、重复支付 |
| **支付签名验证** | 微信/支付宝回调完整签名验证 |
| **RBAC权限控制** | 细粒度的角色权限管理 |
| **限流熔断** | 多维度限流保护服务稳定 |
| **XSS/CSRF防护** | 内置Web安全防护 |
| **敏感数据加密** | 密码、支付信息加密存储 |

---

## 📊 错误码

| 错误码 | 说明 |
|--------|------|
| 1001 | 参数错误 |
| 1002 | 业务逻辑错误 |
| 1003 | 权限不足 |
| 1004 | 资源不存在 |
| 1006 | 请求过于频繁 |
| 2001 | 订单不存在 |
| 2002 | 菜品不存在 |
| 2003 | 库存不足 |
| 2004 | 订单状态不允许此操作 |
| 3001 | 排队不存在 |
| 4001 | 租户不存在 |
| 5001 | 支付失败 |

完整错误码请参考 `skill.json` 文件。

---

## 📁 项目结构

```
xiayi-yuanpinhui-catering-skill/
├── lambda/                      # 后端服务
│   ├── routes/                 # API路由
│   ├── services/               # 业务服务
│   ├── middleware/             # 中间件
│   ├── database/               # 数据库
│   └── utils/                  # 工具函数
├── skill-package/              # 技能包
│   ├── skill.json              # MCP技能定义
│   └── README.md               # 使用文档
├── docs/                       # 文档
└── deploy/                     # 部署脚本
```

---

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

---

## 📄 许可证

本项目采用 [MIT许可证](LICENSE)。

---

## 👨‍💻 作者

**石中伟**

- GitHub: [@370205504-cmyk](https://github.com/370205504-cmyk)

---

## 🔗 相关链接

- [项目仓库](https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill)
- [问题反馈](https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill/issues)
- [MCP协议文档](https://modelcontextprotocol.io/)

---

<div align="center">

**智餐通** - 让每一餐都充满智慧 🍽️

</div>
