<template>
  <div class="photo-manager">
    <!-- 上传区域 -->
    <div class="upload-section">
      <el-upload
        ref="uploadRef"
        class="photo-upload"
        :http-request="customUpload"
        :headers="uploadHeaders"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
        :file-list="fileList"
        list-type="picture-card"
        multiple
        :limit="10"
        accept="image/*"
      >
        <el-icon class="upload-icon"><Plus /></el-icon>
        <template #tip>
          <div class="el-upload__tip">
            支持 jpg/png/gif 格式，单个文件不超过 5MB，最多上传 10 张
          </div>
        </template>
      </el-upload>
    </div>

    <!-- 照片网格 -->
    <div class="photos-grid" v-if="photos.length > 0">
      <div
        v-for="(photo, index) in photos"
        :key="photo.id || index"
        class="photo-item"
        @click="previewPhoto(index)"
      >
        <div class="photo-wrapper">
          <img :src="photo.url || photo.preview" :alt="photo.name" />
          <div class="photo-overlay">
            <div class="photo-actions">
              <el-button
                type="primary"
                size="small"
                circle
                @click.stop="previewPhoto(index)"
              >
                <el-icon><ZoomIn /></el-icon>
              </el-button>
              <el-button
                type="success"
                size="small"
                circle
                @click.stop="downloadPhoto(photo)"
              >
                <el-icon><Download /></el-icon>
              </el-button>
              <el-button
                type="danger"
                size="small"
                circle
                @click.stop="deletePhoto(photo, index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
        <div class="photo-info">
          <div class="photo-name">{{ photo.name || `照片${index + 1}` }}</div>
          <div class="photo-date">{{ formatDate(photo.created_at || photo.uploadTime) }}</div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <el-empty v-else description="暂无照片" />

    <!-- 照片预览 -->
    <el-dialog
      v-model="previewVisible"
      title="照片预览"
      width="80%"
      top="5vh"
      :close-on-click-modal="true"
    >
      <div class="preview-container">
        <div class="preview-main">
          <img
            v-if="currentPhoto"
            :src="currentPhoto.url || currentPhoto.preview"
            :alt="currentPhoto.name"
            class="preview-image"
          />
        </div>
        
        <div class="preview-controls">
          <el-button
            :disabled="currentPhotoIndex <= 0"
            @click="prevPhoto"
          >
            <el-icon><ArrowLeft /></el-icon>
            上一张
          </el-button>
          
          <span class="photo-counter">
            {{ currentPhotoIndex + 1 }} / {{ photos.length }}
          </span>
          
          <el-button
            :disabled="currentPhotoIndex >= photos.length - 1"
            @click="nextPhoto"
          >
            下一张
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        
        <div class="preview-info" v-if="currentPhoto">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="文件名">
              {{ currentPhoto.name }}
            </el-descriptions-item>
            <el-descriptions-item label="上传时间">
              {{ formatDate(currentPhoto.created_at || currentPhoto.uploadTime) }}
            </el-descriptions-item>
            <el-descriptions-item label="文件大小">
              {{ formatFileSize(currentPhoto.size) }}
            </el-descriptions-item>
            <el-descriptions-item label="图片尺寸">
              {{ currentPhoto.dimensions || '未知' }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
    </el-dialog>

      <!-- 批量操作 -->
      <div class="batch-actions" v-if="photos.length > 0">
        <el-button @click="selectAll">全选</el-button>
        <el-button @click="clearSelection">取消选择</el-button>
        <el-button
          type="danger"
          :disabled="selectedPhotos.length === 0"
          @click="batchDelete"
        >
          批量删除 ({{ selectedPhotos.length }})
        </el-button>
        <el-button
          type="primary"
          :disabled="selectedPhotos.length === 0"
          @click="batchDownload"
        >
          批量下载 ({{ selectedPhotos.length }})
        </el-button>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox, type UploadInstance, type UploadFile, type UploadFiles } from 'element-plus'
import {
  Plus, ZoomIn, Download, Delete, ArrowLeft, ArrowRight
} from '@element-plus/icons-vue'
import { fileServiceApi } from '@/api/microservices'
import { useAuthStore } from '@/stores/auth'
import dayjs from 'dayjs'

interface Props {
  cattleId: number
}

interface Photo {
  id?: number
  name: string
  url?: string
  preview?: string
  size?: number
  created_at?: string
  uploadTime?: string
  dimensions?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'photos-updated': []
  'close': []
}>()

const authStore = useAuthStore()
const uploadRef = ref<UploadInstance>()
const photos = ref<Photo[]>([])
const fileList = ref<UploadFiles>([])
const previewVisible = ref(false)
const currentPhotoIndex = ref(0)
const selectedPhotos = ref<number[]>([])
const loading = ref(false)

// 上传配置 - 修复：使用正确的上传方法
const uploadHeaders = computed(() => ({
  'Authorization': `Bearer ${authStore.token}`
}))

const currentPhoto = computed(() => {
  return photos.value[currentPhotoIndex.value] || null
})

// 加载照片列表 - 修复：确保response.data是数组类型
const loadPhotos = async () => {
  loading.value = true
  try {
    const response = await fileServiceApi.getFiles({
      category: 'cattle_photo',
      cattle_id: props.cattleId
    })
    
    // 确保response.data是数组类型
    const fileList = Array.isArray(response?.data) ? response.data : []
    photos.value = fileList.map((file: any) => ({
      id: file.id,
      name: file.original_name || file.filename,
      url: file.url || file.file_url,
      size: file.size,
      created_at: file.created_at,
      dimensions: file.metadata?.dimensions
    }))
  } catch (error) {
    console.error('加载照片失败:', error)
    ElMessage.error('加载照片失败')
  } finally {
    loading.value = false
  }
}

// 自定义上传方法
const customUpload = async (options: any) => {
  try {
    // 使用metadata参数传递cattle_id
    const metadata = {
      cattle_id: props.cattleId.toString()
    }
    
    const response = await fileServiceApi.uploadFile(options.file, 'cattle_photo', metadata)
    if (response.success) {
      options.onSuccess(response)
    } else {
      options.onError(response)
    }
  } catch (error) {
    console.error('上传失败:', error)
    options.onError(error)
  }
}

// 上传前检查
const beforeUpload = (file: File) => {
  // 检查文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  
  // 检查文件大小 (5MB)
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  
  return true
}

// 上传成功
const handleUploadSuccess = (response: any, file: UploadFile) => {
  if (response.success) {
    ElMessage.success('上传成功')
    loadPhotos() // 重新加载照片列表
    emit('photos-updated')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 上传失败
const handleUploadError = (error: any) => {
  console.error('上传失败:', error)
  ElMessage.error('上传失败')
}

// 预览照片
const previewPhoto = (index: number) => {
  currentPhotoIndex.value = index
  previewVisible.value = true
}

// 上一张照片
const prevPhoto = () => {
  if (currentPhotoIndex.value > 0) {
    currentPhotoIndex.value--
  }
}

// 下一张照片
const nextPhoto = () => {
  if (currentPhotoIndex.value < photos.value.length - 1) {
    currentPhotoIndex.value++
  }
}

// 下载照片
const downloadPhoto = (photo: Photo) => {
  if (photo.id) {
    fileServiceApi.downloadFile(photo.id, photo.name)
  } else if (photo.url) {
    // 如果没有ID但有URL，直接下载
    const link = document.createElement('a')
    link.href = photo.url
    link.download = photo.name
    link.click()
  }
}

// 删除照片
const deletePhoto = async (photo: Photo, index: number) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除照片 "${photo.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (photo.id) {
      await fileServiceApi.deleteFile(photo.id)
    }
    
    photos.value.splice(index, 1)
    ElMessage.success('删除成功')
    emit('photos-updated')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 全选
const selectAll = () => {
  selectedPhotos.value = photos.value.map((_, index) => index)
}

// 取消选择
const clearSelection = () => {
  selectedPhotos.value = []
}

// 批量删除
const batchDelete = async () => {
  if (selectedPhotos.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedPhotos.value.length} 张照片吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 按索引倒序删除，避免索引变化问题
    const sortedIndexes = [...selectedPhotos.value].sort((a, b) => b - a)
    
    for (const index of sortedIndexes) {
      const photo = photos.value[index]
      if (photo.id) {
        try {
          await fileServiceApi.deleteFile(photo.id)
        } catch (error) {
          console.error(`删除照片 ${photo.name} 失败:`, error)
        }
      }
      photos.value.splice(index, 1)
    }
    
    selectedPhotos.value = []
    ElMessage.success('批量删除成功')
    emit('photos-updated')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败')
    }
  }
}

// 批量下载
const batchDownload = () => {
  if (selectedPhotos.value.length === 0) return
  
  selectedPhotos.value.forEach(index => {
    const photo = photos.value[index]
    if (photo) {
      downloadPhoto(photo)
    }
  })
  
  ElMessage.success('开始下载选中的照片')
}

// 格式化日期
const formatDate = (date: string | undefined) => {
  if (!date) return '未知'
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 格式化文件大小
const formatFileSize = (size: number | undefined) => {
  if (!size) return '未知'
  
  if (size < 1024) {
    return `${size} B`
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  } else {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }
}

onMounted(() => {
  loadPhotos()
  
  // 添加键盘事件监听
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      emit('close')
    }
  }
  
  document.addEventListener('keydown', handleKeyDown)
  
  // 组件卸载时移除事件监听
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })
})
</script>

<style scoped>
.photo-manager {
  padding: 20px;
}

.upload-section {
  margin-bottom: 30px;
}

.photo-upload {
  width: 100%;
}

.upload-icon {
  font-size: 28px;
  color: #8c939d;
}

.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.photo-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.photo-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.photo-wrapper {
  position: relative;
  width: 100%;
  height: 150px;
  overflow: hidden;
}

.photo-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.photo-actions {
  display: flex;
  gap: 8px;
}

.photo-info {
  padding: 10px;
  background: white;
}

.photo-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.photo-date {
  font-size: 12px;
  color: #909399;
}

.preview-container {
  text-align: center;
}

.preview-main {
  margin-bottom: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
}

.preview-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.photo-counter {
  font-size: 14px;
  color: #606266;
}

.preview-info {
  text-align: left;
}

.batch-actions {
  display: flex;
  gap: 12px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  border-top: 1px solid #e4e7ed;
}
</style>