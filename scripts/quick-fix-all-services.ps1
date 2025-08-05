#!/usr/bin/env pwsh

Write-Host "=== Quick Fix All Microservices ===" -ForegroundColor Green

# Service configurations
$services = @{
    "base-service" = 3002
    "cattle-service" = 3003
    "health-service" = 3004
    "feeding-service" = 3005
    "equipment-service" = 3006
    "procurement-service" = 3007
    "sales-service" = 3008
    "material-service" = 3009
    "notification-service" = 3010
    "file-service" = 3011
    "monitoring-service" = 3012
    "news-service" = 3013
}

Write-Host "1. Fixing all mock service files..." -ForegroundColor Yellow

foreach ($serviceName in $services.Keys) {
    $port = $services[$serviceName]
    $serviceFile = "mock-services/$serviceName/app.js"
    
    if (Test-Path $serviceFile) {
        Write-Host "  Fixing $serviceName..." -ForegroundColor Cyan
        
        # Read and fix the file
        $content = Get-Content $serviceFile -Raw
        $content = $content -replace "console\.log\(Mock \+serviceName\+ listening on port \+port\);", "console.log('Mock ' + serviceName + ' listening on port ' + port);"
        $content | Set-Content $serviceFile -Encoding UTF8
    }
}

Write-Host "2. Starting all services directly..." -ForegroundColor Yellow

$processes = @()
foreach ($serviceName in $services.Keys) {
    $port = $services[$serviceName]
    $serviceDir = "mock-services/$serviceName"
    
    if (Test-Path "$serviceDir/app.js") {
        Write-Host "  Starting $serviceName on port $port..." -ForegroundColor Cyan
        
        # Start process directly
        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "node"
        $psi.Arguments = "app.js"
        $psi.WorkingDirectory = Resolve-Path $serviceDir
        $psi.UseShellExecute = $false
        $psi.CreateNoWindow = $true
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError = $true
        
        # Set environment variable
        $psi.EnvironmentVariables["PORT"] = $port.ToString()
        
        $process = [System.Diagnostics.Process]::Start($psi)
        $processes += @{
            Name = $serviceName
            Port = $port
            Process = $process
        }
    }
}

Write-Host "3. Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "4. Testing service health..." -ForegroundColor Yellow
$healthyCount = 0
foreach ($processInfo in $processes) {
    $serviceName = $processInfo.Name
    $port = $processInfo.Port
    $process = $processInfo.Process
    
    try {
        if (-not $process.HasExited) {
            $response = Invoke-WebRequest -Uri "http://localhost:$port/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "  ✅ $serviceName (port $port) - Healthy" -ForegroundColor Green
                $healthyCount++
            } else {
                Write-Host "  ⚠️ $serviceName (port $port) - Responding but unhealthy" -ForegroundColor Yellow
            }
        } else {
            Write-Host "  ❌ $serviceName (port $port) - Process exited" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ $serviceName (port $port) - Not responding" -ForegroundColor Red
    }
}

Write-Host "=== Quick Fix Complete ===" -ForegroundColor Green
Write-Host "✅ $healthyCount/$($services.Count) services are healthy" -ForegroundColor Green

if ($healthyCount -gt 0) {
    Write-Host ""
    Write-Host "Services are running in background processes." -ForegroundColor Cyan
    Write-Host "To stop all services, run:" -ForegroundColor Yellow
    Write-Host "Get-Process node | Where-Object {`$_.ProcessName -eq 'node'} | Stop-Process" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Test all services with: scripts\test-microservices-health.ps1" -ForegroundColor Cyan
}