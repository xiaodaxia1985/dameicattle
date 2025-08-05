#!/usr/bin/env pwsh

# Rebuild microservices using local Docker images
Write-Host "=== Rebuilding Microservices with Local Images ===" -ForegroundColor Green

# Switch to microservices directory
$originalPath = Get-Location
Set-Location "microservices"

Write-Host "1. Checking local images..." -ForegroundColor Cyan
$localImages = docker images --format "table {{.Repository}}:{{.Tag}}"
Write-Host "Available local images:" -ForegroundColor Gray
$localImages | Select-String -Pattern "(node|postgres|redis|alpine)" | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }

Write-Host "`n2. Stopping existing containers..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml down 2>$null

Write-Host "`n3. Removing old microservice images..." -ForegroundColor Cyan
$microserviceImages = docker images --format "{{.Repository}}" | Select-String "microservices"
foreach ($image in $microserviceImages) {
    Write-Host "  Removing $image..." -ForegroundColor Yellow
    docker rmi $image --force 2>$null
}

Write-Host "`n4. Creating Dockerfiles for each service..." -ForegroundColor Cyan

# Define microservices list
$services = @(
    "api-gateway", "auth-service", "base-service", "cattle-service",
    "health-service", "feeding-service", "equipment-service", 
    "procurement-service", "sales-service", "material-service",
    "notification-service", "file-service", "monitoring-service", "news-service"
)

# Dockerfile template using local alpine image
$localDockerfile = @"
FROM alpine:latest

RUN apk add --no-cache nodejs npm

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN if [ -f "package.json" ] && grep -q '"build"' package.json; then npm run build; fi

EXPOSE 3000

CMD ["npm", "start"]
"@

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "  Processing $service..." -ForegroundColor Yellow
        
        # Create Dockerfile using local images
        $servicePort = $services.IndexOf($service) + 3001
        $serviceDockerfile = $localDockerfile -replace "EXPOSE 3000", "EXPOSE $servicePort"
        $serviceDockerfile | Set-Content "$service/Dockerfile.local" -Encoding UTF8
        
        # Ensure package.json exists
        if (-not (Test-Path "$service/package.json")) {
            Write-Host "    Creating package.json..." -ForegroundColor Gray
            $packageJson = @{
                name = $service
                version = "1.0.0"
                main = "src/index.js"
                scripts = @{
                    start = "node src/index.js"
                    dev = "nodemon src/index.js"
                }
                dependencies = @{
                    express = "^4.18.0"
                    cors = "^2.8.5"
                    dotenv = "^16.0.0"
                }
            }
            $packageJson | ConvertTo-Json -Depth 3 | Set-Content "$service/package.json" -Encoding UTF8
        }
        
        # Ensure basic service code exists
        if (-not (Test-Path "$service/src/index.js")) {
            if (-not (Test-Path "$service/src")) {
                New-Item -ItemType Directory -Path "$service/src" -Force | Out-Null
            }
            
            $basicServer = @"
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || $servicePort;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: '$service', 
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

app.get('/', (req, res) => {
    res.json({ 
        message: '$service is running', 
        version: '1.0.0',
        port: PORT
    });
});

app.get('/api/status', (req, res) => {
    res.json({
        service: '$service',
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('[$service] Server running on port ' + PORT);
});
"@
            $basicServer | Set-Content "$service/src/index.js" -Encoding UTF8
        }
    }
}

Write-Host "`n5. Building microservice images..." -ForegroundColor Cyan
$buildSuccess = @()
$buildFailed = @()

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "  Building $service..." -ForegroundColor Yellow
        
        try {
            $buildOutput = docker build -f "$service/Dockerfile.local" -t "microservices_$service" "./$service" 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    SUCCESS" -ForegroundColor Green
                $buildSuccess += $service
            } else {
                Write-Host "    FAILED" -ForegroundColor Red
                $buildFailed += $service
            }
        } catch {
            Write-Host "    ERROR" -ForegroundColor Red
            $buildFailed += $service
        }
    }
}

Write-Host "`n6. Build Results:" -ForegroundColor Cyan
Write-Host "  Success: $($buildSuccess.Count)/$($services.Count)" -ForegroundColor Green
Write-Host "  Failed: $($buildFailed.Count)/$($services.Count)" -ForegroundColor Red

if ($buildSuccess.Count -gt 0) {
    Write-Host "`nSuccessfully built services:" -ForegroundColor Green
    foreach ($service in $buildSuccess) {
        Write-Host "  $service" -ForegroundColor Green
    }
    
    Write-Host "`n7. Creating docker-compose file..." -ForegroundColor Cyan
    
    $composeContent = "version: '3.8'`nservices:`n"

    foreach ($service in $buildSuccess) {
        $port = $services.IndexOf($service) + 3001
        $composeContent += @"

  $service`:
    image: microservices_$service
    container_name: $service-container
    ports:
      - "$port`:$port"
    environment:
      - NODE_ENV=development
      - PORT=$port
    networks:
      - microservices-network
    restart: unless-stopped
"@
    }

    $composeContent += "`n`nnetworks:`n  microservices-network:`n    driver: bridge"
    $composeContent | Set-Content "docker-compose.rebuilt.yml" -Encoding UTF8
    
    Write-Host "`n8. Starting microservices..." -ForegroundColor Cyan
    docker-compose -f docker-compose.rebuilt.yml up -d
    
    Write-Host "`n9. Waiting for startup..." -ForegroundColor Cyan
    Start-Sleep -Seconds 8
    
    Write-Host "`n10. Checking status..." -ForegroundColor Cyan
    docker-compose -f docker-compose.rebuilt.yml ps
}

# Return to original directory
Set-Location $originalPath

Write-Host "`n=== Rebuild Complete ===" -ForegroundColor Green

if ($buildSuccess.Count -gt 0) {
    Write-Host "Successfully rebuilt $($buildSuccess.Count) microservices!" -ForegroundColor Green
    Write-Host "`nRun test script:" -ForegroundColor Cyan
    Write-Host ".\scripts\test-frontend-microservices-simple.ps1" -ForegroundColor White
} else {
    Write-Host "No microservices were successfully built" -ForegroundColor Red
}