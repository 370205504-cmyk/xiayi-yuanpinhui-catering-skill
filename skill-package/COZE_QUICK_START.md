# 智餐通 - 扣子平台上架完整指南

## 📦 已准备的材料

所有材料已上传到GitHub：
- **skill.json**: https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill/blob/main/skill-package/skill.json
- **完整文档**: https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill/tree/main/skill-package

---

## 🚀 快速上架（5分钟完成）

### 第一步：下载技能包
访问以下链接，点击"Download"下载 `skill.json` 文件：
```
https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill/blob/main/skill-package/skill.json
```
右键点击"Raw"按钮 → "另存为" → 保存为 `skill.json`

### 第二步：登录扣子平台
1. 打开浏览器访问：https://coze.cn
2. 使用抖音账号或手机号登录

### 第三步：创建Bot
1. 点击左侧菜单 **"Bot"**
2. 点击 **"创建Bot"** 按钮
3. 填写信息：
   - **名称**: 智餐通 🍽️
   - **描述**: 智慧餐饮AI助手，支持菜单查询、智能点餐、订单管理、排队取号、会员服务
   - **图标**: 点击上传图标（可选）

### 第四步：配置Bot
在Bot编辑页面，填写以下内容：

#### 人设与回复逻辑：
```
# 角色
你是一个专业的智慧餐饮助手，名叫"智餐通"。你能够帮助用户：
- 查询菜单和菜品详情
- 智能推荐菜品
- 管理购物车和订单
- 排队取号和查询
- 查看会员信息和优惠券
- 预订包间和开具发票
- 获取门店WiFi信息

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

#### 开场白：
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

#### 用户建议问题：
```
- 今天有什么推荐菜？
- 来一份招牌大鱼头泡饭
- 查看我的购物车
- 我要下单
- 取个排队号
- 查看会员积分
```

### 第五步：导入MCP技能（重要！）

**方法1：通过扣子编程上传（推荐）**

1. 在Bot编辑页面，找到 **"技能"** 或 **"插件"** 配置区域
2. 点击 **"添加技能"** → **"自定义技能"**
3. 选择 **"上传技能包"**
4. 选择您下载的 `skill.json` 文件
5. 点击确认

**方法2：通过GitHub地址导入**

1. 点击 **"添加技能"** → **"自定义技能"**
2. 选择 **"从GitHub导入"**
3. 填写：
   - 仓库地址: `https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill`
   - 技能路径: `skill-package/skill.json`

### 第六步：测试Bot
1. 在右侧预览窗口输入：`今天有什么推荐菜？`
2. 检查Bot是否能正常回复
3. 如有问题，检查技能是否正确导入

### 第七步：发布Bot
1. 点击右上角 **"发布"** 按钮
2. 选择发布范围：
   - **仅自己可见** - 测试阶段
   - **指定用户可见** - 内部测试
   - **全员可见** - 正式上线
3. 点击确认发布

---

## 🎯 发布后配置

### 1. 获取API（用于接入其他平台）
1. 进入Bot详情页
2. 点击 **"API"** 标签
3. 复制 **Bot ID** 和 **API Token**

### 2. 集成到其他平台
获取API后，可以：
- 接入微信公众号
- 接入企业微信
- 接入网站
- 开发自定义应用

---

## 💡 推广建议

Bot上线后，可以在以下渠道推广：
- 餐厅微信公众号
- 门店海报（扫码体验）
- 外卖平台店铺公告
- 抖音/小红书笔记

---

## 📞 技术支持

如有问题：
1. 查看扣子官方文档：https://coze.cn/docs
2. 提交GitHub Issue：https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill/issues
3. 加入扣子开发者社区

---

**祝您上架成功！🎉**
