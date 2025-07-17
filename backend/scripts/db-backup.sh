#!/bin/bash

# 数据库备份脚本
# 使用方法: ./db-backup.sh [backup_name]

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

# 创建备份目录
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR

# 生成备份文件名
if [ -z "$1" ]; then
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_NAME="backup_${TIMESTAMP}"
else
    BACKUP_NAME="$1"
fi

BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"

echo "开始备份数据库..."
echo "数据库: ${DB_NAME}"
echo "备份文件: ${BACKUP_FILE}"

# 执行备份
PGPASSWORD=$DB_PASSWORD pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --verbose \
    --clean \
    --if-exists \
    --create \
    --format=plain \
    --encoding=UTF8 \
    > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "备份成功完成: ${BACKUP_FILE}"
    
    # 压缩备份文件
    gzip $BACKUP_FILE
    echo "备份文件已压缩: ${BACKUP_FILE}.gz"
    
    # 显示文件大小
    ls -lh "${BACKUP_FILE}.gz"
    
    # 清理7天前的备份文件
    find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
    echo "已清理7天前的备份文件"
else
    echo "备份失败"
    exit 1
fi