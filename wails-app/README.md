# Wails桌面打包指南

**版本**: v5.0.1  
**更新时间**: 2026-05-16

---

## 简介

Wails 是一款让 Go 开发者能够使用 Web 技术构建桌面应用的框架。本项目使用 Wails 将雨姗AI收银助手打包为原生 Windows 桌面应用。

## 功能特点

- 🚀 原生窗口，性能优秀
- 📦 单文件打包，部署简单
- 🖥️ 系统托盘支持
- 💾 本地数据存储
- 🔒 无需浏览器，直接运行

## 系统要求

- Windows 10 或更高版本
- Go 1.18 或更高版本
- Node.js 18+ (用于前端构建)

## 安装步骤

### 1. 安装 Wails CLI

```bash
go install github.com/wailsapp/wails/v2/cmd/wails@latest
```

### 2. 验证安装

```bash
wails doctor
```

### 3. 安装依赖

```bash
cd wails-app
wails doctor
```

## 构建桌面应用

### 开发模式（热重载）

```bash
cd wails-app
wails dev
```

### 生产构建

```bash
cd wails-app
wails build
```

构建完成后，可执行文件位于 `build/bin/` 目录。

## 项目结构

```
wails-app/
├── main.go              # Go 主程序
├── app.go              # 应用逻辑
├── wails.json          # Wails 配置
├── frontend/           # 前端代码
│   ├── dist/          # 构建输出
│   └── src/           # 源码
└── build/             # 构建配置
    ├── windows/       # Windows 配置
    └── bin/           # 输出目录
```

## 配置说明

### wails.json

```json
{
  "name": "yushan-ai-cashier",
  "outputfilename": "雨姗AI收银助手",
  "version": "5.0.1",
  "frontend:install": "npm install",
  "frontend:build": "npm run build"
}
```

### main.go

主要包含：
- 应用生命周期管理
- 后端服务启动
- API 代理
- 系统托盘配置

## Windows 特定配置

### 窗口配置

```go
Windows: &windows.Options{
    WebviewIsTransparent: false,
    WindowIsTranslucent:  false,
    DisableWindowIcon:     false,
}
```

### Webview2 运行时

应用会自动检测并提示安装 WebView2 运行时：
- Windows 11 已内置
- Windows 10 需要单独安装

## 故障排除

### 常见问题

#### 1. WebView2 未安装

**症状**: 启动应用时报错 "unable to find webview2"

**解决**: 下载安装 [WebView2 运行时](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)

#### 2. 端口占用

**症状**: 后端服务启动失败

**解决**: 修改 `lambda/server.js` 中的端口配置

#### 3. 前端构建失败

**症状**: `wails build` 报错

**解决**: 
```bash
cd frontend
npm install
npm run build
```

## 替代方案

如果无法使用 Wails，仍可使用以下方案：

### 1. Electron 打包

```bash
npm install -g electron
electron-builder
```

### 2. pkg 打包

```bash
npm install -g pkg
pkg lambda/server.js
```

### 3. NSIS 安装包

使用 `build.bat` 生成的 Windows 绿色版

## 下一步

1. 安装 Wails CLI
2. 运行 `wails dev` 测试
3. 使用 `wails build` 打包
4. 分发 `build/bin/` 中的可执行文件

## 参考资料

- [Wails 官方文档](https://wails.io/)
- [Wails GitHub](https://github.com/wailsapp/wails)
- [Go Web 开发](https://gowebexamples.com/)

---

**祝您使用愉快！**
