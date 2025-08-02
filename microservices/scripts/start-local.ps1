# Start core microservices locally

Write-Host "Starting core microservices locally..." -ForegroundColor Green

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
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

Write-Host "✅ PostgreSQL and Redis are running" -ForegroundColor Green

# Build shared library
Write-Host "Building shared library..." -ForegroundColor Yellow
Set-Location shared
npm install
npm run build
Set-Location ..

# Core services to start
$coreServices = @(
    @{name="auth-service"; port=3001; db="auth_db"},
    @{name="api-gateway"; port=3000; db=""},
    @{name="base-service"; port=3002; db="base_db"},
    @{name="cattle-service"; port=3003; db="cattle_db"}
)

# Install dependencies and create env files
foreach ($service in $coreServices) {
    $serviceName = $service.name
    
    if (Test-Path $serviceName) {
        Write-Host "Setting up $serviceName..." -ForegroundColor Gray
        
        # Install dependencies
        Set-Location $serviceName
        npm install --silent
        
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
"@
        
        if ($service.db -ne "") {
            $envContent += "`nDB_NAME=$($service.db)"
        }
        
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Set-Location ..
    }
}

Write-Host "Starting services..." -ForegroundColor Yellow

# Start auth service first
Write-Host "Starting auth-service on port 3001..." -ForegroundColor Gray
Set-Location auth-service
Start-Process powershell -ArgumentList "-Command", "npm run dev" -WindowStyle Minimized
Set-Location ..
Start-Sleep -Seconds 5

# Start API gateway
Write-Host "Starting api-gateway on port 3000..." -ForegroundColor Gray
Set-Location api-gateway  
Start-Process powershell -ArgumentList "-Command", "npm run dev" -WindowStyle Minimized
Set-Location ..
Start-Sleep -Seconds 3

# Start base service
Write-Host "Starting base-service on port 3002..." -ForegroundColor Gray
Set-Location base-service
Start-Process powershell -ArgumentList "-Command", "npm run dev" -WindowStyle Minimized
Set-Location ..
Start-Sleep -Seconds 3

# Start cattle service
Write-Host "Starting cattle-service on port 3003..." -ForegroundColor Gray
Set-Location cattle-service
Start-Process powershell -ArgumentList "-Command", "npm run dev" -WindowStyle Minimized
Set-Location ..

Write-Host ""
Write-Host "🎉 Core services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Yellow
Write-Host "API Gateway:    http://localhost:3000" -ForegroundColor Cyan
Write-Host "Auth Service:   http://localhost:3001" -ForegroundColor Cyan  
Write-Host "Base Service:   http://localhost:3002" -ForegroundColor Cyan
Write-Host "Cattle Service: http://localhost:3003" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test credentials:" -ForegroundColor Yellow
Write-Host "Username: admin" -ForegroundColor Cyan
Write-Host "Password: admin123" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop services, close the PowerShell windows or use Task Manager" -ForegroundColor Gray