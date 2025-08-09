# Start microservices using npm directly (no Docker)

Write-Host "Starting microservices using npm..." -ForegroundColor Green

# Check Node.js
try {
    node --version | Out-Null
    Write-Host "Node.js is running" -ForegroundColor Green
} catch {
    Write-Host "Please install Node.js first" -ForegroundColor Red
    exit 1
}

# Remind user to start local database and Redis
Write-Host ""
Write-Host "Note: Please ensure the following services are running locally:" -ForegroundColor Yellow
Write-Host "- PostgreSQL (port: 5432)" -ForegroundColor Cyan
Write-Host "- Redis (port: 6379)" -ForegroundColor Cyan
Write-Host ""

# Create logs directory if it doesn't exist
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# Start auth service
Write-Host "Starting auth service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'auth-service'; npm start > ../logs/auth-service.log 2>&1" -WindowStyle Hidden

Start-Sleep -Seconds 3

# Start base service
Write-Host "Starting base service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'base-service'; npm start > ../logs/base-service.log 2>&1" -WindowStyle Hidden

Start-Sleep -Seconds 2

# Start cattle service
Write-Host "Starting cattle service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'cattle-service'; npm start > ../logs/cattle-service.log 2>&1" -WindowStyle Hidden

Start-Sleep -Seconds 2

# Start health service
Write-Host "Starting health service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'health-service'; npm start > ../logs/health-service.log 2>&1" -WindowStyle Hidden

Start-Sleep -Seconds 2

# Start feeding service
Write-Host "Starting feeding service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'feeding-service'; npm start > ../logs/feeding-service.log 2>&1" -WindowStyle Hidden

Start-Sleep -Seconds 2

# Start equipment service
Write-Host "Starting equipment service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'equipment-service'; npm start > ../logs/equipment-service.log 2>&1" -WindowStyle Hidden

Start-Sleep -Seconds 1

# Start procurement service
Write-Host "Starting procurement service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'procurement-service'; npm start > ../logs/procurement-service.log 2>&1" -WindowStyle Hidden

Start-Sleep -Seconds 1

# Start sales service
Write-Host "Starting sales service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'sales-service'; npm start > ../logs/sales-service.log 2>&1" -WindowStyle Hidden

Start-Sleep -Seconds 1

# Start material service
Write-Host "Starting material service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'material-service'; npm start > ../logs/material-service.log 2>&1" -WindowStyle Hidden

Start-Sleep -Seconds 1

# Start notification service
Write-Host "Starting notification service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'notification-service'; npm start > ../logs/notification-service.log 2>&1" -WindowStyle Hidden

Start-Sleep -Seconds 1

# Start file service
Write-Host "Starting file service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'file-service'; npm start > ../logs/file-service.log 2>&1" -WindowStyle Hidden

Start-Sleep -Seconds 1

# Start monitoring service
Write-Host "Starting monitoring service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'monitoring-service'; npm start > ../logs/monitoring-service.log 2>&1" -WindowStyle Hidden

Start-Sleep -Seconds 1

# Start news service
Write-Host "Starting news service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'news-service'; npm start > ../logs/news-service.log 2>&1" -WindowStyle Hidden

Start-Sleep -Seconds 2

# Start API gateway
Write-Host "Starting API gateway..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd 'api-gateway'; npm start > ../logs/api-gateway.log 2>&1" -WindowStyle Hidden

Write-Host ""
Write-Host "All 13 microservices started in background!" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor White
Write-Host "API Gateway: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Auth Service: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Base Service: http://localhost:3002" -ForegroundColor Cyan
Write-Host "Cattle Service: http://localhost:3003" -ForegroundColor Cyan
Write-Host "Health Service: http://localhost:3004" -ForegroundColor Cyan
Write-Host "Feeding Service: http://localhost:3005" -ForegroundColor Cyan
Write-Host "Equipment Service: http://localhost:3006" -ForegroundColor Cyan
Write-Host "Procurement Service: http://localhost:3007" -ForegroundColor Cyan
Write-Host "Sales Service: http://localhost:3008" -ForegroundColor Cyan
Write-Host "Material Service: http://localhost:3009" -ForegroundColor Cyan
Write-Host "Notification Service: http://localhost:3010" -ForegroundColor Cyan
Write-Host "File Service: http://localhost:3011" -ForegroundColor Cyan
Write-Host "Monitoring Service: http://localhost:3012" -ForegroundColor Cyan
Write-Host "News Service: http://localhost:3013" -ForegroundColor Cyan
Write-Host ""
Write-Host "Logs are saved in the 'logs' directory:" -ForegroundColor Yellow
Write-Host "- To view all logs: Get-ChildItem logs/*.log" -ForegroundColor Gray
Write-Host "- To view specific service log: Get-Content logs/[service-name].log -Wait" -ForegroundColor Gray
Write-Host "- To stop all services: .\stop-services.ps1" -ForegroundColor Gray