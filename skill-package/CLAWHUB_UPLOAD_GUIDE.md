# ClawHub 上传指南

## 智餐通 - 智慧餐饮AI助手

---

## 🎯 两种上传方式

### 方式一：从GitHub导入 ⭐（推荐）

由于您的技能包已经在GitHub上，这是最简单的方式！

**步骤：**

1. 访问 **https://clawhub.ai/import**

2. 选择 **"Import from GitHub"** 标签

3. 确保仓库是 **Public**（公开）

4. 填入GitHub仓库地址：
   ```
   https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill
   ```

5. 点击 **"Detect"**，系统会自动识别并填充表单

6. 确认信息后点击 **"Publish skill"**

---

### 方式二：直接上传文件夹

**步骤：**

1. 准备文件夹（至少包含SKILL.md）

   您可以使用 `skill-package` 文件夹：
   - SKILL.md（必需）
   - README.md（可选）
   - skill.json（MCP定义）

2. 访问 **https://clawhub.ai/import**

3. 选择 **"Upload folder"** 标签

4. 填写表单：
   - **Slug**: `zhi-can-tong`（小写+短横线）
   - **Display name**: `智餐通`
   - **Version**: `4.0.0`
   - **Tags**: `latest`

5. 拖拽上传 `skill-package` 文件夹

6. 确认所有验证通过后点击 **"Publish skill"**

---

## 📋 表单填写说明

| 字段 | 示例 | 说明 |
|------|------|------|
| **Slug** | `zhi-can-tong` | 小写字母+短横线，URL标识符 |
| **Display name** | `智餐通` | 显示名称，支持中文 |
| **Owner** | 自动填充 | 留空即可 |
| **Version** | `4.0.0` | 语义化版本号 |
| **Tags** | `latest` | 保留 `latest` |

---

## ⚠️ 注意事项

1. **Slug格式**：
   - ✅ 正确：`zhi-can-tong`
   - ❌ 错误：`智餐通`、`zhixcantong`

2. **文件夹要求**：
   - 必须包含 `SKILL.md` 文件
   - 不要包含 `.git`、`LICENSE`、`.DS_Store` 等非文本文件

3. **许可证**：
   - 必须勾选 **MIT-0** 许可证条款

---

## ✅ 发布成功确认

发布成功后，你会看到：

- ✅ 页面顶部显示绿色成功提示
- ✅ 跳转到技能详情页
- ✅ 地址格式：`https://clawhub.ai/你的用户名/zhi-can-tong`

---

## 🌐 技能详情

- **名称**: 智餐通 (Zhixcantong)
- **描述**: 智慧餐饮AI助手 - 基于MCP协议的专业餐饮服务技能
- **分类**: 餐饮、AI助手
- **工具数量**: 21个
- **作者**: 石中伟

---

## 💡 安装方式

发布后，用户可以通过以下方式安装：

```bash
# 使用clawhub CLI
clawhub install zhi-can-tong

# 或使用openclaw
openclaw skills install zhi-can-tong
```

---

## 📞 支持

如有问题，请访问：
- GitHub Issue: https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill/issues
- ClawHub: https://clawhub.ai

---

**祝您上传成功！🎉**
