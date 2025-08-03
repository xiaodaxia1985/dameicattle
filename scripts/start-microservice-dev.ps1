# 微服务开发环境一键启动脚本
# PowerShell script for Windows

Write-Host "🚀 启动肉牛管理系统微服务开发环境..." -ForegroundColor Green

# 检查Docker是否运行
Write-Host "📋 检查Docker状态..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    docker version | Out-Null
    $dockerRunning = $true
    Write-Host "✅ Docker运行正常" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker未运行，请先启动Docker Desktop" -ForegroundColor Red
    exit 1
}

# 检查端口占用
Write-Host "📋 检查端口占用..." -ForegroundColor Yellow
$ports = @(3000, 3001, 3002, 3003, 3004, 3005, 5432, 6379)
foreach ($port in $ports) {
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet
        if ($connection) {
            Write-Host "⚠️  端口 $port 已被占用" -ForegroundColor Yellow
        }
    } catch {
        # 忽略连接测试错误
    }
}

# 检查本地数据库服务
Write-Host "📋 检查本地数据库服务..." -ForegroundColor Yellow

# 检查PostgreSQL
$pgRunning = $false
try {
    $pgConnection = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet
    if ($pgConnection) {
        $pgRunning = $true
        Write-Host "✅ PostgreSQL (端口5432) 运行正常" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL (端口5432) 未运行，请启动PostgreSQL服务" -ForegroundColor Red
        Write-Host "   Windows: 服务管理器中启动 postgresql-x64-xx" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ 无法连接到PostgreSQL" -ForegroundColor Red
    exit 1
}

# 检查Redis
$redisRunning = $false
try {
    $redisConnection = Test-NetConnection -ComputerName localhost -Port 6379 -InformationLevel Quiet
    if ($redisConnection) {
        $redisRunning = $true
        Write-Host "✅ Redis (端口6379) 运行正常" -ForegroundColor Green
    } else {
        Write-Host "❌ Redis (端口6379) 未运行，请启动Redis服务" -ForegroundColor Red
        Write-Host "   Windows: redis-server.exe 或服务管理器中启动Redis" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ 无法连接到Redis" -ForegroundColor Red
    exit 1
}

# 启动微服务（使用本地数据库配置）
Write-Host "🐳 启动微服务容器（使用本地数据库）..." -ForegroundColor Yellow
Set-Location microservices

$microserviceStarted = $false
try {
    docker-compose -f docker-compose.local.yml up -d --build
    $microserviceStarted = $true
    Write-Host "✅ 微服务启动成功" -ForegroundColor Green
} catch {
    Write-Host "❌ 微服务启动失败" -ForegroundColor Red
    exit 1
}

# 等待服务启动
Write-Host "⏳ 等待服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 健康检查
Write-Host "🔍 执行健康检查..." -ForegroundColor Yellow

$healthUrls = @(
    "http://localhost:3000/health",
    "http://localhost:3000/api/v1/auth/health",
    "http://localhost:3000/api/v1/base/health",
    "http://localhost:3000/api/v1/cattle/health"
)

$serviceNames = @(
    "API网关",
    "认证服务", 
    "基地服务",
    "牛只服务"
)

for ($i = 0; $i -lt $healthUrls.Length; $i++) {
    try {
        $response = Invoke-RestMethod -Uri $healthUrls[$i] -Method Get -TimeoutSec 5
        if ($response) {
            Write-Host "✅ $($serviceNames[$i]) 健康检查通过" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ $($serviceNames[$i]) 健康检查失败" -ForegroundColor Red
    }
}

# 返回根目录
Set-Location ..

# 启动前端开发服务器
Write-Host "🌐 启动前端开发服务器..." -ForegroundColor Yellow
try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal
} catch {
    Write-Host "⚠️  前端启动可能失败，请手动运行: cd frontend && npm run dev" -ForegroundColor Yellow
}

# 等待前端启动
Start-Sleep -Seconds 5

# 启动小程序开发服务器
Write-Host "📱 启动小程序开发服务器..." -ForegroundColor Yellow
try {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd miniprogram; npm run dev:mp-weixin" -WindowStyle Normal
} catch {
    Write-Host "⚠️  小程序启动可能失败，请手动运行: cd miniprogram && npm run dev:mp-weixin" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 系统启动完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 服务地址:" -ForegroundColor Cyan
Write-Host "  🌐 前端应用: http://localhost:5173" -ForegroundColor White
Write-Host "  🔗 API网关: http://localhost:3000" -ForegroundColor White
Write-Host "  📱 小程序: 微信开发者工具导入 miniprogram 目录" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  管理命令:" -ForegroundColor Cyan
Write-Host "  查看服务状态: docker-compose -f microservices/docker-compose.local.yml ps" -ForegroundColor White
Write-Host "  查看服务日志: docker-compose -f microservices/docker-compose.local.yml logs -f" -ForegroundColor White
Write-Host "  停止所有服务: docker-compose -f microservices/docker-compose.local.yml down" -ForegroundColor White
Write-Host ""
Write-Host "📖 详细文档: MICROSERVICE_INTEGRATION_GUIDE.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")