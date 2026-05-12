#!/bin/bash
#
# 夏邑缘品荟创味菜 - 一键部署脚本
# 开发者：石中伟
#
# 使用方法：
#   ./deploy.sh              # 部署到Lambda和交互模型
#   ./deploy.sh --lambda     # 仅部署Lambda
#   ./deploy.sh --model      # 仅部署交互模型
#

set -e

echo "======================================"
echo "  夏邑缘品荟创味菜 - 一键部署"
echo "  开发者：石中伟"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未安装Node.js${NC}"
    echo "请先安装Node.js: https://nodejs.org/"
    exit 1
fi

# 检查ASK CLI
if ! command -v ask &> /dev/null; then
    echo -e "${YELLOW}提示: 未安装ASK CLI，正在安装...${NC}"
    npm install -g ask-cli
fi

# 解析参数
DEPLOY_TYPE="all"
if [ "$1" == "--lambda" ]; then
    DEPLOY_TYPE="lambda"
elif [ "$1" == "--model" ]; then
    DEPLOY_TYPE="model"
fi

# 安装依赖
echo -e "${GREEN}>>> 安装依赖${NC}"
cd lambda
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "依赖已存在，跳过安装"
fi
cd ..

# 部署Lambda
if [ "$DEPLOY_TYPE" == "all" ] || [ "$DEPLOY_TYPE" == "lambda" ]; then
    echo ""
    echo -e "${GREEN}>>> 部署Lambda函数${NC}"
    ask deploy --target lambda
    
    # 获取Lambda ARN
    LAMBDA_ARN=$(grep -A1 "LambdaArn" ~/.ask/cli_config | grep -oP 'arn:aws:lambda:[^:]+:[^:]+:function:[^"]+' || echo "")
    if [ -n "$LAMBDA_ARN" ]; then
        echo -e "${GREEN}Lambda函数部署成功${NC}"
    fi
fi

# 部署交互模型
if [ "$DEPLOY_TYPE" == "all" ] || [ "$DEPLOY_TYPE" == "model" ]; then
    echo ""
    echo -e "${GREEN}>>> 部署交互模型${NC}"
    ask deploy --target model
    echo -e "${GREEN}交互模型部署成功${NC}"
fi

# 部署CloudFormation
if [ "$DEPLOY_TYPE" == "all" ]; then
    echo ""
    echo -e "${GREEN}>>> 部署基础设施${NC}"
    if [ -f "infrastructure/cfn-deployer.yaml" ]; then
        echo "部署CloudFormation模板..."
        aws cloudformation deploy \
            --template-file infrastructure/cfn-deployer.yaml \
            --stack-name xiayi-foodie-chef \
            --capabilities CAPABILITY_IAM
        
        # 获取API Gateway URL
        API_URL=$(aws cloudformation describe-stacks \
            --stack-name xiayi-foodie-chef \
            --query 'Stacks[0].Outputs[?OutputKey==`TextApiUrl`].OutputValue' \
            --output text 2>/dev/null || echo "")
        
        if [ -n "$API_URL" ]; then
            echo -e "${GREEN}文字API地址: ${API_URL}${NC}"
        fi
    fi
fi

echo ""
echo "======================================"
echo -e "${GREEN}  部署完成！${NC}"
echo "======================================"
echo ""
echo "可用功能："
echo "  1. Alexa语音：'Alexa，打开夏邑缘品荟创味菜'"
echo "  2. 文字API：POST /text"
echo "  3. Web界面：GET /"
echo ""
echo "开发者：石中伟"
echo ""
