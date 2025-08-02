# Simplified microservice startup script

Write-Host "Starting cattle management microservices..." -ForegroundColor Green

# Check Docker
try {
    docker --version | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
} catch {
    Write-Host "Please start Docker Desktop first" -ForegroundColor Red
    exit 1
}

# Stop existing services
Write-Host "Stopping existing services..." -ForegroundColor Yellow
docker-compose down -v

# Build shared library
Write-Host "Building shared library..." -ForegroundColor Yellow
Set-Location shared
npm install
npm run build
Set-Location ..

# Start infrastructure
Write-Host "Starting infrastructure..." -ForegroundColor Yellow
docker-compose up -d postgres redis

# Wait for database
Write-Host "Waiting for database..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Start all services
Write-Host "Starting all microservices..." -ForegroundColor Yellow
docker-compose up -d

# Wait for services
Write-Host "Waiting for services..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service status
Write-Host "Checking service status..." -ForegroundColor Yellow
docker-compose ps

Write-Host "Startup complete!" -ForegroundColor Green
Write-Host "API Gateway: http://localhost:3000" -ForegroundColor Cyan