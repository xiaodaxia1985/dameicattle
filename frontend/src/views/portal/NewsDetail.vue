<template>
  <div class="news-detail">
    <div class="container">
      <!-- 面包屑导航 -->
      <div class="breadcrumb">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item @click="router.push('/portal/news')">新闻中心</el-breadcrumb-item>
          <el-breadcrumb-item v-if="article?.category">
            {{ article.category.name }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ article?.title }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <div class="detail-content">
        <!-- 主内容区 -->
        <main class="main-content">
          <article v-loading="loading" class="article">
            <template v-if="article">
              <!-- 文章头部 -->
              <header class="article-header">
                <h1 class="article-title">{{ article.title }}</h1>
                <h2 v-if="article.subtitle" class="article-subtitle">
                  {{ article.subtitle }}
                </h2>
                
                <div class="article-meta">
                  <div class="meta-item">
                    <el-icon><User /></el-icon>
                    <span>{{ article.authorName || '未知作者' }}</span>
                  </div>
                  <div class="meta-item">
                    <el-icon><Calendar /></el-icon>
                    <span>{{ formatDate(article.publishTime || article.createdAt) }}</span>
                  </div>
                  <div class="meta-item">
                    <el-icon><View /></el-icon>
                    <span>{{ article.viewCount || 0 }} 浏览</span>
                  </div>
                </div>

                <div v-if="article.tags" class="article-tags">
                  <el-tag
                    v-for="tag in article.tags.split(',')"
                    :key="tag"
                    size="small"
                    class="tag-item"
                  >
                    {{ tag.trim() }}
                  </el-tag>
                </div>
              </header>

              <!-- 封面图片 -->
              <div v-if="article.coverImage" class="cover-image">
                <img :src="article.coverImage" :alt="article.title" />
              </div>

              <!-- 文章摘要 -->
              <div v-if="article.summary" class="article-summary">
                <div class="summary-content">
                  {{ article.summary }}
                </div>
              </div>

              <!-- 文章内容 -->
              <div class="article-content">
                <div class="content-html" v-html="article.content"></div>
              </div>

              <!-- 文章底部 -->
              <footer class="article-footer">
                <div class="article-info">
                  <p>发布时间：{{ formatDate(article.publishTime || article.createdAt) }}</p>
                  <p>最后更新：{{ formatDate(article.updatedAt) }}</p>
                </div>
              </footer>
            </template>
          </article>

          <!-- 相关文章 -->
          <div v-if="relatedArticles.length > 0" class="related-articles">
            <h3>相关文章</h3>
            <div class="related-list">
              <div
                v-for="relatedArticle in relatedArticles"
                :key="relatedArticle.id"
                class="related-item"
                @click="handleRelatedClick(relatedArticle.id)"
              >
                <div class="related-image">
                  <img
                    v-if="relatedArticle.coverImage"
                    :src="relatedArticle.coverImage"
                    :alt="relatedArticle.title"
                  />
                  <div v-else class="no-image">
                    <el-icon><Document /></el-icon>
                  </div>
                </div>
                <div class="related-content">
                  <h4>{{ relatedArticle.title }}</h4>
                  <div class="related-meta">
                    <span>{{ formatDate(relatedArticle.publishTime || relatedArticle.createdAt, 'MM-DD') }}</span>
                    <span>{{ relatedArticle.viewCount }} 浏览</span>
                  </div>
                </div>
              </div>
            </div>
          </div>


        </main>

        <!-- 侧边栏 -->
        <aside class="sidebar">
          <!-- 目录 -->
          <div v-if="tocItems.length > 0" class="sidebar-section">
            <h3>文章目录</h3>
            <ul class="toc-list">
              <li
                v-for="item in tocItems"
                :key="item.id"
                :class="['toc-item', `toc-level-${item.level}`]"
                @click="scrollToHeading(item.id)"
              >
                {{ item.text }}
              </li>
            </ul>
          </div>

          <!-- 最新文章 -->
          <div class="sidebar-section">
            <h3>最新文章</h3>
            <div class="latest-articles">
              <div
                v-for="latestArticle in latestArticles"
                :key="latestArticle.id"
                class="latest-item"
                @click="handleRelatedClick(latestArticle.id)"
              >
                <h4>{{ latestArticle.title }}</h4>
                <div class="latest-meta">
                  <span>{{ formatDate(latestArticle.publishTime || latestArticle.createdAt, 'MM-DD') }}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User, Calendar, View, Document
} from '@element-plus/icons-vue'
import { newsApi, type NewsArticle } from '@/api/news'
import { formatDate } from '@/utils/date'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)

const article = ref<NewsArticle | null>(null)
const relatedArticles = ref<NewsArticle[]>([])
const latestArticles = ref<NewsArticle[]>([])
const tocItems = ref<Array<{ id: string; text: string; level: number }>>([])

// 获取文章详情
const fetchArticle = async (id: number) => {
  loading.value = true
  try {
    const response = await newsApi.getArticleById(id)
    article.value = response.data
    
    // 生成目录
    await nextTick()
    generateToc()
  } catch (error) {
    console.error('获取文章详情失败:', error)
    ElMessage.error('获取文章详情失败')
  } finally {
    loading.value = false
  }
}



// 获取相关文章
const fetchRelatedArticles = async (categoryId: number, currentId: number) => {
  try {
    const response = await newsApi.getArticles({
      page: 1,
      limit: 4,
      categoryId,
      status: 'published'
    })
    // 根据API实现，response.data 应该是 { data: [...], pagination: {...} }
    relatedArticles.value = (response.data.data || []).filter(a => a.id !== currentId)
  } catch (error) {
    console.error('获取相关文章失败:', error)
  }
}

// 获取最新文章
const fetchLatestArticles = async () => {
  try {
    const response = await newsApi.getArticles({
      page: 1,
      limit: 5,
      status: 'published'
    })
    // 根据API实现，response.data 应该是 { data: [...], pagination: {...} }
    latestArticles.value = response.data.data || []
  } catch (error) {
    console.error('获取最新文章失败:', error)
  }
}

// 生成目录
const generateToc = () => {
  if (!article.value) return
  
  const contentEl = document.querySelector('.content-html')
  if (!contentEl) return
  
  const headings = contentEl.querySelectorAll('h1, h2, h3, h4, h5, h6')
  tocItems.value = Array.from(headings).map((heading, index) => {
    const id = `heading-${index}`
    heading.id = id
    return {
      id,
      text: heading.textContent || '',
      level: parseInt(heading.tagName.charAt(1))
    }
  })
}

// 滚动到标题
const scrollToHeading = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}



// 相关文章点击
const handleRelatedClick = (articleId: number) => {
  router.push(`/portal/news/${articleId}`)
  // 重新加载页面数据
  fetchArticle(articleId)
  window.scrollTo(0, 0)
}

// 初始化
onMounted(() => {
  const id = Number(route.params.id)
  if (id) {
    fetchArticle(id)
    fetchLatestArticles()
    
    // 获取相关文章需要等文章加载完成
    setTimeout(() => {
      if (article.value?.categoryId) {
        fetchRelatedArticles(article.value.categoryId, id)
      }
    }, 1000)
  }
})
</script>

<style scoped>
.news-detail {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 20px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.breadcrumb {
  margin-bottom: 20px;
}

.breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #303133;
  font-weight: normal;
}

.detail-content {
  display: flex;
  gap: 30px;
}

.main-content {
  flex: 1;
}

.article {
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.article-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.article-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

.article-subtitle {
  font-size: 18px;
  color: #606266;
  margin: 0 0 20px 0;
  font-weight: normal;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 15px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #909399;
}

.article-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  margin: 0;
}

.cover-image {
  margin: 30px 0;
  text-align: center;
}

.cover-image img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.article-summary {
  margin: 30px 0;
  padding: 20px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-left: 4px solid #0ea5e9;
  border-radius: 6px;
}

.summary-content {
  font-size: 16px;
  line-height: 1.6;
  color: #0f172a;
  font-style: italic;
}

.article-content {
  margin: 30px 0;
  line-height: 1.8;
  color: #303133;
}

.content-html :deep(h1),
.content-html :deep(h2),
.content-html :deep(h3),
.content-html :deep(h4),
.content-html :deep(h5),
.content-html :deep(h6) {
  margin: 30px 0 15px 0;
  color: #303133;
  font-weight: 600;
}

.content-html :deep(p) {
  margin: 15px 0;
}

.content-html :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  margin: 20px 0;
}

.content-html :deep(blockquote) {
  margin: 20px 0;
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-left: 4px solid #e4e7ed;
  color: #606266;
  font-style: italic;
}

.article-footer {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.article-actions {
  display: flex;
  gap: 12px;
}

.article-info {
  font-size: 12px;
  color: #909399;
}

.article-info p {
  margin: 4px 0;
}

.related-articles,
.comments-section {
  background: white;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.related-articles h3,
.comments-section h3 {
  margin: 0 0 20px 0;
  font-size: 20px;
  color: #303133;
  border-bottom: 2px solid #409eff;
  padding-bottom: 10px;
}

.related-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.related-item {
  display: flex;
  gap: 12px;
  cursor: pointer;
  padding: 15px;
  border-radius: 6px;
  transition: all 0.3s;
}

.related-item:hover {
  background-color: #f8f9fa;
}

.related-image {
  width: 60px;
  height: 60px;
  flex-shrink: 0;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.related-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  color: #c0c4cc;
  font-size: 20px;
}

.related-content h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
  line-height: 1.4;
}

.related-meta {
  font-size: 12px;
  color: #909399;
}

.comment-form {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.comment-textarea {
  margin-top: 15px;
}

.form-actions {
  margin-top: 15px;
  text-align: right;
}

.comments-list {
  margin-top: 20px;
}

.comment-item {
  display: flex;
  gap: 15px;
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-avatar,
.reply-avatar {
  width: 40px;
  height: 40px;
  background-color: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.reply-avatar {
  width: 32px;
  height: 32px;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 8px;
}

.comment-author {
  font-weight: 600;
  color: #303133;
}

.comment-time {
  font-size: 12px;
  color: #909399;
}

.comment-text {
  color: #606266;
  line-height: 1.6;
}

.replies {
  margin-top: 15px;
  padding-left: 20px;
  border-left: 2px solid #f0f0f0;
}

.reply-item {
  display: flex;
  gap: 12px;
  margin-top: 15px;
}

.reply-content {
  flex: 1;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.reply-author {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.reply-time {
  font-size: 11px;
  color: #909399;
}

.reply-text {
  color: #606266;
  line-height: 1.6;
  font-size: 14px;
}

.empty-comments {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
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

.toc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.toc-item {
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
  color: #606266;
  font-size: 14px;
  line-height: 1.4;
}

.toc-item:hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.toc-level-2 {
  padding-left: 24px;
}

.toc-level-3 {
  padding-left: 36px;
}

.latest-item {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s;
}

.latest-item:last-child {
  border-bottom: none;
}

.latest-item:hover {
  background-color: #f8f9fa;
  padding-left: 8px;
}

.latest-item h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #303133;
  line-height: 1.4;
}

.latest-meta {
  font-size: 12px;
  color: #909399;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .detail-content {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
  }
  
  .article {
    padding: 20px;
  }
  
  .article-title {
    font-size: 24px;
  }
  
  .article-footer {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .related-list {
    grid-template-columns: 1fr;
  }
}
</style>