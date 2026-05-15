const mysql = require('mysql2/promise');
const Redis = require('redis');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/database.log' }),
    new winston.transports.Console()
  ]
});

const SQL_INJECTION_PATTERNS = [
  /(['"])\s*OR\s*\1.*--/gi,
  /(['"])\s*AND\s*\1.*--/gi,
  /UNION\s+SELECT/gi,
  /SELECT.*FROM/gi,
  /INSERT\s+INTO/gi,
  /UPDATE.*SET/gi,
  /DELETE\s+FROM/gi,
  /DROP\s+(TABLE|DATABASE)/gi,
  /TRUNCATE\s+TABLE/gi,
  /EXEC\s+(\(|UTE|XP_)/gi,
  /SP_(EXECUTE|OACREATE)/gi,
  /xp_cmdshell/gi,
  /0x[0-9a-fA-F]+/g,
  /\b(OR|AND)\b\s*[0-9]+\s*=\s*[0-9]+/gi,
  /\b(OR|AND)\b\s*'[^']*'\s*=\s*'[^']*'/gi,
  /--.*$/gm,
  /\/\*.*\*\//g,
  /;.*--/g,
  /\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|EXEC)\b/i
];

const ALLOWED_SQL_COMMANDS = [
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CALL', 'SHOW', 'DESCRIBE'
];

const MAX_QUERY_LENGTH = 5000;
const MAX_PARAMS_COUNT = 100;

class Database {
  constructor() {
    this.pool = null;
    this.redis = null;
    this.queryLog = [];
    this.maxLogSize = 100;
  }

  async initialize() {
    try {
      this.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'yushan_restaurant',
        waitForConnections: true,
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 20,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        namedPlaceholders: true
      });

      this.redis = Redis.createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379
        },
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB) || 0
      });

      await this.redis.connect();
      logger.info('数据库连接池初始化成功');
      return true;
    } catch (error) {
      logger.error('数据库初始化失败:', error);
      throw error;
    }
  }

  validateSqlCommand(sql) {
    const trimmedSql = sql.trim().toUpperCase();
    const firstWord = trimmedSql.split(/\s+/)[0];
    
    if (!ALLOWED_SQL_COMMANDS.includes(firstWord)) {
      logger.warn(`非法SQL命令: ${firstWord}`);
      return { valid: false, error: `不允许的SQL命令: ${firstWord}` };
    }
    return { valid: true };
  }

  scanForSqlInjection(sql, params = []) {
    const sqlPatternMatch = SQL_INJECTION_PATTERNS.some(pattern => pattern.test(sql));
    if (sqlPatternMatch) {
      logger.warn('检测到SQL注入模式(SQL):', sql.substring(0, 100));
      return { valid: false, error: '检测到潜在的SQL注入攻击' };
    }

    for (const param of params) {
      if (typeof param === 'string') {
        const paramPatternMatch = SQL_INJECTION_PATTERNS.some(pattern => pattern.test(param));
        if (paramPatternMatch) {
          logger.warn('检测到SQL注入模式(参数):', param.substring(0, 100));
          return { valid: false, error: '检测到潜在的SQL注入攻击' };
        }
      }
    }

    return { valid: true };
  }

  validateQueryLength(sql) {
    if (sql.length > MAX_QUERY_LENGTH) {
      logger.warn('SQL查询长度超限:', sql.length);
      return { valid: false, error: '查询语句过长' };
    }
    return { valid: true };
  }

  validateParams(params) {
    if (!Array.isArray(params)) {
      return { valid: false, error: '参数必须是数组' };
    }

    if (params.length > MAX_PARAMS_COUNT) {
      logger.warn('参数数量超限:', params.length);
      return { valid: false, error: '参数数量过多' };
    }

    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      if (param === null || param === undefined) {
        continue;
      }
      
      if (typeof param === 'string') {
        if (param.length > 1000) {
          logger.warn(`参数${i}长度超限:`, param.length);
          return { valid: false, error: `参数${i}长度超过限制` };
        }
        
        if (param.includes('\0')) {
          logger.warn(`参数${i}包含空字符`);
          return { valid: false, error: '参数包含非法字符' };
        }
      }

      if (typeof param === 'number') {
        if (!isFinite(param)) {
          logger.warn(`参数${i}不是有效数字`);
          return { valid: false, error: '参数必须是有效数字' };
        }
      }
    }

    return { valid: true };
  }

  sanitizeParam(value) {
    if (typeof value === 'string') {
      return value.replace(/[\x00-\x1F\x7F]/g, '');
    }
    return value;
  }

  async query(sql, params = []) {
    const validationResults = [
      this.validateSqlCommand(sql),
      this.scanForSqlInjection(sql, params),
      this.validateQueryLength(sql),
      this.validateParams(params)
    ];

    for (const result of validationResults) {
      if (!result.valid) {
        logger.error('SQL查询验证失败:', result.error);
        throw new Error(`数据库查询验证失败: ${result.error}`);
      }
    }

    const sanitizedParams = params.map(p => this.sanitizeParam(p));

    try {
      const [rows] = await this.pool.execute(sql, sanitizedParams);
      
      this.logQuery(sql, sanitizedParams, rows.length);
      
      return rows;
    } catch (error) {
      logger.error('数据库查询失败:', { sql: sql.substring(0, 200), error: error.message });
      throw error;
    }
  }

  logQuery(sql, params, rowCount) {
    const logEntry = {
      timestamp: Date.now(),
      sql: sql.substring(0, 200),
      params: params.length,
      rowCount,
      duration: Date.now() - (this.queryLog[this.queryLog.length - 1]?.timestamp || Date.now())
    };
    
    this.queryLog.push(logEntry);
    if (this.queryLog.length > this.maxLogSize) {
      this.queryLog.shift();
    }
  }

  getConnection() {
    return this.pool.getConnection();
  }

  async transaction(callback) {
    const connection = await this.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async cacheGet(key) {
    try {
      if (typeof key !== 'string') {
        logger.warn('Redis key必须是字符串');
        return null;
      }
      
      if (key.length > 1000) {
        logger.warn('Redis key长度超限');
        return null;
      }

      const sanitizedKey = key.replace(/[\x00-\x1F\x7F]/g, '');
      const value = await this.redis.get(sanitizedKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  }

  async cacheSet(key, value, ttl = 3600) {
    try {
      if (typeof key !== 'string') {
        logger.warn('Redis key必须是字符串');
        return false;
      }
      
      if (key.length > 1000) {
        logger.warn('Redis key长度超限');
        return false;
      }

      const sanitizedKey = key.replace(/[\x00-\x1F\x7F]/g, '');
      await this.redis.setEx(sanitizedKey, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis set error:', error);
      return false;
    }
  }

  async cacheDel(key) {
    try {
      if (typeof key !== 'string') {
        logger.warn('Redis key必须是字符串');
        return false;
      }

      const sanitizedKey = key.replace(/[\x00-\x1F\x7F]/g, '');
      await this.redis.del(sanitizedKey);
      return true;
    } catch (error) {
      logger.error('Redis del error:', error);
      return false;
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
    }
    if (this.redis) {
      await this.redis.quit();
    }
    logger.info('数据库连接已关闭');
  }

  getQueryStats() {
    if (this.queryLog.length === 0) {
      return { totalQueries: 0, avgDuration: 0 };
    }

    const totalDuration = this.queryLog.reduce((sum, entry) => sum + entry.duration, 0);
    return {
      totalQueries: this.queryLog.length,
      avgDuration: totalDuration / this.queryLog.length
    };
  }
}

module.exports = new Database();