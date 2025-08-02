#!/bin/bash

echo "🏥 检查所有服务健康状态..."

services=(
  "api-gateway:3000"
  "auth-service:3001"
  "base-service:3002"
  "cattle-service:3003"
  "health-service:3004"
  "feeding-service:3005"
  "equipment-service:3006"
  "procurement-service:3007"
  "sales-service:3008"
  "material-service:3009"
  "notification-service:3010"
  "file-service:3011"
  "monitoring-service:3012"
)

for service in "${services[@]}"; do
  name=$(echo $service | cut -d: -f1)
  port=$(echo $service | cut -d: -f2)
  
  echo -n "检查 $name... "
  
  if curl -s -f "http://localhost:$port/health" > /dev/null; then
    echo "✅ 健康"
  else
    echo "❌ 不健康"
  fi
done

echo ""
echo "📊 查看详细健康状态:"
echo "curl http://localhost:3000/api/v1/health"