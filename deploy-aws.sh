#!/bin/bash
#
# 夏邑缘品荟智能餐饮系统 - AWS部署脚本
#

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                   ║${NC}"
echo -e "${BLUE}║  🍽️  AWS部署脚本 v4.0.1                           ║${NC}"
echo -e "${BLUE}║                                                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# 检查AWS CLI
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo -e "${YELLOW}⚠️  未安装AWS CLI${NC}"
        echo ""
        echo "请先安装AWS CLI:"
        echo "  macOS: brew install awscli"
        echo "  Linux: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        echo "  Windows: 下载安装包"
        exit 1
    fi
    echo -e "${GREEN}✅ AWS CLI已安装${NC}"
}

# 检查登录状态
check_login() {
    echo ""
    echo -e "${BLUE}🔐 检查登录状态...${NC}"

    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${YELLOW}⚠️  请先配置AWS凭证${NC}"
        echo ""
        echo "运行: aws configure"
        exit 1
    fi

    echo -e "${GREEN}✅ 已登录AWS${NC}"
}

# 部署EC2
deploy_ec2() {
    echo ""
    echo -e "${BLUE}🖥️  EC2云服务器部署${NC}"

    echo ""
    echo "EC2部署步骤:"
    echo "  1. 启动EC2实例（推荐: t2.medium以上）"
    echo "  2. 安装Docker: curl -fsSL https://get.docker.com | sh"
    echo "  3. 上传项目代码"
    echo "  4. 配置环境变量"
    echo "  5. 运行: docker-compose up -d"
    echo ""
    echo "安全组配置注意:"
    echo "  - 开放端口: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (App)"
    echo ""
    echo "详细文档请参考: docs/DEPLOYMENT.md"
}

# 部署Lambda
deploy_lambda() {
    echo ""
    echo -e "${BLUE}☁️  部署到Lambda...${NC}"

    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  .env文件不存在，创建示例配置...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}请编辑.env文件配置您的参数${NC}"
    fi

    echo ""
    echo "Lambda + API Gateway部署方式:"
    echo "  1. 使用AWS SAM或Serverless Framework"
    echo "  2. 打包Lambda函数代码"
    echo "  3. 配置API Gateway"
    echo "  4. 配置RDS MySQL + ElastiCache Redis"
    echo ""
    echo "或使用现有部署脚本: ./deploy.sh"
    echo ""
}

# 部署ECS
deploy_ecs() {
    echo ""
    echo -e "${BLUE}🐳 ECS容器服务部署${NC}"

    echo ""
    echo "ECS部署步骤:"
    echo "  1. 创建ECS集群"
    echo "  2. 构建并上传Docker镜像到ECR"
    echo "  3. 创建任务定义"
    echo "  4. 创建服务"
    echo "  5. 配置Application Load Balancer"
    echo ""
}

# 显示帮助
show_help() {
    echo ""
    echo "使用方法:"
    echo "  ./deploy-aws.sh                 # 显示部署选项"
    echo "  ./deploy-aws.sh ec2             # EC2部署指南"
    echo "  ./deploy-aws.sh lambda          # Lambda部署"
    echo "  ./deploy-aws.sh ecs             # ECS容器部署"
    echo "  ./deploy-aws.sh help            # 显示帮助"
    echo ""
    echo "部署方式说明:"
    echo "  ec2: 使用EC2云服务器 + Docker部署（推荐）"
    echo "  lambda: 使用Lambda函数（Serverless）"
    echo "  ecs: 使用ECS容器服务"
    echo ""
    echo "其他平台部署:"
    echo "  腾讯云: ./deploy-tencent.sh"
    echo "  阿里云: ./deploy-aliyun.sh"
    echo "  Docker: docker-compose up -d"
    echo ""
}

# 主菜单
show_menu() {
    echo ""
    echo "请选择部署方式:"
    echo ""
    echo "  1) EC2云服务器 + Docker部署（推荐）"
    echo "  2) Lambda函数计算（Serverless）"
    echo "  3) ECS容器服务"
    echo "  4) 查看详细文档"
    echo "  5) 退出"
    echo ""
    read -p "请输入选项 [1-5]: " choice

    case "$choice" in
        1)
            deploy_ec2
            ;;
        2)
            deploy_lambda
            ;;
        3)
            deploy_ecs
            ;;
        4)
            show_help
            ;;
        5)
            echo "退出"
            exit 0
            ;;
        *)
            echo -e "${RED}无效选项${NC}"
            exit 1
            ;;
    esac
}

# 主程序
main() {
    if [ "$1" == "help" ] || [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
        show_help
        exit 0
    fi

    if [ "$1" == "ec2" ]; then
        deploy_ec2
        exit 0
    fi

    if [ "$1" == "lambda" ]; then
        check_aws_cli
        check_login
        deploy_lambda
        exit 0
    fi

    if [ "$1" == "ecs" ]; then
        check_aws_cli
        check_login
        deploy_ecs
        exit 0
    fi

    check_aws_cli
    check_login
    show_menu
}

main "$@"
