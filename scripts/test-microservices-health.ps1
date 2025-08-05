#!/usr/bin/env pwsh

# Test microservices health
Write-Host "=== Testing Microservices Health ===" -ForegroundColor Green

# Define microservice endpoints based on optimized services
$microservices = @{
    "api-gateway" = "http://localhost:3001"
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

Write-Host "1. Checking microservice health..." -ForegroundColor Cyan

$healthyServices = @()
$unhealthyServices = @()

foreach ($service in $microservices.GetEnumerator()) {
    $serviceName = $service.Key
    $serviceUrl = $service.Value
    $healthUrl = "$serviceUrl/health"
    
    Write-Host "  Testing $serviceName..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-RestMethod -Uri $healthUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.status -eq "ok" -or $response.status -eq "healthy") {
            $healthyServices += $serviceName
            Write-Host "    ✓ HEALTHY" -ForegroundColor Green
        } else {
            $unhealthyServices += $serviceName
            Write-Host "    ⚠ UNHEALTHY" -ForegroundColor Yellow
        }
    } catch {
        $unhealthyServices += $serviceName
        Write-Host "    ✗ UNREACHABLE" -ForegroundColor Red
    }
}

Write-Host "`n2. Health Check Results:" -ForegroundColor Cyan
Write-Host "  Healthy: $($healthyServices.Count)/$($microservices.Count)" -ForegroundColor Green
Write-Host "  Unhealthy: $($unhealthyServices.Count)/$($microservices.Count)" -ForegroundColor Red

if ($healthyServices.Count -gt 0) {
    Write-Host "`nHealthy Services:" -ForegroundColor Green
    foreach ($service in $healthyServices) {
        $port = $microservices[$service] -replace "http://localhost:", ""
        Write-Host "  ✓ $service (port $port)" -ForegroundColor Green
    }
}

if ($unhealthyServices.Count -gt 0) {
    Write-Host "`nUnhealthy Services:" -ForegroundColor Red
    foreach ($service in $unhealthyServices) {
        $port = $microservices[$service] -replace "http://localhost:", ""
        Write-Host "  ✗ $service (port $port)" -ForegroundColor Red
    }
}

Write-Host "`n3. Docker Container Status:" -ForegroundColor Cyan
Set-Location "microservices"
docker-compose -f docker-compose.optimized.yml ps
Set-Location ".."

Write-Host "`n=== Health Check Complete ===" -ForegroundColor Green

if ($healthyServices.Count -eq $microservices.Count) {
    Write-Host "🎉 All microservices are healthy!" -ForegroundColor Green
} elseif ($healthyServices.Count -gt 0) {
    Write-Host "⚠️  Some microservices need attention." -ForegroundColor Yellow
} else {
    Write-Host "❌ Most microservices are not responding." -ForegroundColor Red
}

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Check logs for unhealthy services: cd microservices; docker-compose -f docker-compose.simple.yml logs [service-name]" -ForegroundColor White
Write-Host "2. Restart problematic services: docker-compose -f docker-compose.simple.yml restart [service-name]" -ForegroundColor White
Write-Host "3. Test frontend integration once all services are healthy" -ForegroundColor White