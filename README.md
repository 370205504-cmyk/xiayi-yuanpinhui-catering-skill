# 夏邑缘品荟智能餐饮系统 v4.0.1

<div align="center">

![Version](https://img.shields.io/badge/version-4.0.1-blue)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-green)
![License](https://img.shields.io/badge/license-MIT-orange)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey)
![Docker](https://img.shields.io/badge/docker-supported-blue)

**夏邑缘品荟智能餐饮系统 - 多租户SaaS餐饮管理系统，支持Windows/Linux/macOS本地部署、Docker部署、云平台部署（腾讯云/阿里云/AWS）、AI Agent接入（MCP协议）**

</div>

---

## 功能特性

### 🍽️ 核心功能

| 功能 | 说明 |
|------|------|
| **多渠道点餐** | 语音点餐、文字聊天、Web/移动端点餐、AI Agent对话 |
| **AI Agent适配** | 支持扣子/龙虾/Dify等AI平台接入，21个MCP标准工具 |
| **智能排队** | 排队叫号、实时进度查询、取消排队 |
| **完整购物车** | 加菜、减菜、口味备注、多人点餐 |
| **订单生命周期** | 待确认→已接单→制作中→已出餐→已完成/已取消 |
| **支付集成** | 微信支付、支付宝、余额支付、扫码支付 |
| **会员系统** | 积分、充值、优惠券、会员等级 |
| **多租户支持** | SaaS架构，支持多门店 |

### 🛠️ 技术特性

| 特性 | 说明 |
|------|------|
| **数据存储** | MySQL + Redis缓存 + 数据库连接池 |
| **安全防护** | Helmet + CSRF + XSS + API限流 |
| **响应式界面** | 移动端点餐、管理后台、顾客端 |
| **打印服务** | ESC/POS热敏打印机自动打印 |
| **跨平台部署** | Windows、Linux、macOS、Docker |
| **云平台支持** | 腾讯云、阿里云、AWS |

---

## 快速开始

### ⚡ 最快的方式 - 3步启动

#### 方式1: 演示模式（无需数据库，10秒启动）

```bash
# Windows
# 双击 start-demo.bat

# Linux / macOS
./start.sh demo
```

#### 方式2: Docker部署（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill.git
cd xiayi-yuanpinhui-catering-skill

# 2. 启动（自动包含MySQL和Redis）
docker-compose up -d

# 3. 访问
# 顾客端: http://localhost:3000
# 管理后台: http://localhost:3000/admin
```

#### 方式3: 本地部署

| 平台 | 命令 |
|------|------|
| Windows | 双击 `install.bat` → 双击 `start.bat` |
| Linux / macOS | `./start.sh` |

---

## 支持的部署方式

### 💻 本地部署（全平台）

| 平台 | 支持 | 说明 |
|------|------|------|
| Windows | ✅ | 一键启动脚本 |
| Linux | ✅ | Shell脚本 + Systemd |
| macOS | ✅ | Shell脚本 + Launchd |

### 🐳 Docker部署

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

### ☁️ 云平台部署

| 云平台 | 部署脚本 | 推荐方式 |
|--------|----------|----------|
| 腾讯云 | `deploy-tencent.sh` | 轻量应用服务器 + Docker |
| 阿里云 | `deploy-aliyun.sh` | ECS + Docker |
| AWS | `deploy-aws.sh` | EC2 + Docker |

---

## 详细文档

- [部署指南](./docs/DEPLOYMENT.md) - 完整部署文档
- [API文档](./docs/API.md) - API接口文档
- [Windows使用指南](./WINDOWS使用指南.md) - Windows用户专享
- [贡献指南](./CONTRIBUTING.md) - 开发者指南

---

## 访问地址

启动后访问以下地址:

| 服务 | 地址 | 说明 |
|------|------|------|
| 顾客端 | http://localhost:3000 | 普通顾客点餐 |
| 移动端 | http://localhost:3000/mobile | 手机扫码点餐 |
| 管理后台 | http://localhost:3000/admin | 餐厅管理后台 |
| API文档 | http://localhost:3000/api/v1/docs | API接口文档 |

### 测试账号

| 角色 | 手机号 | 密码 |
|------|--------|------|
| 管理员 | admin@xiayi.com | admin123 |
| 测试用户 | 13800138000 | 123456 |

---

## 项目结构

```
xiayi-yuanpinhui-catering-skill/
├── lambda/                  # 后端服务
│   ├── server.js           # 主服务入口
│   ├── demo-server.js      # 演示服务器
│   ├── routes/             # API路由
│   ├── controllers/        # 控制器
│   ├── database/           # 数据库相关
│   └── web/                # 前端页面
├── docs/                   # 文档
│   └── DEPLOYMENT.md       # 部署文档
├── nginx/                  # Nginx配置
├── scripts/                # 辅助脚本
├── .env.example            # 环境变量示例
├── .gitignore
├── Dockerfile              # Docker配置
├── docker-compose.yml      # Docker Compose配置
├── install.bat             # Windows安装脚本
├── start.bat               # Windows启动脚本
├── start-demo.bat          # Windows演示模式启动
├── stop.bat                # Windows停止脚本
├── start.sh                # Linux/macOS启动脚本
├── stop.sh                 # Linux/macOS停止脚本
├── deploy-tencent.sh       # 腾讯云部署脚本
├── deploy-aliyun.sh        # 阿里云部署脚本
├── deploy-aws.sh           # AWS部署脚本
└── README.md
```

---

## 命令速查

### 本地开发

```bash
# Windows
install.bat                 # 安装依赖
start.bat                   # 启动
start-demo.bat              # 演示模式
stop.bat                    # 停止

# Linux / macOS
./start.sh                  # 启动
./start.sh dev              # 开发模式
./start.sh demo             # 演示模式
./stop.sh                   # 停止
```

### Docker

```bash
docker-compose up -d        # 启动
docker-compose logs -f      # 查看日志
docker-compose down         # 停止
docker-compose restart      # 重启
```

---

## 常见问题

### Q: 演示模式数据会丢失吗？

A: 是的，演示模式使用内存数据库，重启后数据会清空。如需持久化，请使用完整模式。

### Q: 如何修改端口？

A: 编辑 `.env` 文件，修改 `PORT` 变量即可。

### Q: 支持哪些支付方式？

A: 支持微信支付、支付宝。需要配置商户号和密钥。

更多问题请查看 [部署指南](./docs/DEPLOYMENT.md) 或提交 Issue。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js + Express |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis 7 |
| 容器化 | Docker + Docker Compose |
| 前端 | 原生 HTML/CSS/JavaScript |
| 协议 | MCP (Model Context Protocol) |

---

## 更新日志

详见 [CHANGELOG.md](./CHANGELOG.md)

---

## 贡献指南

欢迎贡献代码！请先阅读 [贡献指南](./CONTRIBUTING.md)

---

## 许可证

MIT License - 详见 [LICENSE](./LICENSE)

---

## 获取帮助

- GitHub Issues: https://github.com/370205504-cmyk/xiayi-yuanpinhui-catering-skill/issues
- 详细文档: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

---

<div align="center">
Made with ❤️ by 夏邑缘品荟
</div>
