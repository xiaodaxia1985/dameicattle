#!/usr/bin/env pwsh

# 快速重建微服务Docker镜像（开发环境）
Write-Host "=== 快速重建微服务镜像 ===" -ForegroundColor Green

# 切换到微服务目录
$originalPath = Get-Location
Set-Location "microservices"

Write-Host "1. 停止现有容器..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml down

Write-Host "`n2. 重新构建并启动所有服务..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml up --build -d

Write-Host "`n3. 等待服务启动..." -ForegroundColor Cyan
Start-Sleep -Seconds 10

Write-Host "`n4. 检查服务状态..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml ps

# 返回原始目录
Set-Location $originalPath

Write-Host "`n=== 重建完成 ===" -ForegroundColor Green
Write-Host "可以运行测试脚本检查服务状态:" -ForegroundColor Cyan
Write-Host ".\scripts\test-frontend-microservices-simple.ps1" -ForegroundColor White