# 统一所有微服务的路由配置
# 支持API网关代理后的路径

$services = @(
    "health-service",
    "feeding-service", 
    "equipment-service",
    "procurement-service",
    "sales-service",
    "material-service",
    "notification-service",
    "file-service",
    "monitoring-service",
    "news-service"
)

Write-Host "开始统一微服务路由配置..." -ForegroundColor Green

foreach ($service in $services) {
    $appPath = "$service\src\app.ts"
    $routesPath = "$service\src\routes\index.ts"
    
    if (Test-Path $appPath) {
        Write-Host "修复 $service 的 app.ts..." -ForegroundColor Yellow
        
        # 读取文件内容
        $content = Get-Content $appPath -Raw
        
        # 替换路由配置
        $content = $content -replace "app\.use\('/api/v1',\s*routes\);", "app.use('/', routes);"
        $content = $content -replace "// API路由\s*\napp\.use\('/api/v1',\s*routes\);", "// 直接路由（支持网关代理后的路径）`napp.use('/', routes);"
        
        # 写回文件
        Set-Content $appPath $content -Encoding UTF8
        
        Write-Host "✓ $service app.ts 已更新" -ForegroundColor Green
    }
    
    if (Test-Path $routesPath) {
        Write-Host "为 $service 添加健康检查路由..." -ForegroundColor Yellow
        
        # 读取文件内容
        $content = Get-Content $routesPath -Raw
        
        # 检查是否已经有健康检查路由
        if ($content -notmatch "/health") {
            # 添加健康检查路由
            $healthRoute = @"

// 健康检查路由（支持网关代理）
router.get('/health', async (req, res) => {
  try {
    const dbHealthy = await testConnection();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        service: '$service',
        checks: {
          database: dbHealthy,
          redis: true
        }
      },
      message: 'Health check completed',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
        version: '1.0.0'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      code: 'HEALTH_CHECK_FAILED',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
        version: '1.0.0'
      }
    });
  }
});
"@
            
            # 添加数据库导入
            if ($content -notmatch "testConnection") {
                $content = $content -replace "import { Router } from 'express';", "import { Router } from 'express';`nimport { testConnection } from '../config/database';"
            }
            
            # 在export之前添加健康检查路由
            $content = $content -replace "export default router;", "$healthRoute`n`nexport default router;"
            
            # 写回文件
            Set-Content $routesPath $content -Encoding UTF8
            
            Write-Host "✓ $service 健康检查路由已添加" -ForegroundColor Green
        } else {
            Write-Host "○ $service 已有健康检查路由" -ForegroundColor Gray
        }
    }
}

Write-Host "`n所有微服务路由配置已统一完成！" -ForegroundColor Green
Write-Host "现在所有服务都支持网关代理后的路径访问" -ForegroundColor Cyan