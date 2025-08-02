# 微服务部署指南

## 快速开始

### 1. 环境准备

确保已安装以下软件：
- Docker & Docker Compose
- Node.js 18+
- Git

### 2. 启动开发环境

```bash
# 克隆项目
git clone <repository-url>
cd microservices

# 给脚本执行权限
chmod +x scripts/*.sh

# 启动所有服务
./scripts/start-dev.sh
```

### 3. 验证部署

```bash
# 检查服务健康状态
./scripts/health-check.sh

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f api-gateway
```

## 服务架构

### 核心服务端口分配
- API网关: 3000
- 认证服务: 3001
- 基地服务: 3002
- 牛只服务: 3003
- 健康服务: 3004
- 饲养服务: 3005
- 设备服务: 3006
- 采购服务: 3007
- 销售服务: 3008
- 物料服务: 3009
- 通知服务: 3010
- 文件服务: 3011
- 监控服务: 3012

### 基础设施
- PostgreSQL: 5432
- Redis: 6379

## 环境配置

### 开发环境
所有配置通过环境变量管理，主要配置项：

```env
# 数据库配置
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password

# Redis配置
REDIS_URL=redis://redis:6379

# JWT配置
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h

# 服务发现
AUTH_SERVICE_URL=http://auth-service:3001
BASE_SERVICE_URL=http://base-service:3002
# ... 其他服务URL
```

### 生产环境
1. 修改 `docker-compose.yml` 中的环境变量
2. 使用外部数据库和Redis集群
3. 配置负载均衡器
4. 启用HTTPS
5. 配置监控和日志收集

## 数据库管理

### 数据库初始化
数据库初始化脚本位于 `database/init/` 目录：
- `01-create-databases.sql`: 创建各服务数据库
- `02-seed-auth-data.sql`: 初始化认证数据

### 数据迁移
每个服务独立管理自己的数据库schema，通过Sequelize自动同步。

## 服务间通信

### 同步通信
- HTTP/REST API
- 通过API网关路由
- 服务间直接调用（内部网络）

### 异步通信
- Redis Pub/Sub
- 事件驱动架构
- 最终一致性

## 监控和日志

### 健康检查
每个服务都提供 `/health` 端点：
```bash
curl http://localhost:3000/api/v1/health
```

### 日志格式
统一的JSON格式日志：
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "level": "info",
  "service": "auth-service",
  "message": "User logged in",
  "userId": 123,
  "requestId": "abc123"
}
```

### 指标收集
- 请求响应时间
- 错误率
- 服务可用性
- 资源使用情况

## 故障处理

### 服务重启
```bash
# 重启单个服务
docker-compose restart auth-service

# 重启所有服务
docker-compose restart
```

### 查看日志
```bash
# 查看特定服务日志
docker-compose logs -f auth-service

# 查看所有服务日志
docker-compose logs -f
```

### 数据备份
```bash
# 备份PostgreSQL
docker exec microservices_postgres_1 pg_dumpall -U postgres > backup.sql

# 恢复PostgreSQL
docker exec -i microservices_postgres_1 psql -U postgres < backup.sql
```

## 扩展和维护

### 添加新服务
1. 在 `microservices/` 下创建新服务目录
2. 实现服务代码（参考现有服务结构）
3. 添加到 `docker-compose.yml`
4. 更新API网关路由配置
5. 更新文档

### 服务升级
1. 构建新版本镜像
2. 滚动更新服务
3. 验证服务健康状态
4. 回滚（如有问题）

### 性能优化
- 数据库连接池调优
- Redis缓存策略
- 负载均衡配置
- 服务资源限制

## 安全考虑

### 网络安全
- 服务间通信使用内部网络
- API网关作为唯一外部入口
- 实施访问控制和限流

### 数据安全
- 敏感数据加密存储
- JWT token安全管理
- 定期密钥轮换
- 审计日志记录

## 故障排除

### 常见问题

1. **服务无法启动**
   - 检查端口占用
   - 验证环境变量配置
   - 查看服务日志

2. **数据库连接失败**
   - 确认数据库服务运行
   - 检查连接参数
   - 验证网络连通性

3. **服务间调用失败**
   - 检查服务发现配置
   - 验证网络连通性
   - 查看API网关日志

4. **性能问题**
   - 监控资源使用情况
   - 分析慢查询日志
   - 检查缓存命中率