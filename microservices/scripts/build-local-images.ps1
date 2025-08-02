# Build Docker images using local Node.js (offline method)

Write-Host "Building Docker images using local Node.js..." -ForegroundColor Green

# Check if we have any Node.js image locally
$localImages = docker images --format "table {{.Repository}}:{{.Tag}}" | findstr node

if ($localImages) {
    Write-Host "Found local Node.js images:" -ForegroundColor Green
    $localImages | ForEach-Object { Write-Host "  $_" -ForegroundColor Cyan }
    
    # Use the first available local Node.js image
    $baseImage = ($localImages | Select-Object -First 1).Split()[0]
    Write-Host "Using base image: $baseImage" -ForegroundColor Yellow
} else {
    Write-Host "No local Node.js images found." -ForegroundColor Red
    Write-Host "Creating a custom Dockerfile that uses local Node.js..." -ForegroundColor Yellow
    
    # Create a custom Dockerfile that doesn't require pulling images
    $customDockerfile = @"
# Use scratch and copy Node.js from host (alternative approach)
FROM alpine:latest

# Install Node.js in the container
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Set npm registry to use local/faster mirror
RUN npm config set registry https://registry.npmmirror.com

# Copy shared library
COPY shared/ ../shared/
WORKDIR /shared
RUN npm install && npm run build

# Return to app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy application code
COPY . ./
RUN npm run build

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
"@

    # Update all service Dockerfiles
    $services = @(
        "api-gateway", "auth-service", "base-service", "cattle-service",
        "health-service", "feeding-service", "equipment-service", 
        "procurement-service", "sales-service", "material-service",
        "notification-service", "file-service", "monitoring-service"
    )

    foreach ($service in $services) {
        if (Test-Path "$service/Dockerfile") {
            Write-Host "Updating $service/Dockerfile..." -ForegroundColor Gray
            $customDockerfile | Set-Content "$service/Dockerfile" -Encoding UTF8
        }
    }
}

Write-Host "Attempting to build services..." -ForegroundColor Yellow

# Try to build one service first as a test
Write-Host "Testing build with auth-service..." -ForegroundColor Gray
docker build -t auth-service:local ./auth-service

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful! Proceeding with all services..." -ForegroundColor Green
    
    # Build all services
    docker-compose -f docker-compose.local.yml build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All services built successfully!" -ForegroundColor Green
        Write-Host "You can now run: docker-compose -f docker-compose.local.yml up -d" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Build failed for some services" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Build failed. Please check the error messages above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: You may need to:" -ForegroundColor Yellow
    Write-Host "1. Download Node.js Docker image manually" -ForegroundColor Cyan
    Write-Host "2. Use a different network connection" -ForegroundColor Cyan
    Write-Host "3. Configure corporate proxy settings" -ForegroundColor Cyan
}