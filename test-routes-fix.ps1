# 路由修复验证脚本

Write-Host "=== 路由修复验证测试 ===" -ForegroundColor Green
Write-Host ""

# 定义测试URL
$baseUrl = "http://localhost"
$services = @(
    @{ Name = "API Gateway"; Port = 3000; Path = "/health" },
    @{ Name = "Auth Service"; Port = 3001; Path = "/health" },
    @{ Name = "Base Service"; Port = 3002; Path = "/health" },
    @{ Name = "Cattle Service"; Port = 3003; Path = "/health" }
)

$gatewayRoutes = @(
    @{ Name = "Auth via Gateway"; Url = "$baseUrl`:3000/api/v1/auth/health" },
    @{ Name = "Base via Gateway"; Url = "$baseUrl`:3000/api/v1/base/health" },
    @{ Name = "Cattle via Gateway"; Url = "$baseUrl`:3000/api/v1/cattle/health" }
)

Write-Host "1. 检查微服务直接访问:" -ForegroundColor Yellow
foreach ($service in $services) {
    try {
        $url = "$baseUrl`:$($service.Port)$($service.Path)"
        $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 3 -ErrorAction Stop
        Write-Host "✓ $($service.Name) ($url)" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ $($service.Name) ($url) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "2. 检查API网关路由代理:" -ForegroundColor Yellow
foreach ($route in $gatewayRoutes) {
    try {
        $response = Invoke-RestMethod -Uri $route.Url -Method Get -TimeoutSec 3 -ErrorAction Stop
        Write-Host "✓ $($route.Name) ($($route.Url))" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ $($route.Name) ($($route.Url)) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== 测试完成 ===" -ForegroundColor Green