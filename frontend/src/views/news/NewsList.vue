<template>
  <div class="news-list">
    <div class="page-header">
      <h2>新闻管理</h2>
      <el-button type="primary" @click="handleCreate">
        <el-icon><Plus /></el-icon>
        新建文章
      </el-button>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索标题、内容或标签"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.categoryId" placeholder="选择分类" clearable>
            <el-option
              v-for="(category, index) in validCategories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable>
            <el-option label="草稿" value="draft" />
            <el-option label="已发布" value="published" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 文章列表 -->
    <el-card>
      <el-table v-loading="loading" :data="articles" stripe>
        <el-table-column prop="title" label="标题" min-width="200">
          <template #default="{ row }">
            <div class="article-title">
              <span>{{ safeGet(row, 'title', '-') }}</span>
              <div class="article-tags">
                <el-tag v-if="safeGet(row, 'isTop', safeGet(row, 'is_top', false))" type="danger" size="small">置顶</el-tag>
                <el-tag v-if="safeGet(row, 'isFeatured', safeGet(row, 'is_featured', false))" type="warning" size="small">推荐</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            {{ safeGet(row, 'category.name', '-') }}
          </template>
        </el-table-column>
        <el-table-column prop="authorName" label="作者" width="100">
          <template #default="{ row }">
            {{ safeGet(row, 'authorName', safeGet(row, 'author_name', safeGet(row, 'author.real_name', '-'))) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(safeGet(row, 'status', 'draft'))"
              size="small"
            >
              {{ getStatusText(safeGet(row, 'status', 'draft')) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="浏览量" width="100">
          <template #default="{ row }">
            {{ ensureNumber(safeGet(row, 'viewCount', safeGet(row, 'view_count', 0)), 0) }}
          </template>
        </el-table-column>
        <el-table-column prop="publishTime" label="发布时间" width="180">
          <template #default="{ row }">
            {{ safeGet(row, 'publishTime', safeGet(row, 'publish_time', '')) ? formatDate(safeGet(row, 'publishTime', safeGet(row, 'publish_time', ''))) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-dropdown @command="(command) => handleCommand(command, row)">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    v-if="row.status === 'draft'"
                    command="publish"
                  >
                    发布
                  </el-dropdown-item>
                  <el-dropdown-item
                    v-if="row.status === 'published'"
                    command="archive"
                  >
                    归档
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowDown } from '@element-plus/icons-vue'
import { newsApi, type NewsArticle, type NewsCategory } from '@/api/news'
import request from '@/api/request'
import { formatDate } from '@/utils/date'
import { validatePaginationData, validateDataArray, validateNewsData } from '@/utils/dataValidation'
import { safeApiCall, withPageErrorHandler, withFormErrorHandler } from '@/utils/errorHandler'
import { safeGet, ensureArray, ensureNumber } from '@/utils/safeAccess'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const articles = ref<NewsArticle[]>([])
const categories = ref<NewsCategory[]>([])

const searchForm = reactive({
  keyword: '',
  categoryId: undefined as number | undefined,
  status: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 计算属性：过滤有效的分类
const validCategories = computed(() => {
  return categories.value.filter(category => 
    category && 
    typeof category === 'object' && 
    category.id !== undefined && 
    category.id !== null &&
    category.name &&
    typeof category.name === 'string'
  )
})

// 获取分类列表
const fetchCategories = async () => {
  const result = await safeApiCall(
    () => newsApi.getCategories({ isActive: true }),
    {
      showMessage: false,
      fallbackValue: { data: [] }
    }
  )
  
  const categoriesData = ensureArray(safeGet(result, 'data', []))
  categories.value = categoriesData.filter(category => 
    category && 
    typeof category === 'object' && 
    ensureNumber(category.id, 0) > 0 &&
    category.name &&
    typeof category.name === 'string'
  )
}

// 获取文章列表
const fetchArticles = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm
    }
    
    const result = await safeApiCall(
      () => newsApi.getArticles(params),
      {
        showMessage: false,
        fallbackValue: { data: { data: [], pagination: { total: 0 } } },
        retryCount: 1,
        retryDelay: 2000
      }
    )
    
    if (result && result.data) {
      const articlesData = ensureArray(safeGet(result, 'data.data', []))
      articles.value = validateDataArray(articlesData, validateNewsData)
      pagination.total = ensureNumber(safeGet(result, 'data.pagination.total', 0))
      
      console.log(`✅ 文章列表加载成功: ${articles.value.length} 条记录`)
    } else {
      articles.value = []
      pagination.total = 0
      ElMessage.warning('暂无文章数据')
    }
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchArticles()
}

// 重置搜索
const handleReset = () => {
  Object.assign(searchForm, {
    keyword: '',
    categoryId: undefined,
    status: ''
  })
  pagination.page = 1
  fetchArticles()
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  fetchArticles()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchArticles()
}

// 操作处理
const handleCreate = () => {
  router.push('/admin/news/create')
}

const handleView = (row: NewsArticle) => {
  router.push(`/admin/news/view/${row.id}`)
}

const handleEdit = (row: NewsArticle) => {
  router.push(`/admin/news/edit/${row.id}`)
}

const handleCommand = async (command: string, row: NewsArticle) => {
  switch (command) {
    case 'publish':
      await handlePublish(row)
      break
    case 'archive':
      await handleArchive(row)
      break
    case 'delete':
      await handleDelete(row)
      break
  }
}

// 发布文章
const handlePublish = async (row: NewsArticle) => {
  try {
    await ElMessageBox.confirm('确认发布这篇文章吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const result = await safeApiCall(
      () => newsApi.publishArticle(ensureNumber(row.id, 0)),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result !== null) {
      ElMessage.success('文章发布成功')
      fetchArticles()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('发布文章失败')
    }
  }
}

// 归档文章
const handleArchive = async (row: NewsArticle) => {
  try {
    await ElMessageBox.confirm('确认归档这篇文章吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const result = await safeApiCall(
      () => newsApi.updateArticle(ensureNumber(row.id, 0), { status: 'archived' }),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result !== null) {
      ElMessage.success('文章归档成功')
      fetchArticles()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('归档文章失败')
    }
  }
}

// 删除文章
const handleDelete = async (row: NewsArticle) => {
  try {
    await ElMessageBox.confirm('确认删除这篇文章吗？删除后无法恢复！', '警告', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    
    const result = await safeApiCall(
      () => newsApi.deleteArticle(ensureNumber(row.id, 0)),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result !== null) {
      ElMessage.success('文章删除成功')
      fetchArticles()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除文章失败')
    }
  }
}

// 工具函数
const getStatusType = (status: string): "success" | "primary" | "warning" | "info" | "danger" => {
  const statusMap: Record<string, "success" | "primary" | "warning" | "info" | "danger"> = {
    draft: 'info',
    published: 'success',
    archived: 'warning'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档'
  }
  return statusMap[status] || status
}

// 初始化
onMounted(() => {
  fetchCategories()
  fetchArticles()
})
</script>

<style scoped>
.news-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.search-card {
  margin-bottom: 20px;
}

.article-title {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.article-tags {
  display: flex;
  gap: 4px;
}

.stats {
  display: flex;
  flex-direction: column;
  font-size: 12px;
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>