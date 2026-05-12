const { retryWithBackoff, retryWithExponentialBackoff } = require('../utils/retryHelper');

jest.useFakeTimers();

describe('Retry Helper', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(mockFn);
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and succeed', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const result = await retryWithBackoff(mockFn, { retries: 3, initialDelay: 100 });
      
      jest.runAllTimers();
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('fail'));

      await expect(retryWithBackoff(mockFn, { retries: 2, initialDelay: 100 }))
        .rejects
        .toThrow('fail');

      jest.runAllTimers();
      
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('should apply exponential backoff', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('fail'));

      try {
        await retryWithBackoff(mockFn, { 
          retries: 3, 
          initialDelay: 100, 
          factor: 2,
          jitter: false 
        });
      } catch (e) {
        // expected
      }

      jest.runAllTimers();
      
      expect(setTimeout).toHaveBeenCalledTimes(2);
      expect(setTimeout).toHaveBeenNthCalledWith(1, 100);
      expect(setTimeout).toHaveBeenNthCalledWith(2, 200);
    });
  });

  describe('retryWithExponentialBackoff', () => {
    it('should use default exponential backoff settings', async () => {
      const mockFn = jest.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      const result = await retryWithExponentialBackoff(mockFn);
      
      jest.runAllTimers();
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});