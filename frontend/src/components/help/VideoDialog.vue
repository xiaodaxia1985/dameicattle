<template>
  <el-dialog
    v-model="visible"
    :title="tutorial?.title || '视频教程'"
    width="900px"
    :before-close="handleClose"
    class="video-dialog"
  >
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="6" animated />
    </div>
    
    <div v-else-if="tutorial" class="video-content">
      <div class="video-player">
        <video
          ref="videoRef"
          :src="tutorial.videoUrl"
          :poster="tutorial.thumbnailUrl"
          controls
          preload="metadata"
          @loadedmetadata="handleVideoLoaded"
          @timeupdate="handleTimeUpdate"
          @ended="handleVideoEnded"
        >
          您的浏览器不支持视频播放
        </video>
      </div>
      
      <div class="video-info">
        <div class="video-header">
          <h2>{{ tutorial.title }}</h2>
          <div class="video-meta">
            <span class="duration">{{ tutorial.duration }}分钟</span>
            <span class="level">{{ getLevelText(tutorial.level) }}</span>
            <span class="category">{{ tutorial.category }}</span>
            <span class="views">{{ tutorial.viewCount }}次观看</span>
          </div>
        </div>
        
        <div class="video-description">
          <p>{{ tutorial.description }}</p>
        </div>
        
        <div v-if="tutorial.userProgress" class="progress-section">
          <div class="progress-header">
            <span>学习进度</span>
            <span>{{ Math.round(tutorial.userProgress.progress) }}%</span>
          </div>
          <el-progress
            :percentage="tutorial.userProgress.progress"
            :status="tutorial.userProgress.completed ? 'success' : ''"
            :stroke-width="8"
          />
        </div>
        
        <div class="video-actions">
          <el-button @click="handleClose">关闭</el-button>
          <el-button type="primary" @click="toggleFullscreen">全屏播放</el-button>
          <el-button v-if="!tutorial.userProgress?.completed" type="success" @click="markAsCompleted">
            标记为已完成
          </el-button>
        </div>
      </div>
    </div>
    
    <div v-else class="error-container">
      <el-empty description="视频不存在或已被删除">
        <el-button @click="handleClose">关闭</el-button>
      </el-empty>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { helpApi, type Tutorial } from '@/api/help'

// Props
interface Props {
  tutorialId: number | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// Reactive data
const visible = ref(true)
const loading = ref(false)
const tutorial = ref<Tutorial | null>(null)
const videoRef = ref<HTMLVideoElement>()
const currentTime = ref(0)
const duration = ref(0)

// Methods
const handleClose = () => {
  // Save progress before closing
  if (tutorial.value && videoRef.value) {
    saveProgress()
  }
  visible.value = false
  emit('close')
}

const handleVideoLoaded = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration
    
    // Resume from last position if available
    if (tutorial.value?.userProgress && tutorial.value.userProgress.progress > 0) {
      const resumeTime = (tutorial.value.userProgress.progress / 100) * duration.value
      videoRef.value.currentTime = resumeTime
    }
  }
}

const handleTimeUpdate = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
    
    // Update progress every 10 seconds
    if (Math.floor(currentTime.value) % 10 === 0) {
      updateProgress()
    }
  }
}

const handleVideoEnded = () => {
  markAsCompleted()
}

const updateProgress = () => {
  if (!tutorial.value || !videoRef.value || duration.value === 0) return
  
  const progress = (currentTime.value / duration.value) * 100
  
  if (tutorial.value.userProgress) {
    tutorial.value.userProgress.progress = Math.max(progress, tutorial.value.userProgress.progress)
  } else {
    tutorial.value.userProgress = {
      progress,
      completed: false
    }
  }
}

const saveProgress = async () => {
  if (!tutorial.value || !tutorial.value.userProgress) return
  
  try {
    // In a real app, you would save progress to the server
    // await helpApi.saveTutorialProgress(tutorial.value.id, tutorial.value.userProgress)
  } catch (error) {
    console.error('Failed to save progress:', error)
  }
}

const markAsCompleted = async () => {
  if (!tutorial.value) return
  
  try {
    if (tutorial.value.userProgress) {
      tutorial.value.userProgress.progress = 100
      tutorial.value.userProgress.completed = true
    } else {
      tutorial.value.userProgress = {
        progress: 100,
        completed: true
      }
    }
    
    await saveProgress()
    ElMessage.success('已标记为完成')
  } catch (error) {
    ElMessage.error('标记完成失败')
  }
}

const toggleFullscreen = () => {
  if (!videoRef.value) return
  
  if (videoRef.value.requestFullscreen) {
    videoRef.value.requestFullscreen()
  } else if ((videoRef.value as any).webkitRequestFullscreen) {
    ;(videoRef.value as any).webkitRequestFullscreen()
  } else if ((videoRef.value as any).msRequestFullscreen) {
    ;(videoRef.value as any).msRequestFullscreen()
  }
}

const getLevelText = (level: string): string => {
  const levelMap: Record<string, string> = {
    beginner: '初级',
    intermediate: '中级',
    advanced: '高级'
  }
  return levelMap[level] || level
}

const loadTutorial = async () => {
  if (!props.tutorialId) return
  
  loading.value = true
  try {
    // In a real app, you would fetch tutorial details
    // const response = await helpApi.getTutorial(props.tutorialId)
    // tutorial.value = response.data
    
    // Mock data for now
    tutorial.value = {
      id: props.tutorialId,
      title: '示例视频教程',
      description: '这是一个示例视频教程的描述。',
      thumbnailUrl: '/api/placeholder/video-thumbnail.jpg',
      videoUrl: '/api/placeholder/video.mp4',
      duration: 15,
      level: 'beginner',
      category: '基础操作',
      viewCount: 123,
      userProgress: {
        progress: 0,
        completed: false
      }
    }
  } catch (error) {
    ElMessage.error('加载视频失败')
    tutorial.value = null
  } finally {
    loading.value = false
  }
}

// Watch for tutorialId changes
watch(() => props.tutorialId, loadTutorial, { immediate: true })

// Lifecycle
onMounted(() => {
  loadTutorial()
})

onUnmounted(() => {
  // Save progress when component is destroyed
  if (tutorial.value && videoRef.value) {
    saveProgress()
  }
})
</script>

<style scoped>
.video-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.loading-container,
.error-container {
  padding: 30px;
}

.video-content {
  display: flex;
  flex-direction: column;
}

.video-player {
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.video-player video {
  width: 100%;
  height: auto;
  max-height: 500px;
}

.video-info {
  padding: 30px;
}

.video-header h2 {
  color: #333;
  margin-bottom: 15px;
  font-size: 20px;
}

.video-meta {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.level {
  background: #f0f9ff;
  color: #409eff;
  padding: 2px 8px;
  border-radius: 4px;
}

.video-description {
  margin-bottom: 25px;
}

.video-description p {
  color: #666;
  line-height: 1.6;
}

.progress-section {
  margin-bottom: 25px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  color: #333;
}

.video-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

@media (max-width: 768px) {
  .video-dialog {
    width: 95% !important;
  }
  
  .video-player {
    min-height: 250px;
  }
  
  .video-info {
    padding: 20px;
  }
  
  .video-meta {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .video-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>