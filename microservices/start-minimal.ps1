# Start minimal microservices set

Write-Host "Starting minimal microservices set..." -ForegroundColor Green

# Check Docker
try {
    docker --version | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Please start Docker Desktop first" -ForegroundColor Red
    exit 1
}

# Clean old containers
Write-Host "Cleaning old containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.minimal.yml down

# Start core services
Write-Host "Starting core services..." -ForegroundColor Yellow
docker-compose -f docker-compose.minimal.yml up -d

# Wait for services to start
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Check service status
Write-Host "Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.minimal.yml ps

Write-Host ""
Write-Host "Startup complete!" -ForegroundColor Green
Write-Host "API Gateway: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Auth Service: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Base Service: http://localhost:3002" -ForegroundColor Cyan
Write-Host "Cattle Service: http://localhost:3003" -ForegroundColor Cyan