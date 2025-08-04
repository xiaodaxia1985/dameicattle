# 微服务迁移执行计划

## 阶段1: 基础设施准备（1-2周）

### 1.1 环境搭建
```bash
# 1. 启动微服务基础设施
cd microservices
docker-compose up -d postgres redis

# 2. 初始化数据库
./scripts/init-local-database.ps1

# 3. 启动API网关
docker-compose up -d api-gateway
```

### 1.2 数据库分离准备
```sql
-- 创建各个微服务的独立数据库
CREATE DATABASE auth_db;
CREATE DATABASE base_db;
CREATE DATABASE cattle_db;
CREATE DATABASE health_db;
CREATE DATABASE feeding_db;
-- ... 其他服务数据库
```

### 1.3 配置API网关路由
```javascript
// microservices/api-gateway/src/routes/index.ts
const serviceRoutes = {
  '/api/v1/auth': 'http://auth-service:3001',
  '/api/v1/base': 'http://base-service:3002',
  '/api/v1/cattle': 'http://cattle-service:3003',
  // 其他路由继续指向单体应用
  '/api/v1/*': 'http://backend:3000'
}
```

## 阶段2: 核心服务迁移（2-3周）

### 2.1 认证服务迁移
- 迁移用户认证逻辑
- 数据迁移脚本
- JWT token兼容性

### 2.2 基地服务迁移
- 基地和牛舍管理
- 数据关系维护
- API兼容性测试

### 2.3 牛只服务迁移
- 牛只核心数据
- 事件记录系统
- 批量操作支持

## 阶段3: 业务服务迁移（2-3周）

### 3.1 健康服务
### 3.2 饲养服务
### 3.3 设备服务
### 3.4 物料服务

## 阶段4: 交易服务迁移（1-2周）

### 4.1 采购服务
### 4.2 销售服务

## 阶段5: 支撑服务（1周）

### 5.1 通知服务
### 5.2 文件服务
### 5.3 监控服务

## 阶段6: 测试和优化（1-2周）

### 6.1 全链路测试
### 6.2 性能优化
### 6.3 监控告警

## 阶段7: 生产部署（1周）

### 7.1 生产环境部署
### 7.2 流量切换
### 7.3 单体应用下线