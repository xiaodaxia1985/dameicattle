# Docker问题修复脚本

Write-Host "🔧 Docker微服务问题诊断和修复..." -ForegroundColor Green

# 检查Docker状态
Write-Host "1️⃣ 检查Docker状态..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✅ Docker运行正常" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker未运行，请启动Docker Desktop" -ForegroundColor Red
    exit 1
}

# 检查Docker Compose文件
Write-Host "2️⃣ 检查Docker Compose配置..." -ForegroundColor Yellow
if (Test-Path "docker-compose.yml") {
    Write-Host "✅ docker-compose.yml 存在" -ForegroundColor Green
} else {
    Write-Host "❌ docker-compose.yml 不存在" -ForegroundColor Red
    exit 1
}

# 检查共享库
Write-Host "3️⃣ 检查共享库..." -ForegroundColor Yellow
if (Test-Path "shared/package.json") {
    Write-Host "✅ 共享库配置存在" -ForegroundColor Green
} else {
    Write-Host "❌ 共享库配置不存在" -ForegroundColor Red
    exit 1
}

# 检查各个微服务的Dockerfile
Write-Host "4️⃣ 检查微服务Dockerfile..." -ForegroundColor Yellow
$services = @(
    "api-gateway", "auth-service", "base-service", "cattle-service",
    "health-service", "feeding-service", "equipment-service", 
    "procurement-service", "sales-service", "material-service",
    "notification-service", "file-service", "monitoring-service"
)

$missingDockerfiles = @()
foreach ($service in $services) {
    if (Test-Path "$service/Dockerfile") {
        Write-Host "✅ $service/Dockerfile 存在" -ForegroundColor Green
    } else {
        Write-Host "❌ $service/Dockerfile 不存在" -ForegroundColor Red
        $missingDockerfiles += $service
    }
}

# 修复缺失的Dockerfile
if ($missingDockerfiles.Count -gt 0) {
    Write-Host "5️⃣ 修复缺失的Dockerfile..." -ForegroundColor Yellow
    foreach ($service in $missingDockerfiles) {
        Write-Host "创建 $service/Dockerfile..." -ForegroundColor Gray
        $dockerfileContent = @"
FROM node:18-alpine

WORKDIR /app

# 复制共享库
COPY shared/ ../shared/
WORKDIR /shared
RUN npm install && npm run build

# 复制服务代码
WORKDIR /app
COPY $service/package*.json ./
RUN npm install

COPY $service/ ./
RUN npm run build

EXPOSE $((3000 + $services.IndexOf($service)))

CMD ["npm", "start"]
"@
        $dockerfileContent | Out-File -FilePath "$service/Dockerfile" -Encoding UTF8
        Write-Host "✅ 已创建 $service/Dockerfile" -ForegroundColor Green
    }
}

# 检查数据库初始化脚本
Write-Host "6️⃣ 检查数据库初始化脚本..." -ForegroundColor Yellow
$initScripts = @(
    "database/init/01-create-databases.sql",
    "database/init/02-seed-auth-data.sql", 
    "database/init/03-create-tables.sql"
)

foreach ($script in $initScripts) {
    if (Test-Path $script) {
        Write-Host "✅ $script 存在" -ForegroundColor Green
    } else {
        Write-Host "❌ $script 不存在" -ForegroundColor Red
    }
}

# 清理Docker资源
Write-Host "7️⃣ 清理Docker资源..." -ForegroundColor Yellow
Write-Host "停止所有容器..." -ForegroundColor Gray
docker-compose down -v

Write-Host "清理未使用的镜像..." -ForegroundColor Gray
docker image prune -f

Write-Host "清理未使用的网络..." -ForegroundColor Gray
docker network prune -f

# 重新构建共享库
Write-Host "8️⃣ 重新构建共享库..." -ForegroundColor Yellow
Set-Location shared
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path "dist") {
    Remove-Item -Recurse -Force dist
}
npm install
npm run build
Set-Location ..

# 构建所有服务镜像
Write-Host "9️⃣ 构建所有服务镜像..." -ForegroundColor Yellow
docker-compose build --no-cache

# 启动基础设施
Write-Host "🔟 启动基础设施服务..." -ForegroundColor Yellow
docker-compose up -d postgres redis

# 等待数据库就绪
Write-Host "⏳ 等待数据库就绪..." -ForegroundColor Yellow
$maxWait = 60
$waited = 0
do {
    Start-Sleep -Seconds 5
    $waited += 5
    Write-Host "等待中... ($waited/$maxWait 秒)" -ForegroundColor Gray
    
    $env:PGPASSWORD = "dianxin99"
    $dbReady = $false
    try {
        $result = psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT 1;" 2>$null
        if ($result -match "1") {
            $dbReady = $true
        }
    } catch {
        # 继续等待
    }
} while (-not $dbReady -and $waited -lt $maxWait)

if ($dbReady) {
    Write-Host "✅ 数据库就绪" -ForegroundColor Green
    
    # 验证数据库初始化
    Write-Host "🔍 验证数据库初始化..." -ForegroundColor Yellow
    & ".\scripts\verify-database.ps1"
    
    # 启动所有微服务
    Write-Host "🚀 启动所有微服务..." -ForegroundColor Yellow
    docker-compose up -d
    
    # 等待服务启动
    Write-Host "⏳ 等待服务启动..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # 健康检查
    Write-Host "🏥 执行健康检查..." -ForegroundColor Yellow
    & ".\scripts\health-check.ps1"
    
    Write-Host "✅ 修复完成！" -ForegroundColor Green
} else {
    Write-Host "❌ 数据库启动失败" -ForegroundColor Red
    Write-Host "请检查Docker日志: docker-compose logs postgres" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 有用的命令:" -ForegroundColor Yellow
Write-Host "查看所有容器状态: docker-compose ps" -ForegroundColor Cyan
Write-Host "查看服务日志: docker-compose logs -f [service-name]" -ForegroundColor Cyan
Write-Host "重启特定服务: docker-compose restart [service-name]" -ForegroundColor Cyan
Write-Host "进入容器调试: docker-compose exec [service-name] sh" -ForegroundColor Cyan