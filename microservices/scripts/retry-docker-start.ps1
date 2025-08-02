# Retry Docker startup after configuring registry mirrors

Write-Host "Retrying Docker startup with registry mirrors..." -ForegroundColor Green

# Wait for Docker to be ready
Write-Host "Waiting for Docker to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test registry connectivity
Write-Host "Testing registry connectivity..." -ForegroundColor Yellow
$testResult = docker pull hello-world 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Registry connectivity OK" -ForegroundColor Green
    
    # Now try to pull Node.js image
    Write-Host "Pulling Node.js image..." -ForegroundColor Yellow
    docker pull node:18-alpine
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js image pulled successfully!" -ForegroundColor Green
        
        # Start the microservices
        Write-Host "Starting microservices..." -ForegroundColor Yellow
        .\scripts\start-docker-with-local-db.ps1
    } else {
        Write-Host "❌ Still unable to pull Node.js image" -ForegroundColor Red
        Write-Host "Please check your network connection or try using a VPN" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Registry connectivity failed" -ForegroundColor Red
    Write-Host "Please check Docker registry mirror configuration" -ForegroundColor Yellow
}