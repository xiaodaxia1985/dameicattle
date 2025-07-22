#!/bin/bash

# 数据库备份脚本
set -e

# 配置变量
BACKUP_DIR="/backup"
POSTGRES_HOST="${POSTGRES_HOST:-postgres-master}"
POSTGRES_DB="${POSTGRES_DB:-cattle_management}"
POSTGRES_USER="${POSTGRES_USER:-cattle_user}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p "$BACKUP_DIR/daily"
mkdir -p "$BACKUP_DIR/weekly"
mkdir -p "$BACKUP_DIR/monthly"
mkdir -p "$BACKUP_DIR/archive"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 数据库备份函数
backup_database() {
    local backup_type=$1
    local backup_path="$BACKUP_DIR/$backup_type"
    local backup_file="$backup_path/cattle_management_${backup_type}_${DATE}.sql"
    
    log "Starting $backup_type database backup..."
    
    # 创建SQL备份
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h "$POSTGRES_HOST" \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --verbose \
        --no-owner \
        --no-privileges \
        --format=custom \
        --file="$backup_file"
    
    # 压缩备份文件
    gzip "$backup_file"
    backup_file="${backup_file}.gz"
    
    log "$backup_type backup completed: $backup_file"
    
    # 验证备份文件
    if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
        log "$backup_type backup verification successful"
        
        # 创建校验和
        md5sum "$backup_file" > "${backup_file}.md5"
        
        # 记录备份信息
        echo "$(date '+%Y-%m-%d %H:%M:%S') - $backup_type backup: $(basename $backup_file) - $(du -h $backup_file | cut -f1)" >> "$BACKUP_DIR/backup.log"
    else
        log "ERROR: $backup_type backup verification failed"
        exit 1
    fi
}

# 清理旧备份
cleanup_old_backups() {
    local backup_type=$1
    local retention_days=$2
    local backup_path="$BACKUP_DIR/$backup_type"
    
    log "Cleaning up old $backup_type backups (older than $retention_days days)..."
    
    find "$backup_path" -name "*.sql.gz" -type f -mtime +$retention_days -delete
    find "$backup_path" -name "*.md5" -type f -mtime +$retention_days -delete
    
    log "Old $backup_type backups cleanup completed"
}

# 主备份逻辑
main() {
    log "Starting backup process..."
    
    # 检查数据库连接
    if ! PGPASSWORD="$POSTGRES_PASSWORD" pg_isready -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB"; then
        log "ERROR: Cannot connect to database"
        exit 1
    fi
    
    # 获取当前日期信息
    DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday
    DAY_OF_MONTH=$(date +%d)
    
    # 每日备份
    backup_database "daily"
    cleanup_old_backups "daily" 7
    
    # 每周备份 (周日)
    if [ "$DAY_OF_WEEK" -eq 7 ]; then
        backup_database "weekly"
        cleanup_old_backups "weekly" 30
    fi
    
    # 每月备份 (每月1号)
    if [ "$DAY_OF_MONTH" -eq "01" ]; then
        backup_database "monthly"
        cleanup_old_backups "monthly" 365
    fi
    
    # 清理归档日志
    find "$BACKUP_DIR/archive" -name "*.backup" -type f -mtime +7 -delete
    
    log "Backup process completed successfully"
}

# 如果作为定时任务运行
if [ "$1" = "cron" ]; then
    # 设置cron任务
    echo "$BACKUP_SCHEDULE root /backup.sh" > /etc/cron.d/db-backup
    crontab /etc/cron.d/db-backup
    
    # 启动cron服务
    crond -f
else
    # 直接运行备份
    main
fi