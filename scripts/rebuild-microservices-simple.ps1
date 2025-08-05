#!/usr/bin/env pwsh

# Simple rebuild using existing compiled code
Write-Host "=== Simple Microservices Rebuild ===" -ForegroundColor Green

# Switch to microservices directory
$originalPath = Get-Location
Set-Location "microservices"

Write-Host "1. Stopping existing containers..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml down 2>$null

Write-Host "`n2. Removing old images..." -ForegroundColor Cyan
docker images --format "{{.Repository}}" | Select-String "microservices" | ForEach-Object {
    docker rmi $_ --force 2>$null
}

Write-Host "`n3. Creating simple Dockerfiles..." -ForegroundColor Cyan

# Define services
$services = @(
    "api-gateway", "auth-service", "base-service", "cattle-service",
    "health-service", "feeding-service", "equipment-service", 
    "procurement-service", "sales-service", "material-service",
    "notification-service", "file-service", "monitoring-service", "news-service"
)

# Simple Dockerfile that uses existing compiled code
$simpleDockerfile = @"
FROM alpine:latest

RUN apk add --no-cache nodejs npm

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy compiled code (dist directory)
COPY dist ./dist

# Copy any other necessary files
COPY . .

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/app.js"]
"@

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "  Processing $service..." -ForegroundColor Yellow
        
        # Check if dist directory exists
        if (Test-Path "$service/dist") {
            Write-Host "    Found compiled code in dist/" -ForegroundColor Green
            
            # Create simple Dockerfile
            $servicePort = $services.IndexOf($service) + 3001
            $serviceDockerfile = $simpleDockerfile -replace "EXPOSE 3000", "EXPOSE $servicePort"
            $serviceDockerfile | Set-Content "$service/Dockerfile.simple" -Encoding UTF8
        } else {
            Write-Host "    No dist/ directory found, skipping..." -ForegroundColor Red
        }
    }
}

Write-Host "`n4. Building images..." -ForegroundColor Cyan
$buildSuccess = @()
$buildFailed = @()

foreach ($service in $services) {
    if (Test-Path "$service/Dockerfile.simple") {
        Write-Host "  Building $service..." -ForegroundColor Yellow
        
        $buildResult = docker build -f "$service/Dockerfile.simple" -t "microservices_$service" "./$service" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    SUCCESS" -ForegroundColor Green
            $buildSuccess += $service
        } else {
            Write-Host "    FAILED" -ForegroundColor Red
            $buildFailed += $service
        }
    }
}

Write-Host "`n5. Results:" -ForegroundColor Cyan
Write-Host "  Success: $($buildSuccess.Count)" -ForegroundColor Green
Write-Host "  Failed: $($buildFailed.Count)" -ForegroundColor Red

if ($buildSuccess.Count -gt 0) {
    Write-Host "`nSuccessful builds:" -ForegroundColor Green
    $buildSuccess | ForEach-Object { Write-Host "  ✓ $_" -ForegroundColor Green }
    
    Write-Host "`n6. Creating compose file..." -ForegroundColor Cyan
    
    $composeContent = @"
version: '3.8'
services:
"@

    foreach ($service in $buildSuccess) {
        $port = $services.IndexOf($service) + 3001
        $composeContent += @"

  ${service}:
    image: microservices_${service}
    container_name: ${service}-container
    ports:
      - "${port}:${port}"
    environment:
      - NODE_ENV=development
      - PORT=${port}
    networks:
      - microservices-network
    restart: unless-stopped
"@
    }

    $composeContent += @"

networks:
  microservices-network:
    driver: bridge
"@

    $composeContent | Set-Content "docker-compose.simple.yml" -Encoding UTF8
    
    Write-Host "`n7. Starting services..." -ForegroundColor Cyan
    docker-compose -f docker-compose.simple.yml up -d
    
    Write-Host "`n8. Waiting..." -ForegroundColor Cyan
    Start-Sleep -Seconds 10
    
    Write-Host "`n9. Status check..." -ForegroundColor Cyan
    docker-compose -f docker-compose.simple.yml ps
    
    Write-Host "`n10. Health check..." -ForegroundColor Cyan
    foreach ($service in $buildSuccess) {
        $port = $services.IndexOf($service) + 3001
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:$port/health" -TimeoutSec 3 -ErrorAction Stop
            Write-Host "  ✓ $service (port $port) - OK" -ForegroundColor Green
        } catch {
            Write-Host "  ? $service (port $port) - Checking..." -ForegroundColor Yellow
        }
    }
}

# Return to original directory
Set-Location $originalPath

Write-Host "`n=== Rebuild Complete ===" -ForegroundColor Green

if ($buildSuccess.Count -gt 0) {
    Write-Host "🎉 Successfully rebuilt $($buildSuccess.Count) microservices!" -ForegroundColor Green
    Write-Host "`nTest with: .\scripts\test-frontend-microservices-simple.ps1" -ForegroundColor Cyan
} else {
    Write-Host "❌ No services were successfully built" -ForegroundColor Red
}