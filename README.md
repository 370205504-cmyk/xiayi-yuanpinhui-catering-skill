# 🍽️ 夏邑缘品荟创味菜 (Xiayi Youpinhui Foodie) - Alexa Skill

🎙️ **一款开源的智能餐饮 Alexa Skill，提供菜品推荐、菜单生成、菜谱查询、店铺关联、外卖点餐、堂食预约、客人自主下单和智能推荐功能，支持语音和文字双通道交互。**

🛠️ **开发者：石中伟**

[English Version](#english-version) | [快速开始](#快速开始) | [功能演示](#-功能演示) | [部署指南](#部署指南) | [文字API](#文字api接口) | [Web界面](#web界面)

---

## 👨‍💻 开发者信息

| 项目 | 信息 |
|------|------|
| **开发者** | 石中伟 |
| **联系邮箱** | contact@shizhongwei.com |
| **GitHub** | [shizhongwei](https://github.com/shizhongwei) |

---

## 📖 项目简介

**夏邑缘品荟创味菜** 是一个基于 Amazon Alexa 的智能语音助手技能，专注于中餐烹饪领域和本地餐饮服务。用户可以通过语音或文字交互获取个性化的菜品推荐、完整的菜单规划、详细的菜谱指导，并且可以直接查询附近门店、点外卖、预约堂食、查询WiFi密码、连接打印机打印小票，以及进行自主下单。

### ✨ 核心功能

| 功能 | 说明 | 示例语音/文字指令 |
|---|---|---|
| 🎯 **智能推荐** | 根据客户喜好推荐菜品和套餐 | "推荐一道川菜" / "我喜欢辣的重口味" |
| 📋 **菜单生成** | 生成早餐/午餐/晚餐/一日三餐菜单 | "帮我安排今天的午餐菜单" |
| 📖 **菜谱查询** | 提供详细的烹饪步骤和食材清单 | "告诉我宫保鸡丁的做法" |
| 🏪 **店铺查询** | 查找附近门店、营业时间、地址信息 | "附近有哪些门店" |
| 📶 **WiFi密码** | 查询店铺WiFi密码 | "WiFi密码是多少" |
| 🛵 **外卖点餐** | 直接语音下单外卖，支持配送 | "帮我点一份宫保鸡丁外卖" |
| 📱 **自主下单** | 客人扫描二维码自主点餐 | "我要扫码下单" |
| 🖨️ **打印机连接** | 连接打印机自动打印订单小票 | "打印订单" |
| 📅 **堂食预约** | 预约到店用餐座位和时间 | "我想预约明天晚上6点" |
| 📤 **社交分享** | 一键分享菜品到小红书/微信 | "分享这道菜到小红书" |
| 🎲 **随机推荐** | 不知道吃什么？让美食大厨帮您选 | "随机推荐一道菜" |
| 📜 **菜单显示** | 显示完整菜单供客人选择 | "给我看看菜单" |
| 💬 **文字交互** | 支持文字输入，无需语音 | 直接发送文字消息 |

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

# 4. 一键部署
./deploy.sh

# 5. 测试语音功能
ask simulate -l zh-CN -t "推荐一道川菜"
```

### 一键部署

项目提供 `deploy.sh` 脚本，一键完成所有部署：

```bash
./deploy.sh
```

部署完成后，您将获得：
- ✅ Alexa Skill 语音功能
- ✅ Lambda 函数
- ✅ 文字 API 接口
- ✅ Web 界面托管地址

---

## 🗣️ 语音/文字指令示例

### 菜品推荐（智能推荐）

```
"推荐一道菜"
"你喜欢什么口味的？"
"我最近想吃辣的"
"给我推荐适合小孩的"
"上次我点了红烧肉，推荐类似的"
"推荐一个套餐"
```

### 菜单显示

```
"给我看看菜单"
"显示今日菜单"
"有什么招牌菜"
"素菜有哪些"
"适合素食者的菜品"
```

### WiFi密码

```
"WiFi密码是多少"
"WiFi怎么连"
"店里WiFi"
"无线网络密码"
```

### 客人自主下单

```
"我要扫码下单"
"给我下单二维码"
"我想自己点餐"
"我要自己选菜"
"显示点餐二维码"
```

### 打印机连接

```
"打印我的订单"
"连接打印机"
"打印小票"
"打印菜单"
```

### 店铺查询

```
"附近有哪些门店"
"门店地址和营业时间"
"联系电话是多少"
"门店WiFi密码"
```

### 外卖点餐

```
"帮我点一份宫保鸡丁外卖"
"外卖一份红烧肉加一份米饭"
"下单后多久能送到"
"查看我的外卖订单"
```

### 堂食预约

```
"我想预约明天晚上6点"
"帮我在门店订位，2个人"
"查看我的预约"
"取消预约"
```

---

## 💬 文字API接口

部署完成后，您可以通过 HTTP POST 请求调用文字 API：

### 接口地址

```
POST https://{api-id}.execute-api.{region}.amazonaws.com/prod/text
```

### 请求格式

```json
{
  "text": "推荐一道川菜",
  "userId": "optional-user-id"
}
```

### 响应格式

```json
{
  "response": "为您推荐：宫保鸡丁！这是一道川菜，口味麻辣..."
}
```

### 测试脚本

项目提供 `test-api.sh` 脚本用于测试 API：

```bash
./test-api.sh "推荐一道川菜"
```

---

## 🌐 Web界面

部署完成后，您可以通过 Web 界面与智能助手进行文字交互：

### 访问地址

部署后可在 CloudFormation 输出中找到 `WebHostingUrl`。

### Web界面功能

- 💬 文字聊天界面
- 🔘 快捷按钮（推荐菜品、查看菜单、查询WiFi等）
- 📱 响应式设计，支持手机和电脑访问

### 功能按钮

| 按钮 | 功能 |
|------|------|
| 🎯 推荐菜品 | 根据偏好推荐菜品 |
| 📜 查看菜单 | 显示完整菜单 |
| 📶 WiFi密码 | 查询WiFi信息 |
| 📱 扫码下单 | 生成分享二维码 |

---

## 🏪 店铺网络

### 门店覆盖

夏邑缘品荟创味菜目前在以下区域提供服务：

| 区域 | 门店数量 | WiFi | 打印机 | 配送范围 |
|------|---------|------|--------|---------|
| 夏邑县城 | 3家 | ✅ | ✅ | 全城配送 |
| 城郊区域 | 2家 | ✅ | ✅ | 部分区域 |

### 门店特色服务

| 服务项目 | 支持门店 | 说明 |
|---------|---------|------|
| 📶 WiFi连接 | 全部 | 提供WiFi名称和密码 |
| 🖨️ 打印机 | 全部 | 支持自动打印订单小票 |
| 📱 自主下单 | 全部 | 扫码自主点餐 |
| 🛵 外卖配送 | 全部 | 全城配送服务 |
| 📅 堂食预约 | 5家 | 支持座位预约 |

---

## 📁 项目结构

```
foodie-chef/
├── lambda/                          # AWS Lambda 后端代码
│   ├── index.js                   # Skill 主逻辑（含文字API入口）
│   ├── textHandler.js             # 文字请求处理
│   ├── config.json                # 统一配置文件
│   ├── package.json               # Node.js 依赖
│   ├── web/                       # Web界面
│   │   └── index.html             # 聊天界面
│   ├── data/                     # 数据目录
│   │   ├── dishes.json          # 菜品数据（含推荐标签）
│   │   ├── stores.json          # 门店数据（含WiFi、打印机）
│   │   ├── recipes.json         # 菜谱数据
│   │   └── customerProfiles.json # 客户偏好数据
│   └── utils/                   # 工具函数
│       ├── orderService.js      # 订单服务
│       ├── reservationService.js # 预约服务
│       ├── storeService.js      # 门店服务
│       ├── shareService.js      # 分享服务
│       ├── wifiService.js       # WiFi服务（读取config.json）
│       ├── printerService.js    # 打印机服务（读取config.json）
│       ├── selfOrderService.js  # 自主下单服务
│       └── recommendationService.js # 智能推荐服务
├── models/                         # 交互模型
│   ├── zh-CN.json                 # 中文交互模型（含TextInputIntent）
│   └── en-US.json                 # 英文交互模型
├── skill-package/                  # Skill 包
│   ├── manifest.json              # Skill 清单
│   └── assets/                    # 图标资源
├── infrastructure/                 # 基础设施
│   └── cfn-deployer.yaml        # CloudFormation 模板（含文字API）
├── deploy.sh                      # 一键部署脚本
├── test-api.sh                    # API测试脚本
├── update-data.sh                 # 数据更新脚本
├── README.md                      # 项目说明
├── CONTRIBUTING.md                # 贡献指南
├── CHANGELOG.md                   # 更新日志
└── LICENSE                        # 许可证
```

---

## ⚙️ 配置说明

所有配置集中在 `lambda/config.json` 文件中，修改配置后重新部署即可生效：

```json
{
  "skill": {
    "name": "夏邑缘品荟创味菜",
    "invocationName": "夏邑缘品荟创味菜"
  },
  "restaurant": {
    "name": "夏邑缘品荟创味菜",
    "address": "夏邑县孔祖大道南段",
    "phone": "0370-628-8888"
  },
  "wifi": {
    "default": {
      "ssid": "缘品荟免费WiFi",
      "password": "88888888"
    }
  },
  "printer": {
    "default": {
      "ip": "192.168.1.100",
      "port": 9100
    }
  },
  "stores": [
    {
      "name": "总店",
      "address": "夏邑县孔祖大道南段123号",
      "hours": "10:00-22:00"
    }
  ]
}
```

---

## 🛠 技术栈

- **开发者** : 石中伟
- **运行时** : Node.js 18.x (AWS Lambda)
- **SDK** : [ASK SDK v2 for Node.js](https://developer.amazon.com/docs/alexa/alexa-skills-kit-sdk-for-nodejs/overview.html)
- **部署** : AWS Lambda + CloudFormation + API Gateway
- **语言支持** : 中文 (zh-CN)、英文 (en-US)
- **测试** : Jest
- **打印机支持** : ESC/POS 协议
- **Web托管** : AWS S3 + CloudFront

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与项目。

---

## 📋 更新日志

查看 [CHANGELOG.md](CHANGELOG.md) 了解所有版本更新历史。

### 最新版本 v2.2.0

- ✅ **文字交互入口**：新增 HTTP API 接口，支持文字输入交互
- ✅ **统一配置管理**：所有配置集中在 config.json
- ✅ **一键部署脚本**：deploy.sh 简化部署流程
- ✅ **Web界面**：新增极简聊天界面
- ✅ **API Gateway**：新增文字 API 网关配置
- ✅ **S3托管**：新增 Web 界面静态托管

### v2.1.0 历史版本

- ✅ **开发者更新**：石中伟
- ✅ **WiFi密码功能**：查询和显示店铺WiFi信息
- ✅ **菜单显示功能**：展示完整菜单供客人选择
- ✅ **智能推荐系统**：基于客户喜好和历史记录推荐
- ✅ **打印机连接**：支持打印订单小票和菜单
- ✅ **客人自主下单**：扫码自主点餐系统
- ✅ **地址和营业时间**：完善门店信息

---

## 📝 交互模型设计

### 新增意图 (Intents)

| 意图名称 | 类型 | 说明 | 关键槽位 |
|---|---|---|---|
| `TextInputIntent` | 自定义 | 文字输入交互 | TextInput |
| `ShowMenuIntent` | 自定义 | 显示完整菜单 | Category, DishType |
| `GetWifiPasswordIntent` | 自定义 | 获取WiFi密码 | StoreName |
| `SelfOrderIntent` | 自定义 | 自主下单 | - |
| `ConnectPrinterIntent` | 自定义 | 连接打印机 | PrinterAction |
| `SmartRecommendIntent` | 自定义 | 智能推荐 | Preference, History |
| `ShowComboIntent` | 自定义 | 显示套餐 | ComboType |

### 新增槽位类型

| 类型 | 描述 | 示例值 |
|---|---|---|
| `AMAZON.SearchQuery` | 通用搜索查询 | 用于文字输入 |
| `MENU_CATEGORY` | 菜单分类 | 招牌菜、素菜、儿童餐、套餐 |
| `DISH_TYPE` | 菜品类型 | 凉菜、热菜、汤、主食 |
| `PRINTER_ACTION` | 打印操作 | 打印订单、打印小票、打印菜单 |
| `COMBO_TYPE` | 套餐类型 | 单人餐、双人餐、家庭餐、商务餐 |

---

## 📄 许可证

本项目采用 [Apache License 2.0](LICENSE) 开源许可证。

---

## 👨‍💻 开发者

**石中伟** - 项目创始人及主要开发者

- GitHub: [shizhongwei](https://github.com/shizhongwei)
- Email: contact@shizhongwei.com

---

## 🙏 致谢

- [Amazon Alexa Skills Kit](https://developer.amazon.com/alexa/alexa-skills-kit)
- [ASK SDK for Node.js](https://github.com/alexa/alexa-skills-kit-sdk-for-nodejs)
- 所有贡献者和用户

---

## 📮 联系我们

- **开发者** : 石中伟
- **GitHub Issues** : [提交问题](https://github.com/370205504-cmyk/foodie-chef-alexa-skill/issues)
- **Pull Requests** : [贡献代码](https://github.com/370205504-cmyk/foodie-chef-alexa-skill/pulls)

---

## 🌐 English Version

**Xiayi Youpinhui Foodie** is an open-source Alexa Skill developed by **石中伟 (Shi Zhongwei)** for intelligent dish recommendation, menu display, WiFi info, printer connection, self-ordering, and reservation. Now with **text API** and **web interface** support!

### Features

- 🎯 **Smart Recommendation** : Based on customer preferences and history
- 📜 **Menu Display** : Show complete menu for customers
- 📶 **WiFi Password** : Get store WiFi information
- 🖨️ **Printer Connection** : Print order receipts
- 📱 **Self-Ordering** : QR code self-service ordering
- 💬 **Text API** : HTTP API for text interactions
- 🌐 **Web Interface** : Browser-based chat interface
- 🏪 **Store Locator** : Find nearby stores
- 🛵 **Food Ordering** : Place delivery orders
- 📅 **Reservations** : Book tables

### Developer

**Shi Zhongwei (石中伟)** - Project Founder & Lead Developer

### Quick Start

```bash
git clone https://github.com/370205504-cmyk/foodie-chef-alexa-skill.git
cd foodie-chef-alexa-skill
cd lambda && npm install && cd ..
./deploy.sh
```

Made with ❤️ by 石中伟
