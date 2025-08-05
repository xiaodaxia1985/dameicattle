#!/usr/bin/env pwsh

Write-Host "=== Rebuilding Docker Images for Microservices ===" -ForegroundColor Green

$originalPath = Get-Location
Set-Location "microservices"

# 停止所有运行的容器
Write-Host "Stopping all containers..." -ForegroundColor Yellow
docker-compose down

# 删除所有相关的镜像以强制重新构建
Write-Host "Removing old images..." -ForegroundColor Yellow
$services = @(
    "api-gateway", "auth-service", "base-service", "cattle-service", 
    "health-service", "feeding-service", "equipment-service", 
    "procurement-service", "sales-service", "material-service", 
    "notification-service", "file-service", "monitoring-service"
)

foreach ($service in $services) {
    $imageName = "microservices_$service"
    Write-Host "Removing image: $imageName" -ForegroundColor Cyan
    docker rmi $imageName 2>$null
}

# 清理未使用的镜像和构建缓存
Write-Host "Cleaning up Docker cache..." -ForegroundColor Yellow
docker system prune -f
docker builder prune -f

# 重新构建所有镜像
Write-Host "Rebuilding all images..." -ForegroundColor Green
docker-compose build --no-cache

# 启动服务
Write-Host "Starting services..." -ForegroundColor Green
docker-compose up -d

Set-Location $originalPath

Write-Host "`n=== Docker rebuild complete! ===" -ForegroundColor Green
Write-Host "All microservices have been rebuilt with updated dependencies." -ForegroundColor Cyan
Write-Host "You can check the status with: docker-compose ps" -ForegroundColor Cyan