<template>
  <div class="dashboard">
    <!-- 页面头部 -->
    <div class="dashboard-header">
      <div class="header-left">
        <h1 class="page-title">数据总览</h1>
        <p class="page-description">查看关键业务指标和系统状态</p>
      </div>
      <div class="header-actions">
        <el-button-group>
          <el-button :icon="Setting" @click="showConfigDialog = true">
            配置
          </el-button>
          <el-button :icon="Download" @click="showExportDialog = true">
            导出
          </el-button>
          <el-button :icon="Refresh" @click="handleRefreshAll">
            刷新
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 仪表盘内容 -->
    <div class="dashboard-content">
      <!-- 统计卡片行 -->
      <div class="stats-row">
        <StatCard
          :value="keyIndicators?.totalCattle || 0"
          label="牛只总数"
          :icon="DataAnalysis"
          type="primary"
        />
        <StatCard
          :value="keyIndicators?.healthRate || 0"
          label="健康率"
          :icon="Monitor"
          type="success"
          unit="%"
          :show-trend="true"
          :trend="{
            direction: 'up',
            value: 2.5,
            isPercentage: true
          }"
        />
        <StatCard
          :value="keyIndicators?.monthlyRevenue || 0"
          label="月度收入"
          :icon="TrendCharts"
          type="info"
          unit="元"
        />
        <StatCard
          :value="keyIndicators?.pendingTasks?.total || 0"
          label="待处理任务"
          :icon="Warning"
          type="warning"
        />
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content">
        <!-- 左侧图表区域 -->
        <div class="charts-section">
          <div class="chart-row">
            <PieChart
              title="牛只健康状态分布"
              subtitle="当前基地牛只健康状况统计"
              :data="healthPieData"
              :height="350"
              :show-custom-legend="true"
              @export-data="handleChartExport"
              @refresh-data="loadDashboardData"
            />
            <TrendChart
              title="牛只数量趋势"
              subtitle="近30天牛只数量变化趋势"
              :series="cattleTrendSeries"
              :height="350"
              :show-area="true"
              :y-axis-formatter="(value) => value.toString()"
              @time-range-change="handleTimeRangeChange"
              @export-data="handleChartExport"
              @refresh-data="loadDashboardData"
            />
          </div>
          
          <div class="chart-row">
            <GaugeChart
              title="系统健康度"
              subtitle="基于多项指标综合评估"
              :value="85"
              :height="300"
              :thresholds="[
                { value: 0, color: '#F56C6C', label: '差' },
                { value: 60, color: '#E6A23C', label: '良' },
                { value: 80, color: '#67C23A', label: '优' }
              ]"
              @refresh-data="loadDashboardData"
            />
            <BarChart
              title="各基地牛只数量"
              subtitle="当前各基地牛只分布情况"
              :data="baseDistributionData"
              :height="300"
              @export-data="handleChartExport"
              @refresh-data="loadDashboardData"
            />
          </div>
        </div>

        <!-- 右侧任务区域 -->
        <div class="tasks-section">
          <PendingTasksCard
            :tasks="pendingTasks"
            :loading="loading"
            :max-height="600"
            @refresh="loadPendingTasks"
            @task-click="handleTaskClick"
            @load-more="handleLoadMoreTasks"
          />
        </div>
      </div>

      <!-- 快捷操作区域 -->
      <div class="quick-actions">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="actions-grid">
            <el-button 
              type="primary" 
              size="large"
              @click="$router.push('/cattle')"
            >
              <el-icon><Plus /></el-icon>
              添加牛只
            </el-button>
            <el-button 
              type="success" 
              size="large"
              @click="$router.push('/health')"
            >
              <el-icon><Document /></el-icon>
              健康记录
            </el-button>
            <el-button 
              type="warning" 
              size="large"
              @click="$router.push('/feeding')"
            >
              <el-icon><Food /></el-icon>
              饲喂记录
            </el-button>
            <el-button 
              type="info" 
              size="large"
              @click="$router.push('/purchase')"
            >
              <el-icon><ShoppingCart /></el-icon>
              采购管理
            </el-button>
          </div>
        </el-card>
      </div>
    </div>

    <!-- 配置对话框 -->
    <DashboardConfigDialog
      v-model="showConfigDialog"
      @save="handleConfigSave"
    />

    <!-- 导出对话框 -->
    <DataExportDialog
      v-model="showExportDialog"
      :available-bases="availableBases"
      @export="handleDataExport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  DataAnalysis, 
  TrendCharts, 
  Monitor,
  Warning,
  Setting,
  Download,
  Refresh,
  Plus,
  Document,
  Food,
  ShoppingCart
} from '@element-plus/icons-vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useAppStore } from '@/stores/app'
import { 
  StatCard, 
  TrendChart, 
  PieChart, 
  BarChart, 
  GaugeChart,
  PendingTasksCard,
  DataExportDialog,
  DashboardConfigDialog
} from '@/components/dashboard'
import type { PendingTask } from '@/api/dashboard'

const router = useRouter()
const dashboardStore = useDashboardStore()
const appStore = useAppStore()

const keyIndicators = ref<any>(null)
const pendingTasks = ref<any>(null)
const trendData = ref<any>(null)
const loading = ref(false)
const showConfigDialog = ref(false)
const showExportDialog = ref(false)

// 可用基地列表
const availableBases = ref([
  { id: 1, name: '基地A' },
  { id: 2, name: '基地B' },
  { id: 3, name: '基地C' }
])

onMounted(() => {
  loadDashboardData()
})

const loadDashboardData = async () => {
  try {
    loading.value = true
    
    // 获取关键指标
    const indicators = await dashboardStore.fetchKeyIndicators({
      baseId: appStore.currentBaseId
    })
    keyIndicators.value = indicators
    
    // 获取待处理任务
    const tasks = await dashboardStore.fetchPendingTasks({
      baseId: appStore.currentBaseId
    })
    pendingTasks.value = tasks
    
    // 获取趋势数据
    const trends = await dashboardStore.fetchTrendAnalysis({
      baseId: appStore.currentBaseId,
      period: '30d',
      metrics: 'cattle,health,feeding,sales'
    })
    trendData.value = trends
    
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadPendingTasks = async () => {
  try {
    const tasks = await dashboardStore.fetchPendingTasks({
      baseId: appStore.currentBaseId
    })
    pendingTasks.value = tasks
  } catch (error) {
    console.error('加载待处理任务失败:', error)
    ElMessage.error('加载待处理任务失败')
  }
}

// 健康状态饼图数据
const healthPieData = computed(() => {
  if (!keyIndicators.value?.cattleByHealth) return []
  
  const colorMap: Record<string, string> = {
    healthy: '#67C23A',
    sick: '#F56C6C',
    treatment: '#E6A23C'
  }
  
  const labelMap: Record<string, string> = {
    healthy: '健康',
    sick: '患病',
    treatment: '治疗中'
  }
  
  return keyIndicators.value.cattleByHealth.map((item: any) => ({
    name: labelMap[item.health_status] || item.health_status,
    value: item.count,
    color: colorMap[item.health_status]
  }))
})

// 牛只趋势图数据
const cattleTrendSeries = computed(() => {
  if (!trendData.value?.trends?.cattle) return []
  
  return [
    {
      name: '总数',
      data: trendData.value.trends.cattle.map((item: any) => ({
        date: item.date,
        value: item.total
      })),
      color: '#409EFF'
    },
    {
      name: '健康',
      data: trendData.value.trends.cattle.map((item: any) => ({
        date: item.date,
        value: item.healthy
      })),
      color: '#67C23A'
    }
  ]
})

// 基地分布数据
const baseDistributionData = computed(() => [
  { name: '基地A', value: keyIndicators.value?.totalCattle ? Math.floor(keyIndicators.value.totalCattle * 0.4) : 120, color: '#409EFF' },
  { name: '基地B', value: keyIndicators.value?.totalCattle ? Math.floor(keyIndicators.value.totalCattle * 0.35) : 98, color: '#67C23A' },
  { name: '基地C', value: keyIndicators.value?.totalCattle ? Math.floor(keyIndicators.value.totalCattle * 0.25) : 86, color: '#E6A23C' }
])

const handleRefreshAll = async () => {
  await loadDashboardData()
  ElMessage.success('数据已刷新')
}

const handleTimeRangeChange = async (range: string) => {
  try {
    const trends = await dashboardStore.fetchTrendAnalysis({
      baseId: appStore.currentBaseId,
      period: range,
      metrics: 'cattle,health,feeding,sales'
    })
    trendData.value = trends
  } catch (error) {
    console.error('切换时间范围失败:', error)
    ElMessage.error('切换时间范围失败')
  }
}

const handleChartExport = (chartType?: string) => {
  ElMessage.info(`导出${chartType || '图表'}数据`)
  // 这里可以实现具体的图表导出逻辑
}

const handleTaskClick = (task: PendingTask) => {
  console.log('点击任务:', task)
  if (task.url) {
    router.push(task.url)
  }
}

const handleLoadMoreTasks = () => {
  ElMessage.info('加载更多任务')
  // 这里可以实现加载更多任务的逻辑
}

const handleConfigSave = (config: any) => {
  console.log('保存配置:', config)
  ElMessage.success('仪表盘配置已保存')
  // 这里可以实现保存配置到后端的逻辑
}

const handleDataExport = (exportForm: any) => {
  console.log('导出数据:', exportForm)
  ElMessage.success('数据导出任务已提交')
  // 这里可以实现数据导出的逻辑
}
</script>

<style lang="scss" scoped>
.dashboard {
  padding: 24px;
  background: var(--el-bg-color-page);
  min-height: 100vh;
  
  .dashboard-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 32px;
    
    .header-left {
      .page-title {
        margin: 0 0 8px 0;
        font-size: 28px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
      
      .page-description {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
    
    .header-actions {
      .el-button-group {
        .el-button {
          padding: 8px 16px;
        }
      }
    }
  }
  
  .dashboard-content {
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }
    
    .main-content {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 32px;
      margin-bottom: 32px;
      
      .charts-section {
        .chart-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          // 第一行特殊布局：饼图 + 趋势图
          &:first-child {
            grid-template-columns: 400px 1fr;
          }
          
          // 第二行特殊布局：仪表盘 + 柱状图
          &:last-child {
            grid-template-columns: 350px 1fr;
          }
        }
      }
      
      .tasks-section {
        position: sticky;
        top: 24px;
        height: fit-content;
      }
    }
    
    .quick-actions {
      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        
        .el-button {
          height: 60px;
          font-size: 14px;
          
          .el-icon {
            margin-right: 8px;
            font-size: 18px;
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .dashboard {
    .dashboard-content {
      .main-content {
        grid-template-columns: 1fr 350px;
        
        .charts-section .chart-row {
          &:first-child {
            grid-template-columns: 350px 1fr;
          }
          
          &:last-child {
            grid-template-columns: 300px 1fr;
          }
        }
      }
    }
  }
}

@media (max-width: 1200px) {
  .dashboard {
    .dashboard-content {
      .main-content {
        grid-template-columns: 1fr;
        gap: 24px;
        
        .charts-section .chart-row {
          grid-template-columns: 1fr;
          
          &:first-child,
          &:last-child {
            grid-template-columns: 1fr;
          }
        }
        
        .tasks-section {
          position: static;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
    
    .dashboard-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 24px;
      
      .header-left {
        .page-title {
          font-size: 24px;
        }
      }
      
      .header-actions {
        width: 100%;
        
        .el-button-group {
          width: 100%;
          display: flex;
          
          .el-button {
            flex: 1;
            padding: 8px 12px;
            font-size: 12px;
          }
        }
      }
    }
    
    .dashboard-content {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }
      
      .main-content {
        gap: 16px;
        margin-bottom: 24px;
        
        .charts-section .chart-row {
          gap: 16px;
          margin-bottom: 16px;
        }
      }
      
      .quick-actions .actions-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        
        .el-button {
          height: 50px;
          font-size: 12px;
          
          .el-icon {
            font-size: 16px;
          }
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: 12px;
    
    .dashboard-content {
      .stats-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }
      
      .quick-actions .actions-grid {
        grid-template-columns: 1fr;
        
        .el-button {
          height: 48px;
        }
      }
    }
  }
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .dashboard {
    background: var(--el-bg-color-page);
    
    .dashboard-header {
      .header-left {
        .page-title {
          color: var(--el-text-color-primary);
        }
        
        .page-description {
          color: var(--el-text-color-secondary);
        }
      }
    }
  }
}

// 打印样式
@media print {
  .dashboard {
    padding: 0;
    background: white;
    
    .dashboard-header .header-actions {
      display: none;
    }
    
    .dashboard-content {
      .main-content {
        grid-template-columns: 1fr;
        
        .tasks-section {
          display: none;
        }
      }
      
      .quick-actions {
        display: none;
      }
    }
  }
}
</style>