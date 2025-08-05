# Import local images to Docker

Write-Host "Importing local images to Docker..." -ForegroundColor Green

# Check if alpine ISO exists
$alpineIso = "imagefiles/alpine-standard-3.20.3-x86_64.iso"
if (Test-Path $alpineIso) {
    Write-Host "Found Alpine ISO: $alpineIso" -ForegroundColor Yellow
    Write-Host "Note: Alpine ISO needs to be converted to Docker image manually" -ForegroundColor Yellow
    Write-Host "You can create a basic alpine image using: docker run --rm -it alpine:latest" -ForegroundColor Cyan
} else {
    Write-Host "Alpine ISO not found at: $alpineIso" -ForegroundColor Red
}

# Check if node tarball exists
$nodeTarball = "imagefiles/node-v22.17.0-linux-x64-musl.tar.xz"
if (Test-Path $nodeTarball) {
    Write-Host "Found Node.js tarball: $nodeTarball" -ForegroundColor Green
} else {
    Write-Host "Node.js tarball not found at: $nodeTarball" -ForegroundColor Red
}

Write-Host ""
Write-Host "For offline deployment, you need to:" -ForegroundColor Yellow
Write-Host "1. Import or create a basic alpine image" -ForegroundColor Cyan
Write-Host "2. Use the Dockerfile.offline which uses local Node.js tarball" -ForegroundColor Cyan
Write-Host ""
Write-Host "Alternative: Use npm directly without Docker" -ForegroundColor Green