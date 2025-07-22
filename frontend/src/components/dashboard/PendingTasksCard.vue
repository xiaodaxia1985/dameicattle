<template>
  <el-card class="pending-tasks-card">
    <template #header>
      <div class="card-header">
        <div class="header-left">
          <h3>待处理事项</h3>
          <el-badge :value="tasks?.total || 0" :max="99" class="task-badge" />
        </div>
        <div class="header-actions">
          <el-button-group size="small">
            <el-button 
              :type="activeFilter === 'all' ? 'primary' : 'default'"
              @click="setFilter('all')"
            >
              全部
            </el-button>
            <el-button 
              :type="activeFilter === 'high' ? 'danger' : 'default'"
              @click="setFilter('high')"
            >
              高优先级
            </el-button>
            <el-button 
              :type="activeFilter === 'medium' ? 'warning' : 'default'"
              @click="setFilter('medium')"
            >
              中优先级
            </el-button>
          </el-button-group>
          <el-button :icon="Refresh" size="small" @click="refreshTasks" />
        </div>
      </div>
    </template>
    
    <div class="tasks-content" v-loading="loading">
      <div v-if="filteredTasks.length === 0" class="empty-state">
        <el-empty description="暂无待处理事项" />
      </div>
      
      <div v-else class="tasks-list">
        <div 
          v-for="task in filteredTasks" 
          :key="task.id"
          class="task-item"
          :class="[`priority-${task.priority}`, { 'overdue': isOverdue(task) }]"
          @click="handleTaskClick(task)"
        >
          <div class="task-icon">
            <el-icon>
              <Warning v-if="task.priority === 'high'" />
              <InfoFilled v-else-if="task.priority === 'medium'" />
              <CircleCheck v-else />
            </el-icon>
          </div>
          
          <div class="task-content">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-description">{{ task.description }}</div>
            <div class="task-meta">
              <span class="task-type">{{ getTaskTypeLabel(task.type) }}</span>
              <span class="task-time">{{ formatTime(task.createdAt) }}</span>
              <span v-if="task.dueDate" class="task-due">
                截止: {{ formatTime(task.dueDate) }}
              </span>
            </div>
          </div>
          
          <div class="task-actions">
            <el-tag 
              :type="getPriorityTagType(task.priority)" 
              size="small"
            >
              {{ getPriorityLabel(task.priority) }}
            </el-tag>
            <el-button 
              :icon="Right" 
              size="small" 
              text 
              @click.stop="handleTaskClick(task)"
            />
          </div>
        </div>
      </div>
      
      <div v-if="hasMore" class="load-more">
        <el-button 
          text 
          type="primary" 
          @click="loadMore"
          :loading="loadingMore"
        >
          加载更多
        </el-button>
      </div>
    </div>
    
    <template #footer v-if="tasks?.summary">
      <div class="tasks-summary">
        <div class="summary-item high">
          <span class="summary-count">{{ tasks.summary.high }}</span>
          <span class="summary-label">高优先级</span>
        </div>
        <div class="summary-item medium">
          <span class="summary-count">{{ tasks.summary.medium }}</span>
          <span class="summary-label">中优先级</span>
        </div>
        <div class="summary-item low">
          <span class="summary-count">{{ tasks.summary.low }}</span>
          <span class="summary-label">低优先级</span>
        </div>
      </div>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Refresh, 
  Warning, 
  InfoFilled, 
  CircleCheck, 
  Right 
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import type { PendingTask, PendingTasks } from '@/api/dashboard'

interface Props {
  tasks: PendingTasks | null
  loading?: boolean
  maxHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  maxHeight: 400
})

const emit = defineEmits<{
  refresh: []
  taskClick: [task: PendingTask]
  loadMore: []
}>()

const router = useRouter()
const activeFilter = ref<'all' | 'high' | 'medium' | 'low'>('all')
const loadingMore = ref(false)
const hasMore = ref(false)

const filteredTasks = computed(() => {
  if (!props.tasks?.tasks) return []
  
  if (activeFilter.value === 'all') {
    return props.tasks.tasks
  }
  
  return props.tasks.tasks.filter(task => task.priority === activeFilter.value)
})

const setFilter = (filter: 'all' | 'high' | 'medium' | 'low') => {
  activeFilter.value = filter
}

const refreshTasks = () => {
  emit('refresh')
}

const loadMore = () => {
  loadingMore.value = true
  emit('loadMore')
  setTimeout(() => {
    loadingMore.value = false
  }, 1000)
}

const handleTaskClick = (task: PendingTask) => {
  emit('taskClick', task)
  
  // 根据任务类型跳转到相应页面
  if (task.url) {
    router.push(task.url)
  }
}

const isOverdue = (task: PendingTask): boolean => {
  if (!task.dueDate) return false
  return dayjs(task.dueDate).isBefore(dayjs())
}

const formatTime = (time: string): string => {
  return dayjs(time).format('MM-DD HH:mm')
}

const getTaskTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    'equipment_failure': '设备故障',
    'health_alert': '健康预警',
    'overdue_vaccination': '疫苗过期',
    'inventory_alert': '库存预警'
  }
  return typeMap[type] || type
}

const getPriorityLabel = (priority: string): string => {
  const priorityMap: Record<string, string> = {
    'high': '高',
    'medium': '中',
    'low': '低'
  }
  return priorityMap[priority] || priority
}

const getPriorityTagType = (priority: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' => {
  const typeMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
    'high': 'danger',
    'medium': 'warning',
    'low': 'info'
  }
  return typeMap[priority] || 'info'
}
</script>

<style lang="scss" scoped>
.pending-tasks-card {
  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
      
      h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
      }
      
      .task-badge {
        :deep(.el-badge__content) {
          font-size: 12px;
        }
      }
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  .tasks-content {
    max-height: v-bind('maxHeight + "px"');
    overflow-y: auto;
    
    .empty-state {
      padding: 40px 0;
    }
    
    .tasks-list {
      .task-item {
        display: flex;
        align-items: flex-start;
        padding: 16px 0;
        border-bottom: 1px solid var(--el-border-color-lighter);
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:last-child {
          border-bottom: none;
        }
        
        &:hover {
          background: var(--el-bg-color-page);
          margin: 0 -16px;
          padding-left: 16px;
          padding-right: 16px;
          border-radius: 6px;
        }
        
        &.overdue {
          .task-title {
            color: var(--el-color-danger);
          }
        }
        
        .task-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          flex-shrink: 0;
          
          .el-icon {
            font-size: 16px;
          }
        }
        
        &.priority-high .task-icon {
          background: var(--el-color-danger-light-9);
          color: var(--el-color-danger);
        }
        
        &.priority-medium .task-icon {
          background: var(--el-color-warning-light-9);
          color: var(--el-color-warning);
        }
        
        &.priority-low .task-icon {
          background: var(--el-color-info-light-9);
          color: var(--el-color-info);
        }
        
        .task-content {
          flex: 1;
          min-width: 0;
          
          .task-title {
            font-size: 14px;
            font-weight: 500;
            color: var(--el-text-color-primary);
            margin-bottom: 4px;
            line-height: 1.4;
          }
          
          .task-description {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            margin-bottom: 8px;
            line-height: 1.4;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          .task-meta {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 12px;
            color: var(--el-text-color-placeholder);
            
            .task-type {
              background: var(--el-bg-color-page);
              padding: 2px 6px;
              border-radius: 4px;
            }
            
            .task-due {
              color: var(--el-color-warning);
            }
          }
        }
        
        .task-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
      }
    }
    
    .load-more {
      text-align: center;
      padding: 16px 0;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }
  
  .tasks-summary {
    display: flex;
    justify-content: space-around;
    padding: 12px 0;
    
    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .summary-count {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 4px;
      }
      
      .summary-label {
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
      
      &.high .summary-count {
        color: var(--el-color-danger);
      }
      
      &.medium .summary-count {
        color: var(--el-color-warning);
      }
      
      &.low .summary-count {
        color: var(--el-color-info);
      }
    }
  }
}

@media (max-width: 768px) {
  .pending-tasks-card {
    .card-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    
    .tasks-content .tasks-list .task-item {
      .task-content .task-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }
  }
}
</style>