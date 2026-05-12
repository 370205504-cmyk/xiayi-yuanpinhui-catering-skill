const logger = require('./logger');

class DataSanitizer {
  static sanitizePhone(phone) {
    if (!phone || typeof phone !== 'string') return phone;
    if (phone.length >= 11) {
      return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    }
    return phone;
  }

  static sanitizeIdCard(idCard) {
    if (!idCard || typeof idCard !== 'string') return idCard;
    if (idCard.length >= 15) {
      return idCard.replace(/(\d{4})\d+(\d{4})/, '$1**********$2');
    }
    return idCard;
  }

  static sanitizeEmail(email) {
    if (!email || typeof email !== 'string') return email;
    const parts = email.split('@');
    if (parts.length === 2) {
      const name = parts[0];
      const domain = parts[1];
      const sanitizedName = name.length > 2 
        ? name[0] + '*'.repeat(name.length - 2) + name[name.length - 1]
        : name;
      return `${sanitizedName}@${domain}`;
    }
    return email;
  }

  static sanitizeAmount(amount) {
    const num = parseFloat(amount);
    if (isNaN(num) || num < 0) {
      return 0;
    }
    return Math.round(num * 100) / 100;
  }

  static sanitizeOrderId(orderNo) {
    if (!orderNo || typeof orderNo !== 'string') return orderNo;
    return orderNo.replace(/[<>\"\'\\]/g, '');
  }

  static escapeHtml(str) {
    if (!str || typeof str !== 'string') return str;
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    return str.replace(/[&<>"'\/]/g, char => map[char]);
  }

  static sanitizeUserData(user) {
    if (!user) return null;
    const sanitized = { ...user };
    
    if (sanitized.phone) {
      sanitized.phone = this.sanitizePhone(sanitized.phone);
    }
    if (sanitized.id_card) {
      sanitized.id_card = this.sanitizeIdCard(sanitized.id_card);
    }
    if (sanitized.email) {
      sanitized.email = this.sanitizeEmail(sanitized.email);
    }
    if (sanitized.password) {
      delete sanitized.password;
    }
    if (sanitized.pay_password) {
      delete sanitized.pay_password;
    }
    
    return sanitized;
  }

  static sanitizeOrderData(order) {
    if (!order) return null;
    const sanitized = { ...order };
    
    if (sanitized.user_phone) {
      sanitized.user_phone = this.sanitizePhone(sanitized.user_phone);
    }
    if (sanitized.order_no) {
      sanitized.order_no = this.sanitizeOrderId(sanitized.order_no);
    }
    
    return sanitized;
  }

  static sanitizeMemberData(member) {
    if (!member) return null;
    const sanitized = { ...member };
    
    if (sanitized.phone) {
      sanitized.phone = this.sanitizePhone(sanitized.phone);
    }
    if (sanitized.real_name) {
      sanitized.real_name = this.escapeHtml(sanitized.real_name);
    }
    if (sanitized.password) {
      delete sanitized.password;
    }
    
    return sanitized;
  }

  static sanitizeApiResponse(data, type = 'default') {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeApiResponse(item, type));
    }

    if (typeof data === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        if (value === null || value === undefined) {
          sanitized[key] = value;
          continue;
        }
        
        if (key.includes('phone') && typeof value === 'string') {
          sanitized[key] = this.sanitizePhone(value);
        } else if (key.includes('email') && typeof value === 'string') {
          sanitized[key] = this.sanitizeEmail(value);
        } else if (key.includes('id_card') && typeof value === 'string') {
          sanitized[key] = this.sanitizeIdCard(value);
        } else if (['password', 'pay_password', 'secret', 'token', 'api_key'].includes(key.toLowerCase())) {
          sanitized[key] = '***';
        } else if (typeof value === 'string') {
          sanitized[key] = value;
        } else if (typeof value === 'object') {
          sanitized[key] = this.sanitizeApiResponse(value, type);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }

    return data;
  }

  static validateAndSanitizeInput(input, rules) {
    const sanitized = {};
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = input[field];
      
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      if (value === undefined || value === null) {
        sanitized[field] = value;
        continue;
      }

      if (rule.type === 'string') {
        const strValue = String(value).trim();
        if (rule.maxLength && strValue.length > rule.maxLength) {
          errors.push(`${field} exceeds maximum length of ${rule.maxLength}`);
        }
        if (rule.pattern && !rule.pattern.test(strValue)) {
          errors.push(`${field} format is invalid`);
        }
        sanitized[field] = strValue.substring(0, rule.maxLength || 1000);
      } else if (rule.type === 'number') {
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
          errors.push(`${field} must be a number`);
          continue;
        }
        if (rule.min !== undefined && numValue < rule.min) {
          errors.push(`${field} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && numValue > rule.max) {
          errors.push(`${field} must be at most ${rule.max}`);
        }
        sanitized[field] = numValue;
      } else if (rule.type === 'array') {
        if (!Array.isArray(value)) {
          errors.push(`${field} must be an array`);
          continue;
        }
        sanitized[field] = value;
      }
    }

    return { sanitized, errors };
  }

  static logSensitiveOperation(operation, userId, details = {}) {
    const safeDetails = this.sanitizeApiResponse(details);
    logger.info('Sensitive operation', {
      operation,
      userId,
      timestamp: new Date().toISOString(),
      details: safeDetails
    });
  }
}

module.exports = DataSanitizer;
