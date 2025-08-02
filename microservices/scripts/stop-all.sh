#!/bin/bash

echo "🛑 停止所有微服务..."

docker-compose down

echo "🧹 清理未使用的容器和网络..."
docker system prune -f

echo "✅ 所有服务已停止"