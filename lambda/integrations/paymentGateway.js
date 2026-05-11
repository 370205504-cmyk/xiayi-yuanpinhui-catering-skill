class PaymentGateway {
  constructor() {
    this.config = require('../config.json');
    this.pendingPayments = new Map();
  }

  async createPayment(order) {
    const paymentId = `PAY${Date.now()}${Math.random().toString(36).substr(2, 9)}`;
    
    const payment = {
      paymentId,
      orderId: order.orderId,
      amount: order.totalAmount,
      status: 'pending',
      methods: this.config.payment?.methods || ['wechat', 'alipay'],
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    };

    this.pendingPayments.set(paymentId, payment);

    return {
      paymentId,
      qrcodeUrl: this.generateQRCode(payment),
      paymentUrl: `https://pay.example.com/${paymentId}`,
      amount: order.totalAmount,
      expiresAt: payment.expiresAt
    };
  }

  generateQRCode(payment) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PAY:${payment.paymentId}:${payment.amount}`;
  }

  async queryPayment(paymentId) {
    return this.pendingPayments.get(paymentId) || null;
  }

  async confirmPayment(paymentId, transactionId) {
    const payment = this.pendingPayments.get(paymentId);
    
    if (!payment) {
      throw new Error('支付不存在');
    }

    if (new Date() > new Date(payment.expiresAt)) {
      payment.status = 'expired';
      throw new Error('支付已过期');
    }

    payment.status = 'paid';
    payment.transactionId = transactionId;
    payment.paidAt = new Date().toISOString();

    return payment;
  }

  async refundPayment(paymentId, reason) {
    const payment = this.pendingPayments.get(paymentId);
    
    if (!payment) {
      throw new Error('支付不存在');
    }

    if (payment.status !== 'paid') {
      throw new Error('只能退款已支付的订单');
    }

    payment.status = 'refunded';
    payment.refundedAt = new Date().toISOString();
    payment.refundReason = reason;

    return payment;
  }
}

module.exports = new PaymentGateway();
