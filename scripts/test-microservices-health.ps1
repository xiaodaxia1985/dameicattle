#!/usr/bin/env pwsh

# Test microservices health endpoints
Write-Host "=== Testing Microservices Health ===" -ForegroundColor Green

$services = @(
    @{name="api-gateway"; port=3001},
    @{name="auth-service"; port=3002},
    @{name="base-service"; port=3003},
    @{name="cattle-service"; port=3004},
    @{name="health-service"; port=3005},
    @{name="feeding-service"; port=3006},
    @{name="equipment-service"; port=3007},
    @{name="procurement-service"; port=3008},
    @{name="sales-service"; port=3009},
    @{name="material-service"; port=3010},
    @{name="notification-service"; port=3011},
    @{name="file-service"; port=3012},
    @{name="monitoring-service"; port=3013},
    @{name="news-service"; port=3014}
)

$healthyServices = @()
$unhealthyServices = @()

foreach ($service in $services) {
    $serviceName = $service.name
    $port = $service.port
    
    Write-Host "Testing $serviceName on port $port..." -ForegroundColor Cyan
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$port/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
        
        if ($response.status -eq "ok") {
            Write-Host "  ✓ $serviceName is healthy" -ForegroundColor Green
            $healthyServices += $serviceName
        } else {
            Write-Host "  ⚠ $serviceName responded but status is not ok" -ForegroundColor Yellow
            $unhealthyServices += $serviceName
        }
    }
    catch {
        Write-Host "  ✗ $serviceName is not responding" -ForegroundColor Red
        $unhealthyServices += $serviceName
    }
}

Write-Host "`n=== Health Check Results ===" -ForegroundColor Green
Write-Host "Healthy services: $($healthyServices.Count)" -ForegroundColor Green
Write-Host "Unhealthy services: $($unhealthyServices.Count)" -ForegroundColor Red

if ($healthyServices.Count -gt 0) {
    Write-Host "`nHealthy services:" -ForegroundColor Green
    $healthyServices | ForEach-Object { Write-Host "  ✓ $_" -ForegroundColor Green }
}

if ($unhealthyServices.Count -gt 0) {
    Write-Host "`nUnhealthy services:" -ForegroundColor Red
    $unhealthyServices | ForEach-Object { Write-Host "  ✗ $_" -ForegroundColor Red }
}

Write-Host "`n=== Health Check Complete ===" -ForegroundColor Green