const db = require('../database/db');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.File({ filename: 'logs/vip.log' })]
});

class MemberService {
  async getMemberInfo(userId) {
    const users = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return { success: false, message: '用户不存在' };
    }

    const user = users[0];
    const levelInfo = this.getLevelInfo(user.level);
    const orderCount = await db.query('SELECT COUNT(*) as count FROM orders WHERE user_id = ? AND payment_status = ?', [userId, 'paid']);
    const totalSpent = await db.query('SELECT SUM(final_amount) as total FROM orders WHERE user_id = ? AND payment_status = ?', [userId, 'paid']);

    return {
      success: true,
      member: {
        level: user.level,
        levelName: levelInfo.name,
        points: user.points,
        balance: user.balance,
        orderCount: orderCount[0].count,
        totalSpent: totalSpent[0].total || 0,
        nextLevelPoints: levelInfo.nextLevelPoints
      }
    };
  }

  async recharge(userId, amount) {
    if (amount < 10) {
      return { success: false, message: '最低充值10元' };
    }

    await db.transaction(async (connection) => {
      await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, userId]);
      const [users] = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
      await connection.query(
        'INSERT INTO points_log (user_id, type, points, balance, description) VALUES (?, ?, ?, ?, ?)',
        [userId, 'earn', Math.floor(amount), users[0].balance, `充值赠送积分`]
      );
    });

    logger.info(`用户${userId}充值: ${amount}元`);
    return { success: true, message: '充值成功' };
  }

  async useBalance(userId, amount) {
    const users = await db.query('SELECT balance FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return { success: false, message: '用户不存在' };
    }

    if (users[0].balance < amount) {
      return { success: false, message: '余额不足' };
    }

    await db.transaction(async (connection) => {
      await connection.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, userId]);
    });

    return { success: true, message: '余额扣费成功' };
  }

  async getCoupons(userId, status = 'unused') {
    const coupons = await db.query(
      `SELECT uc.*, c.name, c.type, c.value, c.min_amount, c.end_date
       FROM user_coupons uc
       JOIN coupons c ON uc.coupon_id = c.id
       WHERE uc.user_id = ? AND uc.status = ?
       ORDER BY uc.created_at DESC`,
      [userId, status]
    );
    return { success: true, coupons };
  }

  async claimCoupon(userId, couponCode) {
    const coupons = await db.query('SELECT * FROM coupons WHERE code = ? AND status = ?', [couponCode, 'active']);
    if (coupons.length === 0) {
      return { success: false, message: '优惠券不存在或已失效' };
    }

    const coupon = coupons[0];
    if (coupon.remaining_count <= 0) {
      return { success: false, message: '优惠券已领完' };
    }

    if (new Date() < new Date(coupon.start_date) || new Date() > new Date(coupon.end_date)) {
      return { success: false, message: '优惠券不在领取时间内' };
    }

    const existing = await db.query(
      'SELECT id FROM user_coupons WHERE user_id = ? AND coupon_id = ?',
      [userId, coupon.id]
    );
    if (existing.length > 0) {
      return { success: false, message: '您已领取过该优惠券' };
    }

    await db.transaction(async (connection) => {
      await connection.query('UPDATE coupons SET remaining_count = remaining_count - 1 WHERE id = ?', [coupon.id]);
      await connection.query('INSERT INTO user_coupons (user_id, coupon_id) VALUES (?, ?)', [userId, coupon.id]);
    });

    logger.info(`用户${userId}领取优惠券: ${couponCode}`);
    return { success: true, message: '领取成功' };
  }

  async useCoupon(userId, couponId, orderId) {
    await db.transaction(async (connection) => {
      await connection.query('UPDATE user_coupons SET status = ?, used_at = NOW(), order_id = ? WHERE id = ?', ['used', orderId, couponId]);
    });
    return { success: true };
  }

  getLevelInfo(level) {
    const levels = [
      { level: 1, name: '普通会员', nextLevelPoints: 1000 },
      { level: 2, name: '银卡会员', nextLevelPoints: 5000 },
      { level: 3, name: '金卡会员', nextLevelPoints: 10000 },
      { level: 4, name: '白金会员', nextLevelPoints: 50000 },
      { level: 5, name: '钻石会员', nextLevelPoints: null }
    ];
    return levels.find(l => l.level === level) || levels[0];
  }

  async updateLevel(userId) {
    const users = await db.query('SELECT points, level FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return;

    const newLevel = this.calculateLevel(users[0].points);
    if (newLevel > users[0].level) {
      await db.query('UPDATE users SET level = ? WHERE id = ?', [newLevel, userId]);
      logger.info(`用户${userId}升级为${newLevel}级会员`);
    }
  }

  calculateLevel(points) {
    if (points >= 50000) return 5;
    if (points >= 10000) return 4;
    if (points >= 5000) return 3;
    if (points >= 1000) return 2;
    return 1;
  }
}

module.exports = new MemberService();
