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
              <div class="stat-value">{{ keyIndicators?.totalCattle || 0 }}</div>
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
              <div class="stat-value">{{ keyIndicators?.healthRate || 0 }}%</div>
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
              <div class="stat-value">{{ keyIndicators?.monthlyRevenue || 0 }}</div>
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
              <div class="stat-value">{{ keyIndicators?.pendingTasks || 0 }}</div>
              <div class="stat-label">待处理任务</div>
            </div>
          </div>
        </el-card>
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
  ShoppingCart
} from '@element-plus/icons-vue'

const router = useRouter()

const keyIndicators = ref<any>({
  totalCattle: 0,
  healthRate: 0,
  monthlyRevenue: 0,
  pendingTasks: 0
})
const loading = ref(false)

onMounted(() => {
  loadDashboardData()
})

const loadDashboardData = async () => {
  try {
    loading.value = true
    
    // 模拟数据加载
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    keyIndicators.value = {
      totalCattle: 1250,
      healthRate: 95.8,
      monthlyRevenue: 125000,
      pendingTasks: 8
    }
    
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const handleRefreshAll = async () => {
  await loadDashboardData()
  ElMessage.success('数据已刷新')
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