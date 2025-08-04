# Test microservice startup script

Write-Host "Testing all microservices..." -ForegroundColor Green

$services = @(
    @{Name="api-gateway"; Port=3000},
    @{Name="auth-service"; Port=3001},
    @{Name="base-service"; Port=3002},
    @{Name="cattle-service"; Port=3003},
    @{Name="health-service"; Port=3004},
    @{Name="feeding-service"; Port=3005},
    @{Name="equipment-service"; Port=3006},
    @{Name="procurement-service"; Port=3007},
    @{Name="sales-service"; Port=3008},
    @{Name="material-service"; Port=3009},
    @{Name="notification-service"; Port=3010},
    @{Name="file-service"; Port=3011},
    @{Name="monitoring-service"; Port=3012},
    @{Name="news-service"; Port=3013}
)

$completeServices = @()
$incompleteServices = @()

foreach ($service in $services) {
    $serviceName = $service.Name
    $port = $service.Port
    
    Write-Host "Checking $serviceName..." -ForegroundColor Yellow
    
    $servicePath = "microservices/$serviceName"
    $hasStructure = $false
    $hasPackageJson = $false
    $hasAppTs = $false
    $hasDockerfile = $false
    
    # Check directory structure
    if (Test-Path $servicePath) {
        $hasStructure = $true
        Write-Host "  Directory exists" -ForegroundColor Green
        
        if (Test-Path "$servicePath/package.json") {
            $hasPackageJson = $true
            Write-Host "  package.json exists" -ForegroundColor Green
        } else {
            Write-Host "  package.json missing" -ForegroundColor Red
        }
        
        if (Test-Path "$servicePath/src/app.ts") {
            $hasAppTs = $true
            Write-Host "  app.ts exists" -ForegroundColor Green
        } else {
            Write-Host "  app.ts missing" -ForegroundColor Red
        }
        
        if (Test-Path "$servicePath/Dockerfile") {
            $hasDockerfile = $true
            Write-Host "  Dockerfile exists" -ForegroundColor Green
        } else {
            Write-Host "  Dockerfile missing" -ForegroundColor Red
        }
    } else {
        Write-Host "  Directory does not exist" -ForegroundColor Red
    }
    
    # Categorize services
    if ($hasStructure -and $hasPackageJson -and $hasAppTs -and $hasDockerfile) {
        $completeServices += $service
    } else {
        $incompleteServices += $service
    }
    
    Write-Host ""
}

# Summary report
Write-Host "Summary Report:" -ForegroundColor Yellow

$completeCount = $completeServices.Count
Write-Host "Complete microservices ($completeCount):" -ForegroundColor Green
foreach ($service in $completeServices) {
    $name = $service.Name
    $port = $service.Port
    Write-Host "  - $name (port: $port)" -ForegroundColor Cyan
}

$incompleteCount = $incompleteServices.Count
if ($incompleteCount -gt 0) {
    Write-Host "Incomplete microservices ($incompleteCount):" -ForegroundColor Red
    foreach ($service in $incompleteServices) {
        $name = $service.Name
        $port = $service.Port
        Write-Host "  - $name (port: $port)" -ForegroundColor Yellow
    }
}

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Add business logic to each microservice" -ForegroundColor Gray
Write-Host "2. Copy corresponding Controller, Model, Route files from backend" -ForegroundColor Gray
Write-Host "3. Update API gateway configuration" -ForegroundColor Gray
Write-Host "4. Test each microservice startup" -ForegroundColor Gray

Write-Host "`nTest commands:" -ForegroundColor Yellow
Write-Host "cd microservices/auth-service; npm install; npm run dev" -ForegroundColor Cyan

Write-Host "`nHealth check URLs:" -ForegroundColor Yellow
foreach ($service in $services) {
    $name = $service.Name
    $port = $service.Port
    Write-Host "http://localhost:$port/health  # $name" -ForegroundColor Cyan
}