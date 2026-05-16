/**
 * 菜品成本核算系统
 * 基于Recipe Costing Application设计
 * 功能：菜品成本计算、食谱成本管理、菜单工程分析、盈利能力分析
 */

class CostAccountingService {
  constructor() {
    this.ingredients = this.loadIngredients();
    this.recipes = this.loadRecipes();
    this.menuItems = this.loadMenuItems();
    this.analysisCache = new Map();
  }

  loadIngredients() {
    return {
      '猪肉': { unit: '斤', price: 15.00, calorie: 143 },
      '牛肉': { unit: '斤', price: 38.00, calorie: 125 },
      '鸡肉': { unit: '斤', price: 12.00, calorie: 167 },
      '鱼肉': { unit: '斤', price: 25.00, calorie: 90 },
      '大白菜': { unit: '斤', price: 2.00, calorie: 17 },
      '土豆': { unit: '斤', price: 3.00, calorie: 76 },
      '番茄': { unit: '斤', price: 4.00, calorie: 15 },
      '鸡蛋': { unit: '个', price: 0.80, calorie: 70 },
      '豆腐': { unit: '块', price: 3.00, calorie: 81 },
      '大米': { unit: '斤', price: 3.00, calorie: 391 },
      '面粉': { unit: '斤', price: 3.50, calorie: 364 },
      '食用油': { unit: '升', price: 12.00, calorie: 900 },
      '盐': { unit: '克', price: 0.01, calorie: 0 },
      '酱油': { unit: 'ml', price: 0.02, calorie: 0.2 },
      '醋': { unit: 'ml', price: 0.015, calorie: 0.1 },
      '白糖': { unit: '克', price: 0.02, calorie: 4 },
      '花椒': { unit: '克', price: 0.1, calorie: 6 },
      '干辣椒': { unit: '克', price: 0.08, calorie: 6 },
      '生姜': { unit: '克', price: 0.03, calorie: 4 },
      '大蒜': { unit: '克', price: 0.02, calorie: 6 },
      '葱': { unit: '克', price: 0.02, calorie: 3 },
      '料酒': { unit: 'ml', price: 0.03, calorie: 0 },
      '淀粉': { unit: '克', price: 0.015, calorie: 3 }
    };
  }

  loadRecipes() {
    return {
      '宫保鸡丁': {
        ingredients: {
          '鸡肉': { amount: 0.4, unit: '斤' },
          '花生米': { amount: 0.1, unit: '斤', price: 18 },
          '干辣椒': { amount: 20, unit: '克' },
          '花椒': { amount: 5, unit: '克' },
          '葱': { amount: 50, unit: '克' },
          '生姜': { amount: 10, unit: '克' },
          '大蒜': { amount: 10, unit: '克' },
          '酱油': { amount: 15, unit: 'ml' },
          '醋': { amount: 10, unit: 'ml' },
          '白糖': { amount: 20, unit: '克' },
          '淀粉': { amount: 10, unit: '克' },
          '食用油': { amount: 0.05, unit: '升' }
        },
        laborMinutes: 15,
        overhead: 3.00
      },
      '鱼香肉丝': {
        ingredients: {
          '猪肉': { amount: 0.3, unit: '斤' },
          '木耳': { amount: 0.05, unit: '斤', price: 30 },
          '胡萝卜': { amount: 0.1, unit: '斤', price: 4 },
          '青椒': { amount: 0.1, unit: '斤', price: 5 },
          '葱': { amount: 50, unit: '克' },
          '生姜': { amount: 10, unit: '克' },
          '大蒜': { amount: 10, unit: '克' },
          '酱油': { amount: 15, unit: 'ml' },
          '醋': { amount: 10, unit: 'ml' },
          '白糖': { amount: 15, unit: '克' },
          '淀粉': { amount: 10, unit: '克' },
          '食用油': { amount: 0.05, unit: '升' }
        },
        laborMinutes: 18,
        overhead: 3.00
      },
      '红烧肉': {
        ingredients: {
          '猪肉': { amount: 0.5, unit: '斤' },
          '白糖': { amount: 50, unit: '克' },
          '酱油': { amount: 30, unit: 'ml' },
          '料酒': { amount: 30, unit: 'ml' },
          '葱': { amount: 50, unit: '克' },
          '生姜': { amount: 20, unit: '克' },
          '八角': { amount: 5, unit: '克', price: 0.5 },
          '桂皮': { amount: 3, unit: '克', price: 0.3 },
          '食用油': { amount: 0.05, unit: '升' }
        },
        laborMinutes: 25,
        overhead: 4.00
      },
      '糖醋里脊': {
        ingredients: {
          '猪肉': { amount: 0.4, unit: '斤' },
          '鸡蛋': { amount: 1, unit: '个' },
          '淀粉': { amount: 50, unit: '克' },
          '番茄酱': { amount: 30, unit: '克', price: 0.15 },
          '白糖': { amount: 40, unit: '克' },
          '醋': { amount: 20, unit: 'ml' },
          '食用油': { amount: 0.3, unit: '升' }
        },
        laborMinutes: 20,
        overhead: 3.50
      },
      '麻婆豆腐': {
        ingredients: {
          '豆腐': { amount: 1, unit: '块' },
          '猪肉': { amount: 0.15, unit: '斤' },
          '豆瓣酱': { amount: 20, unit: '克', price: 0.08 },
          '花椒': { amount: 10, unit: '克' },
          '辣椒粉': { amount: 5, unit: '克', price: 0.2 },
          '葱': { amount: 30, unit: '克' },
          '生姜': { amount: 10, unit: '克' },
          '大蒜': { amount: 10, unit: '克' },
          '食用油': { amount: 0.05, unit: '升' }
        },
        laborMinutes: 12,
        overhead: 2.50
      },
      '番茄炒蛋': {
        ingredients: {
          '番茄': { amount: 0.5, unit: '斤' },
          '鸡蛋': { amount: 2, unit: '个' },
          '白糖': { amount: 10, unit: '克' },
          '盐': { amount: 3, unit: '克' },
          '葱': { amount: 20, unit: '克' },
          '食用油': { amount: 0.03, unit: '升' }
        },
        laborMinutes: 8,
        overhead: 1.50
      }
    };
  }

  loadMenuItems() {
    return [
      { name: '宫保鸡丁', sellingPrice: 38.00, category: '热菜' },
      { name: '鱼香肉丝', sellingPrice: 35.00, category: '热菜' },
      { name: '红烧肉', sellingPrice: 48.00, category: '热菜' },
      { name: '糖醋里脊', sellingPrice: 36.00, category: '热菜' },
      { name: '麻婆豆腐', sellingPrice: 25.00, category: '热菜' },
      { name: '番茄炒蛋', sellingPrice: 18.00, category: '家常菜' },
      { name: '酸辣土豆丝', sellingPrice: 16.00, category: '家常菜' },
      { name: '蚝油生菜', sellingPrice: 18.00, category: '素菜' }
    ];
  }

  calculateRecipeCost(recipeName) {
    const recipe = this.recipes[recipeName];
    if (!recipe) {
      return { success: false, error: '食谱不存在' };
    }

    let ingredientCost = 0;
    const ingredientDetails = [];

    for (const [name, data] of Object.entries(recipe.ingredients)) {
      const ingredientInfo = this.ingredients[name] || { price: data.price || 0 };
      const cost = data.amount * ingredientInfo.price;
      ingredientCost += cost;
      ingredientDetails.push({
        name,
        amount: data.amount,
        unit: data.unit,
        unitPrice: ingredientInfo.price,
        cost: parseFloat(cost.toFixed(2))
      });
    }

    const laborCost = (recipe.laborMinutes / 60) * 25;
    const totalCost = ingredientCost + laborCost + recipe.overhead;

    return {
      success: true,
      recipeName,
      details: {
        ingredientCost: parseFloat(ingredientCost.toFixed(2)),
        laborCost: parseFloat(laborCost.toFixed(2)),
        overhead: recipe.overhead,
        totalCost: parseFloat(totalCost.toFixed(2))
      },
      ingredients: ingredientDetails,
      breakdown: {
        ingredientPercent: ((ingredientCost / totalCost) * 100).toFixed(1) + '%',
        laborPercent: ((laborCost / totalCost) * 100).toFixed(1) + '%',
        overheadPercent: ((recipe.overhead / totalCost) * 100).toFixed(1) + '%'
      }
    };
  }

  calculateMenuProfitability() {
    const analysis = [];

    for (const menuItem of this.menuItems) {
      const costResult = this.calculateRecipeCost(menuItem.name);
      
      if (costResult.success) {
        const cost = costResult.details.totalCost;
        const price = menuItem.sellingPrice;
        const profit = price - cost;
        const profitMargin = (profit / price) * 100;

        analysis.push({
          name: menuItem.name,
          category: menuItem.category,
          sellingPrice: price,
          cost,
          profit,
          profitMargin: profitMargin.toFixed(1) + '%',
          foodCostRate: ((cost / price) * 100).toFixed(1) + '%',
          status: profitMargin >= 60 ? '优秀' : profitMargin >= 40 ? '良好' : profitMargin >= 20 ? '一般' : '偏低'
        });
      }
    }

    return {
      success: true,
      items: analysis,
      summary: this.calculateSummary(analysis)
    };
  }

  calculateSummary(items) {
    const totalRevenue = items.reduce((sum, item) => sum + item.sellingPrice, 0);
    const totalCost = items.reduce((sum, item) => sum + item.cost, 0);
    const totalProfit = items.reduce((sum, item) => sum + item.profit, 0);
    const avgMargin = (totalProfit / totalRevenue) * 100;

    return {
      totalItems: items.length,
      totalRevenue: totalRevenue.toFixed(2),
      totalCost: totalCost.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      averageMargin: avgMargin.toFixed(1) + '%',
      recommendations: this.generateRecommendations(items, avgMargin)
    };
  }

  generateRecommendations(items, avgMargin) {
    const recommendations = [];
    const lowMarginItems = items.filter(item => parseFloat(item.profitMargin) < 30);
    
    if (lowMarginItems.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `${lowMarginItems.length}道菜品的利润率低于30%，建议调整价格或优化配方`
      });
    }

    if (avgMargin < 60) {
      recommendations.push({
        type: 'info',
        message: '菜单整体毛利率偏低，建议提高高价菜品的推荐力度'
      });
    }

    const highMarginItems = items.filter(item => parseFloat(item.profitMargin) >= 70);
    if (highMarginItems.length > 0) {
      recommendations.push({
        type: 'success',
        message: `推荐多推高毛利菜品：${highMarginItems.map(i => i.name).join('、')}`
      });
    }

    return recommendations;
  }

  batchCalculateCost(dishNames) {
    const results = [];
    for (const name of dishNames) {
      results.push(this.calculateRecipeCost(name));
    }
    return results;
  }

  menuEngineeringAnalysis() {
    const profitability = this.calculateMenuProfitability();
    
    const menuMatrix = this.menuItems.map(item => {
      const costResult = this.calculateRecipeCost(item.name);
      if (!costResult.success) return null;
      
      const cost = costResult.details.totalCost;
      const profit = item.sellingPrice - cost;
      
      return {
        name: item.name,
        sellingPrice: item.sellingPrice,
        cost,
        profit,
        popularity: 0
      };
    }).filter(Boolean);

    const avgProfit = menuMatrix.reduce((sum, item) => sum + item.profit, 0) / menuMatrix.length;

    return {
      success: true,
      matrix: menuMatrix.map(item => ({
        ...item,
        category: item.profit > avgProfit ? '高利润' : '低利润'
      })),
      averageProfit: avgProfit.toFixed(2),
      classification: {
        stars: menuMatrix.filter(i => i.profit >= avgProfit * 1.5),
        cashCows: menuMatrix.filter(i => i.profit >= avgProfit && i.profit < avgProfit * 1.5),
        puzzles: menuMatrix.filter(i => i.profit < avgProfit && i.profit >= avgProfit * 0.5),
        dogs: menuMatrix.filter(i => i.profit < avgProfit * 0.5)
      }
    };
  }

  getReport() {
    const profitability = this.calculateMenuProfitability();
    const engineering = this.menuEngineeringAnalysis();

    return {
      profitability,
      engineering,
      generatedAt: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}

module.exports = CostAccountingService;
