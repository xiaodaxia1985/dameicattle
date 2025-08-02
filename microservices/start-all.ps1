# 一键启动所有微服务

Write-Host "启动肉牛管理系统微服务..." -ForegroundColor Green

# 检查Docker
$dockerVersion = docker --version 2>$null
if (-not $dockerVersion) {
    Write-Host "请先启动Docker Desktop" -ForegroundColor Red
    exit 1
}
Write-Host "Docker运行正常: $dockerVersion" -ForegroundColor Green

# 清理旧容器
Write-Host "清理旧容器..." -ForegroundColor Yellow
docker-compose down -v

# 构建共享库
Write-Host "构建共享库..." -ForegroundColor Yellow
Set-Location shared
npm install --silent
npm run build --silent
Set-Location ..

# 启动所有服务
Write-Host "启动所有服务..." -ForegroundColor Yellow
docker-compose up -d

# 等待服务启动
Write-Host "等待服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 60

# 健康检查
Write-Host "执行健康检查..." -ForegroundColor Yellow
& ".\scripts\health-check.ps1"

Write-Host ""
Write-Host "启动完成！" -ForegroundColor Green
Write-Host "API网关: http://localhost:3000" -ForegroundColor Cyan
Write-Host "认证服务: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "常用命令:" -ForegroundColor Yellow
Write-Host "查看状态: docker-compose ps" -ForegroundColor Cyan
Write-Host "查看日志: docker-compose logs -f" -ForegroundColor Cyan
Write-Host "停止服务: docker-compose down" -ForegroundColor Cyan