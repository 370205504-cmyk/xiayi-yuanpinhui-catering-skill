/**
 * 打印服务 v5.0.1
 * 支持顾客小票、厨房打印、报表打印
 * 基于 SimpleCateringPOS 小票打印设计
 */

const QRCode = require('qrcode');
const path = require('path');

class PrintService {
  constructor() {
    this.printerConfig = {
      customer: {
        width: 58, // 58mm小票纸
        charset: 'gb2312'
      },
      kitchen: {
        width: 80, // 80mm厨房纸
        charset: 'gb2312'
      }
    };
  }

  /**
   * 生成顾客小票内容
   */
  async generateCustomerReceipt(order, storeInfo) {
    const receipt = {
      header: {
        storeName: storeInfo?.name || '雨姗AI餐厅',
        storeAddress: storeInfo?.address || '',
        storePhone: storeInfo?.phone || ''
      },
      orderInfo: {
        orderNo: order.order_number,
        orderDate: order.created_at,
        tableNo: order.table_id ? `桌台 ${order.table_id}` : '外卖',
        cashier: order.cashier || '系统'
      },
      items: order.items || [],
      summary: {
        subtotal: order.total_amount,
        discount: order.discount || 0,
        total: order.total_amount - (order.discount || 0)
      },
      payment: {
        method: order.payment_method || '现金',
        amount: order.paid_amount || order.total_amount,
        change: order.change || 0
      },
      footer: {
        message: '谢谢惠顾，欢迎下次光临！',
        qrcode: null
      }
    };

    // 生成二维码（可选）
    if (order.qrcode_data) {
      receipt.footer.qrcode = await QRCode.toDataURL(order.qrcode_data);
    }

    return receipt;
  }

  /**
   * 生成厨房小票内容
   */
  async generateKitchenTicket(order, options = {}) {
    const ticket = {
      header: {
        orderNo: order.order_number,
        priority: options.priority || 'normal',
        time: new Date().toLocaleTimeString('zh-CN'),
        tableNo: order.table_id ? `桌台 ${order.table_id}` : '外卖'
      },
      items: (order.items || []).map(item => ({
        name: item.dish_name,
        quantity: item.quantity,
        notes: item.remarks || '',
        done: false
      })),
      specialNotes: order.remarks || '',
      footer: {
        cashier: order.cashier || '系统'
      }
    };

    return ticket;
  }

  /**
   * 格式化顾客小票文本
   */
  formatReceiptText(receipt) {
    const { header, orderInfo, items, summary, payment, footer } = receipt;
    const width = this.printerConfig.customer.width;
    
    let text = '';
    
    // 头部
    text += this.centerText(header.storeName, width) + '\n';
    if (header.storeAddress) text += this.centerText(header.storeAddress, width) + '\n';
    if (header.storePhone) text += this.centerText(header.storePhone, width) + '\n';
    text += this.divider(width) + '\n';
    
    // 订单信息
    text += `单号: ${orderInfo.orderNo}\n`;
    text += `时间: ${orderInfo.orderDate}\n`;
    text += `${orderInfo.tableNo}\n`;
    text += this.divider(width) + '\n';
    
    // 商品明细
    text += '商品明细\n';
    text += this.divider(width) + '\n';
    
    items.forEach(item => {
      const name = item.dish_name;
      const qty = `${item.quantity}x`;
      const price = `¥${item.subtotal.toFixed(2)}`;
      text += `${qty} ${name}\n`;
      if (item.remarks) {
        text += `  备注: ${item.remarks}\n`;
      }
    });
    
    text += this.divider(width) + '\n';
    
    // 金额汇总
    text += this.rightAlign(`小计: ¥${summary.subtotal.toFixed(2)}`, width) + '\n';
    if (summary.discount > 0) {
      text += this.rightAlign(`折扣: -¥${summary.discount.toFixed(2)}`, width) + '\n';
    }
    text += this.divider(width) + '\n';
    text += this.rightAlign(`合计: ¥${summary.total.toFixed(2)}`, width) + '\n';
    text += this.divider(width) + '\n';
    
    // 支付信息
    text += `支付方式: ${payment.method}\n`;
    text += `实收: ¥${payment.amount.toFixed(2)}\n`;
    if (payment.change > 0) {
      text += `找零: ¥${payment.change.toFixed(2)}\n`;
    }
    text += this.divider(width) + '\n';
    
    // 底部
    text += this.centerText(footer.message, width) + '\n';
    
    return text;
  }

  /**
   * 格式化厨房小票文本
   */
  formatKitchenText(ticket) {
    const width = this.printerConfig.kitchen.width;
    const { header, items, specialNotes, footer } = ticket;
    
    let text = '';
    
    // 紧急标记
    if (header.priority === 'urgent') {
      text += '!!!!紧急!!!!\n';
    }
    
    // 头部
    text += this.divider(width, '=') + '\n';
    text += this.centerText(`【厨房单】`, width) + '\n';
    text += this.divider(width, '=') + '\n';
    text += `桌台: ${header.tableNo}\n`;
    text += `单号: ${header.orderNo}\n`;
    text += `时间: ${header.time}\n`;
    text += this.divider(width, '-') + '\n';
    
    // 商品
    items.forEach((item, index) => {
      text += `[${index + 1}] ${item.name} x${item.quantity}\n`;
      if (item.notes) {
        text += `    备注: ${item.notes}\n`;
      }
    });
    
    // 特殊要求
    if (specialNotes) {
      text += this.divider(width, '-') + '\n';
      text += `特殊要求: ${specialNotes}\n`;
    }
    
    text += this.divider(width, '=') + '\n';
    text += `收款员: ${footer.cashier}\n`;
    text += '\n\n\n'; // 留白
    
    return text;
  }

  /**
   * 生成HTML小票模板
   */
  generateReceiptHTML(receipt) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Courier New', monospace;
      width: 300px;
      margin: 0 auto;
      padding: 20px;
    }
    .header { text-align: center; margin-bottom: 20px; }
    .divider { border-top: 1px dashed #000; margin: 10px 0; }
    .item { margin: 5px 0; }
    .total { font-weight: bold; margin-top: 10px; }
    .footer { text-align: center; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>${receipt.header.storeName}</h2>
    <p>${receipt.header.storeAddress}</p>
    <p>${receipt.header.storePhone}</p>
  </div>
  
  <div class="divider"></div>
  
  <p>单号: ${receipt.orderInfo.orderNo}</p>
  <p>时间: ${receipt.orderInfo.orderDate}</p>
  <p>${receipt.orderInfo.tableNo}</p>
  
  <div class="divider"></div>
  
  ${receipt.items.map(item => `
    <div class="item">
      <strong>${item.dish_name}</strong> x${item.quantity}
      <span style="float:right">¥${item.subtotal.toFixed(2)}</span>
    </div>
  `).join('')}
  
  <div class="divider"></div>
  
  <p class="total">
    合计: ¥${receipt.summary.total.toFixed(2)}
  </p>
  
  <div class="divider"></div>
  
  <p>支付方式: ${receipt.payment.method}</p>
  <p>实收: ¥${receipt.payment.amount.toFixed(2)}</p>
  
  <div class="footer">
    <p>${receipt.footer.message}</p>
  </div>
</body>
</html>
    `.trim();
  }

  // 辅助方法
  centerText(text, width) {
    const padding = Math.max(0, Math.floor((width - this.strlen(text)) / 2));
    return ' '.repeat(padding) + text;
  }

  rightAlign(text, width) {
    const padding = Math.max(0, width - this.strlen(text));
    return ' '.repeat(padding) + text;
  }

  divider(width, char = '-') {
    return char.repeat(width);
  }

  strlen(text) {
    return text.replace(/[^\x00-\xff]/g, 'xx').length;
  }

  /**
   * 打印预览
   */
  async preview(orderId, type = 'customer') {
    // TODO: 从数据库获取订单信息
    const order = await this.getOrderById(orderId);
    const storeInfo = await this.getStoreInfo();
    
    if (type === 'customer') {
      const receipt = await this.generateCustomerReceipt(order, storeInfo);
      return {
        type: 'customer',
        text: this.formatReceiptText(receipt),
        html: this.generateReceiptHTML(receipt)
      };
    } else {
      const ticket = await this.generateKitchenTicket(order);
      return {
        type: 'kitchen',
        text: this.formatKitchenText(ticket)
      };
    }
  }

  /**
   * 获取订单（占位方法，需要集成到数据库）
   */
  async getOrderById(orderId) {
    return {
      order_number: `ORD${Date.now()}`,
      created_at: new Date().toISOString(),
      table_id: 1,
      items: [
        { dish_name: '宫保鸡丁', quantity: 1, subtotal: 28.00, remarks: '' }
      ],
      total_amount: 28.00,
      discount: 0,
      payment_method: '微信支付',
      paid_amount: 30.00,
      change: 2.00
    };
  }

  /**
   * 获取店铺信息（占位方法）
   */
  async getStoreInfo() {
    return {
      name: '雨姗AI餐厅',
      address: '美食街88号',
      phone: '400-888-8888'
    };
  }
}

module.exports = PrintService;
