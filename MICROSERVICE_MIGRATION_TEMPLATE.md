# 微服务迁移模板

## 📋 迁移清单

### 1. 创建服务目录结构
```
microservices/[service-name]/
├── src/
│   ├── controllers/     # 从backend迁移对应controller
│   ├── models/          # 迁移相关模型和关联
│   ├── routes/          # 迁移对应路由
│   ├── services/        # 迁移相关服务（可选）
│   ├── validators/      # 迁移对应验证器
│   ├── middleware/      # 复制通用中间件
│   ├── utils/           # 复制通用工具
│   ├── config/          # 数据库和配置
│   └── app.ts          # 服务启动文件
├── package.json
├── tsconfig.json
├── Dockerfile
└── .env
```

### 2. 文件迁移映射

#### Auth Service 示例：
- `backend/src/controllers/AuthController.ts` → `auth-service/src/controllers/AuthController.ts`
- `backend/src/routes/auth.ts` → `auth-service/src/routes/auth.ts`
- `backend/src/validators/auth.ts` → `auth-service/src/validators/auth.ts`
- `backend/src/models/User.ts` → `auth-service/src/models/User.ts`
- `backend/src/models/Role.ts` → `auth-service/src/models/Role.ts`
- `backend/src/models/SecurityLog.ts` → `auth-service/src/models/SecurityLog.ts`

### 3. 共享文件处理

#### 需要复制到每个服务的文件：
```
config/
├── database.ts          # 数据库连接配置
├── redis.ts            # Redis配置
└── ConfigManager.ts    # 配置管理

middleware/
├── auth.ts             # 认证中间件
├── validation.ts       # 验证中间件
├── errorHandler.ts     # 错误处理
├── responseWrapper.ts  # 响应包装
└── operationLog.ts     # 操作日志

utils/
├── logger.ts           # 日志工具
├── errors.ts           # 错误定义
└── auth.ts            # 认证工具
```

### 4. 模型关联处理

#### 策略A：完整复制（推荐）
- 将所有模型文件复制到每个服务
- 保持完整的关联关系
- 简单快速，避免复杂的依赖问题

#### 策略B：按需复制
- 只复制当前服务需要的模型
- 需要仔细处理模型间的关联
- 更加精简，但实施复杂

### 5. 服务配置模板

#### package.json
```json
{
  "name": "[service-name]",
  "version": "1.0.0",
  "description": "[服务描述]",
  "main": "dist/app.js",
  "scripts": {
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sequelize": "^6.35.2",
    "pg": "^8.11.3",
    "redis": "^4.6.10",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "joi": "^17.13.3",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.2"
  }
}
```

#### app.ts 模板
```typescript
import express from 'express';
import dotenv from 'dotenv';
import { sequelize } from './config/database';
import { redisClient } from './config/redis';
import { logger } from './utils/logger';
import { responseWrapper } from './middleware/responseWrapper';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseWrapper);

// 健康检查
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: '[service-name]'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// 路由
app.use('/api/v1', routes);

// 错误处理
app.use(errorHandler);

// 启动服务
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connected');
    
    app.listen(PORT, () => {
      logger.info(`[service-name] running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

### 6. 迁移步骤

1. **创建目录结构**
2. **复制package.json和配置文件**
3. **迁移模型文件**
4. **迁移控制器文件**
5. **迁移路由文件**
6. **迁移验证器文件**
7. **复制中间件和工具**
8. **创建app.ts启动文件**
9. **测试服务启动**
10. **测试API功能**

### 7. 测试清单

- [ ] 服务能正常启动
- [ ] 数据库连接正常
- [ ] Redis连接正常
- [ ] 健康检查接口正常
- [ ] 主要API接口功能正常
- [ ] 错误处理正常
- [ ] 日志记录正常

### 8. 常见问题处理

#### 导入路径问题
```typescript
// 原来的导入
import { User } from '@/models';

// 需要修改为
import { User } from './models/User';
```

#### 模型关联问题
```typescript
// 确保在models/index.ts中正确设置关联
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
```

#### 环境变量问题
```bash
# 确保.env文件包含必要的配置
DB_HOST=localhost
DB_NAME=cattle_management
DB_USER=postgres
DB_PASSWORD=dianxin99
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret
```