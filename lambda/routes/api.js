const express = require('express');
const router = express.Router();
const dishesService = require('../services/dishesService');
const cartService = require('../services/cartService');
const orderService = require('../services/orderServiceV2');
const storeService = require('../utils/storeService');
const wifiService = require('../utils/wifiService');
const logger = require('../utils/logger');

router.get('/menu', async (req, res, next) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const result = await dishesService.getMenu({ category, page: parseInt(page), limit: parseInt(limit) });
    logger.info('获取菜单', { category, page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/dishes', async (req, res, next) => {
  try {
    const { id, name, category } = req.query;
    let result;

    if (id) {
      result = await dishesService.getDishById(id);
    } else if (name) {
      result = await dishesService.searchDishes(name);
    } else if (category) {
      result = await dishesService.getDishesByCategory(category);
    } else {
      result = await dishesService.getAllDishes();
    }

    logger.info('查询菜品', { id, name, category });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/recommend', async (req, res, next) => {
  try {
    const { taste, budget, count = 3 } = req.query;
    const result = await dishesService.recommendDishes({ taste, budget, count: parseInt(count) });
    logger.info('智能推荐', { taste, budget, count });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/stores', async (req, res, next) => {
  try {
    const result = await storeService.getAllStores();
    logger.info('查询门店');
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/wifi', async (req, res, next) => {
  try {
    const result = await wifiService.getWifiPassword();
    logger.info('获取WiFi');
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/cart/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const result = await cartService.getCart(userId);
    logger.info('获取购物车', { userId });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/cart/add', async (req, res, next) => {
  try {
    const { userId, dishId, quantity = 1, remarks = '' } = req.body;

    if (!userId || !dishId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：userId 和 dishId'
      });
    }

    const result = await cartService.addItem(userId, dishId, quantity, remarks);
    logger.info('添加购物车', { userId, dishId, quantity });
    res.json({ success: true, data: result, message: '已添加到购物车' });
  } catch (error) {
    next(error);
  }
});

router.post('/cart/remove', async (req, res, next) => {
  try {
    const { userId, dishId } = req.body;

    if (!userId || !dishId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：userId 和 dishId'
      });
    }

    const result = await cartService.removeItem(userId, dishId);
    logger.info('移除购物车', { userId, dishId });
    res.json({ success: true, data: result, message: '已从购物车移除' });
  } catch (error) {
    next(error);
  }
});

router.post('/cart/clear', async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：userId'
      });
    }

    await cartService.clearCart(userId);
    logger.info('清空购物车', { userId });
    res.json({ success: true, message: '购物车已清空' });
  } catch (error) {
    next(error);
  }
});

router.post('/order', async (req, res, next) => {
  try {
    const { userId, storeId, tableNo, remarks, contactPhone } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：userId'
      });
    }

    const order = await orderService.createOrder({
      userId,
      storeId,
      tableNo,
      remarks,
      contactPhone
    });

    logger.info('创建订单', { userId, orderId: order.orderId });
    res.json({ success: true, data: order, message: '订单创建成功' });
  } catch (error) {
    next(error);
  }
});

router.get('/order/:orderId', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.getOrder(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '订单不存在'
      });
    }

    logger.info('查询订单', { orderId });
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

router.put('/order/:orderId/status', async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数：status'
      });
    }

    const order = await orderService.updateOrderStatus(orderId, status);
    logger.info('更新订单状态', { orderId, status });
    res.json({ success: true, data: order, message: '订单状态已更新' });
  } catch (error) {
    next(error);
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const { userId, status, page = 1, limit = 20 } = req.query;
    const result = await orderService.getOrders({
      userId,
      status,
      page: parseInt(page),
      limit: parseInt(limit)
    });

    logger.info('查询订单列表', { userId, status, page, limit });
    res.json({ success: true, data: result });
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
    logger.info('打印订单', { orderId });
    res.json({ success: true, message: '打印任务已提交' });
  } catch (error) {
    next(error);
  }
});

router.get('/docs', (req, res) => {
  res.json({
    title: '雨姗AI收银助手创味菜 - API文档',
    version: '1.0.0',
    endpoints: [
      { method: 'GET', path: '/api/v1/menu', description: '获取菜单列表' },
      { method: 'GET', path: '/api/v1/dishes', description: '查询菜品' },
      { method: 'GET', path: '/api/v1/recommend', description: '智能推荐菜品' },
      { method: 'GET', path: '/api/v1/stores', description: '查询门店信息' },
      { method: 'GET', path: '/api/v1/wifi', description: '获取WiFi密码' },
      { method: 'GET', path: '/api/v1/cart/:userId', description: '获取购物车' },
      { method: 'POST', path: '/api/v1/cart/add', description: '添加商品到购物车' },
      { method: 'POST', path: '/api/v1/cart/remove', description: '从购物车移除商品' },
      { method: 'POST', path: '/api/v1/cart/clear', description: '清空购物车' },
      { method: 'POST', path: '/api/v1/order', description: '创建订单' },
      { method: 'GET', path: '/api/v1/order/:orderId', description: '查询订单详情' },
      { method: 'PUT', path: '/api/v1/order/:orderId/status', description: '更新订单状态' },
      { method: 'GET', path: '/api/v1/orders', description: '查询订单列表' },
      { method: 'POST', path: '/api/v1/order/:orderId/print', description: '打印订单小票' }
    ]
  });
});

module.exports = router;
