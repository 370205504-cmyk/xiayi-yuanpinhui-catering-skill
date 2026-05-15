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

echo [1/9] 清理旧的构建文件...
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%BUILD_DIR%"
mkdir "%RELEASE_DIR%"
echo 清理完成
echo.

echo [2/9] 复制项目文件...
xcopy "%PROJECT_DIR%lambda" "%RELEASE_DIR%\lambda\" /E /I /Y
copy "%PROJECT_DIR%package.json" "%RELEASE_DIR%\" >nul
copy "%PROJECT_DIR%.env.example" "%RELEASE_DIR%\.env" >nul
copy "%PROJECT_DIR%README.md" "%RELEASE_DIR%\" >nul
copy "%PROJECT_DIR%WINDOWS使用指南.md" "%RELEASE_DIR%\" >nul
copy "%PROJECT_DIR%v5.0.0-开发计划.md" "%RELEASE_DIR%\" >nul
echo 项目文件复制完成
echo.

echo [3/9] 复制依赖安装脚本...
(
  echo @echo off
  echo chcp 65001 ^>nul
  echo title 安装依赖
  echo cd /d "%%~dp0"
  echo.
  echo echo ============================================
  echo echo 安装项目依赖
  echo echo ============================================
  echo echo.
  echo echo 正在安装 npm 依赖...
  echo echo 请耐心等待，首次安装需要 1-3 分钟...
  echo echo.
  echo call npm install --omit=dev
  echo.
  echo if %%errorlevel%% neq 0 (
  echo   echo.
  echo   echo [错误] 依赖安装失败，请检查网络连接
  echo   pause
  echo   exit /b 1
  echo ^)
  echo.
  echo echo ============================================
  echo echo 依赖安装完成！
  echo echo ============================================
  echo.
  echo pause
) > "%RELEASE_DIR%\安装依赖.bat"

echo 依赖安装脚本创建完成
echo.

echo [4/9] 创建启动脚本...
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
  echo   echo.
  echo   echo [错误] 未检测到 Node.js 18+！
  echo   echo.
  echo   echo 请先安装 Node.js 18.x LTS:
  echo   echo https://nodejs.org/zh-cn/
  echo   echo.
  echo   pause
  echo   exit /b 1
  echo ^)
  echo.
  echo REM 检查 node_modules 是否存在
  echo if not exist "node_modules" (
  echo   echo.
  echo   echo [提示] 首次运行需要先安装依赖...
  echo   echo 正在启动依赖安装...
  echo   echo.
  echo   call npm install --omit=dev
  echo   if %%errorlevel%% neq 0 (
  echo     echo.
  echo     echo [错误] 依赖安装失败！
  echo     pause
  echo     exit /b 1
  echo   ^)
  echo   echo.
  echo   echo [完成] 依赖安装成功！
  echo   echo.
  echo ^)
  echo.
  echo echo [提示] 服务启动中，请勿关闭此窗口...
  echo echo [提示] 打开浏览器访问: http://localhost:3000
  echo echo.
  echo.
  echo REM 启动服务
  echo cd lambda
  echo node server.js
  echo.
  echo pause
) > "%RELEASE_DIR%\启动服务.bat"

echo 启动脚本创建完成
echo.

echo [5/9] 创建停止脚本...
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

echo [6/9] 创建配置向导快捷方式...
(
  echo @echo off
  echo chcp 65001 ^>nul
  echo title 配置向导
  echo echo ============================================
  echo echo 配置向导 - 首次使用请运行
  echo echo ============================================
  echo echo.
  echo echo 启动配置向导...
  echo echo.
  echo start http://localhost:3000/setup
  echo.
  echo pause
) > "%RELEASE_DIR%\配置向导.bat"

echo 配置向导快捷方式创建完成
echo.

echo [7/9] 创建说明文档...
(
  echo ========================================================================
  echo                      雨姗AI收银助手 v5.0.0 绿色版
  echo ========================================================================
  echo.
  echo 【说明】
  echo   无需安装，解压即用，数据全部本地加密存储，保护隐私安全
  echo.
  echo ------------------------------------------------------------------------
  echo 一、快速开始
  echo ------------------------------------------------------------------------
  echo.
  echo 1. 解压此压缩包到任意目录（推荐 D:\YushanAI）
  echo.
  echo 2. 双击运行「启动服务.bat」
  echo.
  echo 3. 等待服务启动（首次启动会自动安装依赖，约1-3分钟）
  echo.
  echo 4. 打开浏览器访问: http://localhost:3000
  echo.
  echo ------------------------------------------------------------------------
  echo 二、配置向导（首次使用必看）
  echo ------------------------------------------------------------------------
  echo.
  echo 启动后访问 http://localhost:3000/setup 进入配置向导
  echo.
  echo 配置步骤：
  echo   1) 检测收银系统 - 自动识别已安装的收银系统
  echo   2) 选择收银系统 - 从列表中选择您的收银系统
  echo   3) 配置连接 - 输入数据库连接信息
  echo   4) 生成二维码 - 店铺码和桌码一键生成
  echo   5) 配置打印机 - 设置小票打印机
  echo   6) 完成配置 - 开始使用！
  echo.
  echo ------------------------------------------------------------------------
  echo 三、功能说明
  echo ------------------------------------------------------------------------
  echo.
  echo ● 点餐服务
  echo   - 文字/语音/图片点餐
  echo   - 多桌位管理
  echo   - 多人点餐同步
  echo.
  echo ● AI智能推荐
  echo   - 根据历史数据智能推荐菜品
  echo   - 自动搭配套餐
  echo.
  echo ● 数据同步
  echo   - 自动同步收银系统
  echo   - 数据备份和恢复
  echo.
  echo ● 安全保障
  echo   - 本地加密存储
  echo   - 不上传云端
  echo   - 定时自动备份
  echo.
  echo ------------------------------------------------------------------------
  echo 四、系统要求
  echo ------------------------------------------------------------------------
  echo.
  echo   ● Windows 10 或更高版本
  echo   ● Node.js 18.x LTS（需要提前安装）
  echo       下载地址: https://nodejs.org/zh-cn/
  echo   ● 内存 4GB 以上
  echo.
  echo ------------------------------------------------------------------------
  echo 五、常见问题
  echo ------------------------------------------------------------------------
  echo.
  echo Q: 服务启动失败怎么办？
  echo A: 请确保已安装 Node.js 18+，并检查端口 3000 是否被占用
  echo.
  echo Q: 端口被占用如何解决？
  echo A: 打开 .env 文件修改 PORT 配置
  echo.
  echo Q: 如何备份数据？
  echo A: 在管理后台可一键备份，备份文件保存在 backups 目录
  echo.
  echo Q: 数据安全吗？
  echo A: 所有数据本地存储，加密保护，不上传云端，安全放心
  echo.
  echo ------------------------------------------------------------------------
  echo 六、技术支持
  echo ------------------------------------------------------------------------
  echo.
  echo   ● 官网: https://yushan.ai
  echo   ● 文档: https://docs.yushan.ai
  echo   ● 邮箱: support@yushan.ai
  echo.
  echo ========================================================================
  echo                     祝您使用愉快！
  echo ========================================================================
) > "%RELEASE_DIR%\使用说明.txt"

echo 说明文档创建完成
echo.

echo [8/9] 创建配置目录...
mkdir "%RELEASE_DIR%\data"
mkdir "%RELEASE_DIR%\backups"
mkdir "%RELEASE_DIR%\public"
mkdir "%RELEASE_DIR%\logs"
echo 配置目录创建完成
echo.

echo [9/9] 打包...
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
