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

router.get('/providers', (req, res) => {
  const llmService = require('../services/llm-service');
  res.json({
    success: true,
    providers: llmService.getAllProviders()
  });
});

router.get('/status', (req, res) => {
  try {
    const envContent = readEnv();
    const config = parseEnv(envContent);
    const llmService = require('../services/llm-service');
    
    const providers = llmService.getAllProviders();
    const providerStatus = {};
    
    providers.forEach(p => {
      const prefix = p.id.toUpperCase();
      providerStatus[p.id] = {
        configured: !!(config[`${prefix}_API_KEY`]),
        model: config[`${prefix}_MODEL`] || 'default',
        requiresSecret: p.requiresSecret,
        configuredSecret: p.requiresSecret ? !!(config[`${prefix}_SECRET_KEY`]) : true,
      };
    });
    
    const llmEnabled = !!(config.LLM_PROVIDER && config[`${config.LLM_PROVIDER.toUpperCase()}_API_KEY`]);
    
    res.json({
      success: true,
      data: {
        enabled: llmEnabled,
        provider: config.LLM_PROVIDER || null,
        providers: providerStatus
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
    const { provider, apiKey, model, secretKey, baseUrl } = req.body;
    
    if (!provider || !apiKey) {
      return res.status(400).json({
        success: false,
        message: '请提供完整的配置信息'
      });
    }
    
    const llmService = require('../services/llm-service');
    const providerInfo = llmService.getProviderConfig(provider);
    
    if (!providerInfo) {
      return res.status(400).json({
        success: false,
        message: '不支持的大模型提供商'
      });
    }
    
    const prefix = provider.toUpperCase();
    const newConfig = {
      'LLM_PROVIDER': provider,
      [`${prefix}_API_KEY`]: apiKey,
    };
    
    if (model) {
      newConfig[`${prefix}_MODEL`] = model;
    }
    
    if (secretKey && providerInfo.requiresSecret) {
      newConfig[`${prefix}_SECRET_KEY`] = secretKey;
    }
    
    if (baseUrl) {
      newConfig[`${prefix}_BASE_URL`] = baseUrl;
    }
    
    const success = updateEnvFile(newConfig);
    
    if (success) {
      logger.info(`LLM configuration updated: provider=${provider}`);
      
      setTimeout(() => {
        logger.info('LLM config updated, service will use new config on next request');
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
    const { provider, apiKey, model, secretKey, baseUrl } = req.body;
    
    const llmService = require('../services/llm-service');
    const providerInfo = llmService.getProviderConfig(provider);
    
    if (!providerInfo) {
      return res.status(400).json({
        success: false,
        message: '不支持的提供商'
      });
    }
    
    const tempProvider = {
      ...providerInfo,
      apiKey: apiKey,
      model: model || providerInfo.model,
      baseUrl: baseUrl || providerInfo.baseUrl,
      secretKey: secretKey || providerInfo.secretKey,
    };
    
    const mockStoreInfo = {
      name: '雨姗AI收银助手创味菜',
      address: '河南省商丘市',
      phone: '0370-628-9999',
    };
    
    const mockDishes = [
      { name: '招牌大鱼头泡饭', price: 88 },
      { name: '黄焖大甲鱼', price: 238 },
    ];
    
    const systemPrompt = llmService.buildSystemPrompt(mockStoreInfo, mockDishes);
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '你好，我想点餐' },
    ];
    
    let response;
    switch (tempProvider.apiType) {
      case 'openai':
        response = await llmService.callOpenAICompatible(tempProvider, messages);
        break;
      case 'wenxin':
        response = await llmService.callWenxin(tempProvider, messages);
        break;
      case 'minimax':
        response = await llmService.callMiniMax(tempProvider, messages);
        break;
      case 'volcengine':
        response = await llmService.callVolcengine(tempProvider, messages);
        break;
      case 'youdao':
        response = await llmService.callYoudao(tempProvider, messages);
        break;
      case 'xiaomi':
        response = await llmService.callXiaomi(tempProvider, messages);
        break;
      default:
        response = await llmService.callOpenAICompatible(tempProvider, messages);
    }
    
    if (response) {
      res.json({
        success: true,
        message: '连接成功！AI回复测试通过',
        data: {
          reply: response,
          intent: llmService.detectIntent('你好，我想点餐')
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
