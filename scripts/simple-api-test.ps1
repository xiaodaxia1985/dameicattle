# Simple API test for core microservices

Write-Host "Testing core microservices API endpoints..." -ForegroundColor Green

$services = @(
    @{Name="auth-service"; Port=3001},
    @{Name="base-service"; Port=3002},
    @{Name="cattle-service"; Port=3003},
    @{Name="health-service"; Port=3004},
    @{Name="feeding-service"; Port=3005}
)

foreach ($service in $services) {
    $serviceName = $service.Name
    $port = $service.Port
    
    Write-Host "Testing $serviceName on port $port..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$port/health" -Method Get -TimeoutSec 5
        
        if ($response.success -eq $true) {
            Write-Host "  Health check: PASSED" -ForegroundColor Green
            Write-Host "  Service: $($response.data.service)" -ForegroundColor Gray
            Write-Host "  Status: $($response.data.status)" -ForegroundColor Gray
            Write-Host "  Database: $($response.data.checks.database)" -ForegroundColor Gray
            Write-Host "  Uptime: $([math]::Round($response.data.uptime, 2)) seconds" -ForegroundColor Gray
        } else {
            Write-Host "  Health check: FAILED" -ForegroundColor Red
        }
    } catch {
        Write-Host "  Connection: FAILED - $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "All core services tested!" -ForegroundColor Green
Write-Host "Next: Test specific API endpoints with authentication" -ForegroundColor Yellow