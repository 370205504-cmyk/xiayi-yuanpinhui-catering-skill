const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secureAuthService = require('../services/secureAuthService');
const cartService = require('../services/cartService');
const dishesService = require('../services/dishesService');

describe('SecureAuthService', () => {
  describe('generateToken', () => {
    it('should generate valid JWT tokens', () => {
      const result = secureAuthService.generateToken('user123', '13800138000', 'user');

      expect(result.token).toBeDefined();
      expect(result.refreshToken).toBeDefined();

      const decoded = jwt.verify(result.token, process.env.JWT_SECRET || 'change-this-in-production');
      expect(decoded.userId).toBe('user123');
      expect(decoded.phone).toBe('13800138000');
      expect(decoded.role).toBe('user');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const token = secureAuthService.generateToken('user123', '13800138000', 'user').token;
      const result = secureAuthService.verifyToken(token);

      expect(result.valid).toBe(true);
      expect(result.decoded.userId).toBe('user123');
    });

    it('should reject invalid token', () => {
      const result = secureAuthService.verifyToken('invalid.token.here');
      expect(result.valid).toBe(false);
    });
  });

  describe('hashPassword', () => {
    it('should hash password securely', () => {
      const password = 'Test@1234';
      const result = secureAuthService.hashPassword(password);

      expect(result.salt).toBeDefined();
      expect(result.hash).toBeDefined();
      expect(result.hash.length).toBeGreaterThan(32);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', () => {
      const password = 'Test@1234';
      const { salt, hash } = secureAuthService.hashPassword(password);
      const result = secureAuthService.verifyPassword(password, salt, hash);

      expect(result).toBe(true);
    });

    it('should reject incorrect password', () => {
      const { salt, hash } = secureAuthService.hashPassword('correct');
      const result = secureAuthService.verifyPassword('wrong', salt, hash);

      expect(result).toBe(false);
    });
  });

  describe('generateSecureUserId', () => {
    it('should generate unique user ID', () => {
      const id1 = secureAuthService.generateSecureUserId();
      const id2 = secureAuthService.generateSecureUserId();

      expect(id1).toMatch(/^u_[a-f0-9]{32}$/);
      expect(id2).toMatch(/^u_[a-f0-9]{32}$/);
      expect(id1).not.toBe(id2);
    });
  });
});

describe('CartService', () => {
  const userId = 'test_user_123';

  beforeEach(async () => {
    await cartService.clearCart(userId);
  });

  describe('addItem', () => {
    it('should add item to cart', async () => {
      await cartService.addItem(userId, 1, 2, '少辣');
      const cart = await cartService.getCart(userId);

      expect(cart.items.length).toBe(1);
      expect(cart.items[0].dishId).toBe(1);
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].remarks).toBe('少辣');
    });

    it('should increment quantity for same dish', async () => {
      await cartService.addItem(userId, 1, 1);
      await cartService.addItem(userId, 1, 2);
      const cart = await cartService.getCart(userId);

      expect(cart.items.length).toBe(1);
      expect(cart.items[0].quantity).toBe(3);
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      await cartService.addItem(userId, 1, 1);
      await cartService.removeItem(userId, 1);
      const cart = await cartService.getCart(userId);

      expect(cart.items.length).toBe(0);
    });
  });

  describe('clearCart', () => {
    it('should clear all items', async () => {
      await cartService.addItem(userId, 1, 1);
      await cartService.addItem(userId, 2, 1);
      await cartService.clearCart(userId);
      const cart = await cartService.getCart(userId);

      expect(cart.items.length).toBe(0);
      expect(cart.total).toBe(0);
    });
  });
});

describe('DishesService', () => {
  describe('getAllDishes', () => {
    it('should return all dishes', async () => {
      const dishes = await dishesService.getAllDishes();
      
      expect(Array.isArray(dishes)).toBe(true);
      expect(dishes.length).toBeGreaterThan(0);
    });
  });

  describe('getDishById', () => {
    it('should return dish by ID', async () => {
      const dish = await dishesService.getDishById(1);
      
      expect(dish).toBeDefined();
      expect(dish.id).toBe(1);
      expect(dish.name).toBeDefined();
    });

    it('should return null for non-existent dish', async () => {
      const dish = await dishesService.getDishById(999);
      
      expect(dish).toBeNull();
    });
  });

  describe('recommendDishes', () => {
    it('should return recommended dishes', async () => {
      const recommendations = await dishesService.recommendDishes({
        taste: '辣',
        budget: 'medium',
        people: 4,
        count: 5
      });

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(5);
    });
  });

  describe('searchDishes', () => {
    it('should search dishes by keyword', async () => {
      const results = await dishesService.searchDishes('肉');
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach(dish => {
        expect(dish.name.includes('肉')).toBe(true);
      });
    });
  });
});

describe('Input Validation', () => {
  const inputValidator = require('../services/inputValidator');

  describe('validatePhone', () => {
    it('should validate valid phone number', () => {
      expect(inputValidator.validatePhone('13800138000')).toBe(true);
      expect(inputValidator.validatePhone('13912345678')).toBe(true);
    });

    it('should reject invalid phone number', () => {
      expect(inputValidator.validatePhone('12345')).toBe(false);
      expect(inputValidator.validatePhone('invalid')).toBe(false);
      expect(inputValidator.validatePhone('1380013800')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong password', () => {
      expect(inputValidator.validatePassword('Test@1234')).toBe(true);
      expect(inputValidator.validatePassword('Abc123!@#')).toBe(true);
    });

    it('should reject weak password', () => {
      expect(inputValidator.validatePassword('123456')).toBe(false);
      expect(inputValidator.validatePassword('password')).toBe(false);
      expect(inputValidator.validatePassword('Password')).toBe(false);
      expect(inputValidator.validatePassword('Pass123')).toBe(false);
    });
  });
});

describe('Cache Protection', () => {
  const cacheProtection = require('../services/cacheProtection');

  describe('addToBloomFilter', () => {
    it('should add key to bloom filter', async () => {
      await cacheProtection.addToBloomFilter('test_key');
      
      const exists = await cacheProtection.mightContain('test_key');
      expect(exists).toBe(true);
    });
  });

  describe('mightContain', () => {
    it('should return false for non-existent key', async () => {
      const exists = await cacheProtection.mightContain('non_existent_key_12345');
      expect(exists).toBe(false);
    });
  });
});