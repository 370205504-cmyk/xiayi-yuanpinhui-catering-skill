# 扣子(Coze)平台上传指南

## 智餐通 - 智慧餐饮AI助手

---

## 📋 上传前准备

### 1. 获取GitHub仓库地址

您的技能包已上传到GitHub：
- **仓库地址**: https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill
- **技能包目录**: `skill-package/`
- **技能定义文件**: `skill-package/skill.json`

---

## 🚀 扣子平台上传步骤

### 第一步：登录扣子平台

1. 访问 [https://coze.cn](https://coze.cn)
2. 使用抖音账号/手机号登录
3. 进入工作台

### 第二步：创建Bot

1. 点击左侧菜单 **"Bot"**
2. 点击 **"创建Bot"** 按钮
3. 填写Bot信息：

```
名称: 智餐通
描述: 智慧餐饮AI助手，支持菜单查询、智能点餐、订单管理、排队取号等餐饮服务
图标: 🍽️ (可上传自定义图标)
分类: 生活服务
```

### 第三步：配置Bot

1. **人设与回复逻辑**：

```
# 角色
你是一个专业的智慧餐饮助手，名叫"智餐通"。你能够帮助用户：
- 查询菜单和菜品详情
- 智能推荐菜品
- 管理购物车和订单
- 排队取号和查询进度
- 查看会员信息和优惠券
- 预订包间和开具发票

# 能力
你具备以下工具能力：
- get_menu: 获取菜单
- get_dish_detail: 获取菜品详情
- recommend_dishes: 智能推荐
- add_to_cart: 添加购物车
- remove_from_cart: 移除购物车
- get_cart: 查看购物车
- clear_cart: 清空购物车
- create_order: 创建订单
- get_orders: 订单列表
- get_order_detail: 订单详情
- cancel_order: 取消订单
- queue_take: 排队取号
- query_queue: 查询排队
- cancel_queue: 取消排队
- get_store_info: 门店信息
- get_wifi_info: WiFi信息
- issue_invoice: 开具发票
- reserve_room: 预订包间
- get_events: 活动查询
- get_coupons: 优惠券
- get_member_info: 会员信息

# 回复风格
- 专业、热情、耐心
- 用口语化方式回复
- 主动推荐和引导
```

2. **开场白**：

```
🍽️ 欢迎使用智餐通！

我是您的智慧餐饮助手，可以帮您：
• 📋 查看菜单和推荐菜品
• 🛒 管理购物车和下单
• ⏰ 排队取号和查询
• 💳 会员卡和优惠券
• 📍 门店信息和预订

请问有什么可以帮您的？
```

3. **用户问题建议**：
```
- 今天有什么推荐菜？
- 来一份招牌大鱼头泡饭
- 查看我的购物车
- 我要下单
- 取个排队号
- 查看会员积分
```

### 第四步：添加插件/技能

**方式一：通过GitHub引用（推荐）**

在Bot配置中，点击 **"添加技能"** 或 **"添加插件"**，选择 **"自定义技能"**：

1. 选择技能类型：**MCP技能**
2. 填写GitHub仓库信息：
   - 仓库地址: `https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill`
   - 技能包路径: `skill-package/skill.json`
3. 验证技能加载成功

**方式二：手动导入**

1. 下载 `skill-package/skill.json` 文件
2. 在Bot配置中选择 **"导入技能"**
3. 上传 `skill.json` 文件
4. 配置API端点

### 第五步：配置API端点

在Bot的插件/技能配置中填写：

```
API Endpoint: https://api.xiayi-yuanpinhui.com
认证方式: API Key
```

---

## ⚙️ 扣子平台配置示例

### Bot基本信息

```yaml
名称: 智餐通
图标: 🍽️
描述: 智慧餐饮AI助手，让点餐更便捷
分类: 生活服务
```

### 技能配置

```json
{
  "name": "zhixcantong",
  "version": "4.0.0",
  "endpoint": "https://api.xiayi-yuanpinhui.com",
  "auth": {
    "type": "api_key",
    "header": "X-API-Key"
  }
}
```

---

## ✅ 发布前检查清单

- [ ] Bot名称和描述填写完整
- [ ] 人设与回复逻辑配置正确
- [ ] 开场白和用户问题建议已设置
- [ ] 技能/插件已成功添加
- [ ] API端点已配置
- [ ] 测试对话功能正常
- [ ] 发布前预览效果满意

---

## 🧪 测试建议

在发布前，建议测试以下场景：

1. **菜单查询**: "今天有什么招牌菜？"
2. **智能推荐**: "推荐几个适合商务宴请的菜"
3. **下单流程**: "来一份糖醋里脊，再加两份米饭"
4. **订单管理**: "查看我的订单"
5. **排队功能**: "取个排队号，3个人"
6. **会员服务**: "查一下我的积分"

---

## 📞 常见问题

### Q: 扣子平台如何添加MCP技能？
A: 扣子平台最新版本支持MCP技能导入，在Bot配置页面找到"技能"或"插件"选项，选择"添加技能" -> "自定义技能"，然后输入GitHub仓库地址或上传skill.json文件。

### Q: API端点如何配置？
A: 在技能配置中，需要填写您的API服务地址。如果您还没有部署后端服务，可以先跳过这一步，使用Bot的对话能力作为演示。

### Q: 如何获取API Key？
A: API Key需要在部署后端服务后生成。请参考 `skill-package/README.md` 中的部署说明。

---

## 🎯 成功案例参考

智餐通Bot上线后可以实现：

- 24/7 自动回复顾客咨询
- 提升点餐效率 60%+
- 减少人工客服工作量 50%+
- 提升顾客满意度

---

## 📚 相关文档

- [扣子开发者文档](https://coze.cn/docs)
- [MCP协议文档](https://modelcontextprotocol.io/)
- [项目GitHub仓库](https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill)

---

**祝您上传顺利！如有疑问请提交Issue到GitHub仓库。**
