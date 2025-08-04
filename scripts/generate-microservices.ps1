# 批量生成微服务结构的脚本

param(
    [switch]$DryRun = $false
)

Write-Host "🚀 批量生成微服务结构..." -ForegroundColor Green

# 微服务配置
$services = @(
    @{Name="cattle-service"; Port=3003; Description="Cattle Management Service"},
    @{Name="health-service"; Port=3004; Description="Health Management Service"},
    @{Name="feeding-service"; Port=3005; Description="Feeding Management Service"},
    @{Name="equipment-service"; Port=3006; Description="Equipment Management Service"},
    @{Name="material-service"; Port=3009; Description="Material Management Service"},
    @{Name="procurement-service"; Port=3007; Description="Procurement Management Service"},
    @{Name="sales-service"; Port=3008; Description="Sales Management Service"},
    @{Name="notification-service"; Port=3010; Description="Notification Service"},
    @{Name="file-service"; Port=3011; Description="File Service"},
    @{Name="monitoring-service"; Port=3012; Description="Monitoring Service"}
)

function Copy-ServiceTemplate {
    param(
        [string]$ServiceName,
        [int]$Port,
        [string]$Description
    )
    
    Write-Host "📦 生成 $ServiceName..." -ForegroundColor Yellow
    
    if ($DryRun) {
        Write-Host "  [DRY RUN] 将创建: microservices/$ServiceName" -ForegroundColor Cyan
        return
    }
    
    $servicePath = "microservices/$ServiceName"
    
    # 创建目录结构
    $dirs = @(
        "$servicePath/src/config",
        "$servicePath/src/controllers",
        "$servicePath/src/models",
        "$servicePath/src/routes",
        "$servicePath/src/validators",
        "$servicePath/src/middleware",
        "$servicePath/src/utils"
    )
    
    foreach ($dir in $dirs) {
        New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    
    # 生成 package.json
    $packageJson = @{
        name = $ServiceName
        version = "1.0.0"
        description = $Description
        main = "dist/app.js"
        scripts = @{
            dev = "nodemon src/app.ts"
            build = "tsc"
            start = "node dist/app.js"
        }
        dependencies = @{
            express = "^4.18.2"
            sequelize = "^6.35.2"
            pg = "^8.11.3"
            redis = "^4.6.10"
            joi = "^17.13.3"
            winston = "^3.11.0"
            dotenv = "^16.3.1"
        }
        devDependencies = @{
            "@types/express" = "^4.17.21"
            "@types/node" = "^20.10.5"
            typescript = "^5.3.3"
            nodemon = "^3.0.2"
            "ts-node" = "^10.9.2"
        }
    }
    
    $packageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath "$servicePath/package.json" -Encoding UTF8
    
    # 生成 .env
    $envContent = @"
NODE_ENV=development
PORT=$Port

# 数据库配置（共享数据库）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cattle_management
DB_USER=postgres
DB_PASSWORD=dianxin99

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

# 日志配置
LOG_LEVEL=debug
"@
    
    $envContent | Out-File -FilePath "$servicePath/.env" -Encoding UTF8
    
    # 生成 tsconfig.json
    $tsconfigContent = @"
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
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
"@
    
    $tsconfigContent | Out-File -FilePath "$servicePath/tsconfig.json" -Encoding UTF8
    
    # 复制共享文件
    Copy-Item "microservices/base-service/src/utils/logger.ts" "$servicePath/src/utils/" -Force
    Copy-Item "microservices/base-service/src/config/database.ts" "$servicePath/src/config/" -Force
    Copy-Item "microservices/base-service/src/config/redis.ts" "$servicePath/src/config/" -Force
    Copy-Item "microservices/base-service/src/middleware/responseWrapper.ts" "$servicePath/src/middleware/" -Force
    Copy-Item "microservices/base-service/src/middleware/validation.ts" "$servicePath/src/middleware/" -Force
    Copy-Item "microservices/base-service/src/middleware/errorHandler.ts" "$servicePath/src/middleware/" -Force
    Copy-Item "microservices/base-service/Dockerfile" "$servicePath/" -Force
    
    # 更新logger中的服务名
    $loggerContent = Get-Content "$servicePath/src/utils/logger.ts" -Raw
    $loggerContent = $loggerContent -replace "BASE-SERVICE", $ServiceName.ToUpper()
    $loggerContent = $loggerContent -replace "base-service", $ServiceName
    $loggerContent = $loggerContent -replace "base-error.log", "$ServiceName-error.log"
    $loggerContent = $loggerContent -replace "base-combined.log", "$ServiceName-combined.log"
    $loggerContent | Out-File -FilePath "$servicePath/src/utils/logger.ts" -Encoding UTF8
    
    # 更新Dockerfile中的端口
    $dockerfileContent = Get-Content "$servicePath/Dockerfile" -Raw
    $dockerfileContent = $dockerfileContent -replace "EXPOSE 3002", "EXPOSE $Port"
    $dockerfileContent | Out-File -FilePath "$servicePath/Dockerfile" -Encoding UTF8
    
    # 生成基础的app.ts
    $appContent = @"
import express from 'express';
import dotenv from 'dotenv';
import { sequelize, testConnection } from './config/database';
import { initializeRedis } from './config/redis';
import { logger } from './utils/logger';
import { responseWrapper } from './middleware/responseWrapper';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || $Port;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(responseWrapper);

app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await testConnection();
    
    res.success({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      service: '$ServiceName',
      checks: {
        database: dbHealthy,
        redis: true
      }
    }, 'Health check completed');
  } catch (error) {
    logger.error('Health check failed:', error);
    res.error('Health check failed', 500, 'HEALTH_CHECK_FAILED');
  }
});

// TODO: 添加路由
// app.use('/api/v1', routes);

app.use('*', (req, res) => {
  res.error('Route not found', 404, 'ROUTE_NOT_FOUND');
});

app.use(errorHandler);

const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    try {
      await initializeRedis();
      logger.info('Redis connection established');
    } catch (error) {
      logger.warn('Redis connection failed, continuing without Redis:', error);
    }

    if (process.env.NODE_ENV === 'development') {
      try {
        await sequelize.sync({ force: false, alter: false });
        logger.info('Database models synchronized');
      } catch (error) {
        logger.warn('Database sync failed:', error);
      }
    }

    app.listen(PORT, () => {
      logger.info(`$ServiceName is running on port `+PORT);
      logger.info(`Environment: `+(process.env.NODE_ENV || 'development'));
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  try {
    await sequelize.close();
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  try {
    await sequelize.close();
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
  process.exit(0);
});

startServer();

export default app;
"@
    
    $appContent | Out-File -FilePath "$servicePath/src/app.ts" -Encoding UTF8
    
    Write-Host "  ✅ $ServiceName 结构生成完成" -ForegroundColor Green
}

# 生成所有微服务
foreach ($service in $services) {
    Copy-ServiceTemplate -ServiceName $service.Name -Port $service.Port -Description $service.Description
}

Write-Host "`n🎉 所有微服务结构生成完成！" -ForegroundColor Green
Write-Host "`n📋 下一步需要做的工作:" -ForegroundColor Yellow
Write-Host "1. 为每个服务添加对应的Controller、Model、Route" -ForegroundColor Gray
Write-Host "2. 从backend复制对应的业务逻辑文件" -ForegroundColor Gray
Write-Host "3. 更新docker-compose.yml配置" -ForegroundColor Gray
Write-Host "4. 测试各个服务的启动和功能" -ForegroundColor Gray

Write-Host "`n💡 快速测试命令:" -ForegroundColor Yellow
foreach ($service in $services) {
    Write-Host "  cd microservices/$($service.Name); npm install; npm run dev" -ForegroundColor Cyan
}

Write-Host "`n🔍 健康检查URL:" -ForegroundColor Yellow
foreach ($service in $services) {
    $url = "http://localhost:$($service.Port)/health"
    Write-Host "  $url" -ForegroundColor Cyan
}