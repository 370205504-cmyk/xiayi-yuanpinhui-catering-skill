# 🍽 美食大厨 (Foodie Chef) - Alexa Skill

一款智能餐饮 Alexa Skill，提供菜品推荐、菜单生成和菜谱查询功能。

## ✨ 功能特性

| 功能 | 说明 | 示例语音 |
|------|------|----------|
| 🎯 菜品推荐 | 根据菜系、食材、口味偏好推荐菜品 | "推荐一道川菜" |
| 📋 菜单生成 | 生成早餐/午餐/晚餐菜单 | "帮我安排今天的午餐菜单" |
| 📖 菜谱查询 | 提供详细烹饪步骤 | "告诉我宫保鸡丁的做法" |
| 🎲 随机推荐 | 随机选择一道菜 | "随机推荐一道菜" |

## 🗣 支持的语音指令

### 菜品推荐
- "推荐一道菜"
- "推荐一道川菜"
- "用鸡肉做什么菜"
- "推荐一道辣的菜"
- "推荐一道川菜，用鸡肉做的"

### 菜单生成
- "帮我生成菜单"
- "帮我安排今天的午餐菜单"
- "给3个人做晚餐菜单"
- "安排一日三餐"

### 菜谱查询
- "告诉我宫保鸡丁的做法"
- "怎么做麻婆豆腐"
- "告诉我做法"（查询上次推荐的菜）

### 其他
- "随机推荐一道菜"
- "帮助"
- "退出"

## 📁 项目结构

```
foodie-chef/
├── lambda/                    # AWS Lambda 后端代码
│   ├── index.js               # Skill 主逻辑（处理器、数据库、推荐算法）
│   └── package.json           # Node.js 依赖
├── models/                    # 交互模型
│   ├── zh-CN.json             # 中文交互模型（意图、槽位、类型）
│   └── en-US.json             # 英文交互模型
├── skill-package/             # Skill 包
│   ├── manifest.json          # Skill 清单配置
│   ├── assets/                # 图标等资源
│   └── interactionModels/     # 交互模型副本
├── infrastructure/            # AWS 基础设施
│   └── cfn-deployer.yaml      # CloudFormation 模板
├── .ask/                      # ASK CLI 配置
├── .gitignore
├── package.json               # 项目配置
└── README.md
```

## 🍜 支持的菜系与菜品

### 菜系
川菜、粤菜、湘菜、家常菜、上海菜、台湾菜

### 菜品（20道）
| 菜品 | 菜系 | 口味 | 难度 |
|------|------|------|------|
| 宫保鸡丁 | 川菜 | 香辣 | 中等 |
| 麻婆豆腐 | 川菜 | 麻辣 | 简单 |
| 水煮鱼 | 川菜 | 麻辣 | 较难 |
| 鱼香肉丝 | 川菜 | 酸甜 | 中等 |
| 回锅肉 | 川菜 | 香辣 | 中等 |
| 酸菜鱼 | 川菜 | 酸辣 | 较难 |
| 清蒸鲈鱼 | 粤菜 | 清淡 | 中等 |
| 皮蛋瘦肉粥 | 粤菜 | 清淡 | 简单 |
| 小炒肉 | 湘菜 | 香辣 | 简单 |
| 番茄炒蛋 | 家常菜 | 酸甜 | 简单 |
| 红烧肉 | 家常菜 | 咸鲜 | 中等 |
| 糖醋排骨 | 家常菜 | 酸甜 | 中等 |
| 蛋炒饭 | 家常菜 | 咸鲜 | 简单 |
| 酸辣土豆丝 | 家常菜 | 酸辣 | 简单 |
| 可乐鸡翅 | 家常菜 | 甜 | 简单 |
| 蒜蓉西兰花 | 家常菜 | 清淡 | 简单 |
| 干锅花菜 | 家常菜 | 香辣 | 简单 |
| 红烧茄子 | 家常菜 | 咸鲜 | 简单 |
| 葱油拌面 | 上海菜 | 咸鲜 | 简单 |
| 三杯鸡 | 台湾菜 | 咸鲜 | 中等 |

## 🚀 部署步骤

### 前置条件
1. [Amazon Developer 账号](https://developer.amazon.com/)
2. [AWS 账号](https://aws.amazon.com/)
3. Node.js 18+
4. [ASK CLI](https://developer.amazon.com/en-US/docs/alexa/smapi/ask-cli-intro.html)

### 安装与部署

```bash
# 1. 克隆仓库
git clone https://github.com/YOUR_USERNAME/foodie-chef.git
cd foodie-chef

# 2. 安装依赖
cd lambda && npm install && cd ..

# 3. 使用 ASK CLI 初始化
ask init

# 4. 部署到 AWS Lambda
ask deploy

# 5. 测试
ask simulate -l zh-CN -t "推荐一道川菜"
```

### 手动部署（通过 AWS 控制台）

1. 在 `lambda/` 目录执行 `npm install`
2. 将 `lambda/` 目录打包为 zip
3. 登录 [AWS Lambda 控制台](https://console.aws.amazon.com/lambda/)
4. 创建新函数，上传 zip 包
5. 在 [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask) 创建 Skill
6. 上传 `models/zh-CN.json` 作为交互模型
7. 将 Lambda 函数 ARN 关联到 Skill

## 🧪 测试

### 使用 ASK CLI 测试
```bash
# 模拟中文请求
ask simulate -l zh-CN -t "推荐一道川菜"
ask simulate -l zh-CN -t "帮我生成午餐菜单"
ask simulate -l zh-CN -t "告诉我宫保鸡丁的做法"
ask simulate -l zh-CN -t "随机推荐一道菜"

# 模拟英文请求
ask simulate -l en-US -t "recommend a Chinese dish"
ask simulate -l en-US -t "generate a lunch menu"
```

### 使用 Alexa 开发者控制台测试
1. 打开 [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. 选择你的 Skill
3. 进入 "Test" 标签
4. 在模拟器中输入测试语句

## 🛠 技术栈

- **运行时**: Node.js 18.x (AWS Lambda)
- **SDK**: ASK SDK v2 for Node.js (`ask-sdk-core`)
- **基础设施**: AWS Lambda + CloudFormation
- **语言**: 中文 (zh-CN) + 英文 (en-US)

## 📝 交互模型设计

### 意图 (Intents)

| 意图名称 | 说明 | 关键槽位 |
|----------|------|----------|
| `RecommendDishIntent` | 菜品推荐 | Cuisine, Ingredient, Taste |
| `GenerateMenuIntent` | 菜单生成 | MealType, PersonCount |
| `GetRecipeIntent` | 菜谱查询 | DishName |
| `RandomDishIntent` | 随机推荐 | 无 |
| `AMAZON.HelpIntent` | 帮助 | 无 |

### 自定义槽位类型

| 类型 | 值示例 |
|------|--------|
| `CUISINE_TYPE` | 川菜, 粤菜, 湘菜, 西餐, 日料 |
| `INGREDIENT_TYPE` | 鸡肉, 猪肉, 豆腐, 土豆 |
| `TASTE_TYPE` | 辣, 清淡, 酸甜, 麻辣 |
| `MEAL_TYPE` | 早餐, 午餐, 晚餐, 宵夜 |
| `DISH_NAME` | 宫保鸡丁, 麻婆豆腐, 红烧肉 |

## 📄 许可证

[Apache License 2.0](LICENSE)
