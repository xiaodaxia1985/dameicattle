# 🎯 共享数据库微服务架构实施指南

## 📋 架构概述

这是一个**务实的微服务架构方案**，采用以下设计原则：

- ✅ **共享数据库**：所有服务使用同一个PostgreSQL数据库
- ✅ **微服务代理**：各微服务通过代理调用经过测试的Backend单体应用
- ✅ **服务隔离**：每个微服务独立运行在不同端口，互不影响
- ✅ **缓存优化**：Redis缓存提高性能
- ✅ **快速实施**：无需重写业务逻辑，大大缩短工期

## 🏗️ 架构图

```
前端/小程序
    ↓
API网关 (:3000)
    ↓
┌─────────────────────────────────────┐
│  微服务层 (代理模式)                    │
├─────────────────────────────────────┤
│ 认证服务(:3001) → Backend(:3100)      │
│ 基地服务(:3002) → Backend(:3100)      │
│ 牛只服务(:3003) → Backend(:3100)      │
│ 健康服务(:3004) → Backend(:3100)      │
│ 饲养服务(:3005) → Backend(:3100)      │
│ 设备服务(:3006) → Backend(:3100)      │
│ 物料服务(:3009) → Backend(:3100)      │
│ 采购服务(:3007) → Backend(:3100)      │
│ 销售服务(:3008) → Backend(:3100)      │
└─────────────────────────────────────┘
    ↓
Backend单体应用 (:3100)
    ↓
PostgreSQL数据库 (共享)
```

## 🚀 快速开始

### 1. 环境准备

确保已安装：
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL (可选，用于本地开发)

### 2. 一键启动

```bash
# 启动所有服务
.\scripts\start-shared-db-microservices.ps1 -Services all -Build

# 或分步启动
.\scripts\start-shared-db-microservices.ps1 -Services infrastructure  # 基础设施
.\scripts\start-shared-db-microservices.ps1 -Services backend         # 后端服务
.\scripts\start-shared-db-microservices.ps1 -Services gateway         # API网关
.\scripts\start-shared-db-microservices.ps1 -Services core            # 核心微服务
```

### 3. 验证部署

```bash
# 检查所有服务状态
docker-compose -f microservices/docker-compose.yml ps

# 测试API网关
curl http://localhost:3000/health

# 测试微服务
curl http://localhost:3000/api/v1/auth/health
curl http://localhost:3000/api/v1/base/health
curl http://localhost:3000/api/v1/cattle/health
```

### 4. 启动前端

```bash
cd frontend
npm run dev
# 访问 http://localhost:5173
```

## 🎯 核心优势

### 1. **极短工期**
- ❌ 无需重写业务逻辑
- ❌ 无需数据迁移
- ❌ 无需重新测试业务功能
- ✅ 只需配置代理和路由

### 2. **风险极低**
- ✅ Backend已经过充分测试
- ✅ 数据库结构保持不变
- ✅ 业务逻辑完全复用
- ✅ 可随时回滚到单体架构

### 3. **微服务优势**
- ✅ 服务独立部署和扩展
- ✅ 故障隔离（一个服务崩溃不影响其他）
- ✅ 技术栈灵活性
- ✅ 团队并行开发

### 4. **性能优化**
- ✅ Redis缓存减少数据库压力
- ✅ 智能缓存失效策略
- ✅ 请求重试和超时控制
- ✅ 连接池和资源复用

## 📊 服务端口分配

| 服务 | 端口 | 说明 |
|------|------|------|
| API网关 | 3000 | 统一入口 |
| 认证服务 | 3001 | 用户认证 |
| 基地服务 | 3002 | 基地管理 |
| 牛只服务 | 3003 | 牛只管理 |
| 健康服务 | 3004 | 健康管理 |
| 饲养服务 | 3005 | 饲养管理 |
| 设备服务 | 3006 | 设备管理 |
| 采购服务 | 3007 | 采购管理 |
| 销售服务 | 3008 | 销售管理 |
| 物料服务 | 3009 | 物料管理 |
| Backend | 3100 | 单体后端 |
| PostgreSQL | 5432 | 数据库 |
| Redis | 6379 | 缓存 |

## 🔧 技术实现

### 1. 代理模式实现

每个微服务都使用 `BackendProxy` 类：

```typescript
// 微服务中的典型实现
const backendProxy = new BackendProxy({
  backendUrl: 'http://backend:3000/api/v1',
  timeout: 15000,
  retries: 3,
  cacheEnabled: true,
  cacheTTL: 300
});

// 代理GET请求（带缓存）
router.get('/bases', async (req, res) => {
  try {
    const result = await backendProxy.get('/bases', req.query, {
      cache: true,
      cacheTTL: 300
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 代理POST请求（清除缓存）
router.post('/bases', async (req, res) => {
  try {
    const result = await backendProxy.post('/bases', req.body, {
      invalidateCache: ['proxy:GET:/bases:*']
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 2. 智能缓存策略

```typescript
// 缓存配置
const cacheConfig = {
  // 读取频繁的数据 - 长缓存
  bases: { ttl: 600 },      // 10分钟
  barns: { ttl: 300 },      // 5分钟
  
  // 变化频繁的数据 - 短缓存
  statistics: { ttl: 180 }, // 3分钟
  capacity: { ttl: 120 },   // 2分钟
  
  // 实时数据 - 不缓存
  realtime: { ttl: 0 }
};

// 缓存失效策略
const invalidationRules = {
  'POST /bases': ['proxy:GET:/bases:*'],
  'PUT /bases/:id': ['proxy:GET:/bases:*', 'proxy:GET:/bases/:id:*'],
  'DELETE /bases/:id': ['proxy:GET:/bases:*', 'proxy:GET:/bases/:id:*']
};
```

### 3. 错误处理和重试

```typescript
// 自动重试配置
const retryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    // 网络错误或5xx错误才重试
    return !error.response || error.response.status >= 500;
  }
};

// 降级策略
const fallbackStrategy = {
  // 如果Backend不可用，返回缓存数据
  useCacheOnError: true,
  // 或返回默认数据
  defaultResponse: { success: false, message: '服务暂时不可用' }
};
```

## 🛠️ 开发指南

### 1. 添加新的微服务

```bash
# 1. 创建服务目录
mkdir microservices/new-service

# 2. 复制基地服务作为模板
cp -r microservices/base-service/* microservices/new-service/

# 3. 修改配置
# - package.json 中的服务名
# - app.ts 中的端口和路由
# - routes/ 中的业务逻辑

# 4. 添加到docker-compose.yml
# 5. 更新API网关路由
```

### 2. 修改现有服务

```typescript
// 在 routes/service.ts 中添加新路由
router.get('/new-endpoint', async (req, res) => {
  try {
    const proxy = getProxy(req);
    const result = await proxy.get('/new-backend-endpoint', req.query, {
      cache: true,
      cacheTTL: 300
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. 缓存优化

```typescript
// 根据业务特点调整缓存策略
const cacheStrategies = {
  // 静态数据 - 长缓存
  masterData: { ttl: 3600 },
  
  // 用户数据 - 中等缓存
  userData: { ttl: 600 },
  
  // 统计数据 - 短缓存
  statistics: { ttl: 180 },
  
  // 实时数据 - 不缓存
  realtime: { ttl: 0 }
};
```

## 📈 性能优化

### 1. 缓存优化

```bash
# 查看缓存命中率
redis-cli info stats | grep keyspace_hits

# 监控缓存使用情况
redis-cli monitor

# 清理过期缓存
redis-cli --scan --pattern "proxy:*" | xargs redis-cli del
```

### 2. 连接池优化

```typescript
// 在BackendProxy中配置连接池
const axiosConfig = {
  timeout: 15000,
  maxRedirects: 3,
  // 连接池配置
  httpAgent: new http.Agent({
    keepAlive: true,
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 60000
  })
};
```

### 3. 监控和告警

```bash
# 查看服务状态
docker-compose ps

# 查看资源使用
docker stats

# 查看日志
docker-compose logs -f [service-name]
```

## 🚨 故障排除

### 1. 常见问题

#### Backend连接失败
```bash
# 检查Backend服务状态
curl http://localhost:3100/health

# 检查网络连接
docker exec microservices-base-service-1 ping backend

# 查看Backend日志
docker-compose logs backend
```

#### 缓存问题
```bash
# 检查Redis连接
docker exec microservices-redis-1 redis-cli ping

# 清除所有缓存
docker exec microservices-redis-1 redis-cli flushall

# 查看缓存键
docker exec microservices-redis-1 redis-cli keys "proxy:*"
```

#### 服务启动失败
```bash
# 查看详细错误
docker-compose logs [service-name]

# 重启服务
docker-compose restart [service-name]

# 重新构建
docker-compose up -d --build [service-name]
```

### 2. 调试技巧

```bash
# 进入容器调试
docker exec -it microservices-base-service-1 /bin/sh

# 查看环境变量
docker exec microservices-base-service-1 env

# 测试网络连接
docker exec microservices-base-service-1 wget -qO- http://backend:3000/health
```

## 🔄 部署和运维

### 1. 生产环境部署

```bash
# 1. 构建生产镜像
docker-compose -f microservices/docker-compose.yml build

# 2. 启动生产环境
NODE_ENV=production docker-compose -f microservices/docker-compose.yml up -d

# 3. 健康检查
./scripts/health-check.sh
```

### 2. 扩容和负载均衡

```yaml
# docker-compose.yml 中添加副本
base-service:
  # ... 其他配置
  deploy:
    replicas: 3
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
```

### 3. 监控和日志

```bash
# 集中日志收集
docker-compose logs -f > logs/microservices.log

# 性能监控
docker stats --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## 🎉 总结

这个共享数据库的微服务架构方案具有以下特点：

### ✅ 优势
- **极短工期**：1-2周即可完成
- **极低风险**：复用已测试的Backend
- **微服务优势**：服务隔离、独立部署
- **性能优化**：智能缓存、连接复用
- **易于维护**：统一的代理模式

### ⚠️ 注意事项
- 数据库仍是单点，需要做好备份和高可用
- Backend负载会增加，需要监控性能
- 缓存一致性需要仔细设计

### 🚀 下一步
1. 启动微服务环境
2. 测试前端集成
3. 性能调优
4. 生产环境部署
5. 监控和运维

**这个方案完美平衡了微服务的优势和实施的复杂度，是一个非常务实的选择！**