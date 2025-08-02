# Fix TypeScript errors in all microservices

Write-Host "Fixing TypeScript errors in all microservices..." -ForegroundColor Green

$services = @(
    "health-service", "feeding-service", "equipment-service", 
    "procurement-service", "sales-service", "material-service",
    "notification-service", "file-service", "monitoring-service"
)

foreach ($service in $services) {
    $appFile = "$service/src/app.ts"
    
    if (Test-Path $appFile) {
        Write-Host "Checking $service..." -ForegroundColor Yellow
        
        $content = Get-Content $appFile -Raw
        
        # Check if the file contains the problematic pattern
        if ($content -match "error\.message") {
            Write-Host "Fixing TypeScript error in $service..." -ForegroundColor Gray
            
            # Replace the problematic error handling
            $content = $content -replace "error\.message", "error instanceof Error ? error.message : String(error)"
            
            # Write back to file
            $content | Set-Content $appFile -Encoding UTF8
            
            Write-Host "✅ Fixed $service" -ForegroundColor Green
        } else {
            Write-Host "✅ $service is OK" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️ $appFile not found" -ForegroundColor Yellow
    }
}

Write-Host "TypeScript error fixes completed!" -ForegroundColor Green