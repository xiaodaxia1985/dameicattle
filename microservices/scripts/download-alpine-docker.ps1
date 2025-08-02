# Download Alpine Linux minirootfs for Docker

Write-Host "Downloading Alpine Linux minirootfs for Docker..." -ForegroundColor Green

$alpineVersion = "3.20.3"
$alpineUrl = "https://dl-cdn.alpinelinux.org/alpine/v3.20/releases/x86_64/alpine-minirootfs-$alpineVersion-x86_64.tar.gz"
$outputPath = "alpine-minirootfs-$alpineVersion-x86_64.tar.gz"

Write-Host "Downloading from: $alpineUrl" -ForegroundColor Yellow
Write-Host "Saving to: $outputPath" -ForegroundColor Yellow

try {
    # 使用Invoke-WebRequest下载
    Invoke-WebRequest -Uri $alpineUrl -OutFile $outputPath -UseBasicParsing
    
    if (Test-Path $outputPath) {
        $fileSize = (Get-Item $outputPath).Length / 1MB
        Write-Host "✅ Download completed! File size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Green
        
        # 导入为Docker镜像
        Write-Host "Importing as Docker image..." -ForegroundColor Yellow
        docker import $outputPath alpine:latest
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Alpine Docker image imported successfully!" -ForegroundColor Green
            
            # 验证镜像
            Write-Host "Verifying Alpine image..." -ForegroundColor Yellow
            docker images alpine
            
            # 测试镜像
            Write-Host "Testing Alpine image..." -ForegroundColor Yellow
            docker run --rm alpine:latest /bin/sh -c "echo 'Alpine Linux is ready!'"
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Alpine image is working correctly!" -ForegroundColor Green
                
                # 清理下载文件
                Remove-Item $outputPath -Force
                Write-Host "Cleaned up download file" -ForegroundColor Gray
            }
        } else {
            Write-Host "❌ Failed to import Alpine image" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Download failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Download failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: You can manually download from:" -ForegroundColor Yellow
    Write-Host "$alpineUrl" -ForegroundColor Cyan
    Write-Host "Then run: docker import $outputPath alpine:latest" -ForegroundColor Cyan
}