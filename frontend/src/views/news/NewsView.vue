<template>
  <div class="news-view">
    <div class="page-header">
      <el-button @click="handleBack">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
      <div class="header-actions">
        <el-button type="primary" @click="handleEdit">编辑</el-button>
        <el-dropdown @command="handleCommand">
          <el-button>
            更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-if="article?.status === 'draft'"
                command="publish"
              >
                发布
              </el-dropdown-item>
              <el-dropdown-item
                v-if="article?.status === 'published'"
                command="archive"
              >
                归档
              </el-dropdown-item>
              <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <el-card v-loading="loading" class="article-card">
      <template v-if="article">
        <!-- 文章头部信息 -->
        <div class="article-header">
          <div class="article-meta">
            <el-tag
              :type="getStatusType(article.status)"
              size="large"
            >
              {{ getStatusText(article.status) }}
            </el-tag>
            <div class="meta-tags">
              <el-tag v-if="article.isTop" type="danger" size="small">置顶</el-tag>
              <el-tag v-if="article.isFeatured" type="warning" size="small">推荐</el-tag>
            </div>
          </div>

          <h1 class="article-title">{{ article.title }}</h1>
          
          <h2 v-if="article.subtitle" class="article-subtitle">
            {{ article.subtitle }}
          </h2>

          <div class="article-info">
            <div class="info-item">
              <span class="label">分类：</span>
              <el-tag size="small">{{ article.category?.name }}</el-tag>
            </div>
            <div class="info-item">
              <span class="label">作者：</span>
              <span>{{ article.authorName || '未知' }}</span>
            </div>
            <div class="info-item">
              <span class="label">发布时间：</span>
              <span>{{ article.publishTime ? formatDate(article.publishTime) : '未发布' }}</span>
            </div>
            <div class="info-item">
              <span class="label">浏览量：</span>
              <span>{{ article.viewCount }}</span>
            </div>
            <div class="info-item">
              <span class="label">点赞数：</span>
              <span>{{ article.likeCount }}</span>
            </div>
          </div>

          <div v-if="article.tags" class="article-tags">
            <span class="label">标签：</span>
            <el-tag
              v-for="tag in article.tags.split(',')"
              :key="tag"
              size="small"
              class="tag-item"
            >
              {{ tag.trim() }}
            </el-tag>
          </div>
        </div>

        <!-- 封面图片 -->
        <div v-if="article.coverImage" class="cover-image">
          <img :src="article.coverImage" :alt="article.title" />
        </div>

        <!-- 文章摘要 -->
        <div v-if="article.summary" class="article-summary">
          <h3>摘要</h3>
          <p>{{ article.summary }}</p>
        </div>

        <!-- 文章内容 -->
        <div class="article-content">
          <h3>正文</h3>
          <div class="content-html" v-html="article.content"></div>
        </div>

        <!-- SEO信息 -->
        <div v-if="showSeoInfo" class="seo-info">
          <h3>SEO信息</h3>
          <div class="seo-item">
            <span class="label">SEO标题：</span>
            <span>{{ article.seoTitle || '未设置' }}</span>
          </div>
          <div class="seo-item">
            <span class="label">SEO关键词：</span>
            <span>{{ article.seoKeywords || '未设置' }}</span>
          </div>
          <div class="seo-item">
            <span class="label">SEO描述：</span>
            <span>{{ article.seoDescription || '未设置' }}</span>
          </div>
        </div>

        <!-- 操作记录 -->
        <div class="article-footer">
          <div class="footer-info">
            <span>创建时间：{{ formatDate(article.createdAt) }}</span>
            <span>更新时间：{{ formatDate(article.updatedAt) }}</span>
          </div>
          <el-button @click="showSeoInfo = !showSeoInfo" text>
            {{ showSeoInfo ? '隐藏' : '显示' }}SEO信息
          </el-button>
        </div>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ArrowDown } from '@element-plus/icons-vue'
import { newsApi, type NewsArticle } from '@/api/news'
import { formatDate } from '@/utils/date'

const route = useRoute()
const router = useRouter()

// 响应式数据
const loading = ref(false)
const showSeoInfo = ref(false)
const article = ref<NewsArticle | null>(null)

// 获取文章详情
const fetchArticle = async (id: number) => {
  loading.value = true
  try {
    const response = await newsApi.getArticleById(id)
    article.value = response.data
  } catch (error) {
    console.error('获取文章详情失败:', error)
    ElMessage.error('获取文章详情失败')
  } finally {
    loading.value = false
  }
}

// 返回列表
const handleBack = () => {
  router.push('/news')
}

// 编辑文章
const handleEdit = () => {
  router.push(`/news/edit/${article.value?.id}`)
}

// 操作处理
const handleCommand = async (command: string) => {
  if (!article.value) return

  switch (command) {
    case 'publish':
      await handlePublish()
      break
    case 'archive':
      await handleArchive()
      break
    case 'delete':
      await handleDelete()
      break
  }
}

// 发布文章
const handlePublish = async () => {
  if (!article.value) return

  try {
    await ElMessageBox.confirm('确认发布这篇文章吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await newsApi.publishArticle(article.value.id)
    ElMessage.success('文章发布成功')
    fetchArticle(article.value.id)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布文章失败:', error)
      ElMessage.error('发布文章失败')
    }
  }
}

// 归档文章
const handleArchive = async () => {
  if (!article.value) return

  try {
    await ElMessageBox.confirm('确认归档这篇文章吗？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await newsApi.updateArticle(article.value.id, { status: 'archived' })
    ElMessage.success('文章归档成功')
    fetchArticle(article.value.id)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('归档文章失败:', error)
      ElMessage.error('归档文章失败')
    }
  }
}

// 删除文章
const handleDelete = async () => {
  if (!article.value) return

  try {
    await ElMessageBox.confirm('确认删除这篇文章吗？删除后无法恢复！', '警告', {
      confirmButtonText: '确认删除',
      cancelButtonText: '取消',
      type: 'error'
    })
    
    await newsApi.deleteArticle(article.value.id)
    ElMessage.success('文章删除成功')
    router.push('/news')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文章失败:', error)
      ElMessage.error('删除文章失败')
    }
  }
}

// 工具函数
const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
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
  const id = Number(route.params.id)
  if (id) {
    fetchArticle(id)
  }
})
</script>

<style scoped>
.news-view {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.article-card {
  max-width: 1000px;
  margin: 0 auto;
}

.article-header {
  margin-bottom: 30px;
}

.article-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.meta-tags {
  display: flex;
  gap: 8px;
}

.article-title {
  font-size: 28px;
  font-weight: bold;
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

.article-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.info-item {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.article-tags {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-item {
  margin-right: 4px;
}

.label {
  color: #909399;
  margin-right: 8px;
}

.cover-image {
  margin: 30px 0;
  text-align: center;
}

.cover-image img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.article-summary {
  margin: 30px 0;
  padding: 20px;
  background-color: #f0f9ff;
  border-left: 4px solid #409eff;
  border-radius: 6px;
}

.article-summary h3 {
  margin: 0 0 10px 0;
  color: #409eff;
}

.article-summary p {
  margin: 0;
  line-height: 1.6;
  color: #606266;
}

.article-content {
  margin: 30px 0;
}

.article-content h3 {
  margin: 0 0 20px 0;
  color: #303133;
  border-bottom: 2px solid #e4e7ed;
  padding-bottom: 10px;
}

.content-html {
  line-height: 1.8;
  color: #303133;
}

.content-html :deep(h1),
.content-html :deep(h2),
.content-html :deep(h3),
.content-html :deep(h4),
.content-html :deep(h5),
.content-html :deep(h6) {
  margin: 20px 0 10px 0;
  color: #303133;
}

.content-html :deep(p) {
  margin: 10px 0;
}

.content-html :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.content-html :deep(blockquote) {
  margin: 20px 0;
  padding: 15px 20px;
  background-color: #f8f9fa;
  border-left: 4px solid #e4e7ed;
  color: #606266;
}

.content-html :deep(code) {
  background-color: #f1f2f3;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.content-html :deep(pre) {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
}

.seo-info {
  margin: 30px 0;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 6px;
}

.seo-info h3 {
  margin: 0 0 15px 0;
  color: #303133;
}

.seo-item {
  margin-bottom: 10px;
  font-size: 14px;
}

.article-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.footer-info {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #909399;
}
</style>