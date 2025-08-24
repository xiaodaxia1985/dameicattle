# Clean and rebuild all microservices

Write-Host "Cleaning and rebuilding all microservices..." -ForegroundColor Green

# List of all microservices
$services = @(
    "api-gateway",
    "auth-service", 
    "base-service",
    "cattle-service",
    "health-service",
    "feeding-service",
    "equipment-service",
    "procurement-service",
    "sales-service",
    "material-service",
    "notification-service",
    "file-service",
    "monitoring-service",
    "news-service"
)

foreach ($service in $services) {
    Write-Host ""
    Write-Host "Processing $service..." -ForegroundColor Yellow
    
    if (Test-Path $service) {
        Push-Location $service
        
        # Clean dist directory
        if (Test-Path "dist") {
            Write-Host "  Cleaning dist directory..." -ForegroundColor Cyan
            Remove-Item -Recurse -Force "dist"
        }
        
        # Install/update dependencies
        Write-Host "  Installing dependencies..." -ForegroundColor Cyan
        npm install --silent
        
        # Build the service
        Write-Host "  Building $service..." -ForegroundColor Cyan
        npm run build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ $service built successfully" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $service build failed" -ForegroundColor Red
        }
        
        Pop-Location
    } else {
        Write-Host "  ✗ $service directory not found" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Rebuild completed!" -ForegroundColor Green
Write-Host "You can now start the services with: .\start-services-npm.ps1" -ForegroundColor Cyan