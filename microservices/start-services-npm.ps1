# Start microservices using npm directly (no Docker)

param(
    [switch]$Rebuild,
    [switch]$Help
)

if ($Help) {
    Write-Host "Usage: .\start-services-npm.ps1 [-Rebuild] [-Help]" -ForegroundColor Cyan
    Write-Host "  -Rebuild: Clean and rebuild all services before starting" -ForegroundColor Yellow
    Write-Host "  -Help: Show this help message" -ForegroundColor Yellow
    exit 0
}

if ($Rebuild) {
    Write-Host "Rebuilding all microservices first..." -ForegroundColor Green
    $scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
    $rebuildScript = Join-Path $scriptRoot 'rebuild-all.ps1'
    & $rebuildScript
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Rebuild failed, aborting startup" -ForegroundColor Red
        exit 1
    }
    Write-Host "Rebuild completed, starting services..." -ForegroundColor Green
    Write-Host ""
}

Write-Host "Starting microservices using npm..." -ForegroundColor Green

# Check Node.js
try {
    node --version | Out-Null
    Write-Host "Node.js is running" -ForegroundColor Green
} catch {
    Write-Host "Please install Node.js first" -ForegroundColor Red
    exit 1
}

# Remind user to start local database and Redis
Write-Host ""
Write-Host "Note: Please ensure the following services are running locally:" -ForegroundColor Yellow
Write-Host "- PostgreSQL (port: 5432)" -ForegroundColor Cyan
Write-Host "- Redis (port: 6379)" -ForegroundColor Cyan
Write-Host ""

# Create logs directory if it doesn't exist
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# Function to check service health
function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [int]$Port,
        [int]$MaxRetries = 3,
        [int]$RetryInterval = 2
    )
    
    $retries = 0
    while ($retries -lt $MaxRetries) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:$Port/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
            # Check both possible response formats
            $isHealthy = ($response.status -eq "healthy") -or ($response.data.status -eq "healthy")
            if ($isHealthy) {
                Write-Host "OK $ServiceName (port $Port) - Started successfully" -ForegroundColor Green
                return $true
            }
        } catch {
            # Service not ready yet, continue retrying
        }
        
        $retries++
        if ($retries -lt $MaxRetries) {
            Write-Host "WAIT $ServiceName (port $Port) - Starting... ($retries/$MaxRetries)" -ForegroundColor Yellow
            Start-Sleep -Seconds $RetryInterval
        }
    }
    
    Write-Host "FAIL $ServiceName (port $Port) - Startup failed or timeout" -ForegroundColor Red
    return $false
}

# Array to track service status
$serviceStatus = @()

# Function to start service and check health
function Start-ServiceWithHealthCheck {
    param(
        [string]$ServiceName,
        [string]$ServiceDir,
        [int]$Port,
        [int]$StartupDelay = 3
    )
    
    Write-Host "Building and starting $ServiceName..." -ForegroundColor Yellow
    
    # Force build before starting
    Write-Host "  Building $ServiceName..." -ForegroundColor Cyan
    $buildResult = Start-Process powershell -ArgumentList "-Command", "cd '$ServiceDir'; npm run build" -Wait -PassThru -WindowStyle Hidden
    
    if ($buildResult.ExitCode -ne 0) {
        Write-Host "  Build failed for $ServiceName" -ForegroundColor Red
        $script:serviceStatus += @{
            Name = $ServiceName
            Port = $Port
            Status = "FAIL - Build failed"
            Healthy = $false
        }
        return
    }
    
    Write-Host "  Starting $ServiceName..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-Command", "cd '$ServiceDir'; npm start > ../logs/$ServiceName.log 2>&1" -WindowStyle Hidden
    
    Start-Sleep -Seconds $StartupDelay
    
    $isHealthy = Test-ServiceHealth -ServiceName $ServiceName -Port $Port
    $script:serviceStatus += @{
        Name = $ServiceName
        Port = $Port
        Status = if ($isHealthy) { "OK - Running" } else { "FAIL - Startup failed" }
        Healthy = $isHealthy
    }
}

# Start services with health checks
Write-Host ""
Write-Host "Starting microservices with health checks..." -ForegroundColor Cyan
Write-Host "Note: Services will use their configured start scripts (some use ts-node, others compile first)." -ForegroundColor Yellow
Write-Host ""

# Start auth service
Start-ServiceWithHealthCheck -ServiceName "auth-service" -ServiceDir "auth-service" -Port 3001 -StartupDelay 3

# Start base service
Start-ServiceWithHealthCheck -ServiceName "base-service" -ServiceDir "base-service" -Port 3002 -StartupDelay 2

# Start cattle service
Start-ServiceWithHealthCheck -ServiceName "cattle-service" -ServiceDir "cattle-service" -Port 3003 -StartupDelay 2

# Start health service
Start-ServiceWithHealthCheck -ServiceName "health-service" -ServiceDir "health-service" -Port 3004 -StartupDelay 2

# Start feeding service
Start-ServiceWithHealthCheck -ServiceName "feeding-service" -ServiceDir "feeding-service" -Port 3005 -StartupDelay 2

# Start equipment service
Start-ServiceWithHealthCheck -ServiceName "equipment-service" -ServiceDir "equipment-service" -Port 3006 -StartupDelay 1

# Start procurement service
Start-ServiceWithHealthCheck -ServiceName "procurement-service" -ServiceDir "procurement-service" -Port 3007 -StartupDelay 1

# Start sales service
Start-ServiceWithHealthCheck -ServiceName "sales-service" -ServiceDir "sales-service" -Port 3008 -StartupDelay 1

# Start material service
Start-ServiceWithHealthCheck -ServiceName "material-service" -ServiceDir "material-service" -Port 3009 -StartupDelay 1

# Start notification service
Start-ServiceWithHealthCheck -ServiceName "notification-service" -ServiceDir "notification-service" -Port 3010 -StartupDelay 1

# Start file service
Start-ServiceWithHealthCheck -ServiceName "file-service" -ServiceDir "file-service" -Port 3011 -StartupDelay 1

# Start monitoring service
Start-ServiceWithHealthCheck -ServiceName "monitoring-service" -ServiceDir "monitoring-service" -Port 3012 -StartupDelay 1

# Start news service
Start-ServiceWithHealthCheck -ServiceName "news-service" -ServiceDir "news-service" -Port 3013 -StartupDelay 2

# Start API gateway
Start-ServiceWithHealthCheck -ServiceName "api-gateway" -ServiceDir "api-gateway" -Port 3000 -StartupDelay 2

# Display service status summary
Write-Host ""
Write-Host "Microservices Startup Status Summary:" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$healthyCount = 0
$failedCount = 0

foreach ($service in $serviceStatus) {
    $statusColor = if ($service.Healthy) { "Green" } else { "Red" }
    Write-Host "  $($service.Name.PadRight(20)) (port $($service.Port.ToString().PadLeft(4))) - $($service.Status)" -ForegroundColor $statusColor
    
    if ($service.Healthy) {
        $healthyCount++
    } else {
        $failedCount++
    }
}

Write-Host "=" * 60 -ForegroundColor Gray
Write-Host "Successfully started: $healthyCount services" -ForegroundColor Green
Write-Host "Failed to start: $failedCount services" -ForegroundColor Red
Write-Host ""

if ($failedCount -gt 0) {
    Write-Host "Some services failed to start, please check log files:" -ForegroundColor Yellow
    foreach ($service in $serviceStatus) {
        if (-not $service.Healthy) {
            Write-Host "   - logs/$($service.Name).log" -ForegroundColor Red
        }
    }
    Write-Host ""
}

if ($healthyCount -gt 0) {
    Write-Host "Running service URLs:" -ForegroundColor White
    foreach ($service in $serviceStatus) {
        if ($service.Healthy) {
            $displayName = $service.Name -replace "-service", "" -replace "-", " "
            $displayName = (Get-Culture).TextInfo.ToTitleCase($displayName)
            Write-Host "  $($displayName): http://localhost:$($service.Port)" -ForegroundColor Cyan
        }
    }
    Write-Host ""
}

Write-Host "Log files location: logs/ directory" -ForegroundColor Yellow
Write-Host "   - View all logs: Get-ChildItem logs/*.log" -ForegroundColor Gray
Write-Host "   - View specific service log: Get-Content logs/[service-name].log -Wait" -ForegroundColor Gray
Write-Host "   - Stop all services: .\stop-services.ps1" -ForegroundColor Gray
Write-Host ""

if ($healthyCount -eq $serviceStatus.Count) {
    Write-Host "All microservices started successfully! System is ready." -ForegroundColor Green
} elseif ($healthyCount -gt 0) {
    Write-Host "Some microservices started successfully, please check failed services." -ForegroundColor Yellow
} else {
    Write-Host "All microservices failed to start, please check system configuration and dependencies." -ForegroundColor Red
}