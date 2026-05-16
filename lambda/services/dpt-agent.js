/**
 * DPT-Agent - 美团多智能体框架
 * 双过程理论Agent，支持多Agent协作
 */

class DPTDualProcessAgent {
  constructor() {
    this.system1 = new System1Agent(); // 直觉快速系统
    this.system2 = new System2Agent(); // 深思熟虑系统
    this.agents = new Map();
    this.conversationHistory = [];
    this.initDefaultAgents();
  }

  initDefaultAgents() {
    this.agents.set('order', new OrderAgent());
    this.agents.set('recommendation', new RecommendationAgent());
    this.agents.set('customer_service', new CustomerServiceAgent());
    this.agents.set('inventory', new InventoryAgent());
    this.agents.set('marketing', new MarketingAgent());
  }

  /**
   * 处理用户请求 - 双过程理论
   */
  async processRequest(userInput, context = {}) {
    // 步骤1：系统1快速响应（直觉）
    const system1Response = this.system1.process(userInput, context);

    // 步骤2：系统2深度思考（理性）
    const system2Response = await this.system2.process(userInput, context);

    // 步骤3：协调决策
    const finalResponse = this.coordinateSystems(system1Response, system2Response);

    // 记录对话
    this.conversationHistory.push({
      userInput,
      system1Response,
      system2Response,
      finalResponse,
      timestamp: new Date().toISOString()
    });

    return finalResponse;
  }

  /**
   * 协调两个系统的响应
   */
  coordinateSystems(s1, s2) {
    // 如果系统2有高置信度响应，优先使用
    if (s2.confidence > 0.8) {
      return {
        ...s2,
        system: 'system2',
        fallback: s1
      };
    }

    // 否则使用系统1快速响应，但附上系统2的建议
    return {
      ...s1,
      system: 'system1',
      suggestion: s2.suggestion
    };
  }

  /**
   * 多Agent协作处理
   */
  async multiAgentCollaboration(task, context) {
    const results = {};
    const agentTasks = [];

    // 并行执行所有相关Agent
    for (const [name, agent] of this.agents) {
      if (agent.canHandle(task)) {
        agentTasks.push(agent.execute(task, context).then(result => {
          results[name] = result;
        }));
      }
    }

    await Promise.all(agentTasks);

    // 整合结果
    return this.integrateAgentResults(results, task);
  }

  /**
   * 整合多个Agent的结果
   */
  integrateAgentResults(results, task) {
    const integrated = {
      success: true,
      task,
      agentResults: results,
      finalDecision: null,
      timestamp: new Date().toISOString()
    };

    // 决策逻辑：根据任务类型选择主要Agent
    if (task.type === 'order') {
      integrated.finalDecision = results.order || results.recommendation;
    } else if (task.type === 'query') {
      integrated.finalDecision = results.customer_service;
    } else if (task.type === 'inventory') {
      integrated.finalDecision = results.inventory;
    } else {
      // 综合所有Agent的建议
      integrated.finalDecision = {
        type: 'composite',
        suggestions: Object.values(results).map(r => r.suggestion || r.response).filter(Boolean)
      };
    }

    return integrated;
  }

  /**
   * 获取Agent状态
   */
  getAgentStatus() {
    return {
      totalAgents: this.agents.size,
      agentNames: Array.from(this.agents.keys()),
      conversationCount: this.conversationHistory.length,
      system1Active: this.system1.isActive,
      system2Active: this.system2.isActive
    };
  }
}

/**
 * 系统1：直觉快速响应系统
 */
class System1Agent {
  constructor() {
    this.isActive = true;
    this.patterns = this.loadPatterns();
  }

  loadPatterns() {
    return [
      { keywords: ['点', '来', '要', '给我'], intent: 'order', confidence: 0.9 },
      { keywords: ['多少钱', '价格', '贵', '便宜'], intent: 'price', confidence: 0.85 },
      { keywords: ['推荐', '招牌', '特色', '好吃'], intent: 'recommend', confidence: 0.9 },
      { keywords: ['WiFi', 'wifi', '密码', '停车'], intent: 'service', confidence: 0.95 },
      { keywords: ['你好', '您好', '嗨', '在吗'], intent: 'greeting', confidence: 0.95 },
      { keywords: ['打包', '带走', '外卖'], intent: 'takeaway', confidence: 0.85 },
      { keywords: ['辣', '不辣', '少辣', '微辣'], intent: 'spice', confidence: 0.85 },
      { keywords: ['会员', '积分', '充值'], intent: 'member', confidence: 0.85 }
    ];
  }

  process(input, context) {
    const lowerInput = input.toLowerCase();

    // 快速模式匹配
    for (const pattern of this.patterns) {
      if (pattern.keywords.some(keyword => lowerInput.includes(keyword))) {
        return {
          success: true,
          intent: pattern.intent,
          confidence: pattern.confidence,
          response: this.generateQuickResponse(pattern.intent, input, context),
          responseTime: Date.now() - Date.now(), // 模拟快速响应
          system: 'system1'
        };
      }
    }

    // 未匹配，返回需要系统2处理
    return {
      success: false,
      intent: 'unknown',
      confidence: 0.3,
      needSystem2: true,
      system: 'system1'
    };
  }

  generateQuickResponse(intent, input, context) {
    const responses = {
      order: '好的，我来帮您点餐~',
      price: '我来帮您查一下价格~',
      recommend: '好的，我给您推荐招牌菜~',
      service: '我来帮您查询服务信息~',
      greeting: '您好！我是您的AI点餐助手~',
      takeaway: '好的，我来帮您处理外卖订单~',
      spice: '好的，我记下您的口味要求~',
      member: '好的，我来帮您查询会员信息~'
    };
    return responses[intent] || '我明白了，让我想想~';
  }
}

/**
 * 系统2：深思熟虑系统
 */
class System2Agent {
  constructor() {
    this.isActive = true;
  }

  async process(input, context) {
    // 模拟深度思考过程
    await this.simulateThinking();

    const analysis = this.deepAnalysis(input, context);

    return {
      success: true,
      intent: analysis.intent,
      confidence: analysis.confidence,
      response: analysis.response,
      reasoning: analysis.reasoning,
      suggestion: analysis.suggestion,
      entities: analysis.entities,
      system: 'system2'
    };
  }

  simulateThinking() {
    return new Promise(resolve => setTimeout(resolve, 200));
  }

  deepAnalysis(input, context) {
    // 深度分析逻辑
    const entities = this.extractEntities(input);
    const intent = this.determineIntent(input, entities, context);

    return {
      intent,
      confidence: 0.85,
      response: this.generateThoughtfulResponse(intent, entities, context),
      reasoning: this.generateReasoning(input, intent, entities),
      suggestion: this.generateSuggestion(intent, entities, context),
      entities
    };
  }

  extractEntities(input) {
    const entities = {
      dishes: [],
      quantities: [],
      prices: [],
      time: null,
      location: null
    };

    // 简单实体提取（实际可更复杂）
    const dishKeywords = ['宫保鸡丁', '鱼香肉丝', '麻婆豆腐', '红烧肉', '糖醋里脊'];
    dishKeywords.forEach(dish => {
      if (input.includes(dish)) {
        entities.dishes.push(dish);
      }
    });

    const quantityMatch = input.match(/(\d+)(份|个|碗|盘|杯)/);
    if (quantityMatch) {
      entities.quantities.push({
        amount: parseInt(quantityMatch[1]),
        unit: quantityMatch[2]
      });
    }

    return entities;
  }

  determineIntent(input, entities, context) {
    if (entities.dishes.length > 0) return 'order';
    if (input.includes('推荐') || input.includes('招牌')) return 'recommend';
    if (input.includes('WiFi') || input.includes('停车')) return 'service';
    if (input.includes('会员') || input.includes('积分')) return 'member';
    return 'general';
  }

  generateThoughtfulResponse(intent, entities, context) {
    const responses = {
      order: `我来帮您点 ${entities.dishes.join('、')}，请问还有其他需要吗？`,
      recommend: '根据您的偏好，我推荐招牌菜宫保鸡丁和鱼香肉丝，您看怎么样？',
      service: '我们的WiFi密码是88888888，地下停车场消费满100元免2小时。',
      member: '您当前有200积分，可以兑换精美小食一份。',
      general: '我理解您的需求了，让我帮您处理~'
    };
    return responses[intent] || responses.general;
  }

  generateReasoning(input, intent, entities) {
    return `分析步骤：1.识别关键词 2.提取实体 3.确定意图 4.生成响应。识别到${entities.dishes.length > 0 ? `菜品${entities.dishes.join('、')}` : '无特定菜品'}，意图判断为${intent}。`;
  }

  generateSuggestion(intent, entities, context) {
    const suggestions = {
      order: '建议搭配一份汤品和饮料~',
      recommend: '建议您也试试我们的新品麻婆豆腐~',
      service: '需要我帮您安排停车位吗？',
      member: '现在充值有优惠活动哦~',
      general: '有什么需要随时告诉我~'
    };
    return suggestions[intent] || suggestions.general;
  }
}

/**
 * 点餐Agent
 */
class OrderAgent {
  canHandle(task) {
    return task.type === 'order' || task.intent === 'order';
  }

  async execute(task, context) {
    return {
      success: true,
      agent: 'order',
      response: '订单已处理',
      orderId: 'ORD' + Date.now(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 推荐Agent
 */
class RecommendationAgent {
  canHandle(task) {
    return task.type === 'recommend' || task.intent === 'recommend';
  }

  async execute(task, context) {
    const recommendations = ['宫保鸡丁', '鱼香肉丝', '招牌套餐'];
    return {
      success: true,
      agent: 'recommendation',
      recommendations,
      response: `推荐 ${recommendations.join('、')}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 客服Agent
 */
class CustomerServiceAgent {
  canHandle(task) {
    return task.type === 'service' || task.intent === 'service' || task.type === 'query';
  }

  async execute(task, context) {
    return {
      success: true,
      agent: 'customer_service',
      response: '我来帮您解决问题',
      category: task.category || 'general',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 库存Agent
 */
class InventoryAgent {
  canHandle(task) {
    return task.type === 'inventory' || task.intent === 'inventory';
  }

  async execute(task, context) {
    return {
      success: true,
      agent: 'inventory',
      inStock: Math.random() > 0.1,
      stockLevel: Math.floor(Math.random() * 50) + 10,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 营销Agent
 */
class MarketingAgent {
  canHandle(task) {
    return task.type === 'marketing' || task.intent === 'marketing';
  }

  async execute(task, context) {
    return {
      success: true,
      agent: 'marketing',
      promotion: '今日特惠',
      discount: '8折',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = DPTDualProcessAgent;
