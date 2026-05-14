/**
 * 打印旁路兜底适配器
 * 监听网口/串口打印机，小票逆向解析，虚拟打印入单
 */
const BaseAdapter = require('./base-adapter');
const TicketParser = require('../services/ticket-parser');

class PrinterAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.printers = config.printers || [];
    this.listener = null;
    this.parser = new TicketParser();
    this.capturedTickets = [];
  }

  async connect() {
    try {
      console.log('🖨️  启动打印旁路监听...');
      console.log(`   监听端口: ${this.config.port || 9100}`);
      
      this.connected = true;
      this.startListening();
      return true;
    } catch (e) {
      console.error('❌ 打印监听启动失败:', e);
      return false;
    }
  }

  /**
   * 开始监听打印机
   */
  startListening() {
    console.log('📡 正在监听打印机数据...');
    // 模拟：每隔一段时间捕获一个小票
    this.listener = setInterval(() => {
      if (Math.random() > 0.7) { // 30% 概率模拟捕获小票
        this.simulateCapture();
      }
    }, 10000);
  }

  /**
   * 模拟捕获小票（演示用）
   */
  simulateCapture() {
    const sampleTicket = `
    雨姗AI收银助手
    订单号：YS${Date.now()}
    时间：${new Date().toLocaleString()}
    ---------------------------------
    名称        数量    金额
    宫保鸡丁    1       28
    鱼香肉丝    1       26
    ---------------------------------
    总计：54
    `;
    this.captureTicket(sampleTicket);
  }

  /**
   * 捕获并解析小票
   */
  captureTicket(rawText) {
    console.log('📄 捕获到新小票');
    const parsed = this.parser.parse(rawText);
    this.capturedTickets.push(parsed);
    console.log('✅ 小票解析:', parsed);
    return parsed;
  }

  async getDishes() {
    return []; // 打印适配器不直接提供菜品，通过小票捕获
  }

  async getInventory() {
    return [];
  }

  async getMembers() {
    return [];
  }

  async createOrder(orderData) {
    console.log('📝 虚拟打印入单:', orderData.orderNo);
    // 模拟：打印一个虚拟的小票
    return {
      ...orderData,
      externalId: `printer-order-${Date.now()}`,
      printed: true
    };
  }

  async updateOrderStatus(orderId, status) {
    return true;
  }

  async syncPaymentStatus(orderId) {
    return { orderId, paid: true };
  }

  /**
   * 获取最近捕获的小票
   */
  getCapturedTickets() {
    return this.capturedTickets;
  }

  static async detect(env) {
    return env.printers?.length > 0;
  }

  static getConfigSchema() {
    return [
      { name: 'listenPort', type: 'number', label: '监听端口', default: 9100 },
      { name: 'printerType', type: 'select', label: '打印机类型', options: ['network', 'serial', 'usb'] }
    ];
  }
}

module.exports = PrinterAdapter;
