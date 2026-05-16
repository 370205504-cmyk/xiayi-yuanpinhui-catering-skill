const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const ENV_PATH = path.join(__dirname, '../../.env');

function readEnv() {
  try {
    if (fs.existsSync(ENV_PATH)) {
      return fs.readFileSync(ENV_PATH, 'utf-8');
    }
  } catch (error) {
    logger.error('Failed to read .env:', error);
  }
  return '';
}

function writeEnv(content) {
  try {
    fs.writeFileSync(ENV_PATH, content, 'utf-8');
    return true;
  } catch (error) {
    logger.error('Failed to write .env:', error);
    return false;
  }
}

function parseEnv(content) {
  const config = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        config[match[1].trim()] = match[2].trim();
      }
    }
  }
  return config;
}

function updateEnvFile(newConfig) {
  const content = readEnv();
  const config = parseEnv(content);
  Object.assign(config, newConfig);
  
  const lines = [];
  for (const [key, value] of Object.entries(config)) {
    lines.push(`${key}=${value}`);
  }
  
  return writeEnv(lines.join('\n'));
}

router.get('/status', (req, res) => {
  try {
    const envContent = readEnv();
    const config = parseEnv(envContent);
    
    const llmEnabled = !!(config.LLM_PROVIDER && config[`${config.LLM_PROVIDER.toUpperCase()}_API_KEY`]);
    
    res.json({
      success: true,
      data: {
        enabled: llmEnabled,
        provider: config.LLM_PROVIDER || null,
        openai: {
          configured: !!(config.OPENAI_API_KEY),
          model: config.OPENAI_MODEL || 'gpt-4o-mini',
        },
        qwen: {
          configured: !!(config.QWEN_API_KEY),
          model: config.QWEN_MODEL || 'qwen-turbo',
        },
        wenxin: {
          configured: !!(config.WENXIN_API_KEY && config.WENXIN_SECRET_KEY),
          model: config.WENXIN_MODEL || 'ernie-4.0-turbo',
        }
      }
    });
  } catch (error) {
    logger.error('Get LLM status failed:', error);
    res.status(500).json({
      success: false,
      message: '获取配置失败'
    });
  }
});

router.post('/config', (req, res) => {
  try {
    const { provider, apiKey, model } = req.body;
    
    if (!provider || !apiKey) {
      return res.status(400).json({
        success: false,
        message: '请提供完整的配置信息'
      });
    }
    
    const providerMap = {
      'openai': 'OPENAI',
      'qwen': 'QWEN',
      'wenxin': 'WENXIN'
    };
    
    const providerUpper = providerMap[provider];
    if (!providerUpper) {
      return res.status(400).json({
        success: false,
        message: '不支持的大模型提供商'
      });
    }
    
    const newConfig = {
      'LLM_PROVIDER': provider
    };
    
    newConfig[`${providerUpper}_API_KEY`] = apiKey;
    
    if (model) {
      newConfig[`${providerUpper}_MODEL`] = model;
    }
    
    if (provider === 'wenxin' && req.body.secretKey) {
      newConfig['WENXIN_SECRET_KEY'] = req.body.secretKey;
    }
    
    const success = updateEnvFile(newConfig);
    
    if (success) {
      logger.info(`LLM configuration updated: provider=${provider}`);
      
      setTimeout(() => {
        logger.info('请重启服务以使配置生效，或配置已自动加载');
      }, 100);
      
      res.json({
        success: true,
        message: '配置成功！商家端已启用智能AI回复功能',
        data: {
          provider,
          model: model || 'default'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: '配置保存失败，请检查文件权限'
      });
    }
  } catch (error) {
    logger.error('Save LLM config failed:', error);
    res.status(500).json({
      success: false,
      message: '配置保存失败'
    });
  }
});

router.post('/disable', (req, res) => {
  try {
    const newConfig = {
      'LLM_PROVIDER': ''
    };
    
    const success = updateEnvFile(newConfig);
    
    if (success) {
      logger.info('LLM disabled by admin');
      res.json({
        success: true,
        message: '已关闭智能AI回复功能'
      });
    } else {
      res.status(500).json({
        success: false,
        message: '操作失败'
      });
    }
  } catch (error) {
    logger.error('Disable LLM failed:', error);
    res.status(500).json({
      success: false,
      message: '操作失败'
    });
  }
});

router.post('/test', async (req, res) => {
  try {
    const { provider, apiKey, model, secretKey } = req.body;
    
    const llmService = require('../services/llm-service');
    
    const tempProvider = {
      openai: {
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        apiKey: apiKey,
        model: model || 'gpt-4o-mini',
      },
      qwen: {
        baseUrl: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: apiKey,
        model: model || 'qwen-turbo',
      },
      wenxin: {
        apiKey: apiKey,
        secretKey: secretKey || '',
        model: model || 'ernie-4.0-turbo',
      }
    };
    
    if (!tempProvider[provider]) {
      return res.status(400).json({
        success: false,
        message: '不支持的提供商'
      });
    }
    
    const mockStoreInfo = {
      name: '雨姗AI收银助手创味菜',
      address: '河南省商丘市',
      phone: '0370-628-9999',
    };
    
    const mockDishes = [
      { name: '招牌大鱼头泡饭', price: 88 },
      { name: '黄焖大甲鱼', price: 238 },
    ];
    
    const testResult = await llmService.generateResponse(
      '你好，我想点餐',
      [],
      mockStoreInfo,
      mockDishes
    );
    
    if (testResult?.success) {
      res.json({
        success: true,
        message: '连接成功！AI回复测试通过',
        data: {
          reply: testResult.content,
          intent: testResult.intent
        }
      });
    } else {
      res.json({
        success: false,
        message: '连接失败，请检查API密钥是否正确'
      });
    }
  } catch (error) {
    logger.error('Test LLM failed:', error);
    res.status(500).json({
      success: false,
      message: '测试失败：' + error.message
    });
  }
});

module.exports = router;
