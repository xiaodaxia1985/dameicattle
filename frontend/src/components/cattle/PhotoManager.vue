<template>
  <div class="photo-manager">
    <div class="manager-header">
      <div class="header-left">
        <h3>照片管理</h3>
        <p>管理牛只的照片档案</p>
      </div>
      <div class="header-actions">
        <el-upload
          ref="uploadRef"
          :action="uploadUrl"
          :headers="uploadHeaders"
          :data="uploadData"
          :before-upload="beforeUpload"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :show-file-list="false"
          accept="image/*"
          multiple
        >
          <el-button type="primary">
            <el-icon><Plus /></el-icon>
            上传照片
          </el-button>
        </el-upload>
      </div>
    </div>

    <div v-loading="loading" class="photo-gallery">
      <div v-if="photos.length > 0" class="photo-grid">
        <div
          v-for="(photo, index) in photos"
          :key="photo.id"
          class="photo-item"
          @click="previewPhoto(index)"
        >
          <div class="photo-wrapper">
            <el-image
              :src="photo.url"
              :alt="photo.name"
              fit="cover"
              class="photo-image"
              :preview-src-list="photoUrls"
              :initial-index="index"
              hide-on-click-modal
            />
            <div class="photo-overlay">
              <div class="photo-actions">
                <el-button
                  size="small"
                  type="primary"
                  text
                  @click.stop="previewPhoto(index)"
                >
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button
                  size="small"
                  type="primary"
                  text
                  @click.stop="downloadPhoto(photo)"
                >
                  <el-icon><Download /></el-icon>
                </el-button>
                <el-button
                  size="small"
                  type="danger"
                  text
                  @click.stop="deletePhoto(photo)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
          <div class="photo-info">
            <div class="photo-name">{{ photo.name }}</div>
            <div class="photo-date">{{ formatDate(photo.created_at) }}</div>
          </div>
        </div>
      </div>
      
      <el-empty v-else description="暂无照片" />
    </div>

    <!-- 照片预览 -->
    <el-image-viewer
      v-if="showImageViewer"
      :url-list="photoUrls"
      :initial-index="currentPhotoIndex"
      @close="showImageViewer = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, View, Download, Delete } from '@element-plus/icons-vue'
import { cattleApi } from '@/api/cattle'
import { useAuthStore } from '@/stores/auth'
import dayjs from 'dayjs'

interface Props {
  cattleId: number
}

const props = defineProps<Props>()

const authStore = useAuthStore()

const loading = ref(false)
const photos = ref<any[]>([])
const showImageViewer = ref(false)
const currentPhotoIndex = ref(0)
const uploadRef = ref()

const uploadUrl = computed(() => `/api/v1/file/upload`)
const uploadHeaders = computed(() => ({
  'Authorization': `Bearer ${authStore.token}`
}))
const uploadData = computed(() => ({
  type: 'cattle_photo',
  related_id: props.cattleId
}))

const photoUrls = computed(() => photos.value.map(photo => photo.url))

onMounted(() => {
  loadPhotos()
})

const loadPhotos = async () => {
  try {
    loading.value = true
    const response = await cattleApi.getCattlePhotos(props.cattleId)
    photos.value = response.data || []
  } catch (error) {
    console.error('加载照片失败:', error)
    ElMessage.error('加载照片失败')
  } finally {
    loading.value = false
  }
}

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }
  return true
}

const handleUploadSuccess = (response: any) => {
  if (response.success) {
    ElMessage.success('照片上传成功')
    loadPhotos()
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const handleUploadError = (error: any) => {
  console.error('上传失败:', error)
  ElMessage.error('照片上传失败')
}

const previewPhoto = (index: number) => {
  currentPhotoIndex.value = index
  showImageViewer.value = true
}

const downloadPhoto = (photo: any) => {
  const link = document.createElement('a')
  link.href = photo.url
  link.download = photo.name
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const deletePhoto = async (photo: any) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这张照片吗？删除后无法恢复。',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await cattleApi.deleteCattlePhoto(props.cattleId, photo.id)
    ElMessage.success('删除成功')
    loadPhotos()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除照片失败:', error)
      ElMessage.error('删除照片失败')
    }
  }
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD')
}
</script>

<style scoped>
.photo-manager {
  padding: 20px;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.header-left p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.photo-gallery {
  min-height: 400px;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.photo-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.photo-item:hover {
  transform: translateY(-2px);
}

.photo-wrapper {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
}

.photo-image {
  width: 100%;
  height: 100%;
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
  transition: opacity 0.2s;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

.photo-actions {
  display: flex;
  gap: 8px;
}

.photo-actions .el-button {
  color: white;
}

.photo-info {
  padding: 8px 0;
  text-align: center;
}

.photo-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.photo-date {
  font-size: 12px;
  color: #666;
}
</style>