const fs = require('fs');
const path = require('path');

class OrderService {
  constructor() {
    this.orders = new Map();
    this.orderCounter = 1000;
    this.deliveryFee = 5; // 配送费
    this.minFreeDeliveryAmount = 50; // 满免配送费门槛
  }

  /**
   * 创建订单
   * @param {Object} orderData - 订单数据
   * @param {Object} orderData.dish - 菜品对象
   * @param {number} orderData.quantity - 数量
   * @param {string} orderData.address - 配送地址
   * @param {string} orderData.customerPhone - 客户电话
   * @param {string} orderData.storeId - 门店ID
   * @returns {Object} 订单结果
   */
  createOrder(orderData) {
    const { dish, quantity, address, customerPhone, storeId } = orderData;
    
    const orderId = this.generateOrderId();
    const subtotal = dish.price * quantity;
    const deliveryFeeFinal = subtotal >= this.minFreeDeliveryAmount ? 0 : this.deliveryFee;
    const totalPrice = subtotal + deliveryFeeFinal;

    const order = {
      orderId: orderId,
      dish: dish,
      dishName: dish.name,
      quantity: quantity,
      subtotal: subtotal,
      deliveryFee: deliveryFeeFinal,
      totalPrice: totalPrice,
      address: address,
      customerPhone: customerPhone,
      storeId: storeId,
      status: 'pending', // pending, confirmed, preparing, delivering, completed, cancelled
      createdAt: new Date().toISOString(),
      estimatedDeliveryTime: this.estimateDeliveryTime(address)
    };

    this.orders.set(orderId, order);
    this.saveOrderToDatabase(order);

    return order;
  }

  /**
   * 生成订单ID
   * @returns {string} 订单ID
   */
  generateOrderId() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const counter = String(this.orderCounter++).padStart(4, '0');
    return `XY${dateStr}${counter}`;
  }

  /**
   * 估算配送时间
   * @param {string} address - 配送地址
   * @returns {number} 预计配送时间（分钟）
   */
  estimateDeliveryTime(address) {
    // 简化逻辑：基于地址长度估算
    const baseTime = 30; // 基础配送时间
    const addressFactor = Math.min(address.length / 20, 1) * 15; // 最多增加15分钟
    return Math.round(baseTime + addressFactor);
  }

  /**
   * 获取订单
   * @param {string} orderId - 订单ID
   * @returns {Object|null} 订单对象
   */
  getOrder(orderId) {
    return this.orders.get(orderId) || null;
  }

  /**
   * 更新订单状态
   * @param {string} orderId - 订单ID
   * @param {string} newStatus - 新状态
   * @returns {Object|null} 更新后的订单
   */
  updateOrderStatus(orderId, newStatus) {
    const order = this.orders.get(orderId);
    if (!order) return null;

    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    
    this.saveOrderToDatabase(order);
    return order;
  }

  /**
   * 取消订单
   * @param {string} orderId - 订单ID
   * @returns {boolean} 是否成功
   */
  cancelOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) return false;

    // 只有待确认或已确认的订单可以取消
    if (['pending', 'confirmed'].includes(order.status)) {
      order.status = 'cancelled';
      order.cancelledAt = new Date().toISOString();
      this.saveOrderToDatabase(order);
      return true;
    }

    return false;
  }

  /**
   * 获取用户的所有订单
   * @param {string} customerPhone - 客户电话
   * @returns {Array} 订单列表
   */
  getOrdersByCustomer(customerPhone) {
    const customerOrders = [];
    this.orders.forEach(order => {
      if (order.customerPhone === customerPhone) {
        customerOrders.push(order);
      }
    });
    return customerOrders.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  /**
   * 模拟保存到数据库
   * @param {Object} order - 订单对象
   */
  saveOrderToDatabase(order) {
    // 实际应用中这里会调用 DynamoDB 或其他数据库
    console.log(`[OrderService] 保存订单 ${order.orderId} 到数据库`);
  }
}

module.exports = OrderService;
