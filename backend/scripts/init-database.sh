#!/bin/bash

# 数据库初始化脚本
# 创建数据库并运行所有迁移

# 加载环境变量
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# 设置默认值
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-cattle_management}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-dianxin99}

echo "初始化数据库: ${DB_NAME}"
echo "主机: ${DB_HOST}:${DB_PORT}"
echo "用户: ${DB_USER}"
echo ""

# 检查PostgreSQL连接
echo "检查数据库连接..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT version();" > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "错误: 无法连接到PostgreSQL服务器"
    echo "请检查数据库服务是否运行，以及连接参数是否正确"
    exit 1
fi

echo "数据库连接正常"

# 创建数据库（如果不存在）
echo "创建数据库..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "数据库 ${DB_NAME} 创建成功"
else
    echo "数据库 ${DB_NAME} 已存在或创建失败"
fi

# 运行迁移脚本
MIGRATION_DIR="src/migrations"
MIGRATION_FILES=(
    "001-create-initial-tables.sql"
    "002-seed-data.sql"
    "003-add-missing-tables.sql"
    "004-seed-additional-data.sql"
    "005-optimize-database.sql"
)

echo ""
echo "开始运行数据库迁移..."

for file in "${MIGRATION_FILES[@]}"; do
    migration_file="${MIGRATION_DIR}/${file}"
    
    if [ -f "$migration_file" ]; then
        echo "执行迁移: $file"
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$migration_file"
        
        if [ $? -eq 0 ]; then
            echo "✓ $file 执行成功"
        else
            echo "✗ $file 执行失败"
            exit 1
        fi
    else
        echo "警告: 迁移文件不存在: $migration_file"
    fi
    
    echo ""
done

echo "数据库初始化完成!"
echo ""
echo "数据库统计信息:"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
ORDER BY schemaname, tablename;
"

echo ""
echo "可以使用以下命令连接数据库:"
echo "PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"