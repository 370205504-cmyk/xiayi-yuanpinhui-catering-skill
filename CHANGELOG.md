# Changelog

All notable changes to the **夏邑缘品荟创味菜 (Xiayi Youpinhui Foodie) Alexa Skill** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.1.0] - 2026-05-11

### Added

#### 👨‍💻 开发者信息更新

- **开发者**: 石中伟
- **联系邮箱**: contact@shizhongwei.com
- **GitHub**: shizhongwei

#### 📶 WiFi密码连接功能

- **门店WiFi查询**
  - 支持查询各门店WiFi名称和密码
  - 支持按门店名称筛选
  - WiFi连接指南

- **WiFi配置**
  - 县城中心店: XYYP_001_Guest / 88888888
  - 城东店: XYYP_002_WiFi / 66666666
  - 城西店: XYYP_003_Free / 55555555
  - 城郊店: XYYP_004 / 44444444
  - 旗舰店: XYYP_005_VIP / 99999999

#### 📜 菜单显示功能

- **分类展示**
  - 招牌菜展示
  - 素菜展示
  - 儿童餐展示
  - 套餐展示
  - 按类型分类（凉菜、热菜、汤、主食）

- **菜品详情**
  - 价格、口味、难度
  - 食材信息
  - 推荐标签（招牌、素菜、儿童）

#### 🎯 智能推荐系统

- **基于客户喜好**
  - 口味偏好学习
  - 历史订单推荐
  - 相似菜品推荐
  - 场景匹配（儿童、老人、商务、聚会等）

- **智能匹配算法**
  - 计算菜品匹配度
  - 综合评分排序
  - 推荐理由生成

- **套餐推荐**
  - 单人套餐
  - 双人套餐
  - 家庭套餐
  - 儿童营养套餐
  - 商务宴请套餐

#### 🖨️ 打印机连接功能

- **打印机管理**
  - 打印机连接/断开
  - 打印机状态检查
  - 墨水和纸张状态

- **打印服务**
  - 订单小票打印（自动）
  - 菜单打印
  - 预约单打印

- **小票格式**
  - 订单信息完整展示
  - 收银小票样式
  - 中文支持

#### 📱 客人自主下单

- **二维码生成**
  - 点餐二维码
  - 菜单二维码
  - 桌台二维码
  - 时效性验证

- **扫码点餐**
  - 语音引导扫码
  - 自主选择菜品
  - 订单状态跟踪

#### 🏪 门店信息完善

- **地址信息**
  - 完整街道地址
  - 区域标注
  - 导航支持

- **营业时间**
  - 各店营业时间
  - 差异化营业时间

- **服务标识**
  - WiFi支持
  - 打印机支持
  - 自主下单支持
  - 外卖/堂食支持

### Changed

- **package.json**: 更新开发者信息
- **README.md**: 完整重写，包含所有新功能
- **门店数据**: 所有门店添加WiFi、打印机信息
- **菜品数据**: 添加推荐标签、分类信息

### Technical Changes

- **新增服务模块**
  - `wifiService.js` - WiFi密码服务
  - `printerService.js` - 打印机服务
  - `selfOrderService.js` - 自主下单服务
  - `recommendationService.js` - 智能推荐算法

- **新增数据文件**
  - 门店WiFi配置
  - 套餐数据
  - 客户偏好数据

- **新增意图处理器**
  - `SmartRecommendIntentHandler` - 智能推荐
  - `ShowMenuIntentHandler` - 菜单显示
  - `GetWifiPasswordIntentHandler` - WiFi密码
  - `SelfOrderIntentHandler` - 自主下单
  - `ConnectPrinterIntentHandler` - 打印机连接
  - `ShowComboIntentHandler` - 套餐查询

- **新增交互模型**
  - WiFi密码查询意图
  - 菜单显示意图
  - 自主下单意图
  - 打印机操作意图
  - 套餐查询意图
  - 智能推荐意图

---

## [2.0.0] - 2026-05-11

### Added

#### 🍽️ O2O 餐饮功能

- 店铺关联系统
- 外卖点餐系统
- 堂食预约系统
- 社交分享系统

#### 🌐 国际化

- 中文交互模型 (zh-CN)
- 英文交互模型 (en-US)

---

## [1.0.0] - 2026-05-11

### Added

- 菜品推荐功能
- 菜单生成功能
- 菜谱查询功能
- 随机推荐功能
- AWS Lambda 部署支持
- ASK SDK v2 for Node.js
- 完整项目文档

### Project Info

- **开发者**: 石中伟
- **项目名称**: 夏邑缘品荟创味菜
