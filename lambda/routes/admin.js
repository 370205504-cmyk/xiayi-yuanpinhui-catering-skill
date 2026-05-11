const express = require('express');
const router = express.Router();
const dishesService = require('../services/dishesService');
const orderService = require('../services/orderServiceV2');
const cartService = require('../services/cartService');
const logger = require('../utils/logger');

function requireAdmin(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const config = require('../config.json');
  
  if (!config.admin?.apiKey || apiKey !== config.admin.apiKey) {
    return res.status(401).json({
      success: false,
      message: '未授权，请提供有效的管理员API密钥'
    });
  }
  
  next();
}

router.get('/stats', async (req, res, next) => {
  try {
    const dishes = dishesService.getAllDishes();
    const orders = await orderService.getOrders({ page: 1, limit: 100 });
    
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.orders.filter(o => 
      o.createdAt.startsWith(today)
    );
    
    const stats = {
      totalDishes: dishes.length,
      totalOrders: orders.orders.length,
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      pendingOrders: orders.orders.filter(o => o.status === 'pending').length,
      preparingOrders: orders.orders.filter(o => o.status === 'preparing').length
    };
    
    logger.logOperation('admin', '查看统计', stats);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const result = await orderService.getOrders({
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    logger.logOperation('admin', '查看订单列表');
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.put('/order/:orderId/status', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;
    
    const order = await orderService.updateOrderStatus(orderId, status, note);
    
    logger.logOrder(orderId, '管理员更新状态', { status, note });
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

router.post('/order/:orderId/print', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const printerService = require('../utils/printerService');
    
    const order = await orderService.getOrder(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }
    
    await printerService.printOrder(order);
    
    logger.logOrder(orderId, '管理员重打小票');
    res.json({ success: true, message: '打印任务已提交' });
  } catch (error) {
    next(error);
  }
});

router.get('/dishes', async (req, res, next) => {
  try {
    const dishes = dishesService.getAllDishes();
    res.json({ success: true, data: dishes });
  } catch (error) {
    next(error);
  }
});

router.get('/menu/categories', async (req, res, next) => {
  try {
    const menu = dishesService.getMenu();
    res.json({ success: true, data: menu.categories });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
