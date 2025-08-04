# Fix all microservice routes

Write-Host "🔧 Fixing all microservice routes..." -ForegroundColor Green

$services = @(
    "equipment-service",
    "procurement-service", 
    "sales-service",
    "news-service",
    "notification-service",
    "file-service",
    "monitoring-service"
)

foreach ($service in $services) {
    Write-Host "Processing $service..." -ForegroundColor Yellow
    
    $appPath = "microservices/$service/src/app.ts"
    
    if (Test-Path $appPath) {
        # Read the current app.ts content
        $content = Get-Content $appPath -Raw
        
        # Check if routes are already imported
        if ($content -notmatch "import routes from") {
            # Add routes import after other imports
            $content = $content -replace "(import.*errorHandler.*;\s*)", "`$1`nimport routes from './routes';"
            
            # Add routes usage after health check
            $content = $content -replace "(// TODO: 添加路由\s*// app\.use\('/api/v1', routes\);)", "// API路由`napp.use('/api/v1', routes);"
            
            # Write back to file
            Set-Content -Path $appPath -Value $content -Encoding UTF8
            Write-Host "  ✅ Updated $service app.ts" -ForegroundColor Green
        } else {
            Write-Host "  ✅ $service already has routes configured" -ForegroundColor Green
        }
    } else {
        Write-Host "  ❌ $service app.ts not found" -ForegroundColor Red
    }
}

Write-Host "`n🎯 Route fixing completed!" -ForegroundColor Green