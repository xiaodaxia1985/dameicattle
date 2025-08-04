# 测试auth-service的脚本

Write-Host "🧪 开始测试 auth-service..." -ForegroundColor Green

# 进入auth-service目录
Set-Location microservices/auth-service

try {
    # 安装依赖
    Write-Host "📦 安装依赖..." -ForegroundColor Yellow
    npm install

    # 编译TypeScript
    Write-Host "🔨 编译TypeScript..." -ForegroundColor Yellow
    npm run build

    # 启动服务（后台运行）
    Write-Host "🚀 启动服务..." -ForegroundColor Yellow
    $process = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru -WindowStyle Hidden

    # 等待服务启动
    Write-Host "⏳ 等待服务启动..." -ForegroundColor Gray
    Start-Sleep -Seconds 10

    # 测试健康检查
    Write-Host "🔍 测试健康检查..." -ForegroundColor Yellow
    try {
        $healthResponse = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 5
        if ($healthResponse.success) {
            Write-Host "  ✅ 健康检查通过" -ForegroundColor Green
        } else {
            Write-Host "  ❌ 健康检查失败" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ 健康检查连接失败: $($_.Exception.Message)" -ForegroundColor Red
    }

    # 测试登录接口（如果有测试用户）
    Write-Host "🔐 测试登录接口..." -ForegroundColor Yellow
    try {
        $loginData = @{
            username = "admin"
            password = "admin123"
        } | ConvertTo-Json

        $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/login" -Method POST -Body $loginData -ContentType "application/json" -TimeoutSec 5
        if ($loginResponse.success) {
            Write-Host "  ✅ 登录接口正常" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  登录接口返回失败（可能是用户不存在）" -ForegroundColor Yellow
        }
    } catch {
        if ($_.Exception.Response.StatusCode -eq 401) {
            Write-Host "  ⚠️  登录接口正常（用户名或密码错误）" -ForegroundColor Yellow
        } else {
            Write-Host "  ❌ 登录接口错误: $($_.Exception.Message)" -ForegroundColor Red
        }
    }

    Write-Host "🎉 auth-service 测试完成！" -ForegroundColor Green
    Write-Host "💡 服务运行在: http://localhost:3001" -ForegroundColor Cyan
    Write-Host "💡 健康检查: http://localhost:3001/health" -ForegroundColor Cyan
    Write-Host "💡 API文档: http://localhost:3001/api/v1/auth" -ForegroundColor Cyan

} catch {
    Write-Host "❌ 测试过程中发生错误: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # 清理：停止服务
    if ($process -and !$process.HasExited) {
        Write-Host "🛑 停止服务..." -ForegroundColor Gray
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
    
    Set-Location ../..
}

Write-Host "`n📋 下一步:" -ForegroundColor Yellow
Write-Host "1. 确保PostgreSQL和Redis服务正在运行" -ForegroundColor Gray
Write-Host "2. 运行数据库迁移脚本" -ForegroundColor Gray
Write-Host "3. 创建测试用户数据" -ForegroundColor Gray
Write-Host "4. 启动完整的微服务环境" -ForegroundColor Gray