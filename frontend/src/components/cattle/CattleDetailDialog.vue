<template>
  <el-dialog
    v-model="dialogVisible"
    title="牛只详情"
    width="1000px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div v-if="cattle" class="cattle-detail">
      <!-- 基本信息卡片 -->
      <el-row :gutter="16">
        <el-col :span="16">
          <el-card title="基本信息" class="info-card">
            <template #header>
              <div class="card-header">
                <span>基本信息</span>
                <el-button size="small" type="primary" @click="editCattle">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
              </div>
            </template>
            
            <el-descriptions :column="2" border>
              <el-descriptions-item label="耳标号">
                <el-tag type="primary" size="large">{{ cattle.ear_tag }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="品种">{{ cattle.breed }}</el-descriptions-item>
              <el-descriptions-item label="性别">
                <el-tag :type="cattle.gender === 'male' ? 'primary' : 'success'">
                  {{ cattle.gender === 'male' ? '公牛' : '母牛' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="健康状态">
                <el-tag :type="getHealthStatusType(cattle.health_status)">
                  {{ getHealthStatusText(cattle.health_status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="出生日期">
                {{ cattle.birth_date || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="年龄">
                {{ cattle.age_months ? `${cattle.age_months}个月` : '-' }}
                {{ cattle.age_days ? `(${cattle.age_days}天)` : '' }}
              </el-descriptions-item>
              <el-descriptions-item label="体重">
                {{ cattle.weight ? `${cattle.weight}kg` : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(cattle.status)">
                  {{ getStatusText(cattle.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="所属基地">
                {{ cattle.base?.name || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="所属牛棚">
                {{ cattle.barn?.name || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="来源">
                {{ getSourceText(cattle.source) }}
              </el-descriptions-item>
              <el-descriptions-item label="采购价格">
                {{ cattle.purchase_price ? `¥${cattle.purchase_price}` : '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="采购日期">
                {{ cattle.purchase_date || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">
                {{ formatTime(cattle.created_at) }}
              </el-descriptions-item>
            </el-descriptions>
            
            <div v-if="cattle.notes" class="notes-section">
              <h4>备注信息</h4>
              <p>{{ cattle.notes }}</p>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="8">
          <!-- 照片展示 -->
          <el-card title="牛只照片" class="photo-card">
            <div v-if="cattle.photos && cattle.photos.length > 0" class="photo-gallery">
              <el-image
                v-for="(photo, index) in cattle.photos"
                :key="index"
                :src="photo"
                :preview-src-list="cattle.photos"
                :initial-index="index"
                fit="cover"
                class="photo-item"
              />
            </div>
            <div v-else class="no-photos">
              <el-icon><Picture /></el-icon>
              <p>暂无照片</p>
            </div>
          </el-card>
          
          <!-- 家族信息 -->
          <el-card title="家族信息" class="family-card">
            <div class="family-info">
              <div v-if="cattle.father" class="parent-info">
                <label>父牛:</label>
                <el-link type="primary" @click="viewParent(cattle.father)">
                  {{ cattle.father.ear_tag }} - {{ cattle.father.breed }}
                </el-link>
              </div>
              <div v-if="cattle.mother" class="parent-info">
                <label>母牛:</label>
                <el-link type="primary" @click="viewParent(cattle.mother)">
                  {{ cattle.mother.ear_tag }} - {{ cattle.mother.breed }}
                </el-link>
              </div>
              <div v-if="!cattle.father && !cattle.mother" class="no-family">
                暂无家族信息
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 生命周期事件 -->
      <el-card title="生命周期事件" class="events-card">
        <template #header>
          <div class="card-header">
            <span>生命周期事件</span>
            <el-button size="small" type="primary" @click="addEvent">
              <el-icon><Plus /></el-icon>
              添加事件
            </el-button>
          </div>
        </template>
        
        <el-timeline v-if="events.length > 0">
          <el-timeline-item
            v-for="event in events"
            :key="event.id"
            :timestamp="formatTime(event.event_date)"
            placement="top"
          >
            <el-card class="event-item">
              <div class="event-header">
                <el-tag :type="getEventTypeColor(event.event_type)" size="small">
                  {{ getEventTypeText(event.event_type) }}
                </el-tag>
                <span class="operator">{{ event.operator?.real_name || '系统' }}</span>
              </div>
              <div class="event-content">
                <p>{{ event.description || '-' }}</p>
                <div v-if="event.data && Object.keys(event.data).length > 0" class="event-data">
                  <el-descriptions :column="1" size="small">
                    <el-descriptions-item
                      v-for="(value, key) in event.data"
                      :key="key"
                      :label="String(key)"
                    >
                      {{ value }}
                    </el-descriptions-item>
                  </el-descriptions>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        
        <el-empty v-else description="暂无生命周期事件" />
        
        <!-- 加载更多 -->
        <div v-if="hasMoreEvents" class="load-more">
          <el-button @click="loadMoreEvents" :loading="eventsLoading">
            加载更多
          </el-button>
        </div>
      </el-card>
    </div>
    
    <div v-else-if="loading" class="loading">
      <el-skeleton :rows="10" animated />
    </div>
    
    <div v-else class="error">
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

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useCattleStore } from '@/stores/cattle'
import { cattleApi } from '@/api/cattle'
import type { Cattle, CattleEvent } from '@/api/cattle'
import dayjs from 'dayjs'

interface Props {
  modelValue: boolean
  cattleId: number | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'edit', cattle: Cattle): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const cattleStore = useCattleStore()

const loading = ref(false)
const eventsLoading = ref(false)
const cattle = ref<Cattle | null>(null)
const events = ref<CattleEvent[]>([])
const eventsPage = ref(1)
const hasMoreEvents = ref(true)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 监听对话框打开和牛只ID变化
watch([dialogVisible, () => props.cattleId], ([visible, cattleId]) => {
  if (visible && cattleId) {
    loadCattleDetail()
    loadEvents()
  }
})

const loadCattleDetail = async () => {
  if (!props.cattleId) return
  
  try {
    loading.value = true
    cattle.value = await cattleStore.fetchCattleById(props.cattleId)
  } catch (error) {
    console.error('加载牛只详情失败:', error)
    ElMessage.error('加载牛只详情失败')
  } finally {
    loading.value = false
  }
}

const loadEvents = async (page = 1) => {
  if (!props.cattleId) return
  
  try {
    eventsLoading.value = true
    const response = await cattleApi.getEvents(props.cattleId, { page, limit: 10 })
    
    if (page === 1) {
      events.value = response.data
    } else {
      events.value.push(...response.data)
    }
    
    eventsPage.value = page
    hasMoreEvents.value = response.data.length === 10
  } catch (error) {
    console.error('加载生命周期事件失败:', error)
    ElMessage.error('加载生命周期事件失败')
  } finally {
    eventsLoading.value = false
  }
}

const loadMoreEvents = () => {
  loadEvents(eventsPage.value + 1)
}

const editCattle = () => {
  if (cattle.value) {
    emit('edit', cattle.value)
  }
}

const addEvent = () => {
  ElMessage.info('添加事件功能开发中')
}

const viewParent = (parent: any) => {
  // 打开父牛详情
  ElMessage.info(`查看 ${parent.ear_tag} 详情功能开发中`)
}

const handleClose = () => {
  cattle.value = null
  events.value = []
  eventsPage.value = 1
  hasMoreEvents.value = true
  emit('update:modelValue', false)
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

const getSourceText = (source: string) => {
  switch (source) {
    case 'born': return '出生'
    case 'purchased': return '采购'
    case 'transferred': return '转入'
    default: return '未知'
  }
}

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'birth': return 'success'
    case 'purchase': return 'primary'
    case 'health_check': return 'success'
    case 'vaccination': return 'warning'
    case 'treatment': return 'danger'
    case 'weight_record': return 'info'
    case 'transfer_in':
    case 'transfer_out': return 'warning'
    case 'sale': return 'success'
    case 'death': return 'danger'
    default: return 'info'
  }
}

const getEventTypeText = (type: string) => {
  const typeMap: { [key: string]: string } = {
    birth: '出生',
    purchase: '采购',
    transfer_in: '转入',
    transfer_out: '转出',
    weight_record: '称重',
    health_check: '健康检查',
    vaccination: '疫苗接种',
    treatment: '治疗',
    breeding: '配种',
    pregnancy_check: '妊娠检查',
    calving: '产犊',
    weaning: '断奶',
    sale: '销售',
    death: '死亡',
    other: '其他'
  }
  return typeMap[type] || type
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}
</script>

<style lang="scss" scoped>
.cattle-detail {
  .info-card {
    margin-bottom: 16px;
    
    .notes-section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid #ebeef5;
      
      h4 {
        margin: 0 0 8px 0;
        color: #303133;
      }
      
      p {
        margin: 0;
        color: #606266;
        line-height: 1.6;
      }
    }
  }
  
  .photo-card {
    margin-bottom: 16px;
    
    .photo-gallery {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      
      .photo-item {
        width: 100%;
        height: 80px;
        border-radius: 4px;
      }
    }
    
    .no-photos {
      text-align: center;
      color: #c0c4cc;
      padding: 40px 0;
      
      .el-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
    }
  }
  
  .family-card {
    .family-info {
      .parent-info {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        
        label {
          width: 40px;
          color: #909399;
          font-size: 14px;
        }
      }
      
      .no-family {
        color: #c0c4cc;
        text-align: center;
        padding: 20px 0;
      }
    }
  }
  
  .events-card {
    margin-top: 16px;
    
    .event-item {
      margin-bottom: 0;
      
      .event-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        .operator {
          font-size: 12px;
          color: #909399;
        }
      }
      
      .event-content {
        p {
          margin: 0 0 8px 0;
          color: #606266;
        }
        
        .event-data {
          background: #f5f7fa;
          padding: 8px;
          border-radius: 4px;
          font-size: 12px;
        }
      }
    }
    
    .load-more {
      text-align: center;
      margin-top: 16px;
    }
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.loading {
  padding: 20px;
}

.error {
  text-align: center;
}

.dialog-footer {
  text-align: right;
}
</style>