#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

console.log('🍜 初始化SQLite数据库（完整版）...\n');

const dbPath = path.join(__dirname, 'data', 'cashier.db');
const dataDir = path.join(__dirname, 'data');

// 删除旧数据库
if (fs.existsSync(dbPath)) {
  console.log('🗑️ 删除旧数据库文件...');
  fs.unlinkSync(dbPath);
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

console.log('📦 创建数据表...');

db.exec(`
  -- 门店表
  CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    short_name TEXT,
    district TEXT,
    area TEXT,
    address TEXT NOT NULL,
    phone TEXT,
    business_hours TEXT,
    lat REAL,
    lng REAL,
    image TEXT,
    description TEXT,
    features TEXT,
    table_count INTEGER DEFAULT 0,
    has_wifi INTEGER DEFAULT 1,
    wifi_name TEXT,
    wifi_password TEXT,
    has_parking INTEGER DEFAULT 0,
    parking_info TEXT,
    can_deliver INTEGER DEFAULT 0,
    delivery_range INTEGER DEFAULT 3,
    can_reserve INTEGER DEFAULT 0,
    has_printer INTEGER DEFAULT 0,
    printer_model TEXT,
    has_self_order INTEGER DEFAULT 1,
    rating REAL DEFAULT 4.5,
    status TEXT DEFAULT 'active',
    is_default INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 门店设置表
  CREATE TABLE IF NOT EXISTS store_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, setting_key)
  );

  -- 用户门店偏好表
  CREATE TABLE IF NOT EXISTS user_store_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    current_store_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 全局支付配置表
  CREATE TABLE IF NOT EXISTS payment_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER,
    config_type TEXT NOT NULL,
    app_id TEXT,
    app_secret TEXT,
    mch_id TEXT,
    mch_key TEXT,
    cert_path TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 活动/公告表
  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER,
    title TEXT NOT NULL,
    content TEXT,
    image TEXT,
    type TEXT DEFAULT 'notice',
    start_time DATETIME,
    end_time DATETIME,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 外卖配送表
  CREATE TABLE IF NOT EXISTS delivery_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    store_id INTEGER NOT NULL,
    rider_name TEXT,
    rider_phone TEXT,
    status TEXT DEFAULT 'pending',
    estimated_arrival DATETIME,
    actual_arrival DATETIME,
    delivery_address TEXT NOT NULL,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    delivery_fee REAL DEFAULT 0,
    distance REAL,
    tips REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 发票记录表
  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT NOT NULL,
    store_id INTEGER,
    user_id TEXT,
    invoice_type TEXT NOT NULL,
    invoice_title TEXT NOT NULL,
    tax_number TEXT,
    company_address TEXT,
    company_phone TEXT,
    bank_name TEXT,
    bank_account TEXT,
    amount REAL NOT NULL,
    items TEXT,
    status TEXT DEFAULT 'pending',
    pdf_url TEXT,
    email TEXT,
    phone TEXT,
    remark TEXT,
    issued_at DATETIME,
    sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 打印配置表
  CREATE TABLE IF NOT EXISTS printer_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    store_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    model TEXT,
    type TEXT DEFAULT 'receipt',
    ip_address TEXT,
    port INTEGER DEFAULT 9100,
    serial_port TEXT,
    baud_rate INTEGER DEFAULT 115200,
    paper_width INTEGER DEFAULT 80,
    is_enabled INTEGER DEFAULT 1,
    is_default INTEGER DEFAULT 0,
    auto_print_order INTEGER DEFAULT 1,
    auto_print_payment INTEGER DEFAULT 1,
    auto_print_kitchen INTEGER DEFAULT 1,
    config TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 消息队列表
  CREATE TABLE IF NOT EXISTS message_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_name TEXT NOT NULL,
    message_type TEXT NOT NULL,
    payload TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 5,
    last_error TEXT,
    available_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 系统监控表
  CREATE TABLE IF NOT EXISTS system_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value REAL,
    unit TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 告警规则表
  CREATE TABLE IF NOT EXISTS alert_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    metric_name TEXT NOT NULL,
    condition TEXT NOT NULL,
    threshold REAL NOT NULL,
    duration INTEGER DEFAULT 60,
    level TEXT DEFAULT 'warning',
    channels TEXT,
    is_enabled INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 告警记录表
  CREATE TABLE IF NOT EXISTS alert_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id INTEGER,
    alert_name TEXT NOT NULL,
    level TEXT NOT NULL,
    message TEXT NOT NULL,
    details TEXT,
    is_resolved INTEGER DEFAULT 0,
    resolved_at DATETIME,
    resolved_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 数据库备份记录表
  CREATE TABLE IF NOT EXISTS backup_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    backup_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    checksum TEXT,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 用户表
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    phone TEXT,
    nickname TEXT,
    avatar TEXT,
    openid TEXT,
    role TEXT DEFAULT 'user',
    points INTEGER DEFAULT 0,
    balance REAL DEFAULT 0.0,
    total_spent REAL DEFAULT 0.0,
    address TEXT,
    password_changed INTEGER DEFAULT 0,
    last_password_change DATETIME,
    last_login DATETIME,
    login_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 菜品分类表
  CREATE TABLE IF NOT EXISTS dish_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_en TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 菜品表
  CREATE TABLE IF NOT EXISTS dishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_en TEXT,
    category_id INTEGER,
    category TEXT,
    price REAL NOT NULL,
    price_unit TEXT DEFAULT '元/份',
    original_price REAL,
    description TEXT,
    image TEXT,
    stock INTEGER DEFAULT -1,
    stock_warning INTEGER DEFAULT 10,
    ingredients TEXT,
    allergens TEXT,
    spicy_level INTEGER DEFAULT 0,
    is_recommended INTEGER DEFAULT 0,
    is_signature INTEGER DEFAULT 0,
    is_available INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 订单表
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    request_id TEXT UNIQUE,
    user_id INTEGER,
    store_id INTEGER,
    type TEXT DEFAULT 'dine_in',
    status TEXT DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',
    total_amount REAL NOT NULL,
    discount_amount REAL DEFAULT 0.0,
    final_amount REAL NOT NULL,
    points_earned INTEGER DEFAULT 0,
    coupon_id INTEGER,
    table_no TEXT,
    guest_count INTEGER DEFAULT 1,
    remarks TEXT,
    address TEXT,
    contact_phone TEXT,
    pay_expire_at DATETIME,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 订单明细表
  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    dish_id INTEGER,
    dish_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 购物车表
  CREATE TABLE IF NOT EXISTS carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    dish_id INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, dish_id)
  );

  -- 优惠券表
  CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'discount',
    value REAL NOT NULL,
    min_amount REAL DEFAULT 0.0,
    max_discount REAL,
    total_count INTEGER DEFAULT 0,
    remain_count INTEGER DEFAULT 0,
    valid_from DATETIME,
    valid_until DATETIME,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 用户优惠券表
  CREATE TABLE IF NOT EXISTS user_coupons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coupon_id INTEGER NOT NULL,
    status TEXT DEFAULT 'unused',
    obtained_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used_at DATETIME
  );

  -- 积分记录表
  CREATE TABLE IF NOT EXISTS points_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    points INTEGER NOT NULL,
    balance INTEGER NOT NULL,
    source TEXT,
    order_no TEXT,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 充值记录表
  CREATE TABLE IF NOT EXISTS recharge_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    bonus REAL DEFAULT 0.0,
    payment_method TEXT,
    transaction_id TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 排队叫号表
  CREATE TABLE IF NOT EXISTS queues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_no TEXT UNIQUE NOT NULL,
    store_id TEXT NOT NULL,
    table_type TEXT DEFAULT 'small',
    people INTEGER DEFAULT 1,
    user_id INTEGER,
    status TEXT DEFAULT 'waiting',
    wait_count INTEGER DEFAULT 1,
    estimated_time INTEGER DEFAULT 0,
    note TEXT,
    called_at DATETIME,
    served_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 系统设置表
  CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 库存变动记录表
  CREATE TABLE IF NOT EXISTS stock_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dish_id INTEGER NOT NULL,
    change INTEGER NOT NULL,
    reason TEXT,
    operator_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 通知记录表
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    type TEXT NOT NULL,
    title TEXT,
    content TEXT,
    data TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 管理员操作日志表
  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id TEXT NOT NULL,
    admin_name TEXT,
    operation TEXT NOT NULL,
    detail TEXT,
    ip TEXT NOT NULL,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 管理员角色表
  CREATE TABLE IF NOT EXISTS admin_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'cashier',
    permissions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 历史订单归档表
  CREATE TABLE IF NOT EXISTS orders_archive (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    original_id INTEGER NOT NULL,
    order_no TEXT NOT NULL,
    request_id TEXT,
    user_id INTEGER,
    store_id INTEGER,
    type TEXT,
    status TEXT,
    payment_status TEXT,
    total_amount REAL NOT NULL,
    discount_amount REAL DEFAULT 0.0,
    final_amount REAL NOT NULL,
    points_earned INTEGER DEFAULT 0,
    coupon_id INTEGER,
    table_no TEXT,
    guest_count INTEGER DEFAULT 1,
    remarks TEXT,
    address TEXT,
    contact_phone TEXT,
    pay_expire_at DATETIME,
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    archived_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 退款记录表
  CREATE TABLE IF NOT EXISTS refunds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    refund_no TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    fail_reason TEXT,
    refund_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 管理员账号表（兼容旧格式）
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'cashier',
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('✅ 数据表创建完成\n');

console.log('📝 插入示例数据...');

// 插入门店数据
const stores = [
  { 
    name: '雨姗AI收银助手创味菜 - 旗舰店', 
    short_name: '旗舰店', 
    district: '县城', 
    area: '县中心商业区', 
    address: '河南省商丘市县府前路188号', 
    phone: '0370-628-9999', 
    business_hours: '09:00-22:00', 
    lat: 34.2334, 
    lng: 116.1298, 
    features: JSON.stringify(['旗舰店','面积最大','菜品最全','有VIP包间','支持外卖','支持婚宴','WiFi覆盖','打印服务','自主下单']), 
    table_count: 35, 
    has_wifi: 1, 
    wifi_name: 'XYYP_005_VIP', 
    wifi_password: '99999999', 
    has_parking: 1, 
    can_deliver: 1, 
    delivery_range: 6, 
    can_reserve: 1, 
    has_self_order: 1, 
    rating: 4.9, 
    is_default: 1, 
    sort_order: 1 
  }
];

const insertStore = db.prepare(`
  INSERT INTO stores (name, short_name, district, area, address, phone, business_hours, lat, lng, features, table_count, has_wifi, wifi_name, wifi_password, has_parking, can_deliver, delivery_range, can_reserve, has_self_order, rating, is_default, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

stores.forEach(store => {
  insertStore.run(
    store.name, store.short_name, store.district, store.area, store.address,
    store.phone, store.business_hours, store.lat, store.lng, store.features,
    store.table_count, store.has_wifi, store.wifi_name, store.wifi_password,
    store.has_parking, store.can_deliver, store.delivery_range, store.can_reserve,
    store.has_self_order, store.rating, store.is_default, store.sort_order
  );
});

console.log('✅ 门店数据插入完成');

// 插入门店设置
const storeSettings = [
  { store_id: 1, key: 'power_bank_available', value: '1', description: '是否有充电宝服务' },
  { store_id: 1, key: 'power_bank_brand', value: '街电', description: '充电宝品牌' },
  { store_id: 1, key: 'pet_friendly', value: '0', description: '是否允许宠物' },
  { store_id: 1, key: 'kids_friendly', value: '1', description: '是否提供儿童服务' },
  { store_id: 1, key: 'kids_high_chair', value: '1', description: '是否有儿童椅' },
  { store_id: 1, key: 'invoice_available', value: '1', description: '是否可开发票' },
  { store_id: 1, key: 'invoice_type', value: '增值税普通发票', description: '发票类型' },
  { store_id: 1, key: 'takeout_available', value: '1', description: '是否支持打包' },
  { store_id: 1, key: 'takeout_fee', value: '0', description: '打包费' },
  { store_id: 1, key: 'minimum_order', value: '20', description: '最低起送价' },
  { store_id: 1, key: 'delivery_fee', value: '3', description: '配送费' }
];

const insertSetting = db.prepare('INSERT INTO store_settings (store_id, setting_key, setting_value, description) VALUES (?, ?, ?, ?)');
storeSettings.forEach(setting => {
  insertSetting.run(setting.store_id, setting.key, setting.value, setting.description);
});

console.log('✅ 门店设置插入完成');

// 插入公告
const announcements = [
  { title: '开业优惠', content: '雨姗AI收银助手创味菜旗舰店开业啦！全场8.8折，满100送20优惠券', type: 'promotion', is_active: 1, sort_order: 1 },
  { title: '温馨提示', content: '尊敬的顾客，本店提供免费WiFi和充电宝服务', type: 'notice', is_active: 1, sort_order: 2 },
  { title: '会员日活动', content: '每周三会员日，会员消费双倍积分', type: 'activity', is_active: 1, sort_order: 3 }
];

const insertAnnouncement = db.prepare('INSERT INTO announcements (title, content, type, is_active, sort_order) VALUES (?, ?, ?, ?, ?)');
announcements.forEach(announcement => {
  insertAnnouncement.run(announcement.title, announcement.content, announcement.type, announcement.is_active, announcement.sort_order);
});

console.log('✅ 公告数据插入完成');

// 插入菜品分类
const categories = [
  { name: '招牌菜', sort_order: 1 },
  { name: '特色硬菜', sort_order: 2 },
  { name: '宴请首选菜', sort_order: 3 },
  { name: '餐前开胃菜', sort_order: 4 },
  { name: '家常炒菜', sort_order: 5 },
  { name: '汤羹主食', sort_order: 6 },
  { name: '酒水饮料', sort_order: 7 }
];

const insertCategory = db.prepare('INSERT INTO dish_categories (name, sort_order) VALUES (?, ?)');
categories.forEach(cat => {
  insertCategory.run(cat.name, cat.sort_order);
});

console.log('✅ 菜品分类插入完成');

// 插入菜品数据
const dishes = [
  // 招牌菜
  { category_id: 1, category: '招牌菜', name: '招牌大鱼头泡饭', price: 88, price_unit: '元/份', description: '雨姗AI收银助手头牌菜，桌桌必点，配米饭一份', is_recommended: 1, is_signature: 1, sort_order: 1 },
  { category_id: 1, category: '招牌菜', name: '招牌烧肉', price: 58, price_unit: '元/份', description: '肥而不腻，软糯香甜，特别推荐', is_recommended: 1, is_signature: 1, sort_order: 2 },
  { category_id: 1, category: '招牌菜', name: '酱焖娃娃鱼', price: 198, price_unit: '元/份', description: '新鲜现杀，配米饭一份', is_recommended: 1, is_signature: 1, sort_order: 3 },
  { category_id: 1, category: '招牌菜', name: '酱爆萝卜糕', price: 36, price_unit: '元/份', description: '手工自制，藏着烟火的温暖，松软鲜美，咸香味美', is_recommended: 0, is_signature: 1, sort_order: 4 },
  
  // 特色硬菜
  { category_id: 2, category: '特色硬菜', name: '黄焖大甲鱼', price: 238, price_unit: '元/份', description: '来自中国甲鱼之乡，吃甲鱼有面子，宴请必吃，3斤左右', is_recommended: 1, sort_order: 1 },
  { category_id: 2, category: '特色硬菜', name: '甲鱼焖柴鸡', price: 98, price_unit: '元/份', description: '来自中国甲鱼之乡，吃甲鱼有面子', is_recommended: 1, sort_order: 2 },
  { category_id: 2, category: '特色硬菜', name: '加鲍鱼', price: 8, price_unit: '元/只', description: '可加鲍鱼搭配甲鱼', is_recommended: 0, sort_order: 3 },
  { category_id: 2, category: '特色硬菜', name: '香辣酥排骨', price: 69, price_unit: '元/份', description: '特别推荐，够辣够味够香', is_recommended: 1, spicy_level: 2, sort_order: 4 },
  { category_id: 2, category: '特色硬菜', name: '枣香鳗鱼捞饭', price: 198, price_unit: '元/份', description: '特别推荐，畅销菜', is_recommended: 1, sort_order: 5 },
  { category_id: 2, category: '特色硬菜', name: '秦川辣子牛肉', price: 69, price_unit: '元/份', description: '特别推荐，够辣够味够香', is_recommended: 1, spicy_level: 3, sort_order: 6 },
  { category_id: 2, category: '特色硬菜', name: '地锅馍炒鸡', price: 58, price_unit: '元/份', description: '特别推荐，畅销菜', is_recommended: 1, sort_order: 7 },
  { category_id: 2, category: '特色硬菜', name: '大刀肉炒辣椒', price: 46, price_unit: '元/份', description: '特别推荐，很辣很爽', is_recommended: 1, spicy_level: 3, sort_order: 8 },
  
  // 家常炒菜
  { category_id: 5, category: '家常炒菜', name: '清炒时蔬', price: 28, price_unit: '元/份', description: '当季新鲜蔬菜，健康美味', is_recommended: 0, sort_order: 1 },
  { category_id: 5, category: '家常炒菜', name: '鱼香肉丝', price: 32, price_unit: '元/份', description: '经典川菜，酸甜适口', is_recommended: 1, sort_order: 2 },
  { category_id: 5, category: '家常炒菜', name: '宫保鸡丁', price: 35, price_unit: '元/份', description: '麻辣鲜香，花生酥脆', is_recommended: 1, spicy_level: 2, sort_order: 3 },
  
  // 汤羹主食
  { category_id: 6, category: '汤羹主食', name: '米饭', price: 2, price_unit: '元/碗', description: '东北五常大米，粒粒饱满', is_recommended: 0, sort_order: 1 },
  { category_id: 6, category: '汤羹主食', name: '番茄蛋花汤', price: 18, price_unit: '元/份', description: '酸甜可口，开胃解腻', is_recommended: 0, sort_order: 2 },
  { category_id: 6, category: '汤羹主食', name: '紫菜蛋花汤', price: 16, price_unit: '元/份', description: '清淡鲜美，营养丰富', is_recommended: 0, sort_order: 3 },
  
  // 酒水饮料
  { category_id: 7, category: '酒水饮料', name: '可口可乐', price: 6, price_unit: '元/听', description: '经典可乐，畅爽一下', is_recommended: 0, sort_order: 1 },
  { category_id: 7, category: '酒水饮料', name: '雪碧', price: 6, price_unit: '元/听', description: '清爽柠檬味', is_recommended: 0, sort_order: 2 },
  { category_id: 7, category: '酒水饮料', name: '鲜榨橙汁', price: 18, price_unit: '元/杯', description: '新鲜橙子现榨', is_recommended: 1, sort_order: 3 }
];

const insertDish = db.prepare(`
  INSERT INTO dishes (category_id, category, name, price, price_unit, description, is_recommended, is_signature, spicy_level, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

dishes.forEach(dish => {
  insertDish.run(
    dish.category_id, dish.category, dish.name, dish.price, dish.price_unit,
    dish.description, dish.is_recommended, dish.is_signature, dish.spicy_level || 0,
    dish.sort_order
  );
});

console.log('✅ 菜品数据插入完成');

// 创建管理员账号
const hashedPassword = bcrypt.hashSync('admin123', 10);

db.prepare('INSERT OR IGNORE INTO admin_users (username, password, role, name) VALUES (?, ?, ?, ?)')
  .run('admin', hashedPassword, 'super_admin', '系统管理员');

db.prepare('INSERT OR IGNORE INTO users (user_id, nickname, role) VALUES (?, ?, ?)')
  .run('admin001', '系统管理员', 'admin');

db.prepare('INSERT OR IGNORE INTO admin_roles (user_id, role) VALUES (?, ?)')
  .run('admin001', 'super_admin');

console.log('✅ 管理员账号创建完成\n');

db.close();

console.log('========================================');
console.log('✅ SQLite数据库初始化完成！');
console.log('========================================');
console.log('');
console.log('📊 初始化数据统计：');
console.log(`   • 门店数量：${stores.length} 个`);
console.log(`   • 菜品分类：${categories.length} 个`);
console.log(`   • 菜品数量：${dishes.length} 个`);
console.log(`   • 公告数量：${announcements.length} 个`);
console.log('');
console.log('🔐 管理员账号：');
console.log('   用户名：admin');
console.log('   密码：admin123');
console.log('   ⚠️  首次登录后请修改密码！');
console.log('');
console.log('📁 数据库文件位置：');
console.log(`   ${dbPath}`);
console.log('');
console.log('========================================');
