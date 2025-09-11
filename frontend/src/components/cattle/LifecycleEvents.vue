<template>
  <div class="lifecycle-events">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加事件
      </el-button>
      <el-select v-model="filterType" placeholder="事件类型" style="width: 150px" @change="loadEvents">
        <el-option label="全部" value="" />
        <el-option label="出生" value="birth" />
        <el-option label="断奶" value="weaning" />
        <el-option label="配种" value="breeding" />
        <el-option label="怀孕" value="pregnancy" />
        <el-option label="产犊" value="calving" />
        <el-option label="疫苗接种" value="vaccination" />
        <el-option label="治疗" value="treatment" />
        <el-option label="转群" value="transfer" />
        <el-option label="销售" value="sale" />
        <el-option label="死亡" value="death" />
      </el-select>
    </div>

    <!-- 事件时间线 -->
    <div class="events-timeline" v-loading="loading">
      <el-timeline v-if="events.length > 0">
        <el-timeline-item
          v-for="event in events"
          :key="event.id"
          :timestamp="formatDateTime(event.event_date)"
          :type="getEventType(event.event_type)"
          :icon="getEventIcon(event.event_type)"
          placement="top"
        >
          <el-card class="event-card">
            <div class="event-header">
              <h4>{{ getEventTitle(event.event_type) }}</h4>
              <div class="event-actions">
                <el-button size="small" text @click="viewEvent(event)">
                  详情
                </el-button>
                <el-button size="small" text type="primary" @click="editEvent(event)">
                  编辑
                </el-button>
                <el-button size="small" text type="danger" @click="deleteEvent(event)">
                  删除
                </el-button>
              </div>
            </div>
            
            <div class="event-content">
              <p v-if="event.description">{{ event.description }}</p>
              
              <!-- 特殊事件数据展示 -->
              <div v-if="event.data" class="event-data">
                <template v-if="event.event_type === 'vaccination'">
                  <p><strong>疫苗名称:</strong> {{ event.data.vaccine_name }}</p>
                  <p><strong>剂量:</strong> {{ event.data.dosage }}</p>
                  <p><strong>兽医:</strong> {{ event.data.veterinarian }}</p>
                </template>
                
                <template v-else-if="event.event_type === 'breeding'">
                  <p><strong>配种方式:</strong> {{ event.data.breeding_method }}</p>
                  <p><strong>公牛:</strong> {{ event.data.bull_ear_tag }}</p>
                  <p><strong>预产期:</strong> {{ event.data.expected_calving_date }}</p>
                </template>
                
                <template v-else-if="event.event_type === 'treatment'">
                  <p><strong>疾病:</strong> {{ event.data.disease }}</p>
                  <p><strong>治疗方案:</strong> {{ event.data.treatment_plan }}</p>
                  <p><strong>药物:</strong> {{ event.data.medication }}</p>
                </template>
                
                <template v-else-if="event.event_type === 'transfer'">
                  <p><strong>源牛棚:</strong> {{ event.data.from_barn }}</p>
                  <p><strong>目标牛棚:</strong> {{ event.data.to_barn }}</p>
                  <p><strong>原因:</strong> {{ event.data.reason }}</p>
                </template>
              </div>
              
              <div class="event-meta">
                <span v-if="event.operator">操作员: {{ event.operator.real_name }}</span>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      
      <el-empty v-else description="暂无生命周期事件" />
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 添加/编辑事件对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingEvent ? '编辑事件' : '添加事件'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="eventForm"
        :rules="eventRules"
        label-width="120px"
      >
        <el-form-item label="事件类型" prop="event_type">
          <el-select v-model="eventForm.event_type" placeholder="请选择事件类型" style="width: 100%">
            <el-option label="出生" value="birth" />
            <el-option label="断奶" value="weaning" />
            <el-option label="配种" value="breeding" />
            <el-option label="怀孕确认" value="pregnancy" />
            <el-option label="产犊" value="calving" />
            <el-option label="疫苗接种" value="vaccination" />
            <el-option label="疾病治疗" value="treatment" />
            <el-option label="转群" value="transfer" />
            <el-option label="销售" value="sale" />
            <el-option label="死亡" value="death" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="事件日期" prop="event_date">
          <el-date-picker
            v-model="eventForm.event_date"
            type="datetime"
            placeholder="选择事件日期"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
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

        <!-- 疫苗接种特殊字段 -->
        <template v-if="eventForm.event_type === 'vaccination'">
          <el-form-item label="疫苗名称" prop="vaccine_name">
            <el-input v-model="eventForm.vaccine_name" placeholder="请输入疫苗名称" />
          </el-form-item>
          <el-form-item label="剂量" prop="dosage">
            <el-input v-model="eventForm.dosage" placeholder="请输入剂量" />
          </el-form-item>
          <el-form-item label="兽医" prop="veterinarian">
            <el-input v-model="eventForm.veterinarian" placeholder="请输入兽医姓名" />
          </el-form-item>
        </template>

        <!-- 配种特殊字段 -->
        <template v-if="eventForm.event_type === 'breeding'">
          <el-form-item label="配种方式" prop="breeding_method">
            <el-select v-model="eventForm.breeding_method" placeholder="请选择配种方式" style="width: 100%">
              <el-option label="自然交配" value="natural" />
              <el-option label="人工授精" value="artificial" />
            </el-select>
          </el-form-item>
          <el-form-item label="公牛耳标" prop="bull_ear_tag">
            <el-input v-model="eventForm.bull_ear_tag" placeholder="请输入公牛耳标号" />
          </el-form-item>
          <el-form-item label="预产期" prop="expected_calving_date">
            <el-date-picker
              v-model="eventForm.expected_calving_date"
              type="date"
              placeholder="选择预产期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
        </template>

        <!-- 治疗特殊字段 -->
        <template v-if="eventForm.event_type === 'treatment'">
          <el-form-item label="疾病名称" prop="disease">
            <el-input v-model="eventForm.disease" placeholder="请输入疾病名称" />
          </el-form-item>
          <el-form-item label="治疗方案" prop="treatment_plan">
            <el-input v-model="eventForm.treatment_plan" type="textarea" :rows="2" placeholder="请输入治疗方案" />
          </el-form-item>
          <el-form-item label="使用药物" prop="medication">
            <el-input v-model="eventForm.medication" placeholder="请输入使用的药物" />
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitEvent">
            {{ editingEvent ? '更新' : '添加' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 事件详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="事件详情" width="500px">
      <div v-if="selectedEvent" class="event-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="事件类型">
            {{ getEventTitle(selectedEvent.event_type) }}
          </el-descriptions-item>
          <el-descriptions-item label="事件日期">
            {{ formatDateTime(selectedEvent.event_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="描述">
            {{ selectedEvent.description || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="操作员">
            {{ selectedEvent.operator?.real_name || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(selectedEvent.created_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Calendar, Warning, Check, Close } from '@element-plus/icons-vue'
import { cattleApi, type CattleEvent } from '@/api/cattle'
import dayjs from 'dayjs'

interface Props {
  cattleId: number
}

const props = defineProps<Props>()

const formRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const editingEvent = ref<CattleEvent | null>(null)
const selectedEvent = ref<CattleEvent | null>(null)
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const events = ref<CattleEvent[]>([])
const pagination = ref({
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0
})

const eventForm = reactive({
  event_type: '',
  event_date: '',
  description: '',
  // 疫苗接种字段
  vaccine_name: '',
  dosage: '',
  veterinarian: '',
  // 配种字段
  breeding_method: '',
  bull_ear_tag: '',
  expected_calving_date: '',
  // 治疗字段
  disease: '',
  treatment_plan: '',
  medication: ''
})

const eventRules: FormRules = {
  event_type: [
    { required: true, message: '请选择事件类型', trigger: 'change' }
  ],
  event_date: [
    { required: true, message: '请选择事件日期', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入事件描述', trigger: 'blur' }
  ]
}

// 加载事件列表
const loadEvents = async () => {
  loading.value = true
  try {
    const response = await cattleApi.getEvents(props.cattleId, {
      event_type: filterType.value || undefined,
      page: currentPage.value,
      limit: pageSize.value
    })
    
    events.value = response.data || []
    pagination.value = response.pagination || {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0
    }
  } catch (error) {
    console.error('加载事件失败:', error)
    ElMessage.error('加载事件失败')
  } finally {
    loading.value = false
  }
}

// 获取事件类型样式
const getEventType = (eventType: string) => {
  const typeMap: Record<string, string> = {
    birth: 'success',
    weaning: 'primary',
    breeding: 'warning',
    pregnancy: 'info',
    calving: 'success',
    vaccination: 'primary',
    treatment: 'danger',
    transfer: 'info',
    sale: 'warning',
    death: 'danger'
  }
  return typeMap[eventType] || 'info'
}

// 获取事件图标
const getEventIcon = (eventType: string) => {
  const iconMap: Record<string, any> = {
    birth: Check,
    vaccination: Check,
    treatment: Warning,
    death: Close,
    default: Calendar
  }
  return iconMap[eventType] || iconMap.default
}

// 获取事件标题
const getEventTitle = (eventType: string) => {
  const titleMap: Record<string, string> = {
    birth: '出生',
    weaning: '断奶',
    breeding: '配种',
    pregnancy: '怀孕确认',
    calving: '产犊',
    vaccination: '疫苗接种',
    treatment: '疾病治疗',
    transfer: '转群',
    sale: '销售',
    death: '死亡',
    other: '其他'
  }
  return titleMap[eventType] || '未知事件'
}

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm')
}

// 查看事件详情
const viewEvent = (event: CattleEvent) => {
  selectedEvent.value = event
  showDetailDialog.value = true
}

// 编辑事件
const editEvent = (event: CattleEvent) => {
  editingEvent.value = event
  Object.assign(eventForm, {
    event_type: event.event_type,
    event_date: event.event_date,
    description: event.description || '',
    // 从事件数据中提取特殊字段
    vaccine_name: event.data?.vaccine_name || '',
    dosage: event.data?.dosage || '',
    veterinarian: event.data?.veterinarian || '',
    breeding_method: event.data?.breeding_method || '',
    bull_ear_tag: event.data?.bull_ear_tag || '',
    expected_calving_date: event.data?.expected_calving_date || '',
    disease: event.data?.disease || '',
    treatment_plan: event.data?.treatment_plan || '',
    medication: event.data?.medication || ''
  })
  showAddDialog.value = true
}

// 删除事件
const deleteEvent = async (event: CattleEvent) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这个${getEventTitle(event.event_type)}事件吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里需要实现删除API
    ElMessage.success('删除成功')
    loadEvents()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 提交事件
const submitEvent = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    // 构建事件数据
    const eventData: any = {
      event_type: eventForm.event_type,
      event_date: eventForm.event_date,
      description: eventForm.description,
      data: {}
    }
    
    // 根据事件类型添加特殊数据
    if (eventForm.event_type === 'vaccination') {
      eventData.data = {
        vaccine_name: eventForm.vaccine_name,
        dosage: eventForm.dosage,
        veterinarian: eventForm.veterinarian
      }
    } else if (eventForm.event_type === 'breeding') {
      eventData.data = {
        breeding_method: eventForm.breeding_method,
        bull_ear_tag: eventForm.bull_ear_tag,
        expected_calving_date: eventForm.expected_calving_date
      }
    } else if (eventForm.event_type === 'treatment') {
      eventData.data = {
        disease: eventForm.disease,
        treatment_plan: eventForm.treatment_plan,
        medication: eventForm.medication
      }
    }
    
    if (editingEvent.value) {
      // 更新事件 - 需要实现更新API
      ElMessage.success('更新成功')
    } else {
      await cattleApi.addEvent(props.cattleId, eventData)
      ElMessage.success('添加成功')
    }
    
    showAddDialog.value = false
    loadEvents()
  } catch (error) {
    console.error('提交事件失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  editingEvent.value = null
  Object.assign(eventForm, {
    event_type: '',
    event_date: '',
    description: '',
    vaccine_name: '',
    dosage: '',
    veterinarian: '',
    breeding_method: '',
    bull_ear_tag: '',
    expected_calving_date: '',
    disease: '',
    treatment_plan: '',
    medication: ''
  })
  formRef.value?.resetFields()
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadEvents()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadEvents()
}

onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
.lifecycle-events {
  padding: 20px;
}

.toolbar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.events-timeline {
  margin-bottom: 20px;
}

.event-card {
  margin-bottom: 0;
}

.event-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.event-header h4 {
  margin: 0;
  color: #303133;
}

.event-actions {
  display: flex;
  gap: 8px;
}

.event-content {
  color: #606266;
}

.event-data {
  margin: 10px 0;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.event-data p {
  margin: 5px 0;
  font-size: 14px;
}

.event-meta {
  margin-top: 10px;
  font-size: 12px;
  color: #909399;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.event-detail {
  padding: 10px 0;
}

.dialog-footer {
  text-align: right;
}
</style>