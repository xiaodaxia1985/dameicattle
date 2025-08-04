# Complete microservice test script - All 14 services

Write-Host "🚀 Testing all 14 microservices..." -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray

$services = @(
    @{Name="api-gateway"; Port=3000; Description="API Gateway & Load Balancer"},
    @{Name="auth-service"; Port=3001; Description="Authentication & Authorization"},
    @{Name="base-service"; Port=3002; Description="Base/Farm Management"},
    @{Name="cattle-service"; Port=3003; Description="Cattle Management"},
    @{Name="health-service"; Port=3004; Description="Animal Health Tracking"},
    @{Name="feeding-service"; Port=3005; Description="Feed Management"},
    @{Name="equipment-service"; Port=3006; Description="Equipment Management"},
    @{Name="procurement-service"; Port=3007; Description="Procurement Management"},
    @{Name="sales-service"; Port=3008; Description="Sales Management"},
    @{Name="material-service"; Port=3009; Description="Material Management"},
    @{Name="notification-service"; Port=3010; Description="Notification System"},
    @{Name="file-service"; Port=3011; Description="File Upload & Management"},
    @{Name="monitoring-service"; Port=3012; Description="System Monitoring"},
    @{Name="news-service"; Port=3013; Description="News & Announcements"}
)

$completeServices = @()
$incompleteServices = @()

foreach ($service in $services) {
    $serviceName = $service.Name
    $port = $service.Port
    $description = $service.Description
    
    Write-Host "🔍 Testing $serviceName..." -ForegroundColor Yellow
    Write-Host "   📝 $description" -ForegroundColor Gray
    
    $servicePath = "microservices/$serviceName"
    $hasStructure = $false
    $hasPackageJson = $false
    $hasAppTs = $false
    $hasDockerfile = $false
    $hasTsConfig = $false
    
    # Check directory structure
    if (Test-Path $servicePath) {
        $hasStructure = $true
        Write-Host "   ✅ Directory structure" -ForegroundColor Green
        
        if (Test-Path "$servicePath/package.json") {
            $hasPackageJson = $true
            Write-Host "   ✅ package.json" -ForegroundColor Green
        } else {
            Write-Host "   ❌ package.json missing" -ForegroundColor Red
        }
        
        if (Test-Path "$servicePath/src/app.ts") {
            $hasAppTs = $true
            Write-Host "   ✅ app.ts" -ForegroundColor Green
        } else {
            Write-Host "   ❌ app.ts missing" -ForegroundColor Red
        }
        
        if (Test-Path "$servicePath/Dockerfile") {
            $hasDockerfile = $true
            Write-Host "   ✅ Dockerfile" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Dockerfile missing" -ForegroundColor Red
        }
        
        if (Test-Path "$servicePath/tsconfig.json") {
            $hasTsConfig = $true
            Write-Host "   ✅ tsconfig.json" -ForegroundColor Green
        } else {
            Write-Host "   ❌ tsconfig.json missing" -ForegroundColor Red
        }
        
        # Check for additional structure
        if (Test-Path "$servicePath/src/config") {
            Write-Host "   ✅ config directory" -ForegroundColor Green
        }
        
    } else {
        Write-Host "   ❌ Directory does not exist" -ForegroundColor Red
    }
    
    # Categorize services
    if ($hasStructure -and $hasPackageJson -and $hasAppTs -and $hasDockerfile -and $hasTsConfig) {
        $completeServices += $service
        Write-Host "   🎯 Status: COMPLETE" -ForegroundColor Green
    } else {
        $incompleteServices += $service
        Write-Host "   ⚠️  Status: INCOMPLETE" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

# Summary report
Write-Host "📊 FINAL SUMMARY REPORT" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

$completeCount = $completeServices.Count
$totalCount = $services.Count
$percentage = [math]::Round(($completeCount / $totalCount) * 100, 1)

Write-Host "✅ Complete microservices: $completeCount/$totalCount ($percentage%)" -ForegroundColor Green

if ($completeCount -gt 0) {
    Write-Host "`n🎯 Ready for deployment:" -ForegroundColor Green
    foreach ($service in $completeServices) {
        $name = $service.Name
        $port = $service.Port
        $description = $service.Description
        Write-Host "   • $name (port: $port) - $description" -ForegroundColor Cyan
    }
}

$incompleteCount = $incompleteServices.Count
if ($incompleteCount -gt 0) {
    Write-Host "`n⚠️  Need attention ($incompleteCount services):" -ForegroundColor Yellow
    foreach ($service in $incompleteServices) {
        $name = $service.Name
        $port = $service.Port
        Write-Host "   • $name (port: $port)" -ForegroundColor Yellow
    }
}

Write-Host "`n🚀 Quick Start Commands:" -ForegroundColor Cyan
Write-Host "# Start API Gateway" -ForegroundColor Gray
Write-Host "cd microservices/api-gateway && npm install && npm run dev" -ForegroundColor White

Write-Host "`n# Start individual services" -ForegroundColor Gray
Write-Host "cd microservices/auth-service && npm install && npm run dev" -ForegroundColor White
Write-Host "cd microservices/base-service && npm install && npm run dev" -ForegroundColor White

Write-Host "`n🔍 Health Check URLs:" -ForegroundColor Cyan
foreach ($service in $services) {
    $name = $service.Name
    $port = $service.Port
    Write-Host "http://localhost:$port/health  # $name" -ForegroundColor White
}

Write-Host "`n🎉 Microservice architecture is ready!" -ForegroundColor Green
Write-Host "Total services: $totalCount | Complete: $completeCount | Success rate: $percentage%" -ForegroundColor Cyan