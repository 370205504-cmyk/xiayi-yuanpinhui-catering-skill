const logger = require('../utils/logger');

const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const OrderStatusTransitions = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
  [OrderStatus.READY]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: []
};

const OrderStatusDescriptions = {
  [OrderStatus.PENDING]: '待确认',
  [OrderStatus.CONFIRMED]: '已接单',
  [OrderStatus.PREPARING]: '制作中',
  [OrderStatus.READY]: '已出餐',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消'
};

class OrderStateMachine {
  canTransition(fromStatus, toStatus) {
    const allowedTransitions = OrderStatusTransitions[fromStatus];
    return allowedTransitions && allowedTransitions.includes(toStatus);
  }

  validateTransition(order, toStatus) {
    const fromStatus = order.status;

    if (fromStatus === toStatus) {
      return { valid: false, message: '订单状态未变化' };
    }

    if (!this.canTransition(fromStatus, toStatus)) {
      return {
        valid: false,
        message: `订单状态不允许从"${OrderStatusDescriptions[fromStatus]}"变更为"${OrderStatusDescriptions[toStatus]}"`,
        allowedTransitions: OrderStatusTransitions[fromStatus].map(s => OrderStatusDescriptions[s])
      };
    }

    if (toStatus === OrderStatus.CANCELLED) {
      if (order.payment_status === 'paid') {
        return {
          valid: true,
          requiresRefund: true,
          refundAmount: order.final_amount
        };
      }
    }

    if (toStatus === OrderStatus.COMPLETED) {
      if (order.payment_status !== 'paid') {
        return {
          valid: false,
          message: '订单未支付，无法完成'
        };
      }
    }

    return { valid: true };
  }

  getNextStatuses(currentStatus) {
    return OrderStatusTransitions[currentStatus] || [];
  }

  getStatusDescription(status) {
    return OrderStatusDescriptions[status] || status;
  }

  isCancellable(order) {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status);
  }

  isModifiable(order) {
    return order.status === OrderStatus.PENDING;
  }

  isPaid(order) {
    return order.payment_status === 'paid';
  }

  isCompleted(order) {
    return order.status === OrderStatus.COMPLETED;
  }

  isCancelled(order) {
    return order.status === OrderStatus.CANCELLED;
  }
}

const QueueStatus = {
  WAITING: 'waiting',
  CALLED: 'called',
  SEATED: 'seated',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

const QueueStatusTransitions = {
  [QueueStatus.WAITING]: [QueueStatus.CALLED, QueueStatus.CANCELLED],
  [QueueStatus.CALLED]: [QueueStatus.SEATED, QueueStatus.CANCELLED, QueueStatus.EXPIRED],
  [QueueStatus.SEATED]: [],
  [QueueStatus.CANCELLED]: [],
  [QueueStatus.EXPIRED]: []
};

const QueueStatusDescriptions = {
  [QueueStatus.WAITING]: '等待中',
  [QueueStatus.CALLED]: '已叫号',
  [QueueStatus.SEATED]: '已入座',
  [QueueStatus.CANCELLED]: '已取消',
  [QueueStatus.EXPIRED]: '已过号'
};

class QueueStateMachine {
  canTransition(fromStatus, toStatus) {
    const allowedTransitions = QueueStatusTransitions[fromStatus];
    return allowedTransitions && allowedTransitions.includes(toStatus);
  }

  validateTransition(queue, toStatus) {
    const fromStatus = queue.status;

    if (fromStatus === toStatus) {
      return { valid: false, message: '排队状态未变化' };
    }

    if (!this.canTransition(fromStatus, toStatus)) {
      return {
        valid: false,
        message: `排队状态不允许从"${QueueStatusDescriptions[fromStatus]}"变更为"${QueueStatusDescriptions[toStatus]}"`,
        allowedTransitions: QueueStatusTransitions[fromStatus].map(s => QueueStatusDescriptions[s])
      };
    }

    return { valid: true };
  }

  getNextStatuses(currentStatus) {
    return QueueStatusTransitions[currentStatus] || [];
  }

  getStatusDescription(status) {
    return QueueStatusDescriptions[status] || status;
  }

  isCancellable(queue) {
    return [QueueStatus.WAITING, QueueStatus.CALLED].includes(queue.status);
  }

  isWaiting(queue) {
    return queue.status === QueueStatus.WAITING;
  }

  isCalled(queue) {
    return queue.status === QueueStatus.CALLED;
  }

  isActive(queue) {
    return [QueueStatus.WAITING, QueueStatus.CALLED].includes(queue.status);
  }
}

const orderStateMachine = new OrderStateMachine();
const queueStateMachine = new QueueStateMachine();

module.exports = {
  OrderStatus,
  OrderStatusDescriptions,
  OrderStatusTransitions,
  orderStateMachine,
  QueueStatus,
  QueueStatusDescriptions,
  QueueStatusTransitions,
  queueStateMachine
};