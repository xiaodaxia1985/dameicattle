# 本地PostgreSQL数据库初始化脚本
# PowerShell script for Windows

Write-Host "🗄️  初始化本地PostgreSQL数据库..." -ForegroundColor Green

# 检查PostgreSQL是否运行
Write-Host "📋 检查PostgreSQL连接..." -ForegroundColor Yellow
try {
    $pgConnection = Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet
    if (-not $pgConnection) {
        Write-Host "❌ PostgreSQL未运行，请先启动PostgreSQL服务" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ PostgreSQL连接正常" -ForegroundColor Green
} catch {
    Write-Host "❌ 无法连接到PostgreSQL" -ForegroundColor Red
    exit 1
}

# 数据库列表
$databases = @(
    "auth_db",
    "base_db", 
    "cattle_db",
    "health_db",
    "feeding_db",
    "equipment_db",
    "procurement_db",
    "sales_db",
    "material_db",
    "news_db"
)

Write-Host "🔨 创建微服务数据库..." -ForegroundColor Yellow

foreach ($db in $databases) {
    try {
        # 检查数据库是否存在
        $checkCmd = "psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw $db"
        
        # 创建数据库（如果不存在）
        $createCmd = "createdb -h localhost -U postgres $db"
        
        Write-Host "  创建数据库: $db" -ForegroundColor Cyan
        
        # 使用psql检查数据库是否存在
        $existsQuery = "SELECT 1 FROM pg_database WHERE datname='$db'"
        $result = & psql -h localhost -U postgres -d postgres -t -c $existsQuery 2>$null
        
        if ($result -match "1") {
            Write-Host "    ✅ 数据库 $db 已存在" -ForegroundColor Green
        } else {
            # 创建数据库
            & createdb -h localhost -U postgres $db
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    ✅ 数据库 $db 创建成功" -ForegroundColor Green
            } else {
                Write-Host "    ❌ 数据库 $db 创建失败" -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "    ⚠️  处理数据库 $db 时出错: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "📋 验证数据库创建..." -ForegroundColor Yellow
try {
    Write-Host "当前数据库列表:" -ForegroundColor Cyan
    & psql -h localhost -U postgres -l
} catch {
    Write-Host "❌ 无法列出数据库" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 数据库初始化完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 注意事项:" -ForegroundColor Cyan
Write-Host "  - 确保PostgreSQL服务正在运行" -ForegroundColor White
Write-Host "  - 确保Redis服务正在运行" -ForegroundColor White
Write-Host "  - 数据库用户: postgres" -ForegroundColor White
Write-Host "  - 数据库密码: dianxin99" -ForegroundColor White
Write-Host ""
Write-Host "🚀 现在可以运行微服务启动脚本:" -ForegroundColor Cyan
Write-Host "   .\scripts\start-microservice-dev.ps1" -ForegroundColor White
Write-Host ""