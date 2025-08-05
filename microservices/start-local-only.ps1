# Start local microservices (no external images)

Write-Host "Starting cattle management microservices (local mode)..." -ForegroundColor Green

# Check Docker
try {
    docker --version | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Please start Docker Desktop first" -ForegroundColor Red
    exit 1
}

# Remind user to start local database and Redis
Write-Host ""
Write-Host "Note: Please ensure the following services are running locally:" -ForegroundColor Yellow
Write-Host "- PostgreSQL (port: 5432)" -ForegroundColor Cyan
Write-Host "- Redis (port: 6379)" -ForegroundColor Cyan
Write-Host ""

$continue = Read-Host "Continue to start microservices? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Startup cancelled" -ForegroundColor Yellow
    exit 0
}

# Clean old containers
Write-Host "Cleaning old containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.local-only.yml down -v

# Start all services
Write-Host "Starting all microservices..." -ForegroundColor Yellow
docker-compose -f docker-compose.local-only.yml up -d

# Wait for services to start
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service status
Write-Host "Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.local-only.yml ps

Write-Host ""
Write-Host "Startup complete!" -ForegroundColor Green
Write-Host "API Gateway: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Auth Service: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Base Service: http://localhost:3002" -ForegroundColor Cyan
Write-Host "Cattle Service: http://localhost:3003" -ForegroundColor Cyan
Write-Host ""
Write-Host "Common commands:" -ForegroundColor Yellow
Write-Host "Check status: docker-compose -f docker-compose.local-only.yml ps" -ForegroundColor Cyan
Write-Host "View logs: docker-compose -f docker-compose.local-only.yml logs -f" -ForegroundColor Cyan
Write-Host "Stop services: docker-compose -f docker-compose.local-only.yml down" -ForegroundColor Cyan