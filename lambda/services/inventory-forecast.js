/**
 * 库存预测系统 (Inventory Forecasting)
 * 基于Foodix AI库存预测系统设计
 * 功能：库存预测、需求预测、智能补货建议
 */

class InventoryForecastService {
  constructor() {
    this.inventory = new Map();
    this.salesHistory = new Map();
    this.predictions = new Map();
    this.threshold = {
      reorderPoint: 20,
      safetyStock: 10,
      maxStock: 100
    };
  }

  initializeInventory(items) {
    for (const item of items) {
      this.inventory.set(item.id, {
        id: item.id,
        name: item.name,
        category: item.category,
        currentStock: item.stock || 50,
        unit: item.unit,
        cost: item.cost || 0,
        price: item.price || 0,
        supplier: item.supplier,
        leadTime: item.leadTime || 2,
        lastUpdated: new Date()
      });

      this.salesHistory.set(item.id, []);
    }
    return { success: true, count: items.length };
  }

  recordSale(itemId, quantity, date = new Date()) {
    const inventory = this.inventory.get(itemId);
    if (!inventory) {
      return { success: false, error: '商品不存在' };
    }

    inventory.currentStock = Math.max(0, inventory.currentStock - quantity);
    inventory.lastUpdated = date;

    const history = this.salesHistory.get(itemId) || [];
    history.push({
      date,
      quantity,
      dayOfWeek: date.getDay(),
      hour: date.getHours()
    });
    
    this.salesHistory.set(itemId, history);
    this.updatePrediction(itemId);

    return {
      success: true,
      item: inventory,
      prediction: this.predictions.get(itemId)
    };
  }

  updatePrediction(itemId) {
    const history = this.salesHistory.get(itemId);
    if (!history || history.length < 7) {
      return null;
    }

    const inventory = this.inventory.get(itemId);
    const prediction = this.calculatePrediction(itemId, history);
    this.predictions.set(itemId, prediction);

    return prediction;
  }

  calculatePrediction(itemId, history) {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    
    const last7Days = this.getLastNDays(history, 7);
    const last14Days = this.getLastNDays(history, 14);
    const last30Days = this.getLastNDays(history, 30);

    const avgDailySales7 = this.calculateAverage(last7Days);
    const avgDailySales14 = this.calculateAverage(last14Days);
    const avgDailySales30 = this.calculateAverage(last30Days);
    
    const trend = this.calculateTrend(last7Days, last14Days);
    
    const dayOfWeekPattern = this.getDayOfWeekPattern(history, dayOfWeek);
    
    const predictedDemand = avgDailySales30 * (1 + trend) * dayOfWeekPattern;
    
    const leadTime = this.inventory.get(itemId)?.leadTime || 2;
    const safetyStock = this.threshold.safetyStock;
    const daysOfStock = inventory => {
      const inventory_item = this.inventory.get(itemId);
      return inventory_item ? inventory_item.currentStock / predictedDemand : 0;
    };
    
    const daysUntilStockout = predictedDemand > 0 
      ? (this.inventory.get(itemId)?.currentStock || 0) / predictedDemand 
      : Infinity;

    const reorderQuantity = Math.max(0, Math.round(
      (predictedDemand * 7) + safetyStock - (this.inventory.get(itemId)?.currentStock || 0)
    ));

    return {
      itemId,
      predictedDailySales: Math.round(predictedDemand * 100) / 100,
      weeklyPrediction: Math.round(predictedDemand * 7 * 100) / 100,
      monthlyPrediction: Math.round(predictedDemand * 30 * 100) / 100,
      trend: Math.round(trend * 100) + '%',
      trendDirection: trend > 0.05 ? '上升' : trend < -0.05 ? '下降' : '平稳',
      dayOfWeekPattern: Math.round(dayOfWeekPattern * 100) + '%',
      daysUntilStockout: Math.round(daysUntilStockout * 10) / 10,
      reorderQuantity: reorderQuantity > 0 ? reorderQuantity : 0,
      reorderRecommended: daysUntilStockout <= leadTime + safetyStock,
      confidence: this.calculateConfidence(history.length),
      lastUpdated: new Date().toISOString()
    };
  }

  getLastNDays(history, days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return history.filter(h => new Date(h.date) >= cutoff);
  }

  calculateAverage(sales) {
    if (sales.length === 0) return 0;
    const total = sales.reduce((sum, s) => sum + s.quantity, 0);
    return total / Math.max(1, Math.min(sales.length, 30));
  }

  calculateTrend(last7Days, last14Days) {
    const avg7 = this.calculateAverage(last7Days);
    const avg14 = this.calculateAverage(last14Days);
    if (avg14 === 0) return 0;
    return (avg7 - avg14) / avg14;
  }

  getDayOfWeekPattern(history, targetDayOfWeek) {
    const sameDaySales = history.filter(h => h.dayOfWeek === targetDayOfWeek);
    const allAvg = this.calculateAverage(history);
    if (sameDaySales.length === 0) return 1;
    const sameDayAvg = this.calculateAverage(sameDaySales);
    return allAvg > 0 ? sameDayAvg / allAvg : 1;
  }

  calculateConfidence(dataPoints) {
    if (dataPoints < 7) return 0.5;
    if (dataPoints < 14) return 0.7;
    if (dataPoints < 30) return 0.85;
    return 0.95;
  }

  getInventoryStatus() {
    const status = [];
    
    for (const [itemId, item] of this.inventory.entries()) {
      const prediction = this.predictions.get(itemId);
      const reorderQuantity = prediction?.reorderQuantity || 0;
      
      let stockStatus = '正常';
      if (item.currentStock <= 0) {
        stockStatus = '缺货';
      } else if (prediction?.reorderRecommended) {
        stockStatus = '建议补货';
      } else if (item.currentStock < this.threshold.safetyStock) {
        stockStatus = '库存不足';
      } else if (item.currentStock > this.threshold.maxStock) {
        stockStatus = '库存过剩';
      }

      status.push({
        id: itemId,
        name: item.name,
        category: item.category,
        currentStock: item.currentStock,
        unit: item.unit,
        stockStatus,
        reorderQuantity,
        predictedDailySales: prediction?.predictedDailySales || 0,
        daysUntilStockout: prediction?.daysUntilStockout || 'N/A',
        trend: prediction?.trendDirection || '未知',
        confidence: prediction?.confidence || 0
      });
    }

    return status;
  }

  getReorderList() {
    const reorderList = [];
    
    for (const [itemId, item] of this.inventory.entries()) {
      const prediction = this.predictions.get(itemId);
      
      if (prediction?.reorderRecommended || item.currentStock < this.threshold.reorderPoint) {
        reorderList.push({
          id: itemId,
          name: item.name,
          category: item.category,
          currentStock: item.currentStock,
          reorderQuantity: prediction?.reorderQuantity || this.threshold.reorderPoint - item.currentStock,
          suggestedOrderDate: new Date().toISOString().split('T')[0],
          estimatedStockoutDate: prediction?.daysUntilStockout 
            ? new Date(Date.now() + prediction.daysUntilStockout * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : null,
          priority: this.calculateReorderPriority(item, prediction)
        });
      }
    }

    return reorderList.sort((a, b) => a.priority - b.priority);
  }

  calculateReorderPriority(item, prediction) {
    let priority = 50;
    
    if (item.currentStock <= 0) priority += 30;
    else if (item.currentStock < this.threshold.safetyStock) priority += 20;
    
    if (prediction?.daysUntilStockout < item.leadTime) priority += 20;
    
    if (prediction?.trendDirection === '上升') priority += 10;
    
    return priority;
  }

  getForecastReport(days = 7) {
    const report = {
      summary: {
        totalItems: this.inventory.size,
        lowStock: 0,
        outOfStock: 0,
        reorderRecommended: 0,
        overstocked: 0
      },
      predictions: [],
      recommendations: [],
      generatedAt: new Date().toISOString()
    };

    for (const [itemId, item] of this.inventory.entries()) {
      const prediction = this.predictions.get(itemId);
      
      if (item.currentStock < this.threshold.safetyStock) {
        report.summary.lowStock++;
      }
      if (item.currentStock <= 0) {
        report.summary.outOfStock++;
      }
      if (prediction?.reorderRecommended) {
        report.summary.reorderRecommended++;
      }
      if (item.currentStock > this.threshold.maxStock) {
        report.summary.overstocked++;
      }

      if (prediction) {
        report.predictions.push({
          item: item.name,
          category: item.category,
          currentStock: item.currentStock,
          unit: item.unit,
          predictedDemand: prediction.predictedDailySales * days,
          expectedStockEnd: Math.max(0, item.currentStock - prediction.predictedDailySales * days),
          confidence: prediction.confidence
        });
      }
    }

    const reorderList = this.getReorderList();
    report.recommendations = reorderList.map(item => ({
      action: '补货',
      item: item.name,
      quantity: item.reorderQuantity,
      priority: item.priority > 60 ? '紧急' : item.priority > 40 ? '高' : '中'
    }));

    return report;
  }

  simulatePrediction(itemId, futureDays = 7) {
    const prediction = this.predictions.get(itemId);
    if (!prediction) {
      return { success: false, error: '没有足够的预测数据' };
    }

    const inventory = this.inventory.get(itemId);
    const simulation = [];
    let currentStock = inventory.currentStock;

    for (let day = 1; day <= futureDays; day++) {
      const dayPrediction = prediction.predictedDailySales * (1 + Math.random() * 0.2 - 0.1);
      currentStock = Math.max(0, currentStock - dayPrediction);
      
      simulation.push({
        day,
        predictedSales: Math.round(dayPrediction),
        expectedStock: Math.round(currentStock),
        alert: currentStock < this.threshold.safetyStock ? '库存不足预警' : null
      });
    }

    return {
      success: true,
      itemId,
      itemName: inventory.name,
      currentStock: inventory.currentStock,
      prediction,
      simulation,
      conclusion: this.generateSimulationConclusion(simulation)
    };
  }

  generateSimulationConclusion(simulation) {
    const lastDay = simulation[simulation.length - 1];
    if (lastDay.expectedStock <= 0) {
      return '预测显示未来几天内将出现缺货，建议立即补货';
    }
    if (lastDay.alert) {
      return '预测显示库存将降至安全库存以下，建议近期补货';
    }
    return '预测显示库存充足，可以维持正常销售';
  }
}

module.exports = InventoryForecastService;
