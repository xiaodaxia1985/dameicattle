#!/bin/bash

# 数据库恢复脚本
# 使用方法: ./db-restore.sh <backup_file>

if [ -z "$1" ]; then
    echo "使用方法: $0 <backup_file>"
    echo "示例: $0 backups/backup_20240115_143000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "错误: 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

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

echo "警告: 此操作将完全替换现有数据库!"
echo "数据库: ${DB_NAME}"
echo "备份文件: ${BACKUP_FILE}"
echo ""
read -p "确认继续吗? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "操作已取消"
    exit 1
fi

echo "开始恢复数据库..."

# 检查文件是否压缩
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "解压备份文件..."
    TEMP_FILE=$(mktemp)
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    RESTORE_FILE="$TEMP_FILE"
else
    RESTORE_FILE="$BACKUP_FILE"
fi

# 执行恢复
PGPASSWORD=$DB_PASSWORD psql \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d postgres \
    --quiet \
    < "$RESTORE_FILE"

if [ $? -eq 0 ]; then
    echo "数据库恢复成功"
    
    # 清理临时文件
    if [[ $BACKUP_FILE == *.gz ]]; then
        rm -f "$TEMP_FILE"
    fi
else
    echo "数据库恢复失败"
    
    # 清理临时文件
    if [[ $BACKUP_FILE == *.gz ]]; then
        rm -f "$TEMP_FILE"
    fi
    
    exit 1
fi