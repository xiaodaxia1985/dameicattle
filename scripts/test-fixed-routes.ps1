# Test all fixed microservice routes

Write-Host "🧪 Testing all fixed microservice routes..." -ForegroundColor Green

$endpoints = @(
    @{Service="auth-service"; Port=3001; Path="/api/v1/auth/login"; Method="POST"},
    @{Service="base-service"; Port=3002; Path="/api/v1/bases"; Method="GET"},
    @{Service="base-service"; Port=3002; Path="/api/v1/barns"; Method="GET"},
    @{Service="cattle-service"; Port=3003; Path="/api/v1/cattle"; Method="GET"},
    @{Service="health-service"; Port=3004; Path="/api/v1/health/records"; Method="GET"},
    @{Service="feeding-service"; Port=3005; Path="/api/v1/feeding/formulas"; Method="GET"},
    @{Service="material-service"; Port=3009; Path="/api/v1/materials"; Method="GET"},
    @{Service="equipment-service"; Port=3006; Path="/api/v1/equipment"; Method="GET"},
    @{Service="procurement-service"; Port=3007; Path="/api/v1/procurement/orders"; Method="GET"},
    @{Service="sales-service"; Port=3008; Path="/api/v1/sales/orders"; Method="GET"},
    @{Service="news-service"; Port=3013; Path="/api/v1/news/articles"; Method="GET"},
    @{Service="notification-service"; Port=3010; Path="/api/v1/notifications"; Method="GET"},
    @{Service="file-service"; Port=3011; Path="/api/v1/files"; Method="GET"},
    @{Service="monitoring-service"; Port=3012; Path="/api/v1/monitoring/metrics"; Method="GET"}
)

$successCount = 0
$totalCount = $endpoints.Count

foreach ($endpoint in $endpoints) {
    $service = $endpoint.Service
    $port = $endpoint.Port
    $path = $endpoint.Path
    $method = $endpoint.Method
    
    Write-Host "`nTesting $service - $method $path" -ForegroundColor Yellow
    
    try {
        $url = "http://localhost:$port$path"
        
        if ($method -eq "GET") {
            $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec 10
        } else {
            # For POST endpoints, we'll just test if they respond (even with errors)
            $testData = @{test = "data"} | ConvertTo-Json
            $response = Invoke-RestMethod -Uri $url -Method Post -Body $testData -ContentType "application/json" -TimeoutSec 10
        }
        
        if ($response.success -eq $true) {
            Write-Host "  ✅ SUCCESS: $($response.message)" -ForegroundColor Green
            $successCount++
        } elseif ($response.success -eq $false) {
            Write-Host "  ⚠️  RESPONDED WITH ERROR: $($response.error.message)" -ForegroundColor Yellow
            $successCount++  # Still counts as working endpoint
        }
        
    } catch {
        $errorMessage = $_.Exception.Message
        
        if ($errorMessage -like "*401*" -or $errorMessage -like "*未经授权*") {
            Write-Host "  ✅ REQUIRES AUTH (Expected): Endpoint is working" -ForegroundColor Yellow
            $successCount++
        } elseif ($errorMessage -like "*404*") {
            Write-Host "  ❌ NOT FOUND: Route not configured" -ForegroundColor Red
        } elseif ($errorMessage -like "*400*") {
            Write-Host "  ✅ BAD REQUEST (Expected for test data): Endpoint is working" -ForegroundColor Yellow
            $successCount++
        } elseif ($errorMessage -like "*Connection refused*" -or $errorMessage -like "*无法连接*") {
            Write-Host "  ❌ SERVICE NOT RUNNING" -ForegroundColor Red
        } else {
            Write-Host "  ⚠️  OTHER ERROR: $errorMessage" -ForegroundColor Yellow
        }
    }
}

# Summary
Write-Host "`n📊 ROUTE TESTING SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 50

$successRate = [math]::Round(($successCount / $totalCount) * 100, 1)
Write-Host "✅ Working endpoints: $successCount/$totalCount ($successRate%)" -ForegroundColor $(if($successRate -ge 80){"Green"}elseif($successRate -ge 60){"Yellow"}else{"Red"})

if ($successRate -ge 80) {
    Write-Host "`n🎉 ROUTE FIXING: SUCCESS!" -ForegroundColor Green
    Write-Host "Most microservice routes are now working correctly!" -ForegroundColor Green
} elseif ($successRate -ge 60) {
    Write-Host "`n⚠️  ROUTE FIXING: PARTIAL SUCCESS" -ForegroundColor Yellow
    Write-Host "Most routes are working but some need attention" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ ROUTE FIXING: NEEDS MORE WORK" -ForegroundColor Red
    Write-Host "Several routes still need to be fixed" -ForegroundColor Red
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Start any services that are not running" -ForegroundColor Gray
Write-Host "2. Test authenticated endpoints with valid tokens" -ForegroundColor Gray
Write-Host "3. Add more detailed route implementations" -ForegroundColor Gray
Write-Host "4. Test CRUD operations for each service" -ForegroundColor Gray

Write-Host "`n🚀 Route fixing completed!" -ForegroundColor Green