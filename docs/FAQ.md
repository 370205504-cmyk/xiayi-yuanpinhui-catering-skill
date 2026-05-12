# 夏邑缘品荟智能餐饮系统 - 常见问题解答

## 目录

1. [安装部署](#安装部署)
2. [配置问题](#配置问题)
3. [数据迁移](#数据迁移)
4. [支付配置](#支付配置)
5. [安全问题](#安全问题)
6. [性能问题](#性能问题)
7. [接口问题](#接口问题)
8. [打印服务](#打印服务)
9. [常见错误](#常见错误)
10. [其他问题](#其他问题)

---

## 安装部署

### Q1: 如何安装依赖？

```bash
cd lambda
npm install
```

### Q2: 如何初始化数据库？

```bash
# 确保已配置 .env 文件
npm run migrate
```

### Q3: 如何导入示例数据？

```bash
npm run import-sample
```

### Q4: 如何启动开发服务器？

```bash
npm run dev
```

### Q5: 如何在生产环境运行？

```bash
# 设置环境变量
export NODE_ENV=production

# 使用 PM2 启动
pm2 start server.js --name "yuanpinhui"
```

### Q6: Docker部署失败怎么办？

**可能原因**：
- 端口被占用
- 数据库连接失败
- 权限不足

**解决方案**：
```bash
# 检查端口
netstat -tlnp | grep 3000

# 查看容器日志
docker logs <container_id>

# 确保数据库服务正常运行
docker-compose up -d db
```

---

## 配置问题

### Q1: .env 文件在哪里？

项目根目录下的 `.env` 文件，可从 `.env.example` 复制：

```bash
cp .env.example .env
```

### Q2: JWT_SECRET 如何生成？

```bash
# 生成32位随机密钥
openssl rand -hex 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Q3: 如何配置数据库连接？

在 `.env` 文件中配置：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=xiayi_restaurant
```

### Q4: Redis配置需要注意什么？

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
```

**注意**：生产环境必须设置 Redis 密码。

### Q5: 如何配置跨域白名单？

```env
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Q6: 如何配置微信支付？

```env
WECHAT_APPID=your_appid
WECHAT_SECRET=your_secret
WECHAT_MCHID=your_mchid
WECHAT_APIKEY=your_apikey
WECHAT_PAY_NOTIFY_URL=https://your-domain.com/api/v1/payment/wechat/callback
```

---

## 数据迁移

### Q1: 迁移失败怎么办？

**可能原因**：
- 数据库连接失败
- SQL语法错误
- 表已存在

**解决方案**：
```bash
# 检查数据库连接
mysql -h localhost -u root -p

# 查看迁移脚本
cat lambda/database/migrate.js

# 手动执行迁移SQL
mysql -u root -p xiayi_restaurant < migrate.sql
```

### Q2: 如何备份数据库？

```bash
# 手动备份
npm run backup

# 自动备份（每天凌晨3点）
# 已在 server.js 中配置 cron 任务
```

### Q3: 如何恢复备份？

```bash
POST /api/v1/restore
Content-Type: application/json

{
  "filename": "backup_20260115.sql"
}
```

### Q4: 测试账号密码是什么？

- 手机号：13800138000
- 密码：123456
- ⚠️ 首次登录必须修改密码

---

## 支付配置

### Q1: 微信支付回调失败？

**常见原因**：
- 回调URL不可访问（需要公网HTTPS）
- 签名验证失败
- 证书配置错误

**排查步骤**：
1. 检查 `WECHAT_PAY_NOTIFY_URL` 配置
2. 确保服务器可以被外网访问
3. 检查日志 `logs/payment.log`

### Q2: 支付宝配置需要什么？

```env
ALIPAY_APPID=your_appid
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=your_public_key
ALIPAY_NOTIFY_URL=https://your-domain.com/api/v1/payment/alipay/callback
```

### Q3: 支付成功但订单状态未更新？

**可能原因**：
- 回调接口未正确处理
- 数据库事务失败
- 网络延迟

**解决方案**：
```bash
# 检查支付日志
cat logs/payment.log

# 手动更新订单状态
UPDATE orders SET status = 'completed' WHERE order_no = 'ORD20260115001';
```

---

## 安全问题

### Q1: 如何修改默认密码？

```bash
# 通过API修改
PUT /api/v1/auth/password
Authorization: Bearer <token>

{
  "oldPassword": "123456",
  "newPassword": "New@1234"
}
```

### Q2: 如何启用API签名验证？

```env
# 设置签名密钥
SIGNING_SECRET=your_signing_secret
```

### Q3: 如何防止暴力破解？

系统已内置限流：
- 登录：5次/分钟
- 注册：3次/分钟
- 通用API：100次/分钟

### Q4: 如何配置IP黑名单？

```env
BLOCKED_IPS=192.168.1.100,10.0.0.50
```

### Q5: 如何检查安全漏洞？

```bash
# 依赖安全扫描
npm audit

# ESLint检查
npm run lint
```

---

## 性能问题

### Q1: 接口响应慢？

**可能原因**：
- 数据库查询慢
- 缓存未命中
- 内存不足

**排查步骤**：
```bash
# 检查慢查询日志
mysql> SHOW SLOW QUERIES;

# 检查Redis状态
redis-cli INFO stats

# 检查内存使用
free -h
```

**优化建议**：
- 添加数据库索引
- 优化查询语句
- 增加缓存命中率

### Q2: 数据库连接耗尽？

**解决方案**：
```env
# 配置连接池大小
DB_POOL_MIN=10
DB_POOL_MAX=50
```

### Q3: 如何启用Gzip压缩？

已在 `server.js` 中启用：
```javascript
app.use(compression());
```

### Q4: 如何实现读写分离？

需要配置主从数据库：
```env
DB_HOST=master.example.com
DB_READ_HOST=slave.example.com
```

---

## 接口问题

### Q1: 接口返回401错误？

**原因**：Token无效或过期

**解决方案**：
```bash
# 重新登录获取Token
POST /api/v1/auth/login

# 或使用Refresh Token刷新
POST /api/v1/auth/refresh
```

### Q2: 接口返回403错误？

**原因**：权限不足

**解决方案**：
- 检查用户角色
- 确认是否需要管理员权限

### Q3: 接口返回429错误？

**原因**：请求过于频繁

**解决方案**：
- 等待限流时间结束
- 优化请求频率

### Q4: 如何调试API？

```bash
# 使用 curl 测试
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","password":"123456"}'

# 查看API日志
cat logs/access.log
```

### Q5: 如何获取完整的API文档？

```bash
# 查看在线文档
http://localhost:3000/api-docs

# 查看Markdown文档
cat docs/API_DETAIL.md
```

---

## 打印服务

### Q1: 打印机连接失败？

**可能原因**：
- 打印机未开启
- 网络连接问题
- 驱动未安装

**排查步骤**：
```bash
# 检查打印机状态
lpstat -p

# 测试打印
echo "Test Print" | lp -d <printer_name>
```

### Q2: 订单不自动打印？

**检查项**：
- 打印服务是否启动
- 订单状态是否正确
- 打印机是否有纸

### Q3: 如何配置多个打印机？

在 `.env` 中配置：
```env
PRINTER_KITCHEN=kitchen_printer
PRINTER_FRONT=front_printer
```

---

## 常见错误

### ENOENT: no such file or directory

**原因**：缺少必要的目录或文件

**解决方案**：
```bash
# 创建缺失的目录
mkdir -p lambda/logs
mkdir -p lambda/uploads
```

### ER_ACCESS_DENIED_ERROR

**原因**：数据库用户名或密码错误

**解决方案**：
```bash
# 检查 .env 配置
cat .env | grep DB_

# 验证数据库连接
mysql -h localhost -u <user> -p
```

### Redis connection failed

**原因**：Redis未启动或配置错误

**解决方案**：
```bash
# 启动Redis
systemctl start redis

# 检查配置
cat .env | grep REDIS_
```

### TokenExpiredError

**原因**：JWT Token过期

**解决方案**：
```bash
# 使用Refresh Token刷新
POST /api/v1/auth/refresh

{
  "refreshToken": "your_refresh_token"
}
```

### ENOSPC: no space left on device

**原因**：磁盘空间不足

**解决方案**：
```bash
# 检查磁盘使用
df -h

# 清理日志文件
rm -rf lambda/logs/*.log
```

---

## 其他问题

### Q1: 如何更新代码？

```bash
# 拉取最新代码
git pull origin main

# 安装新依赖
npm install

# 重启服务
pm2 restart yuanpinhui
```

### Q2: 如何查看服务状态？

```bash
# 使用PM2
pm2 status
pm2 logs yuanpinhui

# 或直接查看日志
tail -f lambda/logs/access.log
```

### Q3: 如何修改端口？

```env
PORT=8080
```

### Q4: 如何配置HTTPS？

**方案1**: 使用反向代理（Nginx）
```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**方案2**: 在应用层配置（不推荐）

### Q5: 如何添加新菜品？

```bash
POST /api/v1/dishes/dish
Authorization: Bearer <admin_token>

{
  "name": "新菜品",
  "category": "招牌菜",
  "price": 68.00,
  "stock": 100,
  "description": "美味可口"
}
```

### Q6: 如何关闭调试模式？

```env
NODE_ENV=production
```

### Q7: 如何查看订单统计？

```bash
GET /api/v1/analytics/revenue?startDate=2026-01-01&endDate=2026-01-31
Authorization: Bearer <admin_token>
```

---

## 联系支持

如果以上问题未解决，可通过以下方式联系：

- **GitHub Issues**: https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill/issues
- **开发者**: 石中伟