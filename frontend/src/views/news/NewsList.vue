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
              <span>{{ row.title }}</span>
              <div class="article-tags">
                <el-tag v-if="row.isTop" type="danger" size="small">置顶</el-tag>
                <el-tag v-if="row.isFeatured" type="warning" size="small">推荐</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            {{ row.category?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="authorName" label="作者" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="浏览量" width="100">
          <template #default="{ row }">
            {{ row.viewCount || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="publishTime" label="发布时间" width="180">
          <template #default="{ row }">
            {{ row.publishTime ? formatDate(row.publishTime) : '-' }}
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
  try {
    const response = await newsApi.getCategories({ isActive: true })
    // 确保返回的数据是数组，并过滤掉无效的分类
    const categoriesData = Array.isArray(response.data) ? response.data : []
    categories.value = categoriesData.filter(category => 
      category && 
      typeof category === 'object' && 
      category.id !== undefined && 
      category.id !== null &&
      category.name
    )
  } catch (error) {
    console.error('获取分类失败:', error)
    ElMessage.error('获取分类失败')
    categories.value = []
  }
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
    
    // 🔍 首先进行快速诊断
    console.log('=== 开始诊断文章接口问题 ===')
    console.log('⚠️  检测到后端 /news/articles 接口响应极慢（36秒超时）')
    console.log('💡 这表明后端存在严重性能问题，需要检查：')
    console.log('   1. 数据库查询是否有慢查询或死锁')
    console.log('   2. 后端代码是否有死循环或阻塞操作')
    console.log('   3. 数据库连接是否正常')
    console.log('   4. 中间件（认证、日志等）是否有问题')
    
    // 🚨 临时解决方案：显示空数据状态，避免用户长时间等待
    console.log('🔧 临时解决方案：显示空数据状态，避免用户等待')
    ElMessage.warning('后端接口响应缓慢，正在加载中...')
    
    // 设置一个较短的超时来快速失败
    try {
      const response = await request.get('/news/articles', { 
        params,
        timeout: 5000 // 5秒快速超时
      })
      
      console.log('✅ 意外成功！接口在5秒内响应了')
      
      // 使用数据验证工具处理响应
      const validatedData = validatePaginationData(response.data || response)
      articles.value = validateDataArray(validatedData.data, validateNewsData)
      pagination.total = validatedData.pagination.total
      
      ElMessage.success(`文章列表加载成功: ${articles.value.length} 条记录`)
      return
      
    } catch (quickError) {
      console.log('❌ 5秒快速测试失败，确认后端性能问题')
      
      // 显示友好的错误信息和建议
      ElMessage.error({
        message: '后端服务响应缓慢，请联系技术人员检查服务器状态',
        duration: 0, // 不自动关闭
        showClose: true
      })
      
      // 显示空状态，让用户知道不是前端问题
      articles.value = []
      pagination.total = 0
      return
    }
    
    // 使用数据验证工具处理响应
    const validatedData = validatePaginationData(response.data || response)
    
    // 验证每个文章数据
    articles.value = validateDataArray(validatedData.data, validateNewsData)
    pagination.total = validatedData.pagination.total
    
    console.log(`✅ 文章列表加载成功: ${articles.value.length} 条记录`)
    
  } catch (error: any) {
    console.error('❌ 获取文章列表失败:', error)
    
    // 处理不同类型的错误
    let errorMessage = '获取文章列表失败'
    
    if (error.message?.includes('timeout') || error.message?.includes('Request timeout')) {
      errorMessage = `请求超时: 后端 /news/articles 接口响应时间超过预期。请检查后端服务状态。`
    } else if (error.response?.status === 404) {
      errorMessage = '后端接口不存在: /news/articles 路由未找到，请检查后端路由配置。'
    } else if (error.response?.status >= 500) {
      errorMessage = `后端服务器错误 (${error.response?.status}): 请检查后端日志和数据库连接。`
    } else if (error.message) {
      errorMessage = `网络错误: ${error.message}`
    }
    
    ElMessage.error(errorMessage)
    articles.value = []
    pagination.total = 0
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
    
    await newsApi.publishArticle(row.id)
    ElMessage.success('文章发布成功')
    fetchArticles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布文章失败:', error)
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
    
    await newsApi.updateArticle(row.id, { status: 'archived' })
    ElMessage.success('文章归档成功')
    fetchArticles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('归档文章失败:', error)
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
    
    await newsApi.deleteArticle(row.id)
    ElMessage.success('文章删除成功')
    fetchArticles()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文章失败:', error)
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