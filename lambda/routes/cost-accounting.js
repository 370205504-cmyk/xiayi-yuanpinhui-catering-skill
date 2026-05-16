/**
 * 成本核算API路由
 * 整合Recipe Costing成本核算系统
 */

const express = require('express');
const router = express.Router();
const CostAccountingService = require('../services/cost-accounting');

const costService = new CostAccountingService();

router.get('/calculate/:dishName', (req, res) => {
  const result = costService.calculateRecipeCost(req.params.dishName);
  res.json(result);
});

router.get('/profitability', (req, res) => {
  const result = costService.calculateMenuProfitability();
  res.json(result);
});

router.get('/engineering', (req, res) => {
  const result = costService.menuEngineeringAnalysis();
  res.json(result);
});

router.post('/batch-calculate', (req, res) => {
  const { dishes } = req.body;
  if (!dishes || !Array.isArray(dishes)) {
    return res.status(400).json({ success: false, error: '请提供菜品数组' });
  }
  const result = costService.batchCalculateCost(dishes);
  res.json({ success: true, results: result });
});

router.get('/report', (req, res) => {
  const result = costService.getReport();
  res.json(result);
});

module.exports = router;
