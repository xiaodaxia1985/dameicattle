<template>
  <div class="news-portal">
    <!-- 页面头部 -->
    <div class="portal-header">
      <div class="container">
        <h1>新闻中心</h1>
        <p>了解我们的最新动态和行业资讯</p>
      </div>
    </div>

    <div class="container">
      <div class="portal-content">
        <!-- 侧边栏 -->
        <aside class="sidebar">
          <!-- 分类导航 -->
          <div class="sidebar-section">
            <h3>新闻分类</h3>
            <ul class="category-list">
              <li 
                :class="{ active: !selectedCategoryId }"
                @click="handleCategoryChange(undefined)"
              >
                全部新闻
              </li>
              <li
                v-for="category in categories"
                :key="category.id"
                :class="{ active: selectedCategoryId === category.id }"
                @click="handleCategoryChange(category.id)"
              >
                {{ category.name }}
              </li>
            </ul>
          </div>

          <!-- 热门文章 -->
          <div class="sidebar-section">
            <h3>热门文章</h3>
            <div class="hot-articles">
              <div
                v-for="article in hotArticles"
                :key="article.id"
                class="hot-article-item"
                @click="handleArticleClick(article.id)"
              >
                <h4>{{ article.title }}</h4>
                <div class="article-meta">
                  <span>{{ formatDate(article.publishTime || article.createdAt, 'MM-DD') }}</span>
                  <span>{{ article.viewCount }} 浏览</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- 主内容区 -->
        <main class="main-content">
          <!-- 搜索栏 -->
          <div class="search-bar">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索新闻..."
              class="search-input"
              @keyup.enter="handleSearch"
            >
              <template #append>
                <el-button @click="handleSearch">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
          </div>

          <!-- 推荐文章 -->
          <div v-if="featuredArticles.length > 0 && !searchKeyword" class="featured-section">
            <h2>推荐文章</h2>
            <div class="featured-articles">
              <div
                v-for="article in featuredArticles"
                :key="article.id"
                class="featured-article"
                @click="handleArticleClick(article.id)"
              >
                <div class="article-image">
                  <img
                    v-if="article.coverImage"
                    :src="article.coverImage"
                    :alt="article.title"
                  />
                  <div v-else class="no-image">
                    <el-icon><Picture /></el-icon>
                  </div>
                </div>
                <div class="article-info">
                  <h3>{{ article.title }}</h3>
                  <p v-if="article.summary" class="article-summary">
                    {{ article.summary }}
                  </p>
                  <div class="article-meta">
                    <span class="category">{{ article.category?.name }}</span>
                    <span class="date">{{ formatDate(article.publishTime || article.createdAt) }}</span>
                    <span class="views">{{ article.viewCount }} 浏览</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 文章列表 -->
          <div class="articles-section">
            <h2 v-if="searchKeyword">
              搜索结果 "{{ searchKeyword }}"
            </h2>
            <h2 v-else-if="selectedCategoryId">
              {{ selectedCategoryName }}
            </h2>
            <h2 v-else>
              最新文章
            </h2>

            <div v-loading="loading" class="articles-list">
              <div
                v-for="article in articles"
                :key="article.id"
                class="article-item"
                @click="handleArticleClick(article.id)"
              >
                <div class="article-image">
                  <img
                    v-if="article.coverImage"
                    :src="article.coverImage"
                    :alt="article.title"
                  />
                  <div v-else class="no-image">
                    <el-icon><Document /></el-icon>
                  </div>
                </div>
                <div class="article-content">
                  <h3>{{ article.title }}</h3>
                  <p v-if="article.summary" class="summary">
                    {{ article.summary }}
                  </p>
                  <div class="article-meta">
                    <span class="category">{{ article.category?.name }}</span>
                    <span class="author">{{ article.authorName }}</span>
                    <span class="date">{{ formatDate(article.publishTime || article.createdAt) }}</span>
                    <span class="stats">
                      <el-icon><View /></el-icon>
                      {{ article.viewCount }}
                    </span>
                    <span class="stats">
                      <el-icon><Star /></el-icon>
                      {{ article.likeCount }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 空状态 -->
              <div v-if="!loading && articles.length === 0" class="empty-state">
                <el-icon class="empty-icon"><Document /></el-icon>
                <p>暂无相关文章</p>
              </div>
            </div>

            <!-- 分页 -->
            <div v-if="pagination.total > 0" class="pagination-wrapper">
              <el-pagination
                v-model:current-page="pagination.page"
                v-model:page-size="pagination.limit"
                :total="pagination.total"
                :page-sizes="[10, 20, 30]"
                layout="prev, pager, next, sizes, total"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Picture, Document, View, Star } from '@element-plus/icons-vue'
import { newsApi, type NewsArticle, type NewsCategory } from '@/api/news'
import { formatDate } from '@/utils/date'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const searchKeyword = ref('')
const selectedCategoryId = ref<number | undefined>()

const articles = ref<NewsArticle[]>([])
const featuredArticles = ref<NewsArticle[]>([])
const hotArticles = ref<NewsArticle[]>([])
const categories = ref<NewsCategory[]>([])

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0
})

// 计算属性
const selectedCategoryName = computed(() => {
  if (!selectedCategoryId.value) return ''
  const category = categories.value.find(c => c.id === selectedCategoryId.value)
  return category?.name || ''
})

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await newsApi.getCategories({ isActive: true })
    categories.value = response.data
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 获取文章列表
const fetchArticles = async () => {
  loading.value = true
  try {
    const response = await newsApi.getPublicNews({
      page: pagination.page,
      limit: pagination.limit,
      categoryId: selectedCategoryId.value,
      status: 'published'
    })
    
    console.log('文章列表API响应:', response)
    
    // 安全地获取数据数组
    let articlesData = []
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      articlesData = response.data.data
    } else if (response.data && Array.isArray(response.data)) {
      articlesData = response.data
    } else {
      console.warn('文章列表数据格式不正确:', response)
      articlesData = []
    }
    
    if (searchKeyword.value) {
      // 在客户端进行关键词过滤
      const filteredData = articlesData.filter(article => 
        article && article.title && 
        (article.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
        (article.summary && article.summary.toLowerCase().includes(searchKeyword.value.toLowerCase())))
      )
      articles.value = filteredData
      pagination.total = filteredData.length
    } else {
      articles.value = articlesData
      pagination.total = response.data.pagination?.total || articlesData.length
    }
    
    console.log('文章列表处理结果:', {
      articlesCount: articles.value.length,
      total: pagination.total
    })
  } catch (error) {
    console.error('获取文章列表失败:', error)
    articles.value = []
    pagination.total = 0
    // 不显示错误消息，避免在公开页面显示错误
  } finally {
    loading.value = false
  }
}

// 获取推荐文章
const fetchFeaturedArticles = async () => {
  try {
    const response = await newsApi.getPublicNews({
      page: 1,
      limit: 10,
      status: 'published'
    })
    
    console.log('推荐文章API响应:', response)
    
    // 安全地获取数据数组
    let articlesData = []
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      articlesData = response.data.data
    } else if (response.data && Array.isArray(response.data)) {
      articlesData = response.data
    } else {
      console.warn('推荐文章数据格式不正确:', response)
      articlesData = []
    }
    
    // 过滤出推荐文章，取前3个
    featuredArticles.value = articlesData
      .filter(article => article && article.isFeatured)
      .slice(0, 3)
      
    console.log('推荐文章处理结果:', featuredArticles.value)
  } catch (error) {
    console.error('获取推荐文章失败:', error)
    featuredArticles.value = []
  }
}

// 获取热门文章
const fetchHotArticles = async () => {
  try {
    const response = await newsApi.getPublicNews({
      page: 1,
      limit: 20,
      status: 'published'
    })
    
    console.log('热门文章API响应:', response)
    
    // 安全地获取数据数组
    let articlesData = []
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      articlesData = response.data.data
    } else if (response.data && Array.isArray(response.data)) {
      articlesData = response.data
    } else {
      console.warn('热门文章数据格式不正确:', response)
      articlesData = []
    }
    
    // 按浏览量排序，取前5个
    hotArticles.value = articlesData
      .filter(article => article && typeof article.viewCount === 'number')
      .sort((a, b) => b.viewCount - a.viewCount)
      .slice(0, 5)
      
    console.log('热门文章处理结果:', hotArticles.value)
  } catch (error) {
    console.error('获取热门文章失败:', error)
    hotArticles.value = []
  }
}

// 分类切换
const handleCategoryChange = (categoryId: number | undefined) => {
  selectedCategoryId.value = categoryId
  searchKeyword.value = ''
  pagination.page = 1
  fetchArticles()
}

// 搜索处理
const handleSearch = () => {
  selectedCategoryId.value = undefined
  pagination.page = 1
  fetchArticles()
}

// 文章点击
const handleArticleClick = (articleId: number) => {
  router.push(`/portal/news/${articleId}`)
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

// 监听分类变化
watch(selectedCategoryId, () => {
  fetchArticles()
})

// 初始化
onMounted(() => {
  fetchCategories()
  fetchArticles()
  fetchFeaturedArticles()
  fetchHotArticles()
})
</script>

<style scoped>
.news-portal {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.portal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 60px 0;
  text-align: center;
}

.portal-header h1 {
  font-size: 36px;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.portal-header p {
  font-size: 18px;
  margin: 0;
  opacity: 0.9;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.portal-content {
  display: flex;
  gap: 30px;
  padding: 40px 0;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
}

.sidebar-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar-section h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #303133;
  border-bottom: 2px solid #e4e7ed;
  padding-bottom: 8px;
}

.category-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.category-list li {
  padding: 10px 15px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
  color: #606266;
}

.category-list li:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.category-list li.active {
  background-color: #409eff;
  color: white;
}

.hot-article-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
}

.hot-article-item:last-child {
  border-bottom: none;
}

.hot-article-item:hover {
  background-color: #f8f9fa;
  padding-left: 8px;
}

.hot-article-item h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.main-content {
  flex: 1;
}

.search-bar {
  margin-bottom: 30px;
}

.search-input {
  max-width: 400px;
}

.featured-section {
  margin-bottom: 40px;
}

.featured-section h2,
.articles-section h2 {
  font-size: 24px;
  color: #303133;
  margin: 0 0 20px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
}

.featured-articles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.featured-article {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
}

.featured-article:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.articles-list {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.article-item {
  display: flex;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
}

.article-item:last-child {
  border-bottom: none;
}

.article-item:hover {
  background-color: #f8f9fa;
}

.article-image {
  width: 120px;
  height: 80px;
  flex-shrink: 0;
  margin-right: 15px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.article-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  color: #c0c4cc;
  font-size: 24px;
}

.article-content {
  flex: 1;
}

.article-content h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #303133;
  line-height: 1.4;
}

.summary {
  margin: 0 0 12px 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 12px;
  color: #909399;
}

.category {
  background-color: #409eff;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
}

.stats {
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .portal-content {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
  }
  
  .featured-articles {
    grid-template-columns: 1fr;
  }
  
  .article-item {
    flex-direction: column;
  }
  
  .article-image {
    width: 100%;
    height: 200px;
    margin-right: 0;
    margin-bottom: 15px;
  }
}
</style>