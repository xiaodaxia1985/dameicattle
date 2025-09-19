<template>
  <div class="cattle-detail">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" class="back-btn">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <div class="title-section">
          <h1 class="page-title">牛只详情</h1>
          <p class="page-description">查看牛只的详细信息和历史记录</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button @click="editCattle">
          <el-icon><Edit /></el-icon>
          编辑
        </el-button>
        <el-button type="primary" @click="showLifecycleDialog">
          <el-icon><Clock /></el-icon>
          生命周期
        </el-button>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <div v-else-if="cattle" class="detail-content">
      <!-- 基本信息卡片 -->
      <el-row :gutter="20">
        <el-col :span="16">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">基本信息</span>
                <el-tag :type="getHealthStatusType(cattle.health_status)" size="large">
                  {{ getHealthStatusText(cattle.health_status) }}
                </el-tag>
              </div>
            </template>
            
            <div class="info-grid">
              <div class="info-item">
                <label>耳标号</label>
                <span class="value primary">{{ cattle.ear_tag }}</span>
              </div>
              <div class="info-item">
                <label>品种</label>
                <span class="value">{{ cattle.breed || '-' }}</span>
              </div>
              <div class="info-item">
                <label>性别</label>
                <span class="value">
                  <el-tag :type="cattle.gender === 'male' ? 'primary' : 'success'" size="small">
                    {{ cattle.gender === 'male' ? '公牛' : '母牛' }}
                  </el-tag>
                </span>
              </div>
              <div class="info-item">
                <label>出生日期</label>
                <span class="value">{{ formatDate(cattle.birth_date) }}</span>
              </div>
              <div class="info-item">
                <label>月龄</label>
                <span class="value">{{ cattle.age_months || '-' }} 个月</span>
              </div>
              <div class="info-item">
                <label>体重</label>
                <span class="value">{{ cattle.weight || '-' }} kg</span>
              </div>
              <div class="info-item">
                <label>体高</label>
                <span class="value">{{ cattle.height || '-' }} cm</span>
              </div>
              <div class="info-item">
                <label>体长</label>
                <span class="value">{{ cattle.body_length || '-' }} cm</span>
              </div>
              <div class="info-item">
                <label>胸围</label>
                <span class="value">{{ cattle.chest_girth || '-' }} cm</span>
              </div>
              <div class="info-item">
                <label>状态</label>
                <span class="value">
                  <el-tag :type="getStatusType(cattle.status)" size="small">
                    {{ getStatusText(cattle.status) }}
                  </el-tag>
                </span>
              </div>
              <div class="info-item">
                <label>所属基地</label>
                <span class="value">{{ cattle.base?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <label>所在牛棚</label>
                <span class="value">{{ cattle.barn?.name || '-' }}</span>
              </div>
            </div>

            <div v-if="cattle.notes" class="notes-section">
              <label>备注</label>
              <p class="notes-content">{{ cattle.notes }}</p>
            </div>
          </el-card>
        </el-col>

        <el-col :span="8">
          <!-- 照片卡片 -->
          <el-card class="photo-card">
            <template #header>
              <div class="card-header">
                <span class="card-title">照片</span>
                <el-button size="small" @click="showPhotoDialog">
                  <el-icon><Camera /></el-icon>
                  管理
                </el-button>
              </div>
            </template>
            
            <div v-if="cattle.photos && cattle.photos.length > 0" class="photo-gallery">
              <div
                v-for="(photo, index) in cattle.photos.slice(0, 4)"
                :key="index"
                class="photo-item"
                @click="previewPhoto(index)"
              >
                <el-image
                  :src="photo.url"
                  :alt="photo.description"
                  fit="cover"
                  class="photo-image"
                />
              </div>
              <div v-if="cattle.photos.length > 4" class="more-photos">
                +{{ cattle.photos.length - 4 }}
              </div>
            </div>
            <div v-else class="no-photos">
              <el-icon class="no-photo-icon"><Picture /></el-icon>
              <p>暂无照片</p>
            </div>
          </el-card>

          <!-- 健康状态卡片 -->
          <el-card class="health-card">
            <template #header>
              <span class="card-title">健康状态</span>
            </template>
            
            <div class="health-info">
              <div class="health-status">
                <el-icon class="health-icon" :class="getHealthIconClass(cattle.health_status)">
                  <component :is="getHealthIcon(cattle.health_status)" />
                </el-icon>
                <div class="health-text">
                  <div class="status-text">{{ getHealthStatusText(cattle.health_status) }}</div>
                  <div class="status-desc">{{ getHealthStatusDesc(cattle.health_status) }}</div>
                </div>
              </div>
              
              <div v-if="cattle.last_health_check" class="last-check">
                <label>最后检查</label>
                <span>{{ formatDateTime(cattle.last_health_check) }}</span>
              </div>
              
              <div v-if="cattle.vaccination_records && cattle.vaccination_records.length > 0" class="vaccination">
                <label>疫苗记录</label>
                <div class="vaccine-list">
                  <div
                    v-for="vaccine in cattle.vaccination_records.slice(0, 3)"
                    :key="vaccine.id"
                    class="vaccine-item"
                  >
                    <span class="vaccine-name">{{ vaccine.vaccine_name }}</span>
                    <span class="vaccine-date">{{ formatDate(vaccine.vaccination_date) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 详细记录标签页 -->
      <el-card class="records-card">
        <el-tabs v-model="activeTab" class="records-tabs">
          <el-tab-pane label="生长记录" name="growth">
            <GrowthRecords :cattle-id="cattle.id" />
          </el-tab-pane>
          <el-tab-pane label="健康记录" name="health">
            <HealthRecords :cattle-id="cattle.id" />
          </el-tab-pane>
          <el-tab-pane label="繁殖记录" name="breeding">
            <BreedingRecords :cattle-id="cattle.id" />
          </el-tab-pane>
          <el-tab-pane label="转群记录" name="transfer">
            <TransferRecords :cattle-id="cattle.id" />
          </el-tab-pane>
          <el-tab-pane label="生命周期" name="lifecycle">
            <LifecycleEvents :cattle-id="cattle.id" />
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>

    <div v-else class="error-container">
      <el-result
        icon="error"
        title="加载失败"
        sub-title="无法加载牛只详情信息"
      >
        <template #extra>
          <el-button type="primary" @click="loadCattleDetail">重新加载</el-button>
        </template>
      </el-result>
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Edit,
  Clock,
  Camera,
  Picture,
  Check,
  Warning,
  FirstAidKit,
  QuestionFilled
} from '@element-plus/icons-vue'
import { cattleApi, type Cattle } from '@/api/cattle'
import dayjs from 'dayjs'

// 组件暂时注释，需要创建
// import GrowthRecords from '@/components/cattle/GrowthRecords.vue'
// import HealthRecords from '@/components/cattle/HealthRecords.vue'
// import BreedingRecords from '@/components/cattle/BreedingRecords.vue'
// import TransferRecords from '@/components/cattle/TransferRecords.vue'
// import LifecycleEvents from '@/components/cattle/LifecycleEvents.vue'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const cattle = ref<Cattle | null>(null)
const activeTab = ref('growth')
const showImageViewer = ref(false)
const currentPhotoIndex = ref(0)

const cattleId = computed(() => Number(route.params.id))

const photoUrls = computed(() => {
  if (!cattle.value?.photos) return []
  return cattle.value.photos.map(photo => photo.url)
})

onMounted(() => {
  if (cattleId.value) {
    loadCattleDetail()
  }
})

const loadCattleDetail = async () => {
  try {
    loading.value = true
    const response = await cattleApi.getCattle(cattleId.value)
    cattle.value = response.data
  } catch (error) {
    console.error('加载牛只详情失败:', error)
    ElMessage.error('加载牛只详情失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.back()
}

const editCattle = () => {
  router.push(`/cattle/edit/${cattleId.value}`)
}

const showLifecycleDialog = () => {
  activeTab.value = 'lifecycle'
}

const showPhotoDialog = () => {
  // TODO: 实现照片管理对话框
  ElMessage.info('照片管理功能待实现')
}

const previewPhoto = (index: number) => {
  currentPhotoIndex.value = index
  showImageViewer.value = true
}

const formatDate = (date: string | null) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD')
}

const formatDateTime = (date: string | null) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const getHealthStatusType = (status: string) => {
  switch (status) {
    case 'healthy': return 'success'
    case 'sick': return 'danger'
    case 'treatment': return 'warning'
    default: return 'info'
  }
}

const getHealthStatusText = (status: string) => {
  switch (status) {
    case 'healthy': return '健康'
    case 'sick': return '患病'
    case 'treatment': return '治疗中'
    default: return '未知'
  }
}

const getHealthStatusDesc = (status: string) => {
  switch (status) {
    case 'healthy': return '身体状况良好'
    case 'sick': return '需要关注治疗'
    case 'treatment': return '正在接受治疗'
    default: return '状态未明确'
  }
}

const getHealthIcon = (status: string) => {
  switch (status) {
    case 'healthy': return Check
    case 'sick': return Warning
    case 'treatment': return FirstAidKit
    default: return QuestionFilled
  }
}

const getHealthIconClass = (status: string) => {
  switch (status) {
    case 'healthy': return 'healthy'
    case 'sick': return 'sick'
    case 'treatment': return 'treatment'
    default: return 'unknown'
  }
}

const getStatusType = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'sold': return 'warning'
    case 'dead': return 'danger'
    case 'transferred': return 'info'
    default: return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'active': return '在场'
    case 'sold': return '已售'
    case 'dead': return '死亡'
    case 'transferred': return '转出'
    default: return '未知'
  }
}

import { h } from 'vue'

// 临时组件占位 - 使用h函数替代JSX以避免TypeScript编译错误
const GrowthRecords = {
  props: ['cattleId'],
  render() {
    return h('div', { class: 'placeholder' }, '生长记录组件待实现')
  }
}

const HealthRecords = {
  props: ['cattleId'],
  render() {
    return h('div', { class: 'placeholder' }, '健康记录组件待实现')
  }
}

const BreedingRecords = {
  props: ['cattleId'],
  render() {
    return h('div', { class: 'placeholder' }, '繁殖记录组件待实现')
  }
}

const TransferRecords = {
  props: ['cattleId'],
  render() {
    return h('div', { class: 'placeholder' }, '转群记录组件待实现')
  }
}

const LifecycleEvents = {
  props: ['cattleId'],
  render() {
    return h('div', { class: 'placeholder' }, '生命周期组件待实现')
  }
}
</script>

<style lang="scss" scoped>
.cattle-detail {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .back-btn {
        padding: 8px 12px;
      }
      
      .title-section {
        .page-title {
          font-size: 24px;
          font-weight: 600;
          color: #303133;
          margin: 0 0 4px 0;
        }
        
        .page-description {
          color: #909399;
          margin: 0;
          font-size: 14px;
        }
      }
    }
    
    .header-actions {
      display: flex;
      gap: 12px;
    }
  }
  
  .loading-container {
    padding: 20px;
  }
  
  .detail-content {
    .info-card {
      margin-bottom: 20px;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .card-title {
          font-size: 16px;
          font-weight: 600;
        }
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          
          label {
            font-size: 12px;
            color: #909399;
            font-weight: 500;
          }
          
          .value {
            font-size: 14px;
            color: #303133;
            
            &.primary {
              font-size: 18px;
              font-weight: 600;
              color: #409eff;
            }
          }
        }
      }
      
      .notes-section {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #ebeef5;
        
        label {
          font-size: 12px;
          color: #909399;
          font-weight: 500;
          display: block;
          margin-bottom: 8px;
        }
        
        .notes-content {
          font-size: 14px;
          color: #303133;
          line-height: 1.6;
          margin: 0;
        }
      }
    }
    
    .photo-card {
      margin-bottom: 20px;
      
      .photo-gallery {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
        position: relative;
        
        .photo-item {
          aspect-ratio: 1;
          cursor: pointer;
          border-radius: 4px;
          overflow: hidden;
          
          .photo-image {
            width: 100%;
            height: 100%;
          }
        }
        
        .more-photos {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
      }
      
      .no-photos {
        text-align: center;
        padding: 40px 20px;
        color: #909399;
        
        .no-photo-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }
        
        p {
          margin: 0;
          font-size: 14px;
        }
      }
    }
    
    .health-card {
      .health-info {
        .health-status {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          
          .health-icon {
            font-size: 32px;
            
            &.healthy { color: #67c23a; }
            &.sick { color: #f56c6c; }
            &.treatment { color: #e6a23c; }
            &.unknown { color: #909399; }
          }
          
          .health-text {
            .status-text {
              font-size: 16px;
              font-weight: 600;
              color: #303133;
              margin-bottom: 4px;
            }
            
            .status-desc {
              font-size: 12px;
              color: #909399;
            }
          }
        }
        
        .last-check {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #ebeef5;
          
          label {
            font-size: 12px;
            color: #909399;
          }
          
          span {
            font-size: 14px;
            color: #303133;
          }
        }
        
        .vaccination {
          margin-top: 16px;
          
          label {
            font-size: 12px;
            color: #909399;
            display: block;
            margin-bottom: 8px;
          }
          
          .vaccine-list {
            .vaccine-item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 4px 0;
              font-size: 12px;
              
              .vaccine-name {
                color: #303133;
              }
              
              .vaccine-date {
                color: #909399;
              }
            }
          }
        }
      }
    }
    
    .records-card {
      .records-tabs {
        :deep(.el-tabs__header) {
          margin-bottom: 20px;
        }
        
        .placeholder {
          text-align: center;
          padding: 40px;
          color: #909399;
          font-size: 14px;
        }
      }
    }
  }
  
  .error-container {
    padding: 40px;
  }
}
</style>