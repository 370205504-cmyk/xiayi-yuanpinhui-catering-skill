# 夏邑缘品荟智能餐饮 MCP Skill

## 概述

这是一个完整符合 MCP (Model Context Protocol) 标准的餐饮系统 Agent Skill，支持多租户隔离、幂等性控制、状态机、RBAC权限等企业级特性。

## 版本

- v4.0.0

## 平台接入

### 扣子 (Coze)

1. 在扣子平台创建新的 Skill
2. 上传 `skill.json` 文件
3. 配置以下环境变量：
   - `MCP_ENDPOINT`: 你的 API 端点
   - `API_KEY`: 你的 API Key
4. 测试调用工具

### 龙虾 (Dify)

1. 在 Dify 创建自定义工具
2. 导入 `skill.json` 中的工具定义
3. 配置 API 认证方式为 API Key
4. 配置各工具的请求参数映射

## 认证方式

### API Key 认证

- **Header**: `X-API-Key`
- **值**: `sk_xxx...`
- **租户 ID**: `X-Tenant-Id`

### 多租户

- 系统支持单个实例运行多个独立的商家
- 每个商家有独立的数据隔离
- 支持计费和配额管理

## 工具列表

### 1. get_menu
获取菜单
- **分类**: 招牌菜、特色硬菜、宴请首选、餐前开胃、家常炒菜、汤羹主食、全部

### 2. get_dish_detail
获取菜品详情

### 3. recommend_dishes
智能推荐菜品

### 4. add_to_cart
添加到购物车

### 5. remove_from_cart
从购物车移除

### 6. get_cart
获取购物车

### 7. clear_cart
清空购物车

### 8. create_order
创建订单（幂等）

### 9. get_orders
获取订单列表

### 10. get_order_detail
获取订单详情

### 11. cancel_order
取消订单

### 12. queue_take
排队取号（幂等）

### 13. query_queue
查询排队进度

### 14. cancel_queue
取消排队

### 15. get_store_info
获取门店信息

### 16. get_wifi_info
获取 WiFi 信息

### 17. issue_invoice
开具发票

### 18. reserve_room
预订包间

### 19. get_events
获取活动信息

### 20. get_coupons
获取优惠券

### 21. get_member_info
获取会员信息

### 22. apply_invoice
申请开具发票

## 错误码

| 错误码 | 说明 |
|--------|------|
| 1001 | 参数错误或缺少必要参数 |
| 1002 | 业务逻辑错误 |
| 1003 | 权限不足 |
| 1004 | 资源不存在 |
| 1005 | 需要修改密码 |
| 1006 | 请求过于频繁 |
| 1007 | 签名验证失败 |
| 1008 | 请求包含非法字符 |
| 1009 | 幂等键无效或已使用 |
| 1010 | CSRF验证失败 |
| 2001 | 订单不存在 |
| 2002 | 菜品不存在 |
| 2003 | 库存不足 |
| 2004 | 订单状态不允许此操作 |
| 2005 | 订单已支付 |
| 3001 | 排队不存在 |
| 3002 | 排队已取消 |
| 3003 | 排队已叫号 |
| 4001 | 租户不存在或已禁用 |
| 4002 | API Key无效或已过期 |
| 5001 | 支付失败 |
| 5002 | 退款失败 |

## 安全特性

1. **多租户隔离**: 每个商家数据完全隔离
2. **幂等性**: 所有写操作支持幂等性，防止重复请求
3. **支付签名验证**: 微信/支付宝回调签名完整验证
4. **RBAC权限控制**: 细粒度的角色权限管理
5. **限流熔断**: 多维度的限流和熔断保护
6. **XSS/CSRF防护**: 内置安全防护中间件

## 部署

### 本地开发

```bash
npm install
npm run migrate:tenant
npm run dev
```

### 生产部署

```bash
npm start
```

### 数据库

```bash
npm run migrate:tenant
```

## 联系方式

- 作者: 石中伟
- 仓库: https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill
