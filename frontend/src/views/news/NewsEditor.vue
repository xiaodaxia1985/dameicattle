<template>
  <div class="news-editor">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑文章' : '新建文章' }}</h2>
      <div class="header-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button @click="handleSaveDraft">保存草稿</el-button>
        <el-button type="primary" @click="handlePublish">发布</el-button>
      </div>
    </div>

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="news-form"
    >
      <el-row :gutter="20">
        <el-col :span="16">
          <!-- 基本信息 -->
          <el-card class="form-card">
            <template #header>
              <span>基本信息</span>
            </template>
            
            <el-form-item label="文章标题" prop="title">
              <el-input
                v-model="form.title"
                placeholder="请输入文章标题"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="副标题">
              <el-input
                v-model="form.subtitle"
                placeholder="请输入副标题（可选）"
                maxlength="300"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="文章摘要">
              <el-input
                v-model="form.summary"
                type="textarea"
                :rows="3"
                placeholder="请输入文章摘要（可选）"
                maxlength="1000"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="文章内容" prop="content">
              <el-input
                v-model="form.content"
                type="textarea"
                :rows="15"
                placeholder="请输入文章内容（支持HTML格式）"
                class="content-editor"
              />
              <div class="editor-tip">
                提示：支持HTML格式，如 &lt;p&gt;段落&lt;/p&gt;、&lt;h1&gt;标题&lt;/h1&gt;、&lt;strong&gt;粗体&lt;/strong&gt; 等
              </div>
            </el-form-item>
          </el-card>
        </el-col>

        <el-col :span="8">
          <!-- 发布设置 -->
          <el-card class="form-card">
            <template #header>
              <span>发布设置</span>
            </template>

            <el-form-item label="文章分类" prop="categoryId">
              <el-select v-model="form.categoryId" placeholder="选择分类" style="width: 100%">
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="文章标签">
              <el-input
                v-model="form.tags"
                placeholder="多个标签用逗号分隔"
                maxlength="500"
              />
            </el-form-item>

            <el-form-item label="封面图片">
              <el-upload
                class="cover-uploader"
                :action="uploadUrl"
                :headers="uploadHeaders"
                :show-file-list="false"
                :on-success="handleCoverSuccess"
                :before-upload="beforeCoverUpload"
              >
                <img v-if="form.coverImage" :src="form.coverImage" class="cover-image" />
                <el-icon v-else class="cover-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>

            <el-form-item>
              <el-checkbox v-model="form.isFeatured">推荐文章</el-checkbox>
            </el-form-item>

            <el-form-item>
              <el-checkbox v-model="form.isTop">置顶文章</el-checkbox>
            </el-form-item>
          </el-card>

          <!-- SEO设置 -->
          <el-card class="form-card">
            <template #header>
              <span>SEO设置</span>
            </template>

            <el-form-item label="SEO标题">
              <el-input
                v-model="form.seoTitle"
                placeholder="搜索引擎显示的标题"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>

            <el-form-item label="SEO关键词">
              <el-input
                v-model="form.seoKeywords"
                placeholder="多个关键词用逗号分隔"
                maxlength="500"
              />
            </el-form-item>

            <el-form-item label="SEO描述">
              <el-input
                v-model="form.seoDescription"
                type="textarea"
                :rows="3"
                placeholder="搜索引擎显示的描述"
                maxlength="500"
                show-word-limit
              />
            </el-form-item>
          </el-card>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type UploadProps } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { newsApi, type NewsArticle, type NewsCategory } from '@/api/news'
import { useAuthStore } from '@/stores/auth'

// 简单的富文本编辑器实现
// TODO: 可以后续集成 Quill 或其他富文本编辑器

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const formRef = ref<FormInstance>()

const loading = ref(false)
const categories = ref<NewsCategory[]>([])

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  title: '',
  subtitle: '',
  categoryId: undefined as number | undefined,
  content: '',
  summary: '',
  coverImage: '',
  tags: '',
  isFeatured: false,
  isTop: false,
  seoTitle: '',
  seoKeywords: '',
  seoDescription: ''
})

// 表单验证规则
const rules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 1, max: 200, message: '标题长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择文章分类', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' }
  ]
}

// 上传配置
const uploadUrl = 'http://localhost:3000/api/v1/file/upload/image'
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${authStore.token}`
}))

// 简单编辑器初始化（预留接口）
const initEditor = () => {
  // TODO: 可以在这里初始化富文本编辑器
  console.log('编辑器初始化完成')
}

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await newsApi.getCategories({ isActive: true })
    categories.value = response.data
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

// 获取文章详情（编辑模式）
const fetchArticle = async (id: number) => {
  loading.value = true
  try {
    const response = await newsApi.getArticleById(id)
    const article = response.data
    
    Object.assign(form, {
      title: article.title,
      subtitle: article.subtitle || '',
      categoryId: article.categoryId,
      content: article.content,
      summary: article.summary || '',
      coverImage: article.coverImage || '',
      tags: article.tags || '',
      isFeatured: article.isFeatured,
      isTop: article.isTop,
      seoTitle: article.seoTitle || '',
      seoKeywords: article.seoKeywords || '',
      seoDescription: article.seoDescription || ''
    })

    // 内容已经通过 Object.assign 设置到 form.content 中
  } catch (error) {
    console.error('获取文章详情失败:', error)
    ElMessage.error('获取文章详情失败')
  } finally {
    loading.value = false
  }
}

// 封面图片上传
const handleCoverSuccess: UploadProps['onSuccess'] = (response) => {
  form.coverImage = response.data.url
}

const beforeCoverUpload: UploadProps['beforeUpload'] = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  return true
}

// 保存草稿
const handleSaveDraft = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    const data = {
      ...form,
      status: 'draft' as const
    }

    if (isEdit.value) {
      await newsApi.updateArticle(Number(route.params.id), data)
      ElMessage.success('草稿保存成功')
    } else {
      await newsApi.createArticle(data)
      ElMessage.success('草稿创建成功')
      router.push('/news')
    }
  } catch (error) {
    console.error('保存草稿失败:', error)
    ElMessage.error('保存草稿失败')
  }
}

// 发布文章
const handlePublish = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    const data = {
      ...form,
      status: 'published' as const,
      publishTime: new Date().toISOString()
    }

    if (isEdit.value) {
      await newsApi.updateArticle(Number(route.params.id), data)
      ElMessage.success('文章发布成功')
    } else {
      await newsApi.createArticle(data)
      ElMessage.success('文章发布成功')
    }
    
    router.push('/news')
  } catch (error) {
    console.error('发布文章失败:', error)
    ElMessage.error('发布文章失败')
  }
}

// 取消编辑
const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('确认取消编辑吗？未保存的内容将丢失！', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '继续编辑',
      type: 'warning'
    })
    
    router.push('/news')
  } catch (error) {
    // 用户取消
  }
}

// 初始化
onMounted(async () => {
  await fetchCategories()
  initEditor()
  
  if (isEdit.value) {
    await fetchArticle(Number(route.params.id))
  }
})

// 清理
onBeforeUnmount(() => {
  // 清理资源
  console.log('组件卸载')
})
</script>

<style scoped>
.news-editor {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.news-form {
  max-width: 1200px;
}

.form-card {
  margin-bottom: 20px;
}

.editor-container {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.editor {
  min-height: 400px;
}

.cover-uploader {
  width: 100%;
}

.cover-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: 0.2s;
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}

.cover-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.cover-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
}

.content-editor {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.editor-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  line-height: 1.4;
}
</style>