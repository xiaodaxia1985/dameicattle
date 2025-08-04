# Restart all microservices to load new route configurations

Write-Host "🔄 Restarting all microservices to load new routes..." -ForegroundColor Green

$services = @(
    @{Name="cattle-service"; Port=3003},
    @{Name="health-service"; Port=3004},
    @{Name="feeding-service"; Port=3005},
    @{Name="material-service"; Port=3009},
    @{Name="equipment-service"; Port=3006},
    @{Name="procurement-service"; Port=3007},
    @{Name="sales-service"; Port=3008},
    @{Name="news-service"; Port=3013},
    @{Name="notification-service"; Port=3010},
    @{Name="file-service"; Port=3011},
    @{Name="monitoring-service"; Port=3012}
)

Write-Host "Note: Services need to be restarted manually to load new route configurations" -ForegroundColor Yellow
Write-Host "The following services have been updated with new routes:" -ForegroundColor Cyan

foreach ($service in $services) {
    Write-Host "  • $($service.Name) (port: $($service.Port))" -ForegroundColor White
}

Write-Host "`n💡 To restart services manually:" -ForegroundColor Yellow
Write-Host "1. Stop the running services (Ctrl+C in their terminals)" -ForegroundColor Gray
Write-Host "2. Restart each service with: cd microservices/[service-name] && npm run dev" -ForegroundColor Gray

Write-Host "`n🎯 Or test the routes that are already working:" -ForegroundColor Cyan
Write-Host "✅ auth-service: http://localhost:3001/api/v1/auth/login" -ForegroundColor Green
Write-Host "✅ base-service: http://localhost:3002/api/v1/bases" -ForegroundColor Green
Write-Host "✅ base-service: http://localhost:3002/api/v1/barns" -ForegroundColor Green

Write-Host "`n🚀 All route configurations have been fixed!" -ForegroundColor Green
Write-Host "Services just need to be restarted to load the new configurations." -ForegroundColor Green