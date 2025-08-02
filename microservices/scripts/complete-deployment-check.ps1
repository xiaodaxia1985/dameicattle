# 完整的微服务部署检查脚本

Write-Host "🔍 完整的微服务部署检查..." -ForegroundColor Green

# 1. 检查Docker环境
Write-Host "1️⃣ 检查Docker环境..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker版本: $dockerVersion" -ForegroundColor Green
    
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose版本: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker或Docker Compose未安装" -ForegroundColor Red
    exit 1
}

# 2. 检查项目结构
Write-Host "2️⃣ 检查项目结构..." -ForegroundColor Yellow
$requiredFiles = @(
    "docker-compose.yml",
    "shared/package.json",
    "database/init/01-create-databases.sql",
    "database/init/02-seed-auth-data.sql",
    "database/init/03-create-tables.sql"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file 存在" -ForegroundColor Green
    } else {
        Write-Host "❌ $file 缺失" -ForegroundColor Red
    }
}

# 3. 检查微服务配置
Write-Host "3️⃣ 检查微服务配置..." -ForegroundColor Yellow
$services = @(
    "api-gateway", "auth-service", "base-service", "cattle-service",
    "health-service", "feeding-service", "equipment-service", 
    "procurement-service", "sales-service", "material-service",
    "notification-service", "file-service", "monitoring-service"
)

foreach ($service in $services) {
    $hasPackageJson = Test-Path "$service/package.json"
    $hasDockerfile = Test-Path "$service/Dockerfile"
    $hasSrcDir = Test-Path "$service/src"
    
    if ($hasPackageJson -and $hasDockerfile -and $hasSrcDir) {
        Write-Host "✅ $service 配置完整" -ForegroundColor Green
    } else {
        Write-Host "❌ $service 配置不完整" -ForegroundColor Red
        if (-not $hasPackageJson) { Write-Host "   缺少 package.json" -ForegroundColor Gray }
        if (-not $hasDockerfile) { Write-Host "   缺少 Dockerfile" -ForegroundColor Gray }
        if (-not $hasSrcDir) { Write-Host "   缺少 src 目录" -ForegroundColor Gray }
    }
}

# 4. 构建和启动服务
Write-Host "4️⃣ 构建和启动服务..." -ForegroundColor Yellow

# 停止现有服务
Write-Host "停止现有服务..." -ForegroundColor Gray
docker-compose down -v

# 构建共享库
Write-Host "构建共享库..." -ForegroundColor Gray
Set-Location shared
npm install --silent
npm run build --silent
Set-Location ..

# 构建所有镜像
Write-Host "构建Docker镜像..." -ForegroundColor Gray
docker-compose build --quiet

# 启动基础设施
Write-Host "启动基础设施..." -ForegroundColor Gray
docker-compose up -d postgres redis

# 等待数据库就绪
Write-Host "等待数据库就绪..." -ForegroundColor Gray
$maxWait = 60
$waited = 0
$dbReady = $false

do {
    Start-Sleep -Seconds 3
    $waited += 3
    
    $env:PGPASSWORD = "dianxin99"
    try {
        $result = psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT 1;" 2>$null
        if ($result -match "1") {
            $dbReady = $true
        }
    } catch {
        # 继续等待
    }
} while (-not $dbReady -and $waited -lt $maxWait)

if (-not $dbReady) {
    Write-Host "❌ 数据库启动超时" -ForegroundColor Red
    exit 1
}

# 启动所有微服务
Write-Host "启动所有微服务..." -ForegroundColor Gray
docker-compose up -d

# 等待服务启动
Write-Host "等待服务启动..." -ForegroundColor Gray
Start-Sleep -Seconds 30

# 5. 验证数据库初始化
Write-Host "5️⃣ 验证数据库初始化..." -ForegroundColor Yellow
$databases = @("auth_db", "base_db", "cattle_db", "health_db", "feeding_db", "equipment_db", "procurement_db", "sales_db", "material_db")
$dbInitSuccess = $true

foreach ($db in $databases) {
    $env:PGPASSWORD = "dianxin99"
    $result = psql -h localhost -p 5432 -U postgres -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$db';" 2>$null
    
    if ($result -and $result.ToString().Contains("1")) {
        Write-Host "✅ 数据库 $db 已创建" -ForegroundColor Green
    } else {
        Write-Host "❌ 数据库 $db 未创建" -ForegroundColor Red
        $dbInitSuccess = $false
    }
}

# 检查用户表
$env:PGPASSWORD = "dianxin99"
$userCount = psql -h localhost -p 5432 -U postgres -d auth_db -t -c "SELECT COUNT(*) FROM users;" 2>$null
if ($userCount -and $userCount.ToString().Trim() -match "^\d+$" -and [int]$userCount.Trim() -gt 0) {
    Write-Host "✅ 用户表已初始化，包含 $($userCount.Trim()) 个用户" -ForegroundColor Green
} else {
    Write-Host "❌ 用户表未正确初始化" -ForegroundColor Red
    $dbInitSuccess = $false
}

# 6. 健康检查
Write-Host "6️⃣ 服务健康检查..." -ForegroundColor Yellow
$healthCheckResults = @{}

foreach ($service in $services) {
    $port = 3000 + $services.IndexOf($service)
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$port/health" -TimeoutSec 10 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $service (端口 $port) 健康" -ForegroundColor Green
            $healthCheckResults[$service] = $true
        } else {
            Write-Host "❌ $service (端口 $port) 不健康 - 状态码: $($response.StatusCode)" -ForegroundColor Red
            $healthCheckResults[$service] = $false
        }
    } catch {
        Write-Host "❌ $service (端口 $port) 连接失败" -ForegroundColor Red
        $healthCheckResults[$service] = $false
    }
}

# 7. 容器状态检查
Write-Host "7️⃣ 容器状态检查..." -ForegroundColor Yellow
$containerStatus = docker-compose ps --format "table {{.Name}}\t{{.State}}\t{{.Status}}"
Write-Host $containerStatus

# 8. 生成报告
Write-Host "8️⃣ 部署报告..." -ForegroundColor Yellow
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "微服务部署检查报告" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

$healthyServices = ($healthCheckResults.Values | Where-Object { $_ -eq $true }).Count
$totalServices = $healthCheckResults.Count

Write-Host "数据库初始化: $(if ($dbInitSuccess) { '✅ 成功' } else { '❌ 失败' })" -ForegroundColor $(if ($dbInitSuccess) { 'Green' } else { 'Red' })
Write-Host "健康服务数量: $healthyServices / $totalServices" -ForegroundColor $(if ($healthyServices -eq $totalServices) { 'Green' } else { 'Yellow' })

if ($healthyServices -eq $totalServices -and $dbInitSuccess) {
    Write-Host "🎉 所有服务部署成功！" -ForegroundColor Green
} else {
    Write-Host "⚠️ 部分服务存在问题，请检查日志" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🌐 服务访问地址:" -ForegroundColor Yellow
Write-Host "API网关: http://localhost:3000" -ForegroundColor Cyan
Write-Host "认证服务: http://localhost:3001" -ForegroundColor Cyan
Write-Host "基地服务: http://localhost:3002" -ForegroundColor Cyan
Write-Host "牛只服务: http://localhost:3003" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 有用的命令:" -ForegroundColor Yellow
Write-Host "查看所有容器: docker-compose ps" -ForegroundColor Cyan
Write-Host "查看服务日志: docker-compose logs -f [service-name]" -ForegroundColor Cyan
Write-Host "重启服务: docker-compose restart [service-name]" -ForegroundColor Cyan
Write-Host "停止所有服务: docker-compose down" -ForegroundColor Cyan