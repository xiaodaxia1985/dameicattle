# 简化的微服务生成脚本

Write-Host "🚀 批量生成微服务结构..." -ForegroundColor Green

$services = @(
    @{Name="cattle-service"; Port=3003},
    @{Name="health-service"; Port=3004},
    @{Name="feeding-service"; Port=3005},
    @{Name="equipment-service"; Port=3006},
    @{Name="material-service"; Port=3009},
    @{Name="procurement-service"; Port=3007},
    @{Name="sales-service"; Port=3008}
)

foreach ($service in $services) {
    $serviceName = $service.Name
    $port = $service.Port
    
    Write-Host "📦 生成 $serviceName..." -ForegroundColor Yellow
    
    $servicePath = "microservices/$serviceName"
    
    # 创建目录结构
    New-Item -ItemType Directory -Force -Path "$servicePath/src/config" | Out-Null
    New-Item -ItemType Directory -Force -Path "$servicePath/src/controllers" | Out-Null
    New-Item -ItemType Directory -Force -Path "$servicePath/src/models" | Out-Null
    New-Item -ItemType Directory -Force -Path "$servicePath/src/routes" | Out-Null
    New-Item -ItemType Directory -Force -Path "$servicePath/src/validators" | Out-Null
    New-Item -ItemType Directory -Force -Path "$servicePath/src/middleware" | Out-Null
    New-Item -ItemType Directory -Force -Path "$servicePath/src/utils" | Out-Null
    
    # 复制基础文件
    if (Test-Path "microservices/base-service/src/utils/logger.ts") {
        Copy-Item "microservices/base-service/src/utils/logger.ts" "$servicePath/src/utils/" -Force
        Copy-Item "microservices/base-service/src/config/database.ts" "$servicePath/src/config/" -Force
        Copy-Item "microservices/base-service/src/config/redis.ts" "$servicePath/src/config/" -Force
        Copy-Item "microservices/base-service/src/middleware/responseWrapper.ts" "$servicePath/src/middleware/" -Force
        Copy-Item "microservices/base-service/src/middleware/validation.ts" "$servicePath/src/middleware/" -Force
        Copy-Item "microservices/base-service/src/middleware/errorHandler.ts" "$servicePath/src/middleware/" -Force
        Copy-Item "microservices/base-service/Dockerfile" "$servicePath/" -Force
        Copy-Item "microservices/base-service/tsconfig.json" "$servicePath/" -Force
        
        Write-Host "  ✅ $serviceName 基础文件复制完成" -ForegroundColor Green
    } else {
        Write-Host "  ❌ base-service 模板不存在，请先完成 base-service" -ForegroundColor Red
    }
}

Write-Host "`n🎉 微服务结构生成完成！" -ForegroundColor Green