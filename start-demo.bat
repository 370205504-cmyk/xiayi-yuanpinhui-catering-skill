@echo off
chcp 65001 >nul
echo ========================================
echo   夏邑缘品荟智能餐饮系统 - 演示模式
echo ========================================
echo.
echo   正在启动演示服务器...
echo.

cd /d "%~dp0lambda"

set NODE_ENV=demo
node demo-server.js

pause
