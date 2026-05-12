const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

class DatabaseReadWrite {
  constructor() {
    this.masterPool = null;
    this.slavePool = null;
    this.isReadWriteSeparation = false;
  }

  async initialize() {
    const masterConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'xiayi_restaurant',
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_POOL_MAX) || 50,
      queueLimit: 0,
      multipleStatements: true
    };

    this.masterPool = mysql.createPool(masterConfig);

    if (process.env.DB_READ_HOST) {
      this.isReadWriteSeparation = true;
      const slaveConfig = {
        ...masterConfig,
        host: process.env.DB_READ_HOST,
        port: parseInt(process.env.DB_READ_PORT) || 3306
      };
      this.slavePool = mysql.createPool(slaveConfig);
      logger.info('数据库读写分离已启用');
    }

    try {
      const connection = await this.masterPool.getConnection();
      await connection.execute('SELECT 1');
      connection.release();
      logger.info('主数据库连接成功');

      if (this.slavePool) {
        const slaveConnection = await this.slavePool.getConnection();
        await slaveConnection.execute('SELECT 1');
        slaveConnection.release();
        logger.info('从数据库连接成功');
      }
    } catch (error) {
      logger.error('数据库连接失败:', error.message);
      throw error;
    }
  }

  async query(sql, params = []) {
    const isReadOnly = this.isReadOnlyQuery(sql);
    
    if (this.isReadWriteSeparation && isReadOnly && this.slavePool) {
      try {
        const [rows] = await this.slavePool.execute(sql, params);
        return rows;
      } catch (error) {
        logger.warn('从库查询失败，切换到主库:', error.message);
        const [rows] = await this.masterPool.execute(sql, params);
        return rows;
      }
    } else {
      const [rows] = await this.masterPool.execute(sql, params);
      return rows;
    }
  }

  async getConnection() {
    return this.masterPool.getConnection();
  }

  async getReadConnection() {
    if (this.isReadWriteSeparation && this.slavePool) {
      try {
        return await this.slavePool.getConnection();
      } catch (error) {
        logger.warn('从库连接失败，使用主库');
        return await this.masterPool.getConnection();
      }
    }
    return await this.masterPool.getConnection();
  }

  isReadOnlyQuery(sql) {
    const upperSql = sql.toUpperCase().trim();
    return upperSql.startsWith('SELECT') || 
           upperSql.startsWith('SHOW') || 
           upperSql.startsWith('DESCRIBE') || 
           upperSql.startsWith('EXPLAIN');
  }

  async close() {
    if (this.masterPool) {
      await this.masterPool.end();
    }
    if (this.slavePool) {
      await this.slavePool.end();
    }
  }

  get pool() {
    return this.masterPool;
  }

  get slave() {
    return this.slavePool;
  }
}

module.exports = new DatabaseReadWrite();