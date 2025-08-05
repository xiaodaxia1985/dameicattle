#!/usr/bin/env pwsh

Write-Host "=== Building Docker Images with Local Node.js ===" -ForegroundColor Green

$originalPath = Get-Location
Set-Location "microservices"

# 检查本地Node.js包是否存在
if (-not (Test-Path "node-v22.17.0-linux-x64.tar.xz")) {
    Write-Host "Error: Local Node.js package not found!" -ForegroundColor Red
    Write-Host "Please ensure node-v22.17.0-linux-x64.tar.xz is in the microservices directory." -ForegroundColor Yellow
    Set-Location $originalPath
    exit 1
}

# 停止现有容器
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.local-build.yml down 2>$null

# 清理旧镜像
Write-Host "Cleaning up old images..." -ForegroundColor Yellow
$services = @(
    "api-gateway", "auth-service", "base-service", "cattle-service", 
    "health-service", "feeding-service", "equipment-service", 
    "procurement-service", "sales-service", "material-service", 
    "notification-service", "file-service", "monitoring-service", 
    "news-service"
)

foreach ($service in $services) {
    $imageName = "microservices_$service"
    Write-Host "Removing image: $imageName" -ForegroundColor Cyan
    docker rmi $imageName 2>$null
}

# 清理构建缓存
Write-Host "Cleaning Docker build cache..." -ForegroundColor Yellow
docker builder prune -f

# 构建所有镜像
Write-Host "Building images with local Node.js..." -ForegroundColor Green
docker-compose -f docker-compose.local-build.yml build --no-cache

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful! Starting services..." -ForegroundColor Green
    
    # 启动服务
    docker-compose -f docker-compose.local-build.yml up -d
    
    # 等待服务启动
    Write-Host "Waiting for services to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    # 检查服务状态
    Write-Host "Checking service status..." -ForegroundColor Cyan
    docker-compose -f docker-compose.local-build.yml ps
    
    Write-Host "`n=== Build and deployment complete! ===" -ForegroundColor Green
    Write-Host "All microservices are now running with updated dependencies." -ForegroundColor Cyan
    Write-Host "You can test the services using the health check script." -ForegroundColor Cyan
} else {
    Write-Host "Build failed! Please check the error messages above." -ForegroundColor Red
}

Set-Location $originalPath