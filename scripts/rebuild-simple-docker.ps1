#!/usr/bin/env pwsh

Write-Host "=== Rebuilding Simple Docker Images ===" -ForegroundColor Green

$originalPath = Get-Location
Set-Location "microservices"

# 停止现有容器
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.simple.yml down

# 清理旧镜像
Write-Host "Cleaning up old images..." -ForegroundColor Yellow
docker system prune -f

# 重新构建镜像
Write-Host "Building images with updated dependencies..." -ForegroundColor Green
docker-compose -f docker-compose.simple.yml build --no-cache

# 启动服务
Write-Host "Starting services..." -ForegroundColor Green
docker-compose -f docker-compose.simple.yml up -d

# 等待服务启动
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 检查服务状态
Write-Host "Checking service status..." -ForegroundColor Cyan
docker-compose -f docker-compose.simple.yml ps

Set-Location $originalPath

Write-Host "`n=== Simple Docker rebuild complete! ===" -ForegroundColor Green
Write-Host "Services should now have updated dependencies including sequelize." -ForegroundColor Cyan