# Test all microservices with authentication

Write-Host "Testing all microservices with authentication..." -ForegroundColor Cyan

# Login first
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    Write-Host "1. Getting authentication token..." -ForegroundColor Yellow
    $authResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/login" -Method Post -Body $loginData -ContentType "application/json"
    $token = $authResponse.data.token
    Write-Host "✅ Token obtained successfully" -ForegroundColor Green
    
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Test services
    $services = @(
        @{ Name = "Health Service"; Url = "http://localhost:3004/api/v1/health/records" },
        @{ Name = "Feeding Service"; Url = "http://localhost:3005/api/v1/feeding/records" },
        @{ Name = "Sales Service"; Url = "http://localhost:3008/api/v1/sales/orders" },
        @{ Name = "Procurement Service"; Url = "http://localhost:3007/api/v1/procurement/orders" },
        @{ Name = "Material Service"; Url = "http://localhost:3009/api/v1/material/items" },
        @{ Name = "Equipment Service"; Url = "http://localhost:3006/api/v1/equipment/items" }
    )
    
    Write-Host "`n2. Testing protected endpoints..." -ForegroundColor Yellow
    
    foreach ($service in $services) {
        try {
            Write-Host "Testing $($service.Name)..." -ForegroundColor Gray
            $response = Invoke-RestMethod -Uri $service.Url -Method Get -Headers $headers -TimeoutSec 5
            Write-Host "✅ $($service.Name) - Authentication successful" -ForegroundColor Green
        } catch {
            if ($_.Exception.Response.StatusCode -eq 401) {
                Write-Host "❌ $($service.Name) - Authentication failed (401)" -ForegroundColor Red
            } elseif ($_.Exception.Response.StatusCode -eq 404) {
                Write-Host "⚠️  $($service.Name) - Endpoint not found (404)" -ForegroundColor Yellow
            } else {
                Write-Host "⚠️  $($service.Name) - Error: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host "`n3. Testing API Gateway routes..." -ForegroundColor Yellow
    
    $gatewayServices = @(
        @{ Name = "Auth via Gateway"; Url = "http://localhost:3000/api/v1/auth/profile" },
        @{ Name = "Base Service via Gateway"; Url = "http://localhost:3000/api/v1/base/bases" },
        @{ Name = "Cattle Service via Gateway"; Url = "http://localhost:3000/api/v1/cattle/cattle" }
    )
    
    foreach ($service in $gatewayServices) {
        try {
            Write-Host "Testing $($service.Name)..." -ForegroundColor Gray
            $response = Invoke-RestMethod -Uri $service.Url -Method Get -Headers $headers -TimeoutSec 5
            Write-Host "✅ $($service.Name) - Gateway routing successful" -ForegroundColor Green
        } catch {
            if ($_.Exception.Response.StatusCode -eq 401) {
                Write-Host "❌ $($service.Name) - Authentication failed (401)" -ForegroundColor Red
            } elseif ($_.Exception.Response.StatusCode -eq 404) {
                Write-Host "⚠️  $($service.Name) - Route not found (404)" -ForegroundColor Yellow
            } else {
                Write-Host "⚠️  $($service.Name) - Error: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
    
} catch {
    Write-Host "❌ Failed to get authentication token: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Authentication testing completed!" -ForegroundColor Cyan