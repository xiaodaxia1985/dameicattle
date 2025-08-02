# 验证数据库初始化脚本

Write-Host "🔍 验证数据库初始化状态..." -ForegroundColor Green

# 数据库连接参数
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_USER = "postgres"
$DB_PASSWORD = "dianxin99"

# 要检查的数据库列表
$databases = @(
    "auth_db",
    "base_db", 
    "cattle_db",
    "health_db",
    "feeding_db",
    "equipment_db",
    "procurement_db",
    "sales_db",
    "material_db"
)

Write-Host "📊 检查数据库是否存在..." -ForegroundColor Yellow

foreach ($db in $databases) {
    Write-Host "检查数据库 $db... " -NoNewline
    
    $env:PGPASSWORD = $DB_PASSWORD
    $result = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$db';" 2>$null
    
    if ($result -match "1") {
        Write-Host "✅ 存在" -ForegroundColor Green
    } else {
        Write-Host "❌ 不存在" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "👤 检查认证服务用户表..." -ForegroundColor Yellow

$env:PGPASSWORD = $DB_PASSWORD
$userCount = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d auth_db -t -c "SELECT COUNT(*) FROM users;" 2>$null

if ($userCount -match "\d+") {
    $count = $userCount.Trim()
    Write-Host "✅ 用户表存在，包含 $count 个用户" -ForegroundColor Green
} else {
    Write-Host "❌ 用户表不存在或查询失败" -ForegroundColor Red
}

Write-Host ""
Write-Host "🏗️ 检查各服务表结构..." -ForegroundColor Yellow

$tableChecks = @(
    @{db="base_db"; table="bases"; desc="基地表"},
    @{db="base_db"; table="barns"; desc="牛舍表"},
    @{db="cattle_db"; table="cattle"; desc="牛只表"},
    @{db="health_db"; table="health_records"; desc="健康记录表"},
    @{db="feeding_db"; table="feed_formulas"; desc="饲料配方表"},
    @{db="equipment_db"; table="equipment"; desc="设备表"},
    @{db="procurement_db"; table="suppliers"; desc="供应商表"},
    @{db="sales_db"; table="customers"; desc="客户表"},
    @{db="material_db"; table="materials"; desc="物料表"}
)

foreach ($check in $tableChecks) {
    Write-Host "检查 $($check.desc)... " -NoNewline
    
    $env:PGPASSWORD = $DB_PASSWORD
    $result = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $check.db -t -c "SELECT 1 FROM information_schema.tables WHERE table_name='$($check.table)';" 2>$null
    
    if ($result -match "1") {
        Write-Host "✅ 存在" -ForegroundColor Green
    } else {
        Write-Host "❌ 不存在" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔧 如果发现问题，请运行以下命令重新初始化数据库:" -ForegroundColor Yellow
Write-Host "docker-compose down -v" -ForegroundColor Cyan
Write-Host "docker-compose up -d postgres" -ForegroundColor Cyan
Write-Host "Start-Sleep -Seconds 30" -ForegroundColor Cyan
Write-Host "docker-compose up -d" -ForegroundColor Cyan