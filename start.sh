#!/bin/bash

echo "═══════════════════════════════════════════════════════════"
echo "🍽️  夏邑缘品荟创味菜 - 一键启动脚本"
echo "═══════════════════════════════════════════════════════════"

if [ ! -f "lambda/package.json" ]; then
    echo "❌ 错误: 未找到 lambda/package.json"
    echo "请在项目根目录运行此脚本"
    exit 1
fi

if [ ! -d "lambda/node_modules" ]; then
    echo "📦 正在安装依赖..."
    cd lambda && npm install
    cd ..
else
    echo "✅ 依赖已安装"
fi

echo ""
echo "🚀 启动服务..."
echo ""

if [ "$1" == "dev" ]; then
    echo "🔧 开发模式启动 (nodemon)"
    cd lambda && npx nodemon server.js
else
    echo "📱 生产模式启动"
    cd lambda && node server.js
fi
