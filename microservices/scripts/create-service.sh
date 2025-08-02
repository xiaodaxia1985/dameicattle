#!/bin/bash

if [ $# -eq 0 ]; then
    echo "用法: ./create-service.sh <service-name> <port>"
    echo "示例: ./create-service.sh base-service 3002"
    exit 1
fi

SERVICE_NAME=$1
PORT=${2:-3000}
SERVICE_DIR="$SERVICE_NAME"

echo "🚀 创建微服务: $SERVICE_NAME (端口: $PORT)"

# 创建服务目录结构
mkdir -p "$SERVICE_DIR/src/controllers"
mkdir -p "$SERVICE_DIR/src/models"
mkdir -p "$SERVICE_DIR/src/routes"
mkdir -p "$SERVICE_DIR/src/services"
mkdir -p "$SERVICE_DIR/src/config"

# 创建 package.json
cat > "$SERVICE_DIR/package.json" << EOF
{
  "name": "$SERVICE_NAME",
  "version": "1.0.0",
  "description": "$SERVICE_NAME 微服务",
  "main": "dist/app.js",
  "scripts": {
    "dev": "nodemon src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js"
  },
  "dependencies": {
    "@cattle-management/shared": "file:../shared",
    "express": "^4.18.2",
    "sequelize": "^6.35.2",
    "pg": "^8.11.3",
    "redis": "^4.6.10",
    "dotenv": "^16.3.1",
    "joi": "^17.13.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3",
    "nodemon": "^3.0.2",
    "ts-node": "^10.9.2"
  }
}
EOF

# 创建 tsconfig.json
cat > "$SERVICE_DIR/tsconfig.json" << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# 创建 Dockerfile
cat > "$SERVICE_DIR/Dockerfile" << EOF
FROM node:18-alpine

WORKDIR /app

# 复制共享库
COPY shared/ ../shared/
WORKDIR /shared
RUN npm install && npm run build

# 复制服务代码
WORKDIR /app
COPY $SERVICE_DIR/package*.json ./
RUN npm install

COPY $SERVICE_DIR/ ./
RUN npm run build

EXPOSE $PORT

CMD ["npm", "start"]
EOF

# 创建数据库配置
cat > "$SERVICE_DIR/src/config/database.ts" << EOF
import { Sequelize } from 'sequelize';
import { createLogger } from '@cattle-management/shared';

const logger = createLogger('${SERVICE_NAME}-database');

const sequelize = new Sequelize({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || '${SERVICE_NAME//-/_}_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export { sequelize };

export const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    
    await sequelize.sync({ alter: true });
    logger.info('Database models synchronized');
    
    return true;
  } catch (error) {
    logger.error('Unable to connect to database', { error: error.message });
    return false;
  }
};
EOF

# 创建主应用文件
cat > "$SERVICE_DIR/src/app.ts" << EOF
import express from 'express';
import dotenv from 'dotenv';
import { createLogger, responseWrapper, errorHandler, EventBus } from '@cattle-management/shared';
import { connectDatabase } from './config/database';

dotenv.config();

const app = express();
const logger = createLogger('$SERVICE_NAME');
const PORT = process.env.PORT || $PORT;

// 基础中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseWrapper);

// 健康检查
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await connectDatabase();
    
    res.success({
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      checks: {
        database: dbHealthy
      }
    }, 'Health check completed');
  } catch (error) {
    res.error('Health check failed', 500, 'HEALTH_CHECK_FAILED');
  }
});

// TODO: 添加API路由
// app.use('/api/v1', routes);

// 404处理
app.use('*', (req, res) => {
  res.error('Route not found', 404, 'ROUTE_NOT_FOUND');
});

// 错误处理
app.use(errorHandler);

// 启动服务
const startServer = async () => {
  try {
    const dbConnected = await connectDatabase();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    if (process.env.REDIS_URL) {
      const eventBus = new EventBus(process.env.REDIS_URL);
      await eventBus.connect();
      logger.info('Event bus connected');
    }

    app.listen(PORT, () => {
      logger.info(\`$SERVICE_NAME is running on port \${PORT}\`);
      logger.info(\`Environment: \${process.env.NODE_ENV || 'development'}\`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;
EOF

echo "✅ 微服务 $SERVICE_NAME 创建完成！"
echo ""
echo "📁 服务目录: $SERVICE_DIR"
echo "🔧 下一步:"
echo "  1. cd $SERVICE_DIR"
echo "  2. npm install"
echo "  3. 实现业务逻辑"
echo "  4. 添加到 docker-compose.yml"
echo "  5. 更新 API 网关路由"