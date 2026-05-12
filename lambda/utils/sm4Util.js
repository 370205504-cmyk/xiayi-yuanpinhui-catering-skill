const crypto = require('crypto');
const logger = require('./logger');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

class Sm4Util {
  static getKey() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    
    if (key.length === 32) {
      return Buffer.from(key, 'hex');
    }
    
    return crypto.createHash('sha256').update(key).digest();
  }

  static encrypt(plaintext) {
    try {
      const key = this.getKey();
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    } catch (error) {
      logger.error('Encryption failed:', error);
      throw error;
    }
  }

  static decrypt(encryptedData) {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const key = this.getKey();
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Decryption failed:', error);
      throw error;
    }
  }

  static encryptPhone(phone) {
    if (!phone) return null;
    return this.encrypt(phone);
  }

  static decryptPhone(encryptedPhone) {
    if (!encryptedPhone) return null;
    try {
      return this.decrypt(encryptedPhone);
    } catch (error) {
      return null;
    }
  }

  static encryptIdCard(idCard) {
    if (!idCard) return null;
    return this.encrypt(idCard);
  }

  static decryptIdCard(encryptedIdCard) {
    if (!encryptedIdCard) return null;
    try {
      return this.decrypt(encryptedIdCard);
    } catch (error) {
      return null;
    }
  }

  static maskPhone(phone) {
    if (!phone || typeof phone !== 'string') return phone;
    if (phone.length >= 11) {
      return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
    }
    return phone;
  }

  static maskIdCard(idCard) {
    if (!idCard || typeof idCard !== 'string') return idCard;
    if (idCard.length >= 15) {
      return idCard.replace(/(\d{4})\d+(\d{4})/, '$1**********$2');
    }
    return idCard;
  }

  static hashSensitiveData(data) {
    if (!data) return null;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

module.exports = Sm4Util;
