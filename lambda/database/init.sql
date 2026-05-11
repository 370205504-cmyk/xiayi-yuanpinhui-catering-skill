-- 夏邑缘品荟创味菜 - 数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS xiayi_restaurant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE xiayi_restaurant;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(64) UNIQUE NOT NULL COMMENT '用户唯一标识',
  phone VARCHAR(20) UNIQUE COMMENT '手机号',
  nickname VARCHAR(50) COMMENT '昵称',
  avatar VARCHAR(255) COMMENT '头像URL',
  openid VARCHAR(64) COMMENT '微信openid',
  role ENUM('user', 'admin') DEFAULT 'user',
  points INT DEFAULT 0 COMMENT '积分',
  balance DECIMAL(10,2) DEFAULT 0.00 COMMENT '余额',
  total_spent DECIMAL(10,2) DEFAULT 0.00 COMMENT '累计消费',
  address TEXT COMMENT '收货地址',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_phone (phone),
  INDEX idx_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 管理员用户（密码: admin123）
INSERT INTO users (user_id, phone, nickname, role) VALUES
('admin001', '13800138000', '系统管理员', 'admin');

-- 菜品分类表
CREATE TABLE IF NOT EXISTS dish_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL COMMENT '分类名称',
  name_en VARCHAR(50) COMMENT '英文名',
  sort_order INT DEFAULT 0 COMMENT '排序',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO dish_categories (name, sort_order) VALUES
('招牌菜', 1),
('特色硬菜', 2),
('宴请首选', 3),
('餐前开胃', 4),
('家常炒菜', 5),
('汤羹主食', 6),
('酒水饮料', 7);

-- 菜品表
CREATE TABLE IF NOT EXISTS dishes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '菜品名称',
  name_en VARCHAR(100) COMMENT '英文名',
  category_id INT COMMENT '分类ID',
  price DECIMAL(10,2) NOT NULL COMMENT '售价',
  original_price DECIMAL(10,2) COMMENT '原价',
  description TEXT COMMENT '描述',
  image VARCHAR(255) COMMENT '图片URL',
  stock INT DEFAULT -1 COMMENT '库存(-1表示不限)',
  stock_warning INT DEFAULT 10 COMMENT '库存预警值',
  ingredients TEXT COMMENT '食材',
  allergens TEXT COMMENT '过敏原',
  spicy_level TINYINT DEFAULT 0 COMMENT '辣度(0-3)',
  is_recommended TINYINT(1) DEFAULT 0 COMMENT '是否推荐',
  is_signature TINYINT(1) DEFAULT 0 COMMENT '是否招牌',
  is_available TINYINT(1) DEFAULT 1 COMMENT '是否上架',
  sort_order INT DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category_id),
  INDEX idx_available (is_available),
  FOREIGN KEY (category_id) REFERENCES dish_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 订单表
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(64) UNIQUE NOT NULL COMMENT '订单号',
  request_id VARCHAR(64) UNIQUE COMMENT '幂等请求ID',
  user_id INT COMMENT '用户ID',
  type ENUM('dine_in', 'takeout', 'delivery') DEFAULT 'dine_in' COMMENT '订单类型',
  status ENUM('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '订单状态',
  payment_status ENUM('unpaid', 'paid', 'refunded') DEFAULT 'unpaid' COMMENT '支付状态',
  total_amount DECIMAL(10,2) NOT NULL COMMENT '商品总价',
  discount_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '优惠金额',
  final_amount DECIMAL(10,2) NOT NULL COMMENT '实付金额',
  points_earned INT DEFAULT 0 COMMENT '获得积分',
  coupon_id INT COMMENT '使用的优惠券ID',
  table_no VARCHAR(20) COMMENT '桌号',
  guest_count INT DEFAULT 1 COMMENT '用餐人数',
  remarks TEXT COMMENT '备注',
  address TEXT COMMENT '配送地址',
  contact_phone VARCHAR(20) COMMENT '联系电话',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_order_no (order_no),
  INDEX idx_request_id (request_id),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 订单明细表
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL COMMENT '订单ID',
  dish_id INT COMMENT '菜品ID',
  dish_name VARCHAR(100) NOT NULL COMMENT '菜品名称',
  quantity INT NOT NULL COMMENT '数量',
  unit_price DECIMAL(10,2) NOT NULL COMMENT '单价',
  subtotal DECIMAL(10,2) NOT NULL COMMENT '小计',
  remarks TEXT COMMENT '口味备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 购物车表
CREATE TABLE IF NOT EXISTS carts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '用户ID',
  dish_id INT NOT NULL COMMENT '菜品ID',
  quantity INT DEFAULT 1 COMMENT '数量',
  remarks TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_dish (user_id, dish_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 优惠券表
CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT '优惠券名称',
  type ENUM('discount', 'cash') DEFAULT 'discount' COMMENT '类型',
  value DECIMAL(10,2) NOT NULL COMMENT '优惠值',
  min_amount DECIMAL(10,2) DEFAULT 0.00 COMMENT '使用门槛',
  max_discount DECIMAL(10,2) COMMENT '最高优惠',
  total_count INT DEFAULT 0 COMMENT '发放数量',
  remain_count INT DEFAULT 0 COMMENT '剩余数量',
  valid_from DATETIME COMMENT '生效时间',
  valid_until DATETIME COMMENT '过期时间',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户优惠券表
CREATE TABLE IF NOT EXISTS user_coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  coupon_id INT NOT NULL,
  status ENUM('unused', 'used', 'expired') DEFAULT 'unused',
  obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (coupon_id) REFERENCES coupons(id) ON DELETE CASCADE,
  INDEX idx_user_status (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 积分记录表
CREATE TABLE IF NOT EXISTS points_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('earn', 'redeem', 'expire') NOT NULL,
  points INT NOT NULL COMMENT '变动积分(正负)',
  balance INT NOT NULL COMMENT '变动后余额',
  source VARCHAR(50) COMMENT '来源(order/refund/activity)',
  order_no VARCHAR(64) COMMENT '关联订单',
  remark VARCHAR(255) COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 充值记录表
CREATE TABLE IF NOT EXISTS recharge_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL COMMENT '充值金额',
  bonus DECIMAL(10,2) DEFAULT 0.00 COMMENT '赠送金额',
  payment_method VARCHAR(20) COMMENT '支付方式',
  transaction_id VARCHAR(64) COMMENT '交易流水号',
  status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 排队叫号表
CREATE TABLE IF NOT EXISTS queues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  queue_no VARCHAR(20) UNIQUE NOT NULL COMMENT '排队号',
  store_id VARCHAR(50) NOT NULL COMMENT '门店ID',
  table_type ENUM('small', 'medium', 'large', '包间') DEFAULT 'small' COMMENT '桌型',
  people INT DEFAULT 1 COMMENT '人数',
  user_id INT COMMENT '用户ID',
  status ENUM('waiting', 'called', 'cancelled', 'served') DEFAULT 'waiting',
  called_at TIMESTAMP NULL COMMENT '叫号时间',
  served_at TIMESTAMP NULL COMMENT '入座时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_store_status (store_id, status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 库存变动记录
CREATE TABLE IF NOT EXISTS stock_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dish_id INT NOT NULL,
  change INT NOT NULL COMMENT '变动数量(正负)',
  reason VARCHAR(100) COMMENT '变动原因',
  operator_id INT COMMENT '操作人',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 通知记录表
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT COMMENT '用户ID(为空则广播)',
  type VARCHAR(50) NOT NULL COMMENT '通知类型',
  title VARCHAR(100) COMMENT '标题',
  content TEXT COMMENT '内容',
  data JSON COMMENT '附加数据',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 管理员操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  admin_id VARCHAR(64) NOT NULL COMMENT '管理员ID',
  operation VARCHAR(100) NOT NULL COMMENT '操作类型',
  detail TEXT COMMENT '操作详情',
  ip VARCHAR(45) NOT NULL COMMENT 'IP地址',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin (admin_id),
  INDEX idx_operation (operation),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
