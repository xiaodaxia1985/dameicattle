<template>
  <div class="patrol-dashboard">
    <div class="page-header">
      <h1>巡圈总览</h1>
      <p class="header-desc">查看巡圈统计数据和趋势分析</p>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card" shadow="never">
      <el-row :gutter="16">
        <el-col :span="8">
          <div class="filter-item">
            <label>选择基地</label>
            <el-select v-model="selectedBase" placeholder="选择基地" @change="handleBaseChange">
              <el-option
                v-for="base in bases"
                :key="base.id"
                :label="base.name"
                :value="base.id"
              />
            </el-select>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="filter-item">
            <label>时间范围</label>
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              @change="handleDateRangeChange"
            />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="filter-item">
            <label>&nbsp;</label>
            <el-button type="primary" @click="refreshData">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 统计概览 -->
    <div class="overview-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon total">
                <el-icon><DataAnalysis /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ statistics.basic_stats?.total_records || 0 }}</div>
                <div class="metric-label">总巡圈次数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon lying">
                <el-icon><Moon /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ (statistics.basic_stats?.avg_lying_rate || 0).toFixed(1) }}%</div>
                <div class="metric-label">平均躺卧率</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon temperature">
                <el-icon><Sunny /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ (statistics.basic_stats?.avg_temperature || 0).toFixed(1) }}°C</div>
                <div class="metric-label">平均温度</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon abnormal">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ statistics.basic_stats?.total_abnormal_cattle || 0 }}</div>
                <div class="metric-label">异常牛只总数</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表分析 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card title="每日巡圈趋势">
            <template #header>
              <span>每日巡圈趋势</span>
            </template>
            <div ref="trendChartRef" style="height: 350px;"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card title="巡圈类型分布">
            <template #header>
              <span>巡圈类型分布</span>
            </template>
            <div ref="typeChartRef" style="height: 350px;"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 牛棚巡圈情况 -->
    <div class="barn-section">
      <el-card title="牛棚巡圈情况">
        <template #header>
          <div class="card-header">
            <span>牛棚巡圈情况</span>
            <el-button link @click="exportBarnStats">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </div>
        </template>
        
        <el-table :data="statistics.barn_stats" v-loading="loading">
          <el-table-column prop="barn.name" label="牛棚名称" />
          <el-table-column prop="barn.code" label="牛棚编号" />
          <el-table-column prop="patrol_count" label="巡圈次数" sortable />
          <el-table-column label="平均躺卧率" sortable>
            <template #default="{ row }">
              <span :class="getLyingRateClass(row.avg_lying_rate)">
                {{ (row.avg_lying_rate || 0).toFixed(1) }}%
              </span>
            </template>
          </el-table-column>
          <el-table-column label="异常牛只数" sortable>
            <template #default="{ row }">
              <span v-if="row.total_abnormal > 0" class="abnormal-count">
                {{ row.total_abnormal }}头
              </span>
              <span v-else class="normal-count">正常</span>
            </template>
          </el-table-column>
          <el-table-column label="巡圈频率">
            <template #default="{ row }">
              {{ getPatrolFrequency(row.patrol_count) }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 环境数据趋势 -->
    <div class="environment-section">
      <el-card title="环境数据趋势">
        <template #header>
          <div class="card-header">
            <span>环境数据趋势</span>
            <el-radio-group v-model="environmentMetric" size="small" @change="updateEnvironmentChart">
              <el-radio-button label="temperature">温度</el-radio-button>
              <el-radio-button label="humidity">湿度</el-radio-button>
              <el-radio-button label="lying_rate">躺卧率</el-radio-button>
            </el-radio-group>
          </div>
        </template>
        <div ref="environmentChartRef" style="height: 400px;"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Moon, Sunny, Warning, Refresh, Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { patrolApi } from '@/api/patrol'
import { baseApi } from '@/api/base'
import type { PatrolStatistics } from '@/api/patrol'

// 响应式数据
const bases = ref<any[]>([])
const selectedBase = ref<number>()
const dateRange = ref<[string, string]>(['', ''])
const loading = ref(false)
const statistics = ref<PatrolStatistics>({
  basic_stats: {
    total_records: 0,
    avg_lying_rate: 0,
    avg_temperature: 0,
    avg_humidity: 0,
    total_abnormal_cattle: 0
  },
  daily_trend: [],
  type_distribution: [],
  barn_stats: []
})

const environmentMetric = ref('temperature')

// 图表引用
const trendChartRef = ref<HTMLElement>()
const typeChartRef = ref<HTMLElement>()
const environmentChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let typeChart: echarts.ECharts | null = null
let environmentChart: echarts.ECharts | null = null

// 初始化日期范围（最近30天）
const initDateRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  dateRange.value = [
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  ]
}

// 获取基地列表
const fetchBases = async () => {
  try {
    const response = await baseApi.getBases()
    bases.value = response.data.bases || []
    if (bases.value.length > 0) {
      selectedBase.value = bases.value[0].id
    }
  } catch (error) {
    console.error('获取基地列表失败:', error)
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  if (!selectedBase.value || !dateRange.value[0] || !dateRange.value[1]) return

  loading.value = true
  try {
    const response = await patrolApi.getPatrolStatistics({
      base_id: selectedBase.value,
      start_date: dateRange.value[0],
      end_date: dateRange.value[1]
    })
    statistics.value = response.data
    updateCharts()
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

// 初始化图表
const initCharts = () => {
  nextTick(() => {
    if (trendChartRef.value) {
      trendChart = echarts.init(trendChartRef.value)
    }
    if (typeChartRef.value) {
      typeChart = echarts.init(typeChartRef.value)
    }
    if (environmentChartRef.value) {
      environmentChart = echarts.init(environmentChartRef.value)
    }
    updateCharts()
  })
}

// 更新图表
const updateCharts = () => {
  updateTrendChart()
  updateTypeChart()
  updateEnvironmentChart()
}

// 更新趋势图
const updateTrendChart = () => {
  if (!trendChart) return

  const dates = statistics.value.daily_trend.map(item => item.patrol_date)
  const patrolCounts = statistics.value.daily_trend.map(item => item.patrol_count)
  const lyingRates = statistics.value.daily_trend.map(item => item.avg_lying_rate)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['巡圈次数', '平均躺卧率']
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: [
      {
        type: 'value',
        name: '巡圈次数',
        position: 'left'
      },
      {
        type: 'value',
        name: '躺卧率(%)',
        position: 'right'
      }
    ],
    series: [
      {
        name: '巡圈次数',
        type: 'bar',
        data: patrolCounts,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '平均躺卧率',
        type: 'line',
        yAxisIndex: 1,
        data: lyingRates,
        itemStyle: { color: '#67C23A' }
      }
    ]
  }

  trendChart.setOption(option)
}

// 更新类型分布图
const updateTypeChart = () => {
  if (!typeChart) return

  const typeNames = {
    before_feeding: '喂食前',
    after_feeding: '喂食后',
    routine: '常规'
  }

  const data = statistics.value.type_distribution.map(item => ({
    name: typeNames[item.patrol_type] || item.patrol_type,
    value: item.count
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
        name: '巡圈类型',
        type: 'pie',
        radius: '50%',
        data: data,
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

  typeChart.setOption(option)
}

// 更新环境数据图表
const updateEnvironmentChart = () => {
  if (!environmentChart) return

  const dates = statistics.value.daily_trend.map(item => item.patrol_date)
  let data: number[] = []
  let yAxisName = ''
  let seriesName = ''

  switch (environmentMetric.value) {
    case 'temperature':
      data = statistics.value.daily_trend.map(item => item.avg_temperature)
      yAxisName = '温度(°C)'
      seriesName = '平均温度'
      break
    case 'humidity':
      data = statistics.value.daily_trend.map(item => item.avg_humidity)
      yAxisName = '湿度(%)'
      seriesName = '平均湿度'
      break
    case 'lying_rate':
      data = statistics.value.daily_trend.map(item => item.avg_lying_rate)
      yAxisName = '躺卧率(%)'
      seriesName = '平均躺卧率'
      break
  }

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: {
      type: 'value',
      name: yAxisName
    },
    series: [
      {
        name: seriesName,
        type: 'line',
        data: data,
        smooth: true,
        itemStyle: { color: '#409EFF' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
            ]
          }
        }
      }
    ]
  }

  environmentChart.setOption(option)
}

// 事件处理
const handleBaseChange = () => {
  fetchStatistics()
}

const handleDateRangeChange = () => {
  fetchStatistics()
}

const refreshData = () => {
  fetchStatistics()
}

const exportBarnStats = () => {
  if (statistics.value.barn_stats.length === 0) {
    ElMessage.warning('暂无数据可导出')
    return
  }

  const csvHeaders = ['牛棚名称', '牛棚编号', '巡圈次数', '平均躺卧率(%)', '异常牛只数', '巡圈频率']
  const csvData = statistics.value.barn_stats.map(item => [
    item.barn?.name || '',
    item.barn?.code || '',
    item.patrol_count,
    (item.avg_lying_rate || 0).toFixed(1),
    item.total_abnormal || 0,
    getPatrolFrequency(item.patrol_count)
  ])

  const csvContent = [
    csvHeaders.join(','),
    ...csvData.map(row => row.join(','))
  ].join('\n')

  const BOM = '\uFEFF'
  const csvBlob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(csvBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `牛棚巡圈统计_${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  ElMessage.success('数据导出成功')
}

// 工具函数
const getLyingRateClass = (rate?: number) => {
  if (!rate) return ''
  if (rate >= 80) return 'high-lying-rate'
  if (rate >= 60) return 'medium-lying-rate'
  return 'low-lying-rate'
}

const getPatrolFrequency = (count: number) => {
  const days = Math.ceil((new Date(dateRange.value[1]).getTime() - new Date(dateRange.value[0]).getTime()) / (1000 * 60 * 60 * 24))
  const frequency = count / days
  if (frequency >= 2) return '高频'
  if (frequency >= 1) return '正常'
  return '偏低'
}

// 窗口大小变化处理
const handleResize = () => {
  trendChart?.resize()
  typeChart?.resize()
  environmentChart?.resize()
}

// 组件挂载
onMounted(() => {
  initDateRange()
  fetchBases()
  initCharts()
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (trendChart) {
    trendChart.dispose()
    trendChart = null
  }
  if (typeChart) {
    typeChart.dispose()
    typeChart = null
  }
  if (environmentChart) {
    environmentChart.dispose()
    environmentChart = null
  }
  
  window.removeEventListener('resize', handleResize)
})

// 监听基地变化
watch(() => selectedBase.value, () => {
  if (selectedBase.value) {
    fetchStatistics()
  }
})
</script>

<style scoped lang="scss">
.patrol-dashboard {
  padding: 20px;

  .page-header {
    margin-bottom: 20px;

    h1 {
      margin: 0 0 4px 0;
      color: #303133;
      font-size: 24px;
      font-weight: 600;
    }

    .header-desc {
      margin: 0;
      color: #909399;
      font-size: 14px;
    }
  }

  .filter-card {
    margin-bottom: 20px;

    .filter-item {
      label {
        display: block;
        font-size: 14px;
        color: #606266;
        margin-bottom: 8px;
        font-weight: 500;
      }
    }
  }

  .overview-section {
    margin-bottom: 20px;

    .metric-card {
      .metric-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;

          &.total {
            background: linear-gradient(135deg, #409EFF, #66B1FF);
          }

          &.lying {
            background: linear-gradient(135deg, #67C23A, #85CE61);
          }

          &.temperature {
            background: linear-gradient(135deg, #E6A23C, #EBB563);
          }

          &.abnormal {
            background: linear-gradient(135deg, #F56C6C, #F78989);
          }
        }

        .metric-info {
          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #303133;
            margin-bottom: 4px;
          }

          .metric-label {
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }
  }

  .charts-section {
    margin-bottom: 20px;
  }

  .barn-section {
    margin-bottom: 20px;
  }

  .environment-section {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .abnormal-count {
    color: #f56c6c;
    font-weight: bold;
  }

  .normal-count {
    color: #67c23a;
  }

  .high-lying-rate {
    color: #67c23a;
    font-weight: bold;
  }

  .medium-lying-rate {
    color: #e6a23c;
  }

  .low-lying-rate {
    color: #f56c6c;
  }
}
</style>