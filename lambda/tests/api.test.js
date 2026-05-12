const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = require('../server');
const db = require('../database/db');

describe('Authentication Tests', () => {
  let token;

  beforeAll(async () => {
    await db.initialize();
  });

  afterAll(async () => {
    await db.close();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: '13800138000', password: '123456' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      token = res.body.data.token;
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: '13800138000', password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should validate phone format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: 'invalid', password: '123456' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ phone: '13900139000', password: 'Test@1234', nickname: '测试用户' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ phone: '13900139001', password: '123456', nickname: '测试用户' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should get profile with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.phone).toBe('13800138000');
    });

    it('should reject without token', async () => {
      const res = await request(app).get('/api/v1/auth/profile');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});

describe('Order Tests', () => {
  let token;

  beforeAll(async () => {
    await db.initialize();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '13800138000', password: '123456' });
    token = res.body.data.token;
  });

  afterAll(async () => {
    await db.close();
  });

  describe('POST /api/v1/order/create', () => {
    it('should create order with valid items', async () => {
      const res = await request(app)
        .post('/api/v1/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            { dishId: 1, quantity: 1, remarks: '少辣' },
            { dishId: 2, quantity: 2 }
          ],
          orderType: 'dine_in',
          tableNo: 'A01'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderNo).toBeDefined();
    });

    it('should reject order without items', async () => {
      const res = await request(app)
        .post('/api/v1/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [], orderType: 'dine_in' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

describe('Payment Tests', () => {
  let token;

  beforeAll(async () => {
    await db.initialize();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '13800138000', password: '123456' });
    token = res.body.data.token;
  });

  afterAll(async () => {
    await db.close();
  });

  describe('POST /api/v1/payment/create', () => {
    it('should create payment with valid order', async () => {
      const orderRes = await request(app)
        .post('/api/v1/order/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [{ dishId: 1, quantity: 1 }],
          orderType: 'dine_in',
          tableNo: 'A01'
        });

      const res = await request(app)
        .post('/api/v1/payment/create')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderNo: orderRes.body.data.orderNo,
          payType: 'wechat'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

describe('Member Tests', () => {
  let token;

  beforeAll(async () => {
    await db.initialize();
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '13800138000', password: '123456' });
    token = res.body.data.token;
  });

  afterAll(async () => {
    await db.close();
  });

  describe('GET /api/v1/member/info', () => {
    it('should get member info', async () => {
      const res = await request(app)
        .get('/api/v1/member/info')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('points');
      expect(res.body.data).toHaveProperty('balance');
    });
  });
});

describe('Security Tests', () => {
  describe('SQL Injection Protection', () => {
    it('should block SQL injection attempts', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: "13800138000' OR '1'='1", password: 'test' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should block UNION SELECT injection', async () => {
      const res = await request(app)
        .get('/api/v1/dishes/dishes?category=UNION%20SELECT%201,2,3')
        .send();

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should limit login attempts', async () => {
      for (let i = 0; i < 6; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({ phone: '13800138000', password: 'wrong' });
      }

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ phone: '13800138000', password: 'wrong' });

      expect(res.statusCode).toBe(429);
    });
  });
});

describe('API Response Format', () => {
  it('should return consistent response format', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.body).toHaveProperty('success');
    expect(res.body).toHaveProperty('code');
    expect(typeof res.body.success).toBe('boolean');
  });

  it('should return error with code', async () => {
    const res = await request(app)
      .get('/api/v1/nonexistent')
      .send();

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBeDefined();
  });
});