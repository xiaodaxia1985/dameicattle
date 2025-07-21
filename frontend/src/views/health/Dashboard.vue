<template>
  <div class="health-dashboard">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>健康管理总览</h1>
      <el-button type="primary" @click="refreshData">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card class="stat-card healthy">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ healthStats.healthy || 0 }}</div>
              <div class="stat-label">健康牛只</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card sick">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ healthStats.sick || 0 }}</div>
              <div class="stat-label">患病牛只</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card treatment">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><Medicine /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ healthStats.treatment || 0 }}</div>
              <div class="stat-label">治疗中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card alerts">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="32"><Bell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-number">{{ alertStats.total || 0 }}</div>
              <div class="stat-label">健康预警</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 健康趋势图表 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>健康趋势分析</span>
              <el-select v-model="trendDays" @change="loadHealthTrend" style="width: 120px">
                <el-option label="7天" :value="7" />
                <el-option label="30天" :value="30" />
                <el-option label="90天" :value="90" />
              </el-select>
            </div>
          </template>
          <div ref="trendChart" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>健康状态分布</span>
          </template>
          <div ref="pieChart" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 预警信息 -->
    <el-row :gutter="20" class="alerts-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>健康预警</span>
              <el-badge :value="alertStats.critical + alertStats.high" class="alert-badge">
                <el-button size="small" @click="handleAlerts">处理预警</el-button>
              </el-badge>
            </div>
          </template>
          <div class="alerts-list">
            <div v-if="alerts.length === 0" class="no-alerts">
              <el-icon><Check /></el-icon>
              <span>暂无预警信息</span>
            </div>
            <div v-else>
              <div 
                v-for="alert in alerts.slice(0, 5)" 
                :key="alert.id"
                class="alert-item"
                :class="alert.severity"
              >
                <div class="alert-icon">
                  <el-icon v-if="alert.severity === 'critical'"><CircleCloseFilled /></el-icon>
                  <el-icon v-else-if="alert.severity === 'high'"><WarningFilled /></el-icon>
                  <el-icon v-else><InfoFilled /></el-icon>
                </div>
                <div class="alert-content">
                  <div class="alert-title">{{ alert.title }}</div>
                  <div class="alert-message">{{ alert.message }}</div>
                  <div class="alert-time">{{ formatTime(alert.created_at) }}</div>
                </div>
              </div>
              <div v-if="alerts.length > 5" class="more-alerts">
                <el-button text @click="$router.push('/health/alerts')">
                  查看全部 {{ alerts.length }} 条预警
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>疫苗到期提醒</span>
              <el-badge :value="vaccineAlerts.length" class="alert-badge">
                <el-button size="small" @click="$router.push('/health/vaccination')">管理疫苗</el-button>
              </el-badge>
            </div>
          </template>
          <div class="vaccine-alerts">
            <div v-if="vaccineAlerts.length === 0" class="no-alerts">
              <el-icon><Check /></el-icon>
              <span>暂无到期疫苗</span>
            </div>
            <div v-else>
              <div 
                v-for="vaccine in vaccineAlerts.slice(0, 5)" 
                :key="vaccine.id"
                class="vaccine-item"
              >
                <div class="vaccine-info">
                  <div class="vaccine-name">{{ vaccine.data?.vaccine_name }}</div>
                  <div class="cattle-tag">牛只: {{ vaccine.cattle_id }}</div>
                  <div class="due-date">
                    到期时间: {{ formatDate(vaccine.data?.next_due_date) }}
                  </div>
                </div>
                <div class="days-left" :class="getDaysLeftClass(vaccine.data?.days_until_due)">
                  {{ vaccine.data?.days_until_due }}天
                </div>
              </div>
              <div v-if="vaccineAlerts.length > 5" class="more-alerts">
                <el-button text @click="$router.push('/health/vaccination')">
                  查看全部 {{ vaccineAlerts.length }} 条提醒
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快速操作 -->
    <el-row :gutter="20" class="quick-actions">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>快速操作</span>
          </template>
          <div class="action-buttons">
            <el-button type="primary" @click="$router.push('/health/records')">
              <el-icon><Document /></el-icon>
              健康记录
            </el-button>
            <el-button type="success" @click="$router.push('/health/vaccination')">
              <el-icon><Medicine /></el-icon>
              疫苗管理
            </el-button>
            <el-button type="warning" @click="$router.push('/health/alerts')">
              <el-icon><Bell /></el-icon>
              预警管理
            </el-button>
            <el-button type="info" @click="exportHealthReport">
              <el-icon><Download /></el-icon>
              导出报告
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { healthApi } from '@/api/health'
import { 
  Refresh, Check, Warning, Medicine, Bell, 
  CircleCloseFilled, WarningFilled, InfoFilled,
  Document, Download
} from '@element-plus/icons-vue'

// 定义类型
interface AlertData {
  vaccine_name?: string
  next_due_date?: string
  days_until_due?: number
}

interface Alert {
  id: number
  title: string
  message: string
  type: string
  severity: string
  cattle_id?: number
  created_at: string
  data?: AlertData
}

interface TrendItem {
  period: string
  healthy_count: number
  sick_count: number
  treatment_count: number
}

// 响应式数据
const healthStats = ref({
  healthy: 0,
  sick: 0,
  treatment: 0,
  total: 0
})

const alertStats = ref({
  total: 0,
  critical: 0,
  high: 0,
  medium: 0,
  low: 0
})

const alerts = ref<Alert[]>([])
const vaccineAlerts = ref<Alert[]>([])
const trendData = ref<TrendItem[]>([])
const trendDays = ref(30)

// 图表引用
const trendChart = ref()
const pieChart = ref()
let trendChartInstance: echarts.ECharts | null = null
let pieChartInstance: echarts.ECharts | null = null

// 加载数据
const loadData = async () => {
  try {
    await Promise.all([
      loadHealthStatistics(),
      loadHealthAlerts(),
      loadHealthTrend()
    ])
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  }
}

// 加载健康统计
const loadHealthStatistics = async () => {
  try {
    const { data } = await healthApi.getHealthStatistics()
    healthStats.value = data
  } catch (error) {
    console.error('加载健康统计失败:', error)
  }
}

// 加载健康预警
const loadHealthAlerts = async () => {
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
    
    // 筛选疫苗相关预警
    vaccineAlerts.value = alerts.value.filter(alert => alert.type === 'vaccine_due')
  } catch (error) {
    console.error('加载健康预警失败:', error)
  }
}

// 加载健康趋势
const loadHealthTrend = async () => {
  try {
    const { data } = await healthApi.getHealthTrend({ days: trendDays.value })
    trendData.value = data.trends || []
    await nextTick()
    initTrendChart()
  } catch (error) {
    console.error('加载健康趋势失败:', error)
  }
}

// 初始化趋势图表
const initTrendChart = () => {
  if (!trendChart.value) return
  
  if (trendChartInstance) {
    trendChartInstance.dispose()
  }
  
  trendChartInstance = echarts.init(trendChart.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['健康', '患病', '治疗中']
    },
    xAxis: {
      type: 'category',
      data: trendData.value.map(item => item.period)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '健康',
        type: 'line',
        data: trendData.value.map(item => item.healthy_count),
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '患病',
        type: 'line',
        data: trendData.value.map(item => item.sick_count),
        itemStyle: { color: '#F56C6C' }
      },
      {
        name: '治疗中',
        type: 'line',
        data: trendData.value.map(item => item.treatment_count),
        itemStyle: { color: '#E6A23C' }
      }
    ]
  }
  
  trendChartInstance.setOption(option)
}

// 初始化饼图
const initPieChart = () => {
  if (!pieChart.value) return
  
  if (pieChartInstance) {
    pieChartInstance.dispose()
  }
  
  pieChartInstance = echarts.init(pieChart.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    series: [
      {
        name: '健康状态',
        type: 'pie',
        radius: '70%',
        data: [
          { value: healthStats.value.healthy, name: '健康', itemStyle: { color: '#67C23A' } },
          { value: healthStats.value.sick, name: '患病', itemStyle: { color: '#F56C6C' } },
          { value: healthStats.value.treatment, name: '治疗中', itemStyle: { color: '#E6A23C' } }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  pieChartInstance.setOption(option)
}

// 刷新数据
const refreshData = async () => {
  await loadData()
  ElMessage.success('数据已刷新')
}

// 处理预警
const handleAlerts = () => {
  // 跳转到预警管理页面
  // 这里可以添加批量处理预警的逻辑
}

// 导出健康报告
const exportHealthReport = () => {
  ElMessage.info('导出功能开发中...')
}

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString()
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

// 获取剩余天数样式类
const getDaysLeftClass = (days: number) => {
  if (days < 0) return 'overdue'
  if (days <= 7) return 'urgent'
  if (days <= 15) return 'warning'
  return 'normal'
}

// 组件挂载
onMounted(async () => {
  await loadData()
  await nextTick()
  initPieChart()
})
</script>

<style scoped>
.health-dashboard {
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

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 100px;
}

.stat-card.healthy {
  border-left: 4px solid #67C23A;
}

.stat-card.sick {
  border-left: 4px solid #F56C6C;
}

.stat-card.treatment {
  border-left: 4px solid #E6A23C;
}

.stat-card.alerts {
  border-left: 4px solid #409EFF;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  margin-right: 15px;
  color: #909399;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-top: 5px;
}

.charts-row {
  margin-bottom: 20px;
}

.alerts-row {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-badge {
  margin-left: 10px;
}

.alerts-list, .vaccine-alerts {
  max-height: 300px;
  overflow-y: auto;
}

.no-alerts {
  text-align: center;
  padding: 40px 0;
  color: #909399;
}

.no-alerts .el-icon {
  font-size: 32px;
  margin-bottom: 10px;
  color: #67C23A;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #EBEEF5;
}

.alert-item:last-child {
  border-bottom: none;
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
  color: #909399;
}

.alert-icon {
  margin-right: 10px;
  margin-top: 2px;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.alert-message {
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 4px;
}

.alert-time {
  color: #909399;
  font-size: 12px;
}

.vaccine-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #EBEEF5;
}

.vaccine-item:last-child {
  border-bottom: none;
}

.vaccine-info {
  flex: 1;
}

.vaccine-name {
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.cattle-tag {
  color: #606266;
  font-size: 13px;
  margin-bottom: 2px;
}

.due-date {
  color: #909399;
  font-size: 12px;
}

.days-left {
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.days-left.overdue {
  background-color: #FEF0F0;
  color: #F56C6C;
}

.days-left.urgent {
  background-color: #FDF6EC;
  color: #E6A23C;
}

.days-left.warning {
  background-color: #EDF2FC;
  color: #409EFF;
}

.days-left.normal {
  background-color: #F0F9FF;
  color: #67C23A;
}

.more-alerts {
  text-align: center;
  padding: 10px 0;
  border-top: 1px solid #EBEEF5;
}

.quick-actions {
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.action-buttons .el-button {
  flex: 1;
  min-width: 120px;
}
</style>