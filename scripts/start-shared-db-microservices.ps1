# 共享数据库微服务启动脚本

param(
    [string]$Mode = "development",
    [string]$Services = "all",
    [switch]$Build = $false,
    [switch]$Logs = $false
)

Write-Host "🚀 启动共享数据库微服务架构" -ForegroundColor Green
Write-Host "模式: $Mode | 服务: $Services" -ForegroundColor Cyan

# 设置环境变量
$env:NODE_ENV = $Mode

# 构建参数
$buildFlag = if ($Build) { "--build" } else { "" }

# 进入微服务目录
Set-Location microservices

try {
    switch ($Services) {
        "infrastructure" {
            Write-Host "📦 启动基础设施服务..." -ForegroundColor Yellow
            docker-compose up -d $buildFlag postgres redis
        }
        
        "backend" {
            Write-Host "🏢 启动后端服务..." -ForegroundColor Yellow
            docker-compose up -d $buildFlag backend
        }
        
        "gateway" {
            Write-Host "🌐 启动API网关..." -ForegroundColor Yellow
            docker-compose up -d $buildFlag api-gateway
        }
        
        "core" {
            Write-Host "🔧 启动核心微服务..." -ForegroundColor Yellow
            docker-compose up -d $buildFlag auth-service base-service cattle-service health-service
        }
        
        "business" {
            Write-Host "💼 启动业务微服务..." -ForegroundColor Yellow
            docker-compose up -d $buildFlag feeding-service equipment-service material-service
        }
        
        "transaction" {
            Write-Host "💰 启动交易微服务..." -ForegroundColor Yellow
            docker-compose up -d $buildFlag procurement-service sales-service
        }
        
        "support" {
            Write-Host "🛠️ 启动支撑微服务..." -ForegroundColor Yellow
            docker-compose up -d $buildFlag notification-service file-service monitoring-service
        }
        
        "all" {
            Write-Host "🎯 启动所有服务..." -ForegroundColor Yellow
            docker-compose up -d $buildFlag
        }
        
        default {
            Write-Host "❌ 未知服务组: $Services" -ForegroundColor Red
            Write-Host "可用选项: infrastructure, backend, gateway, core, business, transaction, support, all" -ForegroundColor Gray
            exit 1
        }
    }
    
    # 等待服务启动
    Write-Host "⏳ 等待服务启动..." -ForegroundColor Gray
    Start-Sleep -Seconds 10
    
    # 健康检查
    Write-Host "🔍 执行健康检查..." -ForegroundColor Yellow
    
    $healthChecks = @()
    
    if ($Services -eq "all" -or $Services -eq "infrastructure") {
        $healthChecks += @{Name="PostgreSQL"; Command="docker exec microservices-postgres-1 pg_isready -U postgres"}
        $healthChecks += @{Name="Redis"; Command="docker exec microservices-redis-1 redis-cli ping"}
    }
    
    if ($Services -eq "all" -or $Services -eq "backend") {
        $healthChecks += @{Name="Backend"; Url="http://localhost:3100/health"}
    }
    
    if ($Services -eq "all" -or $Services -eq "gateway") {
        $healthChecks += @{Name="API网关"; Url="http://localhost:3000/health"}
    }
    
    if ($Services -eq "all" -or $Services -eq "core") {
        $healthChecks += @{Name="认证服务"; Url="http://localhost:3001/health"}
        $healthChecks += @{Name="基地服务"; Url="http://localhost:3002/health"}
        $healthChecks += @{Name="牛只服务"; Url="http://localhost:3003/health"}
        $healthChecks += @{Name="健康服务"; Url="http://localhost:3004/health"}
    }
    
    foreach ($check in $healthChecks) {
        try {
            if ($check.Command) {
                $result = Invoke-Expression $check.Command 2>$null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  ✅ $($check.Name): 健康" -ForegroundColor Green
                } else {
                    Write-Host "  ❌ $($check.Name): 不健康" -ForegroundColor Red
                }
            } elseif ($check.Url) {
                $response = Invoke-RestMethod -Uri $check.Url -TimeoutSec 5 -ErrorAction SilentlyContinue
                if ($response.status -eq "healthy") {
                    Write-Host "  ✅ $($check.Name): 健康" -ForegroundColor Green
                } else {
                    Write-Host "  ❌ $($check.Name): 不健康" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host "  ❌ $($check.Name): 无法连接" -ForegroundColor Red
        }
    }
    
    # 显示服务信息
    Write-Host "`n📋 服务访问信息:" -ForegroundColor Yellow
    Write-Host "  🌐 API网关: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "  🏢 后端服务: http://localhost:3100" -ForegroundColor Cyan
    Write-Host "  🔐 认证服务: http://localhost:3001" -ForegroundColor Cyan
    Write-Host "  🏠 基地服务: http://localhost:3002" -ForegroundColor Cyan
    Write-Host "  🐄 牛只服务: http://localhost:3003" -ForegroundColor Cyan
    Write-Host "  🏥 健康服务: http://localhost:3004" -ForegroundColor Cyan
    Write-Host "  🌾 饲养服务: http://localhost:3005" -ForegroundColor Cyan
    Write-Host "  ⚙️  设备服务: http://localhost:3006" -ForegroundColor Cyan
    Write-Host "  📦 物料服务: http://localhost:3009" -ForegroundColor Cyan
    
    Write-Host "`n🎉 微服务启动完成！" -ForegroundColor Green
    
    # 显示日志
    if ($Logs) {
        Write-Host "`n📄 显示服务日志..." -ForegroundColor Yellow
        docker-compose logs -f
    } else {
        Write-Host "💡 使用 -Logs 参数查看实时日志" -ForegroundColor Gray
        Write-Host "💡 使用 'docker-compose logs -f [service-name]' 查看特定服务日志" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ 启动失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    Set-Location ..
}

Write-Host "`n🔧 常用命令:" -ForegroundColor Yellow
Write-Host "  停止所有服务: docker-compose -f microservices/docker-compose.yml down" -ForegroundColor Gray
Write-Host "  查看服务状态: docker-compose -f microservices/docker-compose.yml ps" -ForegroundColor Gray
Write-Host "  重启服务: docker-compose -f microservices/docker-compose.yml restart [service-name]" -ForegroundColor Gray