const express = require('express');
const router = express.Router();
const DPTDualProcessAgent = require('../services/dpt-agent');

const dptAgent = new DPTDualProcessAgent();

router.post('/process', async (req, res) => {
  try {
    const { userInput, context } = req.body;
    const result = await dptAgent.processRequest(userInput, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/collaborate', async (req, res) => {
  try {
    const { task, context } = req.body;
    const result = await dptAgent.multiAgentCollaboration(task, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/status', async (req, res) => {
  try {
    const result = dptAgent.getAgentStatus();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
