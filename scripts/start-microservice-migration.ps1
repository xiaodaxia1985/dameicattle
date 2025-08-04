# 微服务迁移启动脚本

param(
    [string]$Mode = "development",
    [string]$Phase = "1",
    [switch]$WithBackend = $true
)

Write-Host "🚀 启动微服务迁移环境 - 阶段 $Phase" -ForegroundColor Green

# 设置环境变量
$env:NODE_ENV = $Mode
$env:MIGRATION_PHASE = $Phase

# 基础设施服务（始终启动）
Write-Host "📦 启动基础设施服务..." -ForegroundColor Yellow
docker-compose -f microservices/docker-compose.yml up -d postgres redis

# 等待数据库启动
Write-Host "⏳ 等待数据库启动..." -ForegroundColor Gray
Start-Sleep -Seconds 10

# 根据阶段启动相应的微服务
switch ($Phase) {
    "1" {
        Write-Host "🔐 阶段1: 启动认证服务" -ForegroundColor Cyan
        docker-compose -f microservices/docker-compose.yml up -d api-gateway auth-service
        
        if ($WithBackend) {
            Write-Host "🏢 同时保持单体后端运行" -ForegroundColor Cyan
            docker-compose up -d backend
        }
    }
    
    "2" {
        Write-Host "🏠 阶段2: 启动基地服务" -ForegroundColor Cyan
        docker-compose -f microservices/docker-compose.yml up -d api-gateway auth-service base-service
        
        if ($WithBackend) {
            docker-compose up -d backend
        }
    }
    
    "3" {
        Write-Host "🐄 阶段3: 启动牛只服务" -ForegroundColor Cyan
        docker-compose -f microservices/docker-compose.yml up -d api-gateway auth-service base-service cattle-service
        
        if ($WithBackend) {
            docker-compose up -d backend
        }
    }
    
    "4" {
        Write-Host "🏥 阶段4: 启动健康服务" -ForegroundColor Cyan
        docker-compose -f microservices/docker-compose.yml up -d api-gateway auth-service base-service cattle-service health-service
        
        if ($WithBackend) {
            docker-compose up -d backend
        }
    }
    
    "5" {
        Write-Host "🌾 阶段5: 启动饲养服务" -ForegroundColor Cyan
        docker-compose -f microservices/docker-compose.yml up -d api-gateway auth-service base-service cattle-service health-service feeding-service
        
        if ($WithBackend) {
            docker-compose up -d backend
        }
    }
    
    "full" {
        Write-Host "🎯 完整微服务环境" -ForegroundColor Cyan
        docker-compose -f microservices/docker-compose.yml up -d
        
        if (-not $WithBackend) {
            Write-Host "⚠️  单体后端已停用，完全使用微服务" -ForegroundColor Yellow
        }
    }
}

# 健康检查
Write-Host "🔍 执行健康检查..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

$services = @(
    @{Name="API网关"; URL="http://localhost:3000/health"},
    @{Name="认证服务"; URL="http://localhost:3001/health"}
)

if ($Phase -ge "2" -or $Phase -eq "full") {
    $services += @{Name="基地服务"; URL="http://localhost:3002/health"}
}

if ($Phase -ge "3" -or $Phase -eq "full") {
    $services += @{Name="牛只服务"; URL="http://localhost:3003/health"}
}

foreach ($service in $services) {
    try {
        $response = Invoke-RestMethod -Uri $service.URL -TimeoutSec 5
        if ($response.status -eq "healthy") {
            Write-Host "  ✅ $($service.Name): 健康" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $($service.Name): 不健康" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ $($service.Name): 无法连接" -ForegroundColor Red
    }
}

# 显示访问信息
Write-Host "`n📋 服务访问信息:" -ForegroundColor Yellow
Write-Host "  API网关: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  认证服务: http://localhost:3001" -ForegroundColor Cyan

if ($Phase -ge "2" -or $Phase -eq "full") {
    Write-Host "  基地服务: http://localhost:3002" -ForegroundColor Cyan
}

if ($Phase -ge "3" -or $Phase -eq "full") {
    Write-Host "  牛只服务: http://localhost:3003" -ForegroundColor Cyan
}

if ($WithBackend) {
    Write-Host "  单体后端: http://localhost:3000 (通过API网关)" -ForegroundColor Gray
}

Write-Host "`n🎉 微服务环境启动完成！" -ForegroundColor Green
Write-Host "💡 提示: 使用 'docker-compose logs -f [service-name]' 查看日志" -ForegroundColor Gray