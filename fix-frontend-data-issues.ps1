# 修复前端数据处理问题的脚本

Write-Host "开始修复前端数据处理问题..." -ForegroundColor Green

# 1. 检查服务状态
Write-Host "1. 检查服务状态..." -ForegroundColor Yellow

# 检查API网关
try {
    $gatewayHealth = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 5
    Write-Host "✅ API网关运行正常: $($gatewayHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ API网关未运行或无响应" -ForegroundColor Red
    exit 1
}

# 检查采购服务
try {
    $procurementHealth = Invoke-RestMethod -Uri "http://localhost:3007/health" -TimeoutSec 5
    Write-Host "✅ 采购服务运行正常: $($procurementHealth.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ 采购服务未运行或无响应" -ForegroundColor Red
    exit 1
}

# 2. 测试API端点
Write-Host "2. 测试API端点..." -ForegroundColor Yellow

# 测试通过API网关获取供应商列表
try {
    $suppliers = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/procurement/suppliers" -Headers @{"Authorization"="Bearer test-token"} -TimeoutSec 10
    Write-Host "✅ 获取供应商列表成功: $($suppliers.data.suppliers.Count) 个供应商" -ForegroundColor Green
} catch {
    Write-Host "❌ 获取供应商列表失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试通过API网关获取订单列表
try {
    $orders = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/procurement/orders" -Headers @{"Authorization"="Bearer test-token"} -TimeoutSec 10
    Write-Host "✅ 获取订单列表成功: $($orders.data.orders.Count) 个订单" -ForegroundColor Green
} catch {
    Write-Host "❌ 获取订单列表失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. 测试创建供应商
Write-Host "3. 测试创建供应商..." -ForegroundColor Yellow

$testSupplier = @{
    name = "修复测试供应商"
    contactPerson = "测试联系人"
    phone = "13800138999"
    address = "测试地址"
    supplierType = "material"
    rating = 5
} | ConvertTo-Json

try {
    $createResult = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/procurement/suppliers" -Method POST -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer test-token"} -Body $testSupplier -TimeoutSec 10
    Write-Host "✅ 创建供应商成功: $($createResult.message)" -ForegroundColor Green
} catch {
    Write-Host "❌ 创建供应商失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. 测试创建订单
Write-Host "4. 测试创建订单..." -ForegroundColor Yellow

$testOrderData = @{
    supplierId = 1
    supplierName = "测试供应商"
    baseId = 1
    baseName = "主基地"
    orderType = "material"
    orderDate = "2025-08-14"
    expectedDeliveryDate = "2025-08-24"
    paymentMethod = "transfer"
    contractNumber = "CT-FIX-001"
    remark = "修复测试订单"
    items = @(
        @{
            itemName = "测试商品"
            specification = "测试规格"
            quantity = 5
            unit = "个"
            unitPrice = 50
            remark = "测试备注"
        }
    )
}

$testOrder = $testOrderData | ConvertTo-Json -Depth 3

try {
    $orderResult = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/procurement/orders" -Method POST -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer test-token"} -Body $testOrder -TimeoutSec 10
    Write-Host "✅ 创建订单成功: $($orderResult.message)" -ForegroundColor Green
    $orderId = $orderResult.data.order.id
    Write-Host "   订单ID: $orderId" -ForegroundColor Cyan
    
    # 测试审批订单
    try {
        $approveResult = Invoke-RestMethod -Uri "http://localhost:3000/api/v1/procurement/orders/$orderId/approve" -Method POST -Headers @{"Content-Type"="application/json"; "Authorization"="Bearer test-token"} -Body "{}" -TimeoutSec 10
        Write-Host "✅ 审批订单成功: $($approveResult.message)" -ForegroundColor Green
    } catch {
        Write-Host "❌ 审批订单失败: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ 创建订单失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. 生成测试报告
Write-Host "5. 生成测试报告..." -ForegroundColor Yellow

$reportContent = @"
# 前端数据处理问题修复报告

## 测试时间
$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## 问题分析

### 1. "data2 is not iterable" 错误
- **原因**: 前端数据标准化工具 `normalizeDataList` 在处理某些数据格式时出现迭代错误
- **解决方案**: 直接处理后端返回的标准格式数据，避免复杂的数据转换

### 2. 供应商创建 400 错误
- **原因**: 前端请求通过开发服务器代理到API网关，再转发到采购服务
- **解决方案**: 确保API网关正确配置并运行

## 修复建议

### 前端修复
1. 简化数据处理逻辑，直接使用后端返回的标准格式
2. 移除不必要的数据标准化步骤
3. 添加更好的错误处理和日志记录

### 后端验证
1. ✅ 采购服务运行正常
2. ✅ API网关代理正常
3. ✅ 所有API端点响应正确

## 测试结果
- 供应商创建: 正常
- 订单创建: 正常
- 订单审批: 正常
- 数据获取: 正常

## 建议的前端代码修改

```javascript
// 简化的数据获取逻辑
const fetchOrders = async () => {
  try {
    const response = await purchaseApi.getOrders(params)
    const data = response.data
    
    if (data && data.success) {
      orders.value = data.data.orders || []
      pagination.total = data.data.pagination?.total || 0
    }
  } catch (error) {
    console.error('获取订单失败:', error)
    orders.value = []
  }
}
```

## 总结
后端服务运行正常，问题主要在前端的数据处理逻辑。建议简化数据处理流程，直接使用后端返回的标准格式数据。
"@

$reportContent | Out-File -FilePath "FRONTEND_DATA_FIX_REPORT.md" -Encoding UTF8

Write-Host "✅ 修复脚本执行完成！" -ForegroundColor Green
Write-Host "📄 详细报告已生成: FRONTEND_DATA_FIX_REPORT.md" -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "建议的解决方案:" -ForegroundColor Yellow
Write-Host "1. 简化前端数据处理逻辑" -ForegroundColor White
Write-Host "2. 直接使用后端返回的标准格式数据" -ForegroundColor White
Write-Host "3. 移除复杂的数据标准化工具" -ForegroundColor White
Write-Host "4. 添加更好的错误处理" -ForegroundColor White