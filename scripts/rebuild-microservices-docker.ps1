#!/usr/bin/env pwsh

# 重新构建所有微服务Docker镜像脚本
Write-Host "=== 重新构建微服务Docker镜像 ===" -ForegroundColor Green
Write-Host "开始重新构建所有微服务镜像以使用最新代码..." -ForegroundColor Yellow

# 定义微服务列表
$microservices = @(
    "api-gateway",
    "auth-service", 
    "base-service",
    "cattle-service",
    "health-service",
    "feeding-service",
    "equipment-service",
    "procurement-service",
    "sales-service",
    "material-service",
    "notification-service",
    "file-service",
    "monitoring-service",
    "news-service"
)

# 切换到微服务目录
$originalPath = Get-Location
Set-Location "microservices"

Write-Host "`n1. 停止所有运行中的微服务容器..." -ForegroundColor Cyan
try {
    docker-compose -f docker-compose.local.yml down
    Write-Host "  ✓ 容器已停止" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ 停止容器时出现警告: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n2. 清理旧的Docker镜像..." -ForegroundColor Cyan
foreach ($service in $microservices) {
    $imageName = "microservices_$service"
    try {
        $images = docker images -q $imageName
        if ($images) {
            docker rmi $images --force
            Write-Host "  ✓ 已删除 $service 旧镜像" -ForegroundColor Green
        } else {
            Write-Host "  - $service 无旧镜像需要删除" -ForegroundColor Gray
        }
    } catch {
        Write-Host "  ⚠ 删除 $service 镜像时出现警告" -ForegroundColor Yellow
    }
}

Write-Host "`n3. 重新构建所有微服务镜像..." -ForegroundColor Cyan
$buildSuccess = @()
$buildFailed = @()

foreach ($service in $microservices) {
    Write-Host "  正在构建 $service..." -ForegroundColor Yellow
    
    # 检查服务目录是否存在
    if (-not (Test-Path $service)) {
        Write-Host "    ✗ $service 目录不存在，跳过" -ForegroundColor Red
        $buildFailed += $service
        continue
    }
    
    # 检查Dockerfile是否存在
    if (-not (Test-Path "$service/Dockerfile")) {
        Write-Host "    ✗ $service/Dockerfile 不存在，跳过" -ForegroundColor Red
        $buildFailed += $service
        continue
    }
    
    try {
        # 构建镜像
        $buildResult = docker build -t "microservices_$service" "./$service" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✓ $service 构建成功" -ForegroundColor Green
            $buildSuccess += $service
        } else {
            Write-Host "    ✗ $service 构建失败" -ForegroundColor Red
            Write-Host "    错误信息: $buildResult" -ForegroundColor Red
            $buildFailed += $service
        }
    } catch {
        Write-Host "    ✗ $service 构建异常: $($_.Exception.Message)" -ForegroundColor Red
        $buildFailed += $service
    }
}

Write-Host "`n4. 构建结果摘要:" -ForegroundColor Cyan
Write-Host "  成功构建: $($buildSuccess.Count)/$($microservices.Count)" -ForegroundColor Green
Write-Host "  构建失败: $($buildFailed.Count)/$($microservices.Count)" -ForegroundColor Red

if ($buildSuccess.Count -gt 0) {
    Write-Host "`n成功构建的服务:" -ForegroundColor Green
    foreach ($service in $buildSuccess) {
        Write-Host "  ✓ $service" -ForegroundColor Green
    }
}

if ($buildFailed.Count -gt 0) {
    Write-Host "`n构建失败的服务:" -ForegroundColor Red
    foreach ($service in $buildFailed) {
        Write-Host "  ✗ $service" -ForegroundColor Red
    }
}

Write-Host "`n5. 清理构建缓存..." -ForegroundColor Cyan
try {
    docker system prune -f
    Write-Host "  ✓ 构建缓存已清理" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ 清理缓存时出现警告" -ForegroundColor Yellow
}

# 返回原始目录
Set-Location $originalPath

Write-Host "`n=== 镜像重建完成 ===" -ForegroundColor Green

if ($buildSuccess.Count -eq $microservices.Count) {
    Write-Host "🎉 所有微服务镜像构建成功!" -ForegroundColor Green
    Write-Host "`n接下来可以启动微服务:" -ForegroundColor Cyan
    Write-Host "cd microservices" -ForegroundColor White
    Write-Host "docker-compose -f docker-compose.local.yml up -d" -ForegroundColor White
} elseif ($buildSuccess.Count -gt 0) {
    Write-Host "⚠️  部分微服务镜像构建成功，可以启动成功构建的服务。" -ForegroundColor Yellow
    Write-Host "`n启动成功构建的服务:" -ForegroundColor Cyan
    Write-Host "cd microservices" -ForegroundColor White
    $successServices = $buildSuccess -join " "
    Write-Host "docker-compose -f docker-compose.local.yml up -d $successServices" -ForegroundColor White
} else {
    Write-Host "❌ 所有微服务镜像构建失败，请检查构建错误。" -ForegroundColor Red
}

Write-Host "`n构建日志已保存，如需查看详细错误信息，请检查上述输出。" -ForegroundColor Gray