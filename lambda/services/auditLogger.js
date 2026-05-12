const db = require('../database/db');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

class AuditLogger {
  static async log(action, userId, details = {}, ip = null, userAgent = null) {
    const auditData = {
      id: uuidv4(),
      action,
      user_id: userId,
      details: this.sanitizeDetails(details),
      ip_address: ip,
      user_agent: userAgent,
      created_at: new Date()
    };

    try {
      await db.query(
        `INSERT INTO audit_logs 
        (id, action, user_id, details, ip_address, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          auditData.id,
          auditData.action,
          auditData.user_id,
          JSON.stringify(auditData.details),
          auditData.ip_address,
          auditData.user_agent,
          auditData.created_at
        ]
      );
      return auditData.id;
    } catch (error) {
      logger.error('Failed to write audit log:', error);
      return null;
    }
  }

  static sanitizeDetails(details) {
    const sanitized = { ...details };
    const sensitiveFields = ['password', 'new_password', 'old_password', 'api_key', 'secret', 'token', 'pay_password'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    return sanitized;
  }

  static async logOrderCreate(userId, orderNo, details, ip, userAgent) {
    return this.log('ORDER_CREATE', userId, { orderNo, ...details }, ip, userAgent);
  }

  static async logOrderCancel(userId, orderNo, reason, ip, userAgent) {
    return this.log('ORDER_CANCEL', userId, { orderNo, reason }, ip, userAgent);
  }

  static async logPayment(userId, orderNo, amount, status, ip, userAgent) {
    return this.log('PAYMENT', userId, { orderNo, amount, status }, ip, userAgent);
  }

  static async logRefund(userId, orderNo, amount, reason, ip, userAgent) {
    return this.log('REFUND', userId, { orderNo, amount, reason }, ip, userAgent);
  }

  static async logLogin(userId, ip, userAgent, success = true) {
    return this.log('LOGIN', userId, { success }, ip, userAgent);
  }

  static async logLogout(userId, ip, userAgent) {
    return this.log('LOGOUT', userId, {}, ip, userAgent);
  }

  static async logPasswordChange(userId, ip, userAgent) {
    return this.log('PASSWORD_CHANGE', userId, {}, ip, userAgent);
  }

  static async logAdminAction(userId, action, targetType, targetId, changes, ip, userAgent) {
    return this.log('ADMIN_ACTION', userId, { action, targetType, targetId, changes }, ip, userAgent);
  }

  static async getLogsByUser(userId, startDate, endDate, limit = 100) {
    try {
      let sql = 'SELECT * FROM audit_logs WHERE user_id = ?';
      const params = [userId];

      if (startDate) {
        sql += ' AND created_at >= ?';
        params.push(startDate);
      }
      if (endDate) {
        sql += ' AND created_at <= ?';
        params.push(endDate);
      }

      sql += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const logs = await db.query(sql, params);
      return logs.map(log => ({
        ...log,
        details: JSON.parse(log.details || '{}')
      }));
    } catch (error) {
      logger.error('Failed to get audit logs:', error);
      return [];
    }
  }

  static async getLogsByAction(action, startDate, endDate, limit = 100) {
    try {
      let sql = 'SELECT * FROM audit_logs WHERE action = ?';
      const params = [action];

      if (startDate) {
        sql += ' AND created_at >= ?';
        params.push(startDate);
      }
      if (endDate) {
        sql += ' AND created_at <= ?';
        params.push(endDate);
      }

      sql += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);

      const logs = await db.query(sql, params);
      return logs.map(log => ({
        ...log,
        details: JSON.parse(log.details || '{}')
      }));
    } catch (error) {
      logger.error('Failed to get audit logs:', error);
      return [];
    }
  }

  static async cleanOldLogs(daysToKeep = 180) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const result = await db.query(
        'DELETE FROM audit_logs WHERE created_at < ?',
        [cutoffDate]
      );
      
      logger.info(`Cleaned ${result.affectedRows || 0} old audit logs`);
      return result.affectedRows || 0;
    } catch (error) {
      logger.error('Failed to clean old audit logs:', error);
      return 0;
    }
  }
}

module.exports = AuditLogger;
