# Complete remaining microservices script

Write-Host "Completing remaining microservices..." -ForegroundColor Green

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
    
    # Create basic controller
    $controllerPath = "microservices/$service/src/controllers"
    if (!(Test-Path $controllerPath)) {
        New-Item -ItemType Directory -Path $controllerPath -Force
    }
    
    # Create basic model
    $modelPath = "microservices/$service/src/models"
    if (!(Test-Path $modelPath)) {
        New-Item -ItemType Directory -Path $modelPath -Force
    }
    
    # Create basic route
    $routePath = "microservices/$service/src/routes"
    if (!(Test-Path $routePath)) {
        New-Item -ItemType Directory -Path $routePath -Force
    }
    
    Write-Host "  Created directories for $service" -ForegroundColor Green
}

Write-Host "All remaining microservices structure created!" -ForegroundColor Green