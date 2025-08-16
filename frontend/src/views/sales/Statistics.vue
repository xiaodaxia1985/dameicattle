<template>
  <div class="statistics-container">
    <div class="page-header">
      <h2>销售统计分析</h2>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="monthrange"
          range-separator="至"
          start-placeholder="开始月份"
          end-placeholder="结束月份"
          format="YYYY-MM"
          value-format="YYYY-MM"
          @change="handleDateChange"
        />
        <el-button type="primary" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出报表
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-cards">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon sales">
              <el-icon><Sell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalOrders }}</div>
              <div class="stat-label">销售订单总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon amount">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ statistics.totalAmount?.toLocaleString() || 0 }}</div>
              <div class="stat-label">销售总金额</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon customer">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.activeCustomers }}</div>
              <div class="stat-label">活跃客户</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon avg">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ statistics.avgOrderAmount?.toLocaleString() || 0 }}</div>
              <div class="stat-label">平均订单金额</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <!-- 销售趋势图 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>销售趋势分析</span>
              <el-radio-group v-model="trendType" size="small" @change="updateTrendChart">
                <el-radio-button label="amount">金额</el-radio-button>
                <el-radio-button label="count">数量</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 订单状态分布 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>订单状态分布</span>
          </template>
          <div ref="statusChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <!-- 客户排行 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>客户销售排行</span>
          </template>
          <div ref="customerChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 基地销售分布 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>基地销售分布</span>
          </template>
          <div ref="baseChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 详细数据表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>销售明细数据</span>
          <el-button-group>
            <el-button 
              :type="activeTab === 'monthly' ? 'primary' : ''" 
              @click="activeTab = 'monthly'; fetchDetailData()"
            >
              月度统计
            </el-button>
            <el-button 
              :type="activeTab === 'customer' ? 'primary' : ''" 
              @click="activeTab = 'customer'; fetchDetailData()"
            >
              客户统计
            </el-button>
            <el-button 
              :type="activeTab === 'base' ? 'primary' : ''" 
              @click="activeTab = 'base'; fetchDetailData()"
            >
              基地统计
            </el-button>
          </el-button-group>
        </div>
      </template>

      <!-- 月度统计表格 -->
      <el-table v-if="activeTab === 'monthly'" :data="monthlyData" v-loading="tableLoading">
        <el-table-column prop="month" label="月份" width="120" />
        <el-table-column prop="orderCount" label="订单数量" width="120" />
        <el-table-column prop="totalAmount" label="销售金额" width="150">
          <template #default="{ row }">
            ¥{{ row.totalAmount?.toLocaleString() || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="avgAmount" label="平均金额" width="150">
          <template #default="{ row }">
            ¥{{ row.avgAmount?.toLocaleString() || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="cattleCount" label="牛只数量" width="120" />
        <el-table-column prop="completionRate" label="完成率" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.completionRate" 
              :color="getProgressColor(row.completionRate)"
              :show-text="false"
            />
            <span class="progress-text">{{ row.completionRate }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="growthRate" label="环比增长" width="120">
          <template #default="{ row }">
            <span :class="row.growthRate >= 0 ? 'growth-positive' : 'growth-negative'">
              {{ row.growthRate >= 0 ? '+' : '' }}{{ row.growthRate }}%
            </span>
          </template>
        </el-table-column>
      </el-table>

      <!-- 客户统计表格 -->
      <el-table v-if="activeTab === 'customer'" :data="customerData" v-loading="tableLoading">
        <el-table-column prop="customerName" label="客户名称" min-width="150" />
        <el-table-column prop="orderCount" label="订单数量" width="120" />
        <el-table-column prop="totalAmount" label="销售金额" width="150">
          <template #default="{ row }">
            ¥{{ row.totalAmount?.toLocaleString() || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="avgAmount" label="平均金额" width="150">
          <template #default="{ row }">
            ¥{{ row.avgAmount?.toLocaleString() || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="cattleCount" label="牛只数量" width="120" />
        <el-table-column prop="creditRating" label="客户评级" width="120">
          <template #default="{ row }">
            <el-rate v-model="row.creditRating" disabled show-score />
          </template>
        </el-table-column>
        <el-table-column prop="lastOrderDate" label="最近订单" width="120">
          <template #default="{ row }">
            {{ formatDate(row.lastOrderDate) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 基地统计表格 -->
      <el-table v-if="activeTab === 'base'" :data="baseData" v-loading="tableLoading">
        <el-table-column prop="baseName" label="基地名称" min-width="150" />
        <el-table-column prop="orderCount" label="订单数量" width="120" />
        <el-table-column prop="totalAmount" label="销售金额" width="150">
          <template #default="{ row }">
            ¥{{ row.totalAmount?.toLocaleString() || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="percentage" label="占比" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.percentage" 
              :color="'#409EFF'"
              :show-text="false"
            />
            <span class="progress-text">{{ row.percentage }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="avgAmount" label="平均金额" width="150">
          <template #default="{ row }">
            ¥{{ row.avgAmount?.toLocaleString() || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="cattleCount" label="牛只数量" width="120" />
        <el-table-column prop="growthRate" label="增长率" width="120">
          <template #default="{ row }">
            <span :class="row.growthRate >= 0 ? 'growth-positive' : 'growth-negative'">
              {{ row.growthRate >= 0 ? '+' : '' }}{{ row.growthRate }}%
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Sell, Money, User, TrendCharts } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { salesApi } from '@/api/sales'
import { ensureUserLoggedIn, withAuth } from '@/utils/authGuard'

// 响应式数据
const dateRange = ref<[string, string]>([
  new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString().slice(0, 7),
  new Date().toISOString().slice(0, 7)
])
const trendType = ref('amount')
const activeTab = ref('monthly')
const tableLoading = ref(false)

// 统计数据
const statistics = reactive({
  totalOrders: 0,
  totalAmount: 0,
  activeCustomers: 0,
  avgOrderAmount: 0
})

// 表格数据
const monthlyData = ref<any[]>([])
const customerData = ref<any[]>([])
const baseData = ref<any[]>([])

// 图表引用
const trendChartRef = ref()
const statusChartRef = ref()
const customerChartRef = ref()
const baseChartRef = ref()

// 图表实例
let trendChart: echarts.ECharts | null = null
let statusChart: echarts.ECharts | null = null
let customerChart: echarts.ECharts | null = null
let baseChart: echarts.ECharts | null = null

// 方法
const fetchStatistics = async () => {
  try {
    // 使用认证守卫确保用户已登录
    const isLoggedIn = await ensureUserLoggedIn()
    if (!isLoggedIn) {
      console.log('❌ 用户未登录，使用模拟数据')
      useMockData()
      return
    }
    
    console.log('🔍 开始获取销售统计数据...')
    
    // 使用withAuth包装API调用
    await withAuth(async () => {
      const params = {
        start_date: dateRange.value[0] + '-01',
        end_date: dateRange.value[1] + '-31'
      }
      
      console.log('🔍 统计请求参数:', params)
      
      const response = await salesApi.getStatistics(params)
      console.log('📥 统计API返回结果:', response)
      
      const data = response.data
      
      // 更新统计数据
      Object.assign(statistics, {
        totalOrders: data.total_statistics?.total_orders || 0,
        totalAmount: data.total_statistics?.total_sales || 0,
        activeCustomers: data.customer_statistics?.length || 0,
        avgOrderAmount: data.total_statistics?.avg_order_value || 0
      })
      
      console.log('✅ 成功更新统计数据:', statistics)
      
      // 更新图表数据
      updateCharts(data)
    })
  } catch (error) {
    console.error('❌ 获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败，使用模拟数据')
    // 使用模拟数据
    useMockData()
  }
}

const useMockData = () => {
  // 模拟数据
  Object.assign(statistics, {
    totalOrders: 156,
    totalAmount: 2580000,
    activeCustomers: 23,
    avgOrderAmount: 16538
  })
}

const fetchDetailData = async () => {
  tableLoading.value = true
  try {
    if (activeTab.value === 'monthly') {
      // 模拟月度数据
      monthlyData.value = [
        {
          month: '2024-01',
          orderCount: 25,
          totalAmount: 420000,
          avgAmount: 16800,
          cattleCount: 45,
          completionRate: 92,
          growthRate: 8.5
        },
        {
          month: '2024-02',
          orderCount: 18,
          totalAmount: 310000,
          avgAmount: 17222,
          cattleCount: 32,
          completionRate: 89,
          growthRate: -5.2
        },
        {
          month: '2024-03',
          orderCount: 32,
          totalAmount: 580000,
          avgAmount: 18125,
          cattleCount: 58,
          completionRate: 94,
          growthRate: 12.3
        }
      ]
    } else if (activeTab.value === 'customer') {
      // 模拟客户数据
      customerData.value = [
        {
          customerName: '北京牧业有限公司',
          orderCount: 15,
          totalAmount: 450000,
          avgAmount: 30000,
          cattleCount: 45,
          creditRating: 5,
          lastOrderDate: '2024-03-15'
        },
        {
          customerName: '上海肉类加工厂',
          orderCount: 28,
          totalAmount: 380000,
          avgAmount: 13571,
          cattleCount: 38,
          creditRating: 4,
          lastOrderDate: '2024-03-20'
        }
      ]
    } else if (activeTab.value === 'base') {
      // 模拟基地数据
      baseData.value = [
        {
          baseName: '北京基地',
          orderCount: 45,
          totalAmount: 1200000,
          percentage: 46.5,
          avgAmount: 26667,
          cattleCount: 120,
          growthRate: 12.5
        },
        {
          baseName: '上海基地',
          orderCount: 78,
          totalAmount: 980000,
          percentage: 38.0,
          avgAmount: 12564,
          cattleCount: 98,
          growthRate: 8.3
        },
        {
          baseName: '广州基地',
          orderCount: 33,
          totalAmount: 400000,
          percentage: 15.5,
          avgAmount: 12121,
          cattleCount: 40,
          growthRate: -2.1
        }
      ]
    }
  } catch (error) {
    ElMessage.error('获取详细数据失败')
  } finally {
    tableLoading.value = false
  }
}

const initCharts = async () => {
  await nextTick()
  
  // 初始化趋势图
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value)
    updateTrendChart()
  }

  // 初始化状态分布图
  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value)
    const statusOption = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '订单状态',
          type: 'pie',
          radius: '50%',
          data: [
            { value: 45, name: '已完成' },
            { value: 32, name: '已审批' },
            { value: 28, name: '已交付' },
            { value: 15, name: '待审批' },
            { value: 8, name: '已取消' }
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
    statusChart.setOption(statusOption)
  }

  // 初始化客户排行图
  if (customerChartRef.value) {
    customerChart = echarts.init(customerChartRef.value)
    const customerOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value'
      },
      yAxis: {
        type: 'category',
        data: ['北京牧业', '上海肉类', '广州食品', '天津养殖', '重庆畜牧']
      },
      series: [
        {
          name: '销售金额',
          type: 'bar',
          data: [450000, 380000, 320000, 280000, 250000],
          itemStyle: {
            color: '#67C23A'
          }
        }
      ]
    }
    customerChart.setOption(customerOption)
  }

  // 初始化基地分布图
  if (baseChartRef.value) {
    baseChart = echarts.init(baseChartRef.value)
    const baseOption = {
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '基地销售',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '30',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: 1200000, name: '北京基地' },
            { value: 980000, name: '上海基地' },
            { value: 400000, name: '广州基地' }
          ]
        }
      ]
    }
    baseChart.setOption(baseOption)
  }
}

const updateCharts = (data: any) => {
  // 更新图表数据
  // 这里可以根据实际API返回的数据结构进行调整
}

const updateTrendChart = () => {
  if (!trendChart) return

  const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06']
  const amountData = [420000, 310000, 580000, 450000, 380000, 520000]
  const countData = [25, 18, 32, 28, 22, 30]

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: [trendType.value === 'amount' ? '销售金额' : '订单数量']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: months
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: trendType.value === 'amount' ? '销售金额' : '订单数量',
        type: 'line',
        stack: 'Total',
        data: trendType.value === 'amount' ? amountData : countData,
        itemStyle: {
          color: '#67C23A'
        },
        areaStyle: {
          color: 'rgba(103, 194, 58, 0.1)'
        }
      }
    ]
  }
  trendChart.setOption(option)
}

const handleDateChange = () => {
  fetchStatistics()
  fetchDetailData()
  updateTrendChart()
}

const handleExport = () => {
  ElMessage.info('导出功能开发中')
}

// 辅助方法
const getProgressColor = (percentage: number) => {
  if (percentage >= 90) return '#67c23a'
  if (percentage >= 70) return '#e6a23c'
  return '#f56c6c'
}

const formatDate = (dateString?: string) => {
  return dateString ? new Date(dateString).toLocaleDateString('zh-CN') : '-'
}

// 生命周期
onMounted(() => {
  fetchStatistics()
  fetchDetailData()
  initCharts()
})

onUnmounted(() => {
  // 清理图表实例，防止内存泄漏和DOM操作错误
  if (trendChart) {
    trendChart.dispose()
    trendChart = null
  }
  if (statusChart) {
    statusChart.dispose()
    statusChart = null
  }
  if (customerChart) {
    customerChart.dispose()
    customerChart = null
  }
  if (baseChart) {
    baseChart.dispose()
    baseChart = null
  }
  
  // 移除窗口大小变化监听器
  window.removeEventListener('resize', handleResize)
})

// 窗口大小变化处理函数
const handleResize = () => {
  trendChart?.resize()
  statusChart?.resize()
  customerChart?.resize()
  baseChart?.resize()
}

// 窗口大小变化时重新调整图表
window.addEventListener('resize', handleResize)
</script>

<style scoped>
.statistics-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: white;
}

.stat-icon.sales {
  background: linear-gradient(135deg, #67C23A 0%, #85CE61 100%);
}

.stat-icon.amount {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.customer {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.avg {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 400px;
}

.chart-container {
  height: 320px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-card {
  margin-bottom: 20px;
}

.progress-text {
  margin-left: 10px;
  font-size: 12px;
  color: #606266;
}

.growth-positive {
  color: #67c23a;
  font-weight: bold;
}

.growth-negative {
  color: #f56c6c;
  font-weight: bold;
}

.el-progress {
  width: 60px;
  display: inline-block;
}
</style>