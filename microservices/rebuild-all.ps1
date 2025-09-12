# DameiCattle Microservices Bulk Rebuild Script
# Plain text, no BOM, PowerShell syntax, stop on error
# Automatically traverse all service directories under microservices, clean, install dependencies, build

$ErrorActionPreference = 'Stop'

Write-Host "[Rebuild] Starting bulk rebuild of all microservices..." -ForegroundColor Cyan

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$serviceDirs = Get-ChildItem -Path $root -Directory | Where-Object {
    ($_.Name -notin @('logs', 'database', 'shared')) -and (Test-Path (Join-Path $_.FullName 'package.json'))
}

foreach ($service in $serviceDirs) {
    Write-Host "[Rebuild] Processing $($service.Name)..." -ForegroundColor Yellow
    $servicePath = $service.FullName
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue (Join-Path $servicePath 'node_modules')
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue (Join-Path $servicePath 'dist')
    Push-Location $servicePath
    Write-Host "[Rebuild] Installing dependencies ($servicePath)..." -ForegroundColor DarkGray
    npm install
    Write-Host "[Rebuild] Building ($servicePath)..." -ForegroundColor DarkGray
    npm run build
    Pop-Location
}

Write-Host "[Rebuild] All microservices dependencies installed and build completed!" -ForegroundColor Green
