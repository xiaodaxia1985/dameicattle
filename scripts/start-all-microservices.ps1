#!/usr/bin/env pwsh

# Start All Microservices Script
# Starts all 14 microservices in the correct order

param(
    [switch]$Install = $false,
    [switch]$Logs = $false,
    [int]$Delay = 3
)

Write-Host "🚀 Starting All Microservices..." -ForegroundColor Green

# Define all microservices in startup order
$microservices = @(
    @{Name="auth-service"; Port=3001; Priority=1; Description="Authentication Service"},
    @{Name="base-service"; Port=3002; Priority=2; Description="Base Management Service"},
    @{Name="cattle-service"; Port=3003; Priority=3; Description="Cattle Management Service"},
    @{Name="health-service"; Port=3004; Priority=4; Description="Health Management Service"},
    @{Name="feeding-service"; Port=3005; Priority=5; Description="Feeding Management Service"},
    @{Name="equipment-service"; Port=3006; Priority=6; Description="Equipment Management Service"},
    @{Name="procurement-service"; Port=3007; Priority=7; Description="Procurement Management Service"},
    @{Name="sales-service"; Port=3008; Priority=8; Description="Sales Management Service"},
    @{Name="material-service"; Port=3009; Priority=9; Description="Material Management Service"},
    @{Name="notification-service"; Port=3010; Priority=10; Description="Notification Service"},
    @{Name="file-service"; Port=3011; Priority=11; Description="File Management Service"},
    @{Name="monitoring-service"; Port=3012; Priority=12; Description="Monitoring Service"},
    @{Name="news-service"; Port=3013; Priority=13; Description="News Management Service"}
)

# Function to check if port is in use
function Test-PortInUse {
    param($Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Function to install dependencies
function Install-Dependencies {
    param($ServiceName)
    
    $servicePath = "microservices/$ServiceName"
    if (Test-Path "$servicePath/package.json") {
        Write-Host "📦 Installing dependencies for $ServiceName..." -ForegroundColor Yellow
        Push-Location $servicePath
        try {
            npm install --silent
            Write-Host "  ✅ Dependencies installed" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ Failed to install dependencies" -ForegroundColor Red
        }
        Pop-Location
    }
}

# Function to start a microservice
function Start-Microservice {
    param($Service)
    
    $serviceName = $Service.Name
    $port = $Service.Port
    $servicePath = "microservices/$serviceName"
    
    Write-Host "🔧 Starting $serviceName on port $port..." -ForegroundColor Cyan
    
    # Check if service directory exists
    if (-not (Test-Path $servicePath)) {
        Write-Host "  ❌ Service directory not found: $servicePath" -ForegroundColor Red
        return $false
    }
    
    # Check if port is already in use
    if (Test-PortInUse -Port $port) {
        Write-Host "  ⚠️  Port $port already in use (service may already be running)" -ForegroundColor Yellow
        return $true
    }
    
    # Install dependencies if requested
    if ($Install) {
        Install-Dependencies -ServiceName $serviceName
    }
    
    # Start the service in background
    try {
        Push-Location $servicePath
        
        # Check if package.json exists
        if (-not (Test-Path "package.json")) {
            Write-Host "  ❌ package.json not found in $servicePath" -ForegroundColor Red
            Pop-Location
            return $false
        }
        
        # Start the service
        Write-Host "  🚀 Launching $serviceName..." -ForegroundColor Gray
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WindowStyle Minimized -PassThru
        
        Pop-Location
        
        # Wait for service to start
        Start-Sleep -Seconds $Delay
        
        # Verify service is running
        if (Test-PortInUse -Port $port) {
            Write-Host "  ✅ $serviceName started successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  ❌ $serviceName failed to start" -ForegroundColor Red
            return $false
        }
        
    } catch {
        Write-Host "  ❌ Error starting $serviceName`: $($_.Exception.Message)" -ForegroundColor Red
        Pop-Location
        return $false
    }
}

# Function to test service health
function Test-ServiceHealth {
    param($Service)
    
    $serviceName = $Service.Name
    $port = $Service.Port
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$port/health" -Method Get -TimeoutSec 5
        if ($response.status -eq "healthy" -or $response.success -eq $true) {
            Write-Host "  ✅ $serviceName health check passed" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  ⚠️  $serviceName health check returned: $($response.status)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "  ❌ $serviceName health check failed" -ForegroundColor Red
        return $false
    }
}

# Main execution
Write-Host "📋 Microservices to start:" -ForegroundColor Yellow
foreach ($service in $microservices) {
    Write-Host "  $($service.Priority). $($service.Name) (Port: $($service.Port)) - $($service.Description)" -ForegroundColor White
}

Write-Host "`n🔍 Checking prerequisites..." -ForegroundColor Cyan

# Check if microservices directory exists
if (-not (Test-Path "microservices")) {
    Write-Host "❌ Microservices directory not found!" -ForegroundColor Red
    Write-Host "Please ensure you're running this script from the project root directory." -ForegroundColor Gray
    exit 1
}

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found! Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is installed
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found! Please install npm first." -ForegroundColor Red
    exit 1
}

Write-Host "`n🚀 Starting microservices..." -ForegroundColor Green

$startedServices = @()
$failedServices = @()

# Start services in priority order
foreach ($service in ($microservices | Sort-Object Priority)) {
    $result = Start-Microservice -Service $service
    if ($result) {
        $startedServices += $service
    } else {
        $failedServices += $service
    }
}

Write-Host "`n⏳ Waiting for all services to fully initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host "`n🔍 Performing health checks..." -ForegroundColor Cyan

$healthyServices = @()
$unhealthyServices = @()

foreach ($service in $startedServices) {
    Write-Host "Testing $($service.Name)..." -ForegroundColor Gray
    if (Test-ServiceHealth -Service $service) {
        $healthyServices += $service
    } else {
        $unhealthyServices += $service
    }
}

# Summary Report
Write-Host "`n📊 Startup Summary:" -ForegroundColor Green
Write-Host "=" * 60

Write-Host "`n✅ Successfully Started ($($startedServices.Count)):" -ForegroundColor Green
foreach ($service in $startedServices) {
    $status = if ($service -in $healthyServices) { "🟢 Healthy" } else { "🟡 Started" }
    Write-Host "  • $($service.Name) (Port: $($service.Port)) - $status" -ForegroundColor White
}

if ($failedServices.Count -gt 0) {
    Write-Host "`n❌ Failed to Start ($($failedServices.Count)):" -ForegroundColor Red
    foreach ($service in $failedServices) {
        Write-Host "  • $($service.Name) (Port: $($service.Port))" -ForegroundColor Red
    }
}

if ($unhealthyServices.Count -gt 0) {
    Write-Host "`n⚠️  Started but Unhealthy ($($unhealthyServices.Count)):" -ForegroundColor Yellow
    foreach ($service in $unhealthyServices) {
        Write-Host "  • $($service.Name) (Port: $($service.Port))" -ForegroundColor Yellow
    }
}

# Service URLs
Write-Host "`n🌐 Service Access URLs:" -ForegroundColor Cyan
foreach ($service in $startedServices) {
    Write-Host "  http://localhost:$($service.Port) - $($service.Name)" -ForegroundColor White
}

# Next steps
Write-Host "`n🎯 Next Steps:" -ForegroundColor Yellow
if ($failedServices.Count -gt 0) {
    Write-Host "1. Check failed services manually:" -ForegroundColor Gray
    foreach ($service in $failedServices) {
        Write-Host "   cd microservices/$($service.Name) && npm run dev" -ForegroundColor White
    }
}
Write-Host "2. Test API endpoints with your frontend application" -ForegroundColor Gray
Write-Host "3. Monitor service logs for any issues" -ForegroundColor Gray
Write-Host "4. Use './scripts/test-all-microservices.ps1' to verify all endpoints" -ForegroundColor Gray

# Show logs if requested
if ($Logs) {
    Write-Host "`n📄 Showing service logs..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to stop viewing logs" -ForegroundColor Gray
    Start-Sleep -Seconds 2
    # Note: In a real implementation, you'd need to capture and display the logs
    Write-Host "Log viewing not implemented in this version. Check individual service terminals." -ForegroundColor Gray
}

Write-Host "`n🎉 Microservice startup process completed!" -ForegroundColor Green

if ($startedServices.Count -eq $microservices.Count) {
    Write-Host "All microservices are running! 🚀" -ForegroundColor Green
} else {
    Write-Host "Some services need attention. Check the summary above." -ForegroundColor Yellow
}