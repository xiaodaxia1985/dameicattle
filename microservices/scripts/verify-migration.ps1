# 微服务迁移验证脚本

Write-Host "🔍 验证微服务架构迁移..." -ForegroundColor Green

# 检查所有服务目录是否存在
$requiredServices = @(
    "api-gateway", "auth-service", "base-service", "cattle-service",
    "health-service", "feeding-service", "equipment-service",
    "procurement-service", "sales-service", "material-service",
    "notification-service", "file-service", "monitoring-service"
)

Write-Host "📁 检查服务目录..." -ForegroundColor Yellow
$missingServices = @()
foreach ($service in $requiredServices) {
    if (Test-Path $service) {
        Write-Host "✅ $service" -ForegroundColor Green
    } else {
        Write-Host "❌ $service (缺失)" -ForegroundColor Red
        $missingServices += $service
    }
}

# 检查共享库
Write-Host "`n📦 检查共享库..." -ForegroundColor Yellow
if (Test-Path "shared/src/index.ts") {
    Write-Host "✅ 共享库存在" -ForegroundColor Green
} else {
    Write-Host "❌ 共享库缺失" -ForegroundColor Red
}

# 检查Docker配置
Write-Host "`n🐳 检查Docker配置..." -ForegroundColor Yellow
if (Test-Path "docker-compose.yml") {
    Write-Host "✅ docker-compose.yml 存在" -ForegroundColor Green
} else {
    Write-Host "❌ docker-compose.yml 缺失" -ForegroundColor Red
}

# 检查数据库初始化脚本
Write-Host "`n🗄️ 检查数据库配置..." -ForegroundColor Yellow
if (Test-Path "database/init") {
    Write-Host "✅ 数据库初始化脚本存在" -ForegroundColor Green
} else {
    Write-Host "❌ 数据库初始化脚本缺失" -ForegroundColor Red
}

# 检查启动脚本
Write-Host "`n🚀 检查启动脚本..." -ForegroundColor Yellow
$scripts = @("start-dev.ps1", "health-check.ps1", "stop-all.ps1")
foreach ($script in $scripts) {
    if (Test-Path "scripts/$script") {
        Write-Host "✅ $script" -ForegroundColor Green
    } else {
        Write-Host "❌ $script (缺失)" -ForegroundColor Red
    }
}

# 总结
Write-Host "`n📊 迁移状态总结:" -ForegroundColor Cyan
if ($missingServices.Count -eq 0) {
    Write-Host "✅ 所有微服务已创建完成" -ForegroundColor Green
    Write-Host "🚀 可以运行 ./scripts/start-dev.ps1 启动服务" -ForegroundColor Yellow
} else {
    Write-Host "❌ 还有 $($missingServices.Count) 个服务需要创建" -ForegroundColor Red
    Write-Host "缺失的服务: $($missingServices -join ', ')" -ForegroundColor Red
}

Write-Host "`n📋 下一步操作:" -ForegroundColor Cyan
Write-Host "1. 运行 ./scripts/start-dev.ps1 启动所有服务" -ForegroundColor White
Write-Host "2. 运行 ./scripts/health-check.ps1 检查服务健康状态" -ForegroundColor White
Write-Host "3. 访问 http://localhost:3000 测试API网关" -ForegroundColor White
Write-Host "4. 根据迁移指南逐步迁移业务逻辑" -ForegroundColor White