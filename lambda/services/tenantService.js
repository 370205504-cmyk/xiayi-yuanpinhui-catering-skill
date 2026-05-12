const crypto = require('crypto');
const db = require('../database/db');
const logger = require('../utils/logger');

class TenantService {
  constructor() {
    this.cachePrefix = 'tenant:';
    this.cacheTTL = 3600;
  }

  async createTenant(data) {
    const { name, contactName, contactPhone, email, plan = 'basic' } = data;
    
    const tenantId = `tenant_${crypto.randomBytes(8).toString('hex')}`;
    const apiKey = this.generateApiKey();
    const apiKeyHash = this.hashApiKey(apiKey);
    const apiKeyPrefix = apiKey.substring(0, 8);

    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      await connection.query(
        `INSERT INTO tenants (id, name, contact_name, contact_phone, email, plan, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'active', NOW())`,
        [tenantId, name, contactName, contactPhone, email, plan]
      );

      await connection.query(
        `INSERT INTO tenant_api_keys (id, tenant_id, key_hash, key_prefix, name, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'active', NOW())`,
        [`key_${crypto.randomBytes(8).toString('hex')}`, tenantId, apiKeyHash, apiKeyPrefix, 'Default Key']
      );

      await connection.commit();

      logger.info('Tenant created', { tenantId, name });

      return {
        success: true,
        tenant: {
          id: tenantId,
          name,
          apiKey
        }
      };
    } catch (error) {
      await connection.rollback();
      logger.error('Failed to create tenant', { error: error.message });
      throw error;
    } finally {
      connection.release();
    }
  }

  generateApiKey() {
    return `sk_${crypto.randomBytes(24).toString('base64url')}`;
  }

  hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  async validateApiKey(apiKey) {
    if (!apiKey || !apiKey.startsWith('sk_')) {
      return { valid: false };
    }

    const keyHash = this.hashApiKey(apiKey);
    const cacheKey = `${this.cachePrefix}key:${keyHash}`;

    try {
      if (db.redis && db.redis.isOpen) {
        const cached = await db.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const [keys] = await db.query(
        `SELECT k.*, t.name as tenant_name, t.status as tenant_status, t.plan
         FROM tenant_api_keys k
         JOIN tenants t ON k.tenant_id = t.id
         WHERE k.key_hash = ? AND k.status = 'active' AND t.status = 'active'`,
        [keyHash]
      );

      if (keys.length === 0) {
        const result = { valid: false };
        if (db.redis && db.redis.isOpen) {
          await db.redis.setEx(cacheKey, 300, JSON.stringify(result));
        }
        return result;
      }

      const keyData = keys[0];
      const result = {
        valid: true,
        tenantId: keyData.tenant_id,
        tenantName: keyData.tenant_name,
        keyId: keyData.id,
        plan: keyData.plan
      };

      if (db.redis && db.redis.isOpen) {
        await db.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(result));
      }

      return result;
    } catch (error) {
      logger.error('API key validation failed', { error: error.message });
      return { valid: false };
    }
  }

  async getTenant(tenantId) {
    const cacheKey = `${this.cachePrefix}${tenantId}`;

    try {
      if (db.redis && db.redis.isOpen) {
        const cached = await db.redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      }

      const [tenants] = await db.query(
        'SELECT * FROM tenants WHERE id = ? AND status = "active"',
        [tenantId]
      );

      if (tenants.length === 0) {
        return null;
      }

      const tenant = tenants[0];

      if (db.redis && db.redis.isOpen) {
        await db.redis.setEx(cacheKey, this.cacheTTL, JSON.stringify(tenant));
      }

      return tenant;
    } catch (error) {
      logger.error('Failed to get tenant', { error: error.message, tenantId });
      return null;
    }
  }

  async regenerateApiKey(tenantId, keyId) {
    const newApiKey = this.generateApiKey();
    const newKeyHash = this.hashApiKey(newApiKey);
    const newKeyPrefix = newApiKey.substring(0, 8);

    await db.query(
      `UPDATE tenant_api_keys SET key_hash = ?, key_prefix = ?, updated_at = NOW() WHERE id = ? AND tenant_id = ?`,
      [newKeyHash, newKeyPrefix, keyId, tenantId]
    );

    const cacheKey = `${this.cachePrefix}tenant:${tenantId}`;
    if (db.redis && db.redis.isOpen) {
      await db.redis.del(cacheKey);
    }

    return { success: true, apiKey: newApiKey };
  }

  async revokeApiKey(tenantId, keyId) {
    await db.query(
      `UPDATE tenant_api_keys SET status = 'revoked', revoked_at = NOW() WHERE id = ? AND tenant_id = ?`,
      [keyId, tenantId]
    );

    return { success: true };
  }

  async getTenantUsage(tenantId, period = 'day') {
    const dateCondition = period === 'day'
      ? 'DATE(created_at) = CURDATE()'
      : period === 'month'
      ? 'MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())'
      : '1=1';

    const [usage] = await db.query(
      `SELECT 
        COUNT(*) as total_requests,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_requests,
        AVG(response_time) as avg_response_time
       FROM tenant_usage_logs 
       WHERE tenant_id = ? AND ${dateCondition}`,
      [tenantId]
    );

    return usage[0];
  }

  async logUsage(tenantId, endpoint, statusCode, responseTime) {
    try {
      await db.query(
        `INSERT INTO tenant_usage_logs (tenant_id, endpoint, status_code, response_time, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [tenantId, endpoint, statusCode, responseTime]
      );
    } catch (error) {
      logger.warn('Failed to log tenant usage', { error: error.message });
    }
  }
}

const tenantService = new TenantService();

const requireTenant = async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'];
  const apiKey = req.headers['x-api-key'];

  if (!tenantId && !apiKey) {
    return res.status(401).json({
      success: false,
      code: 4001,
      message: '缺少租户认证信息，请提供 X-Tenant-Id 和 X-API-Key'
    });
  }

  if (apiKey) {
    const validation = await tenantService.validateApiKey(apiKey);
    
    if (!validation.valid) {
      return res.status(401).json({
        success: false,
        code: 4002,
        message: 'API Key无效或已过期'
      });
    }

    req.tenantId = validation.tenantId;
    req.tenantName = validation.tenantName;
    req.tenantPlan = validation.plan;
  } else if (tenantId) {
    const tenant = await tenantService.getTenant(tenantId);
    
    if (!tenant) {
      return res.status(401).json({
        success: false,
        code: 4001,
        message: '租户不存在或已禁用'
      });
    }

    req.tenantId = tenantId;
    req.tenantName = tenant.name;
    req.tenantPlan = tenant.plan;
  }

  next();
};

const tenantDataFilter = (req, res, next) => {
  if (!req.tenantId) {
    return next();
  }

  const originalQuery = db.query;
  
  db.query = async function(sql, params = []) {
    const upperSql = sql.toUpperCase();
    
    if (upperSql.includes('SELECT') || upperSql.includes('UPDATE') || upperSql.includes('DELETE')) {
      if (!upperSql.includes('WHERE')) {
        sql += ' WHERE tenant_id = ?';
      } else {
        sql = sql.replace(/WHERE/i, 'WHERE tenant_id = ? AND ');
      }
      
      if (!Array.isArray(params)) {
        params = [req.tenantId, ...params];
      } else {
        params = [req.tenantId, ...params];
      }
    }
    
    return originalQuery.call(this, sql, params);
  };

  res.on('finish', () => {
    db.query = originalQuery;
  });

  next();
};

module.exports = {
  tenantService,
  requireTenant,
  tenantDataFilter
};