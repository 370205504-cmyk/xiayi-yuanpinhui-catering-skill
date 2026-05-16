const express = require('express');
const router = express.Router();
const SocialMarketingService = require('../services/social-marketing');

const marketingService = new SocialMarketingService();

router.post('/analyze-image', async (req, res) => {
  try {
    const { imageData } = req.body;
    const result = marketingService.analyzeDishImage(imageData);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generate-content', async (req, res) => {
  try {
    const options = req.body;
    const result = marketingService.generateMarketingContent(options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generate-poster', async (req, res) => {
  try {
    const options = req.body;
    const result = marketingService.generatePosterConfig(options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/publish', async (req, res) => {
  try {
    const options = req.body;
    const result = marketingService.publishToSocial(options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = marketingService.getPostHistory(limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const result = marketingService.getMarketingStats();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/suggestions', async (req, res) => {
  try {
    const result = marketingService.getSmartMarketingSuggestions();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
