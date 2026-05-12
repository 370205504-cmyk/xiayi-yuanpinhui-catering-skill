# 夏邑缘品荟智能餐饮系统 AI Skill

## 技能描述

夏邑缘品荟智能餐饮系统官方AI服务，支持查询菜单、智能推荐菜品、在线点餐、购物车管理、提交订单、查询门店信息、WiFi密码、多门店管理。

## 技能信息

- **版本**: 3.5.0
- **作者**: 石中伟
- **许可证**: MIT
- **仓库**: https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill
- **MCP端点**: https://mcp.xiayi-yuanpinhui.com

## 触发词

### 点餐相关
- 查看菜单、给我看看菜单、都有什么菜
- 推荐菜品、有什么好吃的、招牌菜推荐
- 我要点菜、我要下单、来一份、加菜
- 查看购物车、购物车有什么
- 下单、帮我下单、提交订单
- 取消订单、退单

### 订单相关
- 查订单、看看我的订单、订单状态
- 取消订单、不要了、退掉

### 门店相关
- 门店地址、在哪里、怎么去
- 门店电话、联系电话
- 营业时间、几点开门、几点关门
- wifi密码、WiFi密码、无线网密码

### 排队相关
- 排队取号、帮我排个队
- 查看排队、排队进度、还要等多久
- 取消排队、不排了

### 其他服务
- 外卖配送、能送外卖吗
- 打包、带走去、盒饭
- 停车、停车场、停车费
- 预约、预订包间、订座

## 使用示例

### 点餐对话
```
用户: 给我推荐几道招牌菜
AI: 今日招牌推荐：
     1. 招牌大鱼头泡饭 ¥88 - 缘品荟头牌菜，桌桌必点
     2. 招牌烧肉 ¥58 - 肥而不腻，软糯香甜
     3. 酱焖娃娃鱼 ¥198 - 新鲜现杀，配米饭一份
     请问您想点哪几道？

用户: 来一份招牌大鱼头泡饭，少辣不要葱
AI: 已添加到购物车：
     招牌大鱼头泡饭 x1 (少辣，不要葱) ¥88
     还需要其他菜吗？

用户: 再来一个糖醋里脊
AI: 已添加：糖醋里脊 x1 ¥48
     当前购物车共2件，合计¥136
     请问现在下单吗？

用户: 是的，下单
AI: 订单已提交！订单号：ORD20260115XXX
     厨房已接单，预计15分钟后上菜。
     请留意叫号或送餐通知。
```

### 排队取号
```
用户: 帮我排个3人桌
AI: 正在为您取号...
     取号成功！
     门店：夏邑缘品荟(孔祖大道店)
     排队号：A012
     当前等待：5桌
     预计等待时间：约30分钟
     请留意短信通知，我们会提前提醒您。

用户: 还要等多久？
AI: 您当前排队号：A012
     当前叫号：A008
     还需等待：4桌
     预计时间：约25分钟
```

### 门店查询
```
用户: 店里的WiFi密码是多少
AI: WiFi信息：
     SSID：缘品荟免费WiFi
     密码：88888888
     免密码连接，欢迎使用！

用户: 门店地址在哪？
AI: 门店地址：夏邑县孔祖大道南段188号
     营业时间：10:00-22:00
     联系电话：0370-628-8888
     停车信息：门店旁有免费停车场
```

## 工具定义

### MCP标准工具

#### text_chat
自然语言对话处理所有点餐和查询请求。

```json
{
  "name": "text_chat",
  "description": "自然语言对话处理所有点餐和查询请求",
  "parameters": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "用户输入的自然语言"
      },
      "user_id": {
        "type": "string",
        "description": "用户唯一ID，用于识别用户身份和购物车"
      }
    },
    "required": ["query", "user_id"]
  }
}
```

#### queue_take
美团排队取号。

```json
{
  "name": "queue_take",
  "description": "美团排队取号",
  "parameters": {
    "type": "object",
    "properties": {
      "store_id": {
        "type": "string",
        "description": "门店ID"
      },
      "table_type": {
        "type": "string",
        "enum": ["small", "medium", "large", "包间"],
        "description": "桌型：小桌(1-3人)、中桌(4-6人)、大桌(7-10人)、包间"
      },
      "people": {
        "type": "number",
        "description": "用餐人数"
      }
    },
    "required": ["store_id", "table_type", "people"]
  }
}
```

#### query_queue
查询排队进度。

```json
{
  "name": "query_queue",
  "description": "查询排队进度",
  "parameters": {
    "type": "object",
    "properties": {
      "queue_id": {
        "type": "string",
        "description": "排队ID"
      }
    },
    "required": ["queue_id"]
  }
}
```

#### cancel_queue
取消排队。

```json
{
  "name": "cancel_queue",
  "description": "取消排队",
  "parameters": {
    "type": "object",
    "properties": {
      "queue_id": {
        "type": "string",
        "description": "排队ID"
      }
    },
    "required": ["queue_id"]
  }
}
```

## 门店配置

### 默认门店 (store001)
- **名称**: 夏邑缘品荟创味菜(孔祖大道店)
- **地址**: 夏邑县孔祖大道南段188号
- **电话**: 0370-628-8888
- **营业时间**: 10:00-22:00
- **WiFi**: SSID=缘品荟免费WiFi, 密码=88888888

## 订单状态流转

```
待确认 → 已接单 → 制作中 → 已出餐 → 已完成
   ↓
  已取消
```

## 支付方式

- 💚 微信支付
- 💙 支付宝
- 💳 余额支付
- 💵 现金支付

## 技术架构

- **后端**: Node.js + Express.js
- **数据库**: MySQL + Redis
- **部署**: Docker + 腾讯云函数
- **打印**: ESC/POS 热敏打印机

## 联系方式

- **开发者**: 石中伟
- **GitHub**: https://github.com/370205504-cmyk/xiayi-youpinhui-foodie-skill
- **问题反馈**: https://github.com/370205504-cmyk/xiayi-youpinhui-foodie-skill/issues
