@echo off
chcp 65001 >nul
title 雨姗AI收银助手 v5.0.0 - 绿色版打包工具

echo ============================================
echo 雨姗AI收银助手 v5.0.0 绿色版打包工具
echo ============================================
echo.

REM 设置目录变量
set PROJECT_DIR=%~dp0
set BUILD_DIR=%PROJECT_DIR%build
set RELEASE_DIR=%BUILD_DIR%release
set PACKAGE_NAME=yushan-ai-cashier-assistant-v5.0.0-windows
set PACKAGE_PATH=%BUILD_DIR%\%PACKAGE_NAME%.zip

echo [1/7] 清理旧的构建文件...
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%BUILD_DIR%"
mkdir "%RELEASE_DIR%"
echo 清理完成
echo.

echo [2/7] 复制项目文件...
xcopy "%PROJECT_DIR%lambda" "%RELEASE_DIR%\lambda\" /E /I /Y
copy "%PROJECT_DIR%package.json" "%RELEASE_DIR%\" >nul
copy "%PROJECT_DIR%.env.example" "%RELEASE_DIR%\.env" >nul
copy "%PROJECT_DIR%README.md" "%RELEASE_DIR%\" >nul
copy "%PROJECT_DIR%SKILL.md" "%RELEASE_DIR%\" >nul
copy "%PROJECT_DIR%一键启动.bat" "%RELEASE_DIR%\" >nul
echo 项目文件复制完成
echo.

echo [3/7] 创建启动脚本...
(
  echo @echo off
  echo chcp 65001 ^>nul
  echo title 雨姗AI收银助手 v5.0.0
  echo cd /d "%%~dp0"
  echo.
  echo echo ============================================
  echo echo 雨姗AI收银助手 v5.0.0
  echo echo ============================================
  echo echo.
  echo echo 正在启动服务...
  echo echo.
  echo.
  echo REM 检查 Node.js
  echo node --version ^>nul 2^>^&1
  echo if %%errorlevel%% neq 0 (
  echo   echo [错误] 未检测到 Node.js，请先安装 Node.js 18+
  echo   pause
  echo   exit /b 1
  echo ^)
  echo.
  echo REM 启动服务
  echo cd lambda
  echo node server.js
  echo.
  echo pause
) > "%RELEASE_DIR%\启动服务.bat"

echo 启动脚本创建完成
echo.

echo [4/7] 创建停止脚本...
(
  echo @echo off
  echo chcp 65001 ^>nul
  echo title 停止雨姗AI收银助手
  echo cd /d "%%~dp0"
  echo.
  echo echo 正在停止服务...
  echo taskkill /f /im node.exe 2^>nul
  echo echo 服务已停止
  echo pause
) > "%RELEASE_DIR%\停止服务.bat"

echo 停止脚本创建完成
echo.

echo [5/7] 创建说明文档...
(
  echo # 雨姗AI收银助手 v5.0.0 - 绿色版
  echo.
  echo ## 快速启动
  echo 1. 解压此压缩包到任意目录（建议：D:\YushanAI）
  echo 2. 双击「启动服务.bat」
  echo 3. 等待服务启动（约10秒）
  echo 4. 打开浏览器访问：http://localhost:3000
  echo.
  echo ## 系统要求
  echo - Windows 10 或更高版本
  echo - Node.js 18+（首次使用需要安装）
  echo.
  echo ## 配置向导
  echo 首次启动会自动进入配置向导，5分钟即可完成配置：
  echo 1. 检测并选择收银系统
  echo 2. 生成店铺码和桌码
  echo 3. 配置打印机
  echo.
  echo ## 数据安全
  echo - 所有数据本地加密存储
  echo - 不上传云端
  echo - 支持一键备份/恢复
  echo.
  echo ## 技术支持
  echo - 官网：https://yushan.ai
  echo - 文档：https://docs.yushan.ai
  echo - 客服：400-xxx-xxxx
  echo.
  echo ## 版本信息
  echo - 版本：v5.0.0
  echo - 更新日期：2024-01-15
) > "%RELEASE_DIR%\使用说明.txt"

echo 说明文档创建完成
echo.

echo [6/7] 创建配置目录...
mkdir "%RELEASE_DIR%\data"
mkdir "%RELEASE_DIR%\backups"
mkdir "%RELEASE_DIR%\logs"
echo 配置目录创建完成
echo.

echo [7/7] 打包...
cd /d "%BUILD_DIR%"
powershell -Command "Compress-Archive -Path '%RELEASE_DIR%\*' -DestinationPath '%PACKAGE_PATH%' -Force"

if exist "%PACKAGE_PATH%" (
  echo.
  echo ============================================
  echo 打包成功！
  echo ============================================
  echo 文件：%PACKAGE_PATH%
  for %%A in ("%PACKAGE_PATH%") do echo 大小：%%~zA 字节
  echo.
  explorer /select,"%PACKAGE_PATH%"
) else (
  echo.
  echo 打包失败！
)

echo.
pause
