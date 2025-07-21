<template>
  <el-dialog
    v-model="visible"
    title="仪表盘配置"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="config-dialog">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 布局配置 -->
        <el-tab-pane label="布局配置" name="layout">
          <div class="layout-config">
            <div class="config-section">
              <h4>预设布局</h4>
              <div class="preset-layouts">
                <div 
                  v-for="preset in presetLayouts"
                  :key="preset.id"
                  class="preset-item"
                  :class="{ active: selectedPreset === preset.id }"
                  @click="selectPreset(preset.id)"
                >
                  <div class="preset-preview">
                    <div 
                      v-for="(row, index) in preset.preview"
                      :key="index"
                      class="preview-row"
                    >
                      <div 
                        v-for="(col, colIndex) in row"
                        :key="colIndex"
                        class="preview-col"
                        :style="{ flex: col }"
                      ></div>
                    </div>
                  </div>
                  <div class="preset-name">{{ preset.name }}</div>
                </div>
              </div>
            </div>
            
            <div class="config-section">
              <h4>自定义布局</h4>
              <div class="custom-layout">
                <el-form :model="layoutConfig" label-width="100px">
                  <el-form-item label="列数">
                    <el-slider 
                      v-model="layoutConfig.columns" 
                      :min="1" 
                      :max="4" 
                      show-stops
                      :marks="{ 1: '1列', 2: '2列', 3: '3列', 4: '4列' }"
                    />
                  </el-form-item>
                  <el-form-item label="行间距">
                    <el-slider 
                      v-model="layoutConfig.rowGap" 
                      :min="16" 
                      :max="48" 
                      :step="8"
                    />
                  </el-form-item>
                  <el-form-item label="列间距">
                    <el-slider 
                      v-model="layoutConfig.columnGap" 
                      :min="16" 
                      :max="48" 
                      :step="8"
                    />
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 组件配置 -->
        <el-tab-pane label="组件配置" name="components">
          <div class="components-config">
            <div class="config-section">
              <h4>可用组件</h4>
              <div class="component-list">
                <div 
                  v-for="component in availableComponents"
                  :key="component.type"
                  class="component-item"
                  :class="{ disabled: !component.enabled }"
                >
                  <div class="component-info">
                    <el-icon class="component-icon">
                      <component :is="component.icon" />
                    </el-icon>
                    <div class="component-details">
                      <div class="component-name">{{ component.name }}</div>
                      <div class="component-desc">{{ component.description }}</div>
                    </div>
                  </div>
                  <el-switch 
                    v-model="component.enabled"
                    @change="handleComponentToggle(component)"
                  />
                </div>
              </div>
            </div>
            
            <div class="config-section">
              <h4>组件设置</h4>
              <div class="component-settings">
                <el-form :model="componentConfig" label-width="120px">
                  <el-form-item label="默认图表高度">
                    <el-input-number 
                      v-model="componentConfig.defaultHeight" 
                      :min="200" 
                      :max="600" 
                      :step="50"
                    />
                  </el-form-item>
                  <el-form-item label="自动刷新间隔">
                    <el-select v-model="componentConfig.refreshInterval">
                      <el-option label="不自动刷新" :value="0" />
                      <el-option label="30秒" :value="30" />
                      <el-option label="1分钟" :value="60" />
                      <el-option label="5分钟" :value="300" />
                      <el-option label="10分钟" :value="600" />
                    </el-select>
                  </el-form-item>
                  <el-form-item label="动画效果">
                    <el-switch v-model="componentConfig.enableAnimations" />
                  </el-form-item>
                  <el-form-item label="数据缓存">
                    <el-switch v-model="componentConfig.enableCache" />
                  </el-form-item>
                </el-form>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 主题配置 -->
        <el-tab-pane label="主题配置" name="theme">
          <div class="theme-config">
            <div class="config-section">
              <h4>颜色主题</h4>
              <div class="theme-colors">
                <div 
                  v-for="theme in colorThemes"
                  :key="theme.name"
                  class="theme-item"
                  :class="{ active: selectedTheme === theme.name }"
                  @click="selectTheme(theme.name)"
                >
                  <div class="theme-preview">
                    <div 
                      v-for="color in theme.colors"
                      :key="color"
                      class="color-block"
                      :style="{ backgroundColor: color }"
                    ></div>
                  </div>
                  <div class="theme-name">{{ theme.label }}</div>
                </div>
              </div>
            </div>
            
            <div class="config-section">
              <h4>显示设置</h4>
              <el-form :model="themeConfig" label-width="120px">
                <el-form-item label="暗色模式">
                  <el-switch v-model="themeConfig.darkMode" />
                </el-form-item>
                <el-form-item label="紧凑模式">
                  <el-switch v-model="themeConfig.compactMode" />
                </el-form-item>
                <el-form-item label="显示网格线">
                  <el-switch v-model="themeConfig.showGridLines" />
                </el-form-item>
                <el-form-item label="圆角大小">
                  <el-slider 
                    v-model="themeConfig.borderRadius" 
                    :min="0" 
                    :max="16" 
                    :step="2"
                  />
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 数据配置 -->
        <el-tab-pane label="数据配置" name="data">
          <div class="data-config">
            <div class="config-section">
              <h4>数据源</h4>
              <el-form :model="dataConfig" label-width="120px">
                <el-form-item label="默认基地">
                  <el-select v-model="dataConfig.defaultBaseId">
                    <el-option 
                      v-for="base in availableBases"
                      :key="base.id"
                      :label="base.name"
                      :value="base.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="默认时间范围">
                  <el-select v-model="dataConfig.defaultTimeRange">
                    <el-option label="最近7天" value="7d" />
                    <el-option label="最近30天" value="30d" />
                    <el-option label="最近90天" value="90d" />
                    <el-option label="最近1年" value="1y" />
                  </el-select>
                </el-form-item>
                <el-form-item label="数据精度">
                  <el-select v-model="dataConfig.dataPrecision">
                    <el-option label="小时" value="hour" />
                    <el-option label="天" value="day" />
                    <el-option label="周" value="week" />
                    <el-option label="月" value="month" />
                  </el-select>
                </el-form-item>
              </el-form>
            </div>
            
            <div class="config-section">
              <h4>显示选项</h4>
              <el-checkbox-group v-model="dataConfig.displayOptions">
                <el-checkbox value="showTrends">显示趋势指标</el-checkbox>
                <el-checkbox value="showComparisons">显示同比数据</el-checkbox>
                <el-checkbox value="showPredictions">显示预测数据</el-checkbox>
                <el-checkbox value="showAlerts">显示预警信息</el-checkbox>
              </el-checkbox-group>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleReset">重置</el-button>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存配置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  DataAnalysis, 
  PieChart, 
  Histogram, 
  TrendCharts,
  Monitor
} from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [config: any]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const activeTab = ref('layout')
const selectedPreset = ref('default')
const selectedTheme = ref('default')
const saving = ref(false)

// 预设布局
const presetLayouts = [
  {
    id: 'default',
    name: '默认布局',
    preview: [[1, 1, 1, 1], [2, 1], [1, 2]]
  },
  {
    id: 'simple',
    name: '简洁布局',
    preview: [[1, 1], [1, 1]]
  },
  {
    id: 'detailed',
    name: '详细布局',
    preview: [[1, 1, 1], [2, 1], [1, 1, 1]]
  },
  {
    id: 'mobile',
    name: '移动布局',
    preview: [[1], [1], [1], [1]]
  }
]

// 颜色主题
const colorThemes = [
  {
    name: 'default',
    label: '默认主题',
    colors: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C']
  },
  {
    name: 'blue',
    label: '蓝色主题',
    colors: ['#1890ff', '#40a9ff', '#69c0ff', '#91d5ff']
  },
  {
    name: 'green',
    label: '绿色主题',
    colors: ['#52c41a', '#73d13d', '#95de64', '#b7eb8f']
  },
  {
    name: 'purple',
    label: '紫色主题',
    colors: ['#722ed1', '#9254de', '#b37feb', '#d3adf7']
  }
]

// 可用组件
const availableComponents = ref([
  {
    type: 'stat-card',
    name: '统计卡片',
    description: '显示关键指标数值',
    icon: DataAnalysis,
    enabled: true
  },
  {
    type: 'pie-chart',
    name: '饼图',
    description: '显示数据分布比例',
    icon: PieChart,
    enabled: true
  },
  {
    type: 'bar-chart',
    name: '柱状图',
    description: '显示数据对比',
    icon: Histogram,
    enabled: true
  },
  {
    type: 'trend-chart',
    name: '趋势图',
    description: '显示数据变化趋势',
    icon: TrendCharts,
    enabled: true
  },
  {
    type: 'gauge-chart',
    name: '仪表盘',
    description: '显示KPI指标',
    icon: Monitor,
    enabled: false
  }
])

const availableBases = ref([
  { id: 1, name: '基地A' },
  { id: 2, name: '基地B' },
  { id: 3, name: '基地C' }
])

// 配置对象
const layoutConfig = reactive({
  columns: 3,
  rowGap: 24,
  columnGap: 24
})

const componentConfig = reactive({
  defaultHeight: 300,
  refreshInterval: 300,
  enableAnimations: true,
  enableCache: true
})

const themeConfig = reactive({
  darkMode: false,
  compactMode: false,
  showGridLines: false,
  borderRadius: 6
})

const dataConfig = reactive({
  defaultBaseId: 1,
  defaultTimeRange: '30d',
  dataPrecision: 'day',
  displayOptions: ['showTrends', 'showAlerts']
})

const selectPreset = (presetId: string) => {
  selectedPreset.value = presetId
}

const selectTheme = (themeName: string) => {
  selectedTheme.value = themeName
}

const handleComponentToggle = (component: any) => {
  console.log('Component toggled:', component.type, component.enabled)
}

const handleSave = async () => {
  saving.value = true
  
  try {
    const config = {
      layout: {
        preset: selectedPreset.value,
        ...layoutConfig
      },
      components: {
        available: availableComponents.value,
        ...componentConfig
      },
      theme: {
        selected: selectedTheme.value,
        ...themeConfig
      },
      data: dataConfig
    }
    
    emit('save', config)
    
    // 模拟保存过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('配置保存成功')
    handleClose()
  } catch (error) {
    ElMessage.error('配置保存失败')
  } finally {
    saving.value = false
  }
}

const handleReset = () => {
  selectedPreset.value = 'default'
  selectedTheme.value = 'default'
  
  Object.assign(layoutConfig, {
    columns: 3,
    rowGap: 24,
    columnGap: 24
  })
  
  Object.assign(componentConfig, {
    defaultHeight: 300,
    refreshInterval: 300,
    enableAnimations: true,
    enableCache: true
  })
  
  Object.assign(themeConfig, {
    darkMode: false,
    compactMode: false,
    showGridLines: false,
    borderRadius: 6
  })
  
  Object.assign(dataConfig, {
    defaultBaseId: 1,
    defaultTimeRange: '30d',
    dataPrecision: 'day',
    displayOptions: ['showTrends', 'showAlerts']
  })
  
  ElMessage.success('配置已重置')
}

const handleClose = () => {
  visible.value = false
}
</script>

<style lang="scss" scoped>
.config-dialog {
  .config-section {
    margin-bottom: 32px;
    
    h4 {
      margin: 0 0 16px 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
  
  // 布局配置
  .preset-layouts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
    
    .preset-item {
      border: 2px solid var(--el-border-color);
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: var(--el-color-primary-light-5);
      }
      
      &.active {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }
      
      .preset-preview {
        height: 60px;
        margin-bottom: 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        
        .preview-row {
          display: flex;
          gap: 2px;
          flex: 1;
          
          .preview-col {
            background: var(--el-color-primary-light-7);
            border-radius: 2px;
          }
        }
      }
      
      .preset-name {
        font-size: 12px;
        text-align: center;
        color: var(--el-text-color-secondary);
      }
    }
  }
  
  // 组件配置
  .component-list {
    .component-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border: 1px solid var(--el-border-color);
      border-radius: 8px;
      margin-bottom: 12px;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: var(--el-color-primary-light-5);
      }
      
      &.disabled {
        opacity: 0.5;
      }
      
      .component-info {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .component-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: var(--el-color-primary-light-9);
          color: var(--el-color-primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .component-details {
          .component-name {
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 4px;
          }
          
          .component-desc {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }
  
  // 主题配置
  .theme-colors {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 16px;
    
    .theme-item {
      border: 2px solid var(--el-border-color);
      border-radius: 8px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: var(--el-color-primary-light-5);
      }
      
      &.active {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }
      
      .theme-preview {
        display: flex;
        height: 40px;
        margin-bottom: 8px;
        border-radius: 4px;
        overflow: hidden;
        
        .color-block {
          flex: 1;
        }
      }
      
      .theme-name {
        font-size: 12px;
        text-align: center;
        color: var(--el-text-color-secondary);
      }
    }
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .config-dialog {
    .preset-layouts {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .theme-colors {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}
</style>