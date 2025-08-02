# PowerShell版本的健康检查脚本

Write-Host "🏥 检查所有服务健康状态..." -ForegroundColor Green

$services = @(
    @{name="api-gateway"; port=3000},
    @{name="auth-service"; port=3001},
    @{name="base-service"; port=3002},
    @{name="cattle-service"; port=3003},
    @{name="health-service"; port=3004},
    @{name="feeding-service"; port=3005},
    @{name="equipment-service"; port=3006},
    @{name="procurement-service"; port=3007},
    @{name="sales-service"; port=3008},
    @{name="material-service"; port=3009},
    @{name="notification-service"; port=3010},
    @{name="file-service"; port=3011},
    @{name="monitoring-service"; port=3012}
)

foreach ($service in $services) {
    $name = $service.name
    $port = $service.port
    
    Write-Host "检查 $name... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port/health" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ 健康" -ForegroundColor Green
        } else {
            Write-Host "❌ 不健康 (状态码: $($response.StatusCode))" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ 不健康 (连接失败)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📊 查看详细健康状态:" -ForegroundColor Yellow
Write-Host "curl http://localhost:3000/api/v1/health" -ForegroundColor Cyan