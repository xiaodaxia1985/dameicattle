# 检查微服务结构的脚本

Write-Host "🔍 检查微服务结构..." -ForegroundColor Green

$services = @("auth-service", "base-service", "cattle-service", "health-service", "feeding-service", "equipment-service", "procurement-service", "sales-service", "material-service")

foreach ($service in $services) {
    Write-Host "📦 检查 $service..." -ForegroundColor Yellow
    
    $servicePath = "microservices/$service"
    
    if (Test-Path $servicePath) {
        Write-Host "  ✅ 目录存在" -ForegroundColor Green
        
        if (Test-Path "$servicePath/package.json") {
            Write-Host "  ✅ package.json 存在" -ForegroundColor Green
        } else {
            Write-Host "  ❌ package.json 缺失" -ForegroundColor Red
        }
        
        if (Test-Path "$servicePath/src") {
            Write-Host "  ✅ src 目录存在" -ForegroundColor Green
        } else {
            Write-Host "  ❌ src 目录缺失" -ForegroundColor Red
        }
        
        if (Test-Path "$servicePath/Dockerfile") {
            Write-Host "  ✅ Dockerfile 存在" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Dockerfile 缺失" -ForegroundColor Red
        }
    } else {
        Write-Host "  ❌ 目录不存在" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "🎉 检查完成！" -ForegroundColor Green