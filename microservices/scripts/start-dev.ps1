# Start microservices with local database

Write-Host "Starting microservices with local PostgreSQL and Redis..." -ForegroundColor Green

# Check if local services are running
Write-Host "Checking local services..." -ForegroundColor Yellow

$pgRunning = netstat -an | findstr :5432
$redisRunning = netstat -an | findstr :6379

if (-not $pgRunning) {
    Write-Host "PostgreSQL is not running on port 5432" -ForegroundColor Red
    Write-Host "Please start PostgreSQL service first" -ForegroundColor Yellow
    exit 1
}

if (-not $redisRunning) {
    Write-Host "Redis is not running on port 6379" -ForegroundColor Red
    Write-Host "Please start Redis service first" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ PostgreSQL and Redis are running" -ForegroundColor Green

# Stop any existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml down

# Build shared library
Write-Host "Building shared library..." -ForegroundColor Yellow
Set-Location shared
npm install
npm run build
Set-Location ..

# Build and start services
Write-Host "Building and starting microservices..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml up -d --build

# Wait for services to start
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check service status
Write-Host "Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml ps

Write-Host ""
Write-Host "🎉 Microservices started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "API Gateway:     http://localhost:3000" -ForegroundColor Cyan
Write-Host "Auth Service:    http://localhost:3001" -ForegroundColor Cyan
Write-Host "Base Service:    http://localhost:3002" -ForegroundColor Cyan
Write-Host "Cattle Service:  http://localhost:3003" -ForegroundColor Cyan
Write-Host "Health Service:  http://localhost:3004" -ForegroundColor Cyan
Write-Host "Feeding Service: http://localhost:3005" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test login:" -ForegroundColor Yellow
Write-Host "Username: admin" -ForegroundColor Cyan
Write-Host "Password: admin123" -ForegroundColor Cyan