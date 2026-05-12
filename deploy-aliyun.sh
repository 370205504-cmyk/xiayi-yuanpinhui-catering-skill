#!/bin/bash
#
# 夏邑缘品荟智能餐饮系统 - 阿里云部署脚本
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
echo -e "${BLUE}║  🍽️  阿里云部署脚本 v4.0.1                        ║${NC}"
echo -e "${BLUE}║                                                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════╝${NC}"
echo ""

# 检查阿里云CLI
check_aliyun_cli() {
    if ! command -v aliyun &> /dev/null; then
        echo -e "${YELLOW}⚠️  未安装阿里云CLI${NC}"
        echo ""
        echo "请先安装阿里云CLI:"
        echo "  方式1: pip install aliyun-cli"
        echo "  方式2: 下载安装包 https://help.aliyun.com/document_detail/121541.html"
        exit 1
    fi
    echo -e "${GREEN}✅ 阿里云CLI已安装${NC}"
}

# 检查登录状态
check_login() {
    echo ""
    echo -e "${BLUE}🔐 检查登录状态...${NC}"

    if ! aliyun configure list &> /dev/null; then
        echo -e "${YELLOW}⚠️  请先登录阿里云${NC}"
        echo ""
        echo "运行: aliyun configure"
        exit 1
    fi

    echo -e "${GREEN}✅ 已登录阿里云${NC}"
}

# 部署函数计算
deploy_fc() {
    echo ""
    echo -e "${BLUE}☁️  部署到函数计算...${NC}"

    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  .env文件不存在，创建示例配置...${NC}"
        cp .env.example .env
        echo -e "${YELLOW}请编辑.env文件配置您的参数${NC}"
    fi

    echo -e "${YELLOW}函数计算部署需要在阿里云控制台手动配置${NC}"
    echo ""
    echo "推荐步骤:"
    echo "  1. 创建函数计算服务"
    echo "  2. 创建HTTP函数"
    echo "  3. 上传代码包"
    echo "  4. 配置环境变量"
    echo ""
    echo "或者使用Serverless Devs工具进行部署:"
    echo "  npm install -g @serverless-devs/s"
    echo "  s deploy"
    echo ""
}

# 部署ECS
deploy_ecs() {
    echo ""
    echo -e "${BLUE}🖥️  ECS云服务器部署${NC}"

    echo ""
    echo "ECS部署步骤:"
    echo "  1. 购买ECS实例（推荐: 2核4G以上）"
    echo "  2. 安装Docker: curl -fsSL https://get.docker.com | sh"
    echo "  3. 上传项目代码"
    echo "  4. 配置环境变量"
    echo "  5. 运行: docker-compose up -d"
    echo ""
    echo "详细文档请参考: docs/DEPLOYMENT.md"
}

# 显示帮助
show_help() {
    echo ""
    echo "使用方法:"
    echo "  ./deploy-aliyun.sh              # 显示部署选项"
    echo "  ./deploy-aliyun.sh ecs          # ECS部署指南"
    echo "  ./deploy-aliyun.sh fc           # 函数计算部署"
    echo "  ./deploy-aliyun.sh help         # 显示帮助"
    echo ""
    echo "部署方式说明:"
    echo "  ecs: 使用云服务器 + Docker部署（推荐）"
    echo "  fc: 使用函数计算（Serverless）"
    echo ""
    echo "其他平台部署:"
    echo "  腾讯云: ./deploy-tencent.sh"
    echo "  AWS: ./deploy-aws.sh"
    echo "  Docker: docker-compose up -d"
    echo ""
}

# 主菜单
show_menu() {
    echo ""
    echo "请选择部署方式:"
    echo ""
    echo "  1) ECS云服务器 + Docker部署（推荐）"
    echo "  2) 函数计算（Serverless）"
    echo "  3) 查看详细文档"
    echo "  4) 退出"
    echo ""
    read -p "请输入选项 [1-4]: " choice

    case "$choice" in
        1)
            deploy_ecs
            ;;
        2)
            deploy_fc
            ;;
        3)
            show_help
            ;;
        4)
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

    if [ "$1" == "ecs" ]; then
        deploy_ecs
        exit 0
    fi

    if [ "$1" == "fc" ]; then
        check_aliyun_cli
        check_login
        deploy_fc
        exit 0
    fi

    check_aliyun_cli
    check_login
    show_menu
}

main "$@"
