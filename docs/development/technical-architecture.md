# 肉牛全生命周期管理系统 - 技术架构文档

## 概述

本文档详细描述了肉牛全生命周期管理系统的技术架构设计，包括系统架构、技术选型、部署方案、安全设计等内容。

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    客户端层 (Client Layer)                    │
├─────────────────────────────────────────────────────────────┤
│  PC Web端        │  微信小程序       │  移动App              │
│  Vue 3 + TS      │  uni-app         │  React Native         │
│  Element Plus    │  uni-ui          │  RN Elements          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CDN + 负载均衡层                          │
├─────────────────────────────────────────────────────────────┤
│  阿里云CDN       │  Nginx负载均衡    │  SSL终结              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    网关层 (Gateway Layer)                    │
├─────────────────────────────────────────────────────────────┤
│           Nginx (反向代理 + 静态资源服务)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   应用服务层 (Application Layer)              │
├─────────────────────────────────────────────────────────────┤
│  认证服务        │  业务API服务     │  文件服务              │
│  Auth Service    │  Business API    │  File Service          │
│  Node.js + JWT   │  Node.js + Express│  Node.js + Multer     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    缓存层 (Cache Layer)                      │
├─────────────────────────────────────────────────────────────┤
│  Redis Cluster   │  会话存储        │  数据缓存              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    数据层 (Data Layer)                       │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL      │  文件存储        │  备份存储              │
│  (主从复制)       │  (本地/云存储)    │  (定时备份)            │
└─────────────────────────────────────────────────────────────┘
```

### 微服务架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway                              │
│                   (Nginx + Kong)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    微服务集群                                │
├─────────────────────────────────────────────────────────────┤
│  用户服务        │  牛只服务        │  健康服务              │
│  User Service    │  Cattle Service  │  Health Service        │
│  Port: 3001      │  Port: 3002      │  Port: 3003           │
├─────────────────────────────────────────────────────────────┤
│  饲喂服务        │  物资服务        │  设备服务              │
│  Feeding Service │  Material Service│  Equipment Service     │
│  Port: 3004      │  Port: 3005      │  Port: 3006           │
├─────────────────────────────────────────────────────────────┤
│  采购服务        │  销售服务        │  通知服务              │
│  Purchase Service│  Sales Service   │  Notification Service │
│  Port: 3007      │  Port: 3008      │  Port: 3009           │
└─────────────────────────────────────────────────────────────┘
```

## 技术选型

### 前端技术栈

#### PC Web端
```json
{
  "framework": "Vue.js 3.4+",
  "language": "TypeScript 5.0+",
  "ui_library": "Element Plus 2.4+",
  "state_management": "Pinia 2.1+",
  "router": "Vue Router 4.2+",
  "build_tool": "Vite 5.0+",
  "http_client": "Axios 1.6+",
  "charts": "ECharts 5.4+",
  "date_picker": "dayjs 1.11+",
  "form_validation": "async-validator 4.2+",
  "css_preprocessor": "Sass/SCSS",
  "linting": "ESLint + Prettier"
}
```

#### 微信小程序
```json
{
  "framework": "uni-app 3.8+",
  "language": "TypeScript",
  "ui_library": "uni-ui + 自定义组件",
  "state_management": "Pinia",
  "build_tool": "HBuilderX / Vite",
  "http_client": "uni.request",
  "charts": "uCharts",
  "storage": "uni.storage"
}
```

#### 移动App (React Native)
```json
{
  "framework": "React Native 0.72+",
  "language": "TypeScript",
  "ui_library": "React Native Elements",
  "state_management": "Redux Toolkit + RTK Query",
  "navigation": "React Navigation 6",
  "http_client": "Axios",
  "charts": "Victory Native",
  "camera": "react-native-camera",
  "scanner": "react-native-qrcode-scanner",
  "storage": "AsyncStorage"
}
```

### 后端技术栈

#### 核心框架
```json
{
  "runtime": "Node.js 18+ LTS",
  "framework": "Express.js 4.18+",
  "language": "TypeScript 5.0+",
  "orm": "Sequelize 6.35+",
  "validation": "Joi 17.11+",
  "authentication": "JWT + Passport.js",
  "file_upload": "Multer 1.4+",
  "logging": "Winston 3.11+",
  "testing": "Jest 29.7+",
  "api_docs": "Swagger/OpenAPI 3.0"
}
```

#### 数据库技术
```json
{
  "primary_db": "PostgreSQL 15+",
  "cache": "Redis 7.0+",
  "search": "Elasticsearch 8.0+ (可选)",
  "connection_pool": "pg-pool",
  "migration": "Sequelize CLI",
  "backup": "pg_dump + 定时任务"
}
```

#### 基础设施
```json
{
  "web_server": "Nginx 1.24+",
  "process_manager": "PM2 5.3+",
  "containerization": "Docker 24.0+",
  "orchestration": "Docker Compose",
  "monitoring": "Prometheus + Grafana",
  "log_aggregation": "ELK Stack (可选)",
  "ci_cd": "GitHub Actions"
}
```

## 数据库设计

### 数据库架构

```
┌─────────────────────────────────────────────────────────────┐
│                    应用层                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    连接池层                                  │
│                   (pg-pool)                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    主从复制架构                              │
├─────────────────────────────────────────────────────────────┤
│  主数据库 (Master)   │  从数据库 (Slave)                    │
│  读写操作           │  只读操作                             │
│  实时同步           │  负载均衡                             │
└─────────────────────────────────────────────────────────────┘
```

### 核心数据表设计

#### 用户权限表
```sql
-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    real_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    role_id INTEGER REFERENCES roles(id),
    base_id INTEGER REFERENCES bases(id),
    status VARCHAR(20) DEFAULT 'active',
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 权限表
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT
);
```

#### 业务核心表
```sql
-- 基地表
CREATE TABLE bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    area DECIMAL(10, 2),
    manager_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 牛只表
CREATE TABLE cattle (
    id SERIAL PRIMARY KEY,
    ear_tag VARCHAR(50) UNIQUE NOT NULL,
    breed VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    birth_date DATE,
    weight DECIMAL(6, 2),
    health_status VARCHAR(20) DEFAULT 'healthy',
    base_id INTEGER REFERENCES bases(id),
    barn_id INTEGER REFERENCES barns(id),
    photos JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 索引
    INDEX idx_ear_tag (ear_tag),
    INDEX idx_base_id (base_id),
    INDEX idx_health_status (health_status),
    INDEX idx_created_at (created_at)
);
```

### 数据库优化策略

#### 索引优化
```sql
-- 复合索引
CREATE INDEX idx_cattle_base_status ON cattle(base_id, health_status);
CREATE INDEX idx_health_records_cattle_date ON health_records(cattle_id, diagnosis_date);
CREATE INDEX idx_feeding_records_base_date ON feeding_records(base_id, feeding_date);

-- 部分索引
CREATE INDEX idx_active_users ON users(id) WHERE status = 'active';
CREATE INDEX idx_sick_cattle ON cattle(id) WHERE health_status = 'sick';

-- 表达式索引
CREATE INDEX idx_cattle_age ON cattle((EXTRACT(YEAR FROM AGE(birth_date))));
```

#### 分区策略
```sql
-- 按时间分区的健康记录表
CREATE TABLE health_records (
    id SERIAL,
    cattle_id INTEGER,
    diagnosis_date DATE,
    -- 其他字段
) PARTITION BY RANGE (diagnosis_date);

-- 创建分区
CREATE TABLE health_records_2024 PARTITION OF health_records
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

## 缓存架构

### Redis集群配置

```yaml
# Redis主从配置
redis_master:
  host: redis-master
  port: 6379
  password: ${REDIS_PASSWORD}
  db: 0

redis_slave:
  host: redis-slave
  port: 6379
  password: ${REDIS_PASSWORD}
  db: 0
```

### 缓存策略

#### 数据缓存
```javascript
// 缓存配置
const cacheConfig = {
  // 用户会话缓存
  session: {
    ttl: 3600, // 1小时
    prefix: 'session:'
  },
  
  // 业务数据缓存
  data: {
    ttl: 1800, // 30分钟
    prefix: 'data:'
  },
  
  // 统计数据缓存
  statistics: {
    ttl: 300, // 5分钟
    prefix: 'stats:'
  }
};

// 缓存实现
class CacheService {
  async get(key) {
    return await redis.get(key);
  }
  
  async set(key, value, ttl = 3600) {
    return await redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async del(key) {
    return await redis.del(key);
  }
}
```

## 安全架构

### 认证授权

#### JWT认证流程
```
1. 用户登录 → 验证用户名密码
2. 生成JWT Token → 包含用户信息和权限
3. 客户端存储Token → localStorage/sessionStorage
4. 请求携带Token → Authorization: Bearer <token>
5. 服务端验证Token → 解析用户信息和权限
6. 权限检查 → 验证用户是否有操作权限
```

#### 权限控制模型
```javascript
// RBAC权限模型
const permissionModel = {
  // 角色定义
  roles: {
    'system_admin': {
      name: '系统管理员',
      permissions: ['*'] // 所有权限
    },
    'base_manager': {
      name: '基地管理员',
      permissions: [
        'cattle:read', 'cattle:write',
        'health:read', 'health:write',
        'feeding:read', 'feeding:write'
      ]
    },
    'operator': {
      name: '操作员',
      permissions: [
        'cattle:read',
        'health:read', 'health:write',
        'feeding:read', 'feeding:write'
      ]
    }
  },
  
  // 数据权限
  dataPermissions: {
    'base_manager': {
      scope: 'base', // 基地级别
      filter: 'base_id = user.base_id'
    },
    'operator': {
      scope: 'base',
      filter: 'base_id = user.base_id'
    }
  }
};
```

### 数据安全

#### 数据加密
```javascript
// 敏感数据加密
const crypto = require('crypto');

class EncryptionService {
  // AES加密
  encrypt(text, key) {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }
  
  // AES解密
  decrypt(encryptedText, key) {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
  
  // 密码哈希
  hashPassword(password) {
    return bcrypt.hashSync(password, 10);
  }
}
```

#### SQL注入防护
```javascript
// 使用参数化查询
const getUserById = async (id) => {
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await db.query(query, [id]);
  return result.rows[0];
};

// 输入验证
const validateInput = (schema, data) => {
  const { error, value } = schema.validate(data);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }
  return value;
};
```

## 性能优化

### 应用层优化

#### 连接池配置
```javascript
// 数据库连接池
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // 最大连接数
  min: 5,  // 最小连接数
  idle: 10000, // 空闲超时
  acquire: 60000, // 获取连接超时
  evict: 1000 // 检查间隔
});
```

#### 查询优化
```javascript
// 分页查询优化
const getPaginatedData = async (page, limit, filters) => {
  const offset = (page - 1) * limit;
  
  // 使用子查询优化大表分页
  const query = `
    SELECT c.* FROM cattle c
    WHERE c.id IN (
      SELECT id FROM cattle
      WHERE base_id = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    )
    ORDER BY c.created_at DESC
  `;
  
  return await db.query(query, [filters.baseId, limit, offset]);
};
```

### 前端性能优化

#### 代码分割
```javascript
// 路由懒加载
const routes = [
  {
    path: '/cattle',
    component: () => import('@/views/Cattle/CattleList.vue')
  },
  {
    path: '/health',
    component: () => import('@/views/Health/HealthManagement.vue')
  }
];

// 组件懒加载
const LazyComponent = defineAsyncComponent(() =>
  import('@/components/HeavyComponent.vue')
);
```

#### 虚拟滚动
```vue
<template>
  <virtual-list
    :data-key="'id'"
    :data-sources="cattleList"
    :data-component="CattleItem"
    :estimate-size="80"
    :buffer="10"
  />
</template>
```

## 监控和日志

### 应用监控

#### Prometheus指标收集
```javascript
// 自定义指标
const promClient = require('prom-client');

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status']
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['query_type', 'table']
});

// 中间件
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  
  next();
};
```

### 日志系统

#### Winston日志配置
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'cattle-management' },
  transports: [
    // 错误日志
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    // 所有日志
    new winston.transports.File({
      filename: 'logs/combined.log'
    }),
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// 业务日志
const auditLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/audit.log'
    })
  ]
});
```

## 部署架构

### Docker容器化

#### Dockerfile
```dockerfile
# 后端服务
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  # 应用服务
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  # 数据库
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=cattle_management
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  # 缓存
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # 反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./frontend/dist:/usr/share/nginx/html
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 生产环境部署

#### 高可用架构
```yaml
# 生产环境配置
version: '3.8'

services:
  # 负载均衡
  haproxy:
    image: haproxy:2.8
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./haproxy/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg
    depends_on:
      - app1
      - app2

  # 应用服务集群
  app1:
    build: .
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=app1
    depends_on:
      - postgres-master
      - redis-master

  app2:
    build: .
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=app2
    depends_on:
      - postgres-master
      - redis-master

  # 数据库主从
  postgres-master:
    image: postgres:15
    environment:
      - POSTGRES_REPLICATION_MODE=master
      - POSTGRES_REPLICATION_USER=replicator
      - POSTGRES_REPLICATION_PASSWORD=${REPLICATION_PASSWORD}

  postgres-slave:
    image: postgres:15
    environment:
      - POSTGRES_REPLICATION_MODE=slave
      - POSTGRES_MASTER_HOST=postgres-master
      - POSTGRES_REPLICATION_USER=replicator
      - POSTGRES_REPLICATION_PASSWORD=${REPLICATION_PASSWORD}

  # Redis集群
  redis-master:
    image: redis:7
    command: redis-server --appendonly yes

  redis-slave:
    image: redis:7
    command: redis-server --slaveof redis-master 6379
```

## 扩展性设计

### 微服务拆分策略

#### 服务边界划分
```
用户服务 (User Service)
├── 用户管理
├── 角色权限
└── 认证授权

牛只服务 (Cattle Service)
├── 牛只档案
├── 生命周期事件
└── 统计分析

健康服务 (Health Service)
├── 诊疗记录
├── 疫苗管理
└── 健康监测

饲喂服务 (Feeding Service)
├── 配方管理
├── 饲喂记录
└── 效果分析
```

#### 服务通信
```javascript
// 服务间通信
class ServiceCommunication {
  // HTTP调用
  async callService(serviceName, endpoint, data) {
    const serviceUrl = this.getServiceUrl(serviceName);
    const response = await axios.post(`${serviceUrl}${endpoint}`, data);
    return response.data;
  }
  
  // 消息队列
  async publishEvent(eventType, data) {
    await messageQueue.publish(eventType, data);
  }
  
  // 服务发现
  getServiceUrl(serviceName) {
    return process.env[`${serviceName.toUpperCase()}_URL`];
  }
}
```

### 数据库扩展

#### 读写分离
```javascript
// 数据库路由
class DatabaseRouter {
  constructor() {
    this.masterPool = new Pool(masterConfig);
    this.slavePool = new Pool(slaveConfig);
  }
  
  // 写操作使用主库
  async write(query, params) {
    return await this.masterPool.query(query, params);
  }
  
  // 读操作使用从库
  async read(query, params) {
    return await this.slavePool.query(query, params);
  }
}
```

#### 分库分表
```javascript
// 分表策略
class ShardingStrategy {
  // 按基地ID分表
  getTableName(baseId, tableName) {
    const shardIndex = baseId % 4; // 4个分片
    return `${tableName}_${shardIndex}`;
  }
  
  // 按时间分表
  getTimeBasedTable(date, tableName) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${tableName}_${year}_${month.toString().padStart(2, '0')}`;
  }
}
```

---

*技术架构文档将随着系统演进持续更新*