# Download Linux version of Node.js for Docker

Write-Host "Downloading Linux version of Node.js..." -ForegroundColor Green

$nodeVersion = "v22.17.0"
$nodeUrl = "https://nodejs.org/dist/$nodeVersion/node-$nodeVersion-linux-x64.tar.xz"
$outputPath = "node-$nodeVersion-linux-x64.tar.xz"

Write-Host "Downloading from: $nodeUrl" -ForegroundColor Yellow
Write-Host "Saving to: $outputPath" -ForegroundColor Yellow

try {
    # 使用Invoke-WebRequest下载
    Invoke-WebRequest -Uri $nodeUrl -OutFile $outputPath -UseBasicParsing
    
    if (Test-Path $outputPath) {
        $fileSize = (Get-Item $outputPath).Length / 1MB
        Write-Host "✅ Download completed! File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
        Write-Host "Node.js Linux package saved as: $outputPath" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Download failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Download failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative download methods:" -ForegroundColor Yellow
    Write-Host "1. Use browser to download: $nodeUrl" -ForegroundColor Cyan
    Write-Host "2. Use wget: wget $nodeUrl" -ForegroundColor Cyan
    Write-Host "3. Use curl: curl -O $nodeUrl" -ForegroundColor Cyan
}