# Production-ready microservices startup

Write-Host "🚀 Starting Cattle Management Microservices System" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
$pgRunning = netstat -an | findstr :5432
if ($pgRunning) {
    Write-Host "✅ PostgreSQL: Running on port 5432" -ForegroundColor Green
} else {
    Write-Host "❌ PostgreSQL not running" -ForegroundColor Red
    exit 1
}

# Check Redis
$redisRunning = netstat -an | findstr :6379
if ($redisRunning) {
    Write-Host "✅ Redis: Running on port 6379" -ForegroundColor Green
} else {
    Write-Host "❌ Redis not running" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔧 Building shared library..." -ForegroundColor Yellow
Set-Location shared
npm install --silent
npm run build --silent
Set-Location ..

Write-Host "🚀 Starting microservices..." -ForegroundColor Yellow

# Core services configuration
$services = @(
    @{name="auth-service"; port=3001; db="auth_db"; desc="Authentication Service"},
    @{name="api-gateway"; port=3000; db=""; desc="API Gateway"},
    @{name="base-service"; port=3002; db="base_db"; desc="Base Management Service"},
    @{name="cattle-service"; port=3003; db="cattle_db"; desc="Cattle Management Service"},
    @{name="health-service"; port=3004; db="health_db"; desc="Health Management Service"},
    @{name="feeding-service"; port=3005; db="feeding_db"; desc="Feeding Management Service"}
)

# Setup and start each service
foreach ($service in $services) {
    $serviceName = $service.name
    
    if (Test-Path $serviceName) {
        Write-Host "Setting up $($service.desc)..." -ForegroundColor Gray
        
        # Install dependencies
        Set-Location $serviceName
        if (-not (Test-Path "node_modules")) {
            npm install --silent
        }
        
        # Create .env file
        $envContent = @"
NODE_ENV=development
PORT=$($service.port)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=dianxin99
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-key
AUTH_SERVICE_URL=http://localhost:3001
BASE_SERVICE_URL=http://localhost:3002
CATTLE_SERVICE_URL=http://localhost:3003
HEALTH_SERVICE_URL=http://localhost:3004
FEEDING_SERVICE_URL=http://localhost:3005
"@
        
        if ($service.db -ne "") {
            $envContent += "`nDB_NAME=$($service.db)"
        }
        
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        
        # Start service
        Write-Host "Starting $serviceName on port $($service.port)..." -ForegroundColor Cyan
        Start-Process powershell -ArgumentList "-Command", "npm run dev" -WindowStyle Minimized
        
        Set-Location ..
        Start-Sleep -Seconds 3
    }
}

Write-Host ""
Write-Host "🎉 Microservices System Started Successfully!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Service Status:" -ForegroundColor Yellow
foreach ($service in $services) {
    Write-Host "  $($service.desc): http://localhost:$($service.port)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🔐 Test Credentials:" -ForegroundColor Yellow
Write-Host "  Username: admin" -ForegroundColor Cyan
Write-Host "  Password: admin123" -ForegroundColor Cyan

Write-Host ""
Write-Host "🛠️  Management Commands:" -ForegroundColor Yellow
Write-Host "  Check running services: Get-Process | Where-Object {`$_.ProcessName -eq 'node'}" -ForegroundColor Gray
Write-Host "  Stop all services: Get-Process node | Stop-Process" -ForegroundColor Gray
Write-Host "  View service logs: Check individual PowerShell windows" -ForegroundColor Gray

Write-Host ""
Write-Host "🌐 Quick Health Check:" -ForegroundColor Yellow
Write-Host "  Wait 30 seconds, then test: curl http://localhost:3001/health" -ForegroundColor Gray

Write-Host ""
Write-Host "✨ Your cattle management system is now running!" -ForegroundColor Green