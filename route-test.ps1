# Route Validation Test Script
# Test all microservices routes and API Gateway proxy

Write-Host "========================================" -ForegroundColor Green
Write-Host "      Route Fix Validation Test" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Test configuration
$baseUrl = "http://localhost"
$timeout = 5

# 1. Direct microservice health check
$microservices = @(
    @{ Name = "API Gateway"; Port = 3000; Path = "/health" },
    @{ Name = "Auth Service"; Port = 3001; Path = "/health" },
    @{ Name = "Base Service"; Port = 3002; Path = "/health" },
    @{ Name = "Cattle Service"; Port = 3003; Path = "/health" },
    @{ Name = "Health Service"; Port = 3004; Path = "/health" },
    @{ Name = "Feeding Service"; Port = 3005; Path = "/health" },
    @{ Name = "Equipment Service"; Port = 3006; Path = "/health" },
    @{ Name = "Procurement Service"; Port = 3007; Path = "/health" },
    @{ Name = "Sales Service"; Port = 3008; Path = "/health" },
    @{ Name = "Material Service"; Port = 3009; Path = "/health" },
    @{ Name = "Notification Service"; Port = 3010; Path = "/health" },
    @{ Name = "File Service"; Port = 3011; Path = "/health" },
    @{ Name = "Monitoring Service"; Port = 3012; Path = "/health" },
    @{ Name = "News Service"; Port = 3013; Path = "/health" }
)

Write-Host "1. Direct Microservice Health Check" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
$directSuccess = 0
$directTotal = $microservices.Count

foreach ($service in $microservices) {
    try {
        $url = "$baseUrl`:$($service.Port)$($service.Path)"
        $response = Invoke-RestMethod -Uri $url -Method Get -TimeoutSec $timeout -ErrorAction Stop
        if ($response.status -eq "healthy" -or $response.data.status -eq "healthy") {
            Write-Host "[OK] $($service.Name) ($url)" -ForegroundColor Green
            $directSuccess++
        } else {
            Write-Host "[WARN] $($service.Name) ($url) - Status: $($response.status)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "[FAIL] $($service.Name) ($url) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Direct Access Result: $directSuccess/$directTotal services healthy" -ForegroundColor $(if($directSuccess -eq $directTotal) {"Green"} elseif($directSuccess -gt 0) {"Yellow"} else {"Red"})
Write-Host ""

# 2. API Gateway proxy test
$gatewayRoutes = @(
    @{ Name = "Auth Proxy"; Url = "$baseUrl`:3000/api/v1/auth/health" },
    @{ Name = "Base Proxy"; Url = "$baseUrl`:3000/api/v1/base/health" },
    @{ Name = "Cattle Proxy"; Url = "$baseUrl`:3000/api/v1/cattle/health" },
    @{ Name = "Health Proxy"; Url = "$baseUrl`:3000/api/v1/health-service/health" },
    @{ Name = "Feeding Proxy"; Url = "$baseUrl`:3000/api/v1/feeding/health" },
    @{ Name = "Equipment Proxy"; Url = "$baseUrl`:3000/api/v1/equipment/health" },
    @{ Name = "Procurement Proxy"; Url = "$baseUrl`:3000/api/v1/procurement/health" },
    @{ Name = "Sales Proxy"; Url = "$baseUrl`:3000/api/v1/sales/health" },
    @{ Name = "Material Proxy"; Url = "$baseUrl`:3000/api/v1/material/health" },
    @{ Name = "Notification Proxy"; Url = "$baseUrl`:3000/api/v1/notification/health" },
    @{ Name = "File Proxy"; Url = "$baseUrl`:3000/api/v1/file/health" },
    @{ Name = "Monitoring Proxy"; Url = "$baseUrl`:3000/api/v1/monitoring/health" },
    @{ Name = "News Proxy"; Url = "$baseUrl`:3000/api/v1/news/health" }
)

Write-Host "2. API Gateway Route Proxy Test" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow
$gatewaySuccess = 0
$gatewayTotal = $gatewayRoutes.Count

foreach ($route in $gatewayRoutes) {
    try {
        $response = Invoke-RestMethod -Uri $route.Url -Method Get -TimeoutSec $timeout -ErrorAction Stop
        if ($response.status -eq "healthy" -or $response.data.status -eq "healthy") {
            Write-Host "[OK] $($route.Name) ($($route.Url))" -ForegroundColor Green
            $gatewaySuccess++
        } else {
            Write-Host "[WARN] $($route.Name) ($($route.Url)) - Status: $($response.status)" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "[FAIL] $($route.Name) ($($route.Url)) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Gateway Proxy Result: $gatewaySuccess/$gatewayTotal routes working" -ForegroundColor $(if($gatewaySuccess -eq $gatewayTotal) {"Green"} elseif($gatewaySuccess -gt 0) {"Yellow"} else {"Red"})
Write-Host ""

# 3. Business API endpoints test
Write-Host "3. Key Business API Endpoints Test" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

$businessApis = @(
    @{ Name = "Base List"; Url = "$baseUrl`:3000/api/v1/base/bases"; Method = "GET" },
    @{ Name = "Barn List"; Url = "$baseUrl`:3000/api/v1/base/barns"; Method = "GET" },
    @{ Name = "Cattle List"; Url = "$baseUrl`:3000/api/v1/cattle/cattle"; Method = "GET" },
    @{ Name = "Health Records"; Url = "$baseUrl`:3000/api/v1/health-service/records"; Method = "GET" },
    @{ Name = "Feeding Records"; Url = "$baseUrl`:3000/api/v1/feeding/records"; Method = "GET" },
    @{ Name = "Equipment List"; Url = "$baseUrl`:3000/api/v1/equipment/equipment"; Method = "GET" },
    @{ Name = "Procurement Orders"; Url = "$baseUrl`:3000/api/v1/procurement/orders"; Method = "GET" },
    @{ Name = "Sales Orders"; Url = "$baseUrl`:3000/api/v1/sales/orders"; Method = "GET" },
    @{ Name = "Material List"; Url = "$baseUrl`:3000/api/v1/material/materials"; Method = "GET" },
    @{ Name = "Notifications"; Url = "$baseUrl`:3000/api/v1/notification/notifications"; Method = "GET" },
    @{ Name = "News Articles"; Url = "$baseUrl`:3000/api/v1/news/articles"; Method = "GET" }
)

$apiSuccess = 0
$apiTotal = $businessApis.Count

foreach ($api in $businessApis) {
    try {
        $response = Invoke-RestMethod -Uri $api.Url -Method $api.Method -TimeoutSec $timeout -ErrorAction Stop
        if ($response -ne $null) {
            Write-Host "[OK] $($api.Name) ($($api.Url))" -ForegroundColor Green
            $apiSuccess++
        } else {
            Write-Host "[WARN] $($api.Name) ($($api.Url)) - Empty response" -ForegroundColor Yellow
        }
    }
    catch {
        if ($_.Exception.Message -match "401|403") {
            Write-Host "[WARN] $($api.Name) ($($api.Url)) - Auth required (normal)" -ForegroundColor Yellow
            $apiSuccess++
        } elseif ($_.Exception.Message -match "404") {
            Write-Host "[FAIL] $($api.Name) ($($api.Url)) - Route not found" -ForegroundColor Red
        } else {
            Write-Host "[FAIL] $($api.Name) ($($api.Url)) - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Business API Result: $apiSuccess/$apiTotal endpoints accessible" -ForegroundColor $(if($apiSuccess -eq $apiTotal) {"Green"} elseif($apiSuccess -gt 0) {"Yellow"} else {"Red"})
Write-Host ""

# 4. Test summary
Write-Host "========================================" -ForegroundColor Green
Write-Host "           Test Results Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$totalTests = $directTotal + $gatewayTotal + $apiTotal
$totalSuccess = $directSuccess + $gatewaySuccess + $apiSuccess
$successRate = [math]::Round(($totalSuccess / $totalTests) * 100, 2)

Write-Host "Overall Test Results:" -ForegroundColor White
Write-Host "  - Direct Microservice Access: $directSuccess/$directTotal" -ForegroundColor White
Write-Host "  - Gateway Route Proxy: $gatewaySuccess/$gatewayTotal" -ForegroundColor White
Write-Host "  - Business API Endpoints: $apiSuccess/$apiTotal" -ForegroundColor White
Write-Host "  - Overall Success Rate: $successRate% ($totalSuccess/$totalTests)" -ForegroundColor White
Write-Host ""

if ($successRate -ge 90) {
    Write-Host "Excellent! Route fix is working perfectly." -ForegroundColor Green
} elseif ($successRate -ge 70) {
    Write-Host "Good! Route fix is mostly successful, but some issues need attention." -ForegroundColor Yellow
} else {
    Write-Host "Poor! Route fix needs further investigation." -ForegroundColor Red
}

Write-Host ""
Write-Host "Recommendations:" -ForegroundColor Cyan
if ($directSuccess -lt $directTotal) {
    Write-Host "1. Check and restart failed microservices" -ForegroundColor White
}
if ($gatewaySuccess -lt $gatewayTotal) {
    Write-Host "2. Verify API Gateway route configuration and proxy settings" -ForegroundColor White
}
if ($apiSuccess -lt $apiTotal) {
    Write-Host "3. Check business API route matching and permission settings" -ForegroundColor White
}

Write-Host ""
Write-Host "Test completed at: $(Get-Date)" -ForegroundColor Gray