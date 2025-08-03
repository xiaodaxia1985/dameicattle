#!/bin/bash
# 本地PostgreSQL数据库初始化脚本
# Bash script for Linux/macOS

echo "🗄️  初始化本地PostgreSQL数据库..."

# 检查PostgreSQL是否运行
echo "📋 检查PostgreSQL连接..."
if ! lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "❌ PostgreSQL未运行，请先启动PostgreSQL服务"
    echo "   macOS: brew services start postgresql"
    echo "   Linux: sudo systemctl start postgresql"
    exit 1
fi
echo "✅ PostgreSQL连接正常"

# 数据库列表
databases=(
    "auth_db"
    "base_db"
    "cattle_db"
    "health_db"
    "feeding_db"
    "equipment_db"
    "procurement_db"
    "sales_db"
    "material_db"
    "news_db"
)

echo "🔨 创建微服务数据库..."

for db in "${databases[@]}"; do
    echo "  创建数据库: $db"
    
    # 检查数据库是否存在
    if psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw "$db"; then
        echo "    ✅ 数据库 $db 已存在"
    else
        # 创建数据库
        if createdb -h localhost -U postgres "$db" 2>/dev/null; then
            echo "    ✅ 数据库 $db 创建成功"
        else
            echo "    ❌ 数据库 $db 创建失败"
        fi
    fi
done

echo ""
echo "📋 验证数据库创建..."
echo "当前数据库列表:"
psql -h localhost -U postgres -l 2>/dev/null || echo "❌ 无法列出数据库"

echo ""
echo "🎉 数据库初始化完成！"
echo ""
echo "📝 注意事项:"
echo "  - 确保PostgreSQL服务正在运行"
echo "  - 确保Redis服务正在运行"
echo "  - 数据库用户: postgres"
echo "  - 数据库密码: dianxin99"
echo ""
echo "🚀 现在可以运行微服务启动脚本:"
echo "   ./scripts/start-microservice-dev.sh"
echo ""