# Coze Platform Upload Guide

## Zhixcantong - Smart Dining AI Assistant

---

## 📋 Prerequisites

### 1. Get GitHub Repository URL

Your skill package is already uploaded to GitHub:
- **Repository**: https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill
- **Skill Package**: `skill-package/`
- **Skill Definition**: `skill-package/skill.json`

---

## 🚀 Coze Upload Steps

### Step 1: Login to Coze

1. Visit [https://coze.cn](https://coze.cn)
2. Login with Douyin account or phone number
3. Enter the workspace

### Step 2: Create Bot

1. Click **"Bot"** in left menu
2. Click **"Create Bot"** button
3. Fill in Bot information:

```
Name: 智餐通
Description: Smart dining AI assistant with menu lookup, ordering, queue management
Icon: 🍽️
Category: Lifestyle
```

### Step 3: Configure Bot

1. **Persona & Response Logic**:
```
# Role
You are a professional smart dining assistant called "智餐通". You can help users:
- Query menus and dish details
- Smart dish recommendations
- Manage shopping cart and orders
- Queue management
- Member info and coupons
- Room reservation and invoices

# Capabilities
You have these tools:
- get_menu: Get menu
- get_dish_detail: Get dish details
- recommend_dishes: Smart recommendation
- add_to_cart: Add to cart
- create_order: Create order (idempotent)
- queue_take: Get queue number
- get_member_info: Member info
... (21 tools total)
```

2. **Opening Message**:
```
🍽️ Welcome to 智餐通!

Your smart dining assistant. I can help you:
• 📋 Browse menu and recommendations
• 🛒 Manage cart and checkout
• ⏰ Queue management
• 💳 Member cards and coupons
• 📍 Store info and reservations

How can I help you today?
```

### Step 4: Add Skill/Plugin

1. Click **"Add Skill"** or **"Add Plugin"** in Bot settings
2. Select **"Custom Skill"**
3. Choose **"MCP Skill"**
4. Fill in GitHub repository:
   - Repository URL: `https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill`
   - Skill path: `skill-package/skill.json`

### Step 5: Configure API Endpoint

```
API Endpoint: https://api.xiayi-yuanpinhui.com
Auth: API Key
```

---

## 📞 Support

For issues, please submit to GitHub:
https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill/issues

---

**Good luck with your upload! 🎉**
