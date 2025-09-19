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
          <el-button :icon="Refresh" @click="handleRefreshAll">
            刷新
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 仪表盘内容 -->
    <div class="dashboard-content" v-loading="loading">
      <!-- 统计卡片行 -->
      <div class="stats-row">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon primary">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ safeGet(keyIndicators, 'totalCattle', 0) }}</div>
              <div class="stat-label">牛只总数</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon success">
              <el-icon><Monitor /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ safeGet(keyIndicators, 'healthRate', 0) }}%</div>
              <div class="stat-label">健康率</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon info">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ safeGet(keyIndicators, 'monthlyRevenue', 0) }}</div>
              <div class="stat-label">月度收入(元)</div>
            </div>
          </div>
        </el-card>
        
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon warning">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ safeGet(keyIndicators, 'pendingTasks', 0) }}</div>
              <div class="stat-label">待处理任务</div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content">
        <!-- 图表区域 -->
        <div class="charts-section">
          <div class="chart-row">
            <!-- 牛只分布饼图 -->
            <el-card class="chart-card">
              <template #header>
                <span>牛只分布</span>
              </template>
              <div class="chart-placeholder">
                <div class="placeholder-content">
                  <el-icon size="48"><PieChart /></el-icon>
                  <p>牛只分布统计图表</p>
                </div>
              </div>
            </el-card>
            
            <!-- 健康趋势图 -->
            <el-card class="chart-card">
              <template #header>
                <span>健康趋势</span>
              </template>
              <div class="chart-placeholder">
                <div class="placeholder-content">
                  <el-icon size="48"><TrendCharts /></el-icon>
                  <p>健康状况趋势图表</p>
                </div>
              </div>
            </el-card>
          </div>
          
          <div class="chart-row">
            <!-- 饲喂效率仪表盘 -->
            <el-card class="chart-card">
              <template #header>
                <span>饲喂效率</span>
              </template>
              <div class="chart-placeholder">
                <div class="placeholder-content">
                  <el-icon size="48"><Odometer /></el-icon>
                  <p>饲喂效率仪表盘</p>
                </div>
              </div>
            </el-card>
            
            <!-- 收入统计柱状图 -->
            <el-card class="chart-card">
              <template #header>
                <span>收入统计</span>
              </template>
              <div class="chart-placeholder">
                <div class="placeholder-content">
                  <el-icon size="48"><Histogram /></el-icon>
                  <p>月度收入统计图表</p>
                </div>
              </div>
            </el-card>
          </div>
        </div>
        
        <!-- 任务和通知区域 -->
        <div class="tasks-section">
          <el-card class="tasks-card">
            <template #header>
              <div class="card-header">
                <span>待处理任务</span>
                <el-badge :value="pendingTasks.length" class="task-badge" />
              </div>
            </template>
            <div class="tasks-list">
              <div 
                v-for="task in pendingTasks" 
                :key="task.id"
                class="task-item"
                :class="task.priority"
              >
                <div class="task-icon">
                  <el-icon><component :is="task.icon" /></el-icon>
                </div>
                <div class="task-content">
                  <div class="task-title">{{ task.title }}</div>
                  <div class="task-time">{{ task.time }}</div>
                </div>
                <div class="task-action">
                  <el-button size="small" link @click="handleTask(task)">
                    处理
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
          
          <!-- 系统通知 -->
          <el-card class="notifications-card">
            <template #header>
              <div class="card-header">
                <span>系统通知</span>
                <el-badge :value="notifications.length" class="notification-badge" />
              </div>
            </template>
            <div class="notifications-list">
              <div 
                v-for="notification in notifications" 
                :key="notification.id"
                class="notification-item"
                :class="notification.type"
              >
                <div class="notification-icon">
                  <el-icon><component :is="notification.icon" /></el-icon>
                </div>
                <div class="notification-content">
                  <div class="notification-title">{{ notification.title }}</div>
                  <div class="notification-time">{{ notification.time }}</div>
                </div>
              </div>
            </div>
          </el-card>
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
              @click="$router.push('/admin/cattle/list')"
            >
              <el-icon><Plus /></el-icon>
              牛场管理
            </el-button>
            <el-button 
              type="success" 
              size="large"
              @click="$router.push('/admin/health/dashboard')"
            >
              <el-icon><Document /></el-icon>
              健康管理
            </el-button>
            <el-button 
              type="warning" 
              size="large"
              @click="$router.push('/admin/feeding/dashboard')"
            >
              <el-icon><Food /></el-icon>
              饲喂管理
            </el-button>
            <el-button 
              type="info" 
              size="large"
              @click="$router.push('/admin/purchase/orders')"
            >
              <el-icon><ShoppingCart /></el-icon>
              采购管理
            </el-button>
            <el-button 
              type="default" 
              size="large"
              @click="$router.push('/admin/sales/orders')"
            >
              <el-icon><Sell /></el-icon>
              销售管理
            </el-button>
            <el-button 
              type="default" 
              size="large"
              @click="$router.push('/admin/materials/dashboard')"
            >
              <el-icon><Box /></el-icon>
              物资管理
            </el-button>
            <el-button 
              type="default" 
              size="large"
              @click="$router.push('/admin/news/list')"
            >
              <el-icon><Document /></el-icon>
              新闻管理
            </el-button>
            <el-button 
              type="default" 
              size="large"
              @click="$router.push('/admin/system/users')"
            >
              <el-icon><Setting /></el-icon>
              系统管理
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DataAnalysis,
  TrendCharts,
  Monitor,
  Warning,
  Refresh,
  Plus,
  Document,
  Food,
  ShoppingCart,
  PieChart,
  Odometer,
  Histogram,
  Sell,
  Box,
  Setting,
  Bell,
  Clock,
  User,
  Tools
} from '@element-plus/icons-vue'
import { safeGet } from '@/utils/safeAccess'
import { validateStatisticsData, ensureArray, ensureNumber } from '@/utils/dataValidation'
import { dashboardApi } from '@/api/dashboard'
import { salesServiceApi } from '@/api/microservices'

const router = useRouter()

const keyIndicators = ref<any>({
  totalCattle: 0,
  healthRate: 0,
  monthlyRevenue: 0,
  pendingTasks: 0
})
const loading = ref(false)

// 待处理任务数据
const pendingTasks = ref([
  {
    id: 1,
    title: '牛只健康检查',
    time: '2小时前',
    priority: 'high',
    icon: 'Monitor',
    type: 'health'
  },
  {
    id: 2,
    title: '饲料配方审核',
    time: '4小时前',
    priority: 'medium',
    icon: 'Food',
    type: 'feeding'
  },
  {
    id: 3,
    title: '采购订单确认',
    time: '6小时前',
    priority: 'high',
    icon: 'ShoppingCart',
    type: 'purchase'
  },
  {
    id: 4,
    title: '设备维护提醒',
    time: '1天前',
    priority: 'low',
    icon: 'Tools',
    type: 'equipment'
  }
])

// 系统通知数据
const notifications = ref([
  {
    id: 1,
    title: '系统更新完成',
    time: '1小时前',
    type: 'success',
    icon: 'Bell'
  },
  {
    id: 2,
    title: '数据备份提醒',
    time: '3小时前',
    type: 'warning',
    icon: 'Clock'
  },
  {
    id: 3,
    title: '新用户注册',
    time: '5小时前',
    type: 'info',
    icon: 'User'
  }
])

onMounted(() => {
  loadDashboardData()
})

const loadDashboardData = async () => {
  try {
    loading.value = true
    
    // 获取关键业务指标
    const keyIndicatorsResult = await dashboardApi.getKeyIndicators()
    
    // 获取销售统计数据（月度收入）
    let monthlyRevenue = 0
    try {
      const salesStats = await salesServiceApi.getSalesStatistics()
      // 假设响应中有monthlyRevenue字段
      monthlyRevenue = salesStats.data.monthlyRevenue || salesStats.data.totalRevenue || 0
    } catch (salesError) {
      console.warn('获取销售统计数据失败:', salesError)
    }
    
    // 获取待处理任务
    const pendingTasksResult = await dashboardApi.getPendingTasks()
    
    // 更新关键指标数据
    keyIndicators.value = {
      totalCattle: keyIndicatorsResult.data.totalCattle || 0,
      healthRate: keyIndicatorsResult.data.healthRate || 0,
      monthlyRevenue: monthlyRevenue,
      pendingTasks: keyIndicatorsResult.data.pendingTasks?.total || pendingTasksResult.data.total || 0
    }
    
    // 更新待处理任务数据
    if (pendingTasksResult.data.tasks && pendingTasksResult.data.tasks.length > 0) {
      pendingTasks.value = pendingTasksResult.data.tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        time: formatTime(task.createdAt || new Date().toISOString()),
        priority: task.priority || 'medium',
        icon: task.type === 'health' ? 'Monitor' : 
              task.type === 'feeding' ? 'Food' : 
              task.type === 'purchase' ? 'ShoppingCart' : 
              task.type === 'equipment' ? 'Tools' : 'Warning',
        type: task.type || 'general'
      }))
    }
    
    // 获取系统通知
    try {
      const notificationsResult = await dashboardApi.getPendingTasks({ limit: 5 })
      if (notificationsResult.data.tasks && notificationsResult.data.tasks.length > 0) {
        notifications.value = notificationsResult.data.tasks.slice(0, 3).map((task: any) => ({
          id: task.id,
          title: task.title,
          time: formatTime(task.createdAt || new Date().toISOString()),
          type: task.priority === 'high' ? 'warning' : 
                task.priority === 'medium' ? 'info' : 'success',
          icon: 'Bell'
        }))
      }
    } catch (notificationError) {
      console.warn('获取系统通知失败:', notificationError)
    }
    
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 格式化时间显示
const formatTime = (timestamp: string) => {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 60) {
    return `${diffMins}分钟前`
  } else if (diffHours < 24) {
    return `${diffHours}小时前`
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

const handleRefreshAll = async () => {
  await loadDashboardData()
  ElMessage.success('数据已刷新')
}

// 处理任务
const handleTask = (task: any) => {
  switch (task.type) {
    case 'health':
      router.push('/admin/health/dashboard')
      break
    case 'feeding':
      router.push('/admin/feeding/formulas')
      break
    case 'purchase':
      router.push('/admin/purchase/orders')
      break
    case 'equipment':
      router.push('/admin/system/barns')
      break
    default:
      ElMessage.info('功能开发中...')
  }
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
            font-size: 24px;
            
            &.primary {
              background-color: var(--el-color-primary-light-9);
              color: var(--el-color-primary);
            }
            
            &.success {
              background-color: var(--el-color-success-light-9);
              color: var(--el-color-success);
            }
            
            &.info {
              background-color: var(--el-color-info-light-9);
              color: var(--el-color-info);
            }
            
            &.warning {
              background-color: var(--el-color-warning-light-9);
              color: var(--el-color-warning);
            }
          }
          
          .stat-info {
            flex: 1;
            
            .stat-value {
              font-size: 24px;
              font-weight: 600;
              color: var(--el-text-color-primary);
              margin-bottom: 4px;
            }
            
            .stat-label {
              font-size: 14px;
              color: var(--el-text-color-secondary);
            }
          }
        }
      }
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
          
          .chart-card {
            .chart-placeholder {
              height: 200px;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: var(--el-fill-color-lighter);
              border-radius: 8px;
              
              .placeholder-content {
                text-align: center;
                color: var(--el-text-color-secondary);
                
                .el-icon {
                  margin-bottom: 12px;
                  color: var(--el-color-info);
                }
                
                p {
                  margin: 0;
                  font-size: 14px;
                }
              }
            }
          }
        }
      }
      
      .tasks-section {
        position: sticky;
        top: 24px;
        height: fit-content;
        display: flex;
        flex-direction: column;
        gap: 24px;
        
        .tasks-card,
        .notifications-card {
          .card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            
            .task-badge,
            .notification-badge {
              .el-badge__content {
                font-size: 12px;
              }
            }
          }
          
          .tasks-list,
          .notifications-list {
            max-height: 300px;
            overflow-y: auto;
            
            .task-item,
            .notification-item {
              display: flex;
              align-items: center;
              gap: 12px;
              padding: 12px 0;
              border-bottom: 1px solid var(--el-border-color-lighter);
              
              &:last-child {
                border-bottom: none;
              }
              
              .task-icon,
              .notification-icon {
                width: 32px;
                height: 32px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
              }
              
              .task-content,
              .notification-content {
                flex: 1;
                
                .task-title,
                .notification-title {
                  font-size: 14px;
                  font-weight: 500;
                  color: var(--el-text-color-primary);
                  margin-bottom: 4px;
                }
                
                .task-time,
                .notification-time {
                  font-size: 12px;
                  color: var(--el-text-color-secondary);
                }
              }
              
              .task-action {
                .el-button {
                  font-size: 12px;
                }
              }
              
              // 任务优先级样式
              &.high {
                .task-icon {
                  background-color: var(--el-color-danger-light-9);
                  color: var(--el-color-danger);
                }
              }
              
              &.medium {
                .task-icon {
                  background-color: var(--el-color-warning-light-9);
                  color: var(--el-color-warning);
                }
              }
              
              &.low {
                .task-icon {
                  background-color: var(--el-color-info-light-9);
                  color: var(--el-color-info);
                }
              }
              
              // 通知类型样式
              &.success {
                .notification-icon {
                  background-color: var(--el-color-success-light-9);
                  color: var(--el-color-success);
                }
              }
              
              &.warning {
                .notification-icon {
                  background-color: var(--el-color-warning-light-9);
                  color: var(--el-color-warning);
                }
              }
              
              &.info {
                .notification-icon {
                  background-color: var(--el-color-info-light-9);
                  color: var(--el-color-info);
                }
              }
            }
          }
        }
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