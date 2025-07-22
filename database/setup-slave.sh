#!/bin/bash
set -e

# 等待主数据库启动
echo "Waiting for master database to be ready..."
until pg_isready -h postgres-master -p 5432 -U cattle_user; do
    echo "Master database is not ready yet..."
    sleep 2
done

echo "Master database is ready, setting up slave..."

# 停止PostgreSQL服务
pg_ctl stop -D "$PGDATA" -m fast || true

# 清空数据目录
rm -rf "$PGDATA"/*

# 从主数据库创建基础备份
echo "Creating base backup from master..."
pg_basebackup -h postgres-master -D "$PGDATA" -U replicator -v -P -W

# 创建recovery.conf (PostgreSQL 12+使用postgresql.conf)
cat > "$PGDATA/postgresql.conf" <<EOF
# 从数据库配置
hot_standby = on
primary_conninfo = 'host=postgres-master port=5432 user=replicator password=$POSTGRES_REPLICATION_PASSWORD'
primary_slot_name = 'replica_slot'
EOF

# 创建standby.signal文件 (PostgreSQL 12+)
touch "$PGDATA/standby.signal"

# 设置权限
chmod 600 "$PGDATA/postgresql.conf"
chown postgres:postgres "$PGDATA/standby.signal"

echo "Slave setup completed"

# 启动PostgreSQL
exec postgres