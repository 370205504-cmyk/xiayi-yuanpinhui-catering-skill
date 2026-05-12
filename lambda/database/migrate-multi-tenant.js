const mysql = require('mysql2/promise');
const crypto = require('crypto');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  });

  console.log('Connected to database');

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'xiayi_restaurant'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE \`${process.env.DB_NAME || 'xiayi_restaurant'}\``);

    console.log('Creating tenants table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        contact_name VARCHAR(50),
        contact_phone VARCHAR(20),
        email VARCHAR(100),
        plan VARCHAR(20) DEFAULT 'basic',
        status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
        settings JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_plan (plan)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Creating tenant_api_keys table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenant_api_keys (
        id VARCHAR(64) PRIMARY KEY,
        tenant_id VARCHAR(64) NOT NULL,
        key_hash VARCHAR(64) NOT NULL,
        key_prefix VARCHAR(16) NOT NULL,
        name VARCHAR(50),
        status ENUM('active', 'revoked') DEFAULT 'active',
        last_used_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        revoked_at TIMESTAMP NULL,
        FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
        UNIQUE INDEX idx_key_hash (key_hash),
        INDEX idx_tenant_id (tenant_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Creating tenant_usage_logs table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tenant_usage_logs (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        tenant_id VARCHAR(64) NOT NULL,
        endpoint VARCHAR(100),
        status_code INT,
        response_time INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tenant_id (tenant_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Creating idempotency table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS idempotency (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        tenant_id VARCHAR(64),
        request_id VARCHAR(128) NOT NULL,
        endpoint VARCHAR(255) NOT NULL,
        response JSON,
        status_code INT,
        expire_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE INDEX idx_tenant_request (tenant_id, request_id),
        INDEX idx_expire_at (expire_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Creating roles table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        description VARCHAR(200),
        tenant_id VARCHAR(64) DEFAULT 'tenant_default',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tenant_id (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Creating permissions table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description VARCHAR(200),
        resource VARCHAR(50),
        action VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Creating role_permissions table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Creating user_roles table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        tenant_id VARCHAR(64) DEFAULT 'tenant_default',
        PRIMARY KEY (user_id, role_id, tenant_id),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        INDEX idx_tenant_id (tenant_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    console.log('Inserting default roles...');
    const defaultRoles = [
      ['admin', '系统管理员', null],
      ['manager', '门店经理', null],
      ['staff', '普通员工', null],
      ['customer', '顾客', null]
    ];

    for (const [name, desc, tenantId] of defaultRoles) {
      await connection.query(`
        INSERT IGNORE INTO roles (name, description, tenant_id) VALUES (?, ?, ?)
      `, [name, desc, tenantId || 'tenant_default']);
    }

    console.log('Inserting default permissions...');
    const defaultPermissions = [
      ['dish:read', '查看菜品', 'dish', 'read'],
      ['dish:write', '编辑菜品', 'dish', 'write'],
      ['dish:delete', '删除菜品', 'dish', 'delete'],
      ['order:read', '查看订单', 'order', 'read'],
      ['order:write', '创建订单', 'order', 'write'],
      ['order:cancel', '取消订单', 'order', 'cancel'],
      ['order:manage', '管理订单', 'order', 'manage'],
      ['queue:read', '查看排队', 'queue', 'read'],
      ['queue:write', '排队取号', 'queue', 'write'],
      ['queue:manage', '管理排队', 'queue', 'manage'],
      ['member:read', '查看会员', 'member', 'read'],
      ['member:write', '编辑会员', 'member', 'write'],
      ['report:read', '查看报表', 'report', 'read'],
      ['settings:read', '查看设置', 'settings', 'read'],
      ['settings:write', '修改设置', 'settings', 'write'],
      ['tenant:manage', '管理租户', 'tenant', 'manage']
    ];

    for (const [name, desc, resource, action] of defaultPermissions) {
      await connection.query(`
        INSERT IGNORE INTO permissions (name, description, resource, action) VALUES (?, ?, ?, ?)
      `, [name, desc, resource, action]);
    }

    console.log('Assigning permissions to roles...');
    const [adminRole] = await connection.query('SELECT id FROM roles WHERE name = ?', ['admin']);
    const [managerRole] = await connection.query('SELECT id FROM roles WHERE name = ?', ['manager']);
    const [staffRole] = await connection.query('SELECT id FROM roles WHERE name = ?', ['staff']);
    const [customerRole] = await connection.query('SELECT id FROM roles WHERE name = ?', ['customer']);

    const adminPermissions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    const managerPermissions = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    const staffPermissions = [1, 4, 5, 8, 9, 11, 14];
    const customerPermissions = [1, 4, 5, 8, 9];

    const assignPermissions = async (roleId, permissions) => {
      for (const permId of permissions) {
        await connection.query(
          'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [roleId, permId]
        );
      }
    };

    if (adminRole?.[0]?.id) await assignPermissions(adminRole[0].id, adminPermissions);
    if (managerRole?.[0]?.id) await assignPermissions(managerRole[0].id, managerPermissions);
    if (staffRole?.[0]?.id) await assignPermissions(staffRole[0].id, staffPermissions);
    if (customerRole?.[0]?.id) await assignPermissions(customerRole[0].id, customerPermissions);

    console.log('Adding tenant_id to existing tables...');
    const tables = ['dishes', 'orders', 'order_items', 'users', 'queues', 'rooms', 'room_reservations', 'events', 'invoices', 'coupons', 'user_coupons'];

    for (const table of tables) {
      try {
        await connection.query(`ALTER TABLE ${table} ADD COLUMN tenant_id VARCHAR(64) DEFAULT 'tenant_default'`);
        console.log(`  Added tenant_id to ${table}`);
      } catch (error) {
        if (!error.message.includes('Duplicate column')) {
          console.log(`  Warning: Could not add tenant_id to ${table}: ${error.message}`);
        }
      }

      try {
        await connection.query(`ALTER TABLE ${table} ADD INDEX idx_tenant_id (tenant_id)`);
      } catch (error) {
        // Index may already exist
      }
    }

    console.log('Creating default tenant...');
    const defaultTenantId = 'tenant_default';
    const defaultApiKey = `sk_${crypto.randomBytes(24).toString('base64url')}`;
    const defaultKeyHash = crypto.createHash('sha256').update(defaultApiKey).digest('hex');
    const defaultKeyPrefix = defaultApiKey.substring(0, 8);

    await connection.query(`
      INSERT IGNORE INTO tenants (id, name, contact_name, plan, status)
      VALUES (?, '默认租户', '系统管理员', 'enterprise', 'active')
    `, [defaultTenantId]);

    await connection.query(`
      INSERT IGNORE INTO tenant_api_keys (id, tenant_id, key_hash, key_prefix, name, status)
      VALUES (?, ?, ?, ?, 'Default Key', 'active')
    `, [`key_${crypto.randomBytes(8).toString('hex')}`, defaultTenantId, defaultKeyHash, defaultKeyPrefix]);

    console.log('\n======================================================');
    console.log('✅ Multi-tenant migration completed successfully!');
    console.log('');
    console.log('Default Tenant ID:', defaultTenantId);
    console.log('Default API Key:', defaultApiKey);
    console.log('');
    console.log('⚠️  Please save the API Key securely!');
    console.log('======================================================\n');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

migrate().catch(console.error);
