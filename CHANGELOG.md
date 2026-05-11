# Changelog

All notable changes to the **夏邑缘品荟创味菜 (Xiayi Youpinhui Foodie) Alexa Skill** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.0.0] - 2026-05-11

### Added

#### 🍽️ O2O 餐饮功能

- **店铺关联系统**
  - 5家门店数据（县城中心店、城东店、城西店、城郊店、旗舰店）
  - 门店查询功能（按区域、名称、支持服务筛选）
  - 门店距离计算
  - 营业状态检查
  - 门店详情查询

- **外卖点餐系统**
  - 菜品下单功能
  - 订单状态管理（待确认、已确认、制作中、配送中、已完成、已取消）
  - 配送时间估算
  - 订单历史查询
  - 满免配送费规则（满50元免配送费）
  - 订单ID自动生成

- **堂食预约系统**
  - 日期时间预约
  - 人数规模支持（最多20人）
  - 座位可用性检查
  - 预约状态管理
  - 预约时间验证（营业时间09:00-21:00）
  - 预约号自动生成

- **社交分享系统**
  - 小红书分享内容生成
  - 微信分享内容生成
  - 微博分享内容生成
  - 分享链接自动生成
  - 分享卡片数据

#### 🌐 国际化

- **英文交互模型**（en-US）
  - 完整的英文语音指令
  - 英文槽位类型定义
  - 英文门店名称

### Changed

- **项目更名**：美食大厨 → 夏邑缘品荟创味菜
- **唤醒词**
  - 中文：`夏邑缘品荟创味菜`
  - 英文：`xiayi foodie chef`
- **README重写**：包含所有新功能说明
- **package.json更新**：项目名称和描述

### Technical Changes

- **新增数据文件**
  - `lambda/data/stores.json` - 门店数据库
  - `lambda/data/dishes.json` - 菜品数据库（含价格）
  - `lambda/data/recipes.json` - 菜谱数据库

- **新增服务模块**
  - `lambda/utils/orderService.js` - 订单服务
  - `lambda/utils/reservationService.js` - 预约服务
  - `lambda/utils/storeService.js` - 门店服务
  - `lambda/utils/shareService.js` - 分享服务

- **新增意图处理器**
  - `FindStoreIntentHandler` - 门店查询
  - `OrderFoodIntentHandler` - 外卖点餐
  - `MakeReservationIntentHandler` - 堂食预约
  - `ShareDishIntentHandler` - 社交分享

---

## [1.0.0] - 2026-05-11

### Added

- ✅ 菜品推荐功能（按菜系、食材、口味）
- ✅ 菜单生成功能（早餐/午餐/晚餐/一日三餐）
- ✅ 菜谱查询功能（20道经典中餐）
- ✅ 随机推荐功能
- ✅ 中文交互模型（zh-CN）
- ✅ AWS Lambda 部署支持
- ✅ ASK SDK v2 for Node.js
- ✅ CloudFormation 部署模板
- ✅ 完整项目文档
  - README.md
  - CONTRIBUTING.md
  - CHANGELOG.md
  - DISHES.md
- ✅ GitHub Issue/PR 模板
- ✅ Apache License 2.0 许可证

### Project Name

- **美食大厨 (Foodie Chef)**
