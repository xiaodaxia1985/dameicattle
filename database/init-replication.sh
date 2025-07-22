#!/bin/bash
set -e

# 创建复制用户
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- 创建复制用户
    CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD '$POSTGRES_REPLICATION_PASSWORD';
    
    -- 创建复制槽
    SELECT pg_create_physical_replication_slot('replica_slot');
    
    -- 创建备份目录
    \! mkdir -p /backup/archive
    \! chmod 755 /backup/archive
EOSQL

echo "Replication user and slot created successfully"