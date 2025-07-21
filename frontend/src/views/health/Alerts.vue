<template>
  <div class="health-alerts">
    <!-- 页面标题和操作 -->
    <div class="page-header">
      <h1>健康预警管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="refreshAlerts">
          <el-icon><Refresh /></el-icon>
          刷新预警
        </el-button>
        <el-button type="warning" @click="sendNotifications" :loading="sending">
          <el-icon><Bell /></el-icon>
          发送通知
        </el-button>
        <el-button @click="exportAlerts">
          <el-icon><Download /></el-icon>
          导出预警
        </el-button>
      </div>
    </div>

    <!-- 预警统计 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card critical">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="24" color="#F56C6C"><CircleCloseFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ alertStats.critical || 0 }}</div>
              <div class="stat-label">紧急预警</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card high">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="24" color="#E6A23C"><WarningFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ alertStats.high || 0 }}</div>
              <div class="stat-label">高级预警</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card medium">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="24" color="#409EFF"><InfoFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ alertStats.medium || 0 }}</div>
              <div class="stat-label">中级预警</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card low">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="24" color="#67C23A"><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ alertStats.low || 0 }}</div>
              <div class="stat-label">低级预警</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="预警类型">
          <el-select 
            v-model="filterForm.type" 
            placeholder="请选择预警类型"
            clearable
            style="width: 180px"
          >
            <el-option label="健康异常" value="health_anomaly" />
            <el-option label="疫苗到期" value="vaccine_due" />
            <el-option label="健康趋势" value="health_trend" />
            <el-option label="紧急健康" value="critical_health" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-select 
            v-model="filterForm.severity" 
            placeholder="请选择严重程度"
            clearable
            style="width: 120px"
          >
            <el-option label="紧急" value="critical" />
            <el-option label="高级" value="high" />
            <el-option label="中级" value="medium" />
            <el-option label="低级" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="基地">
          <el-select 
            v-model="filterForm.baseId" 
            placeholder="请选择基地"
            clearable
            style="width: 150px"
          >
            <el-option 
              v-for="base in baseList" 
              :key="base.id" 
              :label="base.name" 
              :value="base.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="filterAlerts">
            <el-icon><Search /></el-icon>
            筛选
          </el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 预警列表 -->
    <el-card class="alerts-card">
      <div v-loading="loading" class="alerts-container">
        <div v-if="filteredAlerts.length === 0" class="no-alerts">
          <el-empty description="暂无预警信息">
            <el-button type="primary" @click="refreshAlerts">刷新预警</el-button>
          </el-empty>
        </div>
        <div v-else class="alerts-list">
          <div 
            v-for="alert in filteredAlerts" 
            :key="alert.id"
            class="alert-item"
            :class="[alert.severity, alert.type]"
            @click="viewAlertDetail(alert)"
          >
            <div class="alert-header">
              <div class="alert-icon">
                <el-icon v-if="alert.severity === 'critical'" size="20"><CircleCloseFilled /></el-icon>
                <el-icon v-else-if="alert.severity === 'high'" size="20"><WarningFilled /></el-icon>
                <el-icon v-else-if="alert.severity === 'medium'" size="20"><InfoFilled /></el-icon>
                <el-icon v-else size="20"><Check /></el-icon>
              </div>
              <div class="alert-title-section">
                <div class="alert-title">{{ alert.title }}</div>
                <div class="alert-meta">
                  <el-tag :type="getSeverityType(alert.severity)" size="small">
                    {{ getSeverityText(alert.severity) }}
                  </el-tag>
                  <el-tag type="info" size="small" class="type-tag">
                    {{ getTypeText(alert.type) }}
                  </el-tag>
                  <span class="alert-time">{{ formatTime(alert.created_at) }}</span>
                </div>
              </div>
              <div class="alert-actions">
                <el-button 
                  v-if="alert.cattle_id"
                  type="primary" 
                  size="small" 
                  @click.stop="viewCattleProfile(alert.cattle_id)"
                >
                  查看牛只
                </el-button>
                <el-button 
                  type="success" 
                  size="small" 
                  @click.stop="handleAlert(alert)"
                >
                  处理
                </el-button>
              </div>
            </div>
            <div class="alert-content">
              <div class="alert-message">{{ alert.message }}</div>
              <div v-if="alert.data" class="alert-data">
                <div v-if="alert.type === 'vaccine_due'" class="vaccine-info">
                  <span class="data-item">疫苗: {{ alert.data.vaccine_name }}</span>
                  <span class="data-item">到期日期: {{ formatDate(alert.data.next_due_date) }}</span>
                  <span class="data-item" :class="getDaysClass(alert.data.days_until_due || alert.data.days_overdue)">
                    {{ alert.data.days_until_due ? `${alert.data.days_until_due}天后到期` : `已过期${alert.data.days_overdue}天` }}
                  </span>
                </div>
                <div v-else-if="alert.type === 'health_anomaly'" class="health-info">
                  <span v-if="alert.data.diagnosis" class="data-item">诊断: {{ alert.data.diagnosis }}</span>
                  <span v-if="alert.data.days_sick" class="data-item">患病天数: {{ alert.data.days_sick }}天</span>
                </div>
                <div v-else-if="alert.type === 'health_trend'" class="trend-info">
                  <span class="data-item">趋势: {{ getTrendText(alert.data.trend_direction) }}</span>
                  <span class="data-item">变化: {{ alert.data.change_percentage?.toFixed(1) }}%</span>
                </div>
                <div v-else-if="alert.type === 'critical_health'" class="critical-info">
                  <span class="data-item">患病数量: {{ alert.data.sick_count }}</span>
                  <span class="data-item">总数量: {{ alert.data.total_count }}</span>
                  <span class="data-item">患病率: {{ alert.data.percentage?.toFixed(1) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 预警详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="预警详情"
      width="600px"
    >
      <div v-if="selectedAlert" class="alert-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="预警标题">
            {{ selectedAlert.title }}
          </el-descriptions-item>
          <el-descriptions-item label="预警类型">
            <el-tag type="info">{{ getTypeText(selectedAlert.type) }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="严重程度">
            <el-tag :type="getSeverityType(selectedAlert.severity)">
              {{ getSeverityText(selectedAlert.severity) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="预警消息">
            {{ selectedAlert.message }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedAlert.cattle_id" label="相关牛只">
            {{ selectedAlert.cattle_id }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedAlert.base_id" label="相关基地">
            {{ selectedAlert.base_id }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(selectedAlert.created_at) }}
          </el-descriptions-item>
        </el-descriptions>
        
        <div v-if="selectedAlert.data" class="alert-extra-data">
          <h4>详细信息</h4>
          <pre>{{ JSON.stringify(selectedAlert.data, null, 2) }}</pre>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
        <el-button 
          v-if="selectedAlert?.cattle_id"
          type="primary" 
          @click="viewCattleProfile(selectedAlert.cattle_id)"
        >
          查看牛只档案
        </el-button>
        <el-button type="success" @click="handleAlert(selectedAlert)">
          处理预警
        </el-button>
      </template>
    </el-dialog>

    <!-- 处理预警对话框 -->
    <el-dialog
      v-model="showHandleDialog"
      title="处理预警"
      width="500px"
    >
      <el-form :model="handleForm" label-width="100px">
        <el-form-item label="处理方式">
          <el-radio-group v-model="handleForm.action">
            <el-radio value="ignore">忽略此预警</el-radio>
            <el-radio value="handle">标记为已处理</el-radio>
            <el-radio value="schedule">安排处理</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="handleForm.action === 'schedule'" label="处理时间">
          <el-date-picker
            v-model="handleForm.scheduleTime"
            type="datetime"
            placeholder="请选择处理时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input 
            v-model="handleForm.remark" 
            type="textarea"
            :rows="3"
            placeholder="请输入处理备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showHandleDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmHandle" :loading="handling">
          确认处理
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { 
  Refresh, Bell, Download, Search, Check,
  CircleCloseFilled, WarningFilled, InfoFilled
} from '@element-plus/icons-vue'
import { healthApi } from '@/api/health'

const router = useRouter()

// 定义类型
interface AlertData {
  vaccine_name?: string
  next_due_date?: string
  days_until_due?: number
  days_overdue?: number
  diagnosis?: string
  days_sick?: number
  trend_direction?: string
  change_percentage?: number
  sick_count?: number
  total_count?: number
  percentage?: number
}

interface Alert {
  id: number
  title: string
  message: string
  type: string
  severity: string
  cattle_id?: number
  base_id?: number
  created_at: string
  data?: AlertData
}

// 响应式数据
const loading = ref(false)
const sending = ref(false)
const handling = ref(false)
const alerts = ref<Alert[]>([])
const selectedAlert = ref<Alert | null>(null)

// 对话框显示状态
const showDetailDialog = ref(false)
const showHandleDialog = ref(false)

// 预警统计
const alertStats = ref({
  total: 0,
  critical: 0,
  high: 0,
  medium: 0,
  low: 0
})

// 筛选表单
const filterForm = reactive({
  type: '',
  severity: '',
  baseId: ''
})

// 处理表单
const handleForm = reactive({
  action: 'handle',
  scheduleTime: '',
  remark: ''
})

// 基础数据
const baseList = ref<Array<{ id: number; name: string }>>([])

// 筛选后的预警
const filteredAlerts = computed(() => {
  let filtered = alerts.value

  if (filterForm.type) {
    filtered = filtered.filter(alert => alert.type === filterForm.type)
  }

  if (filterForm.severity) {
    filtered = filtered.filter(alert => alert.severity === filterForm.severity)
  }

  if (filterForm.baseId) {
    filtered = filtered.filter(alert => alert.base_id === filterForm.baseId)
  }

  return filtered.sort((a, b) => {
    // 按严重程度排序
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (severityDiff !== 0) return severityDiff
    
    // 按时间排序
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
})

// 加载预警数据
const loadAlerts = async () => {
  loading.value = true
  try {
    const { data } = await healthApi.getHealthAlerts()
    alerts.value = data.alerts || []
    alertStats.value = {
      total: data.total || 0,
      critical: data.critical_count || 0,
      high: data.high_count || 0,
      medium: data.medium_count || 0,
      low: data.low_count || 0
    }
  } catch (error) {
    console.error('加载预警失败:', error)
    ElMessage.error('加载预警失败')
  } finally {
    loading.value = false
  }
}

// 刷新预警
const refreshAlerts = async () => {
  await loadAlerts()
  ElMessage.success('预警数据已刷新')
}

// 筛选预警
const filterAlerts = () => {
  // 筛选逻辑在计算属性中处理
}

// 重置筛选
const resetFilter = () => {
  Object.assign(filterForm, {
    type: '',
    severity: '',
    baseId: ''
  })
}

// 查看预警详情
const viewAlertDetail = (alert: Alert) => {
  selectedAlert.value = alert
  showDetailDialog.value = true
}

// 处理预警
const handleAlert = (alert: Alert) => {
  selectedAlert.value = alert
  Object.assign(handleForm, {
    action: 'handle',
    scheduleTime: '',
    remark: ''
  })
  showHandleDialog.value = true
}

// 确认处理
const confirmHandle = async () => {
  handling.value = true
  try {
    // 这里应该调用处理预警的API
    // await healthApi.handleAlert(selectedAlert.value.id, handleForm)
    
    ElMessage.success('预警处理成功')
    showHandleDialog.value = false
    
    // 从列表中移除已处理的预警
    const index = alerts.value.findIndex(alert => alert.id === selectedAlert.value.id)
    if (index > -1) {
      alerts.value.splice(index, 1)
      // 更新统计
      alertStats.value[selectedAlert.value.severity]--
      alertStats.value.total--
    }
  } catch (error) {
    console.error('处理预警失败:', error)
    ElMessage.error('处理预警失败')
  } finally {
    handling.value = false
  }
}

// 查看牛只档案
const viewCattleProfile = (cattleId: number) => {
  router.push(`/cattle/${cattleId}`)
}

// 发送通知
const sendNotifications = async () => {
  sending.value = true
  try {
    const criticalAndHighAlerts = alerts.value.filter(alert => 
      alert.severity === 'critical' || alert.severity === 'high'
    )
    
    if (criticalAndHighAlerts.length === 0) {
      ElMessage.info('暂无需要发送通知的预警')
      return
    }

    await healthApi.sendHealthAlertNotifications({
      alert_types: criticalAndHighAlerts.map(alert => alert.type)
    })
    
    ElMessage.success(`已发送 ${criticalAndHighAlerts.length} 条预警通知`)
  } catch (error) {
    console.error('发送通知失败:', error)
    ElMessage.error('发送通知失败')
  } finally {
    sending.value = false
  }
}

// 导出预警
const exportAlerts = () => {
  ElMessage.info('导出功能开发中...')
}

// 获取严重程度类型
const getSeverityType = (severity: string) => {
  const types: Record<string, 'success' | 'primary' | 'warning' | 'info' | 'danger'> = {
    critical: 'danger',
    high: 'warning',
    medium: 'info',
    low: 'success'
  }
  return types[severity] || 'info'
}

// 获取严重程度文本
const getSeverityText = (severity: string) => {
  const texts: Record<string, string> = {
    critical: '紧急',
    high: '高级',
    medium: '中级',
    low: '低级'
  }
  return texts[severity] || severity
}

// 获取类型文本
const getTypeText = (type: string) => {
  const texts: Record<string, string> = {
    health_anomaly: '健康异常',
    vaccine_due: '疫苗到期',
    health_trend: '健康趋势',
    critical_health: '紧急健康'
  }
  return texts[type] || type
}

// 获取趋势文本
const getTrendText = (trend: string) => {
  const texts: Record<string, string> = {
    improving: '改善',
    stable: '稳定',
    declining: '恶化'
  }
  return texts[trend] || trend
}

// 获取天数样式类
const getDaysClass = (days: number) => {
  if (days < 0) return 'overdue'
  if (days <= 7) return 'urgent'
  return 'normal'
}

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString()
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

// 格式化日期时间
const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString()
}

// 加载基础数据
const loadBaseData = async () => {
  // 这里应该加载基地列表
  baseList.value = []
}

// 组件挂载
onMounted(() => {
  loadAlerts()
  loadBaseData()
})
</script>

<style scoped>
.health-alerts {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 80px;
}

.stat-card.critical {
  border-left: 4px solid #F56C6C;
}

.stat-card.high {
  border-left: 4px solid #E6A23C;
}

.stat-card.medium {
  border-left: 4px solid #409EFF;
}

.stat-card.low {
  border-left: 4px solid #67C23A;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  margin-right: 15px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-top: 5px;
}

.filter-card {
  margin-bottom: 20px;
}

.alerts-card {
  min-height: 400px;
}

.alerts-container {
  min-height: 300px;
}

.no-alerts {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.alert-item {
  border: 1px solid #EBEEF5;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.alert-item:hover {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.alert-item.critical {
  border-left: 4px solid #F56C6C;
  background-color: #FEF0F0;
}

.alert-item.high {
  border-left: 4px solid #E6A23C;
  background-color: #FDF6EC;
}

.alert-item.medium {
  border-left: 4px solid #409EFF;
  background-color: #EDF2FC;
}

.alert-item.low {
  border-left: 4px solid #67C23A;
  background-color: #F0F9FF;
}

.alert-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.alert-icon {
  margin-right: 12px;
  margin-top: 2px;
}

.alert-item.critical .alert-icon {
  color: #F56C6C;
}

.alert-item.high .alert-icon {
  color: #E6A23C;
}

.alert-item.medium .alert-icon {
  color: #409EFF;
}

.alert-item.low .alert-icon {
  color: #67C23A;
}

.alert-title-section {
  flex: 1;
}

.alert-title {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
}

.alert-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.type-tag {
  margin-left: 0;
}

.alert-time {
  color: #909399;
  font-size: 12px;
}

.alert-actions {
  display: flex;
  gap: 8px;
}

.alert-content {
  margin-left: 32px;
}

.alert-message {
  color: #606266;
  line-height: 1.5;
  margin-bottom: 8px;
}

.alert-data {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.data-item {
  background-color: rgba(255, 255, 255, 0.8);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

.data-item.overdue {
  background-color: #FEF0F0;
  color: #F56C6C;
}

.data-item.urgent {
  background-color: #FDF6EC;
  color: #E6A23C;
}

.alert-detail {
  padding: 10px 0;
}

.alert-extra-data {
  margin-top: 20px;
}

.alert-extra-data h4 {
  margin-bottom: 10px;
  color: #303133;
}

.alert-extra-data pre {
  background-color: #F5F7FA;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
  max-height: 200px;
  overflow-y: auto;
}
</style>