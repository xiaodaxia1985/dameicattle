#!/usr/bin/env pwsh

# 前端微服务迁移脚本
Write-Host "=== 前端微服务迁移脚本 ===" -ForegroundColor Green
Write-Host "开始将前端API调用迁移到微服务架构..." -ForegroundColor Yellow

# 检查前端目录
$frontendDir = "frontend"
if (-not (Test-Path $frontendDir)) {
    Write-Host "错误: 前端目录不存在: $frontendDir" -ForegroundColor Red
    exit 1
}

Write-Host "1. 检查当前前端API配置..." -ForegroundColor Cyan

# 检查前端API文件
$apiFiles = @(
    "frontend/src/api/auth.ts",
    "frontend/src/api/base.ts", 
    "frontend/src/api/cattle.ts",
    "frontend/src/api/health.ts",
    "frontend/src/api/feeding.ts",
    "frontend/src/api/equipment.ts",
    "frontend/src/api/material.ts",
    "frontend/src/api/purchase.ts",
    "frontend/src/api/sales.ts",
    "frontend/src/api/news.ts",
    "frontend/src/api/user.ts",
    "frontend/src/api/dashboard.ts",
    "frontend/src/api/patrol.ts",
    "frontend/src/api/portal.ts",
    "frontend/src/api/upload.ts"
)

$existingFiles = @()
foreach ($file in $apiFiles) {
    if (Test-Path $file) {
        $existingFiles += $file
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file" -ForegroundColor Red
    }
}

Write-Host "2. 检查微服务状态..." -ForegroundColor Cyan# 
检查微服务状态
$microservices = @(
    "auth-service",
    "base-service", 
    "cattle-service",
    "health-service",
    "feeding-service",
    "equipment-service",
    "material-service",
    "procurement-service",
    "sales-service",
    "news-service",
    "notification-service",
    "file-service",
    "monitoring-service"
)

foreach ($service in $microservices) {
    $servicePath = "microservices/$service"
    if (Test-Path $servicePath) {
        Write-Host "  ✓ $service" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $service" -ForegroundColor Red
    }
}

Write-Host "3. 更新前端微服务配置..." -ForegroundColor Cyan

# 创建微服务配置文件
$microserviceConfig = @"
/**
 * 微服务配置文件
 * 统一管理所有微服务的端点和配置
 */

export interface MicroserviceConfig {
  name: string
  port: number
  baseUrl: string
  healthEndpoint: string
  timeout: number
  retryAttempts: number
}

// 微服务配置映射
export const MICROSERVICE_CONFIGS: Record<string, MicroserviceConfig> = {
  auth: {
    name: 'auth-service',
    port: 3001,
    baseUrl: '/api/v1/auth',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  base: {
    name: 'base-service',
    port: 3002,
    baseUrl: '/api/v1/base',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  cattle: {
    name: 'cattle-service',
    port: 3003,
    baseUrl: '/api/v1/cattle',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  health: {
    name: 'health-service',
    port: 3004,
    baseUrl: '/api/v1/health',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  feeding: {
    name: 'feeding-service',
    port: 3005,
    baseUrl: '/api/v1/feeding',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  equipment: {
    name: 'equipment-service',
    port: 3006,
    baseUrl: '/api/v1/equipment',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  procurement: {
    name: 'procurement-service',
    port: 3007,
    baseUrl: '/api/v1/procurement',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  sales: {
    name: 'sales-service',
    port: 3008,
    baseUrl: '/api/v1/sales',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  material: {
    name: 'material-service',
    port: 3009,
    baseUrl: '/api/v1/material',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  notification: {
    name: 'notification-service',
    port: 3010,
    baseUrl: '/api/v1/notification',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  file: {
    name: 'file-service',
    port: 3011,
    baseUrl: '/api/v1/file',
    healthEndpoint: '/health',
    timeout: 15000,
    retryAttempts: 2
  },
  monitoring: {
    name: 'monitoring-service',
    port: 3012,
    baseUrl: '/api/v1/monitoring',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  },
  news: {
    name: 'news-service',
    port: 3013,
    baseUrl: '/api/v1/news',
    healthEndpoint: '/health',
    timeout: 10000,
    retryAttempts: 3
  }
}

// 获取微服务配置
export function getMicroserviceConfig(serviceName: string): MicroserviceConfig | null {
  return MICROSERVICE_CONFIGS[serviceName] || null
}

// 获取所有微服务配置
export function getAllMicroserviceConfigs(): MicroserviceConfig[] {
  return Object.values(MICROSERVICE_CONFIGS)
}

// 检查微服务是否可用
export async function checkMicroserviceHealth(serviceName: string): Promise<boolean> {
  const config = getMicroserviceConfig(serviceName)
  if (!config) return false
  
  try {
    const response = await fetch(`${config.baseUrl}${config.healthEndpoint}`, {
      method: 'GET',
      timeout: 5000
    })
    return response.ok
  } catch (error) {
    console.error(`微服务 ${serviceName} 健康检查失败:`, error)
    return false
  }
}

export default MICROSERVICE_CONFIGS
"@

$configPath = "frontend/src/config/microservices.ts"
$configDir = Split-Path $configPath -Parent
if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}
$microserviceConfig | Out-File -FilePath $configPath -Encoding UTF8
Write-Host "  ✓ 创建微服务配置文件: $configPath" -ForegroundColor GreenWri
te-Host "4. 更新前端环境配置..." -ForegroundColor Cyan

# 更新开发环境配置
$devEnvPath = "frontend/.env"
if (Test-Path $devEnvPath) {
    $envContent = Get-Content $devEnvPath -Raw
    if ($envContent -notmatch "VITE_USE_MICROSERVICES") {
        Add-Content -Path $devEnvPath -Value "`n# 微服务配置"
        Add-Content -Path $devEnvPath -Value "VITE_USE_MICROSERVICES=true"
        Add-Content -Path $devEnvPath -Value "VITE_API_GATEWAY_URL=http://localhost:3000"
        Add-Content -Path $devEnvPath -Value "VITE_MICROSERVICES_BASE_URL=http://localhost"
        Write-Host "  ✓ 更新开发环境配置: $devEnvPath" -ForegroundColor Green
    } else {
        Write-Host "  ✓ 开发环境配置已存在微服务配置" -ForegroundColor Yellow
    }
} else {
    # 创建新的环境配置文件
    $envContent = @"
# 微服务配置
VITE_USE_MICROSERVICES=true
VITE_API_GATEWAY_URL=http://localhost:3000
VITE_MICROSERVICES_BASE_URL=http://localhost

# API配置
VITE_API_BASE_URL=/api/v1
VITE_API_TIMEOUT=10000

# 开发配置
VITE_DEV_MODE=true
VITE_ENABLE_MOCK=false
"@
    $envContent | Out-File -FilePath $devEnvPath -Encoding UTF8
    Write-Host "  ✓ 创建开发环境配置: $devEnvPath" -ForegroundColor Green
}

Write-Host "5. 检查前端API迁移状态..." -ForegroundColor Cyan

# 检查每个API文件是否已经使用微服务
$migrationStatus = @{}

foreach ($file in $existingFiles) {
    $content = Get-Content $file -Raw
    if ($content -match "from '\./microservices'") {
        $migrationStatus[$file] = "已迁移"
        Write-Host "  ✓ $file - 已使用微服务" -ForegroundColor Green
    } else {
        $migrationStatus[$file] = "未迁移"
        Write-Host "  ⚠ $file - 需要迁移到微服务" -ForegroundColor Yellow
    }
}

Write-Host "6. 生成迁移报告..." -ForegroundColor Cyan

$reportContent = @"
# 前端微服务迁移报告

## 迁移概览
- 总API文件数: $($apiFiles.Count)
- 已存在文件数: $($existingFiles.Count)
- 已迁移文件数: $(($migrationStatus.Values | Where-Object { $_ -eq "已迁移" }).Count)
- 待迁移文件数: $(($migrationStatus.Values | Where-Object { $_ -eq "未迁移" }).Count)

## 详细状态

### 已迁移的API文件
$(($migrationStatus.GetEnumerator() | Where-Object { $_.Value -eq "已迁移" } | ForEach-Object { "- $($_.Key)" }) -join "`n")

### 待迁移的API文件
$(($migrationStatus.GetEnumerator() | Where-Object { $_.Value -eq "未迁移" } | ForEach-Object { "- $($_.Key)" }) -join "`n")

## 微服务配置
- 配置文件: frontend/src/config/microservices.ts
- 环境配置: frontend/.env
- 微服务总数: $($microservices.Count)

## 下一步操作
1. 启动所有微服务
2. 测试前端API调用
3. 验证数据流转
4. 性能优化

生成时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@

$reportPath = "FRONTEND_MICROSERVICE_MIGRATION_REPORT.md"
$reportContent | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "  ✓ 生成迁移报告: $reportPath" -ForegroundColor Green

Write-Host "7. 启动微服务验证..." -ForegroundColor Cyan

# 检查是否有启动脚本
$startScript = "scripts/start-all-microservices.ps1"
if (Test-Path $startScript) {
    Write-Host "  ✓ 发现微服务启动脚本: $startScript" -ForegroundColor Green
    Write-Host "  建议运行: .\$startScript" -ForegroundColor Yellow
} else {
    Write-Host "  ⚠ 未找到微服务启动脚本" -ForegroundColor Yellow
}

Write-Host "`n=== 前端微服务迁移完成 ===" -ForegroundColor Green
Write-Host "迁移状态:" -ForegroundColor Cyan
Write-Host "  - 已迁移: $(($migrationStatus.Values | Where-Object { $_ -eq "已迁移" }).Count) 个文件" -ForegroundColor Green
Write-Host "  - 待迁移: $(($migrationStatus.Values | Where-Object { $_ -eq "未迁移" }).Count) 个文件" -ForegroundColor Yellow
Write-Host "  - 配置文件: 已创建" -ForegroundColor Green
Write-Host "  - 环境配置: 已更新" -ForegroundColor Green

if ($(($migrationStatus.Values | Where-Object { $_ -eq "已迁移" }).Count) -eq $existingFiles.Count) {
    Write-Host "`n🎉 所有API文件已成功迁移到微服务架构!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  还有部分API文件需要手动迁移，请查看报告文件了解详情。" -ForegroundColor Yellow
}

Write-Host "`n建议下一步操作:" -ForegroundColor Cyan
Write-Host "1. 运行 .\scripts\start-all-microservices.ps1 启动所有微服务" -ForegroundColor White
Write-Host "2. 运行 .\scripts\test-frontend-microservices.ps1 测试前端集成" -ForegroundColor White
Write-Host "3. 检查浏览器控制台确认API调用正常" -ForegroundColor White