# Start and test core microservices

Write-Host "🚀 Starting core microservices..." -ForegroundColor Green

$coreServices = @(
    @{Name="auth-service"; Port=3001; Priority=1},
    @{Name="base-service"; Port=3002; Priority=2},
    @{Name="cattle-service"; Port=3003; Priority=3},
    @{Name="health-service"; Port=3004; Priority=4},
    @{Name="feeding-service"; Port=3005; Priority=5}
)

# Function to test service health
function Test-ServiceHealth {
    param($ServiceName, $Port)
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$Port/health" -Method Get -TimeoutSec 5
        if ($response.success -eq $true) {
            Write-Host "  ✅ $ServiceName health check passed" -ForegroundColor Green
            return $true
        } else {
            Write-Host "  ❌ $ServiceName health check failed" -ForegroundColor Red
            return $false
        }
    } catch {
        Write-Host "  ❌ $ServiceName not responding on port $Port" -ForegroundColor Red
        return $false
    }
}

# Function to install dependencies
function Install-ServiceDependencies {
    param($ServiceName)
    
    $servicePath = "microservices/$ServiceName"
    if (Test-Path "$servicePath/package.json") {
        Write-Host "📦 Installing dependencies for $ServiceName..." -ForegroundColor Yellow
        Push-Location $servicePath
        try {
            npm install --silent
            Write-Host "  ✅ Dependencies installed for $ServiceName" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ Failed to install dependencies for $ServiceName" -ForegroundColor Red
        }
        Pop-Location
    }
}

# Install dependencies for all core services
Write-Host "📦 Installing dependencies for core services..." -ForegroundColor Cyan
foreach ($service in $coreServices) {
    Install-ServiceDependencies -ServiceName $service.Name
}

Write-Host "`n🔍 Testing service health endpoints..." -ForegroundColor Cyan

# Test each service
$healthyServices = @()
$unhealthyServices = @()

foreach ($service in $coreServices) {
    $serviceName = $service.Name
    $port = $service.Port
    
    Write-Host "Testing $serviceName on port $port..." -ForegroundColor Yellow
    
    if (Test-ServiceHealth -ServiceName $serviceName -Port $port) {
        $healthyServices += $service
    } else {
        $unhealthyServices += $service
    }
}

# Summary
Write-Host "`n📊 Service Health Summary:" -ForegroundColor Cyan
Write-Host "=" * 50

if ($healthyServices.Count -gt 0) {
    Write-Host "✅ Healthy Services ($($healthyServices.Count)):" -ForegroundColor Green
    foreach ($service in $healthyServices) {
        Write-Host "  • $($service.Name) (port: $($service.Port))" -ForegroundColor Green
    }
}

if ($unhealthyServices.Count -gt 0) {
    Write-Host "`n❌ Services needing attention ($($unhealthyServices.Count)):" -ForegroundColor Red
    foreach ($service in $unhealthyServices) {
        Write-Host "  • $($service.Name) (port: $($service.Port))" -ForegroundColor Red
    }
    
    Write-Host "`n💡 To start services manually:" -ForegroundColor Yellow
    foreach ($service in $unhealthyServices) {
        Write-Host "cd microservices/$($service.Name) && npm run dev" -ForegroundColor White
    }
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Start any unhealthy services manually" -ForegroundColor Gray
Write-Host "2. Test API endpoints with Postman or curl" -ForegroundColor Gray
Write-Host "3. Verify database connections" -ForegroundColor Gray
Write-Host "4. Test authentication flow" -ForegroundColor Gray

Write-Host "`n🔗 Health Check URLs:" -ForegroundColor Cyan
foreach ($service in $coreServices) {
    Write-Host "http://localhost:$($service.Port)/health  # $($service.Name)" -ForegroundColor White
}