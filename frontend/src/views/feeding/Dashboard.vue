<template>
  <div class="feeding-dashboard">
    <div class="dashboard-header">
      <h1>饲喂管理</h1>
      <div class="header-actions">
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
        <el-select v-model="selectedBase" placeholder="选择基地" @change="handleBaseChange">
          <el-option
            v-for="base in bases"
            :key="base.id"
            :label="base.name"
            :value="base.id"
          />
        </el-select>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Dish /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ statistics.totalAmount || 0 }}kg</div>
                <div class="stat-label">总饲喂量</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ statistics.totalCost || 0 }}</div>
                <div class="stat-label">总成本</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ statistics.avgDailyCost || 0 }}</div>
                <div class="stat-label">日均成本</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><DataAnalysis /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ activeFormulas }}</div>
                <div class="stat-label">活跃配方</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card title="饲喂趋势">
            <template #header>
              <span>饲喂趋势</span>
            </template>
            <div ref="trendChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card title="配方使用分布">
            <template #header>
              <span>配方使用分布</span>
            </template>
            <div ref="formulaChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions">
      <el-card title="快捷操作">
        <template #header>
          <span>快捷操作</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-button type="primary" size="large" @click="$router.push('/feeding/records/create')">
              <el-icon><Plus /></el-icon>
              添加饲喂记录
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button type="success" size="large" @click="$router.push('/feeding/formulas/create')">
              <el-icon><DocumentAdd /></el-icon>
              创建配方
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button type="info" size="large" @click="generatePlan">
              <el-icon><Calendar /></el-icon>
              生成饲喂计划
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button type="warning" size="large" @click="$router.push('/feeding/analysis')">
              <el-icon><DataAnalysis /></el-icon>
              效率分析
            </el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 最近记录 -->
    <div class="recent-records">
      <el-card title="最近饲喂记录">
        <template #header>
          <div class="card-header">
            <span>最近饲喂记录</span>
            <el-button type="text" @click="$router.push('/feeding/records')">查看全部</el-button>
          </div>
        </template>
        <el-table :data="recentRecords" v-loading="loading">
          <el-table-column prop="feedingDate" label="日期" width="120" />
          <el-table-column prop="formulaName" label="配方" />
          <el-table-column prop="baseName" label="基地" />
          <el-table-column prop="barnName" label="牛棚" />
          <el-table-column prop="amount" label="用量(kg)" width="100" />
          <el-table-column prop="cost" label="成本(¥)" width="100" />
          <el-table-column prop="operatorName" label="操作员" width="100" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Dish, Money, TrendCharts, DataAnalysis, Plus, DocumentAdd, Calendar } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { feedingApi } from '@/api/feeding'
import { baseApi } from '@/api/base'
import type { FeedingStatistics, FeedingRecord } from '@/api/feeding'

// 响应式数据
const dateRange = ref<[string, string]>(['', ''])
const selectedBase = ref<number>()
const bases = ref<any[]>([])
const statistics = ref<FeedingStatistics>({
  totalAmount: 0,
  totalCost: 0,
  avgDailyCost: 0,
  formulaUsage: [],
  trend: []
})
const recentRecords = ref<FeedingRecord[]>([])
const loading = ref(false)
const activeFormulas = ref(0)

// 图表引用
const trendChartRef = ref<HTMLElement>()
const formulaChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let formulaChart: echarts.ECharts | null = null

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
    bases.value = response.data.data
    if (bases.value.length > 0) {
      selectedBase.value = bases.value[0].id
    }
  } catch (error) {
    console.error('获取基地列表失败:', error)
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  if (!selectedBase.value || !dateRange.value) return
  
  loading.value = true
  try {
    const response = await feedingApi.getFeedingStatistics({
      baseId: selectedBase.value,
      startDate: dateRange.value[0],
      endDate: dateRange.value[1]
    })
    statistics.value = response.data
    activeFormulas.value = response.data.formulaUsage?.length || 0
    
    // 更新图表
    updateCharts()
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

// 获取最近记录
const fetchRecentRecords = async () => {
  if (!selectedBase.value) return
  
  try {
    const response = await feedingApi.getFeedingRecords({
      baseId: selectedBase.value,
      page: 1,
      limit: 10
    })
    recentRecords.value = response.data.data
  } catch (error) {
    console.error('获取最近记录失败:', error)
  }
}

// 初始化图表
const initCharts = () => {
  nextTick(() => {
    if (trendChartRef.value) {
      trendChart = echarts.init(trendChartRef.value)
    }
    if (formulaChartRef.value) {
      formulaChart = echarts.init(formulaChartRef.value)
    }
    updateCharts()
  })
}

// 更新图表
const updateCharts = () => {
  // 更新趋势图
  if (trendChart && statistics.value.trend) {
    const trendOption = {
      title: {
        text: '饲喂趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['饲喂量', '成本'],
        bottom: 0
      },
      xAxis: {
        type: 'category',
        data: statistics.value.trend.map(item => item.date)
      },
      yAxis: [
        {
          type: 'value',
          name: '饲喂量(kg)',
          position: 'left'
        },
        {
          type: 'value',
          name: '成本(¥)',
          position: 'right'
        }
      ],
      series: [
        {
          name: '饲喂量',
          type: 'line',
          data: statistics.value.trend.map(item => item.amount),
          smooth: true,
          itemStyle: { color: '#409EFF' }
        },
        {
          name: '成本',
          type: 'line',
          yAxisIndex: 1,
          data: statistics.value.trend.map(item => item.cost),
          smooth: true,
          itemStyle: { color: '#67C23A' }
        }
      ]
    }
    trendChart.setOption(trendOption)
  }

  // 更新配方分布图
  if (formulaChart && statistics.value.formulaUsage) {
    const formulaOption = {
      title: {
        text: '配方使用分布',
        left: 'center'
      },
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
          name: '配方使用',
          type: 'pie',
          radius: '50%',
          data: statistics.value.formulaUsage.map(item => ({
            value: item.amount,
            name: item.formulaName
          })),
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
    formulaChart.setOption(formulaOption)
  }
}

// 处理日期范围变化
const handleDateRangeChange = () => {
  fetchStatistics()
  fetchRecentRecords()
}

// 处理基地变化
const handleBaseChange = () => {
  fetchStatistics()
  fetchRecentRecords()
}

// 生成饲喂计划
const generatePlan = async () => {
  if (!selectedBase.value) {
    ElMessage.warning('请先选择基地')
    return
  }
  
  try {
    await feedingApi.generateFeedingPlan({
      baseId: selectedBase.value,
      days: 7
    })
    ElMessage.success('饲喂计划生成成功')
  } catch (error) {
    console.error('生成饲喂计划失败:', error)
    ElMessage.error('生成饲喂计划失败')
  }
}

// 组件挂载
onMounted(() => {
  initDateRange()
  fetchBases()
  initCharts()
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    trendChart?.resize()
    formulaChart?.resize()
  })
})

// 监听基地变化
watch(() => selectedBase.value, () => {
  if (selectedBase.value) {
    fetchStatistics()
    fetchRecentRecords()
  }
})
</script>

<style scoped lang="scss">
.feeding-dashboard {
  padding: 20px;

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h1 {
      margin: 0;
      color: #303133;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .stats-cards {
    margin-bottom: 20px;

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #409EFF, #67C23A);
          color: white;
          font-size: 24px;
        }

        .stat-info {
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #303133;
            margin-bottom: 4px;
          }

          .stat-label {
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

  .quick-actions {
    margin-bottom: 20px;

    .el-button {
      width: 100%;
      height: 60px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
  }

  .recent-records {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}
</style>