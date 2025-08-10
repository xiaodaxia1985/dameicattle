# 数据库初始化文件说明

## 文件列表

### 核心文件
- **`init-clean.sql`** - 主数据库初始化脚本
  - 创建所有表结构、索引、约束
  - 插入初始数据
  - 创建触发器和视图
  - 设置权限

- **`init-database-clean.bat`** - Windows一键初始化脚本
  - 自动执行init-clean.sql
  - 显示初始化结果
  - 提供错误诊断信息

### 文档文件
- **`DATABASE_SCHEMA.md`** - 完整的数据库架构文档
  - 表结构说明
  - 业务逻辑描述
  - 索引和约束说明
  - 使用指南

### 配置文件
- **`pg_hba.conf`** - PostgreSQL客户端认证配置
- **`postgresql.conf`** - PostgreSQL服务器配置

## 使用方法

### Windows环境
```cmd
cd database
init-database-clean.bat
```

### Linux/Mac环境
```bash
cd database
psql -h localhost -p 5432 -U postgres -d cattle_management -f init-clean.sql
```

## 前置条件

1. PostgreSQL服务已启动
2. 已创建数据库 `cattle_management`
3. 具有数据库管理权限

## 初始化后信息

- **数据库**: cattle_management
- **应用用户**: cattle_user / cattle_password
- **管理员**: admin / admin123
- **表数量**: 39个
- **视图数量**: 4个
- **索引数量**: 169个