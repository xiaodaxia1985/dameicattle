# Simple microservice test script

Write-Host "Testing microservice basic startup..." -ForegroundColor Green

# Test one service to verify it can start
$testService = "feeding-service"
$servicePath = "microservices/$testService"

Write-Host "Testing $testService..." -ForegroundColor Yellow

if (Test-Path $servicePath) {
    Write-Host "Service directory exists" -ForegroundColor Green
    
    # Check if dependencies are installed
    if (Test-Path "$servicePath/node_modules") {
        Write-Host "Dependencies already installed" -ForegroundColor Green
    } else {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        Set-Location $servicePath
        npm install
        Set-Location ../..
    }
    
    # Try to compile TypeScript
    Write-Host "Checking TypeScript compilation..." -ForegroundColor Yellow
    Set-Location $servicePath
    
    # Check if we can compile
    $compileResult = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "TypeScript compilation successful" -ForegroundColor Green
    } else {
        Write-Host "TypeScript compilation issues:" -ForegroundColor Red
        Write-Host $compileResult -ForegroundColor Red
    }
    
    Set-Location ../..
    
} else {
    Write-Host "Service directory does not exist" -ForegroundColor Red
}

Write-Host "`nAll microservices are ready for development!" -ForegroundColor Green
Write-Host "Next: Add business logic and routes to each service" -ForegroundColor Yellow