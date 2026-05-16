/**
 * 库存预测API路由
 * 整合Foodix AI库存预测系统
 */

const express = require('express');
const router = express.Router();
const InventoryForecastService = require('../services/inventory-forecast');

const forecastService = new InventoryForecastService();

router.post('/initialize', (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ success: false, error: '请提供商品数组' });
  }
  const result = forecastService.initializeInventory(items);
  res.json(result);
});

router.post('/sale', (req, res) => {
  const { itemId, quantity, date } = req.body;
  const result = forecastService.recordSale(itemId, quantity, date ? new Date(date) : new Date());
  res.json(result);
});

router.get('/status', (req, res) => {
  const result = forecastService.getInventoryStatus();
  res.json({ success: true, items: result });
});

router.get('/reorder', (req, res) => {
  const result = forecastService.getReorderList();
  res.json({ success: true, items: result });
});

router.get('/forecast/:itemId', (req, res) => {
  const prediction = forecastService.predictions.get(req.params.itemId);
  res.json({ success: true, prediction });
});

router.post('/simulate/:itemId', (req, res) => {
  const { days } = req.body;
  const result = forecastService.simulatePrediction(req.params.itemId, days || 7);
  res.json(result);
});

router.get('/report', (req, res) => {
  const { days } = req.query;
  const result = forecastService.getForecastReport(parseInt(days) || 7);
  res.json(result);
});

module.exports = router;
