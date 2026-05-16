const express = require('express');
const router = express.Router();
const AccountingService = require('../services/accounting-service');

const accountingService = new AccountingService();

// 日结报表
router.get('/daily/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const result = await accountingService.dailyReport(date);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 月度报表
router.get('/monthly/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const result = await accountingService.monthlyReport(
      parseInt(year),
      parseInt(month)
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 收银员报表
router.get('/cashier/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const { cashierId } = req.query;
    const result = await accountingService.cashierReport(date, cashierId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 支付统计
router.get('/payment/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const result = await accountingService.paymentStatistics(date);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 对账
router.get('/reconciliation/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const result = await accountingService.reconciliation(date);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 导出日报
router.get('/export/daily/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const result = await accountingService.exportDailyReport(date);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 导出月报
router.get('/export/monthly/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const result = await accountingService.exportMonthlyReport(
      parseInt(year),
      parseInt(month)
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
