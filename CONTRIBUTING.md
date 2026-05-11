# 🤝 贡献指南

感谢您考虑为 **美食大厨 (Foodie Chef)** 做出贡献！

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
  - [报告 Bug](#报告-bug)
  - [建议新功能](#建议新功能)
  - [提交代码](#提交代码)
- [开发流程](#开发流程)
- [代码规范](#代码规范)
- [提交信息规范](#提交信息规范)

---

## 行为准则

本项目遵循 [Contributor Covenant](https://www.contributor-covenant.org/) 行为准则。参与本项目即表示您同意遵守此准则。

### 我们的承诺

- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

---

## 如何贡献

### 报告 Bug

如果您发现了 Bug，请通过 [GitHub Issues](https://github.com/370205504-cmyk/foodie-chef-alexa-skill/issues) 报告。

**提交 Bug 报告前，请检查：**
- [ ] 该 Bug 尚未被报告
- [ ] 您使用的是最新版本

**Bug 报告应包含：**
- 问题的清晰描述
- 复现步骤
- 期望行为 vs 实际行为
- 截图（如适用）
- 环境信息（Node.js 版本、ASK CLI 版本等）

### 建议新功能

我们欢迎新功能建议！请通过 [GitHub Issues](https://github.com/370205504-cmyk/foodie-chef-alexa-skill/issues) 提交，并使用 `enhancement` 标签。

**功能建议应包含：**
- 功能的清晰描述
- 使用场景
- 可能的实现方案（可选）

### 提交代码

#### 快速开始

1. **Fork 仓库**
   ```bash
   # 点击 GitHub 页面的 Fork 按钮
   ```

2. **克隆您的 Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/foodie-chef-alexa-skill.git
   cd foodie-chef-alexa-skill
   ```

3. **添加上游仓库**
   ```bash
   git remote add upstream https://github.com/370205504-cmyk/foodie-chef-alexa-skill.git
   ```

4. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/bug-description
   ```

5. **进行更改**
   - 编写代码
   - 添加测试
   - 更新文档

6. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加新功能描述"
   ```

7. **推送到您的 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **创建 Pull Request**
   - 访问原仓库
   - 点击 "New Pull Request"
   - 选择您的分支
   - 填写 PR 描述

---

## 开发流程

### 环境设置

```bash
# 1. 安装依赖
cd lambda && npm install && cd ..

# 2. 配置 ASK CLI
ask configure

# 3. 运行测试
npm test
```

### 项目结构

```
foodie-chef/
├── lambda/           # 后端代码
│   ├── index.js      # 主逻辑
│   └── package.json
├── models/           # 交互模型
│   ├── zh-CN.json
│   └── en-US.json
├── tests/            # 测试文件
└── docs/             # 文档
```

### 添加新菜品

如果您想添加新菜品到数据库，请编辑 `lambda/index.js`：

```javascript
const dishDatabase = {
  // 在现有菜品后添加
  '新菜品名': {
    name: '新菜品名',
    cuisine: '菜系',
    taste: '口味',
    ingredients: ['食材1', '食材2'],
    difficulty: '简单|中等|较难',
    cookTime: 'XX分钟',
    calories: XXX,
    description: '菜品描述',
    steps: [
      '步骤1',
      '步骤2',
      // ...
    ]
  }
};
```

同时更新：
- `cuisineDishMap` - 菜系映射
- `tasteDishMap` - 口味映射
- `ingredientDishMap` - 食材映射

---

## 代码规范

### JavaScript 规范

- 使用 ES6+ 语法
- 使用单引号 `'string'`
- 缩进使用 2 个空格
- 行尾不使用分号（可选）
- 最大行长度 100 字符

### 示例

```javascript
// ✅ 好的代码
const recommendDish = (cuisine, ingredient, taste) => {
  let candidates = getAllDishNames()
  
  if (cuisine) {
    const cuisineDishes = cuisineDishMap[cuisine] || []
    candidates = candidates.filter(d => cuisineDishes.includes(d))
  }
  
  return getRandomItem(candidates)
}

// ❌ 避免
const recommendDish=function(cuisine,ingredient,taste){
var candidates=getAllDishNames();
if(cuisine){
var cuisineDishes=cuisineDishMap[cuisine]||[];
candidates=candidates.filter(function(d){return cuisineDishes.includes(d)});
}
return getRandomItem(candidates);
}
```

### 注释规范

- 使用 JSDoc 注释函数
- 复杂逻辑添加行内注释
- 使用中文注释（本项目主要面向中文用户）

```javascript
/**
 * 根据条件推荐菜品
 * @param {string} cuisine - 菜系
 * @param {string} ingredient - 食材
 * @param {string} taste - 口味
 * @returns {string} 推荐的菜品名称
 */
function recommendDish(cuisine, ingredient, taste) {
  // 实现代码
}
```

---

## 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型 (Type)

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具相关 |

### 示例

```bash
# 新功能
feat: 添加随机推荐功能

# Bug 修复
fix: 修复菜单生成时重复菜品的问题

# 文档
docs: 更新 README 添加部署说明

# 代码重构
refactor(dish): 优化推荐算法

# 添加菜品
data: 添加 5 道新川菜
```

---

## 审核流程

1. 提交 PR 后，维护者会进行审核
2. 可能需要根据反馈进行修改
3. 通过审核后会被合并到 main 分支
4. 合并后您的贡献将出现在下一个版本中

---

## 问题与支持

- 💬 一般讨论：[GitHub Discussions](https://github.com/370205504-cmyk/foodie-chef-alexa-skill/discussions)
- 🐛 Bug 报告：[GitHub Issues](https://github.com/370205504-cmyk/foodie-chef-alexa-skill/issues)
- 📧 其他问题：通过 GitHub 联系

---

## 致谢

感谢所有为美食大厨做出贡献的开发者！

<a href="https://github.com/370205504-cmyk/foodie-chef-alexa-skill/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=370205504-cmyk/foodie-chef-alexa-skill" />
</a>
