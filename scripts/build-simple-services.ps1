#!/usr/bin/env pwsh

Write-Host "=== Building Simple Services Only ===" -ForegroundColor Green

$originalPath = Get-Location
Set-Location "microservices"

# 只构建不依赖共享库的简单服务
$simpleServices = @(
    "base-service", "cattle-service", "health-service", 
    "feeding-service", "equipment-service", "procurement-service", 
    "sales-service", "material-service", "notification-service", 
    "file-service", "monitoring-service", "news-service"
)

# 创建简化的docker-compose文件
$dockerComposeContent = @"
services:
"@

$portMap = @{
    "base-service" = 3002
    "cattle-service" = 3003
    "health-service" = 3004
    "feeding-service" = 3005
    "equipment-service" = 3006
    "procurement-service" = 3007
    "sales-service" = 3008
    "material-service" = 3009
    "notification-service" = 3010
    "file-service" = 3011
    "monitoring-service" = 3012
    "news-service" = 3013
}

foreach ($service in $simpleServices) {
    $port = $portMap[$service]
    $dockerComposeContent += @"

  ${service}:
    build:
      context: ./${service}
      dockerfile: Dockerfile.local
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

$dockerComposeContent += @"

networks:
  microservices-network:
    driver: bridge
"@

# 保存简化的docker-compose文件
$dockerComposeContent | Set-Content "docker-compose.simple-local.yml" -Encoding UTF8

# 停止现有容器
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.simple-local.yml down 2>$null

# 清理旧镜像
Write-Host "Cleaning up old images..." -ForegroundColor Yellow
foreach ($service in $simpleServices) {
    $imageName = "microservices_$service"
    Write-Host "Removing image: $imageName" -ForegroundColor Cyan
    docker rmi $imageName 2>$null
}

# 构建镜像
Write-Host "Building simple services..." -ForegroundColor Green
docker-compose -f docker-compose.simple-local.yml build --no-cache

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Starting services..." -ForegroundColor Green
    
    # 启动服务
    docker-compose -f docker-compose.simple-local.yml up -d
    
    # 等待服务启动
    Write-Host "Waiting for services to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    # 检查服务状态
    Write-Host "Checking service status..." -ForegroundColor Cyan
    docker-compose -f docker-compose.simple-local.yml ps
    
    Write-Host "`n=== Simple services build complete! ===" -ForegroundColor Green
    Write-Host "Services are running with updated dependencies including sequelize." -ForegroundColor Cyan
} else {
    Write-Host "Build failed! Please check the error messages above." -ForegroundColor Red
}

Set-Location $originalPath