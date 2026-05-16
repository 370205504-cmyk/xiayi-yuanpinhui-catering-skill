/**
 * KDS厨房显示系统API路由
 * 整合Kitchen Display System
 */

const express = require('express');
const router = express.Router();
const KitchenDisplayService = require('../services/kitchen-display');

const kdsService = new KitchenDisplayService();

router.post('/station', (req, res) => {
  const { stationId, stationName, stationType } = req.body;
  const result = kdsService.initializeKDS(stationId, stationName, stationType);
  res.json(result);
});

router.post('/order', (req, res) => {
  const result = kdsService.addOrder(req.body);
  res.json(result);
});

router.put('/order/:orderId/item/:itemId', (req, res) => {
  const { status, stationId } = req.body;
  const result = kdsService.updateOrderItemStatus(req.params.orderId, req.params.itemId, status, stationId);
  res.json(result);
});

router.post('/order/:orderId/bump', (req, res) => {
  const { itemIds } = req.body;
  const result = kdsService.bumpOrder(req.params.orderId, itemIds);
  res.json(result);
});

router.post('/order/:orderId/recall', (req, res) => {
  const result = kdsService.recallOrder(req.params.orderId);
  res.json(result);
});

router.get('/orders', (req, res) => {
  const result = kdsService.getAllActiveOrders();
  res.json({ success: true, orders: result });
});

router.get('/orders/:orderId', (req, res) => {
  const result = kdsService.getOrder(req.params.orderId);
  res.json(result || { success: false, error: '订单不存在' });
});

router.get('/station/:stationId/orders', (req, res) => {
  const result = kdsService.getStationOrders(req.params.stationId);
  res.json({ success: true, orders: result });
});

router.get('/statistics', (req, res) => {
  const result = kdsService.getOrderStatistics();
  res.json(result);
});

router.get('/dashboard', (req, res) => {
  const result = kdsService.getKDSDashboard();
  res.json(result);
});

router.get('/predict/:hour', (req, res) => {
  const result = kdsService.predictOrderVolume(parseInt(req.params.hour));
  res.json(result);
});

module.exports = router;
