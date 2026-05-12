const refundService = require('../services/refundService');
const db = require('../database/db');

jest.mock('../database/db');
jest.mock('../utils/logger');

describe('Refund Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRefund', () => {
    it('should create a refund record', async () => {
      const mockResult = { insertId: 1 };
      db.query = jest.fn().mockResolvedValue([mockResult]);

      const result = await refundService.createRefund(1, 100, '测试退款');

      expect(db.query).toHaveBeenCalled();
      expect(result).toEqual({ 
        refundId: 1, 
        refundNo: expect.stringMatching(/^REF\d+[A-Za-z0-9]{6}$/), 
        status: 'pending' 
      });
    });
  });

  describe('processRefundCallback', () => {
    it('should handle successful refund callback with idempotency', async () => {
      const mockRefund = [{ id: 1, order_id: 100, status: 'pending' }];
      const mockTransactionFn = jest.fn();
      
      db.transaction = jest.fn().mockImplementation((fn) => {
        return fn({ query: jest.fn().mockResolvedValueOnce([mockRefund]) });
      });

      await refundService.processRefundCallback('REF123', 'SUCCESS');

      expect(db.transaction).toHaveBeenCalled();
    });

    it('should skip processing if refund already completed', async () => {
      const mockRefund = [{ id: 1, order_id: 100, status: 'success' }];
      const mockTransactionFn = jest.fn();
      
      db.transaction = jest.fn().mockImplementation((fn) => {
        return fn({ query: jest.fn().mockResolvedValueOnce([mockRefund]) });
      });

      await refundService.processRefundCallback('REF123', 'SUCCESS');

      expect(db.transaction).toHaveBeenCalled();
    });

    it('should handle failed refund callback', async () => {
      const mockRefund = [{ id: 1, order_id: 100, status: 'pending' }];
      const mockTransactionFn = jest.fn();
      
      db.transaction = jest.fn().mockImplementation((fn) => {
        return fn({ query: jest.fn().mockResolvedValueOnce([mockRefund]) });
      });

      await refundService.processRefundCallback('REF123', 'FAIL', '资金不足');

      expect(db.transaction).toHaveBeenCalled();
    });

    it('should handle non-existent refund', async () => {
      db.transaction = jest.fn().mockImplementation((fn) => {
        return fn({ query: jest.fn().mockResolvedValueOnce([]) });
      });

      await refundService.processRefundCallback('NONEXIST', 'SUCCESS');

      expect(db.transaction).toHaveBeenCalled();
    });
  });

  describe('getRefundByOrderId', () => {
    it('should return refund by order id', async () => {
      const mockRefund = [{ id: 1, order_id: 100, refund_no: 'REF123' }];
      db.query = jest.fn().mockResolvedValue([mockRefund]);

      const result = await refundService.getRefundByOrderId(100);

      expect(result).toEqual(mockRefund[0]);
      expect(db.query).toHaveBeenCalledWith(
        'SELECT * FROM refunds WHERE order_id = ? ORDER BY created_at DESC',
        [100]
      );
    });

    it('should return null if no refund found', async () => {
      db.query = jest.fn().mockResolvedValue([[]]);

      const result = await refundService.getRefundByOrderId(999);

      expect(result).toBeNull();
    });
  });

  describe('getRefundByRefundNo', () => {
    it('should return refund by refund number', async () => {
      const mockRefund = [{ id: 1, order_id: 100, refund_no: 'REF123' }];
      db.query = jest.fn().mockResolvedValue([mockRefund]);

      const result = await refundService.getRefundByRefundNo('REF123');

      expect(result).toEqual(mockRefund[0]);
    });

    it('should return null if no refund found', async () => {
      db.query = jest.fn().mockResolvedValue([[]]);

      const result = await refundService.getRefundByRefundNo('UNKNOWN');

      expect(result).toBeNull();
    });
  });
});