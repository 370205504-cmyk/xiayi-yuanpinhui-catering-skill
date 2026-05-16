/**
 * 厨房显示系统 (Kitchen Display System)
 * 基于Kitchen Display System设计
 * 功能：订单实时显示、KDS厨房显示、订单预测
 */

class KitchenDisplayService {
  constructor() {
    this.orders = new Map();
    this.kds = new Map();
    this.callbacks = new Set();
    this.orderQueue = [];
    this.completedOrders = [];
    this.averageCookingTime = new Map();
  }

  initializeKDS(stationId, stationName, stationType = 'main') {
    this.kds.set(stationId, {
      id: stationId,
      name: stationName,
      type: stationType,
      status: 'active',
      orders: [],
      createdAt: new Date()
    });
    return { success: true, station: this.kds.get(stationId) };
  }

  addOrder(order) {
    const orderItem = {
      id: order.orderId || `KD${Date.now()}`,
      orderNo: order.orderNo,
      tableNo: order.tableNo || order.tableId,
      items: order.items.map(item => ({
        ...item,
        status: 'pending',
        stationId: this.assignToStation(item),
        startTime: null,
        endTime: null,
        priority: item.priority || 0,
        notes: item.notes || []
      })),
      priority: order.priority || 0,
      status: 'new',
      createdAt: new Date(),
      estimatedTime: this.calculateEstimatedTime(order),
      customerName: order.customerName || '顾客'
    };

    this.orders.set(orderItem.id, orderItem);
    this.orderQueue.push(orderItem.id);
    this.notifyKDS(orderItem);
    this.notifyWebSocketClients(orderItem);
    
    return { success: true, order: orderItem };
  }

  assignToStation(item) {
    const stations = Array.from(this.kds.values());
    if (stations.length === 0) return 'main';
    
    const station = stations.find(s => s.type === item.stationType) || stations[0];
    return station.id;
  }

  calculateEstimatedTime(order) {
    const baseTime = 10;
    const itemTime = order.items.length * 3;
    return baseTime + itemTime;
  }

  updateOrderItemStatus(orderId, itemId, newStatus, stationId) {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, error: '订单不存在' };
    }

    const item = order.items.find(i => i.id === itemId);
    if (!item) {
      return { success: false, error: '菜品不存在' };
    }

    const now = new Date();
    if (newStatus === 'cooking' && !item.startTime) {
      item.startTime = now;
    } else if (newStatus === 'completed' && item.startTime) {
      item.endTime = now;
      const cookingTime = (item.endTime - item.startTime) / 60000;
      this.updateAverageCookingTime(item.name, cookingTime);
    }

    item.status = newStatus;
    order.status = this.calculateOrderStatus(order);
    
    if (newStatus === 'completed') {
      this.notifyCompletion(order);
    }

    this.notifyKDS(order);
    this.notifyWebSocketClients({ type: 'update', order });

    return { success: true, order };
  }

  updateAverageCookingTime(itemName, time) {
    if (!this.averageCookingTime.has(itemName)) {
      this.averageCookingTime.set(itemName, { total: 0, count: 0 });
    }
    const stats = this.averageCookingTime.get(itemName);
    stats.total += time;
    stats.count += 1;
  }

  calculateOrderStatus(order) {
    const statuses = order.items.map(i => i.status);
    if (statuses.every(s => s === 'completed')) return 'completed';
    if (statuses.some(s => s === 'cooking')) return 'cooking';
    if (statuses.some(s => s === 'ready')) return 'ready';
    return 'pending';
  }

  notifyCompletion(order) {
    const completedOrder = {
      ...order,
      status: 'completed',
      completedAt: new Date()
    };
    this.completedOrders.push(completedOrder);
    
    const index = this.orderQueue.indexOf(order.id);
    if (index > -1) {
      this.orderQueue.splice(index, 1);
    }
  }

  notifyKDS(order) {
    for (const [stationId, station] of this.kds.entries()) {
      const stationItems = order.items.filter(item => item.stationId === stationId);
      if (stationItems.length > 0) {
        station.orders = station.orders.filter(o => o.id !== order.id);
        if (order.status !== 'completed') {
          station.orders.push({ ...order, items: stationItems });
        }
      }
    }
  }

  notifyWebSocketClients(data) {
    const message = JSON.stringify({
      type: 'kds_update',
      data,
      timestamp: new Date().toISOString()
    });
    
    for (const client of this.wsClients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  registerWebSocketClient(ws) {
    this.wsClients.add(ws);
    ws.on('close', () => {
      this.wsClients.delete(ws);
    });
    return { success: true };
  }

  getOrder(orderId) {
    return this.orders.get(orderId);
  }

  getAllActiveOrders() {
    return Array.from(this.orders.values())
      .filter(order => order.status !== 'completed')
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
  }

  getStationOrders(stationId) {
    const station = this.kds.get(stationId);
    if (!station) return [];

    return Array.from(this.orders.values())
      .filter(order => order.items.some(item => item.stationId === stationId && item.status !== 'completed'))
      .map(order => ({
        ...order,
        items: order.items.filter(item => item.stationId === stationId)
      }))
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
  }

  getOrderStatistics() {
    const activeOrders = this.getAllActiveOrders();
    const totalOrders = this.orders.size;
    const completedToday = this.completedOrders.filter(
      o => new Date(o.completedAt).toDateString() === new Date().toDateString()
    ).length;

    const statusCounts = {
      pending: 0,
      cooking: 0,
      ready: 0,
      completed: 0
    };

    for (const order of this.orders.values()) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    }

    const avgCookingTimes = {};
    for (const [itemName, stats] of this.averageCookingTime.entries()) {
      avgCookingTimes[itemName] = (stats.total / stats.count).toFixed(1) + '分钟';
    }

    return {
      totalOrders,
      activeOrders: activeOrders.length,
      completedToday,
      statusCounts,
      averageCookingTimes: avgCookingTimes,
      stations: Array.from(this.kds.values()).map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        activeOrders: s.orders.length
      }))
    };
  }

  predictOrderVolume(hour) {
    const historicalData = {
      10: 5, 11: 12, 12: 25, 13: 18, 14: 8, 15: 5, 16: 6, 17: 10, 18: 22, 19: 20, 20: 12, 21: 5
    };
    
    const baseVolume = historicalData[hour] || 10;
    const dayOfWeek = new Date().getDay();
    let multiplier = 1;
    
    if (dayOfWeek === 5 || dayOfWeek === 6) multiplier = 1.3;
    if (dayOfWeek === 0) multiplier = 0.8;
    
    return {
      hour,
      predictedOrders: Math.round(baseVolume * multiplier),
      confidence: 0.75,
      peakHours: hour >= 11 && hour <= 13 || hour >= 17 && hour <= 20
    };
  }

  getKDSDashboard() {
    return {
      stations: Array.from(this.kds.values()).map(station => ({
        ...station,
        orders: this.getStationOrders(station.id)
      })),
      statistics: this.getOrderStatistics(),
      recentCompleted: this.completedOrders.slice(-10),
      predictions: Array.from({ length: 12 }, (_, i) => i + 10)
        .map(hour => this.predictOrderVolume(hour))
    };
  }

  bumpOrder(orderId, itemIds) {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, error: '订单不存在' };
    }

    const items = itemIds ? order.items.filter(i => itemIds.includes(i.id)) : order.items;
    
    for (const item of items) {
      const nextStatus = this.getNextStatus(item.status);
      if (nextStatus) {
        item.status = nextStatus;
        
        if (nextStatus === 'cooking' && !item.startTime) {
          item.startTime = new Date();
        } else if (nextStatus === 'completed' && item.startTime) {
          item.endTime = new Date();
          this.updateAverageCookingTime(item.name, 
            (item.endTime - item.startTime) / 60000);
        }
      }
    }

    order.status = this.calculateOrderStatus(order);
    this.notifyKDS(order);
    this.notifyWebSocketClients({ type: 'bump', order });

    if (order.status === 'completed') {
      this.notifyCompletion(order);
    }

    return { success: true, order };
  }

  getNextStatus(currentStatus) {
    const flow = ['pending', 'cooking', 'ready', 'completed'];
    const index = flow.indexOf(currentStatus);
    return index >= 0 && index < flow.length - 1 ? flow[index + 1] : null;
  }

  recallOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, error: '订单不存在' };
    }

    if (order.status !== 'completed') {
      return { success: false, error: '只能召回已完成的订单' };
    }

    for (const item of order.items) {
      if (item.status === 'completed') {
        item.status = 'ready';
      }
    }

    order.status = 'ready';
    this.orderQueue.push(order.id);
    
    const index = this.completedOrders.findIndex(o => o.id === orderId);
    if (index > -1) {
      this.completedOrders.splice(index, 1);
    }

    this.notifyKDS(order);
    this.notifyWebSocketClients({ type: 'recall', order });

    return { success: true, order };
  }
}

module.exports = KitchenDisplayService;
