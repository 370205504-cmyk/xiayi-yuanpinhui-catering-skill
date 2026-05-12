const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.File({ filename: 'logs/auth.log' })]
});

class AuthService {
  async register(phone, password, nickname = '') {
    try {
      const existing = await db.query('SELECT id FROM users WHERE phone = ?', [phone]);
      if (existing.length > 0) {
        return { success: false, message: '该手机号已注册' };
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const result = await db.query(
        'INSERT INTO users (phone, password_hash, nickname) VALUES (?, ?, ?)',
        [phone, passwordHash, nickname || `用户${phone.slice(-4)}`]
      );

      const token = this.generateToken(result.insertId);
      await this.addPoints(result.insertId, 100, '注册奖励');

      logger.info(`用户注册成功: ${phone}`);
      return {
        success: true,
        message: '注册成功',
        userId: result.insertId,
        token
      };
    } catch (error) {
      logger.error('注册失败:', error);
      throw error;
    }
  }

  async login(phone, password) {
    try {
      const users = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
      if (users.length === 0) {
        return { success: false, message: '用户不存在' };
      }

      const user = users[0];
      if (user.status === 'banned') {
        return { success: false, message: '账号已被禁用' };
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return { success: false, message: '密码错误' };
      }

      const token = this.generateToken(user.id);
      logger.info(`用户登录: ${phone}`);

      return {
        success: true,
        message: '登录成功',
        token,
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      logger.error('登录失败:', error);
      throw error;
    }
  }

  async wechatLogin(openid, nickname = '', avatar = '') {
    try {
      let users = await db.query('SELECT * FROM users WHERE wechat_openid = ?', [openid]);

      if (users.length === 0) {
        const result = await db.query(
          'INSERT INTO users (wechat_openid, nickname, avatar) VALUES (?, ?, ?)',
          [openid, nickname || '微信用户', avatar]
        );
        await this.addPoints(result.insertId, 100, '注册奖励');
        users = await db.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
      }

      const user = users[0];
      const token = this.generateToken(user.id);
      logger.info(`微信登录: ${openid}`);

      return {
        success: true,
        message: '登录成功',
        token,
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      logger.error('微信登录失败:', error);
      throw error;
    }
  }

  async getUserInfo(userId) {
    const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return { success: false, message: '用户不存在' };
    }
    return { success: true, user: this.sanitizeUser(users[0]) };
  }

  async updateUser(userId, data) {
    const allowedFields = ['nickname', 'avatar', 'contact_phone', 'address'];
    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (updates.length === 0) {
      return { success: false, message: '没有可更新的字段' };
    }

    values.push(userId);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    return { success: true, message: '更新成功' };
  }

  async changePassword(userId, oldPassword, newPassword) {
    const users = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return { success: false, message: '用户不存在' };
    }

    const validPassword = await bcrypt.compare(oldPassword, users[0].password_hash);
    if (!validPassword) {
      return { success: false, message: '原密码错误' };
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
    return { success: true, message: '密码修改成功' };
  }

  async addPoints(userId, points, description = '') {
    await db.transaction(async (connection) => {
      await connection.query('UPDATE users SET points = points + ? WHERE id = ?', [points, userId]);
      const [users] = await connection.query('SELECT points FROM users WHERE id = ?', [userId]);
      await connection.query(
        'INSERT INTO points_log (user_id, type, points, balance, description) VALUES (?, ?, ?, ?, ?)',
        [userId, 'earn', points, users[0].points, description]
      );
    });
  }

  async getPointsHistory(userId, page = 1, pageSize = 20) {
    const offset = (page - 1) * pageSize;
    const logs = await db.query(
      'SELECT * FROM points_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, pageSize, offset]
    );
    const [{ total }] = await db.query('SELECT COUNT(*) as total FROM points_log WHERE user_id = ?', [userId]);
    return { success: true, logs, total, page, pageSize };
  }

  generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'default-secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    } catch (error) {
      return null;
    }
  }

  sanitizeUser(user) {
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = new AuthService();
