#!/usr/bin/env pwsh

# 前端微服务集成测试脚本（简化版）
Write-Host "=== 前端微服务集成测试 ===" -ForegroundColor Green
Write-Host "开始测试前端与微服务的集成..." -ForegroundColor Yellow

# 定义微服务端点
$microservices = @{
    "auth-service" = "http://localhost:3001"
    "base-service" = "http://localhost:3002"
    "cattle-service" = "http://localhost:3003"
    "health-service" = "http://localhost:3004"
    "feeding-service" = "http://localhost:3005"
    "equipment-service" = "http://localhost:3006"
    "procurement-service" = "http://localhost:3007"
    "sales-service" = "http://localhost:3008"
    "material-service" = "http://localhost:3009"
    "notification-service" = "http://localhost:3010"
    "file-service" = "http://localhost:3011"
    "monitoring-service" = "http://localhost:3012"
    "news-service" = "http://localhost:3013"
}

Write-Host "1. 检查微服务健康状态..." -ForegroundColor Cyan

$healthyServices = @()
$unhealthyServices = @()

foreach ($service in $microservices.GetEnumerator()) {
    $serviceName = $service.Key
    $serviceUrl = $service.Value
    $healthUrl = "$serviceUrl/health"
    
    try {
        $response = Invoke-RestMethod -Uri $healthUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.status -eq "ok" -or $response.status -eq "healthy") {
            $healthyServices += $serviceName
            Write-Host "  ✓ $serviceName - 健康" -ForegroundColor Green
        } else {
            $unhealthyServices += $serviceName
            Write-Host "  ⚠ $serviceName - 状态异常" -ForegroundColor Yellow
        }
    } catch {
        $unhealthyServices += $serviceName
        Write-Host "  ✗ $serviceName - 无法连接" -ForegroundColor Red
    }
}

Write-Host "`n健康检查结果:" -ForegroundColor Cyan
Write-Host "  健康服务: $($healthyServices.Count)/$($microservices.Count)" -ForegroundColor Green
Write-Host "  异常服务: $($unhealthyServices.Count)/$($microservices.Count)" -ForegroundColor Red

if ($unhealthyServices.Count -gt 0) {
    Write-Host "`n异常服务列表:" -ForegroundColor Red
    foreach ($service in $unhealthyServices) {
        Write-Host "  - $service" -ForegroundColor Red
    }
}

Write-Host "`n2. 检查前端配置..." -ForegroundColor Cyan

# 检查前端环境配置
$frontendEnvPath = "frontend/.env"
if (Test-Path $frontendEnvPath) {
    $envContent = Get-Content $frontendEnvPath -Raw
    if ($envContent -match "VITE_USE_MICROSERVICES=true") {
        Write-Host "  ✓ 前端已启用微服务模式" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ 前端未启用微服务模式" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ✗ 前端环境配置文件不存在" -ForegroundColor Red
}

# 检查微服务配置文件
$microserviceConfigPath = "frontend/src/config/microservices.ts"
if (Test-Path $microserviceConfigPath) {
    Write-Host "  ✓ 微服务配置文件存在" -ForegroundColor Green
} else {
    Write-Host "  ✗ 微服务配置文件不存在" -ForegroundColor Red
}

Write-Host "`n=== 测试完成 ===" -ForegroundColor Green

# 显示测试结果摘要
if ($healthyServices.Count -eq $microservices.Count) {
    Write-Host "🎉 所有微服务运行正常!" -ForegroundColor Green
} elseif ($healthyServices.Count -gt 0) {
    Write-Host "⚠️  部分微服务存在问题。" -ForegroundColor Yellow
} else {
    Write-Host "❌ 大部分微服务无法访问，请检查服务启动状态。" -ForegroundColor Red
}

Write-Host "`n测试摘要:" -ForegroundColor Cyan
Write-Host "  健康服务: $($healthyServices.Count)/$($microservices.Count)" -ForegroundColor $(if ($healthyServices.Count -eq $microservices.Count) { "Green" } else { "Yellow" })

if ($unhealthyServices.Count -gt 0) {
    Write-Host "`n需要修复的服务:" -ForegroundColor Red
    foreach ($service in $unhealthyServices) {
        Write-Host "  - $service" -ForegroundColor Red
    }
    
    Write-Host "`n建议操作:" -ForegroundColor Yellow
    Write-Host "1. 运行 .\scripts\start-all-microservices.ps1 重启所有服务" -ForegroundColor White
    Write-Host "2. 检查各服务的日志文件排查问题" -ForegroundColor White
    Write-Host "3. 确认数据库和Redis服务正常运行" -ForegroundColor White
}

Write-Host "`n如果所有服务正常，可以继续:" -ForegroundColor Cyan
Write-Host "1. cd frontend; npm run dev  # 启动前端开发服务器" -ForegroundColor White
Write-Host "2. 在浏览器中访问 http://localhost:5173" -ForegroundColor White
Write-Host "3. 测试各个功能模块确认集成正常" -ForegroundColor White