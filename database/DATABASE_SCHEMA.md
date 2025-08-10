# 肉牛全生命周期管理系统 - 数据库架构文档

## 概述

本文档描述了肉牛全生命周期管理系统的完整数据库架构，包括所有表结构、关系、索引和约束。

## 数据库信息

- **数据库名称**: cattle_management
- **数据库版本**: 1.0.3
- **字符编码**: UTF-8
- **应用用户**: cattle_user
- **管理员用户**: admin (默认密码: admin123)

## 表结构概览

系统共包含 **39个数据表** 和 **4个视图**，分为以下几个功能模块：

### 1. 基础数据模块 (3张表)
- `users` - 用户表
- `bases` - 基地表  
- `barns` - 牛棚表

### 2. 供应商客户模块 (2张表)
- `suppliers` - 供应商表
- `customers` - 客户表

### 3. 牛只管理模块 (2张表)
- `cattle` - 牛只表
- `cattle_events` - 牛只事件表

### 4. 健康管理模块 (2张表)
- `health_records` - 健康记录表
- `vaccination_records` - 疫苗记录表

### 5. 饲养管理模块 (2张表)
- `feed_formulas` - 饲料配方表
- `feeding_records` - 饲喂记录表

### 6. 物料管理模块 (4张表)
- `material_categories` - 物料分类表
- `production_materials` - 生产物料表
- `inventories` - 库存表
- `inventory_transactions` - 库存交易记录表

### 7. 采购管理模块 (2张表)
- `purchase_orders` - 采购订单表
- `purchase_order_items` - 采购订单明细表

### 8. 销售管理模块 (2张表)
- `sales_orders` - 销售订单表
- `sales_order_items` - 销售订单明细表

### 9. 新闻管理模块 (2张表)
- `news_categories` - 新闻分类表
- `news_articles` - 新闻文章表

### 10. 系统管理模块 (3张表)
- `operation_logs` - 操作日志表
- `system_configs` - 系统配置表
- `file_uploads` - 文件上传记录表

### 11. 扩展功能模块 (2张表)
- `patrol_records` - 巡圈记录表
- `iot_devices` - 物联网设备表

## 核心表详细说明

### 用户表 (users)
存储系统用户信息，支持多角色权限管理。

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(50),
    phone VARCHAR(20),
    email VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'employee',
    base_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**角色类型**:
- `super_admin`: 超级管理员
- `base_admin`: 基地管理员  
- `employee`: 普通员工

### 基地表 (bases)
存储养殖基地的基本信息。

```sql
CREATE TABLE bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    area DECIMAL(10, 2),
    manager_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 牛只表 (cattle)
存储牛只的详细信息，是系统的核心业务表。

```sql
CREATE TABLE cattle (
    id SERIAL PRIMARY KEY,
    ear_tag VARCHAR(50) NOT NULL UNIQUE,
    breed VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    birth_date DATE,
    weight DECIMAL(8, 2),
    health_status VARCHAR(20) NOT NULL DEFAULT 'healthy',
    base_id INTEGER NOT NULL,
    barn_id INTEGER,
    photos JSONB DEFAULT '[]',
    parent_male_id INTEGER,
    parent_female_id INTEGER,
    source VARCHAR(20) NOT NULL DEFAULT 'purchased',
    purchase_price DECIMAL(10, 2),
    purchase_date DATE,
    supplier_id INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**健康状态**:
- `healthy`: 健康
- `sick`: 生病
- `treatment`: 治疗中

**牛只状态**:
- `active`: 在场
- `sold`: 已售出
- `dead`: 死亡
- `transferred`: 已转移

## 关键业务逻辑

### 1. 牛棚容量管理
通过触发器自动维护牛棚的当前牛只数量：
- 牛只进入牛棚时，`current_count` 自动 +1
- 牛只离开牛棚时，`current_count` 自动 -1
- 牛只在牛棚间转移时，自动更新相关牛棚的数量

### 2. 库存管理
- 支持多基地库存管理
- 自动库存预警（低库存/超库存）
- 完整的库存交易记录追踪

### 3. 订单管理
- 支持采购订单和销售订单
- 订单状态流转管理
- 订单明细管理

## 视图说明

### 1. 牛只统计视图 (v_cattle_statistics)
按基地统计牛只的各种状态数据。

### 2. 基地概览视图 (v_base_overview)  
提供基地的综合信息，包括牛棚数量、容量利用率等。

### 3. 健康统计视图 (v_health_statistics)
按基地统计健康记录相关数据。

### 4. 库存预警视图 (v_inventory_alerts)
显示需要关注的库存预警信息。

## 索引策略

系统创建了 **169个索引** 来优化查询性能：

### 主要索引类型
1. **主键索引**: 每个表的主键自动创建
2. **唯一索引**: 用于唯一约束字段
3. **外键索引**: 优化关联查询性能
4. **业务索引**: 基于常用查询条件创建

### 重要业务索引
- `idx_cattle_ear_tag`: 牛只耳标索引
- `idx_cattle_base_id`: 按基地查询牛只
- `idx_cattle_health_status`: 按健康状态查询
- `idx_operation_logs_created_at`: 操作日志时间索引

## 数据完整性约束

### 1. 外键约束
- 确保数据关联的完整性
- 支持级联删除和置空操作

### 2. 检查约束
- 枚举值验证（如角色、状态等）
- 数值范围验证（如经纬度、重量等）

### 3. 唯一约束
- 用户名唯一性
- 牛只耳标唯一性
- 基地代码唯一性

## 触发器功能

### 1. 时间戳自动更新
所有表的 `updated_at` 字段在记录更新时自动更新为当前时间。

### 2. 牛棚数量自动维护
当牛只的牛棚分配发生变化时，自动更新相关牛棚的 `current_count` 字段。

## 初始数据

系统预置了以下初始数据：
- 系统配置参数
- 默认管理员账户 (admin/admin123)
- 基础物料分类
- 新闻分类
- 基础饲料配方
- 常用生产物料

## 使用说明

### 初始化数据库
```bash
# Windows
cd database
init-database-clean.bat

# Linux/Mac  
cd database
psql -h localhost -p 5432 -U postgres -d cattle_management -f init-clean.sql
```

### 连接信息
- **主机**: localhost
- **端口**: 5432
- **数据库**: cattle_management
- **应用用户**: cattle_user
- **应用密码**: cattle_password

## 维护建议

### 1. 定期备份
建议每日备份数据库，保留30天的备份文件。

### 2. 性能监控
定期检查慢查询日志，优化查询性能。

### 3. 数据清理
定期清理过期的操作日志和临时数据。

### 4. 安全维护
- 定期更新管理员密码
- 监控异常登录行为
- 定期检查用户权限

## 版本历史

- **v1.0.3** (2025-08-10): 修复编码问题，完善数据库结构
- **v1.0.2** (2025-08-10): 优化索引和触发器
- **v1.0.1** (2025-08-10): 添加扩展功能表
- **v1.0.0** (2025-08-10): 初始版本