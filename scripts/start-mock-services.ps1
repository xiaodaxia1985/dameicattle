#!/usr/bin/env pwsh

Write-Host "=== Starting Mock Microservices ===" -ForegroundColor Green

# Service configurations
$services = @{
    "base-service" = 3002
    "cattle-service" = 3003
    "health-service" = 3004
    "feeding-service" = 3005
    "equipment-service" = 3006
    "procurement-service" = 3007
    "sales-service" = 3008
    "material-service" = 3009
    "notification-service" = 3010
    "file-service" = 3011
    "monitoring-service" = 3012
    "news-service" = 3013
}

Write-Host "1. Creating mock services directory..." -ForegroundColor Yellow
$mockDir = "mock-services"
if (Test-Path $mockDir) {
    Remove-Item -Recurse -Force $mockDir
}
New-Item -ItemType Directory -Path $mockDir | Out-Null

Write-Host "2. Creating mock services..." -ForegroundColor Yellow

foreach ($serviceName in $services.Keys) {
    $port = $services[$serviceName]
    
    Write-Host "  Creating $serviceName on port $port..." -ForegroundColor Cyan
    
    # Create service directory
    $serviceDir = "$mockDir/$serviceName"
    New-Item -ItemType Directory -Path $serviceDir | Out-Null
    
    # Create simple Node.js app
    $appContent = @"
const http = require('http');
const url = require('url');

const port = process.env.PORT || $port;
const serviceName = '$serviceName';

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (path === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      service: serviceName,
      port: port,
      timestamp: new Date().toISOString()
    }));
  } else if (path === '/' || path === '/api/status') {
    res.writeHead(200);
    res.end(JSON.stringify({
      service: serviceName,
      status: 'running',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Route not found',
      service: serviceName,
      path: path
    }));
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Mock `+serviceName+` listening on port `+port);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});
"@

    $appContent | Out-File -FilePath "$serviceDir/app.js" -Encoding UTF8
    
    # Create package.json
    $packageContent = @"
{
  "name": "mock-$serviceName",
  "version": "1.0.0",
  "description": "Mock $serviceName",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  }
}
"@

    $packageContent | Out-File -FilePath "$serviceDir/package.json" -Encoding UTF8
}

Write-Host "3. Starting all mock services..." -ForegroundColor Yellow

$jobs = @()
foreach ($serviceName in $services.Keys) {
    $port = $services[$serviceName]
    $serviceDir = "$mockDir/$serviceName"
    
    Write-Host "  Starting $serviceName on port $port..." -ForegroundColor Cyan
    
    # Start service in background
    $job = Start-Job -ScriptBlock {
        param($dir, $port)
        Set-Location $dir
        $env:PORT = $port
        node app.js
    } -ArgumentList (Resolve-Path $serviceDir), $port
    
    $jobs += @{
        Name = $serviceName
        Port = $port
        Job = $job
    }
}

Write-Host "4. Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "5. Checking service status..." -ForegroundColor Yellow
$runningCount = 0
foreach ($jobInfo in $jobs) {
    $job = $jobInfo.Job
    $serviceName = $jobInfo.Name
    $port = $jobInfo.Port
    
    if ($job.State -eq "Running") {
        Write-Host "  ✅ $serviceName (port $port) - Running" -ForegroundColor Green
        $runningCount++
    } else {
        Write-Host "  ❌ $serviceName (port $port) - Failed" -ForegroundColor Red
    }
}

Write-Host "=== Mock Services Started ===" -ForegroundColor Green
Write-Host "✅ $runningCount/$($services.Count) services are running" -ForegroundColor Green
Write-Host ""
Write-Host "To stop all services, run:" -ForegroundColor Cyan
Write-Host "Get-Job | Stop-Job; Get-Job | Remove-Job" -ForegroundColor Yellow
Write-Host ""
Write-Host "Test with: scripts\test-microservices-health.ps1" -ForegroundColor Cyan