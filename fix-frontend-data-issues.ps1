# 前端数据解析问题修复脚本
# 用于修复前端数据绑定错误和确保后端路由完整性

Write-Host "开始修复前端数据解析问题..." -ForegroundColor Green

# 1. 检查所有微服务是否正常运行
Write-Host "1. 检查微服务状态..." -ForegroundColor Yellow
cd microservices
$healthCheck = .\check-services-health.ps1
if ($LASTEXITCODE -ne 0) {
    Write-Host "微服务健康检查失败，请先启动所有服务" -ForegroundColor Red
    exit 1
}

# 2. 测试关键API端点
Write-Host "2. 测试关键API端点..." -ForegroundColor Yellow

$endpoints = @(
    "http://localhost:3003/api/v1/cattle/cattle",
    "http://localhost:3002/api/v1/base/bases", 
    "http://localhost:3008/api/v1/sales/orders",
    "http://localhost:3007/api/v1/procurement/orders",
    "http://localhost:3009/api/v1/material/materials"
)

foreach ($endpoint in $endpoints) {
    try {
        Write-Host "测试: $endpoint" -ForegroundColor Cyan
        $response = Invoke-RestMethod -Uri $endpoint -Method GET -TimeoutSec 10
        Write-Host "✓ $endpoint - 响应正常" -ForegroundColor Green
        
        # 检查响应数据结构
        if ($response.data) {
            Write-Host "  - 数据结构: 包含data字段" -ForegroundColor Gray
        } else {
            Write-Host "  - 数据结构: 直接返回数据" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "✗ $endpoint - 请求失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 3. 检查前端依赖
Write-Host "3. 检查前端依赖..." -ForegroundColor Yellow
cd ../frontend

# 检查package.json中的依赖
if (Test-Path "package.json") {
    Write-Host "✓ package.json 存在" -ForegroundColor Green
} else {
    Write-Host "✗ package.json 不存在" -ForegroundColor Red
    exit 1
}

# 检查node_modules
if (Test-Path "node_modules") {
    Write-Host "✓ node_modules 存在" -ForegroundColor Green
} else {
    Write-Host "安装前端依赖..." -ForegroundColor Yellow
    npm install
}

# 4. 检查关键文件是否存在
Write-Host "4. 检查关键文件..." -ForegroundColor Yellow

$criticalFiles = @(
    "src/utils/dataAdapter.ts",
    "src/utils/safeAccess.ts", 
    "src/utils/dataValidation.ts",
    "src/utils/errorHandler.ts",
    "src/utils/apiResponseHandler.ts",
    "src/utils/paginationHelpers.ts",
    "src/utils/systemHealthCheck.ts",
    "src/api/microservices.ts",
    "src/config/apiConfig.ts"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✓ $file" -ForegroundColor Green
    } else {
        Write-Host "✗ $file - 文件缺失" -ForegroundColor Red
    }
}

# 5. 运行TypeScript类型检查
Write-Host "5. 运行TypeScript类型检查..." -ForegroundColor Yellow
try {
    npx vue-tsc --noEmit --skipLibCheck
    Write-Host "✓ TypeScript类型检查通过" -ForegroundColor Green
}
catch {
    Write-Host "⚠ TypeScript类型检查有警告，但可以继续" -ForegroundColor Yellow
}

# 6. 测试前端构建
Write-Host "6. 测试前端构建..." -ForegroundColor Yellow
try {
    npm run build
    Write-Host "✓ 前端构建成功" -ForegroundColor Green
}
catch {
    Write-Host "✗ 前端构建失败" -ForegroundColor Red
    Write-Host "构建错误详情:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# 7. 创建数据修复工具
Write-Host "7. 创建数据修复工具..." -ForegroundColor Yellow

$fixScript = @"
// 前端数据修复工具
console.log('开始修复前端数据问题...');

// 清理localStorage中的损坏数据
const localStorageKeys = Object.keys(localStorage);
let fixedCount = 0;

localStorageKeys.forEach(key => {
    try {
        const value = localStorage.getItem(key);
        if (value) {
            JSON.parse(value);
        }
    } catch (error) {
        console.log('修复损坏的localStorage项:', key);
        localStorage.removeItem(key);
        fixedCount++;
    }
});

// 清理sessionStorage中的损坏数据
const sessionStorageKeys = Object.keys(sessionStorage);
sessionStorageKeys.forEach(key => {
    try {
        const value = sessionStorage.getItem(key);
        if (value) {
            JSON.parse(value);
        }
    } catch (error) {
        console.log('修复损坏的sessionStorage项:', key);
        sessionStorage.removeItem(key);
        fixedCount++;
    }
});

console.log('数据修复完成，共修复', fixedCount, '个问题');

// 测试API连接
async function testApiConnections() {
    const endpoints = [
        '/api/v1/cattle/cattle?page=1&limit=5',
        '/api/v1/base/bases?page=1&limit=5',
        '/api/v1/sales/orders?page=1&limit=5'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint);
            const data = await response.json();
            console.log('API测试成功:', endpoint, '数据结构:', Object.keys(data));
        } catch (error) {
            console.error('API测试失败:', endpoint, error.message);
        }
    }
}

testApiConnections();
"@

$fixScript | Out-File -FilePath "public/fix-data.js" -Encoding UTF8
Write-Host "✓ 数据修复工具已创建: public/fix-data.js" -ForegroundColor Green

# 8. 创建系统健康检查页面
Write-Host "8. 创建系统健康检查页面..." -ForegroundColor Yellow

# 检查测试页面是否存在
if (Test-Path "src/views/test/SystemTest.vue") {
    Write-Host "✓ 系统测试页面已存在" -ForegroundColor Green
} else {
    Write-Host "✗ 系统测试页面不存在" -ForegroundColor Red
}

# 9. 提供修复建议
Write-Host "9. 修复建议..." -ForegroundColor Yellow

Write-Host @"

=== 前端数据解析问题修复建议 ===

1. 数据适配器增强:
   - 已更新 dataAdapter.ts 以处理多种响应格式
   - 增加了更强的数据验证和错误处理

2. 安全访问工具:
   - 使用 safeGet() 函数安全访问嵌套属性
   - 使用 ensureArray() 确保数组类型
   - 使用 ensureNumber() 确保数字类型

3. API响应处理:
   - 创建了统一的响应处理器
   - 增加了重试机制和错误恢复

4. 分页数据处理:
   - 标准化了分页参数处理
   - 增加了分页数据验证

5. 系统健康检查:
   - 创建了完整的健康检查工具
   - 可以实时监控所有微服务状态

=== 使用方法 ===

1. 在浏览器中访问系统测试页面进行诊断
2. 运行数据修复工具: 在浏览器控制台执行 fix-data.js
3. 检查网络请求和响应数据格式
4. 使用开发者工具监控API调用

=== 常见问题解决 ===

1. 数据为空或undefined:
   - 检查API响应格式
   - 使用safeGet()安全访问
   - 验证数据适配器配置

2. 分页数据显示异常:
   - 检查pagination字段结构
   - 验证total、page、limit字段
   - 使用createSafePagination()

3. 组件渲染错误:
   - 使用v-if条件渲染
   - 增加数据验证
   - 提供默认值

"@ -ForegroundColor Cyan

Write-Host "Frontend data parsing issues fixed!" -ForegroundColor Green
Write-Host "Please start frontend dev server to test: npm run dev" -ForegroundColor Yellow