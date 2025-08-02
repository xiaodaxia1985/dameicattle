# 单体架构到微服务迁移指南

## 迁移概述

本指南将帮助你从现有的单体架构平滑迁移到微服务架构，确保业务连续性和数据一致性。

## 迁移策略

### 1. 渐进式迁移（推荐）
- 保持现有单体应用运行
- 逐步将功能模块迁移到微服务
- 使用API网关进行流量路由
- 数据逐步分离

### 2. 大爆炸迁移
- 一次性切换到微服务架构
- 风险较高，需要充分测试
- 适合小型应用或有充足停机时间的场景

## 迁移步骤

### 阶段1: 准备阶段

#### 1.1 环境准备
```bash
# 1. 备份现有数据库
pg_dump cattle_management > backup_$(date +%Y%m%d).sql

# 2. 创建微服务环境
cd microservices
./scripts/start-dev.sh

# 3. 验证微服务环境
./scripts/health-check.sh
```

#### 1.2 数据分析
分析现有数据库表，按业务域划分：

**认证域 (auth-service)**
- users
- roles
- permissions

**基地域 (base-service)**
- bases
- barns

**牛只域 (cattle-service)**
- cattle
- cattle_batches
- cattle_events

**健康域 (health-service)**
- health_records
- vaccination_records

**饲养域 (feeding-service)**
- feeding_records
- feed_formulas

**设备域 (equipment-service)**
- production_equipment
- equipment_categories
- equipment_maintenance_records
- equipment_maintenance_plans
- equipment_failures
- iot_devices

**采购域 (procurement-service)**
- suppliers
- purchase_orders
- purchase_order_items

**销售域 (sales-service)**
- customers
- sales_orders
- sales_order_items
- customer_visit_records

**物料域 (material-service)**
- production_materials
- material_categories
- inventory
- inventory_transactions
- inventory_alerts

### 阶段2: 数据迁移

#### 2.1 创建数据迁移脚本
```bash
# 创建迁移脚本目录
mkdir -p migration/scripts
```

#### 2.2 认证服务数据迁移
```sql
-- migration/scripts/01-migrate-auth-data.sql
-- 迁移用户数据到认证服务数据库
\c auth_db;

INSERT INTO users (id, username, email, password, role, "baseId", "isActive", "lastLoginAt", "createdAt", "updatedAt")
SELECT id, username, email, password, role, base_id, is_active, last_login_at, created_at, updated_at
FROM cattle_management.users;

-- 更新序列
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
```

#### 2.3 其他服务数据迁移
为每个服务创建类似的迁移脚本。

### 阶段3: 服务迁移

#### 3.1 认证服务迁移
```bash
# 1. 启动认证服务
docker-compose up -d auth-service

# 2. 迁移认证数据
psql -h localhost -U postgres -f migration/scripts/01-migrate-auth-data.sql

# 3. 测试认证功能
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

#### 3.2 API网关配置
```bash
# 启动API网关
docker-compose up -d api-gateway

# 配置路由规则，将认证相关请求路由到认证服务
# 其他请求继续路由到单体应用
```

#### 3.3 逐步迁移其他服务
按照业务优先级和依赖关系迁移：
1. 基地服务 (base-service)
2. 牛只服务 (cattle-service)
3. 健康服务 (health-service)
4. 饲养服务 (feeding-service)
5. 设备服务 (equipment-service)
6. 物料服务 (material-service)
7. 采购服务 (procurement-service)
8. 销售服务 (sales-service)

### 阶段4: 前端适配

#### 4.1 更新API配置
```typescript
// frontend/src/config/apiConfig.ts
const API_CONFIG = {
  // 开发环境使用API网关
  baseURL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000/api/v1'
    : 'https://api.cattle-management.com/api/v1',
  
  // 服务端点映射
  endpoints: {
    auth: '/auth',
    users: '/auth/users',
    bases: '/base',
    barns: '/base/barns',
    cattle: '/cattle',
    health: '/health',
    feeding: '/feeding',
    equipment: '/equipment',
    materials: '/material',
    suppliers: '/procurement/suppliers',
    purchaseOrders: '/procurement/orders',
    customers: '/sales/customers',
    salesOrders: '/sales/orders'
  }
};
```

#### 4.2 更新HTTP客户端
```typescript
// frontend/src/utils/httpClient.ts
import axios from 'axios';

const httpClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: 10000
});

// 请求拦截器 - 添加认证token
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器 - 处理错误
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 处理认证失败
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 阶段5: 测试和验证

#### 5.1 功能测试
```bash
# 创建测试脚本
mkdir -p migration/tests

# 测试认证功能
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 测试业务功能
# ... 其他API测试
```

#### 5.2 性能测试
```bash
# 使用ab或wrk进行压力测试
ab -n 1000 -c 10 http://localhost:3000/api/v1/health

# 监控服务性能
docker stats
```

#### 5.3 数据一致性验证
```sql
-- 验证数据迁移完整性
-- 比较单体数据库和微服务数据库的记录数
SELECT 'users' as table_name, count(*) from cattle_management.users
UNION ALL
SELECT 'users_migrated', count(*) from auth_db.users;
```

### 阶段6: 切换和清理

#### 6.1 流量切换
```bash
# 1. 更新负载均衡器配置
# 2. 将所有流量切换到API网关
# 3. 监控服务状态和错误率
```

#### 6.2 单体应用下线
```bash
# 1. 停止单体应用
# 2. 备份单体数据库
# 3. 清理旧的部署资源
```

#### 6.3 数据清理
```sql
-- 清理单体数据库中已迁移的数据（可选）
-- 保留备份以防回滚需要
```

## 回滚策略

### 快速回滚
```bash
# 1. 重新启动单体应用
# 2. 更新负载均衡器配置
# 3. 恢复数据库（如有必要）
```

### 数据同步回滚
```bash
# 1. 将微服务中的新数据同步回单体数据库
# 2. 验证数据完整性
# 3. 切换流量
```

## 监控和告警

### 关键指标
- 服务可用性
- 响应时间
- 错误率
- 数据库连接数
- 内存和CPU使用率

### 告警配置
```yaml
# 示例告警规则
alerts:
  - name: ServiceDown
    condition: up == 0
    duration: 1m
    
  - name: HighErrorRate
    condition: error_rate > 0.05
    duration: 5m
    
  - name: SlowResponse
    condition: response_time_p95 > 2s
    duration: 5m
```

## 常见问题和解决方案

### 1. 数据一致性问题
**问题**: 微服务间数据不一致
**解决方案**: 
- 实施事件驱动架构
- 使用Saga模式处理分布式事务
- 定期数据同步和校验

### 2. 服务间调用失败
**问题**: 服务间网络调用失败
**解决方案**:
- 实施重试机制
- 使用断路器模式
- 服务降级策略

### 3. 性能下降
**问题**: 微服务架构导致性能下降
**解决方案**:
- 优化服务间调用
- 实施缓存策略
- 数据库连接池优化

### 4. 运维复杂度增加
**问题**: 微服务运维复杂
**解决方案**:
- 统一日志收集
- 分布式链路追踪
- 自动化部署和监控

## 最佳实践

1. **渐进式迁移**: 不要一次性迁移所有服务
2. **数据备份**: 每个阶段都要备份数据
3. **充分测试**: 每个服务迁移后都要充分测试
4. **监控告警**: 建立完善的监控体系
5. **回滚准备**: 准备快速回滚方案
6. **团队培训**: 确保团队了解微服务架构
7. **文档更新**: 及时更新架构和API文档

## 迁移时间表

| 阶段 | 预计时间 | 主要任务 |
|------|----------|----------|
| 准备阶段 | 1-2周 | 环境搭建、数据分析 |
| 认证服务迁移 | 1周 | 认证服务开发和迁移 |
| 核心服务迁移 | 2-3周 | 基地、牛只、健康服务 |
| 业务服务迁移 | 2-3周 | 饲养、设备、物料服务 |
| 交易服务迁移 | 1-2周 | 采购、销售服务 |
| 测试和优化 | 1-2周 | 全面测试和性能优化 |
| 上线和监控 | 1周 | 生产环境部署和监控 |

总计: 8-12周

## 成功标准

- [ ] 所有业务功能正常运行
- [ ] 系统性能不低于迁移前
- [ ] 数据完整性100%
- [ ] 服务可用性 > 99.9%
- [ ] 平均响应时间 < 500ms
- [ ] 错误率 < 0.1%
- [ ] 团队能够独立运维微服务架构