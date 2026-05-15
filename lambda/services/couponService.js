/**
 * 优惠券服务 v2.0
 * 独立优惠券管理：创建、发放、核销、查询
 */

class CouponService {
  constructor() {
    this.coupons = new Map();
    this.userCoupons = new Map();
    this.initDefaultCoupons();
  }

  /**
   * 初始化默认优惠券
   */
  initDefaultCoupons() {
    const defaultCoupons = [
      {
        id: 'coupon_new_user',
        name: '新用户首单立减',
        type: 'CASH', // CASH: 现金券, DISCOUNT: 折扣券, GIFT: 礼品券
        value: 10,
        minAmount: 50,
        description: '新用户首次下单立减10元',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2030-12-31'),
        totalCount: 9999,
        remainingCount: 9999,
        status: 'active',
        rules: {
          newUserOnly: true,
          perUserLimit: 1,
          categories: [], // 空数组表示全品类
          dishes: [] // 空数组表示不限制菜品
        }
      },
      {
        id: 'coupon_full_100',
        name: '满100减20',
        type: 'CASH',
        value: 20,
        minAmount: 100,
        description: '单笔消费满100元立减20元',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2030-12-31'),
        totalCount: 5000,
        remainingCount: 5000,
        status: 'active',
        rules: {
          newUserOnly: false,
          perUserLimit: 5,
          categories: [],
          dishes: []
        }
      },
      {
        id: 'coupon_discount_85',
        name: '85折优惠券',
        type: 'DISCOUNT',
        value: 85, // 85折
        minAmount: 0,
        description: '指定商品85折优惠',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2030-12-31'),
        totalCount: 3000,
        remainingCount: 3000,
        status: 'active',
        rules: {
          newUserOnly: false,
          perUserLimit: 3,
          categories: ['招牌菜'],
          dishes: []
        }
      },
      {
        id: 'coupon_birthday',
        name: '生日专属优惠券',
        type: 'CASH',
        value: 50,
        minAmount: 100,
        description: '会员生日当月享受50元优惠',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2030-12-31'),
        totalCount: 99999,
        remainingCount: 99999,
        status: 'active',
        rules: {
          newUserOnly: false,
          perUserLimit: 1,
          categories: [],
          dishes: [],
          birthdayOnly: true
        }
      },
      {
        id: 'coupon_vip_day',
        name: '会员日双倍积分',
        type: 'GIFT',
        value: 2, // 2倍积分
        minAmount: 0,
        description: '会员日消费双倍积分',
        validFrom: new Date('2024-01-01'),
        validTo: new Date('2030-12-31'),
        totalCount: 99999,
        remainingCount: 99999,
        status: 'active',
        rules: {
          newUserOnly: false,
          perUserLimit: 999,
          categories: [],
          dishes: [],
          vipDayOnly: true // 每周三
        }
      }
    ];

    defaultCoupons.forEach(coupon => {
      this.coupons.set(coupon.id, coupon);
    });
  }

  /**
   * 创建优惠券
   */
  createCoupon(couponData) {
    const coupon = {
      id: `coupon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...couponData,
      status: 'active',
      createdAt: new Date().toISOString(),
      remainingCount: couponData.totalCount || 0
    };

    this.coupons.set(coupon.id, coupon);
    return { success: true, coupon };
  }

  /**
   * 获取优惠券详情
   */
  getCoupon(couponId) {
    const coupon = this.coupons.get(couponId);
    if (!coupon) {
      return { success: false, error: '优惠券不存在' };
    }
    return { success: true, coupon };
  }

  /**
   * 获取所有优惠券列表
   */
  getCouponList(filters = {}) {
    let coupons = Array.from(this.coupons.values());

    // 状态过滤
    if (filters.status) {
      coupons = coupons.filter(c => c.status === filters.status);
    }

    // 类型过滤
    if (filters.type) {
      coupons = coupons.filter(c => c.type === filters.type);
    }

    // 有效期过滤
    const now = new Date();
    if (filters.valid) {
      coupons = coupons.filter(c => 
        new Date(c.validFrom) <= now && new Date(c.validTo) >= now && c.remainingCount > 0
      );
    }

    return { success: true, coupons };
  }

  /**
   * 发放优惠券给用户
   */
  distributeCoupon(userId, couponId) {
    const coupon = this.coupons.get(couponId);
    if (!coupon) {
      return { success: false, error: '优惠券不存在' };
    }

    // 检查优惠券状态
    if (coupon.status !== 'active') {
      return { success: false, error: '优惠券已停用' };
    }

    // 检查库存
    if (coupon.remainingCount <= 0) {
      return { success: false, error: '优惠券已领完' };
    }

    // 检查有效期
    const now = new Date();
    if (now < new Date(coupon.validFrom) || now > new Date(coupon.validTo)) {
      return { success: false, error: '优惠券已过期' };
    }

    // 初始化用户优惠券
    if (!this.userCoupons.has(userId)) {
      this.userCoupons.set(userId, new Map());
    }

    const userCouponMap = this.userCoupons.get(userId);

    // 检查用户领取限制
    const userCouponCount = userCouponMap.get(couponId) || 0;
    if (coupon.rules?.perUserLimit && userCouponCount >= coupon.rules.perUserLimit) {
      return { success: false, error: `该优惠券每位用户限领${coupon.rules.perUserLimit}张` };
    }

    // 发放优惠券
    const userCoupon = {
      id: `uc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      couponId,
      userId,
      status: 'unused', // unused, used, expired
      receivedAt: now.toISOString(),
      usedAt: null,
      expiredAt: coupon.validTo
    };

    userCouponMap.set(couponId, userCouponCount + 1);
    if (!this.userCoupons.get(userId).get(couponId + '_list')) {
      this.userCoupons.get(userId).set(couponId + '_list', []);
    }
    this.userCoupons.get(userId).get(couponId + '_list').push(userCoupon);

    // 减少库存
    coupon.remainingCount--;

    return { success: true, userCoupon };
  }

  /**
   * 获取用户的优惠券列表
   */
  getUserCoupons(userId, status = null) {
    if (!this.userCoupons.has(userId)) {
      return { success: true, coupons: [] };
    }

    let coupons = [];
    const userCouponMap = this.userCoupons.get(userId);

    for (const [key, value] of userCouponMap.entries()) {
      if (key.endsWith('_list')) {
        coupons.push(...value);
      }
    }

    // 过滤状态
    if (status) {
      coupons = coupons.filter(c => c.status === status);
    }

    // 填充优惠券详情
    const result = coupons.map(uc => {
      const coupon = this.coupons.get(uc.couponId);
      return {
        ...uc,
        coupon
      };
    });

    return { success: true, coupons: result };
  }

  /**
   * 核销优惠券
   */
  redeemCoupon(userId, userCouponId, orderAmount) {
    // 查找用户的优惠券
    if (!this.userCoupons.has(userId)) {
      return { success: false, error: '用户优惠券不存在' };
    }

    const userCouponMap = this.userCoupons.get(userId);
    let targetCoupon = null;

    for (const [key, value] of userCouponMap.entries()) {
      if (key.endsWith('_list') && Array.isArray(value)) {
        targetCoupon = value.find(c => c.id === userCouponId);
        if (targetCoupon) break;
      }
    }

    if (!targetCoupon) {
      return { success: false, error: '用户优惠券不存在' };
    }

    // 检查优惠券状态
    if (targetCoupon.status !== 'unused') {
      return { success: false, error: '优惠券已使用或已过期' };
    }

    // 检查有效期
    const now = new Date();
    if (now > new Date(targetCoupon.expiredAt)) {
      targetCoupon.status = 'expired';
      return { success: false, error: '优惠券已过期' };
    }

    // 获取优惠券详情
    const coupon = this.coupons.get(targetCoupon.couponId);
    if (!coupon) {
      return { success: false, error: '优惠券不存在' };
    }

    // 检查订单金额
    if (orderAmount < coupon.minAmount) {
      return { 
        success: false, 
        error: `订单金额需满${coupon.minAmount}元才能使用该优惠券`,
        minAmount: coupon.minAmount
      };
    }

    // 计算优惠金额
    let discount = 0;
    if (coupon.type === 'CASH') {
      discount = coupon.value;
    } else if (coupon.type === 'DISCOUNT') {
      discount = orderAmount * (1 - coupon.value / 100);
    }

    // 确保优惠金额不超过订单金额
    discount = Math.min(discount, orderAmount);

    // 核销优惠券
    targetCoupon.status = 'used';
    targetCoupon.usedAt = now.toISOString();

    return {
      success: true,
      discount: Math.round(discount * 100) / 100,
      originalAmount: orderAmount,
      finalAmount: orderAmount - discount,
      coupon: {
        id: coupon.id,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value
      }
    };
  }

  /**
   * 查询可用优惠券
   */
  getAvailableCoupons(userId, orderAmount, orderItems = []) {
    const { coupons: userCoupons } = this.getUserCoupons(userId, 'unused');
    
    const availableCoupons = [];
    const now = new Date();

    for (const uc of userCoupons) {
      const coupon = uc.coupon;
      if (!coupon) continue;

      // 检查有效期
      if (now < new Date(coupon.validFrom) || now > new Date(coupon.validTo)) {
        continue;
      }

      // 检查订单金额
      if (orderAmount < coupon.minAmount) {
        continue;
      }

      // 计算优惠
      let discount = 0;
      if (coupon.type === 'CASH') {
        discount = coupon.value;
      } else if (coupon.type === 'DISCOUNT') {
        discount = orderAmount * (1 - coupon.value / 100);
      }

      availableCoupons.push({
        userCouponId: uc.id,
        couponId: coupon.id,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        discount: Math.round(discount * 100) / 100,
        minAmount: coupon.minAmount
      });
    }

    // 按优惠金额排序
    availableCoupons.sort((a, b) => b.discount - a.discount);

    return { success: true, coupons: availableCoupons };
  }

  /**
   * 自动应用最优优惠券
   */
  autoApplyBestCoupon(userId, orderAmount, orderItems = []) {
    const { coupons } = this.getAvailableCoupons(userId, orderAmount, orderItems);
    
    if (coupons.length === 0) {
      return { success: true, applied: false, message: '没有可用的优惠券' };
    }

    // 自动应用优惠最多的那张
    const bestCoupon = coupons[0];
    
    return {
      success: true,
      applied: true,
      userCouponId: bestCoupon.userCouponId,
      couponId: bestCoupon.couponId,
      couponName: bestCoupon.name,
      discount: bestCoupon.discount,
      finalAmount: orderAmount - bestCoupon.discount
    };
  }

  /**
   * 退回优惠券（订单取消时）
   */
  refundCoupon(userId, userCouponId) {
    if (!this.userCoupons.has(userId)) {
      return { success: false, error: '用户优惠券不存在' };
    }

    const userCouponMap = this.userCoupons.get(userId);

    for (const [key, value] of userCouponMap.entries()) {
      if (key.endsWith('_list') && Array.isArray(value)) {
        const couponIndex = value.findIndex(c => c.id === userCouponId);
        if (couponIndex !== -1) {
          const coupon = value[couponIndex];
          if (coupon.status === 'used') {
            coupon.status = 'unused';
            coupon.usedAt = null;

            // 恢复库存
            const originalCoupon = this.coupons.get(coupon.couponId);
            if (originalCoupon) {
              originalCoupon.remainingCount++;
            }

            return { success: true, message: '优惠券已退回' };
          }
        }
      }
    }

    return { success: false, error: '优惠券退回失败' };
  }

  /**
   * 删除优惠券
   */
  deleteCoupon(couponId) {
    if (!this.coupons.has(couponId)) {
      return { success: false, error: '优惠券不存在' };
    }

    this.coupons.delete(couponId);
    return { success: true, message: '优惠券已删除' };
  }

  /**
   * 更新优惠券
   */
  updateCoupon(couponId, updates) {
    const coupon = this.coupons.get(couponId);
    if (!coupon) {
      return { success: false, error: '优惠券不存在' };
    }

    Object.assign(coupon, updates);
    return { success: true, coupon };
  }

  /**
   * 获取优惠券统计
   */
  getCouponStats() {
    const stats = {
      total: this.coupons.size,
      active: 0,
      inactive: 0,
      totalDistributed: 0,
      totalUsed: 0,
      totalExpired: 0,
      byType: {
        CASH: 0,
        DISCOUNT: 0,
        GIFT: 0
      }
    };

    for (const coupon of this.coupons.values()) {
      if (coupon.status === 'active') {
        stats.active++;
      } else {
        stats.inactive++;
      }

      if (coupon.type) {
        stats.byType[coupon.type] = (stats.byType[coupon.type] || 0) + 1;
      }
    }

    // 统计用户优惠券
    for (const userCouponMap of this.userCoupons.values()) {
      for (const [key, value] of userCouponMap.entries()) {
        if (key.endsWith('_list') && Array.isArray(value)) {
          stats.totalDistributed += value.length;
          stats.totalUsed += value.filter(c => c.status === 'used').length;
          stats.totalExpired += value.filter(c => c.status === 'expired').length;
        }
      }
    }

    return { success: true, stats };
  }

  /**
   * 批量发放优惠券
   */
  batchDistribute(userIds, couponId) {
    const results = {
      success: [],
      failed: []
    };

    for (const userId of userIds) {
      const result = this.distributeCoupon(userId, couponId);
      if (result.success) {
        results.success.push(userId);
      } else {
        results.failed.push({ userId, reason: result.error });
      }
    }

    return { 
      success: true, 
      total: userIds.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
      results
    };
  }
}

module.exports = CouponService;
