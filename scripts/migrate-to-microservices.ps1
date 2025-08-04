# 微服务数据迁移脚本

param(
    [string]$Phase = "all",
    [switch]$DryRun = $false
)

Write-Host "🚀 开始微服务数据迁移 - 阶段: $Phase" -ForegroundColor Green

# 数据库连接配置
$SourceDB = "cattle_management"
$PostgresUser = "postgres"
$PostgresPassword = "dianxin99"
$PostgresHost = "localhost"

function Invoke-Migration {
    param(
        [string]$ServiceName,
        [string]$TargetDB,
        [string[]]$Tables
    )
    
    Write-Host "📦 迁移 $ServiceName 服务数据..." -ForegroundColor Yellow
    
    if ($DryRun) {
        Write-Host "  [DRY RUN] 将迁移表: $($Tables -join ', ')" -ForegroundColor Cyan
        return
    }
    
    # 创建目标数据库
    $createDbCmd = "CREATE DATABASE $TargetDB;"
    psql -h $PostgresHost -U $PostgresUser -c $createDbCmd 2>$null
    
    # 迁移表结构和数据
    foreach ($table in $Tables) {
        Write-Host "  迁移表: $table" -ForegroundColor Gray
        
        # 导出表结构
        pg_dump -h $PostgresHost -U $PostgresUser -d $SourceDB -t $table --schema-only | `
        psql -h $PostgresHost -U $PostgresUser -d $TargetDB
        
        # 导出数据
        pg_dump -h $PostgresHost -U $PostgresUser -d $SourceDB -t $table --data-only | `
        psql -h $PostgresHost -U $PostgresUser -d $TargetDB
    }
    
    Write-Host "  ✅ $ServiceName 服务数据迁移完成" -ForegroundColor Green
}

# 阶段1: 认证服务
if ($Phase -eq "auth" -or $Phase -eq "all") {
    Invoke-Migration -ServiceName "认证" -TargetDB "auth_db" -Tables @(
        "users", "roles", "permissions", "user_roles", "role_permissions"
    )
}

# 阶段2: 基地服务
if ($Phase -eq "base" -or $Phase -eq "all") {
    Invoke-Migration -ServiceName "基地" -TargetDB "base_db" -Tables @(
        "bases", "barns"
    )
}

# 阶段3: 牛只服务
if ($Phase -eq "cattle" -or $Phase -eq "all") {
    Invoke-Migration -ServiceName "牛只" -TargetDB "cattle_db" -Tables @(
        "cattle", "cattle_batches", "cattle_events"
    )
}

# 阶段4: 健康服务
if ($Phase -eq "health" -or $Phase -eq "all") {
    Invoke-Migration -ServiceName "健康" -TargetDB "health_db" -Tables @(
        "health_records", "vaccination_records", "disease_records"
    )
}

# 阶段5: 饲养服务
if ($Phase -eq "feeding" -or $Phase -eq "all") {
    Invoke-Migration -ServiceName "饲养" -TargetDB "feeding_db" -Tables @(
        "feeding_records", "feed_formulas", "feeding_plans"
    )
}

# 阶段6: 设备服务
if ($Phase -eq "equipment" -or $Phase -eq "all") {
    Invoke-Migration -ServiceName "设备" -TargetDB "equipment_db" -Tables @(
        "production_equipment", "equipment_categories", 
        "equipment_maintenance_records", "equipment_maintenance_plans",
        "equipment_failures", "iot_devices"
    )
}

# 阶段7: 物料服务
if ($Phase -eq "material" -or $Phase -eq "all") {
    Invoke-Migration -ServiceName "物料" -TargetDB "material_db" -Tables @(
        "production_materials", "material_categories",
        "inventory", "inventory_transactions", "inventory_alerts"
    )
}

# 阶段8: 采购服务
if ($Phase -eq "procurement" -or $Phase -eq "all") {
    Invoke-Migration -ServiceName "采购" -TargetDB "procurement_db" -Tables @(
        "suppliers", "purchase_orders", "purchase_order_items"
    )
}

# 阶段9: 销售服务
if ($Phase -eq "sales" -or $Phase -eq "all") {
    Invoke-Migration -ServiceName "销售" -TargetDB "sales_db" -Tables @(
        "customers", "sales_orders", "sales_order_items", "customer_visit_records"
    )
}

Write-Host "🎉 微服务数据迁移完成！" -ForegroundColor Green

# 验证迁移结果
if (-not $DryRun) {
    Write-Host "📊 验证迁移结果..." -ForegroundColor Yellow
    
    $services = @(
        @{Name="认证"; DB="auth_db"; Table="users"},
        @{Name="基地"; DB="base_db"; Table="bases"},
        @{Name="牛只"; DB="cattle_db"; Table="cattle"}
    )
    
    foreach ($service in $services) {
        $count = psql -h $PostgresHost -U $PostgresUser -d $service.DB -t -c "SELECT COUNT(*) FROM $($service.Table);"
        Write-Host "  $($service.Name)服务 - $($service.Table)表: $count 条记录" -ForegroundColor Cyan
    }
}