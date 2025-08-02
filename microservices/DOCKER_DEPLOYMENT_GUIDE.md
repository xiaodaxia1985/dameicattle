# 微服务Docker部署指南

## 概述

本项目包含13个微服务，使用Docker Compose进行容器化部署。所有服务都依赖PostgreSQL数据库和Redis缓存。

## 服务架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │    │  Auth Service   │    │  Base Service   │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 3002    │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Cattle Service  │    │ Health Service  │    │Feeding Service  │
│   Port: 3003    │    │   Port: 3004    │    │   Port: 3005    │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│Equipment Service│    │Procurement Svc  │    │ Sales Service   │
│   Port: 3006    │    │   Port: 3007    │    │   Port: 3008    │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│Material Service │    │Notification Svc │    │  File Service   │
│   Port: 3009    │    │   Port: 3010    │    │   Port: 3011    │
└─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐
│Monitoring Svc   │
│   Port: 3012    │
└─────────────────┘
```

## 数据库结构

每个微服务使用独立的数据库：
- `auth_db` - 用户认证和授权
- `base_db` - 基地和牛舍管理
- `cattle_db` - 牛只信息管理
- `health_db` - 健康记录管理
- `feeding_db` - 饲养计划管理
- `equipment_db` - 设备管理
- `procurement_db` - 采购管理
- `sales_db` - 销售管理
- `material_db` - 物料管理

## 快速开始

### 前置要求

1. Docker Desktop (Windows/Mac) 或 Docker Engine (Linux)
2. Docker Compose v2.0+
3. PowerShell (Windows) 或 Bash (Linux/Mac)
4. PostgreSQL客户端工具 (psql) - 用于数据库验证

### 一键部署

```powershell
# Windows PowerShell
.\scripts\complete-deployment-check.ps1
```

```bash
# Linux/Mac Bash
./scripts/complete-deployment-check.sh
```

### 手动部署步骤

1. **构建共享库**
   ```powershell
   cd shared
   npm install
   npm run build
   cd ..
   ```

2. **启动基础设施**
   ```powershell
   docker-compose up -d postgres redis
   ```

3. **等待数据库就绪**
   ```powershell
   # 等待30-60秒，或使用健康检查
   .\scripts\verify-database.ps1
   ```

4. **启动所有微服务**
   ```powershell
   docker-compose up -d
   ```

5. **验证部署**
   ```powershell
   .\scripts\health-check.ps1
   ```

## 故障排除

### 常见问题

1. **数据库初始化失败**
   ```powershell
   # 清理并重新启动
   docker-compose down -v
   docker-compose up -d postgres
   # 等待数据库启动后
   .\scripts\verify-database.ps1
   ```

2. **服务启动失败**
   ```powershell
   # 查看特定服务日志
   docker-compose logs -f auth-service
   
   # 重启特定服务
   docker-compose restart auth-service
   ```

3. **共享库构建问题**
   ```powershell
   cd shared
   rm -rf node_modules dist
   npm install
   npm run build
   cd ..
   docker-compose build --no-cache
   ```

4. **端口冲突**
   ```powershell
   # 检查端口占用
   netstat -an | findstr :3000
   
   # 停止占用端口的进程或修改docker-compose.yml中的端口映射
   ```

### 修复脚本

运行完整的问题诊断和修复：
```powershell
.\scripts\fix-docker-issues.ps1
```

## 开发模式

### 启动开发环境
```powershell
.\scripts\start-dev.ps1
```

### 查看服务状态
```powershell
docker-compose ps
```

### 查看实时日志
```powershell
# 所有服务
docker-compose logs -f

# 特定服务
docker-compose logs -f auth-service api-gateway
```

## 生产部署

生产环境请使用：
```powershell
docker-compose -f docker-compose.prod.yml up -d
```

## API文档

服务启动后，可以访问：
- API网关健康检查: http://localhost:3000/health
- 认证服务API: http://localhost:3001/api/v1/auth
- Swagger文档 (如果启用): http://localhost:3000/api-docs

## 监控和日志

- 容器状态: `docker-compose ps`
- 服务日志: `docker-compose logs -f [service-name]`
- 资源使用: `docker stats`
- 健康检查: `.\scripts\health-check.ps1`

## 数据持久化

数据存储在Docker volumes中：
- `postgres_data` - 数据库数据
- `redis_data` - Redis数据
- `file_uploads` - 文件上传数据

## 备份和恢复

```powershell
# 数据库备份
docker-compose exec postgres pg_dump -U postgres cattle_management > backup.sql

# 数据库恢复
docker-compose exec -T postgres psql -U postgres cattle_management < backup.sql
```

## 性能优化

1. **资源限制**: 在docker-compose.yml中设置内存和CPU限制
2. **连接池**: 调整数据库连接池大小
3. **缓存**: 合理使用Redis缓存
4. **日志轮转**: 配置日志轮转避免磁盘空间不足

## 安全注意事项

1. 修改默认密码
2. 使用环境变量管理敏感信息
3. 启用HTTPS
4. 定期更新依赖包
5. 配置防火墙规则

## 联系支持

如果遇到问题，请：
1. 查看服务日志
2. 运行诊断脚本
3. 检查GitHub Issues
4. 联系开发团队