#!/bin/bash
# ==========================================
#  闲鱼代写助手 - 服务器一键更新脚本
#  用法: ./update.sh
# ==========================================

set -e

PROJECT_DIR="/www/wwwroot/xianyu_answer"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "=========================================="
echo "  闲鱼代写助手 - 项目更新脚本"
echo "=========================================="
echo ""

# 检查是否在项目目录
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}错误: 项目目录不存在 $PROJECT_DIR${NC}"
    exit 1
fi

cd $PROJECT_DIR

# 查找虚拟环境目录（宝塔自动创建的）
VENV_DIR=$(ls -d ${PROJECT_DIR}/backend/*_venv 2>/dev/null | head -1)
if [ -n "$VENV_DIR" ] && [ -f "${VENV_DIR}/bin/pip3" ]; then
    PIP="${VENV_DIR}/bin/pip3"
else
    PIP="pip3"
fi

echo -e "${YELLOW}[1/4] 拉取最新代码...${NC}"
git pull origin main
echo -e "${GREEN}✓ 代码更新完成${NC}"
echo ""

echo -e "${YELLOW}[2/4] 更新后端依赖...${NC}"
cd backend
$PIP install -r requirements.txt --quiet 2>/dev/null || $PIP install -r requirements.txt
cd ..
echo -e "${GREEN}✓ 后端依赖更新完成${NC}"
echo ""

echo -e "${YELLOW}[3/4] 构建前端...${NC}"
cd frontend
npm install --silent 2>/dev/null || npm install
npm run build
cd ..
echo -e "${GREEN}✓ 前端构建完成${NC}"
echo ""

echo -e "${YELLOW}[4/4] 重启后端服务...${NC}"
# 尝试使用 supervisorctl 重启（宝塔进程守护管理器）
if command -v supervisorctl &> /dev/null; then
    supervisorctl restart xianyu_answer 2>/dev/null && echo -e "${GREEN}✓ 后端服务已重启${NC}" || echo -e "${YELLOW}! 请手动在宝塔面板重启服务${NC}"
else
    echo -e "${YELLOW}! 请在宝塔面板「进程守护管理器」重启 xianyu_answer 项目${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}  更新完成！${NC}"
echo "=========================================="
echo ""
echo "访问地址: http://111.231.107.149:8080"
echo ""
