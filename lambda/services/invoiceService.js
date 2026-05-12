const db = require('../database/db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class InvoiceService {
  async issueInvoice(orderNo, taxNumber, companyName, email) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      const [orders] = await connection.query(
        'SELECT * FROM orders WHERE order_no = ?',
        [orderNo]
      );

      if (orders.length === 0) {
        throw new Error('订单不存在');
      }

      const order = orders[0];
      
      if (order.status !== 'completed') {
        throw new Error('只有已完成的订单才能开具发票');
      }

      const [invoices] = await connection.query(
        'SELECT * FROM invoices WHERE order_no = ?',
        [orderNo]
      );

      if (invoices.length > 0) {
        throw new Error('该订单已开具发票');
      }

      const invoiceNo = `FP${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const invoiceId = uuidv4();

      await connection.query(
        'INSERT INTO invoices (id, invoice_no, order_no, tax_number, company_name, email, amount, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
        [invoiceId, invoiceNo, orderNo, taxNumber, companyName, email, order.total_amount, 'issued']
      );

      await connection.query(
        'UPDATE orders SET has_invoice = 1 WHERE order_no = ?',
        [orderNo]
      );

      await connection.commit();

      logger.info('发票开具成功', { invoiceNo, orderNo });

      return {
        success: true,
        invoiceNo,
        orderNo,
        amount: order.total_amount,
        taxNumber,
        companyName,
        email,
        status: 'issued'
      };
    } catch (error) {
      await connection.rollback();
      logger.error('发票开具失败', { error: error.message, orderNo });
      throw error;
    } finally {
      connection.release();
    }
  }

  async getInvoice(invoiceNo) {
    const [invoices] = await db.query(
      'SELECT * FROM invoices WHERE invoice_no = ?',
      [invoiceNo]
    );

    if (invoices.length === 0) {
      throw new Error('发票不存在');
    }

    return invoices[0];
  }

  async getOrderInvoices(orderNo) {
    const [invoices] = await db.query(
      'SELECT * FROM invoices WHERE order_no = ?',
      [orderNo]
    );

    return invoices;
  }
}

module.exports = new InvoiceService();