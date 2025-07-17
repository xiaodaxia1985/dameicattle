# 肉牛全生命周期管理系统 - 数据库文档

## 概述

本系统使用 PostgreSQL 作为主数据库，Redis 作为缓存数据库。数据库设计遵循第三范式，支持完整的肉牛养殖业务流程。

## 数据库架构

### 核心模块
- **用户认证与权限管理**: 用户、角色、权限控制
- **基础数据管理**: 基地、牛棚、牛只档案
- **健康管理**: 诊疗记录、疫苗接种
- **饲喂管理**: 配方管理、饲喂记录
- **物资管理**: 生产物资、库存管理
- **设备管理**: 生产设备、维护记录
- **采购销售**: 供应商、客户、订单管理
- **新闻管理**: 企业新闻、评论互动
- **系统监控**: 操作日志、系统统计

### 数据表结构

#### 用户权限模块
- `roles` - 角色表
- `users` - 用户表
- `bases` - 基地表

#### 养殖管理模块
- `barns` - 牛棚表
- `cattle` - 牛只表
- `cattle_events` - 牛只生命周期事件表

#### 健康管理模块
- `health_records` - 诊疗记录表
- `vaccination_records` - 疫苗接种记录表

#### 饲喂管理模块
- `feed_formulas` - 饲料配方表
- `feeding_records` - 饲喂记录表

#### 物资管理模块
- `material_categories` - 物资分类表
- `production_materials` - 生产物资表
- `inventory` - 库存表
- `inventory_transactions` - 库存变动记录表
- `inventory_alerts` - 库存预警表

#### 设备管理模块
- `equipment_categories` - 设备分类表
- `production_equipment` - 生产设备表
- `equipment_maintenance_plans` - 设备维护计划表
- `equipment_maintenance_records` - 设备维护记录表
- `equipment_failures` - 设备故障记录表

#### 采购销售模块
- `suppliers` - 供应商表
- `customers` - 客户表
- `purchase_orders` - 采购订单表
- `purchase_order_items` - 采购订单明细表
- `sales_orders` - 销售订单表
- `sales_order_items` - 销售订单明细表

#### 新闻管理模块
- `news_categories` - 新闻分类表
- `news_articles` - 新闻文章表
- `news_comments` - 新闻评论表
- `news_views` - 新闻浏览记录表
- `news_likes` - 新闻点赞记录表

#### 系统监控模块
- `system_logs` - 系统日志表

## 环境配置

### 环境变量
在 `.env` 文件中配置以下数据库连接参数：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cattle_management
DB_USER=postgres
DB_PASSWORD=your_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 系统要求
- PostgreSQL 12+
- Redis 6+
- Node.js 18+

## 数据库安装与初始化

### 1. 安装 PostgreSQL

#### Windows
```bash
# 下载并安装 PostgreSQL
# https://www.postgresql.org/download/windows/
```

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. 创建数据库用户
```sql
-- 连接到 PostgreSQL
sudo -u postgres psql

-- 创建用户
CREATE USER cattle_user WITH PASSWORD 'your_password';

-- 授予权限
ALTER USER cattle_user CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE cattle_management TO cattle_user;
```

### 3. 初始化数据库

#### 方法一：使用脚本初始化（推荐）
```bash
# 进入后端目录
cd backend

# 运行初始化脚本
npm run db:init
```

#### 方法二：使用 Node.js 迁移工具
```bash
# 运行迁移
npm run migrate
```

#### 方法三：手动执行 SQL 文件
```bash
# 按顺序执行迁移文件
psql -h localhost -U cattle_user -d cattle_management -f src/migrations/001-create-initial-tables.sql
psql -h localhost -U cattle_user -d cattle_management -f src/migrations/002-seed-data.sql
psql -h localhost -U cattle_user -d cattle_management -f src/migrations/003-add-missing-tables.sql
psql -h localhost -U cattle_user -d cattle_management -f src/migrations/004-seed-additional-data.sql
psql -h localhost -U cattle_user -d cattle_management -f src/migrations/005-optimize-database.sql
```

## 数据库管理

### 备份数据库

#### 使用脚本备份
```bash
# 创建备份
npm run db:backup

# 创建命名备份
npm run db:backup-shell my_backup_name
```

#### 手动备份
```bash
pg_dump -h localhost -U cattle_user -d cattle_management > backup.sql
```

### 恢复数据库

#### 使用脚本恢复
```bash
# 恢复备份
npm run db:restore-shell backups/backup_20240115_143000.sql.gz
```

#### 手动恢复
```bash
psql -h localhost -U cattle_user -d cattle_management < backup.sql
```

### 数据清理
系统提供自动数据清理功能：

```sql
-- 手动执行数据清理
SELECT cleanup_old_data();
```

清理内容：
- 90天前的系统日志
- 30天前的新闻浏览记录
- 7天前已解决的库存预警

## 性能优化

### 索引策略
系统创建了以下类型的索引：
- **B-tree索引**: 用于常规查询和排序
- **复合索引**: 优化多字段查询
- **部分索引**: 节省存储空间
- **表达式索引**: 支持函数查询
- **GIN索引**: 优化JSONB字段查询
- **全文搜索索引**: 支持中文全文搜索

### 触发器功能
- **自动更新时间戳**: 自动维护 `updated_at` 字段
- **库存自动更新**: 根据库存变动自动更新库存数量
- **库存预警**: 自动创建低库存预警
- **牛棚数量统计**: 自动维护牛棚内牛只数量
- **新闻统计**: 自动更新浏览量、点赞数、评论数

### 统计视图
系统提供以下统计视图：
- `v_cattle_statistics`: 牛只统计信息
- `v_inventory_status`: 库存状态统计
- `v_equipment_maintenance_schedule`: 设备维护计划

## 数据字典

### 枚举值定义

#### 用户状态 (users.status)
- `active`: 激活
- `inactive`: 未激活
- `locked`: 锁定

#### 牛只性别 (cattle.gender)
- `male`: 公牛
- `female`: 母牛

#### 健康状态 (cattle.health_status)
- `healthy`: 健康
- `sick`: 生病
- `treatment`: 治疗中

#### 库存变动类型 (inventory_transactions.transaction_type)
- `inbound`: 入库
- `outbound`: 出库
- `transfer`: 调拨
- `adjustment`: 盘点调整

#### 订单状态 (purchase_orders.status, sales_orders.status)
- `pending`: 待处理
- `approved`: 已审批
- `ordered`: 已下单
- `delivered`: 已交付
- `completed`: 已完成
- `cancelled`: 已取消

#### 设备状态 (production_equipment.status)
- `normal`: 正常
- `maintenance`: 维护中
- `broken`: 故障
- `retired`: 已报废

## 常用查询示例

### 牛只统计查询
```sql
-- 按基地统计牛只数量
SELECT * FROM v_cattle_statistics;

-- 查询健康状况异常的牛只
SELECT c.ear_tag, c.breed, c.health_status, b.name as base_name
FROM cattle c
JOIN bases b ON c.base_id = b.id
WHERE c.health_status != 'healthy';
```

### 库存查询
```sql
-- 查询库存状态
SELECT * FROM v_inventory_status WHERE stock_status IN ('库存不足', '严重不足');

-- 查询库存预警
SELECT 
    b.name as base_name,
    pm.name as material_name,
    ia.message,
    ia.alert_level,
    ia.created_at
FROM inventory_alerts ia
JOIN production_materials pm ON ia.material_id = pm.id
JOIN bases b ON ia.base_id = b.id
WHERE ia.is_resolved = FALSE
ORDER BY ia.alert_level DESC, ia.created_at DESC;
```

### 设备维护查询
```sql
-- 查询设备维护计划
SELECT * FROM v_equipment_maintenance_schedule 
WHERE maintenance_status IN ('逾期', '即将到期')
ORDER BY next_maintenance_date;
```

## 故障排除

### 常见问题

#### 1. 连接失败
```bash
# 检查PostgreSQL服务状态
sudo systemctl status postgresql

# 检查端口是否开放
netstat -an | grep 5432

# 检查配置文件
sudo nano /etc/postgresql/*/main/postgresql.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

#### 2. 权限问题
```sql
-- 检查用户权限
\du

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE cattle_management TO cattle_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cattle_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cattle_user;
```

#### 3. 性能问题
```sql
-- 查看慢查询
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 分析表统计信息
ANALYZE;

-- 重建索引
REINDEX DATABASE cattle_management;
```

### 监控命令
```sql
-- 查看数据库大小
SELECT pg_size_pretty(pg_database_size('cattle_management'));

-- 查看表大小
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 查看连接数
SELECT count(*) FROM pg_stat_activity;

-- 查看锁信息
SELECT * FROM pg_locks WHERE NOT granted;
```

## 开发指南

### 添加新表
1. 在 `src/migrations/` 目录创建新的迁移文件
2. 按照命名规范：`XXX-description.sql`
3. 更新 `init-database.sh` 脚本
4. 创建对应的 Sequelize 模型

### 数据库版本控制
- 所有数据库变更必须通过迁移文件
- 迁移文件只能追加，不能修改已有文件
- 生产环境部署前必须测试迁移脚本

### 最佳实践
- 使用事务确保数据一致性
- 合理使用索引，避免过度索引
- 定期备份数据库
- 监控数据库性能
- 使用连接池管理数据库连接

## 联系方式

如有数据库相关问题，请联系开发团队。