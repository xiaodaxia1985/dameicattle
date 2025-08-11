# Check health status of all microservices

Write-Host "Checking microservices health status..." -ForegroundColor Cyan
Write-Host ""

# Define all services with their ports
$services = @(
    @{ Name = "api-gateway"; Port = 3000 },
    @{ Name = "auth-service"; Port = 3001 },
    @{ Name = "base-service"; Port = 3002 },
    @{ Name = "cattle-service"; Port = 3003 },
    @{ Name = "health-service"; Port = 3004 },
    @{ Name = "feeding-service"; Port = 3005 },
    @{ Name = "equipment-service"; Port = 3006 },
    @{ Name = "procurement-service"; Port = 3007 },
    @{ Name = "sales-service"; Port = 3008 },
    @{ Name = "material-service"; Port = 3009 },
    @{ Name = "notification-service"; Port = 3010 },
    @{ Name = "file-service"; Port = 3011 },
    @{ Name = "monitoring-service"; Port = 3012 },
    @{ Name = "news-service"; Port = 3013 }
)

# Function to check single service health
function Test-SingleServiceHealth {
    param(
        [string]$ServiceName,
        [int]$Port
    )
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$Port/health" -Method Get -TimeoutSec 3 -ErrorAction Stop
        # Check both possible response formats
        $isHealthy = ($response.status -eq "healthy") -or ($response.data.status -eq "healthy")
        if ($isHealthy) {
            $uptime = if ($response.uptime) { $response.uptime } else { $response.data.uptime }
            return @{
                Status = "OK - Running"
                Healthy = $true
                Uptime = $uptime
                Color = "Green"
            }
        }
    } catch {
        return @{
            Status = "FAIL - No response"
            Healthy = $false
            Error = $_.Exception.Message
            Color = "Red"
        }
    }
    
    return @{
        Status = "WARN - Status abnormal"
        Healthy = $false
        Color = "Yellow"
    }
}

# Check all services
$healthyCount = 0
$results = @()

foreach ($service in $services) {
    $result = Test-SingleServiceHealth -ServiceName $service.Name -Port $service.Port
    $results += @{
        Name = $service.Name
        Port = $service.Port
        Status = $result.Status
        Healthy = $result.Healthy
        Uptime = $result.Uptime
        Color = $result.Color
    }
    
    if ($result.Healthy) {
        $healthyCount++
    }
}

# Display results
Write-Host "Service Health Check Results:" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

foreach ($result in $results) {
    $uptimeText = if ($result.Uptime) { " (uptime: $([math]::Round($result.Uptime, 1))s)" } else { "" }
    Write-Host "  $($result.Name.PadRight(20)) (port $($result.Port.ToString().PadLeft(4))) - $($result.Status)$uptimeText" -ForegroundColor $result.Color
}

Write-Host "=" * 70 -ForegroundColor Gray
Write-Host "Healthy services: $healthyCount/$($services.Count)" -ForegroundColor Green
Write-Host "Failed services: $($services.Count - $healthyCount)/$($services.Count)" -ForegroundColor Red
Write-Host ""

# Show URLs for healthy services
$healthyServices = $results | Where-Object { $_.Healthy }
if ($healthyServices.Count -gt 0) {
    Write-Host "Accessible services:" -ForegroundColor White
    foreach ($service in $healthyServices) {
        Write-Host "  http://localhost:$($service.Port)/health" -ForegroundColor Cyan
    }
    Write-Host ""
}

# Show failed services
$failedServices = $results | Where-Object { -not $_.Healthy }
if ($failedServices.Count -gt 0) {
    Write-Host "Services to check:" -ForegroundColor Yellow
    foreach ($service in $failedServices) {
        Write-Host "  - $($service.Name) (port $($service.Port))" -ForegroundColor Red
        Write-Host "    Log file: logs/$($service.Name).log" -ForegroundColor Gray
    }
    Write-Host ""
}

# Overall status
if ($healthyCount -eq $services.Count) {
    Write-Host "All microservices are running normally!" -ForegroundColor Green
} elseif ($healthyCount -gt 0) {
    Write-Host "Some microservices are running, please check failed services." -ForegroundColor Yellow
} else {
    Write-Host "All microservices are inaccessible, please check if services are started." -ForegroundColor Red
}

Write-Host ""
Write-Host "Tips:" -ForegroundColor Yellow
Write-Host "  - Start all services: .\start-services-npm.ps1" -ForegroundColor Gray
Write-Host "  - Stop all services: .\stop-services.ps1" -ForegroundColor Gray
Write-Host "  - View service logs: Get-Content logs/[service-name].log -Wait" -ForegroundColor Gray