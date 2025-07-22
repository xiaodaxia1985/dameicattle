# 肉牛全生命周期管理系统 - 生产环境部署指南

## 概述

本文档详细描述了肉牛全生命周期管理系统的生产环境部署流程，包括容器化部署、数据库主从复制、负载均衡、高可用架构、SSL证书配置和CDN集成。

## 系统架构

### 标准部署架构
```
Internet
    ↓
[Nginx Load Balancer]
    ↓
[Backend API Cluster] ← → [Redis Master/Slave]
    ↓
[PostgreSQL Master/Slave]
```

### 高可用架构
```
Internet
    ↓
[HAProxy + Keepalived VIP]
    ↓
[Backend API Cluster] ← → [Redis Sentinel Cluster]
    ↓
[PostgreSQL Patroni Cluster]
```

## 部署前准备

### 系统要求

**最低配置：**
- CPU: 4核心
- 内存: 8GB RAM
- 存储: 100GB SSD
- 网络: 100Mbps带宽

**推荐配置：**
- CPU: 8核心
- 内存: 16GB RAM
- 存储: 500GB SSD
- 网络: 1Gbps带宽

### 软件依赖

- Docker 20.10+
- Docker Compose 2.0+
- Git
- OpenSSL (SSL证书生成)

### 域名准备

需要准备以下域名：
- `cattle-management.com` - 主站点
- `www.cattle-management.com` - 主站点别名
- `api.cattle-management.com` - API接口
- `admin.cattle-management.com` - 管理后台
- `cdn.cattle-management.com` - CDN域名 (可选)

## 快速部署

### 1. 克隆项目
```bash
git clone https://github.com/your-org/cattle-management-system.git
cd cattle-management-system
```

### 2. 配置环境变量
```bash
cp .env.production.example .env.production
# 编辑 .env.production 文件，设置生产环境配置
```

### 3. 执行部署脚本
```bash
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

### 4. 验证部署
```bash
# 检查服务状态
./scripts/deploy-production.sh --status

# 查看服务日志
./scripts/deploy-production.sh --logs

# 执行健康检查
./scripts/deploy-production.sh --check
```

## 详细部署步骤

### 1. 环境配置

#### 创建生产环境配置文件
```bash
cp .env.production.example .env.production
```

#### 关键配置项说明
```bash
# 数据库密码 (必须修改)
POSTGRES_PASSWORD=your_secure_postgres_password
POSTGRES_REPLICATION_PASSWORD=your_secure_replication_password

# JWT密钥 (必须修改，至少32字符)
JWT_SECRET=your_very_secure_jwt_secret_key_minimum_32_characters

# 域名配置
DOMAIN=cattle-management.com

# SSL证书类型
SSL_TYPE=letsencrypt  # 或 self-signed

# 监控密码
GRAFANA_PASSWORD=your_secure_grafana_password
```

### 2. SSL证书配置

#### 自签名证书 (开发/测试)
```bash
./scripts/generate-ssl.sh cattle-management.com self-signed
```

#### Let's Encrypt证书 (生产环境)
```bash
./scripts/generate-ssl.sh cattle-management.com letsencrypt
```

### 3. 数据库部署

#### 主从复制配置
系统自动配置PostgreSQL主从复制：
- 主数据库：`postgres-master:5432`
- 从数据库：`postgres-slave:5432`

#### 数据库初始化
```bash
# 启动数据库服务
docker-compose -f docker-compose.prod.yml up -d postgres-master postgres-slave

# 等待服务启动
sleep 30

# 执行数据库迁移
docker-compose -f docker-compose.prod.yml exec backend-1 npm run migrate
```

### 4. 应用服务部署

#### 构建和启动服务
```bash
# 构建镜像
docker-compose -f docker-compose.prod.yml build

# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d
```

#### 服务扩展
```bash
# 扩展后端服务实例
docker-compose -f docker-compose.prod.yml up -d --scale backend-1=2 --scale backend-2=2
```

### 5. 负载均衡配置

#### Nginx负载均衡
- 自动在多个后端实例间分发请求
- 支持健康检查和故障转移
- 配置文件：`nginx/conf.d/production.conf`

#### HAProxy高可用 (可选)
```bash
# 启动高可用集群
docker-compose -f docker-compose.ha.yml up -d
```

### 6. 监控系统部署

#### 启动监控服务
```bash
docker-compose -f docker-compose.prod.yml up -d prometheus grafana filebeat
```

#### 访问监控界面
- Grafana: `http://your-server:3001`
- Prometheus: `http://your-server:9090`

### 7. 备份系统配置

#### 自动备份
系统自动配置每日数据库备份：
- 备份时间：每天凌晨2点
- 备份保留：30天
- 备份位置：`./database/backup/`

#### 手动备份
```bash
docker-compose -f docker-compose.prod.yml exec db-backup /backup.sh
```

## CDN配置

### 阿里云CDN配置示例

#### 1. 创建OSS存储桶
```bash
# 使用阿里云CLI创建存储桶
aliyun oss mb oss://cattle-management-static --region oss-cn-beijing
```

#### 2. 配置CDN域名
- 加速域名：`cdn.cattle-management.com`
- 源站类型：OSS域名
- 源站地址：`cattle-management-static.oss-cn-beijing.aliyuncs.com`

#### 3. 更新应用配置
```bash
# 在 .env.production 中启用CDN
CDN_ENABLED=true
CDN_DOMAIN=cdn.cattle-management.com
```

## 高可用部署

### Keepalived + HAProxy

#### 1. 配置虚拟IP
```bash
# 编辑 keepalived 配置
vim keepalived/keepalived-master.conf
vim keepalived/keepalived-backup.conf
```

#### 2. 启动高可用集群
```bash
docker-compose -f docker-compose.ha.yml up -d
```

### PostgreSQL Patroni集群

#### 1. 启动etcd集群
```bash
docker-compose -f docker-compose.ha.yml up -d etcd
```

#### 2. 启动Patroni集群
```bash
docker-compose -f docker-compose.ha.yml up -d postgres-patroni-1 postgres-patroni-2
```

### Redis Sentinel集群

#### 1. 启动Sentinel节点
```bash
docker-compose -f docker-compose.ha.yml up -d redis-sentinel-1 redis-sentinel-2 redis-sentinel-3
```

## 运维管理

### 常用命令

#### 服务管理
```bash
# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 重启服务
docker-compose -f docker-compose.prod.yml restart [service-name]

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f [service-name]

# 进入容器
docker-compose -f docker-compose.prod.yml exec [service-name] /bin/sh
```

#### 数据库管理
```bash
# 连接主数据库
docker-compose -f docker-compose.prod.yml exec postgres-master psql -U cattle_user -d cattle_management

# 检查复制状态
docker-compose -f docker-compose.prod.yml exec postgres-master psql -U cattle_user -d cattle_management -c "SELECT * FROM pg_stat_replication;"

# 手动备份
docker-compose -f docker-compose.prod.yml exec db-backup /backup.sh
```

#### 性能监控
```bash
# 查看资源使用情况
docker stats

# 查看网络连接
docker-compose -f docker-compose.prod.yml exec nginx netstat -tulpn

# 查看Nginx状态
curl http://localhost/health
```

### 故障排查

#### 常见问题

**1. 服务无法启动**
```bash
# 检查日志
docker-compose -f docker-compose.prod.yml logs [service-name]

# 检查配置文件
docker-compose -f docker-compose.prod.yml config
```

**2. 数据库连接失败**
```bash
# 检查数据库状态
docker-compose -f docker-compose.prod.yml exec postgres-master pg_isready

# 检查网络连接
docker-compose -f docker-compose.prod.yml exec backend-1 ping postgres-master
```

**3. SSL证书问题**
```bash
# 检查证书有效期
openssl x509 -in nginx/ssl/cattle-management.com.crt -text -noout

# 重新生成证书
./scripts/generate-ssl.sh cattle-management.com letsencrypt
```

### 安全加固

#### 1. 防火墙配置
```bash
# 只开放必要端口
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

#### 2. 定期更新
```bash
# 更新系统包
apt update && apt upgrade -y

# 更新Docker镜像
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

#### 3. 日志审计
```bash
# 查看访问日志
tail -f logs/nginx/access.log

# 查看错误日志
tail -f logs/nginx/error.log

# 查看应用日志
docker-compose -f docker-compose.prod.yml logs -f backend-1
```

## 性能优化

### 数据库优化
- 配置合适的连接池大小
- 定期执行VACUUM和ANALYZE
- 监控慢查询日志

### 缓存优化
- 配置Redis持久化策略
- 设置合适的缓存过期时间
- 监控缓存命中率

### 网络优化
- 启用Gzip压缩
- 配置静态资源缓存
- 使用CDN加速静态资源

## 扩容指南

### 水平扩容
```bash
# 增加后端实例
docker-compose -f docker-compose.prod.yml up -d --scale backend-1=3 --scale backend-2=3

# 增加数据库读副本
# 修改 docker-compose.prod.yml 添加更多从库实例
```

### 垂直扩容
```bash
# 修改资源限制
# 在 docker-compose.prod.yml 中调整 resources 配置
```

## 备份与恢复

### 数据备份
```bash
# 数据库备份
docker-compose -f docker-compose.prod.yml exec db-backup /backup.sh

# 文件备份
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz backend/uploads/
```

### 数据恢复
```bash
# 恢复数据库
gunzip < backup/cattle_management_daily_20240115_020000.sql.gz | \
docker-compose -f docker-compose.prod.yml exec -T postgres-master psql -U cattle_user -d cattle_management

# 恢复文件
tar -xzf uploads-backup-20240115.tar.gz -C backend/
```

## 联系支持

如遇到部署问题，请联系技术支持：
- 邮箱：support@cattle-management.com
- 电话：400-xxx-xxxx
- 文档：https://docs.cattle-management.com