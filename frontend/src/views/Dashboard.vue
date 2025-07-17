<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">数据总览</h1>
      <p class="page-description">查看关键业务指标和系统状态</p>
    </div>

    <div class="page-content">
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ stats?.cattleTotal || 0 }}</div>
            <div class="stat-label">牛只总数</div>
          </div>
          <el-icon class="stat-icon"><Cow /></el-icon>
        </el-card>

        <el-card class="stat-card healthy">
          <div class="stat-content">
            <div class="stat-number">{{ stats?.healthyCount || 0 }}</div>
            <div class="stat-label">健康牛只</div>
          </div>
          <el-icon class="stat-icon"><Check /></el-icon>
        </el-card>

        <el-card class="stat-card sick">
          <div class="stat-content">
            <div class="stat-number">{{ stats?.sickCount || 0 }}</div>
            <div class="stat-label">患病牛只</div>
          </div>
          <el-icon class="stat-icon"><Warning /></el-icon>
        </el-card>

        <el-card class="stat-card treatment">
          <div class="stat-content">
            <div class="stat-number">{{ stats?.treatmentCount || 0 }}</div>
            <div class="stat-label">治疗中</div>
          </div>
          <el-icon class="stat-icon"><Medicine /></el-icon>
        </el-card>
      </div>

      <!-- 待处理事项 -->
      <el-card v-if="todos.length > 0" class="todos-card">
        <template #header>
          <div class="card-header">
            <span>待处理事项</span>
            <el-badge :value="todos.length" class="item" />
          </div>
        </template>
        
        <div class="todos-list">
          <div 
            v-for="todo in todos" 
            :key="todo.id"
            class="todo-item"
            :class="todo.level"
          >
            <div class="todo-content">
              <div class="todo-title">{{ todo.message }}</div>
              <div class="todo-time">{{ formatTime(todo.createdAt) }}</div>
            </div>
            <el-tag :type="getTagType(todo.level)">{{ todo.level }}</el-tag>
          </div>
        </div>
      </el-card>

      <!-- 快捷操作 -->
      <el-card class="quick-actions-card">
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
            @click="showComingSoon"
          >
            <el-icon><DataAnalysis /></el-icon>
            数据分析
          </el-button>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useDashboardStore, useAppStore } from '@/stores'
import dayjs from 'dayjs'

const dashboardStore = useDashboardStore()
const appStore = useAppStore()

const stats = ref<any>(null)
const todos = ref<any[]>([])

onMounted(() => {
  loadDashboardData()
})

const loadDashboardData = async () => {
  try {
    appStore.setLoading(true)
    
    // 获取统计数据
    const statsData = await dashboardStore.fetchStats({
      baseId: appStore.currentBaseId
    })
    stats.value = statsData
    
    // 获取待处理事项
    const todosData = await dashboardStore.fetchTodos({
      baseId: appStore.currentBaseId
    })
    todos.value = todosData
    
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    appStore.setLoading(false)
  }
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const getTagType = (level: string) => {
  switch (level) {
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'info'
    default:
      return 'info'
  }
}

const showComingSoon = () => {
  ElMessage.info('功能开发中，敬请期待')
}
</script>

<style lang="scss" scoped>
.dashboard {
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
    margin-bottom: 24px;
  }

  .stat-card {
    position: relative;
    overflow: hidden;
    
    :deep(.el-card__body) {
      padding: 24px;
    }
    
    .stat-content {
      .stat-number {
        font-size: 36px;
        font-weight: 600;
        color: var(--el-color-primary);
        margin-bottom: 8px;
      }
      
      .stat-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
      }
    }
    
    .stat-icon {
      position: absolute;
      top: 24px;
      right: 24px;
      font-size: 32px;
      opacity: 0.3;
    }
    
    &.healthy {
      .stat-number {
        color: var(--el-color-success);
      }
    }
    
    &.sick {
      .stat-number {
        color: var(--el-color-danger);
      }
    }
    
    &.treatment {
      .stat-number {
        color: var(--el-color-warning);
      }
    }
  }

  .todos-card {
    margin-bottom: 24px;
    
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .todos-list {
      .todo-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 0;
        border-bottom: 1px solid var(--el-border-color-lighter);
        
        &:last-child {
          border-bottom: none;
        }
        
        .todo-content {
          flex: 1;
          
          .todo-title {
            font-size: 14px;
            margin-bottom: 4px;
          }
          
          .todo-time {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }

  .quick-actions-card {
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      
      .el-button {
        height: 60px;
        
        .el-icon {
          margin-right: 8px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .dashboard {
    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .actions-grid {
      grid-template-columns: 1fr 1fr;
    }
  }
}
</style>