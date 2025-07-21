<template>
  <div class="equipment-dashboard">
    <div class="page-header">
      <h2>设备监控仪表盘</h2>
      <div class="header-actions">
        <el-select v-model="selectedBase" placeholder="选择基地" @change="loadData">
          <el-option label="全部基地" value="" />
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
          <div class="stat-card">
            <div class="stat-icon total">
              <el-icon><Setting /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.total || 0 }}</div>
              <div class="stat-label">设备总数</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon normal">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.statusDistribution?.normal || 0 }}</div>
              <div class="stat-label">正常运行</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon maintenance">
              <el-icon><Tools /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.statusDistribution?.maintenance || 0 }}</div>
              <div class="stat-label">维护中</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon broken">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-number">{{ statistics.statusDistribution?.broken || 0 }}</div>
              <div class="stat-label">故障设备</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- 设备状态分布 -->
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-header">
              <h4>设备状态分布</h4>
            </div>
            <div class="chart-content">
              <div ref="statusChartRef" class="chart"></div>
            </div>
          </div>
        </el-col>

        <!-- 设备分类分布 -->
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-header">
              <h4>设备分类分布</h4>
            </div>
            <div class="chart-content">
              <div ref="categoryChartRef" class="chart"></div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 设备列表和维护提醒 -->
    <div class="content-section">
      <el-row :gutter="20">
        <!-- 故障设备列表 -->
        <el-col :span="12">
          <div class="content-card">
            <div class="card-header">
              <h4>故障设备</h4>
              <el-button size="small" @click="$router.push('/equipment/failures')">查看全部</el-button>
            </div>
            <div class="card-content">
              <el-table :data="brokenEquipment" max-height="300">
                <el-table-column prop="name" label="设备名称" />
                <el-table-column prop="base.name" label="所属基地" width="120" />
                <el-table-column prop="failure_date" label="故障时间" width="120">
                  <template #default="{ row }">
                    {{ formatDate(row.failure_date) }}
                  </template>
                </el-table-column>
                <el-table-column prop="severity" label="严重程度" width="100">
                  <template #default="{ row }">
                    <el-tag :type="getSeverityType(row.severity)">
                      {{ getSeverityText(row.severity) }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-col>

        <!-- 维护提醒 -->
        <el-col :span="12">
          <div class="content-card">
            <div class="card-header">
              <h4>维护提醒</h4>
              <el-button size="small" @click="$router.push('/equipment/maintenance')">查看全部</el-button>
            </div>
            <div class="card-content">
              <el-table :data="maintenanceAlerts" max-height="300">
                <el-table-column prop="equipment.name" label="设备名称" />
                <el-table-column prop="maintenance_type" label="维护类型" width="120" />
                <el-table-column prop="next_date" label="计划日期" width="120">
                  <template #default="{ row }">
                    {{ formatDate(row.next_date) }}
                  </template>
                </el-table-column>
                <el-table-column prop="overdue_days" label="逾期天数" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.overdue_days > 0 ? 'danger' : 'success'">
                      {{ row.overdue_days > 0 ? `+${row.overdue_days}` : row.overdue_days }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Setting, CircleCheck, Tools, Warning } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { equipmentApi } from '@/api/equipment'
import { baseApi } from '@/api/base'

// 响应式数据
const loading = ref(false)
const selectedBase = ref('')
const bases = ref([])
const statistics = reactive({
  total: 0,
  statusDistribution: {
    normal: 0,
    maintenance: 0,
    broken: 0,
    retired: 0
  },
  categoryDistribution: [] as Array<{ category: string; count: number }>,
})
const brokenEquipment = ref([])
const maintenanceAlerts = ref([])

// 图表引用
const statusChartRef = ref()
const categoryChartRef = ref()
let statusChart: echarts.ECharts | null = null
let categoryChart: echarts.ECharts | null = null

// 加载基地列表
const loadBases = async () => {
  try {
    const response = await baseApi.getBases()
    bases.value = response.data || []
  } catch (error) {
    console.error('加载基地列表失败:', error)
  }
}

// 加载统计数据
const loadStatistics = async () => {
  try {
    const params = selectedBase.value ? { baseId: selectedBase.value } : {}
    const response = await equipmentApi.getEquipmentStatistics(params)
    Object.assign(statistics, response.data)
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载故障设备
const loadBrokenEquipment = async () => {
  try {
    const params = {
      status: 'broken',
      limit: 10,
      ...(selectedBase.value ? { baseId: selectedBase.value } : {}),
    }
    const response = await equipmentApi.getEquipment(params)
    brokenEquipment.value = response.data.data || []
  } catch (error) {
    console.error('加载故障设备失败:', error)
  }
}

// 加载维护提醒
const loadMaintenanceAlerts = async () => {
  try {
    // 这里应该调用获取维护提醒的API
    // 暂时使用模拟数据
    maintenanceAlerts.value = [
      {
        equipment: { name: '自动饲喂机A1' },
        maintenance_type: '日常保养',
        next_date: '2024-01-20',
        overdue_days: 2,
      },
      {
        equipment: { name: '清洁设备B1' },
        maintenance_type: '月度检修',
        next_date: '2024-01-18',
        overdue_days: -3,
      },
    ]
  } catch (error) {
    console.error('加载维护提醒失败:', error)
  }
}

// 初始化状态分布图表
const initStatusChart = () => {
  if (!statusChartRef.value) return
  
  statusChart = echarts.init(statusChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: '设备状态',
        type: 'pie',
        radius: '50%',
        data: [
          { value: statistics.statusDistribution.normal || 0, name: '正常', itemStyle: { color: '#67C23A' } },
          { value: statistics.statusDistribution.maintenance || 0, name: '维护中', itemStyle: { color: '#E6A23C' } },
          { value: statistics.statusDistribution.broken || 0, name: '故障', itemStyle: { color: '#F56C6C' } },
          { value: statistics.statusDistribution.retired || 0, name: '已退役', itemStyle: { color: '#909399' } },
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
  
  statusChart.setOption(option)
}

// 初始化分类分布图表
const initCategoryChart = () => {
  if (!categoryChartRef.value) return
  
  categoryChart = echarts.init(categoryChartRef.value)
  
  const option = {
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
      type: 'category',
      data: statistics.categoryDistribution.map(item => item.category),
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '设备数量',
        type: 'bar',
        barWidth: '60%',
        data: statistics.categoryDistribution.map(item => item.count),
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  }
  
  categoryChart.setOption(option)
}

// 更新图表
const updateCharts = () => {
  nextTick(() => {
    if (statusChart) {
      const option = statusChart.getOption()
      option.series[0].data = [
        { value: statistics.statusDistribution.normal || 0, name: '正常', itemStyle: { color: '#67C23A' } },
        { value: statistics.statusDistribution.maintenance || 0, name: '维护中', itemStyle: { color: '#E6A23C' } },
        { value: statistics.statusDistribution.broken || 0, name: '故障', itemStyle: { color: '#F56C6C' } },
        { value: statistics.statusDistribution.retired || 0, name: '已退役', itemStyle: { color: '#909399' } },
      ]
      statusChart.setOption(option)
    }
    
    if (categoryChart) {
      const option = categoryChart.getOption()
      option.xAxis[0].data = statistics.categoryDistribution.map(item => item.category)
      option.series[0].data = statistics.categoryDistribution.map(item => item.count)
      categoryChart.setOption(option)
    }
  })
}

// 加载所有数据
const loadData = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadStatistics(),
      loadBrokenEquipment(),
      loadMaintenanceAlerts(),
    ])
    updateCharts()
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取严重程度类型
const getSeverityType = (severity: string) => {
  const severityMap: Record<string, 'success' | 'primary' | 'warning' | 'info' | 'danger'> = {
    low: 'success',
    medium: 'warning',
    high: 'danger',
    critical: 'danger',
  }
  return severityMap[severity] || 'info'
}

// 获取严重程度文本
const getSeverityText = (severity: string) => {
  const severityMap: Record<string, string> = {
    low: '轻微',
    medium: '中等',
    high: '严重',
    critical: '紧急',
  }
  return severityMap[severity] || severity
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

// 初始化
onMounted(async () => {
  await loadBases()
  await loadData()
  
  nextTick(() => {
    initStatusChart()
    initCategoryChart()
  })
  
  // 监听窗口大小变化
  window.addEventListener('resize', () => {
    statusChart?.resize()
    categoryChart?.resize()
  })
})
</script>

<style scoped>
.equipment-dashboard {
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

.stats-cards {
  margin-bottom: 20px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: #fff;
}

.stat-icon.total {
  background: #409EFF;
}

.stat-icon.normal {
  background: #67C23A;
}

.stat-icon.maintenance {
  background: #E6A23C;
}

.stat-icon.broken {
  background: #F56C6C;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.charts-section {
  margin-bottom: 20px;
}

.chart-card,
.content-card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-header,
.card-header {
  padding: 20px 20px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h4,
.card-header h4 {
  margin: 0;
  color: #303133;
}

.chart-content {
  padding: 20px;
}

.chart {
  width: 100%;
  height: 300px;
}

.card-content {
  padding: 20px;
}

.content-section {
  margin-bottom: 20px;
}
</style>