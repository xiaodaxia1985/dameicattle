# Start microservices with Docker using local PostgreSQL and Redis

Write-Host "Starting microservices with Docker (using local DB)..." -ForegroundColor Green

# Check Docker
try {
    docker --version | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not running. Please start Docker Desktop" -ForegroundColor Red
    exit 1
}

# Check local services
$pgRunning = netstat -an | findstr :5432
$redisRunning = netstat -an | findstr :6379

if (-not $pgRunning) {
    Write-Host "❌ PostgreSQL not running on port 5432" -ForegroundColor Red
    exit 1
}

if (-not $redisRunning) {
    Write-Host "❌ Redis not running on port 6379" -ForegroundColor Red  
    exit 1
}

Write-Host "✅ PostgreSQL and Redis are running locally" -ForegroundColor Green

# Stop existing containers
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml down

# Build shared library
Write-Host "Building shared library..." -ForegroundColor Yellow
Set-Location shared
npm install
npm run build
Set-Location ..

# Try to pull base image first
Write-Host "Attempting to pull Node.js base image..." -ForegroundColor Yellow

$imageSources = @(
    "node:18-alpine",
    "dockerproxy.com/library/node:18-alpine", 
    "registry.cn-hangzhou.aliyuncs.com/library/node:18-alpine",
    "registry.cn-beijing.aliyuncs.com/library/node:18-alpine"
)

$imageFound = $false
foreach ($imageSource in $imageSources) {
    Write-Host "Trying $imageSource..." -ForegroundColor Gray
    try {
        docker pull $imageSource 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully pulled $imageSource" -ForegroundColor Green
            $baseImage = $imageSource
            $imageFound = $true
            break
        }
    } catch {
        Write-Host "❌ Failed to pull $imageSource" -ForegroundColor Red
    }
}

if (-not $imageFound) {
    Write-Host "❌ Unable to pull any Node.js image. Network connectivity issue." -ForegroundColor Red
    Write-Host "Please check your internet connection or Docker registry settings." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You can try:" -ForegroundColor Yellow
    Write-Host "1. Configure Docker registry mirrors in Docker Desktop settings" -ForegroundColor Cyan
    Write-Host "2. Use VPN or proxy" -ForegroundColor Cyan
    Write-Host "3. Download Node.js image manually" -ForegroundColor Cyan
    exit 1
}

# Update Dockerfiles to use the working image
Write-Host "Updating Dockerfiles to use working image: $baseImage" -ForegroundColor Yellow

$services = @(
    "api-gateway", "auth-service", "base-service", "cattle-service",
    "health-service", "feeding-service", "equipment-service", 
    "procurement-service", "sales-service", "material-service",
    "notification-service", "file-service", "monitoring-service"
)

foreach ($service in $services) {
    if (Test-Path "$service/Dockerfile") {
        $dockerfileContent = Get-Content "$service/Dockerfile" -Raw
        $dockerfileContent = $dockerfileContent -replace "FROM.*node:18-alpine", "FROM $baseImage"
        $dockerfileContent | Set-Content "$service/Dockerfile" -Encoding UTF8
    }
}

# Build and start services
Write-Host "Building and starting microservices..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml up -d --build

# Wait for services
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check status
Write-Host "Checking service status..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml ps

Write-Host ""
Write-Host "🎉 Docker microservices started!" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "API Gateway:     http://localhost:3000" -ForegroundColor Cyan
Write-Host "Auth Service:    http://localhost:3001" -ForegroundColor Cyan
Write-Host "Base Service:    http://localhost:3002" -ForegroundColor Cyan
Write-Host "Cattle Service:  http://localhost:3003" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test credentials:" -ForegroundColor Yellow
Write-Host "Username: admin" -ForegroundColor Cyan
Write-Host "Password: admin123" -ForegroundColor Cyan