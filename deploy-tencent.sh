#!/bin/bash

set -e

echo "=========================================="
echo "夏邑缘品荟创味菜 - 腾讯云部署脚本"
echo "=========================================="

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

echo ""
echo "请确保已安装腾讯云CLI工具"
echo "安装命令: npm install -g @cloudbase/cli"
echo ""

check_tcb() {
    if ! command -v tcb &>/dev/null && ! command -v cloudbase &>/dev/null; then
        echo "❌ 未找到腾讯云CLI工具"
        echo "请先安装: npm install -g @cloudbase/cli"
        exit 1
    fi
    echo "✅ 腾讯云CLI已安装"
}

check_login() {
    echo ""
    echo "检查登录状态..."
    tcb env list &>/dev/null || cloudbase env list &>/dev/null || {
        echo "⚠  需要登录腾讯云"
        echo "运行: tcb login 或 cloudbase login"
        exit 1
    }
    echo "✅ 已登录腾讯云"
}

prepare_package() {
    echo ""
    echo "📦 准备打包..."

    cd "$PROJECT_DIR/lambda"

    if [ ! -f "package.json" ]; then
        echo "❌ 未找到package.json"
        exit 1
    fi

    npm install --production

    cd "$PROJECT_DIR"

    echo "✅ 依赖安装完成"
}

create_zip() {
    echo ""
    echo "📁 创建部署包..."

    rm -f deployment.zip

    cd "$PROJECT_DIR/lambda"

    zip -r "$PROJECT_DIR/deployment.zip" . \
        -x "node_modules/.cache/*" \
        -x "*.log" \
        -x "logs/*" \
        -x ".git/*" \
        -x "uploads/*" \
        -x "backups/*" \
        -x "coverage/*"

    cd "$PROJECT_DIR"

    ZIP_SIZE=$(du -h deployment.zip | cut -f1)
    echo "✅ 部署包已创建: deployment.zip (${ZIP_SIZE})"
}

deploy_serverless() {
    echo ""
    echo "☁️ 部署到腾讯云函数..."

    if [ ! -f ".env" ]; then
        echo "⚠  .env文件不存在，创建示例配置..."
        cp .env.example .env
        echo "请编辑.env文件配置您的参数"
    fi

    source .env 2>/dev/null || true

    cloudbase functions:deploy xiayi-foodie-skill \
        --service-name xiayi-youpinhui \
        --dir lambda \
        --runtime Nodejs16.13 \
        --memory 512 \
        --timeout 30 \
        --env-vars "NODE_ENV=production,DB_HOST=${DB_HOST:-localhost},DB_PORT=${DB_PORT:-3306},DB_NAME=${DB_NAME:-xiayi_restaurant}" || \
    tcb fn deploy xiayi-foodie-skill \
        --service-name xiayi-youpinhui \
        --dir lambda \
        --runtime Nodejs16.13 \
        --memory 512 \
        --timeout 30

    echo "✅ 云函数部署完成"
}

deploy_api_gateway() {
    echo ""
    echo "🌐 配置API网关..."

    cat > api-gateway-config.json << 'APIGATEWAY'
{
  "apiList": [
    {
      "apiName": "xiayi-foodie-api",
      "apiDesc": "夏邑缘品荟餐饮API",
      "serviceType": "SCF",
      "serviceName": "xiayi-youpinhui",
      "serviceScfFunctionName": "xiayi-foodie-skill",
      "authType": "NONE",
      "methods": ["ANY"],
      "paths": ["/api/v1/*"]
    }
  ]
}
APIGATEWAY

    echo "✅ API网关配置已创建"
}

deploy_database() {
    echo ""
    echo "🗄️ 部署数据库..."

    echo "正在连接腾讯云数据库..."
    echo "请在腾讯云控制台手动完成以下操作:"
    echo "1. 创建MySQL数据库实例"
    echo "2. 创建数据库 xiayi_restaurant"
    echo "3. 运行迁移脚本: npm run migrate"
    echo ""
    read -p "按回车继续..."
}

setup_domain() {
    echo ""
    echo "🔗 配置自定义域名..."

    echo "1. 在腾讯云域名服务中添加域名: mcp.xiayi-youpinhui.com"
    echo "2. 申请SSL证书"
    echo "3. 在API网关中配置自定义域名绑定"
    echo "4. 将域名CNAME解析到API网关地址"
    echo ""
    echo "域名配置示例:"
    echo "  域名: mcp.xiayi-youpinhui.com"
    echo "  类型: CNAME"
    echo "  值: xxx.apigw.tencentcs.com"
}

deploy_static() {
    echo ""
    echo "📱 部署静态资源..."

    if [ -d "$PROJECT_DIR/lambda/web" ]; then
        cd "$PROJECT_DIR"
        cloudbase hosting deploy lambda/web || \
        tcb hosting deploy lambda/web
        echo "✅ 静态资源部署完成"
    fi
}

show_info() {
    echo ""
    echo "=========================================="
    echo "🎉 部署完成！"
    echo "=========================================="
    echo ""
    echo "访问地址:"
    echo "  API: https://mcp.xiayi-youpinhui.com/api/v1"
    echo "  管理后台: https://mcp.xiayi-youpinhui.com/admin"
    echo "  顾客端: https://mcp.xiayi-youpinhui.com/mobile"
    echo ""
    echo "下一步:"
    echo "  1. 配置微信公众号授权回调"
    echo "  2. 配置微信支付参数"
    echo "  3. 测试API接口"
    echo "  4. 配置美团排队API"
    echo ""
    echo "详细文档: https://github.com/370205504-cmyk/xiayi-youpinhui-foodie-skill"
    echo "=========================================="
}

main() {
    check_tcb
    check_login

    echo ""
    echo "请选择部署方式:"
    echo "  1. 完整部署 (云函数 + API网关 + 数据库)"
    echo "  2. 仅部署云函数"
    echo "  3. 仅打包"
    echo "  4. 查看部署说明"
    read -p "请输入选项 [1-4]: " choice

    case $choice in
        1)
            prepare_package
            create_zip
            deploy_database
            deploy_serverless
            deploy_api_gateway
            setup_domain
            deploy_static
            show_info
            ;;
        2)
            prepare_package
            create_zip
            deploy_serverless
            deploy_api_gateway
            ;;
        3)
            prepare_package
            create_zip
            ;;
        4)
            show_deploy_guide
            ;;
        *)
            echo "无效选项"
            exit 1
            ;;
    esac
}

show_deploy_guide() {
    cat << 'GUIDE'

==========================================
腾讯云部署指南
==========================================

一、前置准备
------------
1. 注册腾讯云账号: https://cloud.tencent.com
2. 开通云函数SCF服务
3. 开通API网关服务
4. 开通MySQL数据库服务
5. 注册域名并申请SSL证书

二、安装工具
------------
npm install -g @cloudbase/cli

三、登录腾讯云
--------------
tcb login 或 cloudbase login

四、配置环境变量
----------------
cp .env.example .env
# 编辑.env文件，填写数据库等信息

五、执行部署
------------
chmod +x deploy-tencent.sh
./deploy-tencent.sh

六、配置域名
------------
1. 在API网关创建自定义域名
2. 绑定SSL证书
3. 配置CNAME解析

七、配置微信公众号
-----------------
在微信公众号后台配置:
- 授权回调域: mcp.xiayi-youpinhui.com
- JS安全域名: mcp.xiayi-youpinhui.com

八、配置微信支付
----------------
在微信商户平台配置:
- 支付回调地址: https://mcp.xiayi-youpinhui.com/api/v1/payment/wechat/callback

==========================================

GUIDE
}

main "$@"
