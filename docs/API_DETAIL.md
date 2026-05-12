# 夏邑缘品荟智能餐饮系统 - API文档

## 概述

本文档详细描述了夏邑缘品荟智能餐饮系统的所有API接口，包括接口地址、请求方法、请求参数、响应格式等。

## 基础信息

- **API版本**: v1
- **基础URL**: `/api/v1`
- **认证方式**: JWT Token
- **响应格式**: JSON

## 统一响应格式

### 成功响应
```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

### 失败响应
```json
{
  "success": false,
  "code": 1001,
  "message": "错误描述"
}
```

## 错误码说明

| 错误码 | 含义 |
|--------|------|
| 1001 | 参数错误/缺少必要参数 |
| 1002 | 业务逻辑错误 |
| 1003 | 权限不足 |
| 1004 | 接口不存在 |
| 1005 | 需要修改密码 |
| 1006 | 请求过于频繁 |
| 1007 | 签名验证失败 |
| 1008 | 请求包含非法字符 |
| 2001 | 订单不存在 |
| 2002 | 菜品不存在 |
| 2003 | 库存不足 |

---

## 认证接口

### 1. 用户注册

**POST** `/api/v1/auth/register`

请求参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | string | 是 | 手机号（11位） |
| password | string | 是 | 密码（至少8位，包含大小写字母、数字、特殊字符） |
| nickname | string | 否 | 用户昵称 |

请求示例：
```json
{
  "phone": "13800138000",
  "password": "Test@1234",
  "nickname": "美食爱好者"
}
```

成功响应：
```json
{
  "success": true,
  "code": 200,
  "message": "注册成功",
  "data": {
    "userId": 1,
    "phone": "13800138000",
    "nickname": "美食爱好者",
    "points": 0,
    "balance": 0.00
  }
}
```

### 2. 用户登录

**POST** `/api/v1/auth/login`

请求参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | string | 是 | 手机号 |
| password | string | 是 | 密码 |

成功响应：
```json
{
  "success": true,
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "phone": "13800138000",
      "nickname": "美食爱好者",
      "role": "user"
    }
  }
}
```

### 3. 获取用户信息

**GET** `/api/v1/auth/profile`

**认证要求**: 需要 JWT Token

成功响应：
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "phone": "13800138000",
    "nickname": "美食爱好者",
    "role": "user",
    "points": 100,
    "balance": 50.00,
    "level": 1
  }
}
```

### 4. 修改密码

**PUT** `/api/v1/auth/password`

**认证要求**: 需要 JWT Token

请求参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| oldPassword | string | 是 | 旧密码 |
| newPassword | string | 是 | 新密码 |

---

## 菜品接口

### 1. 获取菜品列表

**GET** `/api/v1/dishes/dishes`

查询参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| category | string | 否 | 分类名称 |
| keyword | string | 否 | 搜索关键词 |
| page | number | 否 | 页码（默认1） |
| limit | number | 否 | 每页数量（默认20） |

成功响应：
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "dishes": [
      {
        "id": 1,
        "name": "招牌红烧肉",
        "name_en": "Signature Pork Belly",
        "category": "招牌菜",
        "price": 58.00,
        "stock": 100,
        "is_recommended": true,
        "description": "精选五花肉，肥而不腻",
        "spicy_level": 0,
        "image_url": "https://example.com/dish1.jpg"
      }
    ],
    "total": 120,
    "page": 1,
    "limit": 20
  }
}
```

### 2. 获取菜品详情

**GET** `/api/v1/dishes/dish/:id`

路径参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 菜品ID |

成功响应：
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "name": "招牌红烧肉",
    "name_en": "Signature Pork Belly",
    "category": "招牌菜",
    "price": 58.00,
    "stock": 100,
    "is_recommended": true,
    "description": "精选五花肉，肥而不腻",
    "spicy_level": 0,
    "image_url": "https://example.com/dish1.jpg",
    "created_at": "2026-01-01 10:00:00"
  }
}
```

### 3. 添加菜品（管理员）

**POST** `/api/v1/dishes/dish`

**认证要求**: 需要管理员权限

请求参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 菜品名称 |
| name_en | string | 否 | 英文名称 |
| category | string | 是 | 分类 |
| price | number | 是 | 价格 |
| stock | number | 是 | 库存 |
| description | string | 否 | 描述 |
| spicy_level | number | 否 | 辣度（0-3） |
| is_recommended | boolean | 否 | 是否推荐 |
| image_url | string | 否 | 图片URL |

---

## 订单接口

### 1. 创建订单

**POST** `/api/v1/order/create`

**认证要求**: 需要 JWT Token

请求参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| items | array | 是 | 菜品列表 |
| items[].dishId | number | 是 | 菜品ID |
| items[].quantity | number | 是 | 数量 |
| items[].remarks | string | 否 | 备注 |
| orderType | string | 是 | 类型：dine_in/takeout/delivery |
| tableNo | string | 否 | 桌号（堂食） |
| address | string | 否 | 送餐地址（外卖） |
| contactPhone | string | 否 | 联系电话 |
| remarks | string | 否 | 订单备注 |

请求示例：
```json
{
  "items": [
    { "dishId": 1, "quantity": 2, "remarks": "少辣" },
    { "dishId": 2, "quantity": 1 }
  ],
  "orderType": "dine_in",
  "tableNo": "A01",
  "remarks": "尽快上菜"
}
```

成功响应：
```json
{
  "success": true,
  "code": 200,
  "message": "订单创建成功",
  "data": {
    "orderNo": "ORD20260115001",
    "totalAmount": 164.00,
    "status": "pending",
    "items": [
      { "dishId": 1, "name": "招牌红烧肉", "quantity": 2, "price": 58.00, "remarks": "少辣" },
      { "dishId": 2, "name": "糖醋里脊", "quantity": 1, "price": 48.00 }
    ],
    "createdAt": "2026-01-15 12:30:00"
  }
}
```

### 2. 获取订单列表

**GET** `/api/v1/order/list`

**认证要求**: 需要 JWT Token

查询参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | string | 否 | 状态筛选 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

### 3. 获取订单详情

**GET** `/api/v1/order/:orderNo`

**认证要求**: 需要 JWT Token

路径参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orderNo | string | 是 | 订单号 |

### 4. 取消订单

**PUT** `/api/v1/order/:orderNo/cancel`

**认证要求**: 需要 JWT Token

请求参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| reason | string | 否 | 取消原因 |

---

## 排队接口

### 1. 排队取号

**POST** `/api/v1/queue/take`

请求参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| storeId | string | 否 | 门店ID（默认第一个门店） |
| tableType | string | 是 | 桌型：small/medium/large/room |
| people | number | 是 | 用餐人数 |

成功响应：
```json
{
  "success": true,
  "code": 200,
  "message": "取号成功",
  "data": {
    "queueId": "QUEUE001",
    "queueNo": "A025",
    "tableType": "medium",
    "people": 4,
    "waitCount": 5,
    "estimatedTime": 30,
    "createdAt": "2026-01-15 12:00:00"
  }
}
```

### 2. 查询排队进度

**GET** `/api/v1/queue/query/:queueId`

路径参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| queueId | string | 是 | 排队ID |

### 3. 取消排队

**POST** `/api/v1/queue/cancel/:queueId`

路径参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| queueId | string | 是 | 排队ID |

---

## 会员接口

### 1. 获取会员信息

**GET** `/api/v1/member/info`

**认证要求**: 需要 JWT Token

成功响应：
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": {
    "userId": 1,
    "phone": "13800138000",
    "nickname": "美食爱好者",
    "level": 1,
    "points": 500,
    "balance": 200.00,
    "totalSpent": 1500.00
  }
}
```

### 2. 余额充值

**POST** `/api/v1/member/recharge`

**认证要求**: 需要 JWT Token

请求参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| amount | number | 是 | 充值金额 |
| payType | string | 是 | 支付方式：wechat/alipay |

### 3. 获取优惠券列表

**GET** `/api/v1/member/coupons`

**认证要求**: 需要 JWT Token

---

## 支付接口

### 1. 创建支付

**POST** `/api/v1/payment/create`

**认证要求**: 需要 JWT Token

请求参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orderNo | string | 是 | 订单号 |
| payType | string | 是 | 支付方式：wechat/alipay/balance |

成功响应：
```json
{
  "success": true,
  "code": 200,
  "message": "支付创建成功",
  "data": {
    "paymentId": "PAY20260115001",
    "orderNo": "ORD20260115001",
    "amount": 164.00,
    "payType": "wechat",
    "status": "pending",
    "payUrl": "weixin://pay?..."
  }
}
```

### 2. 查询支付状态

**GET** `/api/v1/payment/status/:orderNo`

**认证要求**: 需要 JWT Token

### 3. 申请退款

**POST** `/api/v1/payment/refund`

**认证要求**: 需要 JWT Token

请求参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orderNo | string | 是 | 订单号 |
| reason | string | 否 | 退款原因 |

---

## 包间预订接口

### 1. 获取包间列表

**GET** `/api/v1/services/rooms`

成功响应：
```json
{
  "success": true,
  "code": 200,
  "message": "获取成功",
  "data": [
    {
      "id": "room001",
      "name": "牡丹厅",
      "capacity": 10,
      "status": "available",
      "description": "豪华包间，可容纳10人"
    }
  ]
}
```

### 2. 预订包间

**POST** `/api/v1/services/rooms/reserve`

**认证要求**: 需要 JWT Token

请求参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| roomId | string | 是 | 包间ID |
| date | string | 是 | 日期（YYYY-MM-DD） |
| timeSlot | string | 是 | 时间段 |
| people | number | 是 | 人数 |
| phone | string | 是 | 联系电话 |
| remarks | string | 否 | 备注 |

---

## 发票接口

### 1. 开具发票

**POST** `/api/v1/services/invoice/issue`

**认证要求**: 需要 JWT Token

请求参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orderNo | string | 是 | 订单号 |
| taxNumber | string | 是 | 税号 |
| companyName | string | 是 | 公司名称 |
| email | string | 否 | 接收邮箱 |

---

## 活动接口

### 1. 获取活动列表

**GET** `/api/v1/services/events`

查询参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | string | 否 | 状态：active/all |

### 2. 获取当前活动

**GET** `/api/v1/services/events/current`

---

## 管理接口

### 1. 获取仪表盘数据

**GET** `/api/v1/admin/dashboard`

**认证要求**: 需要管理员权限

### 2. 订单管理

**GET** `/api/v1/admin/orders`

**认证要求**: 需要管理员权限

查询参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | string | 否 | 订单状态 |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 3. 更新订单状态

**PUT** `/api/v1/admin/orders/:orderNo/status`

**认证要求**: 需要管理员权限

请求参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | string | 是 | 新状态 |

---

## 统计接口

### 1. 营收统计

**GET** `/api/v1/analytics/revenue`

**认证要求**: 需要管理员权限

查询参数：
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| startDate | string | 是 | 开始日期 |
| endDate | string | 是 | 结束日期 |

### 2. 菜品统计

**GET** `/api/v1/analytics/dishes`

**认证要求**: 需要管理员权限

### 3. 客户统计

**GET** `/api/v1/analytics/customers`

**认证要求**: 需要管理员权限

---

## 健康检查

**GET** `/api/v1/health`

无需认证，用于服务健康检查。

成功响应：
```json
{
  "status": "ok",
  "timestamp": "2026-01-15T12:00:00Z",
  "uptime": 3600,
  "version": "3.5.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "circuitBreaker": "closed"
  }
}
```

---

## 认证说明

### JWT Token使用

所有需要认证的接口，需在请求头中携带Token：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token过期处理

- Access Token 有效期：1小时
- Refresh Token 有效期：7天
- Token过期后需调用刷新接口获取新Token

### 签名验证（可选）

生产环境建议启用签名验证，需在请求头中携带：

```
X-Signature: <签名值>
X-Timestamp: <时间戳>
X-Nonce: <随机数>
```

签名算法：`SHA256(sorted(params)&timestamp=<timestamp>&nonce=<nonce>&key=<SECRET>)`

---

## 限流说明

| 接口 | 限流规则 |
|------|----------|
| 登录 | 5次/分钟 |
| 注册 | 3次/分钟 |
| 下单 | 10次/分钟 |
| 支付 | 5次/分钟 |
| 通用API | 100次/分钟 |

---

## 开发环境测试账号

- 手机号：13800138000
- 密码：123456
- ⚠️ 首次登录必须修改密码

---

## 注意事项

1. 所有日期参数格式为 `YYYY-MM-DD`
2. 时间参数格式为 `HH:MM`
3. 金额单位为人民币（元）
4. 分页从第1页开始
5. 敏感信息（如密码）不会在响应中返回
6. 生产环境请配置强JWT密钥