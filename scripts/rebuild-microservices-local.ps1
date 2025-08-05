#!/usr/bin/env pwsh

# 使用本地镜像重建微服务Docker镜像
Write-Host "=== 使用本地镜像重建微服务 ===" -ForegroundColor Green

# 切换到微服务目录
$originalPath = Get-Location
Set-Location "microservices"

Write-Host "1. 检查本地可用镜像..." -ForegroundColor Cyan
$localImages = docker images --format "table {{.Repository}}:{{.Tag}}"
Write-Host "本地可用镜像:" -ForegroundColor Gray
$localImages | Select-String -Pattern "(node|postgres|redis|alpine)" | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }

Write-Host "`n2. 停止现有微服务容器..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml down 2>$null

Write-Host "`n3. 删除旧的微服务镜像..." -ForegroundColor Cyan
$microserviceImages = docker images --format "{{.Repository}}" | Select-String "microservices"
foreach ($image in $microserviceImages) {
    Write-Host "  删除 $image..." -ForegroundColor Yellow
    docker rmi $image --force 2>$null
}

Write-Host "`n4. 为每个微服务创建本地构建的Dockerfile..." -ForegroundColor Cyan

# 定义微服务列表
$services = @(
    "api-gateway", "auth-service", "base-service", "cattle-service",
    "health-service", "feeding-service", "equipment-service", 
    "procurement-service", "sales-service", "material-service",
    "notification-service", "file-service", "monitoring-service", "news-service"
)

# 使用本地alpine镜像的Dockerfile模板
$localDockerfile = @"
# 使用本地alpine镜像
FROM alpine:latest

# 安装Node.js和npm
RUN apk add --no-cache nodejs npm

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 如果有构建脚本则构建
RUN if [ -f "package.json" ] && grep -q '"build"' package.json; then npm run build; fi

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
"@

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "  处理 $service..." -ForegroundColor Yellow
        
        # 创建使用本地镜像的Dockerfile
        $servicePort = $services.IndexOf($service) + 3001
        $serviceDockerfile = $localDockerfile -replace "EXPOSE 3000", "EXPOSE $servicePort"
        $serviceDockerfile | Set-Content "$service/Dockerfile.local" -Encoding UTF8
        
        # 确保有package.json
        if (-not (Test-Path "$service/package.json")) {
            Write-Host "    创建 package.json..." -ForegroundColor Gray
            $packageJson = @{
                name = $service
                version = "1.0.0"
                main = "src/index.js"
                scripts = @{
                    start = "node src/index.js"
                    dev = "nodemon src/index.js"
                }
                dependencies = @{
                    express = "^4.18.0"
                    cors = "^2.8.5"
                    dotenv = "^16.0.0"
                }
            }
            $packageJson | ConvertTo-Json -Depth 3 | Set-Content "$service/package.json" -Encoding UTF8
        }
        
        # 确保有基础的服务代码
        if (-not (Test-Path "$service/src/index.js")) {
            if (-not (Test-Path "$service/src")) {
                New-Item -ItemType Directory -Path "$service/src" -Force | Out-Null
            }
            
            $basicServer = @"
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || $servicePort;

app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: '$service', 
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// 基础路由
app.get('/', (req, res) => {
    res.json({ 
        message: '$service is running', 
        version: '1.0.0',
        port: PORT
    });
});

// API路由示例
app.get('/api/status', (req, res) => {
    res.json({
        service: '$service',
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[$service] Server running on port `+PORT);
});
"@
            $basicServer | Set-Content "$service/src/index.js" -Encoding UTF8
        }
    }
}

Write-Host "`n5. 逐个构建微服务镜像..." -ForegroundColor Cyan
$buildSuccess = @()
$buildFailed = @()

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "  构建 $service..." -ForegroundColor Yellow
        
        try {
            # 使用本地Dockerfile构建
            $buildOutput = docker build -f "$service/Dockerfile.local" -t "microservices_$service" "./$service" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    ✓ $service 构建成功" -ForegroundColor Green
                $buildSuccess += $service
            } else {
                Write-Host "    ✗ $service 构建失败" -ForegroundColor Red
                Write-Host "    错误: $buildOutput" -ForegroundColor Red
                $buildFailed += $service
            }
        } catch {
            Write-Host "    ✗ $service 构建异常: $($_.Exception.Message)" -ForegroundColor Red
            $buildFailed += $service
        }
    }
}

Write-Host "`n6. 构建结果摘要:" -ForegroundColor Cyan
Write-Host "  成功构建: $($buildSuccess.Count)/$($services.Count)" -ForegroundColor Green
Write-Host "  构建失败: $($buildFailed.Count)/$($services.Count)" -ForegroundColor Red

if ($buildSuccess.Count -gt 0) {
    Write-Host "`n成功构建的服务:" -ForegroundColor Green
    foreach ($service in $buildSuccess) {
        Write-Host "  ✓ $service" -ForegroundColor Green
    }
    
    Write-Host "`n7. 创建临时docker-compose文件..." -ForegroundColor Cyan
    
    # 创建只包含成功构建服务的compose文件
    $composeContent = @"
version: '3.8'
services:
"@

    foreach ($service in $buildSuccess) {
        $port = $services.IndexOf($service) + 3001
        $composeContent += @"

  ${service}:
    image: microservices_${service}
    container_name: ${service}-container
    ports:
      - "${port}:${port}"
    environment:
      - NODE_ENV=development
      - PORT=${port}
    networks:
      - microservices-network
    restart: unless-stopped
"@
    }

    $composeContent += @"

networks:
  microservices-network:
    driver: bridge
"@

    $composeContent | Set-Content "docker-compose.rebuilt.yml" -Encoding UTF8
    
    Write-Host "`n8. 启动重建的微服务..." -ForegroundColor Cyan
    docker-compose -f docker-compose.rebuilt.yml up -d
    
    Write-Host "`n9. 等待服务启动..." -ForegroundColor Cyan
    Start-Sleep -Seconds 8
    
    Write-Host "`n10. 检查服务状态..." -ForegroundColor Cyan
    docker-compose -f docker-compose.rebuilt.yml ps
}

if ($buildFailed.Count -gt 0) {
    Write-Host "`n构建失败的服务:" -ForegroundColor Red
    foreach ($service in $buildFailed) {
        Write-Host "  ✗ $service" -ForegroundColor Red
    }
}

# 返回原始目录
Set-Location $originalPath

Write-Host "`n=== 重建完成 ===" -ForegroundColor Green

if ($buildSuccess.Count -gt 0) {
    Write-Host "🎉 成功重建并启动 $($buildSuccess.Count) 个微服务!" -ForegroundColor Green
    Write-Host "`n现在可以测试微服务:" -ForegroundColor Cyan
    Write-Host ".\scripts\test-frontend-microservices-simple.ps1" -ForegroundColor White
    
    Write-Host "`n微服务端口映射:" -ForegroundColor Cyan
    foreach ($service in $buildSuccess) {
        $port = $services.IndexOf($service) + 3001
        Write-Host "  $service -> http://localhost:$port" -ForegroundColor White
    }
} else {
    Write-Host "❌ 没有微服务成功构建" -ForegroundColor Red
}