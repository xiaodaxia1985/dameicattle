# Test authentication flow

Write-Host "Testing authentication flow..." -ForegroundColor Green

# Test login endpoint
Write-Host "`nTesting login endpoint..." -ForegroundColor Yellow

$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/login" -Method Post -Body $loginData -ContentType "application/json" -TimeoutSec 10
    
    if ($response.success -eq $true) {
        Write-Host "  Login: SUCCESS" -ForegroundColor Green
        Write-Host "  User: $($response.data.user.username)" -ForegroundColor Gray
        Write-Host "  Token received: $($response.data.token -ne $null)" -ForegroundColor Gray
        
        # Store token for further tests
        $token = $response.data.token
        $headers = @{ "Authorization" = "Bearer $token" }
        
        # Test profile endpoint
        Write-Host "`nTesting profile endpoint..." -ForegroundColor Yellow
        try {
            $profileResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/profile" -Method Get -Headers $headers -TimeoutSec 10
            
            if ($profileResponse.success -eq $true) {
                Write-Host "  Profile: SUCCESS" -ForegroundColor Green
                Write-Host "  Username: $($profileResponse.data.username)" -ForegroundColor Gray
                Write-Host "  Real name: $($profileResponse.data.real_name)" -ForegroundColor Gray
            } else {
                Write-Host "  Profile: FAILED - $($profileResponse.message)" -ForegroundColor Red
            }
        } catch {
            Write-Host "  Profile: ERROR - $($_.Exception.Message)" -ForegroundColor Red
        }
        
    } else {
        Write-Host "  Login: FAILED - $($response.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "  Login: ERROR - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  This might be expected if no admin user exists yet" -ForegroundColor Yellow
}

Write-Host "`nAuthentication flow test completed!" -ForegroundColor Green