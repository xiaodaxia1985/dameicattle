# 修复后的微服务测试脚本

Write-Host "🧪 测试所有微服务..." -ForegroundColor Green

$services = @(
    @{Name="auth-service"; Port=3001; Status="完整"},
    @{Name="base-service"; Port=3002; Status="完整"},
    @{Name="cattle-service"; Port=3003; Status="基础结构"},
    @{Name="health-service"; Port=3004; Status="基础结构"},
    @{Name="feeding-service"; Port=3005; Status="基础结构"},
    @{Name="equipment-service"; Port=3006; Status="基础结构"},
    @{Name="procurement-service"; Port=3007; Status="基础结构"},
    @{Name="sales-service"; Port=3008; Status="基础结构"},
    @{Name="material-service"; Port=3009; Status="基础结构"}
)

$completeServices = @()
$incompleteServices = @()

foreach ($service in $services) {
    $serviceName = $service.Name
    $port = $service.Port
    $status = $service.Status
    
    Write-Host "🔍 检查 $serviceName..." -ForegroundColor Yellow
    
    $servicePath = "microservices/$serviceName"
    $hasStructure = $false
    $hasPackageJson = $false
    $hasAppTs = $false
    $hasDockerfile = $false
    
    # 检查目录结构
    if (Test-Path $servicePath) {
        $hasStructure = $true
        Write-Host "  ✅ 目录结构存在" -ForegroundColor Green
        
        if (Test-Path "$servicePath/package.json") {
            $hasPackageJson = $true
            Write-Host "  ✅ package.json 存在" -ForegroundColor Green
        } else {
            Write-Host "  ❌ package.json 缺失" -ForegroundColor Red
        }
        
        if (Test-Path "$servicePath/src/app.ts") {
            $hasAppTs = $true
            Write-Host "  ✅ app.ts 存在" -ForegroundColor Green
        } else {
            Write-Host "  ❌ app.ts 缺失" -ForegroundColor Red
        }
        
        if (Test-Path "$servicePath/Dockerfile") {
            $hasDockerfile = $true
            Write-Host "  ✅ Dockerfile 存在" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Dockerfile 缺失" -ForegroundColor Red
        }
    } else {
        Write-Host "  ❌ 目录结构不存在" -ForegroundColor Red
    }
    
    # 分类服务
    if ($hasStructure -and $hasPackageJson -and $hasDockerfile) {
        $completeServices += $service
    } else {
        $incompleteServices += $service
    }
    
    Write-Host ""
}

# 汇总报告
Write-Host "📊 汇总报告:" -ForegroundColor Yellow

$completeCount = $completeServices.Count
Write-Host "✅ 结构完整的微服务 ($completeCount 个):" -ForegroundColor Green
foreach ($service in $completeServices) {
    $name = $service.Name
    $port = $service.Port
    $status = $service.Status
    Write-Host "  - $name (端口: $port, 状态: $status)" -ForegroundColor Cyan
}

$incompleteCount = $incompleteServices.Count
if ($incompleteCount -gt 0) {
    Write-Host "❌ 结构不完整的微服务 ($incompleteCount 个):" -ForegroundColor Red
    foreach ($service in $incompleteServices) {
        $name = $service.Name
        $port = $service.Port
        Write-Host "  - $name (端口: $port)" -ForegroundColor Yellow
    }
}

Write-Host "`n🎯 下一步建议:" -ForegroundColor Yellow
Write-Host "1. 为每个微服务添加具体的业务逻辑" -ForegroundColor Gray
Write-Host "2. 从backend复制对应的Controller、Model、Route文件" -ForegroundColor Gray
Write-Host "3. 更新API网关配置" -ForegroundColor Gray
Write-Host "4. 启动测试各个微服务" -ForegroundColor Gray

Write-Host "`n💡 测试命令:" -ForegroundColor Yellow
Write-Host "# 测试完整的服务" -ForegroundColor Gray
Write-Host "cd microservices/auth-service; npm install; npm run dev" -ForegroundColor Cyan
Write-Host "cd microservices/base-service; npm install; npm run dev" -ForegroundColor Cyan

Write-Host "`n🔍 健康检查URL:" -ForegroundColor Yellow
foreach ($service in $services) {
    $name = $service.Name
    $port = $service.Port
    Write-Host "http://localhost:$port/health  # $name" -ForegroundColor Cyan
}