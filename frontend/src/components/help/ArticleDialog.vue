<template>
  <el-dialog
    v-model="visible"
    :title="article?.title || '文章详情'"
    width="800px"
    :before-close="handleClose"
    class="article-dialog"
  >
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>
    
    <div v-else-if="article" class="article-content">
      <div class="article-header">
        <h1>{{ article.title }}</h1>
        <div class="article-meta">
          <span class="category">{{ article.category }}</span>
          <span class="views">{{ article.viewCount }}次浏览</span>
          <span class="date">{{ formatDate(article.updatedAt) }}</span>
        </div>
      </div>
      
      <div class="article-body" v-html="article.content"></div>
      
      <div class="article-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handlePrint">打印</el-button>
      </div>
    </div>
    
    <div v-else class="error-container">
      <el-empty description="文章不存在或已被删除">
        <el-button @click="handleClose">关闭</el-button>
      </el-empty>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { helpApi, type HelpArticle } from '@/api/help'
import { formatDate } from '@/utils/date'

// Props
interface Props {
  articleId: number | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// Reactive data
const visible = ref(true)
const loading = ref(false)
const article = ref<HelpArticle | null>(null)

// Methods
const handleClose = () => {
  visible.value = false
  emit('close')
}

const handlePrint = () => {
  window.print()
}

const loadArticle = async () => {
  if (!props.articleId) return
  
  loading.value = true
  try {
    const response = await helpApi.getArticle(props.articleId)
    article.value = response.data
  } catch (error) {
    ElMessage.error('加载文章失败')
    article.value = null
  } finally {
    loading.value = false
  }
}

// Watch for articleId changes
watch(() => props.articleId, loadArticle, { immediate: true })

// Lifecycle
onMounted(() => {
  loadArticle()
})
</script>

<style scoped>
.article-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.loading-container,
.error-container {
  padding: 30px;
}

.article-content {
  max-height: 70vh;
  overflow-y: auto;
}

.article-header {
  padding: 30px 30px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.article-header h1 {
  color: #333;
  margin-bottom: 15px;
  font-size: 24px;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #666;
}

.category {
  background: #f0f9ff;
  color: #409eff;
  padding: 4px 8px;
  border-radius: 4px;
}

.article-body {
  padding: 30px;
  line-height: 1.8;
  color: #333;
}

.article-body :deep(h1),
.article-body :deep(h2),
.article-body :deep(h3),
.article-body :deep(h4),
.article-body :deep(h5),
.article-body :deep(h6) {
  color: #409eff;
  margin-top: 30px;
  margin-bottom: 15px;
}

.article-body :deep(p) {
  margin-bottom: 15px;
}

.article-body :deep(ul),
.article-body :deep(ol) {
  margin-bottom: 15px;
  padding-left: 30px;
}

.article-body :deep(li) {
  margin-bottom: 8px;
}

.article-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 15px 0;
}

.article-body :deep(code) {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.article-body :deep(pre) {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 15px 0;
}

.article-body :deep(blockquote) {
  border-left: 4px solid #409eff;
  padding-left: 15px;
  margin: 15px 0;
  color: #666;
  font-style: italic;
}

.article-footer {
  padding: 20px 30px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Print styles */
@media print {
  .article-dialog :deep(.el-dialog__header),
  .article-footer {
    display: none !important;
  }
  
  .article-content {
    max-height: none !important;
    overflow: visible !important;
  }
  
  .article-header {
    border-bottom: none;
    padding-bottom: 10px;
  }
  
  .article-body {
    padding-top: 0;
  }
}
</style>