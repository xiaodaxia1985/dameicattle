#!/bin/bash

# 测试环境设置脚本

set -e

echo "🧪 设置测试环境..."

# 检查测试数据库是否存在
echo "📊 检查测试数据库..."
if ! docker exec cattle-postgres psql -U cattle_user -lqt | cut -d \| -f 1 | grep -qw cattle_management_test; then
    echo "创建测试数据库..."
    docker exec cattle-postgres createdb -U cattle_user cattle_management_test
fi

# 运行数据库迁移
echo "🔧 运行测试数据库迁移..."
cd backend
NODE_ENV=test npm run migrate
cd ..

# 安装测试依赖
echo "📦 安装测试依赖..."
npm install --dev

echo "✅ 测试环境设置完成！"
echo ""
echo "🧪 可用测试命令："
echo "  npm run test:all          - 运行所有测试"
echo "  npm run test:backend      - 运行后端测试"
echo "  npm run test:frontend     - 运行前端测试"
echo "  npm run test:watch        - 监视模式运行测试"
echo "  npm run test:coverage     - 生成测试覆盖率报告"
echo ""