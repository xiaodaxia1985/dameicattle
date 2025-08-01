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
            <el-button type="primary" size="large" @click="$router.push('/admin/feeding/records')">
              <el-icon><Plus /></el-icon>
              添加饲喂记录
            </el-button>
          </el-col>
          <el-col :span="6">
            <el-button type="success" size="large" @click="$router.push('/admin/feeding/formulas')">
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
            <el-button type="warning" size="large" @click="$router.push('/admin/feeding/analysis')">
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
            <el-button type="text" @click="$router.push('/admin/feeding/records')">查看全部</el-button>
          </div>
        </template>
        <el-table :data="recentRecords" v-loading="loading">
          <el-table-column label="日期" width="120">
            <template #default="{ row }">
              {{ row.feeding_date }}
            </template>
          </el-table-column>
          <el-table-column label="配方">
            <template #default="{ row }">
              {{ row.formula?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="基地">
            <template #default="{ row }">
              {{ row.base?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="牛棚">
            <template #default="{ row }">
              {{ row.barn?.name || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="用量(kg)" width="100">
            <template #default="{ row }">
              {{ parseFloat(row.amount || 0).toFixed(1) }}
            </template>
          </el-table-column>
          <el-table-column label="成本(¥)" width="100">
            <template #default="{ row }">
              ¥{{ (parseFloat(row.amount || 0) * parseFloat(row.formula?.cost_per_kg || 0)).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="操作员" width="100">
            <template #default="{ row }">
              {{ row.operator?.real_name || row.operator?.username || '-' }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 饲喂计划对话框 -->
    <el-dialog v-model="planDialogVisible" title="7天饲喂计划" width="80%" top="5vh">
      <div v-if="generatedPlan" class="feeding-plan">
        <!-- 计划汇总 -->
        <div class="plan-summary">
          <el-row :gutter="20">
            <el-col :span="6">
              <el-statistic title="计划天数" :value="generatedPlan.summary?.total_days || 0" suffix="天" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="牛只数量" :value="generatedPlan.summary?.cattle_count || 0" suffix="头" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="总用量" :value="generatedPlan.summary?.total_amount || 0" suffix="kg" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="总成本" :value="generatedPlan.summary?.total_cost || 0" prefix="¥" :precision="2" />
            </el-col>
          </el-row>
        </div>

        <!-- 每日计划 -->
        <div class="daily-plans">
          <h3>每日饲喂计划</h3>
          <el-timeline>
            <el-timeline-item
              v-for="(dayPlan, index) in generatedPlan.plan"
              :key="index"
              :timestamp="dayPlan.date"
              placement="top"
            >
              <el-card>
                <template #header>
                  <div class="day-header">
                    <span>{{ dayPlan.day_of_week }}</span>
                    <span class="date">{{ dayPlan.date }}</span>
                  </div>
                </template>
                
                <div class="day-feedings">
                  <el-table :data="dayPlan.feedings" size="small">
                    <el-table-column prop="formula.name" label="配方" width="150" />
                    <el-table-column label="推荐用量" width="120">
                      <template #default="{ row }">
                        {{ row.recommended_amount }}kg
                      </template>
                    </el-table-column>
                    <el-table-column label="预估成本" width="120">
                      <template #default="{ row }">
                        ¥{{ row.estimated_cost }}
                      </template>
                    </el-table-column>
                    <el-table-column label="饲喂次数" width="100">
                      <template #default="{ row }">
                        {{ row.feeding_times }}次
                      </template>
                    </el-table-column>
                    <el-table-column label="单价" width="100">
                      <template #default="{ row }">
                        ¥{{ row.formula?.cost_per_kg }}/kg
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="planDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="exportPlan">导出计划</el-button>
        </div>
      </template>
    </el-dialog>
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
import { validateStatisticsData, validateDataArray, ensureArray, ensureNumber, safeGet } from '@/utils/dataValidation'

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

// 初始化日期范围（扩大范围以包含所有数据）
const initDateRange = () => {
  const end = new Date('2025-12-31') // 设置到2025年底
  const start = new Date('2025-01-01') // 从2025年初开始
  dateRange.value = [
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  ]
}

// 获取基地列表
const fetchBases = async () => {
  try {
    const response = await baseApi.getBases()
    // 使用数据验证工具处理基地数据
    const basesData = safeGet(response, 'data.bases', [])
    bases.value = ensureArray(basesData)
    if (bases.value.length > 0) {
      selectedBase.value = ensureNumber(bases.value[0].id, 0)
    }
  } catch (error) {
    console.error('获取基地列表失败:', error)
    bases.value = []
  }
}

// 获取统计数据
const fetchStatistics = async () => {
  if (!selectedBase.value || !dateRange.value) return
  
  loading.value = true
  try {
    // 确保参数类型正确
    const params = {
      base_id: Number(selectedBase.value),  // 确保是数字类型
      start_date: dateRange.value[0],
      end_date: dateRange.value[1]
    }
    
    console.log('获取统计数据参数:', params)
    
    // 验证参数有效性
    if (!params.base_id || !params.start_date || !params.end_date) {
      console.error('参数无效:', params)
      ElMessage.error('参数无效，请检查基地选择和日期范围')
      return
    }
    
    const response = await feedingApi.getFeedingStatistics(params)
    
    console.log('统计数据API响应:', response)
    
    // 处理后端返回的数据，确保格式正确
    const data = response.data
    statistics.value = {
      totalAmount: data.totalAmount || data.basic_stats?.total_amount || 0,
      totalCost: data.totalCost || data.efficiency?.totalCost || 0,
      avgDailyCost: data.avgDailyCost || data.efficiency?.averageCostPerKg || 0,
      formulaUsage: data.formulaUsage || [],
      trend: data.trend || []
    }
    
    activeFormulas.value = data.formulaUsage?.length || data.formula_stats?.length || 0
    
    console.log('处理后的统计数据:', statistics.value)
    
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
      base_id: selectedBase.value,  // 使用下划线命名
      page: 1,
      limit: 10
    })
    
    console.log('最近记录API响应:', response)
    
    // 根据实际API返回结构处理数据
    if (response.data.records) {
      recentRecords.value = response.data.records || []
    } else if (response.data.data) {
      recentRecords.value = response.data.data || []
    } else {
      recentRecords.value = []
    }
    
    console.log('处理后的最近记录数据:', recentRecords.value)
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

// 饲喂计划相关
const planDialogVisible = ref(false)
const generatedPlan = ref<any>(null)

// 生成饲喂计划
const generatePlan = async () => {
  if (!selectedBase.value) {
    ElMessage.warning('请先选择基地')
    return
  }
  
  try {
    const response = await feedingApi.generateFeedingPlan({
      base_id: selectedBase.value,  // 使用下划线命名
      days: 7
    })
    
    console.log('生成的饲喂计划:', response.data)
    generatedPlan.value = response.data
    planDialogVisible.value = true
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

// 导出饲喂计划
const exportPlan = () => {
  if (!generatedPlan.value) {
    ElMessage.warning('没有可导出的计划')
    return
  }

  try {
    // 创建导出数据
    const exportData = {
      title: '7天饲喂计划',
      generated_at: generatedPlan.value.generated_at,
      summary: generatedPlan.value.summary,
      plan: generatedPlan.value.plan
    }

    // 转换为JSON字符串并下载
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `饲喂计划_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    ElMessage.success('计划导出成功')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  }
}

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