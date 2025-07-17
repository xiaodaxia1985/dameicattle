#!/bin/bash

# 肉牛管理系统开发环境设置脚本

set -e

echo "🚀 开始设置肉牛管理系统开发环境..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js未安装，请先安装Node.js 18+"
    exit 1
fi

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js版本过低，需要18+版本"
    exit 1
fi

echo "✅ 环境检查通过"

# 创建必要的目录
echo "📁 创建项目目录..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p frontend/dist
mkdir -p nginx/ssl
mkdir -p data/postgres
mkdir -p data/redis

# 设置权限
chmod +x scripts/*.sh

# 复制环境配置文件
echo "⚙️  设置环境配置..."
if [ ! -f backend/.env ]; then
    cp backend/.env.development backend/.env
    echo "✅ 后端环境配置文件已创建"
fi

# 安装依赖
echo "📦 安装项目依赖..."

# 后端依赖
echo "安装后端依赖..."
cd backend
npm install
cd ..

# 前端依赖
echo "安装前端依赖..."
cd frontend
npm install
cd ..

# 小程序依赖
echo "安装小程序依赖..."
cd miniprogram
npm install
cd ..

echo "✅ 依赖安装完成"

# 启动数据库服务
echo "🗄️  启动数据库服务..."
docker-compose up -d postgres redis

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 10

# 初始化数据库
echo "🔧 初始化数据库..."
cd backend
npm run db:setup
cd ..

echo "🎉 开发环境设置完成！"
echo ""
echo "📋 可用命令："
echo "  npm run dev:all     - 启动所有服务"
echo "  npm run dev:backend - 仅启动后端"
echo "  npm run dev:frontend - 仅启动前端"
echo "  npm run dev:docker  - 使用Docker启动"
echo "  npm run test:all    - 运行所有测试"
echo ""
echo "🌐 访问地址："
echo "  前端应用: http://localhost:5173"
echo "  后端API: http://localhost:3000"
echo "  数据库管理: http://localhost:8080"
echo ""