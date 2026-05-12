---
name: 智餐通
description: 智慧餐饮AI助手 - 基于MCP协议的专业餐饮服务技能，支持菜单查询、智能推荐、订单管理、排队取号、会员服务等完整餐饮场景。
version: 4.0.0
tags:
  - 餐饮
  - 点餐
  - 智能推荐
  - 餐饮管理
  - AI助手
  - MCP
requirements:
  - Node.js >= 16.0.0
  - MySQL >= 8.0
  - Redis >= 6.0
author: 石中伟
license: MIT
links:
  github: https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill
---

# 🍽️ 智餐通 - 智慧餐饮AI助手

智餐通是基于MCP协议的专业餐饮服务技能，让您的AI助手瞬间变身为智能餐饮管家。

## ✨ 核心功能

### 🤖 智能服务
- **菜单查询** - 支持21个分类筛选、分页浏览
- **智能推荐** - 基于用户偏好、季节节日个性化推荐
- **自然语言** - 支持口语化点餐

### 🛒 完整交易
- **购物车管理** - 添加、删除、修改、清空
- **订单处理** - 创建、查询、取消（带幂等性）
- **支付集成** - 微信、支付宝、会员余额

### 🎫 会员服务
- **会员信息** - 积分、余额、等级查询
- **优惠券** - 领取、使用、查询
- **发票开具** - 个人/公司发票

### ⏰ 排队管理
- **排队取号** - 实时排队、叫号通知
- **进度查询** - 预估等待时间
- **包间预订** - 提前预约包厢

## 🛠️ 21个专业工具

| 工具 | 功能 |
|------|------|
| get_menu | 获取菜单 |
| get_dish_detail | 菜品详情 |
| recommend_dishes | 智能推荐 |
| add_to_cart | 添加购物车 |
| remove_from_cart | 移除购物车 |
| get_cart | 查看购物车 |
| clear_cart | 清空购物车 |
| create_order | 创建订单 |
| get_orders | 订单列表 |
| get_order_detail | 订单详情 |
| cancel_order | 取消订单 |
| queue_take | 排队取号 |
| query_queue | 查询进度 |
| cancel_queue | 取消排队 |
| get_store_info | 门店信息 |
| get_wifi_info | WiFi信息 |
| issue_invoice | 开具发票 |
| reserve_room | 预订包间 |
| get_events | 活动查询 |
| get_coupons | 优惠券 |
| get_member_info | 会员信息 |

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis >= 6.0

### 安装部署
```bash
git clone https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill.git
cd xiayi-yuanpinhui-catering-skill/lambda
npm install
npm run migrate:tenant
npm start
```

## 🔐 安全特性

- **多租户隔离** - 每个商家数据完全隔离
- **幂等性保证** - 防止重复下单
- **支付签名验证** - 微信/支付宝完整验证
- **RBAC权限控制** - 细粒度角色管理
- **限流熔断** - 多维度保护

## 📚 文档

完整文档和API说明请访问：
https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill

## 👨‍💻 作者

石中伟

## 📄 许可证

MIT License
