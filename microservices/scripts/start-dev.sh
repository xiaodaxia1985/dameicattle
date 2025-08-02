#!/bin/bash

echo "🚀 启动微服务开发环境..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi

# 构建共享库
echo "📦 构建共享库..."
cd shared
npm install
npm run build
cd ..

# 启动基础设施服务
echo "🗄️ 启动数据库和Redis..."
docker-compose up -d postgres redis

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 10

# 启动核心服务
echo "🔐 启动认证服务..."
docker-compose up -d auth-service

echo "🌐 启动API网关..."
docker-compose up -d api-gateway

# 启动其他服务
echo "🏢 启动业务服务..."
docker-compose up -d base-service cattle-service health-service feeding-service

echo "⚙️ 启动设备和物料服务..."
docker-compose up -d equipment-service material-service

echo "💰 启动采购和销售服务..."
docker-compose up -d procurement-service sales-service

echo "📢 启动支撑服务..."
docker-compose up -d notification-service file-service monitoring-service

echo "✅ 所有服务启动完成！"
echo ""
echo "🌐 API网关: http://localhost:3000"
echo "🔐 认证服务: http://localhost:3001"
echo "🏢 基地服务: http://localhost:3002"
echo "🐄 牛只服务: http://localhost:3003"
echo "🏥 健康服务: http://localhost:3004"
echo "🍽️ 饲养服务: http://localhost:3005"
echo "⚙️ 设备服务: http://localhost:3006"
echo "💰 采购服务: http://localhost:3007"
echo "💵 销售服务: http://localhost:3008"
echo "📦 物料服务: http://localhost:3009"
echo "📢 通知服务: http://localhost:3010"
echo "📁 文件服务: http://localhost:3011"
echo "📊 监控服务: http://localhost:3012"
echo ""
echo "查看服务状态: docker-compose ps"
echo "查看服务日志: docker-compose logs -f [service-name]"