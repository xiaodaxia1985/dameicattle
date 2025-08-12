# Test login functionality

Write-Host "Testing login functionality..." -ForegroundColor Cyan

# Test data
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

Write-Host "Login data: $loginData" -ForegroundColor Gray

try {
    # Test direct auth service
    Write-Host "Testing auth-service directly..." -ForegroundColor Yellow
    $authResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    Write-Host "Auth service response:" -ForegroundColor Green
    $authResponse | ConvertTo-Json -Depth 3
    
    $token = $authResponse.data.token
    Write-Host "Token received: $token" -ForegroundColor Green
    
    # Test via API Gateway
    Write-Host "`nTesting via API Gateway..." -ForegroundColor Yellow
    $gatewayResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    Write-Host "Gateway response:" -ForegroundColor Green
    $gatewayResponse | ConvertTo-Json -Depth 3
    
    # Test protected endpoint with token
    Write-Host "`nTesting protected endpoint..." -ForegroundColor Yellow
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $profileResponse = Invoke-RestMethod -Uri "http://localhost:3004/api/v1/health/records" -Method Get -Headers $headers
    Write-Host "Protected endpoint response:" -ForegroundColor Green
    $profileResponse | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}