#!/usr/bin/env pwsh

Write-Host "=== Starting Simple Microservices Locally ===" -ForegroundColor Green

$originalPath = Get-Location
Set-Location "microservices"

# 定义简单的服务（只有基本的JS文件，不需要编译）
$simpleServices = @(
    @{name="base-service"; port=3002; path="base-service"},
    @{name="cattle-service"; port=3003; path="cattle-service"},
    @{name="health-service"; port=3004; path="health-service"},
    @{name="feeding-service"; port=3005; path="feeding-service"},
    @{name="equipment-service"; port=3006; path="equipment-service"},
    @{name="procurement-service"; port=3007; path="procurement-service"},
    @{name="sales-service"; port=3008; path="sales-service"},
    @{name="material-service"; port=3009; path="material-service"},
    @{name="notification-service"; port=3010; path="notification-service"},
    @{name="file-service"; port=3011; path="file-service"},
    @{name="monitoring-service"; port=3012; path="monitoring-service"},
    @{name="news-service"; port=3013; path="news-service"}
)

$jobs = @()

foreach ($service in $simpleServices) {
    $serviceName = $service.name
    $servicePath = $service.path
    $port = $service.port
    
    Write-Host "Starting $serviceName on port $port..." -ForegroundColor Cyan
    
    if (Test-Path "$servicePath/app.js") {
        # 启动服务作为后台作业
        $job = Start-Job -ScriptBlock {
            param($path, $serviceName)
            Set-Location $path
            $env:PORT = $using:port
            $env:NODE_ENV = "development"
            node app.js
        } -ArgumentList (Resolve-Path $servicePath), $serviceName -Name $serviceName
        
        $jobs += $job
        Write-Host "  Started $serviceName (Job ID: $($job.Id))" -ForegroundColor Green
    } else {
        Write-Host "  Warning: $servicePath/app.js not found" -ForegroundColor Yellow
    }
}

Set-Location $originalPath

Write-Host "`n=== Services Started ===" -ForegroundColor Green
Write-Host "Started $($jobs.Count) services as background jobs" -ForegroundColor Cyan
Write-Host "Wait a few seconds, then run the health check script to test them." -ForegroundColor Cyan
Write-Host "`nTo stop all services, run: Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Yellow

# 显示作业状态
Write-Host "`nJob Status:" -ForegroundColor Cyan
Get-Job | Format-Table -Property Id, Name, State