#!/bin/bash
# ==========================================
#  闲鱼代写助手 - 本地部署脚本
#  用法: ./deploy.sh
# ==========================================

set -e

PROJECT_DIR="/Users/wyq/Developer/xianyu_answer"
SERVER="root@111.231.107.149"
REMOTE_DIR="/www/wwwroot"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "=========================================="
echo "  闲鱼代写助手 - 部署脚本"
echo "=========================================="
echo ""

cd "$PROJECT_DIR"

echo -e "${YELLOW}[1/3] 打包项目...${NC}"
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='backend/data/xianyu.db' \
    --exclude='backend/venv' \
    --exclude='__pycache__' \
    --exclude='.DS_Store' \
    -czvf ../xianyu_answer.tar.gz . > /dev/null 2>&1
echo -e "${GREEN}✓ 打包完成: $(ls -lh ../xianyu_answer.tar.gz | awk '{print $5}')${NC}"
echo ""

echo -e "${YELLOW}[2/3] 上传到服务器...${NC}"
scp ../xianyu_answer.tar.gz ${SERVER}:${REMOTE_DIR}/
echo -e "${GREEN}✓ 上传完成${NC}"
echo ""

echo -e "${YELLOW}[3/3] 服务器部署...${NC}"
ssh ${SERVER} << 'ENDSSH'
cd /www/wwwroot

# 备份数据库和虚拟环境
cp xianyu_answer/backend/data/xianyu.db ~/xianyu.db.backup 2>/dev/null || true
mv xianyu_answer/backend/venv ~/venv.backup 2>/dev/null || true

# 解压新代码
rm -rf xianyu_answer
mkdir xianyu_answer
tar -xzvf xianyu_answer.tar.gz -C xianyu_answer > /dev/null 2>&1

# 恢复数据库和虚拟环境
cp ~/xianyu.db.backup xianyu_answer/backend/data/xianyu.db 2>/dev/null || true
mv ~/venv.backup xianyu_answer/backend/venv 2>/dev/null || true

# 构建前端
cd xianyu_answer/frontend
rm -rf dist 2>/dev/null || true
npm install --silent 2>/dev/null || npm install
npm run build

# 清理
rm /www/wwwroot/xianyu_answer.tar.gz

echo "服务器部署完成"
ENDSSH

echo -e "${GREEN}✓ 部署完成${NC}"
echo ""

# 删除本地压缩包
rm -f /Users/wyq/Developer/xianyu_answer.tar.gz
echo -e "${GREEN}✓ 本地压缩包已清理${NC}"

echo ""
echo "=========================================="
echo -e "${GREEN}  部署成功！${NC}"
echo "=========================================="
echo ""
echo -e "${YELLOW}最后一步：请在宝塔面板「进程守护管理器」重启 xianyu_answer${NC}"
echo ""
echo "访问地址: http://111.231.107.149:8080"
echo ""
