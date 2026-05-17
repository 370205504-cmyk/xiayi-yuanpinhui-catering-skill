const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const logger = require('../utils/logger');

function getAxiosConfig(timeout = 10000) {
  const config = { timeout };
  const proxyUrl = process.env.http_proxy || process.env.HTTP_PROXY;
  if (proxyUrl) {
    config.httpsAgent = new HttpsProxyAgent(proxyUrl);
    config.proxy = false;
  }
  return config;
}

const providers = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    icon: '🔵',
    apiType: 'openai',
    requiresSecret: false,
    defaultUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    models: ['DeepSeek-V4-Pro', 'DeepSeek-V4-Flash', 'deepseek-chat', 'deepseek-r1-chat']
  },
  {
    id: 'moonshot',
    name: 'Moonshot',
    icon: '🌙',
    apiType: 'openai',
    requiresSecret: false,
    defaultUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k']
  },
  {
    id: 'qwen',
    name: 'Qwen',
    icon: '🦄',
    apiType: 'openai',
    requiresSecret: false,
    defaultUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-turbo',
    models: ['qwen-turbo', 'qwen-plus', 'qwen-max', 'qwen-max-longcontext']
  },
  {
    id: 'zhipu',
    name: 'Zhipu',
    icon: '🧠',
    apiType: 'openai',
    requiresSecret: false,
    defaultUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4',
    models: ['glm-4', 'glm-4v', 'glm-3-turbo']
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    icon: '🤖',
    apiType: 'anthropic',
    requiresSecret: false,
    defaultUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-sonnet-20240229',
    models: ['claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-haiku-20240307']
  },
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '💬',
    apiType: 'openai',
    requiresSecret: false,
    defaultUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-3.5-turbo',
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: '✨',
    apiType: 'openai',
    requiresSecret: false,
    defaultUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-pro',
    models: ['gemini-pro', 'gemini-pro-vision']
  },
  {
    id: 'baidu',
    name: 'Baidu Wenxin',
    icon: '🅱️',
    apiType: 'wenxin',
    requiresSecret: true,
    defaultUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
    defaultModel: 'completions',
    models: ['completions', 'eb-instant']
  },
  {
    id: 'tencent',
    name: 'Tencent Hunyuan',
    icon: '🦜',
    apiType: 'openai',
    requiresSecret: true,
    defaultUrl: 'https://hunyuan.tencentcloudapi.com/',
    defaultModel: 'hunyuan',
    models: ['hunyuan']
  },
  {
    id: 'doubao',
    name: 'Doubao',
    icon: '🥡',
    apiType: 'openai',
    requiresSecret: false,
    defaultUrl: 'https://api.doubao.com/v1/chat/completions',
    defaultModel: 'Doubao-3',
    models: ['Doubao-3', 'Doubao-3-Plus']
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    icon: '🎯',
    apiType: 'openai',
    requiresSecret: false,
    defaultUrl: 'https://api.minimax.chat/v1/text/completion',
    defaultModel: 'abab6-chat',
    models: ['abab6-chat', 'abab5.5-chat', 'abab5-chat']
  },
  {
    id: 'yandex',
    name: 'YandexGPT',
    icon: '🇷🇺',
    apiType: 'openai',
    requiresSecret: false,
    defaultUrl: 'https://llm.api.cloud.yandex.net/foundationModels/v1',
    defaultModel: 'yandexgpt-lite',
    models: ['yandexgpt', 'yandexgpt-lite']
  }
];

function getAllProviders() {
  return providers;
}

function getProviderConfig(providerId) {
  return providers.find(p => p.id === providerId);
}

async function testConnection({ provider, apiKey, baseUrl, apiType = 'openai', model = 'default' }) {
  const startTime = Date.now();
  
  try {
    const providerConfig = getProviderConfig(provider);
    if (!providerConfig) {
      return { success: false, message: '不支持的提供商' };
    }
    
    const url = baseUrl || providerConfig.defaultUrl;
    const targetModel = model === 'default' ? providerConfig.defaultModel : model;
    
    if (apiType === 'anthropic') {
      const response = await axios.post(
        `${url}/messages`,
        {
          model: targetModel,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey
          },
          ...getAxiosConfig()
        }
      );
      
      return {
        success: true,
        latency: Date.now() - startTime,
        model: targetModel
      };
    } else if (apiType === 'wenxin') {
      const response = await axios.post(
        `${url}?access_token=${apiKey}`,
        {
          messages: [{ role: 'user', content: 'Hello' }]
        },
        {
          headers: { 'Content-Type': 'application/json' },
          ...getAxiosConfig()
        }
      );
      
      return {
        success: true,
        latency: Date.now() - startTime,
        model: targetModel
      };
    } else {
      const response = await axios.post(
        `${url}/chat/completions`,
        {
          model: targetModel,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          ...getAxiosConfig()
        }
      );
      
      return {
        success: true,
        latency: Date.now() - startTime,
        model: targetModel
      };
    }
  } catch (error) {
    logger.error('LLM test connection error:', error.message);
    return {
      success: false,
      message: error.response?.data?.error?.message || error.message
    };
  }
}

module.exports = {
  getAllProviders,
  getProviderConfig,
  testConnection
};