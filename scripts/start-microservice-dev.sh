#!/bin/bash
# 微服务开发环境一键启动脚本
# Bash script for Linux/macOS

echo "🚀 启动肉牛管理系统微服务开发环境..."

# 检查Docker是否运行
echo "📋 检查Docker状态..."
if ! docker version >/dev/null 2>&1; then
    echo "❌ Docker未运行，请先启动Docker"
    exit 1
fi
echo "✅ Docker运行正常"

# 检查端口占用
echo "📋 检查端口占用..."
ports=(3000 3001 3002 3003 3004 3005 5432 6379)
for port in "${ports[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "⚠️  端口 $port 已被占用"
    fi
done

# 检查本地数据库服务
echo "📋 检查本地数据库服务..."

# 检查PostgreSQL
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ PostgreSQL (端口5432) 运行正常"
else
    echo "❌ PostgreSQL (端口5432) 未运行，请启动PostgreSQL服务"
    echo "   macOS: brew services start postgresql"
    echo "   Linux: sudo systemctl start postgresql"
    exit 1
fi

# 检查Redis
if lsof -Pi :6379 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Redis (端口6379) 运行正常"
else
    echo "❌ Redis (端口6379) 未运行，请启动Redis服务"
    echo "   macOS: brew services start redis"
    echo "   Linux: sudo systemctl start redis"
    exit 1
fi

# 启动微服务（使用本地数据库配置）
echo "🐳 启动微服务容器（使用本地数据库）..."
cd microservices
if docker-compose -f docker-compose.local.yml up -d --build; then
    echo "✅ 微服务启动成功"
else
    echo "❌ 微服务启动失败"
    exit 1
fi

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 健康检查
echo "🔍 执行健康检查..."
services=(
    "API网关:http://localhost:3000/health"
    "认证服务:http://localhost:3000/api/v1/auth/health"
    "基地服务:http://localhost:3000/api/v1/base/health"
    "牛只服务:http://localhost:3000/api/v1/cattle/health"
)

for service in "${services[@]}"; do
    name="${service%%:*}"
    url="${service##*:}"
    if curl -s --max-time 5 "$url" >/dev/null 2>&1; then
        echo "✅ $name 健康检查通过"
    else
        echo "❌ $name 健康检查失败"
    fi
done

# 返回根目录
cd ..

# 启动前端开发服务器
echo "🌐 启动前端开发服务器..."
if command -v gnome-terminal >/dev/null 2>&1; then
    gnome-terminal -- bash -c "cd frontend && npm run dev; exec bash"
elif command -v xterm >/dev/null 2>&1; then
    xterm -e "cd frontend && npm run dev; exec bash" &
else
    echo "请手动运行: cd frontend && npm run dev"
fi

# 等待前端启动
sleep 5

# 启动小程序开发服务器
echo "📱 启动小程序开发服务器..."
if command -v gnome-terminal >/dev/null 2>&1; then
    gnome-terminal -- bash -c "cd miniprogram && npm run dev:mp-weixin; exec bash"
elif command -v xterm >/dev/null 2>&1; then
    xterm -e "cd miniprogram && npm run dev:mp-weixin; exec bash" &
else
    echo "请手动运行: cd miniprogram && npm run dev:mp-weixin"
fi

echo ""
echo "🎉 系统启动完成！"
echo ""
echo "📋 服务地址:"
echo "  🌐 前端应用: http://localhost:5173"
echo "  🔗 API网关: http://localhost:3000"
echo "  📱 小程序: 微信开发者工具导入 miniprogram 目录"
echo ""
echo "🛠️  管理命令:"
echo "  查看服务状态: docker-compose -f microservices/docker-compose.local.yml ps"
echo "  查看服务日志: docker-compose -f microservices/docker-compose.local.yml logs -f"
echo "  停止所有服务: docker-compose -f microservices/docker-compose.local.yml down"
echo ""
echo "📖 详细文档: MICROSERVICE_INTEGRATION_GUIDE.md"
echo ""