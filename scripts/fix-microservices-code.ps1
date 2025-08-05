#!/usr/bin/env pwsh

# Fix microservices shared dependency issue
Write-Host "=== Fixing Microservices Shared Dependencies ===" -ForegroundColor Green

# Switch to microservices directory
$originalPath = Get-Location
Set-Location "microservices"

Write-Host "1. Stopping problematic containers..." -ForegroundColor Cyan
docker-compose -f docker-compose.simple.yml down

Write-Host "`n2. Building shared library..." -ForegroundColor Cyan
if (Test-Path "shared") {
    Set-Location "shared"
    Write-Host "  Installing shared dependencies..." -ForegroundColor Yellow
    npm install
    Write-Host "  Building shared library..." -ForegroundColor Yellow
    npm run build
    Set-Location ".."
    Write-Host "  ✓ Shared library built successfully" -ForegroundColor Green
} else {
    Write-Host "  ✗ Shared directory not found" -ForegroundColor Red
}

Write-Host "`n3. Creating fixed Dockerfiles with shared library..." -ForegroundColor Cyan

# Define services that need shared library
$services = @(
    "base-service", "cattle-service", "health-service", "feeding-service",
    "equipment-service", "procurement-service", "sales-service", 
    "material-service", "notification-service", "file-service", 
    "monitoring-service", "news-service"
)

# Dockerfile template that includes shared library
$fixedDockerfile = @"
FROM alpine:latest

RUN apk add --no-cache nodejs npm

WORKDIR /app

# Copy and build shared library first
COPY ../shared /shared
WORKDIR /shared
RUN npm install && npm run build

# Switch to app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy compiled code
COPY dist ./dist

# Copy other necessary files
COPY . .

# Create symlink to shared library
RUN mkdir -p node_modules/@cattle-management && ln -sf /shared node_modules/@cattle-management/shared

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/app.js"]
"@

foreach ($service in $services) {
    if (Test-Path $service) {
        Write-Host "  Fixing $service..." -ForegroundColor Yellow
        
        # Check if service has dist directory and uses shared library
        if (Test-Path "$service/dist") {
            $servicePort = @("base-service", "cattle-service", "health-service", "feeding-service", "equipment-service", "procurement-service", "sales-service", "material-service", "notification-service", "file-service", "monitoring-service", "news-service").IndexOf($service) + 3003
            
            $serviceDockerfile = $fixedDockerfile -replace "EXPOSE 3000", "EXPOSE $servicePort"
            $serviceDockerfile | Set-Content "$service/Dockerfile.fixed" -Encoding UTF8
            
            Write-Host "    ✓ Created fixed Dockerfile" -ForegroundColor Green
        } else {
            Write-Host "    ⚠ No dist directory found" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n4. Rebuilding services with fixed Dockerfiles..." -ForegroundColor Cyan
$buildSuccess = @()
$buildFailed = @()

foreach ($service in $services) {
    if (Test-Path "$service/Dockerfile.fixed") {
        Write-Host "  Building $service..." -ForegroundColor Yellow
        
        # Build from microservices directory to include shared
        $buildResult = docker build -f "$service/Dockerfile.fixed" -t "microservices_${service}_fixed" "." 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✓ SUCCESS" -ForegroundColor Green
            $buildSuccess += $service
        } else {
            Write-Host "    ✗ FAILED" -ForegroundColor Red
            Write-Host "    Error: $($buildResult | Select-Object -Last 2)" -ForegroundColor Red
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
    
    Write-Host "`n6. Creating updated compose file..." -ForegroundColor Cyan
    
    # Create compose content with fixed images
    $composeContent = @"
version: '3.8'
services:

  api-gateway:
    image: microservices_api-gateway
    container_name: api-gateway-container
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - PORT=3001
    networks:
      - microservices-network
    restart: unless-stopped
"@

    foreach ($service in $buildSuccess) {
        $port = @("base-service", "cattle-service", "health-service", "feeding-service", "equipment-service", "procurement-service", "sales-service", "material-service", "notification-service", "file-service", "monitoring-service", "news-service").IndexOf($service) + 3003
        
        $composeContent += @"

  ${service}:
    image: microservices_${service}_fixed
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

    $composeContent | Set-Content "docker-compose.fixed.yml" -Encoding UTF8
    
    Write-Host "`n7. Starting fixed services..." -ForegroundColor Cyan
    docker-compose -f docker-compose.fixed.yml up -d
    
    Write-Host "`n8. Waiting for startup..." -ForegroundColor Cyan
    Start-Sleep -Seconds 15
    
    Write-Host "`n9. Checking status..." -ForegroundColor Cyan
    docker-compose -f docker-compose.fixed.yml ps
}

# Return to original directory
Set-Location $originalPath

Write-Host "`n=== Fix Complete ===" -ForegroundColor Green

if ($buildSuccess.Count -gt 0) {
    Write-Host "🎉 Successfully fixed $($buildSuccess.Count) microservices!" -ForegroundColor Green
    Write-Host "`nTest with: .\scripts\test-microservices-health.ps1" -ForegroundColor Cyan
} else {
    Write-Host "❌ No services were successfully fixed" -ForegroundColor Red
}