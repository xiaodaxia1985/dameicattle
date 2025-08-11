# Quick health check for all microservices - simplified version

$services = @(3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 3011, 3012, 3013)
$serviceNames = @("api-gateway", "auth-service", "base-service", "cattle-service", "health-service", "feeding-service", "equipment-service", "procurement-service", "sales-service", "material-service", "notification-service", "file-service", "monitoring-service", "news-service")

Write-Host "Quick Health Check..." -ForegroundColor Cyan

$healthy = 0
for ($i = 0; $i -lt $services.Count; $i++) {
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$($services[$i])/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
        # Check both possible response formats
        $isHealthy = ($response.status -eq "healthy") -or ($response.data.status -eq "healthy")
        if ($isHealthy) {
            Write-Host "OK $($serviceNames[$i]) (port $($services[$i]))" -ForegroundColor Green
            $healthy++
        }
    } catch {
        Write-Host "FAIL $($serviceNames[$i]) (port $($services[$i]))" -ForegroundColor Red
    }
}

Write-Host ""
$statusColor = if ($healthy -eq $services.Count) { "Green" } elseif ($healthy -gt 0) { "Yellow" } else { "Red" }
Write-Host "Result: $healthy/$($services.Count) services are healthy" -ForegroundColor $statusColor