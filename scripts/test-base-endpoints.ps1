# Test base service endpoints

Write-Host "Testing base service endpoints..." -ForegroundColor Green

# Test get bases endpoint (without authentication first)
Write-Host "`nTesting GET /api/v1/bases endpoint..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/bases" -Method Get -TimeoutSec 10
    
    if ($response.success -eq $true) {
        Write-Host "  Bases endpoint: SUCCESS" -ForegroundColor Green
        Write-Host "  Response format: Valid" -ForegroundColor Gray
        Write-Host "  Data type: $($response.data.GetType().Name)" -ForegroundColor Gray
    } else {
        Write-Host "  Bases endpoint: FAILED - $($response.message)" -ForegroundColor Red
    }
} catch {
    $errorMessage = $_.Exception.Message
    if ($errorMessage -like "*401*" -or $errorMessage -like "*未经授权*") {
        Write-Host "  Bases endpoint: REQUIRES AUTHENTICATION (Expected)" -ForegroundColor Yellow
    } else {
        Write-Host "  Bases endpoint: ERROR - $errorMessage" -ForegroundColor Red
    }
}

# Test get all bases endpoint
Write-Host "`nTesting GET /api/v1/bases/all endpoint..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/v1/bases/all" -Method Get -TimeoutSec 10
    
    if ($response.success -eq $true) {
        Write-Host "  All bases endpoint: SUCCESS" -ForegroundColor Green
        Write-Host "  Response format: Valid" -ForegroundColor Gray
    } else {
        Write-Host "  All bases endpoint: FAILED - $($response.message)" -ForegroundColor Red
    }
} catch {
    $errorMessage = $_.Exception.Message
    if ($errorMessage -like "*401*" -or $errorMessage -like "*未经授权*") {
        Write-Host "  All bases endpoint: REQUIRES AUTHENTICATION (Expected)" -ForegroundColor Yellow
    } else {
        Write-Host "  All bases endpoint: ERROR - $errorMessage" -ForegroundColor Red
    }
}

Write-Host "`nBase service endpoint test completed!" -ForegroundColor Green
Write-Host "Note: Authentication required for most endpoints" -ForegroundColor Yellow