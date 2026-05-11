# 🍽️ 夏邑缘品荟创味菜 (Xiayi Youpinhui Foodie) - Alexa Skill

🎙️ **一款开源的智能餐饮 Alexa Skill，提供菜品推荐、菜单生成、菜谱查询、店铺关联、外卖点餐和堂食预约功能。**

[English Version](#english-version) | [快速开始](#快速开始) | [功能演示](#-功能演示) | [部署指南](#部署指南)

---

## 📖 项目简介

**夏邑缘品荟创味菜** 是一个基于 Amazon Alexa 的智能语音助手技能，专注于中餐烹饪领域和本地餐饮服务。用户可以通过语音交互获取个性化的菜品推荐、完整的菜单规划、详细的菜谱指导，并且可以直接查询附近门店、点外卖或预约堂食。

### ✨ 核心功能

| 功能 | 说明 | 示例语音指令 |
|---|---|---|
| 🎯 **智能推荐** | 根据菜系、食材、口味偏好推荐菜品 | "推荐一道川菜" |
| 📋 **菜单生成** | 生成早餐/午餐/晚餐/一日三餐菜单 | "帮我安排今天的午餐菜单" |
| 📖 **菜谱查询** | 提供详细的烹饪步骤和食材清单 | "告诉我宫保鸡丁的做法" |
| 🏪 **店铺查询** | 查找附近门店、营业时间、地址信息 | "附近有哪些门店" |
| 🛵 **外卖点餐** | 直接语音下单外卖，支持配送 | "帮我点一份宫保鸡丁外卖" |
| 📅 **堂食预约** | 预约到店用餐座位和时间 | "我想预约明天晚上6点" |
| 🎲 **随机推荐** | 不知道吃什么？让美食大厨帮您选 | "随机推荐一道菜" |
| 📤 **社交分享** | 一键分享菜品到小红书/微信 | "分享这道菜到小红书" |

---

## 🚀 快速开始

### 前置要求

- [Amazon Developer 账号](https://developer.amazon.com/)
- [AWS 账号](https://aws.amazon.com/)
- Node.js 18.x 或更高版本
- [ASK CLI](https://developer.amazon.com/en-US/docs/alexa/smapi/ask-cli-intro.html) 2.x

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/370205504-cmyk/foodie-chef-alexa-skill.git
cd foodie-chef-alexa-skill

# 2. 安装依赖
cd lambda && npm install && cd ..

# 3. 配置 ASK CLI
ask configure

# 4. 部署 Skill
ask deploy

# 5. 测试
ask simulate -l zh-CN -t "推荐一道川菜"
```

---

## 🗣️ 语音指令示例

### 菜品推荐

```
"Alexa，打开夏邑缘品荟创味菜"
"推荐一道菜"
"推荐一道川菜"
"用鸡肉做什么菜"
"推荐一道辣的菜"
"推荐一道川菜，用鸡肉做的，辣一点的"
```

### 菜单生成

```
"帮我生成菜单"
"帮我安排今天的午餐菜单"
"给3个人做晚餐菜单"
"安排一日三餐"
```

### 菜谱查询

```
"告诉我宫保鸡丁的做法"
"怎么做麻婆豆腐"
"告诉我做法"（查询上次推荐的菜）
```

### 店铺查询

```
"附近有哪些门店"
"夏邑县城的门店地址"
"门店营业时间"
"最近门店是哪家"
"门店联系电话"
```

### 外卖点餐

```
"帮我点一份宫保鸡丁外卖"
"外卖一份红烧肉加一份米饭"
"下单后多久能送到"
"查看我的外卖订单"
"取消我的订单"
```

### 堂食预约

```
"我想预约明天晚上6点"
"帮我在门店订位，2个人"
"查看我的预约"
"修改预约时间"
"取消预约"
```

### 社交分享

```
"分享这道菜到小红书"
"分享到微信朋友圈"
"生成菜品分享卡片"
```

---

## 🏪 店铺网络

### 门店覆盖

夏邑缘品荟创味菜目前在以下区域提供服务：

| 区域 | 门店数量 | 配送范围 |
|------|---------|---------|
| 夏邑县城 | 3家 | 全城配送 |
| 城郊区域 | 2家 | 部分区域 |

### 支持的服务

- ✅ 到店自取
- ✅ 外卖配送
- ✅ 堂食预约
- ✅ 会员积分
- ✅ 优惠券领取

---

## 🍜 支持的菜品

### 菜系覆盖

- **川菜** ：宫保鸡丁、麻婆豆腐、水煮鱼、鱼香肉丝、回锅肉、酸菜鱼
- **粤菜** ：清蒸鲈鱼、皮蛋瘦肉粥
- **湘菜** ：小炒肉
- **家常菜** ：番茄炒蛋、红烧肉、糖醋排骨、蛋炒饭等
- **上海菜** ：葱油拌面
- **台湾菜** ：三杯鸡

### 菜品详情（20道经典中餐）

| 菜品 | 菜系 | 口味 | 难度 | 时间 | 热量 | 可外卖 |
|---|---|---|---|---|---|---|
| 宫保鸡丁 | 川菜 | 香辣 | 中等 | 25分钟 | 320kcal | ✅ |
| 麻婆豆腐 | 川菜 | 麻辣 | 简单 | 20分钟 | 250kcal | ✅ |
| 水煮鱼 | 川菜 | 麻辣 | 较难 | 40分钟 | 380kcal | ✅ |
| 番茄炒蛋 | 家常菜 | 酸甜 | 简单 | 10分钟 | 180kcal | ✅ |
| 红烧肉 | 家常菜 | 咸鲜 | 中等 | 90分钟 | 520kcal | ✅ |
| ... | ... | ... | ... | ... | ... | ... |

*查看完整菜品列表请访问 [DISHES.md](DISHES.md)*

---

## 📁 项目结构

```
foodie-chef/
├── lambda/                          # AWS Lambda 后端代码
│   ├── index.js                   # Skill 主逻辑
│   ├── package.json               # Node.js 依赖
│   ├── data/                     # 数据目录
│   │   ├── dishes.json          # 菜品数据
│   │   ├── stores.json          # 门店数据
│   │   └── recipes.json         # 菜谱数据
│   └── utils/                   # 工具函数
│       ├── orderService.js      # 订单服务
│       ├── reservationService.js # 预约服务
│       ├── storeService.js      # 门店服务
│       └── shareService.js      # 分享服务
├── models/                         # 交互模型
│   ├── zh-CN.json                 # 中文交互模型
│   └── en-US.json                 # 英文交互模型
├── skill-package/                  # Skill 包
│   ├── manifest.json              # Skill 清单
│   └── assets/                    # 图标资源
├── infrastructure/                 # 基础设施
│   └── cfn-deployer.yaml         # CloudFormation 模板
├── .github/                        # GitHub 配置
│   ├── ISSUE_TEMPLATE/            # Issue 模板
│   └── PULL_REQUEST_TEMPLATE.md   # PR 模板
├── tests/                         # 测试文件
├── docs/                          # 文档
├── README.md                      # 项目说明
├── CONTRIBUTING.md                # 贡献指南
├── CHANGELOG.md                   # 更新日志
├── LICENSE                        # 许可证
└── package.json                   # 项目配置
```

---

## 🛠 技术栈

- **运行时** : Node.js 18.x (AWS Lambda)
- **SDK** : [ASK SDK v2 for Node.js](https://developer.amazon.com/docs/alexa/alexa-skills-kit-sdk-for-nodejs/overview.html)
- **部署** : AWS Lambda + CloudFormation
- **语言支持** : 中文 (zh-CN)、英文 (en-US)
- **测试** : Jest
- **数据库** : DynamoDB (订单/预约) + S3 (静态数据)

---

## 🧪 测试

### 本地测试

```bash
# 安装测试依赖
npm install --save-dev jest

# 运行测试
npm test
```

### 使用 ASK CLI 测试

```bash
# 模拟中文请求
ask simulate -l zh-CN -t "推荐一道川菜"
ask simulate -l zh-CN -t "帮我点一份宫保鸡丁外卖"
ask simulate -l zh-CN -t "我想预约明天晚上6点"
ask simulate -l zh-CN -t "分享这道菜到小红书"
```

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与项目。

### 快速贡献步骤

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 菜品贡献

如果您想添加新的菜品，请参考 [DISHES.md](DISHES.md) 的格式，并提交 Pull Request。

### 门店入驻

如果您是餐饮商家，想加入夏邑缘品荟创味菜平台，请提交 [门店入驻申请](https://github.com/370205504-cmyk/foodie-chef-alexa-skill/issues/new?template=store-application.md)。

---

## 📋 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解所有版本更新历史。

### 最新版本 v2.0.0

- ✅ 项目更名为"夏邑缘品荟创味菜"
- ✅ 新增店铺关联功能
- ✅ 新增外卖点餐功能
- ✅ 新增堂食预约功能
- ✅ 新增社交分享功能（小红书/微信）
- ✅ 完整的O2O餐饮闭环

---

## 📝 交互模型设计

### 意图 (Intents)

| 意图名称 | 类型 | 说明 | 关键槽位 |
|---|---|---|---|
| `RecommendDishIntent` | 自定义 | 菜品推荐 | Cuisine, Ingredient, Taste |
| `GenerateMenuIntent` | 自定义 | 菜单生成 | MealType, PersonCount |
| `GetRecipeIntent` | 自定义 | 菜谱查询 | DishName |
| `RandomDishIntent` | 自定义 | 随机推荐 | - |
| `FindStoreIntent` | 自定义 | 门店查询 | Location, StoreName |
| `OrderFoodIntent` | 自定义 | 外卖点餐 | DishName, Quantity, Address |
| `MakeReservationIntent` | 自定义 | 堂食预约 | Date, Time, PersonCount |
| `ShareDishIntent` | 自定义 | 社交分享 | Platform, DishName |
| `AMAZON.HelpIntent` | 内置 | 帮助 | - |
| `AMAZON.CancelIntent` | 内置 | 取消 | - |
| `AMAZON.StopIntent` | 内置 | 停止 | - |

### 自定义槽位类型

| 类型 | 描述 | 示例值 |
|---|---|---|
| `CUISINE_TYPE` | 菜系 | 川菜、粤菜、湘菜、西餐、日料 |
| `INGREDIENT_TYPE` | 食材 | 鸡肉、猪肉、豆腐、土豆 |
| `TASTE_TYPE` | 口味 | 辣、清淡、酸甜、麻辣 |
| `MEAL_TYPE` | 餐别 | 早餐、午餐、晚餐、宵夜 |
| `DISH_NAME` | 菜品名 | 宫保鸡丁、麻婆豆腐、红烧肉 |
| `SHARE_PLATFORM` | 分享平台 | 小红书、微信、朋友圈 |
| `LOCATION` | 位置 | 夏邑县城、城郊、附近 |
| `DATE` | 日期 | 明天、后天、周六 |
| `TIME` | 时间 | 晚上6点、中午12点 |

---

## 📄 许可证

本项目采用 [Apache License 2.0](LICENSE) 开源许可证。

---

## 🙏 致谢

- [Amazon Alexa Skills Kit](https://developer.amazon.com/alexa/alexa-skills-kit)
- [ASK SDK for Node.js](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs)
- 所有贡献者和用户

---

## 📮 联系我们

- **GitHub Issues** : [提交问题](https://github.com/370205504-cmyk/foodie-chef-alexa-skill/issues)
- **Pull Requests** : [贡献代码](https://github.com/370205504-cmyk/foodie-chef-alexa-skill/pulls)

---

## 🌐 English Version

**Xiayi Youpinhui Foodie** is an open-source Alexa Skill for intelligent dish recommendation, menu generation, store association, food ordering, and reservation.

### Features

- 🎯 **Dish Recommendation** : Based on cuisine, ingredients, and taste preferences
- 📋 **Menu Generation** : Generate breakfast, lunch, dinner, or full-day menus
- 📖 **Recipe Lookup** : Detailed cooking instructions with ingredients
- 🏪 **Store Locator** : Find nearby stores and get store information
- 🛵 **Food Ordering** : Place delivery orders directly via voice
- 📅 **Reservations** : Book tables for dine-in
- 📤 **Social Sharing** : Share dishes to Xiaohongshu/WeChat
- 🎲 **Random Pick** : Let Foodie surprise you with a random dish

### Quick Start

```bash
git clone https://github.com/370205504-cmyk/foodie-chef-alexa-skill.git
cd foodie-chef-alexa-skill
cd lambda && npm install && cd ..
ask deploy
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to contribute.

---

Made with ❤️ by 夏邑缘品荟创味菜 Team