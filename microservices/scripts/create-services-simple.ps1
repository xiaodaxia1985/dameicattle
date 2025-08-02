# 创建所有微服务的简化PowerShell脚本

Write-Host "🚀 开始创建微服务..." -ForegroundColor Green

# 服务列表
$serviceList = "cattle-service:3003", "health-service:3004", "feeding-service:3005", "equipment-service:3006", "procurement-service:3007", "sales-service:3008", "material-service:3009", "notification-service:3010", "file-service:3011", "monitoring-service:3012"

foreach ($serviceInfo in $serviceList) {
    $parts = $serviceInfo.Split(":")
    $serviceName = $parts[0]
    $port = $parts[1]
    
    Write-Host "创建服务: $serviceName (端口: $port)" -ForegroundColor Yellow
    
    # 创建目录
    New-Item -ItemType Directory -Path "$serviceName" -Force | Out-Null
    New-Item -ItemType Directory -Path "$serviceName/src" -Force | Out-Null
    New-Item -ItemType Directory -Path "$serviceName/src/config" -Force | Out-Null
    
    Write-Host "✅ $serviceName 目录创建完成" -ForegroundColor Green
}

Write-Host "🎉 所有服务目录创建完成！" -ForegroundColor Cyan