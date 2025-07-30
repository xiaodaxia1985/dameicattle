# 前端空数据处理使用指南

## 快速开始

### 1. 导入必要的工具

```typescript
// 数据验证工具
import { 
  validatePaginationData, 
  validateDataArray, 
  validateUserData,
  validateNewsData 
} from '@/utils/dataValidation'

// 错误处理工具
import { safeApiCall } from '@/utils/errorHandler'

// 数据加载组合函数
import { useDataLoader, useSimpleDataLoader } from '@/composables/useDataLoader'

// 安全访问工具
import { safeGet, ensureArray, ensureNumber } from '@/utils/safeAccess'
```

### 2. 使用数据加载器（推荐）

```typescript
// 在 setup() 中使用
const articles = useDataLoader<NewsArticle>(
  (params) => newsApi.getArticles(params),
  {
    validator: validateNewsData,
    autoLoad: true,
    showMessage: true,
    retryCount: 2
  }
)

// 在模板中使用
<template>
  <!-- 空状态 -->
  <div v-if="articles.isEmpty && !articles.loading" class="empty-state">
    <el-empty description="暂无数据" />
  </div>

  <!-- 错误状态 -->
  <div v-else-if="articles.hasError" class="error-state">
    <el-result icon="error" title="加载失败">
      <template #extra>
        <el-button @click="articles.refresh()">重新加载</el-button>
      </template>
    </el-result>
  </div>

  <!-- 正常数据 -->
  <el-table v-else :data="articles.data" v-loading="articles.loading">
    <!-- 表格内容 -->
  </el-table>
</template>
```

### 3. 手动处理API调用

```typescript
const loadData = async () => {
  loading.value = true
  try {
    const response = await newsApi.getArticles(params)
    
    // 验证分页数据
    const validatedData = validatePaginationData(response.data || response)
    
    // 验证每个数据项
    articles.value = validateDataArray(validatedData.data, validateNewsData)
    pagination.total = validatedData.pagination.total
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
    articles.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}
```

## 常见场景处理

### 1. 列表页面

```vue
<template>
  <div class="list-page">
    <!-- 搜索区域 -->
    <el-form :model="searchForm" inline>
      <el-form-item label="关键词">
        <el-input v-model="searchForm.keyword" />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 数据表格 -->
    <el-card>
      <!-- 空状态 -->
      <div v-if="dataLoader.isEmpty && !dataLoader.loading" class="empty-state">
        <el-empty description="暂无数据">
          <el-button type="primary" @click="handleCreate">创建数据</el-button>
        </el-empty>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="dataLoader.hasError" class="error-state">
        <el-result icon="error" title="加载失败">
          <template #extra>
            <el-button @click="dataLoader.refresh()">重新加载</el-button>
          </template>
        </el-result>
      </div>

      <!-- 数据表格 -->
      <div v-else>
        <el-table :data="dataLoader.data" v-loading="dataLoader.loading">
          <el-table-column prop="name" label="名称">
            <template #default="{ row }">
              {{ safeGet(row, 'name', '-') }}
            </template>
          </el-table-column>
          <!-- 其他列 -->
        </el-table>

        <!-- 分页 -->
        <el-pagination
          v-model:current-page="dataLoader.pagination.page"
          v-model:page-size="dataLoader.pagination.limit"
          :total="dataLoader.pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useDataLoader } from '@/composables/useDataLoader'
import { validateNewsData } from '@/utils/dataValidation'
import { safeGet } from '@/utils/safeAccess'

// 搜索表单
const searchForm = reactive({
  keyword: ''
})

// 数据加载器
const dataLoader = useDataLoader(
  (params) => api.getData(params),
  {
    validator: validateNewsData,
    autoLoad: true
  }
)

// 搜索处理
const handleSearch = () => {
  dataLoader.reset(searchForm)
}

const handleReset = () => {
  Object.assign(searchForm, { keyword: '' })
  dataLoader.reset()
}

// 分页处理
const handleSizeChange = (size: number) => {
  dataLoader.changePageSize(size, searchForm)
}

const handleCurrentChange = (page: number) => {
  dataLoader.goToPage(page, searchForm)
}
</script>
```

### 2. 仪表板页面

```vue
<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="stat in stats" :key="stat.key">
        <el-card>
          <div class="stat-content">
            <div class="stat-number">{{ ensureNumber(stat.value, 0) }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card title="趋势图">
          <div v-if="chartData.length === 0" class="chart-empty">
            <el-empty description="暂无图表数据" />
          </div>
          <div v-else ref="chartRef" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStatsLoader } from '@/composables/useDataLoader'
import { ensureNumber, ensureArray } from '@/utils/safeAccess'

// 统计数据加载器
const statsLoader = useStatsLoader(
  () => api.getStats(),
  {
    total: 0,
    active: 0,
    pending: 0,
    completed: 0
  },
  { autoLoad: true }
)

// 统计卡片数据
const stats = computed(() => [
  { key: 'total', label: '总数', value: statsLoader.stats.value.total },
  { key: 'active', label: '活跃', value: statsLoader.stats.value.active },
  { key: 'pending', label: '待处理', value: statsLoader.stats.value.pending },
  { key: 'completed', label: '已完成', value: statsLoader.stats.value.completed }
])

// 图表数据
const chartData = ref([])

const loadChartData = async () => {
  try {
    const response = await api.getChartData()
    chartData.value = ensureArray(response.data, [])
  } catch (error) {
    console.error('加载图表数据失败:', error)
    chartData.value = []
  }
}
</script>
```

### 3. 表单页面

```vue
<template>
  <div class="form-page">
    <el-form ref="formRef" :model="form" :rules="rules">
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" />
      </el-form-item>
      
      <el-form-item label="分类" prop="categoryId">
        <el-select v-model="form.categoryId" placeholder="请选择分类">
          <el-option
            v-for="category in categories.data"
            :key="safeGet(category, 'id', 0)"
            :label="safeGet(category, 'name', '未知分类')"
            :value="safeGet(category, 'id', 0)"
          />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          提交
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useSimpleDataLoader } from '@/composables/useDataLoader'
import { withFormErrorHandler } from '@/utils/errorHandler'
import { safeGet } from '@/utils/safeAccess'

// 表单数据
const form = reactive({
  name: '',
  categoryId: undefined
})

// 分类数据加载器
const categories = useSimpleDataLoader(
  () => api.getCategories(),
  { autoLoad: true }
)

// 表单提交
const submitting = ref(false)
const handleSubmit = withFormErrorHandler(
  async () => {
    submitting.value = true
    try {
      await api.createItem(form)
      // 提交成功后的处理
    } finally {
      submitting.value = false
    }
  },
  '创建成功',
  '创建失败'
)
</script>
```

## 最佳实践

### 1. 数据访问
```typescript
// ❌ 不安全的访问
const userName = user.profile.name
const count = data.length

// ✅ 安全的访问
const userName = safeGet(user, 'profile.name', '未知用户')
const count = ensureArray(data).length
```

### 2. API调用
```typescript
// ❌ 没有错误处理
const data = await api.getData()
list.value = data.items

// ✅ 使用安全API调用
const data = await safeApiCall(
  () => api.getData(),
  { fallbackValue: { items: [] } }
)
list.value = ensureArray(data.items)
```

### 3. 数据验证
```typescript
// ❌ 直接使用API数据
users.value = response.data

// ✅ 验证后使用
const validatedData = validatePaginationData(response.data)
users.value = validateDataArray(validatedData.data, validateUserData)
```

### 4. 空状态处理
```vue
<!-- ❌ 没有空状态 -->
<el-table :data="list" />

<!-- ✅ 有空状态处理 -->
<div v-if="list.length === 0" class="empty-state">
  <el-empty description="暂无数据" />
</div>
<el-table v-else :data="list" />
```

## 常见问题

### Q: 什么时候使用 useDataLoader？
A: 当你需要加载分页数据、需要统一的错误处理、需要缓存功能时使用。

### Q: 什么时候使用 useSimpleDataLoader？
A: 当你只需要加载简单的列表数据，不需要分页功能时使用。

### Q: 如何自定义数据验证器？
A: 创建一个函数，接收原始数据，返回验证后的数据或null：

```typescript
function validateCustomData(data: any) {
  if (!data || typeof data !== 'object') {
    return null
  }
  
  return {
    id: ensureNumber(data.id, 0),
    name: ensureString(data.name, ''),
    // 其他字段验证
  }
}
```

### Q: 如何处理嵌套的API响应？
A: 使用 safeGet 安全访问嵌套属性：

```typescript
const items = safeGet(response, 'data.result.items', [])
const total = safeGet(response, 'data.result.pagination.total', 0)
```

## 迁移指南

### 从旧代码迁移到新方案

1. **替换直接API调用**：
   ```typescript
   // 旧代码
   const response = await api.getData()
   list.value = response.data || []
   
   // 新代码
   const dataLoader = useDataLoader(() => api.getData())
   ```

2. **替换手动分页处理**：
   ```typescript
   // 旧代码
   const currentPage = ref(1)
   const pageSize = ref(20)
   const total = ref(0)
   
   // 新代码
   const dataLoader = useDataLoader(() => api.getData())
   // 分页状态自动管理
   ```

3. **替换错误处理**：
   ```typescript
   // 旧代码
   try {
     const data = await api.getData()
     list.value = data
   } catch (error) {
     ElMessage.error('加载失败')
   }
   
   // 新代码
   const dataLoader = useDataLoader(() => api.getData(), {
     showMessage: true
   })
   ```

按照这个指南，你可以逐步将现有代码迁移到新的空数据处理方案中。