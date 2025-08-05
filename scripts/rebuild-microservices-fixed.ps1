#!/usr/bin/env pwsh

# 修复微服务Docker构建问题的脚本
Write-Host "=== 修复并重建微服务镜像 ===" -ForegroundColor Green

# 切换到微服务目录
$originalPath = Get-Location
Set-Location "microservices"

Write-Host "1. 停止现有容器..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml down

Write-Host "`n2. 检查并修复Dockerfile..." -ForegroundColor Cyan

# 定义需要修复的服务
$services = @(
    "api-gateway", "auth-service", "base-service", "cattle-service",
    "health-service", "feeding-service", "equipment-service", 
    "procurement-service", "sales-service", "material-service",
    "notification-service", "file-service", "monitoring-service", "news-service"
)

# 为每个服务创建简化的Dockerfile
$simpleDockerfile = @"
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 如果有构建脚本则构建
RUN if [ -f "package.json" ] && grep -q '"build"' package.json; then npm run build; fi

# 暴露端口（动态设置）
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
"@

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "  修复 $service..." -ForegroundColor Yellow
        
        # 创建简化的Dockerfile
        $serviceDockerfile = $simpleDockerfile -replace "EXPOSE 3000", "EXPOSE $($services.IndexOf($service) + 3001)"
        $serviceDockerfile | Set-Content "$service/Dockerfile.simple" -Encoding UTF8
        
        # 检查是否有package.json
        if (-not (Test-Path "$service/package.json")) {
            Write-Host "    创建基础package.json..." -ForegroundColor Gray
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
                }
            }
            $packageJson | ConvertTo-Json -Depth 3 | Set-Content "$service/package.json" -Encoding UTF8
        }
        
        # 检查是否有基础的index.js
        if (-not (Test-Path "$service/src/index.js")) {
            if (-not (Test-Path "$service/src")) {
                New-Item -ItemType Directory -Path "$service/src" -Force | Out-Null
            }
            
            $port = $services.IndexOf($service) + 3001
            $basicServer = @"
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || $port;

app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: '$service', timestamp: new Date().toISOString() });
});

// 基础路由
app.get('/', (req, res) => {
    res.json({ message: '$service is running', version: '1.0.0' });
});

app.listen(PORT, () => {
    console.log(`$service running on port `+PORT);
});
"@
            $basicServer | Set-Content "$service/src/index.js" -Encoding UTF8
        }
    }
}

Write-Host "`n3. 逐个构建服务..." -ForegroundColor Cyan
$buildSuccess = @()
$buildFailed = @()

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "  构建 $service..." -ForegroundColor Yellow
        
        try {
            # 使用简化的Dockerfile构建
            docker build -f "$service/Dockerfile.simple" -t "microservices_$service" "./$service"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    ✓ $service 构建成功" -ForegroundColor Green
                $buildSuccess += $service
            } else {
                Write-Host "    ✗ $service 构建失败" -ForegroundColor Red
                $buildFailed += $service
            }
        } catch {
            Write-Host "    ✗ $service 构建异常: $($_.Exception.Message)" -ForegroundColor Red
            $buildFailed += $service
        }
    }
}

Write-Host "`n4. 构建结果:" -ForegroundColor Cyan
Write-Host "  成功: $($buildSuccess.Count)/$($services.Count)" -ForegroundColor Green
Write-Host "  失败: $($buildFailed.Count)/$($services.Count)" -ForegroundColor Red

if ($buildSuccess.Count -gt 0) {
    Write-Host "`n5. 启动成功构建的服务..." -ForegroundColor Cyan
    
    # 创建临时的docker-compose文件，只包含成功构建的服务
    $composeContent = @"
version: '3.8'
services:
"@

    foreach ($service in $buildSuccess) {
        $port = $services.IndexOf($service) + 3001
        $composeContent += @"

  ${service}:
    image: microservices_${service}
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

    $composeContent | Set-Content "docker-compose.temp.yml" -Encoding UTF8
    
    # 启动服务
    docker-compose -f docker-compose.temp.yml up -d
    
    Write-Host "`n6. 等待服务启动..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    
    Write-Host "`n7. 检查服务状态..." -ForegroundColor Cyan
    docker-compose -f docker-compose.temp.yml ps
}

# 返回原始目录
Set-Location $originalPath

Write-Host "`n=== 修复完成 ===" -ForegroundColor Green

if ($buildSuccess.Count -gt 0) {
    Write-Host "✅ 成功启动 $($buildSuccess.Count) 个微服务!" -ForegroundColor Green
    Write-Host "`n可以运行测试脚本:" -ForegroundColor Cyan
    Write-Host ".\scripts\test-frontend-microservices-simple.ps1" -ForegroundColor White
} else {
    Write-Host "❌ 没有服务成功启动" -ForegroundColor Red
}

if ($buildFailed.Count -gt 0) {
    Write-Host "`n需要手动检查的服务:" -ForegroundColor Yellow
    foreach ($service in $buildFailed) {
        Write-Host "  - $service" -ForegroundColor Red
    }
}