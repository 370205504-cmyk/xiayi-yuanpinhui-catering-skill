const axios = require('axios');
const logger = require('../utils/logger');

class LLMService {
  constructor() {
    this.providers = {
      openai: {
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      },
      qwen: {
        baseUrl: process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: process.env.QWEN_API_KEY,
        model: process.env.QWEN_MODEL || 'qwen-turbo',
      },
      wenxin: {
        baseUrl: process.env.WENXIN_BASE_URL || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat',
        apiKey: process.env.WENXIN_API_KEY,
        secretKey: process.env.WENXIN_SECRET_KEY,
        model: process.env.WENXIN_MODEL || 'ernie-4.0-turbo',
      },
    };
    this.enabledProvider = process.env.LLM_PROVIDER || null;
    this.isEnabled = !!this.enabledProvider && this.providers[this.enabledProvider]?.apiKey;
    logger.info(`LLM Service initialized. Provider: ${this.enabledProvider || 'none'}`);
  }

  /**
   * 构建系统提示词
   */
  buildSystemPrompt(storeInfo, dishes) {
    const menuText = dishes
      .map(d => `- ${d.name} (¥${d.price}${d.category ? `, ${d.category}` : ''})`)
      .join('\n');
    return `你是雨姗AI收银助手的智能点餐助手，性格亲切、友好、专业。

门店信息：
- 名称：${storeInfo?.name || '雨姗AI收银助手创味菜'}
- 地址：${storeInfo?.address || '县孔祖大道南段'}
- 电话：${storeInfo?.phone || '0370-628-8888'}
- 营业时间：${storeInfo?.businessHours || '10:00-22:00'}
- WiFi：${storeInfo?.wifi_name || '雨姗AI收银助手免费WiFi'}，密码：${storeInfo?.wifi_password || '88888888'}

可用菜单：
${menuText}

你的职责：
1. 友好地回应用户，帮助用户点餐
2. 可以推荐菜品、介绍菜品、回答菜单相关问题
3. 可以帮用户添加菜品到购物车、查看购物车、确认下单
4. 回答门店营业时间、WiFi密码、地址电话等问题
5. 用自然、口语化的方式回复，不要太正式

重要指令：
- 当用户说"来一份X"、"点X"等点餐意图时，识别为ADD_TO_CART意图
- 当用户问"菜单"、"有什么菜"等问题时，识别为SHOW_MENU意图
- 当用户问"营业时间"、"几点开门"等问题时，识别为SHOW_HOURS意图
- 当用户问"WiFi"、"密码"等问题时，识别为SHOW_WIFI意图
- 当用户问"地址"、"在哪"等问题时，识别为SHOW_ADDRESS意图
- 当用户说"下单"、"结账"等时，识别为CHECKOUT意图

回复格式要求：
- 直接回复用户的问题，不要加特殊标记
- 回复要简洁、友好、专业
- 可以适当使用表情符号增加亲和力`;
  }

  /**
   * 调用大模型生成回复
   */
  async generateResponse(userMessage, conversationHistory = [], storeInfo, dishes) {
    if (!this.isEnabled) {
      logger.info('LLM not enabled, returning null');
      return null;
    }

    try {
      const systemPrompt = this.buildSystemPrompt(storeInfo, dishes);
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.map(h => ({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.content,
        })),
        { role: 'user', content: userMessage },
      ];

      let response;
      switch (this.enabledProvider) {
        case 'openai':
          response = await this.callOpenAI(messages);
          break;
        case 'qwen':
          response = await this.callQwen(messages);
          break;
        case 'wenxin':
          response = await this.callWenxin(messages);
          break;
        default:
          return null;
      }

      return {
        success: true,
        content: response,
        intent: this.detectIntent(userMessage),
      };
    } catch (error) {
      logger.error('LLM generate response failed:', error);
      return null;
    }
  }

  /**
   * 调用OpenAI API
   */
  async callOpenAI(messages) {
    const provider = this.providers.openai;
    const response = await axios.post(
      `${provider.baseUrl}/chat/completions`,
      {
        model: provider.model,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        timeout: 10000,
      }
    );
    return response.data.choices[0].message.content;
  }

  /**
   * 调用通义千问API
   */
  async callQwen(messages) {
    const provider = this.providers.qwen;
    const response = await axios.post(
      `${provider.baseUrl}/chat/completions`,
      {
        model: provider.model,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        timeout: 10000,
      }
    );
    return response.data.choices[0].message.content;
  }

  /**
   * 调用文心一言API
   */
  async callWenxin(messages) {
    const provider = this.providers.wenxin;
    const accessToken = await this.getWenxinAccessToken(provider);
    const response = await axios.post(
      `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/${provider.model}?access_token=${accessToken}`,
      {
        messages,
        temperature: 0.7,
        max_output_tokens: 500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );
    return response.data.result;
  }

  /**
   * 获取文心一言的access token
   */
  async getWenxinAccessToken(provider) {
    const response = await axios.post(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${provider.apiKey}&client_secret=${provider.secretKey}`,
      {},
      { timeout: 5000 }
    );
    return response.data.access_token;
  }

  /**
   * 简单的意图检测（作为fallback）
   */
  detectIntent(message) {
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('菜单') || lowerMsg.includes('有什么') || lowerMsg.includes('看看')) {
      return 'SHOW_MENU';
    }
    if (lowerMsg.includes('推荐') || lowerMsg.includes('好吃') || lowerMsg.includes('招牌')) {
      return 'RECOMMEND';
    }
    if (lowerMsg.includes('来一份') || lowerMsg.includes('点') || lowerMsg.includes('加') || lowerMsg.includes('要')) {
      return 'ADD_TO_CART';
    }
    if (lowerMsg.includes('购物车') || lowerMsg.includes('看看我') || lowerMsg.includes('我点')) {
      return 'SHOW_CART';
    }
    if (lowerMsg.includes('下单') || lowerMsg.includes('确认') || lowerMsg.includes('结账') || lowerMsg.includes('买单')) {
      return 'CHECKOUT';
    }
    if (lowerMsg.includes('取消') || lowerMsg.includes('不要')) {
      return 'CANCEL';
    }
    if (lowerMsg.includes('wifi') || lowerMsg.includes('无线') || lowerMsg.includes('密码')) {
      return 'SHOW_WIFI';
    }
    if (lowerMsg.includes('营业') || lowerMsg.includes('时间') || lowerMsg.includes('几点')) {
      return 'SHOW_HOURS';
    }
    if (lowerMsg.includes('地址') || lowerMsg.includes('在哪') || lowerMsg.includes('怎么去')) {
      return 'SHOW_ADDRESS';
    }
    if (lowerMsg.includes('电话') || lowerMsg.includes('联系')) {
      return 'SHOW_PHONE';
    }
    if (lowerMsg.includes('帮助') || lowerMsg.includes('怎么用') || lowerMsg.includes('help')) {
      return 'SHOW_HELP';
    }
    return 'GENERAL';
  }
}

module.exports = new LLMService();
