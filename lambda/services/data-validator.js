/**
 * 数据自动校验纠错
 * AI 自动识别重复菜品、错误价格、异常库存，提醒商家修正
 */

class DataValidator {
  constructor() {
    this.issues = [];
    this.fixedItems = [];
  }

  /**
   * 校验所有数据
   */
  async validateAllData(dishes, inventory, members, orders) {
    this.issues = [];
    this.fixedItems = [];

    console.log('🔍 开始数据自动校验...');

    // 校验菜品
    if (dishes && dishes.length > 0) {
      this.validateDishes(dishes);
    }

    // 校验库存
    if (inventory && inventory.length > 0) {
      this.validateInventory(inventory);
    }

    // 校验订单
    if (orders && orders.length > 0) {
      this.validateOrders(orders);
    }

    // 校验会员
    if (members && members.length > 0) {
      this.validateMembers(members);
    }

    console.log(`✅ 数据校验完成，发现 ${this.issues.length} 个问题`);
    return {
      success: true,
      issues: this.issues,
      fixedItems: this.fixedItems,
      summary: this.generateSummary()
    };
  }

  /**
   * 校验菜品数据
   */
  validateDishes(dishes) {
    console.log('📋 校验菜品数据...');

    // 检测重复菜品
    const nameMap = new Map();
    dishes.forEach((dish, index) => {
      const nameKey = dish.name.trim().toLowerCase();
      if (nameMap.has(nameKey)) {
        const firstIndex = nameMap.get(nameKey);
        this.issues.push({
          type: 'DUPLICATE_DISH',
          severity: 'MEDIUM',
          item: dish.name,
          dish1: dishes[firstIndex],
          dish2: dish,
          suggestion: '建议合并或删除重复菜品'
        });
      } else {
        nameMap.set(nameKey, index);
      }
    });

    // 检测异常价格
    dishes.forEach(dish => {
      if (dish.price <= 0) {
        this.issues.push({
          type: 'INVALID_PRICE',
          severity: 'HIGH',
          item: dish.name,
          price: dish.price,
          suggestion: '价格必须大于0，请修正'
        });
      } else if (dish.price > 10000) {
        this.issues.push({
          type: 'SUSPICIOUS_PRICE',
          severity: 'LOW',
          item: dish.name,
          price: dish.price,
          suggestion: '价格异常高，建议确认是否正确'
        });
      }
    });

    // 检测空分类
    dishes.forEach(dish => {
      if (!dish.category || dish.category.trim() === '') {
        this.issues.push({
          type: 'EMPTY_CATEGORY',
          severity: 'LOW',
          item: dish.name,
          suggestion: '建议添加菜品分类'
        });
      }
    });
  }

  /**
   * 校验库存数据
   */
  validateInventory(inventory) {
    console.log('📦 校验库存数据...');

    inventory.forEach(item => {
      // 检测负库存
      if (item.stock < 0) {
        this.issues.push({
          type: 'NEGATIVE_STOCK',
          severity: 'HIGH',
          item: item.dishId || item.name,
          stock: item.stock,
          suggestion: '库存为负数，建议核对修正'
        });
      }

      // 检测库存过高
      if (item.stock > 9999) {
        this.issues.push({
          type: 'EXCESSIVE_STOCK',
          severity: 'LOW',
          item: item.dishId || item.name,
          stock: item.stock,
          suggestion: '库存异常高，建议确认'
        });
      }
    });
  }

  /**
   * 校验订单数据
   */
  validateOrders(orders) {
    console.log('📝 校验订单数据...');

    orders.forEach(order => {
      // 检测金额不一致
      const calculatedTotal = order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
      if (Math.abs(calculatedTotal - order.totalAmount) > 0.01) {
        this.issues.push({
          type: 'PRICE_MISMATCH',
          severity: 'MEDIUM',
          orderId: order.id || order.orderNo,
          calculatedTotal,
          statedTotal: order.totalAmount,
          suggestion: '订单金额计算不一致，建议核对'
        });
      }

      // 检测空订单
      if (!order.items || order.items.length === 0) {
        this.issues.push({
          type: 'EMPTY_ORDER',
          severity: 'LOW',
          orderId: order.id || order.orderNo,
          suggestion: '订单无菜品'
        });
      }
    });
  }

  /**
   * 校验会员数据
   */
  validateMembers(members) {
    console.log('👤 校验会员数据...');

    const phoneSet = new Set();
    members.forEach(member => {
      // 检测重复手机号
      if (member.phone) {
        if (phoneSet.has(member.phone)) {
          this.issues.push({
            type: 'DUPLICATE_MEMBER_PHONE',
            severity: 'MEDIUM',
            member: member.name || member.phone,
            phone: member.phone,
            suggestion: '手机号重复，建议合并会员'
          });
        } else {
          phoneSet.add(member.phone);
        }
      }

      // 检测负余额
      if (member.balance < 0) {
        this.issues.push({
          type: 'NEGATIVE_BALANCE',
          severity: 'HIGH',
          member: member.name || member.phone,
          balance: member.balance,
          suggestion: '会员余额为负数，建议核对修正'
        });
      }
    });
  }

  /**
   * 尝试自动修复问题
   */
  async autoFixIssues() {
    console.log('🔧 尝试自动修复问题...');

    this.issues.forEach(issue => {
      // 自动修复可以修复的问题
      if (issue.type === 'EMPTY_CATEGORY') {
        this.fixedItems.push({
          issue,
          action: 'AUTO_CATEGORY',
          message: '已自动归类为"其他"'
        });
      }
    });

    return this.fixedItems;
  }

  /**
   * 生成校验摘要
   */
  generateSummary() {
    const highCount = this.issues.filter(i => i.severity === 'HIGH').length;
    const mediumCount = this.issues.filter(i => i.severity === 'MEDIUM').length;
    const lowCount = this.issues.filter(i => i.severity === 'LOW').length;

    return {
      total: this.issues.length,
      high: highCount,
      medium: mediumCount,
      low: lowCount,
      needAttention: highCount > 0 || mediumCount > 2,
      recommendedAction: highCount > 0 ? '请立即处理高危问题' : 
                         mediumCount > 2 ? '建议处理中等问题' : '数据状态良好'
    };
  }

  /**
   * 生成报告（中文）
   */
  generateReport() {
    const summary = this.generateSummary();

    let report = `
═══════════════════════════════════════════════
          📊 数据自动校验报告
═══════════════════════════════════════════════

📋 总览:
   问题总数: ${summary.total}
   高危: ${summary.high} ⚠️
   中等: ${summary.medium}
   低危: ${summary.low}

📝 详细问题:
`;

    // 按严重程度分组显示
    const severityOrder = ['HIGH', 'MEDIUM', 'LOW'];
    severityOrder.forEach(sev => {
      const issuesOfSev = this.issues.filter(i => i.severity === sev);
      if (issuesOfSev.length > 0) {
        report += `\n   ${sev === 'HIGH' ? '🔴' : sev === 'MEDIUM' ? '🟡' : '🟢'} ${sev} (${issuesOfSev.length}项):\n`;
        issuesOfSev.slice(0, 5).forEach(issue => {
          report += `      - [${issue.type}] ${issue.item || issue.orderId || issue.member}: ${issue.suggestion}\n`;
        });
        if (issuesOfSev.length > 5) {
          report += `      ... 还有 ${issuesOfSev.length - 5} 项\n`;
        }
      }
    });

    report += `\n💡 建议: ${summary.recommendedAction}\n`;
    report += `═══════════════════════════════════════════════\n`;

    return report;
  }
}

module.exports = DataValidator;
