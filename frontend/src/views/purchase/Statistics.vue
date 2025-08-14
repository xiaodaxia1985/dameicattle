<template>
  <div class="statistics-container">
    <div class="page-header">
      <h2>采购统计分析</h2>
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
            <div class="stat-icon purchase">
              <el-icon><ShoppingCart /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.totalOrders }}</div>
              <div class="stat-label">采购订单总数</div>
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
              <div class="stat-label">采购总金额</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon supplier">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.activeSuppliers }}</div>
              <div class="stat-label">活跃供应商</div>
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
      <!-- 采购趋势图 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>采购趋势分析</span>
              <el-radio-group v-model="trendType" size="small" @change="updateTrendChart">
                <el-radio-button label="amount">金额</el-radio-button>
                <el-radio-button label="count">数量</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 采购类型分布 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>采购类型分布</span>
          </template>
          <div ref="typeChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <!-- 供应商排行 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>供应商采购排行</span>
          </template>
          <div ref="supplierChartRef" class="chart-container"></div>
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

    <!-- 详细数据表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>采购明细数据</span>
          <el-button-group>
            <el-button 
              :type="activeTab === 'monthly' ? 'primary' : ''" 
              @click="activeTab = 'monthly'; fetchDetailData()"
            >
              月度统计
            </el-button>
            <el-button 
              :type="activeTab === 'supplier' ? 'primary' : ''" 
              @click="activeTab = 'supplier'; fetchDetailData()"
            >
              供应商统计
            </el-button>
            <el-button 
              :type="activeTab === 'category' ? 'primary' : ''" 
              @click="activeTab = 'category'; fetchDetailData()"
            >
              类别统计
            </el-button>
          </el-button-group>
        </div>
      </template>

      <!-- 月度统计表格 -->
      <el-table v-if="activeTab === 'monthly'" :data="monthlyData" v-loading="tableLoading">
        <el-table-column prop="month" label="月份" width="120" />
        <el-table-column prop="orderCount" label="订单数量" width="120" />
        <el-table-column prop="totalAmount" label="采购金额" width="150">
          <template #default="{ row }">
            ¥{{ row.totalAmount?.toLocaleString() || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="avgAmount" label="平均金额" width="150">
          <template #default="{ row }">
            ¥{{ row.avgAmount?.toLocaleString() || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="cattleOrders" label="牛只采购" width="120" />
        <el-table-column prop="materialOrders" label="物资采购" width="120" />
        <el-table-column prop="equipmentOrders" label="设备采购" width="120" />
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
      </el-table>

      <!-- 供应商统计表格 -->
      <el-table v-if="activeTab === 'supplier'" :data="supplierData" v-loading="tableLoading">
        <el-table-column prop="supplierName" label="供应商名称" min-width="150" />
        <el-table-column prop="orderCount" label="订单数量" width="120" />
        <el-table-column prop="totalAmount" label="采购金额" width="150">
          <template #default="{ row }">
            ¥{{ row.totalAmount?.toLocaleString() || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="avgAmount" label="平均金额" width="150">
          <template #default="{ row }">
            ¥{{ row.avgAmount?.toLocaleString() || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="rating" label="供应商评级" width="120">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled show-score />
          </template>
        </el-table-column>
        <el-table-column prop="onTimeRate" label="准时交付率" width="120">
          <template #default="{ row }">
            <el-tag :type="getDeliveryRateColor(row.onTimeRate)">
              {{ row.onTimeRate }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastOrderDate" label="最近订单" width="120">
          <template #default="{ row }">
            {{ formatDate(row.lastOrderDate) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 类别统计表格 -->
      <el-table v-if="activeTab === 'category'" :data="categoryData" v-loading="tableLoading">
        <el-table-column prop="category" label="采购类别" width="120">
          <template #default="{ row }">
            <el-tag :type="getCategoryColor(row.category)">
              {{ getCategoryText(row.category) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderCount" label="订单数量" width="120" />
        <el-table-column prop="totalAmount" label="采购金额" width="150">
          <template #default="{ row }">
            ¥{{ row.totalAmount?.toLocaleString() || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="percentage" label="占比" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.percentage" 
              :color="getCategoryColor(row.category)"
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
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, ShoppingCart, Money, User, TrendCharts } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { purchaseApi } from '@/api/purchase'

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
  activeSuppliers: 0,
  avgOrderAmount: 0
})

// 表格数据
const monthlyData = ref<any[]>([])
const supplierData = ref<any[]>([])
const categoryData = ref<any[]>([])

// 图表引用
const trendChartRef = ref()
const typeChartRef = ref()
const supplierChartRef = ref()
const statusChartRef = ref()

// 图表实例
let trendChart: echarts.ECharts | null = null
let typeChart: echarts.ECharts | null = null
let supplierChart: echarts.ECharts | null = null
let statusChart: echarts.ECharts | null = null

// 方法
const fetchStatistics = async () => {
  try {
    const params = {
      startDate: dateRange.value?.[0] ? `${dateRange.value[0]}-01` : undefined,
      endDate: dateRange.value?.[1] ? `${dateRange.value[1]}-31` : undefined
    }
    
    const response = await purchaseApi.getStatistics(params)
    console.log('统计数据响应:', response)
    
    if (response.data) {
      Object.assign(statistics, response.data)
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
    ElMessage.error('获取统计数据失败')
  }
}

const fetchDetailData = async () => {
  tableLoading.value = true
  try {
    const params = {
      startDate: dateRange.value?.[0] ? `${dateRange.value[0]}-01` : undefined,
      endDate: dateRange.value?.[1] ? `${dateRange.value[1]}-31` : undefined
    }

    if (activeTab.value === 'monthly') {
      const response = await purchaseApi.getMonthlyData(params)
      console.log('月度数据响应:', response)
      monthlyData.value = response.data?.monthlyData || []
    } else if (activeTab.value === 'supplier') {
      const response = await purchaseApi.getSupplierRanking(params)
      console.log('供应商排行响应:', response)
      supplierData.value = response.data?.supplierRanking || []
    } else if (activeTab.value === 'category') {
      const response = await purchaseApi.getTypeDistribution(params)
      console.log('类型分布响应:', response)
      categoryData.value = response.data?.typeDistribution || []
    }
  } catch (error) {
    console.error('获取详细数据失败:', error)
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
    await updateTrendChart()
  }

  // 初始化类型分布图
  if (typeChartRef.value) {
    typeChart = echarts.init(typeChartRef.value)
    await updateTypeChart()
  }

  // 初始化供应商排行图
  if (supplierChartRef.value) {
    supplierChart = echarts.init(supplierChartRef.value)
    await updateSupplierChart()
  }

  // 初始化状态分布图
  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value)
    await updateStatusChart()
  }
}

const updateTrendChart = async () => {
  if (!trendChart) return

  try {
    const params = {
      startDate: dateRange.value?.[0] ? `${dateRange.value[0]}-01` : undefined,
      endDate: dateRange.value?.[1] ? `${dateRange.value[1]}-31` : undefined,
      months: 6
    }
    
    const response = await purchaseApi.getTrendData(params)
    const trendData = response.data?.monthlyStats || []
    
    const months = trendData.map((item: any) => item.month?.slice(0, 7) || '')
    const amountData = trendData.map((item: any) => Number(item.totalAmount) || 0)
    const countData = trendData.map((item: any) => Number(item.orderCount) || 0)

    const option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: [trendType.value === 'amount' ? '采购金额' : '订单数量']
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
          name: trendType.value === 'amount' ? '采购金额' : '订单数量',
          type: 'line',
          stack: 'Total',
          data: trendType.value === 'amount' ? amountData : countData,
          itemStyle: {
            color: '#409EFF'
          },
          areaStyle: {
            color: 'rgba(64, 158, 255, 0.1)'
          }
        }
      ]
    }
    trendChart.setOption(option)
  } catch (error) {
    console.error('更新趋势图失败:', error)
  }
}

const updateTypeChart = async () => {
  if (!typeChart) return

  try {
    const params = {
      startDate: dateRange.value?.[0] ? `${dateRange.value[0]}-01` : undefined,
      endDate: dateRange.value?.[1] ? `${dateRange.value[1]}-31` : undefined
    }
    
    const response = await purchaseApi.getTypeDistribution(params)
    const typeData = response.data?.typeDistribution || []
    
    const chartData = typeData.map((item: any) => ({
      value: Number(item.totalAmount) || 0,
      name: getCategoryText(item.orderType)
    }))

    const typeOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          name: '采购类型',
          type: 'pie',
          radius: '50%',
          data: chartData,
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
    typeChart.setOption(typeOption)
  } catch (error) {
    console.error('更新类型分布图失败:', error)
  }
}

const updateSupplierChart = async () => {
  if (!supplierChart) return

  try {
    const params = {
      startDate: dateRange.value?.[0] ? `${dateRange.value[0]}-01` : undefined,
      endDate: dateRange.value?.[1] ? `${dateRange.value[1]}-31` : undefined,
      limit: 10
    }
    
    const response = await purchaseApi.getSupplierRanking(params)
    const supplierData = response.data?.supplierRanking || []
    
    const supplierNames = supplierData.map((item: any) => item.supplierName || '').reverse()
    const supplierAmounts = supplierData.map((item: any) => Number(item.totalAmount) || 0).reverse()

    const supplierOption = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: '{b}: ¥{c}'
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
        data: supplierNames
      },
      series: [
        {
          name: '采购金额',
          type: 'bar',
          data: supplierAmounts,
          itemStyle: {
            color: '#409EFF'
          }
        }
      ]
    }
    supplierChart.setOption(supplierOption)
  } catch (error) {
    console.error('更新供应商排行图失败:', error)
  }
}

const updateStatusChart = async () => {
  if (!statusChart) return

  try {
    const params = {
      startDate: dateRange.value?.[0] ? `${dateRange.value[0]}-01` : undefined,
      endDate: dateRange.value?.[1] ? `${dateRange.value[1]}-31` : undefined
    }
    
    const response = await purchaseApi.getStatusDistribution(params)
    const statusData = response.data?.statusDistribution || []
    
    const statusMap = {
      pending: '待审批',
      approved: '已审批',
      delivered: '已交付',
      completed: '已完成',
      cancelled: '已取消'
    }
    
    const chartData = statusData.map((item: any) => ({
      value: Number(item.count) || 0,
      name: statusMap[item.status] || item.status
    }))

    const statusOption = {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      series: [
        {
          name: '订单状态',
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
          data: chartData
        }
      ]
    }
    statusChart.setOption(statusOption)
  } catch (error) {
    console.error('更新状态分布图失败:', error)
  }
}

const handleDateChange = async () => {
  await fetchStatistics()
  await fetchDetailData()
  await updateAllCharts()
}

const updateAllCharts = async () => {
  await Promise.all([
    updateTrendChart(),
    updateTypeChart(),
    updateSupplierChart(),
    updateStatusChart()
  ])
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

const getDeliveryRateColor = (rate: number) => {
  if (rate >= 90) return 'success'
  if (rate >= 80) return 'warning'
  return 'danger'
}

const getCategoryColor = (category: string): "success" | "primary" | "warning" | "info" | "danger" => {
  const colorMap: Record<string, "success" | "primary" | "warning" | "info" | "danger"> = {
    cattle: 'success',
    material: 'primary',
    equipment: 'warning'
  }
  return colorMap[category] || 'info'
}

const getCategoryText = (category: string) => {
  const textMap: Record<string, string> = {
    cattle: '牛只采购',
    material: '物资采购',
    equipment: '设备采购'
  }
  return textMap[category] || category
}

const formatDate = (dateString: string) => {
  return dateString ? new Date(dateString).toLocaleDateString('zh-CN') : '-'
}

// 生命周期
onMounted(() => {
  fetchStatistics()
  fetchDetailData()
  initCharts()
})

// 窗口大小变化时重新调整图表
window.addEventListener('resize', () => {
  trendChart?.resize()
  typeChart?.resize()
  supplierChart?.resize()
  statusChart?.resize()
})
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

.stat-icon.purchase {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.amount {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.supplier {
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