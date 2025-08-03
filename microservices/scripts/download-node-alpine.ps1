# Download Alpine version of Node.js for Docker

Write-Host "Downloading Alpine version of Node.js..." -ForegroundColor Green

$nodeVersion = "v22.17.0"
$nodeUrl = "https://unofficial-builds.nodejs.org/download/release/$nodeVersion/node-$nodeVersion-linux-x64-musl.tar.xz"
$outputPath = "node-$nodeVersion-linux-x64-musl.tar.xz"

Write-Host "Downloading from: $nodeUrl" -ForegroundColor Yellow
Write-Host "Saving to: $outputPath" -ForegroundColor Yellow

try {
    # 使用Invoke-WebRequest下载
    Invoke-WebRequest -Uri $nodeUrl -OutFile $outputPath -UseBasicParsing
    
    if (Test-Path $outputPath) {
        $fileSize = (Get-Item $outputPath).Length / 1MB
        Write-Host "✅ Download completed! File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
        Write-Host "Alpine Node.js package saved as: $outputPath" -ForegroundColor Cyan
        
        # 复制到auth-service目录
        Copy-Item $outputPath "auth-service/"
        Write-Host "✅ Copied to auth-service directory" -ForegroundColor Green
    } else {
        Write-Host "❌ Download failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Download failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative download methods:" -ForegroundColor Yellow
    Write-Host "1. Use browser to download: $nodeUrl" -ForegroundColor Cyan
    Write-Host "2. Try official Alpine Node.js image instead" -ForegroundColor Cyan
}