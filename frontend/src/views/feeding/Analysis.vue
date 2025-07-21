<template>
  <div class="analysis-page">
    <div class="page-header">
      <h1>饲喂效率分析</h1>
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
        <el-button type="primary" @click="generateReport">
          <el-icon><Document /></el-icon>
          生成报告
        </el-button>
      </div>
    </div>

    <!-- 概览指标 -->
    <div class="overview-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon efficiency">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ overviewData.efficiency }}%</div>
                <div class="metric-label">饲喂效率</div>
                <div class="metric-trend" :class="{ positive: overviewData.efficiencyTrend > 0, negative: overviewData.efficiencyTrend < 0 }">
                  <el-icon v-if="overviewData.efficiencyTrend > 0"><ArrowUp /></el-icon>
                  <el-icon v-else-if="overviewData.efficiencyTrend < 0"><ArrowDown /></el-icon>
                  {{ Math.abs(overviewData.efficiencyTrend) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon cost">
                <el-icon><Money /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">¥{{ overviewData.avgCostPerKg }}</div>
                <div class="metric-label">平均成本/kg</div>
                <div class="metric-trend" :class="{ positive: overviewData.costTrend < 0, negative: overviewData.costTrend > 0 }">
                  <el-icon v-if="overviewData.costTrend < 0"><ArrowDown /></el-icon>
                  <el-icon v-else-if="overviewData.costTrend > 0"><ArrowUp /></el-icon>
                  {{ Math.abs(overviewData.costTrend) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon utilization">
                <el-icon><Dish /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ overviewData.utilization }}%</div>
                <div class="metric-label">配方利用率</div>
                <div class="metric-trend" :class="{ positive: overviewData.utilizationTrend > 0, negative: overviewData.utilizationTrend < 0 }">
                  <el-icon v-if="overviewData.utilizationTrend > 0"><ArrowUp /></el-icon>
                  <el-icon v-else-if="overviewData.utilizationTrend < 0"><ArrowDown /></el-icon>
                  {{ Math.abs(overviewData.utilizationTrend) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="metric-card">
            <div class="metric-content">
              <div class="metric-icon waste">
                <el-icon><Warning /></el-icon>
              </div>
              <div class="metric-info">
                <div class="metric-value">{{ overviewData.wasteRate }}%</div>
                <div class="metric-label">浪费率</div>
                <div class="metric-trend" :class="{ positive: overviewData.wasteTrend < 0, negative: overviewData.wasteTrend > 0 }">
                  <el-icon v-if="overviewData.wasteTrend < 0"><ArrowDown /></el-icon>
                  <el-icon v-else-if="overviewData.wasteTrend > 0"><ArrowUp /></el-icon>
                  {{ Math.abs(overviewData.wasteTrend) }}%
                </div>
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
          <el-card title="成本效率趋势">
            <template #header>
              <div class="card-header">
                <span>成本效率趋势</span>
                <el-radio-group v-model="trendPeriod" size="small" @change="updateTrendChart">
                  <el-radio-button label="7d">7天</el-radio-button>
                  <el-radio-button label="30d">30天</el-radio-button>
                  <el-radio-button label="90d">90天</el-radio-button>
                </el-radio-group>
              </div>
            </template>
            <div ref="trendChartRef" style="height: 350px;"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card title="配方效率对比">
            <template #header>
              <span>配方效率对比</span>
            </template>
            <div ref="formulaChartRef" style="height: 350px;"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 配方效率排行 -->
    <div class="ranking-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card title="配方效率排行">
            <template #header>
              <div class="card-header">
                <span>配方效率排行</span>
                <el-select v-model="rankingMetric" size="small" @change="updateRanking">
                  <el-option label="成本效率" value="cost" />
                  <el-option label="使用频率" value="frequency" />
                  <el-option label="总用量" value="amount" />
                </el-select>
              </div>
            </template>
            <div class="ranking-list">
              <div
                v-for="(item, index) in formulaRanking"
                :key="item.id"
                class="ranking-item"
              >
                <div class="rank-number" :class="`rank-${index + 1}`">{{ index + 1 }}</div>
                <div class="formula-info">
                  <div class="formula-name">{{ item.name }}</div>
                  <div class="formula-stats">
                    <span>成本: ¥{{ item.costPerKg }}/kg</span>
                    <span>使用: {{ item.usageCount }}次</span>
                    <span>总量: {{ item.totalAmount }}kg</span>
                  </div>
                </div>
                <div class="efficiency-score">
                  <div class="score">{{ item.efficiencyScore }}</div>
                  <div class="score-label">效率分</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card title="基地效率对比">
            <template #header>
              <span>基地效率对比</span>
            </template>
            <div ref="baseComparisonChartRef" style="height: 350px;"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 详细分析表格 -->
    <div class="detail-section">
      <el-card title="详细分析数据">
        <template #header>
          <div class="card-header">
            <span>详细分析数据</span>
            <div class="header-tools">
              <el-button type="text" @click="exportAnalysis">
                <el-icon><Download /></el-icon>
                导出分析
              </el-button>
            </div>
          </div>
        </template>
        <el-table :data="analysisData" v-loading="loading">
          <el-table-column prop="formulaName" label="配方名称" min-width="150" />
          <el-table-column prop="usageCount" label="使用次数" width="100" sortable />
          <el-table-column prop="totalAmount" label="总用量(kg)" width="120" sortable>
            <template #default="{ row }">
              {{ row.totalAmount?.toFixed(1) }}
            </template>
          </el-table-column>
          <el-table-column prop="totalCost" label="总成本(¥)" width="120" sortable>
            <template #default="{ row }">
              ¥{{ row.totalCost?.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="avgCostPerKg" label="平均成本/kg" width="120" sortable>
            <template #default="{ row }">
              ¥{{ row.avgCostPerKg?.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="efficiency" label="效率指数" width="100" sortable>
            <template #default="{ row }">
              <el-tag :type="getEfficiencyType(row.efficiency)">
                {{ row.efficiency?.toFixed(1) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="recommendation" label="建议" min-width="200">
            <template #default="{ row }">
              <el-tag v-if="row.efficiency >= 80" type="success">优秀，继续保持</el-tag>
              <el-tag v-else-if="row.efficiency >= 60" type="warning">良好，可优化成本</el-tag>
              <el-tag v-else type="danger">需要改进配方或使用方式</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="text" @click="viewFormulaDetail(row)">详情</el-button>
              <el-button type="text" @click="optimizeFormula(row)">优化</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 优化建议对话框 -->
    <el-dialog v-model="optimizeDialogVisible" title="配方优化建议" width="600px">
      <div v-if="selectedFormulaAnalysis" class="optimize-content">
        <div class="current-status">
          <h3>当前状态</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="配方名称">{{ selectedFormulaAnalysis.formulaName }}</el-descriptions-item>
            <el-descriptions-item label="效率指数">{{ selectedFormulaAnalysis.efficiency?.toFixed(1) }}</el-descriptions-item>
            <el-descriptions-item label="平均成本">¥{{ selectedFormulaAnalysis.avgCostPerKg?.toFixed(2) }}/kg</el-descriptions-item>
            <el-descriptions-item label="使用频率">{{ selectedFormulaAnalysis.usageCount }}次</el-descriptions-item>
          </el-descriptions>
        </div>
        <div class="optimization-suggestions">
          <h3>优化建议</h3>
          <el-alert
            v-for="suggestion in optimizationSuggestions"
            :key="suggestion.type"
            :title="suggestion.title"
            :type="suggestion.level"
            :description="suggestion.description"
            show-icon
            style="margin-bottom: 12px"
          />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, TrendCharts, Money, Dish, Warning, ArrowUp, ArrowDown, Download } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { feedingApi } from '@/api/feeding'
import { baseApi } from '@/api/base'

// 响应式数据
const dateRange = ref<[string, string]>(['', ''])
const selectedBase = ref<number>()
const bases = ref<any[]>([])
const loading = ref(false)
const trendPeriod = ref('30d')
const rankingMetric = ref('cost')

// 对话框
const optimizeDialogVisible = ref(false)
const selectedFormulaAnalysis = ref<any>(null)

// 概览数据
const overviewData = ref({
  efficiency: 85.2,
  efficiencyTrend: 2.3,
  avgCostPerKg: 3.45,
  costTrend: -1.2,
  utilization: 78.5,
  utilizationTrend: 1.8,
  wasteRate: 5.2,
  wasteTrend: -0.8
})

// 分析数据
const analysisData = ref<any[]>([])
const formulaRanking = ref<any[]>([])

// 优化建议
const optimizationSuggestions = ref<any[]>([])

// 图表引用
const trendChartRef = ref<HTMLElement>()
const formulaChartRef = ref<HTMLElement>()
const baseComparisonChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let formulaChart: echarts.ECharts | null = null
let baseComparisonChart: echarts.ECharts | null = null

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

// 获取分析数据
const fetchAnalysisData = async () => {
  if (!selectedBase.value || !dateRange.value) return
  
  loading.value = true
  try {
    // 模拟分析数据
    analysisData.value = [
      {
        formulaName: '育肥牛标准配方',
        usageCount: 45,
        totalAmount: 2250.5,
        totalCost: 7763.73,
        avgCostPerKg: 3.45,
        efficiency: 85.2
      },
      {
        formulaName: '繁殖母牛配方',
        usageCount: 32,
        totalAmount: 1680.0,
        totalCost: 6350.40,
        avgCostPerKg: 3.78,
        efficiency: 78.9
      },
      {
        formulaName: '犊牛专用配方',
        usageCount: 28,
        totalAmount: 980.5,
        totalCost: 4314.20,
        avgCostPerKg: 4.40,
        efficiency: 72.3
      },
      {
        formulaName: '高产奶牛配方',
        usageCount: 18,
        totalAmount: 1260.0,
        totalCost: 5544.00,
        avgCostPerKg: 4.40,
        efficiency: 68.5
      }
    ]
    
    updateRanking()
    updateCharts()
  } catch (error) {
    console.error('获取分析数据失败:', error)
    ElMessage.error('获取分析数据失败')
  } finally {
    loading.value = false
  }
}

// 更新排行
const updateRanking = () => {
  formulaRanking.value = [...analysisData.value]
    .sort((a, b) => {
      switch (rankingMetric.value) {
        case 'cost':
          return a.avgCostPerKg - b.avgCostPerKg
        case 'frequency':
          return b.usageCount - a.usageCount
        case 'amount':
          return b.totalAmount - a.totalAmount
        default:
          return b.efficiency - a.efficiency
      }
    })
    .map(item => ({
      ...item,
      efficiencyScore: item.efficiency.toFixed(1)
    }))
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
    if (baseComparisonChartRef.value) {
      baseComparisonChart = echarts.init(baseComparisonChartRef.value)
    }
    updateCharts()
  })
}

// 更新图表
const updateCharts = () => {
  updateTrendChart()
  updateFormulaChart()
  updateBaseComparisonChart()
}

// 更新趋势图
const updateTrendChart = () => {
  if (!trendChart) return
  
  const dates = []
  const costs = []
  const efficiency = []
  
  // 生成模拟数据
  const days = trendPeriod.value === '7d' ? 7 : trendPeriod.value === '30d' ? 30 : 90
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toISOString().split('T')[0])
    costs.push((3.2 + Math.random() * 0.8).toFixed(2))
    efficiency.push((75 + Math.random() * 20).toFixed(1))
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['平均成本', '效率指数']
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: [
      {
        type: 'value',
        name: '成本(¥/kg)',
        position: 'left',
        axisLabel: {
          formatter: '¥{value}'
        }
      },
      {
        type: 'value',
        name: '效率指数',
        position: 'right',
        axisLabel: {
          formatter: '{value}%'
        }
      }
    ],
    series: [
      {
        name: '平均成本',
        type: 'line',
        data: costs,
        smooth: true,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '效率指数',
        type: 'line',
        yAxisIndex: 1,
        data: efficiency,
        smooth: true,
        itemStyle: { color: '#67C23A' }
      }
    ]
  }
  
  trendChart.setOption(option)
}

// 更新配方图表
const updateFormulaChart = () => {
  if (!formulaChart) return
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    legend: {
      data: ['使用次数', '效率指数']
    },
    xAxis: {
      type: 'category',
      data: analysisData.value.map(item => item.formulaName)
    },
    yAxis: [
      {
        type: 'value',
        name: '使用次数',
        position: 'left'
      },
      {
        type: 'value',
        name: '效率指数',
        position: 'right'
      }
    ],
    series: [
      {
        name: '使用次数',
        type: 'bar',
        data: analysisData.value.map(item => item.usageCount),
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '效率指数',
        type: 'line',
        yAxisIndex: 1,
        data: analysisData.value.map(item => item.efficiency),
        itemStyle: { color: '#67C23A' }
      }
    ]
  }
  
  formulaChart.setOption(option)
}

// 更新基地对比图表
const updateBaseComparisonChart = () => {
  if (!baseComparisonChart) return
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '基地效率',
        type: 'pie',
        radius: '50%',
        data: [
          { value: 85.2, name: '主基地' },
          { value: 78.9, name: '分基地A' },
          { value: 72.3, name: '分基地B' },
          { value: 68.5, name: '分基地C' }
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
  
  baseComparisonChart.setOption(option)
}

// 处理日期范围变化
const handleDateRangeChange = () => {
  fetchAnalysisData()
}

// 处理基地变化
const handleBaseChange = () => {
  fetchAnalysisData()
}

// 获取效率类型
const getEfficiencyType = (efficiency: number) => {
  if (efficiency >= 80) return 'success'
  if (efficiency >= 60) return 'warning'
  return 'danger'
}

// 查看配方详情
const viewFormulaDetail = (formula: any) => {
  ElMessage.info('配方详情功能开发中...')
}

// 优化配方
const optimizeFormula = (formula: any) => {
  selectedFormulaAnalysis.value = formula
  
  // 生成优化建议
  optimizationSuggestions.value = []
  
  if (formula.efficiency < 60) {
    optimizationSuggestions.value.push({
      type: 'cost',
      level: 'error',
      title: '成本过高',
      description: '建议调整配方成分比例，选择性价比更高的原料替代昂贵成分。'
    })
  }
  
  if (formula.usageCount < 20) {
    optimizationSuggestions.value.push({
      type: 'usage',
      level: 'warning',
      title: '使用频率偏低',
      description: '该配方使用频率较低，建议评估其实用性或推广使用。'
    })
  }
  
  if (formula.avgCostPerKg > 4.0) {
    optimizationSuggestions.value.push({
      type: 'price',
      level: 'warning',
      title: '单位成本偏高',
      description: '建议寻找更优质的供应商或批量采购以降低原料成本。'
    })
  }
  
  optimizationSuggestions.value.push({
    type: 'general',
    level: 'info',
    title: '持续优化',
    description: '建议定期评估配方效果，根据牛只生长情况和市场价格调整配方。'
  })
  
  optimizeDialogVisible.value = true
}

// 生成报告
const generateReport = () => {
  ElMessage.info('报告生成功能开发中...')
}

// 导出分析
const exportAnalysis = () => {
  ElMessage.info('导出功能开发中...')
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
    baseComparisonChart?.resize()
  })
})

// 监听基地变化
watch(() => selectedBase.value, () => {
  if (selectedBase.value) {
    fetchAnalysisData()
  }
})
</script>

<style scoped lang="scss">
.analysis-page {
  padding: 20px;

  .page-header {
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

          &.efficiency {
            background: linear-gradient(135deg, #67C23A, #85CE61);
          }

          &.cost {
            background: linear-gradient(135deg, #409EFF, #66B1FF);
          }

          &.utilization {
            background: linear-gradient(135deg, #E6A23C, #EBB563);
          }

          &.waste {
            background: linear-gradient(135deg, #F56C6C, #F78989);
          }
        }

        .metric-info {
          flex: 1;

          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #303133;
            margin-bottom: 4px;
          }

          .metric-label {
            font-size: 14px;
            color: #909399;
            margin-bottom: 4px;
          }

          .metric-trend {
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 2px;

            &.positive {
              color: #67C23A;
            }

            &.negative {
              color: #F56C6C;
            }
          }
        }
      }
    }
  }

  .charts-section {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }

  .ranking-section {
    margin-bottom: 20px;

    .ranking-list {
      .ranking-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.3s;

        &:hover {
          background-color: #f5f7fa;
        }

        &:last-child {
          border-bottom: none;
        }

        .rank-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          margin-right: 12px;

          &.rank-1 {
            background: linear-gradient(135deg, #FFD700, #FFA500);
          }

          &.rank-2 {
            background: linear-gradient(135deg, #C0C0C0, #A9A9A9);
          }

          &.rank-3 {
            background: linear-gradient(135deg, #CD7F32, #B8860B);
          }

          &:not(.rank-1):not(.rank-2):not(.rank-3) {
            background: #909399;
          }
        }

        .formula-info {
          flex: 1;

          .formula-name {
            font-weight: bold;
            color: #303133;
            margin-bottom: 4px;
          }

          .formula-stats {
            font-size: 12px;
            color: #909399;
            display: flex;
            gap: 12px;
          }
        }

        .efficiency-score {
          text-align: center;

          .score {
            font-size: 20px;
            font-weight: bold;
            color: #67C23A;
          }

          .score-label {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }

  .detail-section {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-tools {
        display: flex;
        gap: 8px;
      }
    }
  }

  .optimize-content {
    .current-status {
      margin-bottom: 20px;

      h3 {
        margin-bottom: 12px;
        color: #303133;
      }
    }

    .optimization-suggestions {
      h3 {
        margin-bottom: 12px;
        color: #303133;
      }
    }
  }
}
</style>