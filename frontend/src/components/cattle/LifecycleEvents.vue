<template>
  <div class="lifecycle-events">
    <div class="events-header">
      <div class="header-left">
        <h3>生命周期事件</h3>
        <p>记录牛只从出生到现在的重要事件</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showAddEventDialog = true">
          <el-icon><Plus /></el-icon>
          添加事件
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="events-timeline">
      <el-timeline v-if="events.length > 0">
        <el-timeline-item
          v-for="event in events"
          :key="event.id"
          :timestamp="formatDate(event.event_date)"
          :type="getEventType(event.event_type)"
          :icon="getEventIcon(event.event_type)"
          placement="top"
        >
          <el-card class="event-card">
            <div class="event-header">
              <div class="event-title">
                <span class="event-type">{{ getEventTypeName(event.event_type) }}</span>
                <el-tag :type="getEventTagType(event.event_type)" size="small">
                  {{ getEventStatus(event.event_type) }}
                </el-tag>
              </div>
              <div class="event-actions">
                <el-button size="small" text @click="viewEventDetail(event)">
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button size="small" text @click="editEvent(event)">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </div>
            </div>
            <div class="event-content">
              <p v-if="event.description" class="event-description">{{ event.description }}</p>
              <div v-if="event.data && Object.keys(event.data).length > 0" class="event-data">
                <div v-for="(value, key) in event.data" :key="key" class="data-item">
                  <span class="data-label">{{ getDataLabel(key) }}:</span>
                  <span class="data-value">{{ formatDataValue(key, value) }}</span>
                </div>
              </div>
              <div v-if="event.operator_name" class="event-operator">
                操作人: {{ event.operator_name }}
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      
      <el-empty v-else description="暂无生命周期事件记录" />
    </div>

    <!-- 添加事件对话框 -->
    <el-dialog
      v-model="showAddEventDialog"
      title="添加生命周期事件"
      width="600px"
      @close="resetEventForm"
    >
      <el-form
        ref="eventFormRef"
        :model="eventForm"
        :rules="eventFormRules"
        label-width="100px"
      >
        <el-form-item label="事件类型" prop="event_type">
          <el-select v-model="eventForm.event_type" placeholder="请选择事件类型" style="width: 100%">
            <el-option label="出生" value="birth" />
            <el-option label="采购" value="purchase" />
            <el-option label="转入" value="transfer_in" />
            <el-option label="转出" value="transfer_out" />
            <el-option label="称重记录" value="weight_record" />
            <el-option label="健康检查" value="health_check" />
            <el-option label="疫苗接种" value="vaccination" />
            <el-option label="治疗" value="treatment" />
            <el-option label="配种" value="breeding" />
            <el-option label="妊检" value="pregnancy_check" />
            <el-option label="产犊" value="calving" />
            <el-option label="断奶" value="weaning" />
            <el-option label="销售" value="sale" />
            <el-option label="死亡" value="death" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="事件日期" prop="event_date">
          <el-date-picker
            v-model="eventForm.event_date"
            type="date"
            placeholder="选择事件日期"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="事件描述" prop="description">
          <el-input
            v-model="eventForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入事件描述"
          />
        </el-form-item>
        
        <!-- 根据事件类型显示不同的数据字段 -->
        <template v-if="eventForm.event_type === 'weight_record'">
          <el-form-item label="体重(kg)" prop="weight">
            <el-input-number
              v-model="eventForm.weight"
              :min="0"
              :max="2000"
              :precision="1"
              style="width: 100%"
            />
          </el-form-item>
        </template>
        
        <template v-if="eventForm.event_type === 'health_check'">
          <el-form-item label="健康状态" prop="health_status">
            <el-select v-model="eventForm.health_status" placeholder="请选择健康状态" style="width: 100%">
              <el-option label="健康" value="healthy" />
              <el-option label="患病" value="sick" />
              <el-option label="治疗中" value="treatment" />
            </el-select>
          </el-form-item>
        </template>
        
        <template v-if="eventForm.event_type === 'vaccination'">
          <el-form-item label="疫苗名称" prop="vaccine_name">
            <el-input v-model="eventForm.vaccine_name" placeholder="请输入疫苗名称" />
          </el-form-item>
          <el-form-item label="批次号" prop="batch_number">
            <el-input v-model="eventForm.batch_number" placeholder="请输入批次号" />
          </el-form-item>
        </template>
        
        <template v-if="eventForm.event_type === 'purchase'">
          <el-form-item label="采购价格" prop="purchase_price">
            <el-input-number
              v-model="eventForm.purchase_price"
              :min="0"
              :precision="2"
              style="width: 100%"
            />
          </el-form-item>
        </template>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddEventDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddEvent" :loading="submitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, View, Edit } from '@element-plus/icons-vue'
import { cattleApi } from '@/api/cattle'
import dayjs from 'dayjs'

interface Props {
  cattleId: number
}

const props = defineProps<Props>()

const loading = ref(false)
const submitting = ref(false)
const events = ref<any[]>([])
const showAddEventDialog = ref(false)

const eventForm = reactive({
  event_type: '',
  event_date: '',
  description: '',
  weight: null,
  health_status: '',
  vaccine_name: '',
  batch_number: '',
  purchase_price: null
})

const eventFormRules = {
  event_type: [{ required: true, message: '请选择事件类型', trigger: 'change' }],
  event_date: [{ required: true, message: '请选择事件日期', trigger: 'change' }],
  description: [{ required: true, message: '请输入事件描述', trigger: 'blur' }]
}

const eventFormRef = ref()

onMounted(() => {
  loadEvents()
})

const loadEvents = async () => {
  try {
    loading.value = true
    const response = await cattleApi.getCattleEvents(props.cattleId)
    events.value = response.data || []
  } catch (error) {
    console.error('加载生命周期事件失败:', error)
    ElMessage.error('加载生命周期事件失败')
  } finally {
    loading.value = false
  }
}

const handleAddEvent = async () => {
  try {
    await eventFormRef.value?.validate()
    
    submitting.value = true
    
    const eventData = {
      event_type: eventForm.event_type,
      event_date: dayjs(eventForm.event_date).format('YYYY-MM-DD'),
      description: eventForm.description,
      data: {} as any
    }
    
    // 根据事件类型添加特定数据
    if (eventForm.event_type === 'weight_record' && eventForm.weight) {
      eventData.data.weight = eventForm.weight
    }
    if (eventForm.event_type === 'health_check' && eventForm.health_status) {
      eventData.data.health_status = eventForm.health_status
    }
    if (eventForm.event_type === 'vaccination') {
      if (eventForm.vaccine_name) eventData.data.vaccine_name = eventForm.vaccine_name
      if (eventForm.batch_number) eventData.data.batch_number = eventForm.batch_number
    }
    if (eventForm.event_type === 'purchase' && eventForm.purchase_price) {
      eventData.data.purchase_price = eventForm.purchase_price
    }
    
    await cattleApi.addCattleEvent(props.cattleId, eventData)
    
    ElMessage.success('添加事件成功')
    showAddEventDialog.value = false
    resetEventForm()
    loadEvents()
  } catch (error) {
    console.error('添加事件失败:', error)
    ElMessage.error('添加事件失败')
  } finally {
    submitting.value = false
  }
}

const resetEventForm = () => {
  Object.assign(eventForm, {
    event_type: '',
    event_date: '',
    description: '',
    weight: null,
    health_status: '',
    vaccine_name: '',
    batch_number: '',
    purchase_price: null
  })
  eventFormRef.value?.resetFields()
}

const viewEventDetail = (event: any) => {
  ElMessageBox.alert(
    `<div>
      <p><strong>事件类型:</strong> ${getEventTypeName(event.event_type)}</p>
      <p><strong>事件日期:</strong> ${formatDate(event.event_date)}</p>
      <p><strong>描述:</strong> ${event.description || '无'}</p>
      ${event.data && Object.keys(event.data).length > 0 ? 
        '<p><strong>详细数据:</strong></p>' + 
        Object.entries(event.data).map(([key, value]) => 
          `<p style="margin-left: 20px;">${getDataLabel(key)}: ${formatDataValue(key, value)}</p>`
        ).join('') : ''
      }
    </div>`,
    '事件详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定'
    }
  )
}

const editEvent = (event: any) => {
  ElMessage.info('编辑功能开发中...')
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD')
}

const getEventType = (eventType: string) => {
  const typeMap: Record<string, string> = {
    birth: 'success',
    purchase: 'primary',
    transfer_in: 'info',
    transfer_out: 'warning',
    weight_record: 'info',
    health_check: 'success',
    vaccination: 'success',
    treatment: 'warning',
    breeding: 'primary',
    pregnancy_check: 'info',
    calving: 'success',
    weaning: 'info',
    sale: 'warning',
    death: 'danger',
    other: 'info'
  }
  return typeMap[eventType] || 'info'
}

const getEventIcon = (eventType: string) => {
  // 这里可以根据事件类型返回不同的图标
  return undefined
}

const getEventTypeName = (eventType: string) => {
  const nameMap: Record<string, string> = {
    birth: '出生',
    purchase: '采购',
    transfer_in: '转入',
    transfer_out: '转出',
    weight_record: '称重记录',
    health_check: '健康检查',
    vaccination: '疫苗接种',
    treatment: '治疗',
    breeding: '配种',
    pregnancy_check: '妊检',
    calving: '产犊',
    weaning: '断奶',
    sale: '销售',
    death: '死亡',
    other: '其他'
  }
  return nameMap[eventType] || eventType
}

const getEventTagType = (eventType: string) => {
  const tagMap: Record<string, string> = {
    birth: 'success',
    purchase: 'primary',
    transfer_in: 'info',
    transfer_out: 'warning',
    weight_record: '',
    health_check: 'success',
    vaccination: 'success',
    treatment: 'warning',
    breeding: 'primary',
    pregnancy_check: 'info',
    calving: 'success',
    weaning: 'info',
    sale: 'warning',
    death: 'danger',
    other: 'info'
  }
  return tagMap[eventType] || ''
}

const getEventStatus = (eventType: string) => {
  const statusMap: Record<string, string> = {
    birth: '已完成',
    purchase: '已完成',
    transfer_in: '已完成',
    transfer_out: '已完成',
    weight_record: '已记录',
    health_check: '已检查',
    vaccination: '已接种',
    treatment: '治疗中',
    breeding: '已配种',
    pregnancy_check: '已检查',
    calving: '已产犊',
    weaning: '已断奶',
    sale: '已销售',
    death: '已记录',
    other: '已记录'
  }
  return statusMap[eventType] || '已记录'
}

const getDataLabel = (key: string) => {
  const labelMap: Record<string, string> = {
    weight: '体重',
    health_status: '健康状态',
    vaccine_name: '疫苗名称',
    batch_number: '批次号',
    purchase_price: '采购价格'
  }
  return labelMap[key] || key
}

const formatDataValue = (key: string, value: any) => {
  if (key === 'weight') return `${value} kg`
  if (key === 'purchase_price') return `¥${value}`
  if (key === 'health_status') {
    const statusMap: Record<string, string> = {
      healthy: '健康',
      sick: '患病',
      treatment: '治疗中'
    }
    return statusMap[value] || value
  }
  return value
}
</script>

<style scoped>
.lifecycle-events {
  padding: 20px;
}

.events-header {
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

.events-timeline {
  min-height: 400px;
}

.event-card {
  margin-bottom: 16px;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.event-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-type {
  font-weight: 600;
  font-size: 16px;
}

.event-actions {
  display: flex;
  gap: 4px;
}

.event-content {
  color: #666;
}

.event-description {
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.event-data {
  margin-bottom: 12px;
}

.data-item {
  display: flex;
  margin-bottom: 4px;
}

.data-label {
  font-weight: 500;
  margin-right: 8px;
  min-width: 80px;
}

.data-value {
  color: #333;
}

.event-operator {
  font-size: 12px;
  color: #999;
}
</style>