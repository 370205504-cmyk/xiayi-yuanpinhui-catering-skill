const logger = require('../utils/logger');
const db = require('../database/db');

const LOG_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  DEBUG: 'debug'
};

const OPERATION_TYPES = {
  PAYMENT_CREATE: 'payment_create',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_REFUND: 'payment_refund',
  PAYMENT_CALLBACK: 'payment_callback',
  ORDER_CREATE: 'order_create',
  ORDER_CANCEL: 'order_cancel',
  ORDER_COMPLETE: 'order_complete',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_REGISTER: 'user_register',
  PASSWORD_CHANGE: 'password_change',
  ADMIN_ACTION: 'admin_action'
};

class PaymentLogger {
  static async log(operationType, data) {
    const logData = {
      operation_type: operationType,
      request_data: this.sanitizeData(data.requestData || {}),
      response_data: this.sanitizeData(data.responseData || {}),
      callback_data: this.sanitizeData(data.callbackData || {}),
      status: data.status || 'pending',
      error_message: data.errorMessage || null,
      error_code: data.errorCode || null,
      user_id: data.userId || null,
      order_no: data.orderNo || null,
      amount: data.amount || null,
      payment_method: data.paymentMethod || null,
      transaction_id: data.transactionId || null,
      ip_address: data.ipAddress || null,
      user_agent: data.userAgent || null,
      request_id: data.requestId || this.generateRequestId(),
      created_at: new Date()
    };

    try {
      await db.query(
        `INSERT INTO payment_logs 
        (operation_type, request_data, response_data, callback_data, status, 
         error_message, error_code, user_id, order_no, amount, payment_method,
         transaction_id, ip_address, user_agent, request_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logData.operation_type,
          JSON.stringify(logData.request_data),
          JSON.stringify(logData.response_data),
          JSON.stringify(logData.callback_data),
          logData.status,
          logData.error_message,
          logData.error_code,
          logData.user_id,
          logData.order_no,
          logData.amount,
          logData.payment_method,
          logData.transaction_id,
          logData.ip_address,
          logData.user_agent,
          logData.request_id,
          logData.created_at
        ]
      );

      logger.info(`Payment log recorded: ${operationType}`, {
        requestId: logData.request_id,
        orderNo: logData.order_no,
        status: logData.status
      });

      return logData.request_id;
    } catch (error) {
      logger.error('Failed to record payment log:', error);
      return null;
    }
  }

  static async logPaymentCreate(data) {
    return this.log(OPERATION_TYPES.PAYMENT_CREATE, {
      ...data,
      status: 'pending'
    });
  }

  static async logPaymentSuccess(data) {
    return this.log(OPERATION_TYPES.PAYMENT_SUCCESS, {
      ...data,
      status: 'success'
    });
  }

  static async logPaymentFailed(data) {
    return this.log(OPERATION_TYPES.PAYMENT_FAILED, {
      ...data,
      status: 'failed'
    });
  }

  static async logPaymentCallback(data) {
    return this.log(OPERATION_TYPES.PAYMENT_CALLBACK, {
      ...data,
      status: data.success ? 'success' : 'failed'
    });
  }

  static async logPaymentRefund(data) {
    return this.log(OPERATION_TYPES.PAYMENT_REFUND, {
      ...data,
      status: 'refunded'
    });
  }

  static async getLogsByOrderNo(orderNo, limit = 50) {
    try {
      const logs = await db.query(
        `SELECT * FROM payment_logs 
         WHERE order_no = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [orderNo, limit]
      );
      return logs.map(log => ({
        ...log,
        request_data: JSON.parse(log.request_data || '{}'),
        response_data: JSON.parse(log.response_data || '{}'),
        callback_data: JSON.parse(log.callback_data || '{}')
      }));
    } catch (error) {
      logger.error('Failed to get payment logs:', error);
      return [];
    }
  }

  static async getLogsByUserId(userId, limit = 50) {
    try {
      const logs = await db.query(
        `SELECT * FROM payment_logs 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ?`,
        [userId, limit]
      );
      return logs.map(log => ({
        ...log,
        request_data: JSON.parse(log.request_data || '{}'),
        response_data: JSON.parse(log.response_data || '{}'),
        callback_data: JSON.parse(log.callback_data || '{}')
      }));
    } catch (error) {
      logger.error('Failed to get payment logs:', error);
      return [];
    }
  }

  static async getFailedPayments(startDate, endDate) {
    try {
      const logs = await db.query(
        `SELECT * FROM payment_logs 
         WHERE status = 'failed' 
         AND created_at BETWEEN ? AND ?
         ORDER BY created_at DESC`,
        [startDate, endDate]
      );
      return logs.map(log => ({
        ...log,
        request_data: JSON.parse(log.request_data || '{}'),
        response_data: JSON.parse(log.response_data || '{}')
      }));
    } catch (error) {
      logger.error('Failed to get failed payments:', error);
      return [];
    }
  }

  static sanitizeData(data) {
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'api_key', 'secret', 'private_key', 'token'];
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***';
      }
    }
    
    return sanitized;
  }

  static generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  static async cleanOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const result = await db.query(
        'DELETE FROM payment_logs WHERE created_at < ?',
        [cutoffDate]
      );
      
      logger.info(`Cleaned ${result.affectedRows || 0} old payment logs`);
      return result.affectedRows || 0;
    } catch (error) {
      logger.error('Failed to clean old payment logs:', error);
      return 0;
    }
  }
}

module.exports = PaymentLogger;
