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
    // 模拟数据
    Object.assign(statistics, {
      totalOrders: 156,
      totalAmount: 2580000,
      activeSuppliers: 23,
      avgOrderAmount: 16538
    })
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  }
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
          cattleOrders: 8,
          materialOrders: 12,
          equipmentOrders: 5,
          completionRate: 92
        },
        {
          month: '2024-02',
          orderCount: 18,
          totalAmount: 310000,
          avgAmount: 17222,
          cattleOrders: 6,
          materialOrders: 8,
          equipmentOrders: 4,
          completionRate: 89
        },
        {
          month: '2024-03',
          orderCount: 32,
          totalAmount: 580000,
          avgAmount: 18125,
          cattleOrders: 12,
          materialOrders: 15,
          equipmentOrders: 5,
          completionRate: 94
        }
      ]
    } else if (activeTab.value === 'supplier') {
      // 模拟供应商数据
      supplierData.value = [
        {
          supplierName: '优质牧业有限公司',
          orderCount: 15,
          totalAmount: 450000,
          avgAmount: 30000,
          rating: 5,
          onTimeRate: 95,
          lastOrderDate: '2024-03-15'
        },
        {
          supplierName: '绿源饲料供应商',
          orderCount: 28,
          totalAmount: 380000,
          avgAmount: 13571,
          rating: 4,
          onTimeRate: 88,
          lastOrderDate: '2024-03-20'
        }
      ]
    } else if (activeTab.value === 'category') {
      // 模拟类别数据
      categoryData.value = [
        {
          category: 'cattle',
          orderCount: 45,
          totalAmount: 1200000,
          percentage: 46.5,
          avgAmount: 26667,
          growthRate: 12.5
        },
        {
          category: 'material',
          orderCount: 78,
          totalAmount: 980000,
          percentage: 38.0,
          avgAmount: 12564,
          growthRate: 8.3
        },
        {
          category: 'equipment',
          orderCount: 33,
          totalAmount: 400000,
          percentage: 15.5,
          avgAmount: 12121,
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

  // 初始化类型分布图
  if (typeChartRef.value) {
    typeChart = echarts.init(typeChartRef.value)
    const typeOption = {
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
          name: '采购类型',
          type: 'pie',
          radius: '50%',
          data: [
            { value: 1200000, name: '牛只采购' },
            { value: 980000, name: '物资采购' },
            { value: 400000, name: '设备采购' }
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
    typeChart.setOption(typeOption)
  }

  // 初始化供应商排行图
  if (supplierChartRef.value) {
    supplierChart = echarts.init(supplierChartRef.value)
    const supplierOption = {
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
        data: ['优质牧业', '绿源饲料', '现代设备', '金牛供应', '优选物资']
      },
      series: [
        {
          name: '采购金额',
          type: 'bar',
          data: [450000, 380000, 320000, 280000, 250000],
          itemStyle: {
            color: '#409EFF'
          }
        }
      ]
    }
    supplierChart.setOption(supplierOption)
  }

  // 初始化状态分布图
  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value)
    const statusOption = {
      tooltip: {
        trigger: 'item'
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
          data: [
            { value: 45, name: '已完成' },
            { value: 32, name: '已审批' },
            { value: 28, name: '已交付' },
            { value: 15, name: '待审批' },
            { value: 8, name: '已取消' }
          ]
        }
      ]
    }
    statusChart.setOption(statusOption)
  }
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

const getDeliveryRateColor = (rate: number) => {
  if (rate >= 90) return 'success'
  if (rate >= 80) return 'warning'
  return 'danger'
}

const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    cattle: 'success',
    material: 'primary',
    equipment: 'warning'
  }
  return colorMap[category] || ''
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