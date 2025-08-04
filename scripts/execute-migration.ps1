# 完整的微服务迁移执行脚本

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("prepare", "phase1", "phase2", "phase3", "phase4", "phase5", "complete", "rollback")]
    [string]$Action,
    
    [switch]$DryRun = $false,
    [switch]$SkipBackup = $false,
    [switch]$Force = $false
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 微服务迁移执行器 - 操作: $Action" -ForegroundColor Green

# 配置
$BackupDir = "backups/$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$LogFile = "logs/migration_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# 创建必要的目录
New-Item -ItemType Directory -Force -Path "backups", "logs" | Out-Null

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path $LogFile -Value $logMessage
}

function Test-ServiceHealth {
    param([string]$ServiceName, [string]$Url, [int]$TimeoutSeconds = 30)
    
    Write-Log "检查服务健康状态: $ServiceName ($Url)"
    
    $timeout = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $timeout) {
        try {
            $response = Invoke-RestMethod -Uri "$Url/health" -TimeoutSec 5
            if ($response.status -eq "healthy") {
                Write-Log "服务健康: $ServiceName" "SUCCESS"
                return $true
            }
        } catch {
            Write-Log "服务检查失败: $ServiceName - $($_.Exception.Message)" "DEBUG"
        }
        Start-Sleep -Seconds 2
    }
    
    Write-Log "服务不健康: $ServiceName" "ERROR"
    return $false
}

function Backup-Database {
    if ($SkipBackup) {
        Write-Log "跳过数据库备份" "WARN"
        return
    }
    
    Write-Log "开始数据库备份..."
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
    
    $backupFile = "$BackupDir/cattle_management_backup.sql"
    pg_dump -h localhost -U postgres -d cattle_management -f $backupFile
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "数据库备份完成: $backupFile" "SUCCESS"
    } else {
        Write-Log "数据库备份失败" "ERROR"
        throw "数据库备份失败"
    }
}

function Start-Infrastructure {
    Write-Log "启动基础设施服务..."
    
    # 启动PostgreSQL和Redis
    docker-compose -f microservices/docker-compose.yml up -d postgres redis
    
    # 等待数据库启动
    Write-Log "等待数据库启动..."
    Start-Sleep -Seconds 15
    
    # 验证数据库连接
    $dbTest = psql -h localhost -U postgres -d cattle_management -c "SELECT 1;" 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Log "数据库连接失败" "ERROR"
        throw "数据库连接失败"
    }
    
    Write-Log "基础设施服务启动完成" "SUCCESS"
}

function Start-ApiGateway {
    Write-Log "启动API网关..."
    docker-compose -f microservices/docker-compose.yml up -d api-gateway
    
    Start-Sleep -Seconds 10
    
    if (-not (Test-ServiceHealth "API网关" "http://localhost:3000")) {
        throw "API网关启动失败"
    }
}

function Migrate-AuthService {
    Write-Log "迁移认证服务..."
    
    # 数据迁移
    if (-not $DryRun) {
        .\scripts\migrate-to-microservices.ps1 -Phase "auth"
    }
    
    # 启动服务
    docker-compose -f microservices/docker-compose.yml up -d auth-service
    Start-Sleep -Seconds 15
    
    if (-not (Test-ServiceHealth "认证服务" "http://localhost:3001")) {
        throw "认证服务启动失败"
    }
    
    Write-Log "认证服务迁移完成" "SUCCESS"
}

function Migrate-BaseService {
    Write-Log "迁移基地服务..."
    
    if (-not $DryRun) {
        .\scripts\migrate-to-microservices.ps1 -Phase "base"
    }
    
    docker-compose -f microservices/docker-compose.yml up -d base-service
    Start-Sleep -Seconds 15
    
    if (-not (Test-ServiceHealth "基地服务" "http://localhost:3002")) {
        throw "基地服务启动失败"
    }
    
    Write-Log "基地服务迁移完成" "SUCCESS"
}

function Migrate-CattleService {
    Write-Log "迁移牛只服务..."
    
    if (-not $DryRun) {
        .\scripts\migrate-to-microservices.ps1 -Phase "cattle"
    }
    
    docker-compose -f microservices/docker-compose.yml up -d cattle-service
    Start-Sleep -Seconds 15
    
    if (-not (Test-ServiceHealth "牛只服务" "http://localhost:3003")) {
        throw "牛只服务启动失败"
    }
    
    Write-Log "牛只服务迁移完成" "SUCCESS"
}

function Migrate-BusinessServices {
    Write-Log "迁移业务服务..."
    
    $services = @(
        @{Name="健康服务"; Phase="health"; Port=3004},
        @{Name="饲养服务"; Phase="feeding"; Port=3005},
        @{Name="设备服务"; Phase="equipment"; Port=3006},
        @{Name="物料服务"; Phase="material"; Port=3009}
    )
    
    foreach ($service in $services) {
        Write-Log "迁移$($service.Name)..."
        
        if (-not $DryRun) {
            .\scripts\migrate-to-microservices.ps1 -Phase $service.Phase
        }
        
        docker-compose -f microservices/docker-compose.yml up -d "$($service.Phase)-service"
        Start-Sleep -Seconds 10
        
        if (-not (Test-ServiceHealth $service.Name "http://localhost:$($service.Port)")) {
            Write-Log "$($service.Name)启动失败" "ERROR"
        } else {
            Write-Log "$($service.Name)迁移完成" "SUCCESS"
        }
    }
}

function Migrate-TransactionServices {
    Write-Log "迁移交易服务..."
    
    $services = @(
        @{Name="采购服务"; Phase="procurement"; Port=3007},
        @{Name="销售服务"; Phase="sales"; Port=3008}
    )
    
    foreach ($service in $services) {
        Write-Log "迁移$($service.Name)..."
        
        if (-not $DryRun) {
            .\scripts\migrate-to-microservices.ps1 -Phase $service.Phase
        }
        
        docker-compose -f microservices/docker-compose.yml up -d "$($service.Phase)-service"
        Start-Sleep -Seconds 10
        
        if (-not (Test-ServiceHealth $service.Name "http://localhost:$($service.Port)")) {
            Write-Log "$($service.Name)启动失败" "ERROR"
        } else {
            Write-Log "$($service.Name)迁移完成" "SUCCESS"
        }
    }
}

function Start-SupportServices {
    Write-Log "启动支撑服务..."
    
    docker-compose -f microservices/docker-compose.yml up -d notification-service file-service monitoring-service
    Start-Sleep -Seconds 15
    
    $supportServices = @(
        @{Name="通知服务"; Port=3010},
        @{Name="文件服务"; Port=3011},
        @{Name="监控服务"; Port=3012}
    )
    
    foreach ($service in $supportServices) {
        if (Test-ServiceHealth $service.Name "http://localhost:$($service.Port)") {
            Write-Log "$($service.Name)启动成功" "SUCCESS"
        } else {
            Write-Log "$($service.Name)启动失败" "WARN"
        }
    }
}

function Test-SystemIntegration {
    Write-Log "执行系统集成测试..."
    
    # 测试API网关路由
    $testEndpoints = @(
        "http://localhost:3000/api/v1/auth/health",
        "http://localhost:3000/api/v1/base/health",
        "http://localhost:3000/api/v1/cattle/health"
    )
    
    $allPassed = $true
    foreach ($endpoint in $testEndpoints) {
        try {
            $response = Invoke-RestMethod -Uri $endpoint -TimeoutSec 10
            if ($response.status -eq "healthy") {
                Write-Log "集成测试通过: $endpoint" "SUCCESS"
            } else {
                Write-Log "集成测试失败: $endpoint" "ERROR"
                $allPassed = $false
            }
        } catch {
            Write-Log "集成测试异常: $endpoint - $($_.Exception.Message)" "ERROR"
            $allPassed = $false
        }
    }
    
    if ($allPassed) {
        Write-Log "系统集成测试全部通过" "SUCCESS"
    } else {
        Write-Log "系统集成测试存在失败" "ERROR"
        if (-not $Force) {
            throw "集成测试失败"
        }
    }
}

function Stop-Backend {
    Write-Log "停止单体后端服务..."
    docker-compose stop backend
    Write-Log "单体后端服务已停止" "SUCCESS"
}

function Rollback-Migration {
    Write-Log "开始回滚迁移..."
    
    # 停止所有微服务
    docker-compose -f microservices/docker-compose.yml down
    
    # 恢复数据库备份
    if (-not $SkipBackup) {
        $latestBackup = Get-ChildItem -Path "backups" -Directory | Sort-Object Name -Descending | Select-Object -First 1
        if ($latestBackup) {
            $backupFile = "$($latestBackup.FullName)/cattle_management_backup.sql"
            if (Test-Path $backupFile) {
                Write-Log "恢复数据库备份: $backupFile"
                psql -h localhost -U postgres -d cattle_management -f $backupFile
                Write-Log "数据库恢复完成" "SUCCESS"
            }
        }
    }
    
    # 重启单体应用
    docker-compose up -d backend
    Start-Sleep -Seconds 20
    
    if (Test-ServiceHealth "单体后端" "http://localhost:3000") {
        Write-Log "回滚完成，单体应用已恢复" "SUCCESS"
    } else {
        Write-Log "回滚失败，单体应用启动异常" "ERROR"
    }
}

# 主执行逻辑
try {
    Write-Log "开始执行迁移操作: $Action"
    
    switch ($Action) {
        "prepare" {
            Write-Log "=== 准备阶段 ==="
            Backup-Database
            Start-Infrastructure
            Start-ApiGateway
        }
        
        "phase1" {
            Write-Log "=== 阶段1: 认证服务迁移 ==="
            Migrate-AuthService
        }
        
        "phase2" {
            Write-Log "=== 阶段2: 基地服务迁移 ==="
            Migrate-BaseService
        }
        
        "phase3" {
            Write-Log "=== 阶段3: 牛只服务迁移 ==="
            Migrate-CattleService
        }
        
        "phase4" {
            Write-Log "=== 阶段4: 业务服务迁移 ==="
            Migrate-BusinessServices
        }
        
        "phase5" {
            Write-Log "=== 阶段5: 交易服务迁移 ==="
            Migrate-TransactionServices
        }
        
        "complete" {
            Write-Log "=== 完成迁移 ==="
            Start-SupportServices
            Test-SystemIntegration
            Stop-Backend
            Write-Log "🎉 微服务迁移完成！" "SUCCESS"
        }
        
        "rollback" {
            Write-Log "=== 回滚迁移 ==="
            Rollback-Migration
        }
    }
    
    Write-Log "操作完成: $Action" "SUCCESS"
    
} catch {
    Write-Log "操作失败: $Action - $($_.Exception.Message)" "ERROR"
    
    if (-not $Force) {
        Write-Log "建议执行回滚操作: .\scripts\execute-migration.ps1 -Action rollback" "WARN"
    }
    
    exit 1
}

# 显示当前状态
Write-Log "=== 当前系统状态 ==="
$services = @(
    @{Name="API网关"; Url="http://localhost:3000"},
    @{Name="认证服务"; Url="http://localhost:3001"},
    @{Name="基地服务"; Url="http://localhost:3002"},
    @{Name="牛只服务"; Url="http://localhost:3003"}
)

foreach ($service in $services) {
    if (Test-ServiceHealth $service.Name $service.Url 5) {
        Write-Log "$($service.Name): ✅ 运行中" "INFO"
    } else {
        Write-Log "$($service.Name): ❌ 未运行" "INFO"
    }
}

Write-Log "迁移日志已保存到: $LogFile" "INFO"