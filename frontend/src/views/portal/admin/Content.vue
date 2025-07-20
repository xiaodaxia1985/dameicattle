<template>
  <div class="content-management">
    <div class="content-header">
      <h2>内容管理</h2>
      <p>管理门户网站的页面内容</p>
    </div>

    <!-- 页面选择 -->
    <div class="page-selector">
      <div class="selector-tabs">
        <button 
          v-for="page in pages" 
          :key="page.key"
          class="tab-btn"
          :class="{ active: selectedPage === page.key }"
          @click="selectedPage = page.key"
        >
          {{ page.name }}
        </button>
      </div>
    </div>

    <!-- 内容编辑区域 -->
    <div class="content-editor">
      <div class="editor-sections">
        <div 
          v-for="section in currentPageSections" 
          :key="section.key"
          class="section-card"
        >
          <div class="section-header">
            <h3>{{ section.name }}</h3>
            <div class="section-actions">
              <button 
                class="btn btn-primary"
                @click="editSection(section)"
              >
                编辑
              </button>
              <button 
                class="btn btn-outline"
                @click="previewSection(section)"
              >
                预览
              </button>
            </div>
          </div>
          
          <div class="section-content">
            <div class="content-preview">
              <div v-if="section.type === 'text'" class="text-preview">
                {{ section.content || '暂无内容' }}
              </div>
              <div v-else-if="section.type === 'html'" class="html-preview">
                <div v-html="section.content || '暂无内容'"></div>
              </div>
              <div v-else-if="section.type === 'image'" class="image-preview">
                <img v-if="section.content" :src="section.content" :alt="section.name" />
                <div v-else class="no-image">暂无图片</div>
              </div>
              <div v-else-if="section.type === 'json'" class="json-preview">
                <pre>{{ JSON.stringify(section.content, null, 2) }}</pre>
              </div>
            </div>
            
            <div class="content-meta">
              <span class="meta-item">类型: {{ getTypeLabel(section.type) }}</span>
              <span class="meta-item">更新时间: {{ formatDate(section.updatedAt) }}</span>
              <span class="meta-item" :class="{ active: section.isActive, inactive: !section.isActive }">
                {{ section.isActive ? '已启用' : '已禁用' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click="closeEditModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑内容 - {{ editingSection?.name }}</h3>
          <button class="close-btn" @click="closeEditModal">×</button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveContent">
            <div class="form-group">
              <label>内容类型</label>
              <select v-model="editForm.type" disabled>
                <option value="text">文本</option>
                <option value="html">HTML</option>
                <option value="image">图片</option>
                <option value="json">JSON</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>标题</label>
              <input 
                type="text" 
                v-model="editForm.title" 
                placeholder="请输入标题"
              />
            </div>
            
            <div class="form-group">
              <label>内容</label>
              <textarea 
                v-if="editForm.type === 'text'"
                v-model="editForm.content"
                rows="8"
                placeholder="请输入文本内容"
              ></textarea>
              
              <textarea 
                v-else-if="editForm.type === 'html'"
                v-model="editForm.content"
                rows="12"
                placeholder="请输入HTML内容"
                class="code-editor"
              ></textarea>
              
              <div v-else-if="editForm.type === 'image'" class="image-upload">
                <div class="upload-area" @click="triggerFileUpload">
                  <input 
                    ref="fileInput" 
                    type="file" 
                    accept="image/*" 
                    @change="handleFileUpload"
                    style="display: none"
                  />
                  <div v-if="editForm.content" class="uploaded-image">
                    <img :src="editForm.content" alt="预览图" />
                    <div class="image-actions">
                      <button type="button" @click="triggerFileUpload">更换图片</button>
                      <button type="button" @click="editForm.content = ''">删除图片</button>
                    </div>
                  </div>
                  <div v-else class="upload-placeholder">
                    <i class="upload-icon">📁</i>
                    <p>点击上传图片</p>
                  </div>
                </div>
              </div>
              
              <textarea 
                v-else-if="editForm.type === 'json'"
                v-model="editForm.content"
                rows="10"
                placeholder="请输入JSON内容"
                class="code-editor"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="editForm.isActive" />
                <span class="checkmark"></span>
                启用此内容
              </label>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="saving">
                {{ saving ? '保存中...' : '保存' }}
              </button>
              <button type="button" class="btn btn-outline" @click="closeEditModal">
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { portalApi } from '@/api/portal'

// 页面配置
const pages = ref([
  { key: 'home', name: '首页' },
  { key: 'about', name: '关于我们' },
  { key: 'products', name: '产品服务' },
  { key: 'culture', name: '企业文化' },
  { key: 'history', name: '发展历程' },
  { key: 'contact', name: '联系我们' }
])

const selectedPage = ref('home')

// 内容数据
const contentSections = ref<any[]>([])

// 当前页面的内容区块
const currentPageSections = computed(() => {
  return contentSections.value.filter(section => section.page === selectedPage.value)
})

// 编辑相关
const showEditModal = ref(false)
const editingSection = ref<any>(null)
const saving = ref(false)
const fileInput = ref<HTMLInputElement>()

const editForm = reactive({
  id: 0,
  title: '',
  content: '',
  type: 'text',
  isActive: true
})

// 获取类型标签
const getTypeLabel = (type: string) => {
  const labels = {
    text: '文本',
    html: 'HTML',
    image: '图片',
    json: 'JSON'
  }
  return labels[type as keyof typeof labels] || type
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 编辑内容区块
const editSection = (section: any) => {
  editingSection.value = section
  Object.assign(editForm, {
    id: section.id,
    title: section.title || '',
    content: section.content || '',
    type: section.type,
    isActive: section.isActive
  })
  showEditModal.value = true
}

// 预览内容区块
const previewSection = (section: any) => {
  // 这里可以实现预览功能
  alert(`预览 ${section.name} 内容`)
}

// 关闭编辑弹窗
const closeEditModal = () => {
  showEditModal.value = false
  editingSection.value = null
  Object.assign(editForm, {
    id: 0,
    title: '',
    content: '',
    type: 'text',
    isActive: true
  })
}

// 触发文件上传
const triggerFileUpload = () => {
  fileInput.value?.click()
}

// 处理文件上传
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  try {
    const response = await portalApi.uploadFile(file, 'content')
    editForm.content = response.data.url
  } catch (error) {
    console.error('文件上传失败:', error)
    alert('文件上传失败，请重试')
  }
}

// 保存内容
const saveContent = async () => {
  if (!editingSection.value) return
  
  saving.value = true
  try {
    await portalApi.updatePageContent(editForm.id, {
      title: editForm.title,
      content: editForm.content,
      isActive: editForm.isActive
    })
    
    // 更新本地数据
    const index = contentSections.value.findIndex(s => s.id === editForm.id)
    if (index !== -1) {
      Object.assign(contentSections.value[index], {
        title: editForm.title,
        content: editForm.content,
        isActive: editForm.isActive,
        updatedAt: new Date().toISOString()
      })
    }
    
    alert('保存成功')
    closeEditModal()
  } catch (error) {
    console.error('保存失败:', error)
    alert('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// 获取页面内容
const fetchPageContents = async () => {
  try {
    const response = await portalApi.getPageContents()
    contentSections.value = response.data
  } catch (error) {
    console.error('获取页面内容失败:', error)
    // 使用模拟数据
    contentSections.value = [
      {
        id: 1,
        page: 'home',
        section: 'hero',
        key: 'title',
        name: '首页标题',
        title: '肉牛全生命周期管理系统',
        content: '专业的数字化牧场管理解决方案，助力现代化畜牧业发展',
        type: 'text',
        isActive: true,
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 2,
        page: 'home',
        section: 'hero',
        key: 'subtitle',
        name: '首页副标题',
        title: '副标题',
        content: '通过先进的技术手段，为牧场管理提供全方位的数字化解决方案',
        type: 'text',
        isActive: true,
        updatedAt: '2024-01-15T10:30:00Z'
      },
      {
        id: 3,
        page: 'about',
        section: 'intro',
        key: 'description',
        name: '公司简介',
        title: '关于我们',
        content: '我们是一家专注于现代化畜牧业数字化转型的科技公司...',
        type: 'html',
        isActive: true,
        updatedAt: '2024-01-15T10:30:00Z'
      }
    ]
  }
}

onMounted(() => {
  fetchPageContents()
})
</script>

<style scoped>
.content-management {
  max-width: 100%;
}

.content-header {
  margin-bottom: 30px;
}

.content-header h2 {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.content-header p {
  font-size: 16px;
  color: #6c757d;
  margin: 0;
}

/* 页面选择器 */
.page-selector {
  margin-bottom: 30px;
}

.selector-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tab-btn {
  padding: 8px 16px;
  border: 1px solid #e9ecef;
  background: white;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn:hover {
  border-color: #667eea;
}

.tab-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* 内容编辑器 */
.editor-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f8f9fa;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  text-decoration: none;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd8;
}

.btn-outline {
  background: transparent;
  color: #667eea;
  border: 1px solid #667eea;
}

.btn-outline:hover {
  background: #667eea;
  color: white;
}

.section-content {
  padding: 24px;
}

.content-preview {
  margin-bottom: 16px;
  min-height: 60px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.text-preview {
  font-size: 14px;
  line-height: 1.6;
  color: #2c3e50;
}

.html-preview {
  font-size: 14px;
  line-height: 1.6;
}

.image-preview img {
  max-width: 200px;
  max-height: 150px;
  border-radius: 6px;
}

.no-image {
  color: #6c757d;
  font-style: italic;
}

.json-preview pre {
  font-size: 12px;
  color: #495057;
  margin: 0;
  white-space: pre-wrap;
}

.content-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 12px;
  color: #6c757d;
  padding: 4px 8px;
  background: #e9ecef;
  border-radius: 4px;
}

.meta-item.active {
  background: #d4edda;
  color: #155724;
}

.meta-item.inactive {
  background: #f8d7da;
  color: #721c24;
}

/* 编辑弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6c757d;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #2c3e50;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 8px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.code-editor {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.image-upload {
  border: 2px dashed #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}

.upload-area {
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-area:hover {
  border-color: #667eea;
}

.uploaded-image {
  padding: 16px;
  text-align: center;
}

.uploaded-image img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 6px;
  margin-bottom: 12px;
}

.image-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.image-actions button {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #e9ecef;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.upload-placeholder {
  padding: 40px;
  text-align: center;
  color: #6c757d;
}

.upload-icon {
  font-size: 32px;
  margin-bottom: 8px;
  display: block;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #2c3e50;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin-right: 8px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.form-actions .btn {
  padding: 8px 16px;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .selector-tabs {
    flex-direction: column;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .content-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>