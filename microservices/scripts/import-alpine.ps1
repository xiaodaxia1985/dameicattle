# Import Alpine Linux as Docker image

Write-Host "Importing Alpine Linux as Docker image..." -ForegroundColor Green

$alpineIsoPath = "D:\software\alpine-standard-3.20.3-x86_64.iso"

if (-not (Test-Path $alpineIsoPath)) {
    Write-Host "❌ Alpine ISO file not found at: $alpineIsoPath" -ForegroundColor Red
    Write-Host "Please check the file path" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found Alpine ISO: $alpineIsoPath" -ForegroundColor Green

# 方法1: 尝试直接从ISO创建Docker镜像
Write-Host "Attempting to create Docker image from ISO..." -ForegroundColor Yellow

try {
    # 创建一个临时的Dockerfile来构建Alpine镜像
    $dockerfileContent = @"
FROM scratch
ADD alpine-standard-3.20.3-x86_64.iso /
CMD ["/bin/sh"]
"@

    # 复制ISO到当前目录
    Copy-Item $alpineIsoPath . -Force
    
    # 创建Dockerfile
    $dockerfileContent | Out-File -FilePath "Dockerfile.alpine" -Encoding UTF8
    
    # 构建镜像
    docker build -f Dockerfile.alpine -t alpine:latest .
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Alpine Docker image created successfully!" -ForegroundColor Green
        
        # 清理临时文件
        Remove-Item "alpine-standard-3.20.3-x86_64.iso" -Force
        Remove-Item "Dockerfile.alpine" -Force
        
        # 验证镜像
        docker images alpine
    } else {
        Write-Host "❌ Failed to create Docker image from ISO" -ForegroundColor Red
        Write-Host "ISO files are not directly compatible with Docker" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Alternative solution:" -ForegroundColor Yellow
Write-Host "We need the Alpine minirootfs tar.gz file instead of ISO" -ForegroundColor Cyan
Write-Host "Let me download the correct Alpine file for Docker..." -ForegroundColor Cyan