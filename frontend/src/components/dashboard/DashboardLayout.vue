<template>
  <div class="dashboard-layout">
    <div class="layout-header">
      <div class="layout-title">
        <h2>{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </div>
      <div class="layout-actions">
        <el-button 
          v-if="configurable" 
          :icon="Setting" 
          @click="showConfig = true"
        >
          配置布局
        </el-button>
        <el-button :icon="Refresh" @click="refreshAll">刷新</el-button>
      </div>
    </div>
    
    <div class="layout-content" :class="{ 'config-mode': showConfig }">
      <div 
        v-for="(row, rowIndex) in layout" 
        :key="rowIndex"
        class="layout-row"
        :style="{ gridTemplateColumns: getRowGridTemplate(row) }"
      >
        <div
          v-for="(col, colIndex) in row"
          :key="colIndex"
          class="layout-col"
          :class="{ 'config-item': showConfig }"
          @click="showConfig && handleConfigItem(rowIndex, colIndex)"
        >
          <div v-if="showConfig" class="config-overlay">
            <el-button :icon="Edit" circle size="small" />
            <el-button :icon="Delete" circle size="small" type="danger" />
          </div>
          
          <component 
            v-if="col.component && !showConfig"
            :is="col.component"
            v-bind="col.props"
            @refresh="handleComponentRefresh(rowIndex, colIndex)"
          />
          
          <div v-else-if="showConfig" class="config-placeholder">
            <el-icon><Grid /></el-icon>
            <span>{{ col.title || '空白组件' }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 配置对话框 -->
    <el-dialog
      v-model="showConfig"
      title="配置仪表盘布局"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="config-dialog">
        <div class="config-sidebar">
          <h4>可用组件</h4>
          <div class="component-list">
            <div
              v-for="component in availableComponents"
              :key="component.type"
              class="component-item"
              draggable="true"
              @dragstart="handleDragStart(component)"
            >
              <el-icon>
                <component :is="component.icon" />
              </el-icon>
              <span>{{ component.name }}</span>
            </div>
          </div>
        </div>
        
        <div class="config-preview">
          <h4>布局预览</h4>
          <div class="preview-grid">
            <div
              v-for="(row, rowIndex) in layout"
              :key="rowIndex"
              class="preview-row"
            >
              <div
                v-for="(col, colIndex) in row"
                :key="colIndex"
                class="preview-col"
                @drop="handleDrop(rowIndex, colIndex, $event)"
                @dragover.prevent
              >
                {{ col.title || '空白' }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showConfig = false">取消</el-button>
        <el-button @click="resetLayout">重置</el-button>
        <el-button type="primary" @click="saveLayout">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Setting, 
  Refresh, 
  Edit, 
  Delete, 
  Grid,
  DataAnalysis,
  PieChart,
  Histogram,
  TrendCharts
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface LayoutItem {
  component?: any
  props?: any
  title?: string
  span?: number
}

interface ComponentConfig {
  type: string
  name: string
  icon: any
  component: any
  defaultProps?: any
}

interface Props {
  title: string
  description?: string
  layout: LayoutItem[][]
  configurable?: boolean
  availableComponents?: ComponentConfig[]
}

const props = withDefaults(defineProps<Props>(), {
  configurable: true,
  availableComponents: () => [
    {
      type: 'stat-card',
      name: '统计卡片',
      icon: DataAnalysis,
      component: 'StatCard'
    },
    {
      type: 'pie-chart',
      name: '饼图',
      icon: PieChart,
      component: 'PieChart'
    },
    {
      type: 'bar-chart',
      name: '柱状图',
      icon: Histogram,
      component: 'BarChart'
    },
    {
      type: 'trend-chart',
      name: '趋势图',
      icon: TrendCharts,
      component: 'TrendChart'
    }
  ]
})

const emit = defineEmits<{
  layoutChange: [layout: LayoutItem[][]]
  refresh: []
}>()

const showConfig = ref(false)
const draggedComponent = ref<ComponentConfig | null>(null)

const getRowGridTemplate = (row: LayoutItem[]) => {
  const spans = row.map(col => col.span || 1)
  const total = spans.reduce((sum, span) => sum + span, 0)
  return spans.map(span => `${(span / total) * 100}%`).join(' ')
}

const handleConfigItem = (rowIndex: number, colIndex: number) => {
  // 处理配置项点击
  console.log('Config item:', rowIndex, colIndex)
}

const handleComponentRefresh = (rowIndex: number, colIndex: number) => {
  // 处理单个组件刷新
  console.log('Refresh component:', rowIndex, colIndex)
}

const refreshAll = () => {
  emit('refresh')
  ElMessage.success('已刷新所有数据')
}

const handleDragStart = (component: ComponentConfig) => {
  draggedComponent.value = component
}

const handleDrop = (rowIndex: number, colIndex: number, event: DragEvent) => {
  event.preventDefault()
  
  if (!draggedComponent.value) return
  
  // 更新布局
  const newLayout = [...props.layout]
  newLayout[rowIndex][colIndex] = {
    component: draggedComponent.value.component,
    title: draggedComponent.value.name,
    props: draggedComponent.value.defaultProps || {}
  }
  
  emit('layoutChange', newLayout)
  draggedComponent.value = null
}

const resetLayout = () => {
  // 重置为默认布局
  ElMessage.info('布局已重置')
}

const saveLayout = () => {
  showConfig.value = false
  ElMessage.success('布局配置已保存')
}
</script>

<style lang="scss" scoped>
.dashboard-layout {
  .layout-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 24px;
    
    .layout-title {
      h2 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
      
      p {
        margin: 0;
        color: var(--el-text-color-secondary);
      }
    }
    
    .layout-actions {
      display: flex;
      gap: 12px;
    }
  }
  
  .layout-content {
    .layout-row {
      display: grid;
      gap: 24px;
      margin-bottom: 24px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .layout-col {
        position: relative;
        min-height: 200px;
        
        &.config-item {
          border: 2px dashed var(--el-border-color);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          
          &:hover {
            border-color: var(--el-color-primary);
            background: var(--el-color-primary-light-9);
          }
        }
        
        .config-overlay {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 10;
          display: flex;
          gap: 8px;
        }
        
        .config-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--el-text-color-secondary);
          
          .el-icon {
            font-size: 32px;
            margin-bottom: 8px;
          }
        }
      }
    }
    
    &.config-mode {
      .layout-col {
        min-height: 150px;
      }
    }
  }
  
  .config-dialog {
    display: flex;
    gap: 24px;
    height: 400px;
    
    .config-sidebar {
      width: 200px;
      border-right: 1px solid var(--el-border-color);
      padding-right: 24px;
      
      h4 {
        margin: 0 0 16px 0;
        font-size: 14px;
        font-weight: 600;
      }
      
      .component-list {
        .component-item {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 1px solid var(--el-border-color);
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: grab;
          transition: all 0.3s ease;
          
          &:hover {
            border-color: var(--el-color-primary);
            background: var(--el-color-primary-light-9);
          }
          
          &:active {
            cursor: grabbing;
          }
          
          .el-icon {
            margin-right: 8px;
            font-size: 16px;
          }
          
          span {
            font-size: 14px;
          }
        }
      }
    }
    
    .config-preview {
      flex: 1;
      
      h4 {
        margin: 0 0 16px 0;
        font-size: 14px;
        font-weight: 600;
      }
      
      .preview-grid {
        .preview-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          
          .preview-col {
            flex: 1;
            height: 80px;
            border: 2px dashed var(--el-border-color);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: var(--el-text-color-secondary);
            transition: all 0.3s ease;
            
            &:hover {
              border-color: var(--el-color-primary);
              background: var(--el-color-primary-light-9);
            }
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .dashboard-layout {
    .layout-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    
    .layout-content .layout-row {
      grid-template-columns: 1fr !important;
    }
    
    .config-dialog {
      flex-direction: column;
      height: auto;
      
      .config-sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--el-border-color);
        padding-right: 0;
        padding-bottom: 16px;
        margin-bottom: 16px;
      }
    }
  }
}
</style>