const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { requireAuth } = require('../middleware/auth');

const agentTools = {
  get_menu: {
    handler: async (args) => {
      const dishesService = require('../services/dishesService');
      return await dishesService.getAllDishes();
    },
    requiresAuth: false,
    requiresUserCheck: false
  },
  get_store_info: {
    handler: async (args) => {
      const storeService = require('../utils/storeService');
      return await storeService.getStoreInfo(args.store_id);
    },
    requiresAuth: false,
    requiresUserCheck: false
  },
  search_dishes: {
    handler: async (args) => {
      const dishesService = require('../services/dishesService');
      return await dishesService.searchDishes(args.keyword);
    },
    requiresAuth: false,
    requiresUserCheck: false
  },
  get_wifi_info: {
    handler: async (args) => {
      const storeService = require('../utils/storeService');
      return await storeService.getWifiInfo(args.store_id);
    },
    requiresAuth: false,
    requiresUserCheck: false
  },
  queue_take: {
    handler: async (args, userId) => {
      const queueService = require('../services/queueService');
      return await queueService.takeQueue(userId, args.table_type, args.people);
    },
    requiresAuth: true,
    requiresUserCheck: true
  },
  queue_query: {
    handler: async (args, userId) => {
      const queueService = require('../services/queueService');
      return await queueService.queryQueue(args.queue_id, userId);
    },
    requiresAuth: true,
    requiresUserCheck: true
  },
  queue_cancel: {
    handler: async (args, userId) => {
      const queueService = require('../services/queueService');
      return await queueService.cancelQueue(args.queue_id, userId);
    },
    requiresAuth: true,
    requiresUserCheck: true
  },
  create_order: {
    handler: async (args, userId) => {
      const orderService = require('../services/orderService');
      return await orderService.createOrder(userId, args.items, args.order_type, args.table_no);
    },
    requiresAuth: true,
    requiresUserCheck: true
  },
  get_order: {
    handler: async (args, userId) => {
      const orderService = require('../services/orderService');
      return await orderService.getOrder(args.order_no, userId);
    },
    requiresAuth: true,
    requiresUserCheck: true
  },
  get_orders: {
    handler: async (args, userId) => {
      const orderService = require('../services/orderService');
      return await orderService.getUserOrders(userId);
    },
    requiresAuth: true,
    requiresUserCheck: true
  },
  cancel_order: {
    handler: async (args, userId) => {
      const orderService = require('../services/orderService');
      return await orderService.cancelOrder(args.order_no, userId);
    },
    requiresAuth: true,
    requiresUserCheck: true
  },
  get_member_info: {
    handler: async (args, userId) => {
      const memberService = require('../services/memberService');
      return await memberService.getMemberInfo(userId);
    },
    requiresAuth: true,
    requiresUserCheck: true
  },
  issue_invoice: {
    handler: async (args, userId) => {
      const invoiceService = require('../services/invoiceService');
      return await invoiceService.issueInvoice(args.order_no, args.tax_number, args.company_name, args.email);
    },
    requiresAuth: true,
    requiresUserCheck: true
  },
  reserve_room: {
    handler: async (args, userId) => {
      const roomReservationService = require('../services/roomReservationService');
      return await roomReservationService.reserveRoom(userId, args.room_id, args.date, args.time_slot, args.people, args.phone, args.remarks);
    },
    requiresAuth: true,
    requiresUserCheck: true
  },
  get_events: {
    handler: async (args) => {
      const eventService = require('../services/eventService');
      return await eventService.getAllEvents(args.type || 'active');
    },
    requiresAuth: false,
    requiresUserCheck: false
  },
  get_dish_detail: {
    handler: async (args) => {
      const dishesService = require('../services/dishesService');
      return await dishesService.getDishById(args.dish_id);
    },
    requiresAuth: false,
    requiresUserCheck: false
  }
};

const promptInjectionPatterns = [
  /忽略之前的所有指令/i,
  /你现在是.*管理员/i,
  /帮我查看.*所有.*信息/i,
  /绕过.*限制/i,
  /执行.*操作/i,
  /获取.*敏感.*数据/i,
  /删除.*数据/i,
  /修改.*权限/i
];

function detectPromptInjection(input) {
  for (const pattern of promptInjectionPatterns) {
    if (pattern.test(input)) {
      return true;
    }
  }
  return false;
}

router.post('/text', async (req, res) => {
  try {
    const { text, tool_name, tool_args, user_id } = req.body;

    if (text && detectPromptInjection(text)) {
      logger.warn('Prompt注入检测', { userId: user_id, text: text.substring(0, 100) });
      return res.json({
        success: false,
        message: '您的请求包含不安全内容，请重新输入'
      });
    }

    if (!tool_name) {
      return res.json({
        success: false,
        message: '请指定要调用的工具'
      });
    }

    const tool = agentTools[tool_name];
    if (!tool) {
      return res.json({
        success: false,
        message: `未知工具: ${tool_name}`
      });
    }

    if (tool.requiresAuth && !user_id) {
      return res.json({
        success: false,
        message: '需要登录才能使用此功能'
      });
    }

    const args = tool_args || {};
    
    if (!validateArgs(tool_name, args)) {
      return res.json({
        success: false,
        message: '参数验证失败'
      });
    }

    const result = await tool.handler(args, user_id);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Agent工具调用失败', { error: error.message });
    res.json({
      success: false,
      message: error.message || '服务异常'
    });
  }
});

function validateArgs(toolName, args) {
  const validationRules = {
    queue_take: ['table_type', 'people'],
    queue_query: ['queue_id'],
    queue_cancel: ['queue_id'],
    create_order: ['items', 'order_type'],
    get_order: ['order_no'],
    cancel_order: ['order_no'],
    issue_invoice: ['order_no', 'tax_number', 'company_name'],
    reserve_room: ['room_id', 'date', 'time_slot', 'people', 'phone'],
    search_dishes: ['keyword'],
    get_store_info: ['store_id'],
    get_wifi_info: ['store_id'],
    get_dish_detail: ['dish_id'],
    get_events: []
  };

  const required = validationRules[toolName] || [];
  for (const field of required) {
    if (!args[field]) {
      return false;
    }
  }

  if (args.items && !Array.isArray(args.items)) {
    return false;
  }

  if (args.people && (typeof args.people !== 'number' || args.people < 1)) {
    return false;
  }

  if (args.phone && !/^1[3-9]\d{9}$/.test(args.phone)) {
    return false;
  }

  if (args.tax_number && !/^[0-9A-Za-z]{15,20}$/.test(args.tax_number)) {
    return false;
  }

  return true;
}

router.get('/tools', (req, res) => {
  const tools = Object.keys(agentTools).map(name => ({
    name,
    description: getToolDescription(name),
    requiresAuth: agentTools[name].requiresAuth
  }));
  
  res.json({
    success: true,
    data: tools
  });
});

function getToolDescription(toolName) {
  const descriptions = {
    get_menu: '获取餐厅菜单',
    get_store_info: '获取门店信息',
    search_dishes: '搜索菜品',
    get_wifi_info: '获取WiFi信息',
    queue_take: '排队取号',
    queue_query: '查询排队进度',
    queue_cancel: '取消排队',
    create_order: '创建订单',
    get_order: '获取订单详情',
    get_orders: '获取我的订单',
    cancel_order: '取消订单',
    get_member_info: '获取会员信息',
    issue_invoice: '开具发票',
    reserve_room: '包间预订',
    get_events: '查询活动信息',
    get_dish_detail: '获取菜品详情'
  };
  return descriptions[toolName] || toolName;
}

module.exports = router;