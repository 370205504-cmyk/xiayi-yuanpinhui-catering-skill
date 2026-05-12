# 夏邑缘品荟智能餐饮系统 - 二次开发文档

## 概述

本文档为开发者提供系统的技术架构、模块设计、扩展指南等信息，帮助开发者进行二次开发和定制化。

---

## 技术架构

### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         用户层                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐  │
│  │  Web端   │  │ 移动端   │  │  AI Agent│  │  管理后台       │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬────────┘  │
└───────┼─────────────┼─────────────┼─────────────────┼───────────┘
        │             │             │                 │
        ▼             ▼             ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API层                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Express.js                            │   │
│  │  路由 → 中间件 → 控制器 → 服务层 → 数据层                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                         数据层                                  │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐         │
│  │  MySQL   │         │  Redis   │         │  文件存储 │         │
│  │  (主库)  │         │ (缓存)   │         │  (上传)  │         │
│  └──────────┘         └──────────┘         └──────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 技术栈

| 层级 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 框架 | Express.js | 4.18.x | Node.js Web框架 |
| 数据库 | MySQL | 8.0+ | 主数据存储 |
| 缓存 | Redis | 6.0+ | 缓存、会话管理 |
| 认证 | JWT | 9.0.x | 令牌认证 |
| 加密 | bcryptjs | 2.4.x | 密码哈希 |
| 日志 | Winston | 3.11.x | 日志记录 |
| 验证 | express-validator | 7.0.x | 参数验证 |

---

## 目录结构

```
lambda/
├── database/          # 数据库层
│   ├── db.js          # 数据库连接管理
│   ├── migrate.js     # 数据迁移脚本
│   ├── backup.js      # 备份恢复
│   └── import-sample.js # 示例数据导入
├── routes/            # 路由层
│   ├── auth.js        # 认证路由
│   ├── order.js       # 订单路由
│   ├── dishes.js      # 菜品路由
│   └── ...            # 其他路由
├── services/          # 业务逻辑层
│   ├── authService.js # 认证服务
│   ├── orderService.js # 订单服务
│   └── ...            # 其他服务
├── middleware/        # 中间件
│   ├── auth.js        # 认证中间件
│   ├── security.js    # 安全中间件
│   ├── signature.js   # 签名验证
│   └── upload.js      # 文件上传
├── utils/             # 工具类
│   ├── logger.js      # 日志工具
│   ├── sm4Util.js     # 加密工具
│   └── ...            # 其他工具
├── web/               # 前端页面
│   ├── index.html     # 顾客端
│   ├── mobile.html    # 移动端
│   └── admin.html     # 管理后台
├── session/           # 会话管理
│   └── contextManager.js # 上下文管理
├── server.js          # 服务器入口
└── package.json       # 依赖配置
```

---

## 核心模块详解

### 1. 认证模块

#### 核心文件
- `routes/auth.js` - 认证路由
- `middleware/auth.js` - 认证中间件
- `services/secureAuthService.js` - 安全认证服务

#### 认证流程

```
用户登录 → 验证密码 → 生成JWT Token → 返回Token
     ↓
后续请求 → 验证Token → 获取用户信息 → 处理请求
```

#### JWT结构

```json
{
  "userId": 1,
  "phone": "13800138000",
  "role": "user",
  "type": "access",
  "iss": "xiayi-yuanpinhui",
  "exp": 1705334400
}
```

#### Token管理

| Token类型 | 有效期 | 用途 |
|-----------|--------|------|
| Access Token | 1小时 | 接口认证 |
| Refresh Token | 7天 | 刷新Access Token |

### 2. 订单模块

#### 订单状态流转

```
pending(待确认) → confirmed(已接单) → preparing(制作中) → ready(已出餐) → completed(已完成)
       ↓
    cancelled(已取消)
```

#### 订单数据结构

```json
{
  "orderNo": "ORD20260115001",
  "userId": 1,
  "orderType": "dine_in",
  "tableNo": "A01",
  "totalAmount": 164.00,
  "status": "pending",
  "items": [
    { "dishId": 1, "quantity": 2, "price": 58.00, "remarks": "少辣" }
  ],
  "createdAt": "2026-01-15 12:30:00"
}
```

### 3. 支付模块

#### 支付流程

```
创建订单 → 创建支付 → 用户支付 → 回调验证 → 更新订单状态
```

#### 支持的支付方式

| 支付方式 | 说明 |
|----------|------|
| 微信支付 | 扫码支付、JSAPI支付 |
| 支付宝 | 扫码支付、APP支付 |
| 余额支付 | 会员余额抵扣 |

### 4. 缓存模块

#### 缓存策略

| 缓存类型 | Key格式 | 有效期 |
|----------|---------|--------|
| 菜品列表 | `cache:dishes` | 5分钟 |
| 用户购物车 | `cart:{userId}` | 24小时 |
| Token黑名单 | `token:blacklist:{token}` | Token有效期 |
| 排队信息 | `queue:{queueId}` | 10分钟 |

#### Bloom Filter（缓存穿透防护）

用于防止缓存穿透攻击，存储不存在的菜品ID等。

---

## 扩展开发指南

### 1. 添加新路由

**步骤**：

1. 在 `routes/` 目录创建新路由文件
2. 在 `server.js` 中注册路由
3. 实现对应的服务层

**示例**：

```javascript
// routes/custom.js
const express = require('express');
const router = express.Router();
const customService = require('../services/customService');

router.get('/', async (req, res) => {
  const data = await customService.getData();
  res.json({ success: true, data });
});

module.exports = router;
```

```javascript
// server.js
const customRoutes = require('./routes/custom');
app.use('/api/v1/custom', customRoutes);
```

### 2. 添加新服务

**步骤**：

1. 在 `services/` 目录创建服务文件
2. 实现业务逻辑
3. 在路由中引入使用

**示例**：

```javascript
// services/customService.js
class CustomService {
  async getData() {
    // 业务逻辑
    return { result: 'data' };
  }
}

module.exports = new CustomService();
```

### 3. 添加新MCP工具

**步骤**：

1. 在 `skill.json` 中定义工具
2. 在 `routes/agent.js` 或对应服务中实现处理逻辑
3. 添加相应的路由

**示例**：

```json
// skill.json - 添加工具定义
{
  "name": "custom_tool",
  "description": "自定义工具",
  "inputSchema": {
    "type": "object",
    "properties": {
      "param": { "type": "string" }
    },
    "required": ["param"]
  }
}
```

### 4. 添加数据库表

**步骤**：

1. 在 `database/migrate.js` 中添加表结构
2. 运行 `npm run migrate` 执行迁移
3. 在服务层添加CRUD操作

**示例**：

```javascript
// migrate.js - 添加表
await connection.query(`
  CREATE TABLE IF NOT EXISTS custom_table (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);
```

### 5. 添加定时任务

**步骤**：

1. 在 `server.js` 中添加 cron 任务
2. 实现任务逻辑

**示例**：

```javascript
// server.js
cron.schedule('0 3 * * *', async () => {
  // 每日3点执行
  await backupService.backupDatabase();
});
```

---

## 配置与部署

### 环境变量配置

| 变量名 | 说明 | 必填 | 默认值 |
|--------|------|------|--------|
| PORT | 服务端口 | 否 | 3000 |
| DB_HOST | 数据库主机 | 是 | - |
| DB_PORT | 数据库端口 | 否 | 3306 |
| DB_USER | 数据库用户 | 是 | - |
| DB_PASSWORD | 数据库密码 | 是 | - |
| DB_NAME | 数据库名 | 是 | xiayi_restaurant |
| JWT_SECRET | JWT密钥 | 是 | - |
| JWT_REFRESH_SECRET | Refresh Token密钥 | 是 | - |
| REDIS_HOST | Redis主机 | 否 | localhost |
| REDIS_PORT | Redis端口 | 否 | 6379 |
| SIGNING_SECRET | API签名密钥 | 否 | - |
| ALLOWED_ORIGINS | 允许的跨域域名 | 否 | * |
| NODE_ENV | 运行环境 | 否 | development |

### 开发环境搭建

```bash
# 克隆项目
git clone https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill.git
cd xiayi-yuanpinhui-catering-skill

# 安装依赖
cd lambda
npm install

# 配置环境变量
cp ../.env.example ../.env
# 编辑 .env 文件

# 初始化数据库
npm run migrate

# 导入示例数据
npm run import-sample

# 启动开发服务器
npm run dev
```

### 生产环境部署

**Docker部署**：

```bash
docker-compose up -d
```

**腾讯云函数部署**：

```bash
chmod +x deploy-tencent.sh
./deploy-tencent.sh
```

---

## 代码规范

### 命名规范

- 文件命名：小写下划线，如 `user_service.js`
- 变量命名：小驼峰，如 `userId`
- 类命名：大驼峰，如 `UserService`
- 常量命名：全大写下划线，如 `MAX_FILE_SIZE`

### 代码风格

- 使用 ES6+ 语法
- 使用 `const`/`let` 替代 `var`
- 函数使用 `async/await` 处理异步
- 代码缩进使用 2 空格

### 错误处理

```javascript
try {
  // 业务逻辑
} catch (error) {
  logger.error('错误描述', { error: error.message, context });
  throw error;
}
```

### 日志规范

```javascript
logger.info('操作成功', { userId, data });
logger.warn('警告信息', { context });
logger.error('错误信息', { error: error.message, stack: error.stack });
```

---

## 安全最佳实践

### 1. 输入验证

- 使用 `express-validator` 验证所有输入
- 对用户输入进行 sanitize 处理
- 防止 SQL 注入、XSS 攻击

### 2. 密码安全

- 使用 bcryptjs 哈希密码（10轮）
- 强制复杂密码策略
- 禁止明文存储密码

### 3. JWT安全

- 使用环境变量存储密钥
- 设置合理的 Token 有效期
- 实现 Token 黑名单机制

### 4. 敏感数据保护

- 对敏感字段进行加密存储
- API 响应中不返回敏感信息
- 日志中脱敏处理敏感数据

### 5. 访问控制

- 实现 RBAC 权限控制
- 最小权限原则
- 管理员操作记录审计日志

---

## 性能优化建议

### 1. 数据库优化

- 添加合适的索引
- 使用连接池管理数据库连接
- 避免 N+1 查询问题

### 2. 缓存优化

- 使用 Redis 缓存热点数据
- 实现缓存预热机制
- 设置合理的缓存过期时间

### 3. 代码优化

- 使用异步操作避免阻塞
- 批量操作减少数据库交互
- 使用流式处理大文件

### 4. 部署优化

- 使用 PM2 进行进程管理
- 配置负载均衡
- 启用 Gzip 压缩

---

## 调试与日志

### 日志级别

| 级别 | 说明 | 使用场景 |
|------|------|----------|
| debug | 调试信息 | 开发阶段 |
| info | 一般信息 | 正常业务流程 |
| warn | 警告信息 | 需要关注的情况 |
| error | 错误信息 | 异常情况 |

### 日志文件

- `logs/access.log` - 访问日志
- `logs/error.log` - 错误日志
- `logs/auth.log` - 认证日志
- `logs/payment.log` - 支付日志

### 调试技巧

```javascript
// 在关键位置添加调试日志
logger.debug('调试信息', { data });

// 使用 Node.js 调试器
node inspect server.js
```

---

## 集成测试

### 测试框架

- **测试框架**: Jest
- **API测试**: Supertest

### 测试命令

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- --testPathPattern=auth.test.js

# 生成测试覆盖率报告
npm test -- --coverage
```

### 测试结构

```
tests/
├── api.test.js      # API集成测试
├── services.test.js # 服务单元测试
└── utils.test.js    # 工具类测试
```

---

## 扩展建议

### 可扩展功能

| 功能 | 说明 | 难度 |
|------|------|------|
| KDS系统 | 厨房显示系统 | 中 |
| 库存管理 | 食材库存预警 | 中 |
| 供应链对接 | 对接供应商系统 | 高 |
| 外卖平台对接 | 美团/饿了么 | 高 |
| 会员营销 | 积分商城、优惠券 | 中 |
| 数据分析 | 经营报表、趋势分析 | 中 |

---

## 技术支持

- **GitHub**: https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill
- **问题反馈**: 在 GitHub Issues 提交问题
- **开发者**: 石中伟