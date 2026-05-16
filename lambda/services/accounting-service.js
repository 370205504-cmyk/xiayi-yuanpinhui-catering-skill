/**
 * 对账服务 v5.0.1
 * 完整的收银对账、报表统计功能
 * 基于 SimpleCateringPOS 设计
 */

const db = require('../database/db');

class AccountingService {
  constructor() {
    this.paymentMethods = {
      'cash': '现金',
      'wechat': '微信支付',
      'alipay': '支付宝',
      'card': '银行卡',
      'member': '会员卡',
      'coupon': '优惠券'
    };
  }

  /**
   * 日结报表
   */
  async dailyReport(date) {
    const startOfDay = `${date} 00:00:00`;
    const endOfDay = `${date} 23:59:59`;

    const orders = await db.query(`
      SELECT 
        COUNT(*) as totalOrders,
        SUM(total_amount) as totalAmount,
        AVG(total_amount) as avgAmount,
        status
      FROM orders 
      WHERE created_at BETWEEN ? AND ?
      GROUP BY status
    `, [startOfDay, endOfDay]);

    const paymentBreakdown = await db.query(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total
      FROM payments
      WHERE created_at BETWEEN ? AND ?
      GROUP BY payment_method
    `, [startOfDay, endOfDay]);

    const dishesSold = await db.query(`
      SELECT 
        oi.dish_name,
        SUM(oi.quantity) as quantity,
        SUM(oi.subtotal) as total
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.created_at BETWEEN ? AND ?
      GROUP BY oi.dish_name
      ORDER BY quantity DESC
      LIMIT 10
    `, [startOfDay, endOfDay]);

    return {
      success: true,
      date,
      summary: this.calculateSummary(orders),
      paymentBreakdown: this.formatPaymentBreakdown(paymentBreakdown),
      topDishes: dishesSold
    };
  }

  /**
   * 月度报表
   */
  async monthlyReport(year, month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const dailyStats = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders,
        SUM(total_amount) as revenue
      FROM orders
      WHERE created_at BETWEEN ? AND ?
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [`${startDate} 00:00:00`, `${endDate} 23:59:59`]);

    const monthlyTotal = await db.query(`
      SELECT 
        COUNT(*) as totalOrders,
        SUM(total_amount) as totalRevenue,
        AVG(total_amount) as avgOrderValue
      FROM orders
      WHERE created_at BETWEEN ? AND ?
    `, [`${startDate} 00:00:00`, `${endDate} 23:59:59`]);

    const categoryStats = await db.query(`
      SELECT 
        c.name as category,
        COUNT(oi.id) as itemsSold,
        SUM(oi.subtotal) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN dishes d ON oi.dish_id = d.id
      JOIN categories c ON d.category_id = c.id
      WHERE o.created_at BETWEEN ? AND ?
      GROUP BY c.name
      ORDER BY revenue DESC
    `, [`${startDate} 00:00:00`, `${endDate} 23:59:59`]);

    return {
      success: true,
      year,
      month,
      dailyStats,
      summary: monthlyTotal[0],
      categoryStats
    };
  }

  /**
   * 收银员日报
   */
  async cashierReport(date, cashierId) {
    const startOfDay = `${date} 00:00:00`;
    const endOfDay = `${date} 23:59:59`;

    const whereClause = cashierId ? 'AND cashier_id = ?' : '';
    const params = cashierId ? [startOfDay, endOfDay, cashierId] : [startOfDay, endOfDay];

    const orders = await db.query(`
      SELECT 
        cashier_id,
        COUNT(*) as orderCount,
        SUM(total_amount) as totalAmount
      FROM orders
      WHERE created_at BETWEEN ? AND ? ${whereClause}
      GROUP BY cashier_id
    `, params);

    return {
      success: true,
      date,
      cashierId,
      orders,
      totalAmount: orders.reduce((sum, o) => sum + o.totalAmount, 0)
    };
  }

  /**
   * 支付方式统计
   */
  async paymentStatistics(date) {
    const startOfDay = `${date} 00:00:00`;
    const endOfDay = `${date} 23:59:59`;

    const stats = await db.query(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as avg
      FROM payments
      WHERE created_at BETWEEN ? AND ?
      GROUP BY payment_method
    `, [startOfDay, endOfDay]);

    return {
      success: true,
      date,
      statistics: this.formatPaymentBreakdown(stats),
      totalAmount: stats.reduce((sum, s) => sum + s.total, 0)
    };
  }

  /**
   * 对账差异检测
   */
  async reconciliation(date) {
    const startOfDay = `${date} 00:00:00`;
    const endOfDay = `${date} 23:59:59`;

    const orderTotal = await db.query(`
      SELECT SUM(total_amount) as total FROM orders
      WHERE created_at BETWEEN ? AND ?
    `, [startOfDay, endOfDay]);

    const paymentTotal = await db.query(`
      SELECT SUM(amount) as total FROM payments
      WHERE created_at BETWEEN ? AND ?
    `, [startOfDay, endOfDay]);

    const difference = (orderTotal[0]?.total || 0) - (paymentTotal[0]?.total || 0);

    return {
      success: true,
      date,
      orderTotal: orderTotal[0]?.total || 0,
      paymentTotal: paymentTotal[0]?.total || 0,
      difference,
      status: Math.abs(difference) < 0.01 ? 'balanced' : 'discrepancy'
    };
  }

  /**
   * 计算汇总
   */
  calculateSummary(orders) {
    const summary = {
      totalOrders: 0,
      totalAmount: 0,
      avgAmount: 0,
      completedOrders: 0,
      completedAmount: 0,
      cancelledOrders: 0,
      cancelledAmount: 0
    };

    orders.forEach(order => {
      summary.totalOrders += order.totalOrders;
      summary.totalAmount += order.totalAmount;
      if (order.status === 'completed') {
        summary.completedOrders += order.totalOrders;
        summary.completedAmount += order.totalAmount;
      } else if (order.status === 'cancelled') {
        summary.cancelledOrders += order.totalOrders;
        summary.cancelledAmount += order.totalAmount;
      }
    });

    summary.avgAmount = summary.totalOrders > 0 
      ? summary.totalAmount / summary.totalOrders 
      : 0;

    return summary;
  }

  /**
   * 格式化支付方式统计
   */
  formatPaymentBreakdown(stats) {
    return stats.map(stat => ({
      method: stat.payment_method,
      methodName: this.paymentMethods[stat.payment_method] || stat.payment_method,
      count: stat.count,
      total: stat.total,
      avg: stat.avg
    }));
  }

  /**
   * 导出日报
   */
  async exportDailyReport(date) {
    const report = await this.dailyReport(date);
    
    return {
      title: `雨姗AI收银助手 - 日报表 (${date})`,
      generatedAt: new Date().toISOString(),
      ...report
    };
  }

  /**
   * 导出月报
   */
  async exportMonthlyReport(year, month) {
    const report = await this.monthlyReport(year, month);
    
    return {
      title: `雨姗AI收银助手 - 月报表 (${year}-${month})`,
      generatedAt: new Date().toISOString(),
      ...report
    };
  }
}

module.exports = AccountingService;
