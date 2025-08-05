#!/usr/bin/env pwsh

Write-Host "=== Fixing microservices dependencies ===" -ForegroundColor Green

$originalPath = Get-Location
Set-Location "microservices"

$services = @(
    "api-gateway", "auth-service", "base-service", "cattle-service", 
    "health-service", "feeding-service", "equipment-service", 
    "procurement-service", "sales-service", "material-service", 
    "notification-service", "file-service", "monitoring-service", 
    "news-service"
)

$fixedServices = @()

foreach ($service in $services) {
    if (Test-Path "$service/package.json") {
        Write-Host "Processing $service..." -ForegroundColor Cyan
        
        $packageJson = Get-Content "$service/package.json" -Raw | ConvertFrom-Json
        $needsUpdate = $false
        
        if (-not $packageJson.dependencies) {
            $packageJson | Add-Member -MemberType NoteProperty -Name "dependencies" -Value @{}
        }
        
        $deps = @{
            "sequelize" = "^6.35.2"
            "pg" = "^8.11.3" 
            "winston" = "^3.11.0"
            "dotenv" = "^16.6.1"
        }
        
        foreach ($dep in $deps.GetEnumerator()) {
            if (-not $packageJson.dependencies.PSObject.Properties[$dep.Key]) {
                $packageJson.dependencies | Add-Member -MemberType NoteProperty -Name $dep.Key -Value $dep.Value -Force
                $needsUpdate = $true
                Write-Host "  + Adding $($dep.Key)" -ForegroundColor Yellow
            }
        }
        
        if ($needsUpdate) {
            $packageJson | ConvertTo-Json -Depth 10 | Set-Content "$service/package.json" -Encoding UTF8
            
            Write-Host "  Installing dependencies..." -ForegroundColor Yellow
            Set-Location $service
            npm install 2>$null
            Set-Location ".."
            
            $fixedServices += $service
            Write-Host "  Fixed $service" -ForegroundColor Green
        } else {
            Write-Host "  $service already up to date" -ForegroundColor Green
        }
    }
}

Set-Location $originalPath

Write-Host "`nResults:" -ForegroundColor Green
Write-Host "Fixed services: $($fixedServices.Count)" -ForegroundColor Green

if ($fixedServices.Count -gt 0) {
    Write-Host "`nFixed services:" -ForegroundColor Green
    $fixedServices | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
}

Write-Host "`nDependency fix complete!" -ForegroundColor Green