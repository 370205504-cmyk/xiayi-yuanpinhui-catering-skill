const express = require('express');
const router = express.Router();
const PrintService = require('../services/print-service');

const printService = new PrintService();

// 顾客小票预览
router.get('/preview/customer/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await printService.preview(orderId, 'customer');
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 厨房小票预览
router.get('/preview/kitchen/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await printService.preview(orderId, 'kitchen');
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 生成顾客小票
router.post('/receipt/customer', async (req, res) => {
  try {
    const { order } = req.body;
    const storeInfo = await printService.getStoreInfo();
    const receipt = await printService.generateCustomerReceipt(order, storeInfo);
    res.json({ success: true, receipt });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 生成厨房小票
router.post('/receipt/kitchen', async (req, res) => {
  try {
    const { order, options } = req.body;
    const ticket = await printService.generateKitchenTicket(order, options);
    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
