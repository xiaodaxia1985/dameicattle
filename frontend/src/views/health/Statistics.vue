<template>
  <div class="health-statistics">
    <!-- 页面标题和操作 -->
    <div class="page-header">
      <h1>健康统计分析</h1>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="loadStatistics"
        />
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </div>
    </div>

    <!-- 统计概览 -->
    <el-row :gutter="20" class="overview-row">
      <el-col :span="6">
        <el-card class="overview-card healthy">
          <div class="card-content">
            <div class="card-icon">
              <el-icon size="32" color="#67C23A"><Check /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-number">{{ statistics.healthStatus?.find(s => s.health_status === 'healthy')?.count || 0 }}</div>
              <div class="card-label">健康牛只</div>
              <div class="card-percent">{{ getHealthPercentage('healthy') }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="overview-card sick">
          <div class="card-content">
            <div class="card-icon">
              <el-icon size="32" color="#F56C6C"><Warning /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-number">{{ statistics.healthStatus?.find(s => s.health_status === 'sick')?.count || 0 }}</div>
              <div class="card-label">患病牛只</div>
              <div class="card-percent">{{ getHealthPercentage('sick') }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="overview-card treatment">
          <div class="card-content">
            <div class="card-icon">
              <el-icon size="32" color="#E6A23C"><Warning /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-number">{{ statistics.healthStatus?.find(s => s.health_status === 'treatment')?.count || 0 }}</div>
              <div class="card-label">治疗中</div>
              <div class="card-percent">{{ getHealthPercentage('treatment') }}%</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="overview-card total">
          <div class="card-content">
            <div class="card-icon">
              <el-icon size="32" color="#409EFF"><DataAnalysis /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-number">{{ getTotalCattle() }}</div>
              <div class="card-label">总牛只数</div>
              <div class="card-percent">100%</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>健康状态分布</span>
          </template>
          <div ref="pieChart" style="height: 300px" v-loading="loading"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>健康趋势分析</span>
          </template>
          <div ref="trendChart" style="height: 300px" v-loading="loading"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { Refresh, Download, Check, Warning, DataAnalysis } from '@element-plus/icons-vue'
import { healthApi } from '@/api/health'

// 定义类型
interface HealthStatusItem {
  health_status: string
  count: string
}

interface TrendItem {
  month: string
  count: string
}

interface HealthStatistics {
  healthStatus: HealthStatusItem[]
  diseaseTypes: any[]
  vaccinations: any[]
  dueSoonVaccinations: number
  healthTrend: TrendItem[]
}

// 响应式数据
const loading = ref(false)
const dateRange = ref<string[]>([])
const statistics = ref<HealthStatistics>({
  healthStatus: [],
  diseaseTypes: [],
  vaccinations: [],
  dueSoonVaccinations: 0,
  healthTrend: []
})

// 图表引用
const pieChart = ref()
const trendChart = ref()
let pieChartInstance: echarts.ECharts | null = null
let trendChartInstance: echarts.ECharts | null = null

// 加载统计数据
const loadStatistics = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }

    const { data } = await healthApi.getHealthStatistics(params)
    statistics.value = data as unknown as HealthStatistics
    
    await nextTick()
    initCharts()
  } catch (error) {
    console.error('加载统计数据失败:', error)
    ElMessage.error('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

// 初始化图表
const initCharts = () => {
  initPieChart()
  initTrendChart()
}

// 初始化饼图
const initPieChart = () => {
  if (!pieChart.value) return
  
  if (pieChartInstance) {
    pieChartInstance.dispose()
  }
  
  pieChartInstance = echarts.init(pieChart.value)
  
  const healthData = statistics.value.healthStatus || []
  const pieData = healthData.map(item => ({
    value: parseInt(item.count),
    name: getHealthStatusText(item.health_status),
    itemStyle: { color: getHealthStatusColor(item.health_status) }
  }))

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '健康状态',
        type: 'pie',
        radius: '70%',
        center: ['60%', '50%'],
        data: pieData,
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

// 初始化趋势图
const initTrendChart = () => {
  if (!trendChart.value) return
  
  if (trendChartInstance) {
    trendChartInstance.dispose()
  }
  
  trendChartInstance = echarts.init(trendChart.value)
  
  const trendData = statistics.value.healthTrend || []
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['健康趋势']
    },
    xAxis: {
      type: 'category',
      data: trendData.map(item => item.month)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '健康趋势',
        type: 'line',
        data: trendData.map(item => item.count),
        itemStyle: { color: '#409EFF' },
        smooth: true
      }
    ]
  }
  
  trendChartInstance.setOption(option)
}

// 获取健康状态文本
const getHealthStatusText = (status: string) => {
  const texts: Record<string, string> = {
    healthy: '健康',
    sick: '患病',
    treatment: '治疗中'
  }
  return texts[status] || status
}

// 获取健康状态颜色
const getHealthStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    healthy: '#67C23A',
    sick: '#F56C6C',
    treatment: '#E6A23C'
  }
  return colors[status] || '#909399'
}

// 获取健康百分比
const getHealthPercentage = (status: string) => {
  const total = getTotalCattle()
  if (total === 0) return 0
  
  const count = statistics.value.healthStatus?.find(s => s.health_status === status)?.count || '0'
  return ((parseInt(count.toString()) / total) * 100).toFixed(1)
}

// 获取总牛只数
const getTotalCattle = () => {
  return statistics.value.healthStatus?.reduce((total, item) => total + parseInt(item.count), 0) || 0
}

// 刷新数据
const refreshData = async () => {
  await loadStatistics()
  ElMessage.success('数据已刷新')
}

// 导出报告
const exportReport = () => {
  ElMessage.info('导出功能开发中...')
}

// 组件挂载
onMounted(() => {
  loadStatistics()
})
</script>

<style scoped>
.health-statistics {
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
  align-items: center;
}

.overview-row {
  margin-bottom: 20px;
}

.overview-card {
  height: 120px;
}

.overview-card.healthy {
  border-left: 4px solid #67C23A;
}

.overview-card.sick {
  border-left: 4px solid #F56C6C;
}

.overview-card.treatment {
  border-left: 4px solid #E6A23C;
}

.overview-card.total {
  border-left: 4px solid #409EFF;
}

.card-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 10px;
}

.card-icon {
  margin-right: 20px;
}

.card-info {
  flex: 1;
}

.card-number {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.card-label {
  font-size: 14px;
  color: #606266;
  margin: 5px 0;
}

.card-percent {
  font-size: 12px;
  color: #909399;
}

.charts-row {
  margin-bottom: 20px;
}
</style>