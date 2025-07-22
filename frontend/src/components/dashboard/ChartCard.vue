<template>
  <el-card class="chart-card" :class="{ loading: loading }">
    <template #header>
      <div class="chart-header">
        <div class="chart-title">
          <h3>{{ title }}</h3>
          <p v-if="subtitle" class="chart-subtitle">{{ subtitle }}</p>
        </div>
        <div class="chart-actions">
          <el-button-group v-if="timeRanges.length > 0">
            <el-button
              v-for="range in timeRanges"
              :key="range.value"
              :type="activeTimeRange === range.value ? 'primary' : 'default'"
              size="small"
              @click="handleTimeRangeChange(range.value)"
            >
              {{ range.label }}
            </el-button>
          </el-button-group>
          <el-dropdown v-if="$slots.actions" trigger="click">
            <el-button :icon="MoreFilled" circle size="small" />
            <template #dropdown>
              <el-dropdown-menu>
                <slot name="actions" />
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </template>
    
    <div class="chart-content" v-loading="loading">
      <div 
        ref="chartRef" 
        class="chart-container"
        :style="{ height: height + 'px' }"
      ></div>
      
      <div v-if="showLegend && legendData.length > 0" class="chart-legend">
        <div 
          v-for="item in legendData"
          :key="item.name"
          class="legend-item"
          @click="handleLegendClick(item)"
        >
          <span 
            class="legend-color" 
            :style="{ backgroundColor: item.color }"
          ></span>
          <span class="legend-name">{{ item.name }}</span>
          <span class="legend-value">{{ item.value }}</span>
        </div>
      </div>
    </div>
    
    <div class="chart-footer" v-if="$slots.footer">
      <slot name="footer" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { MoreFilled } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'

interface TimeRange {
  label: string
  value: string
}

interface LegendItem {
  name: string
  color: string
  value: string | number
}

interface Props {
  title: string
  subtitle?: string
  option: any
  height?: number
  loading?: boolean
  timeRanges?: TimeRange[]
  activeTimeRange?: string
  showLegend?: boolean
  legendData?: LegendItem[]
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  loading: false,
  timeRanges: () => [],
  showLegend: false,
  legendData: () => []
})

const emit = defineEmits<{
  timeRangeChange: [value: string]
  legendClick: [item: LegendItem]
  chartClick: [params: any]
}>()

const chartRef = ref<HTMLElement>()
let chartInstance: ECharts | null = null

onMounted(() => {
  nextTick(() => {
    initChart()
  })
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

watch(() => props.option, (newOption) => {
  if (chartInstance && newOption) {
    chartInstance.setOption(newOption, true)
  }
}, { deep: true })

watch(() => props.loading, (loading) => {
  if (chartInstance) {
    if (loading) {
      chartInstance.showLoading()
    } else {
      chartInstance.hideLoading()
    }
  }
})

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value, 'custom')
  
  if (props.option) {
    chartInstance.setOption(props.option)
  }
  
  if (props.loading) {
    chartInstance.showLoading()
  }
  
  // 添加点击事件
  chartInstance.on('click', (params) => {
    emit('chartClick', params)
  })
  
  // 响应式处理
  const resizeObserver = new ResizeObserver(() => {
    chartInstance?.resize()
  })
  resizeObserver.observe(chartRef.value)
}

const handleTimeRangeChange = (value: string) => {
  emit('timeRangeChange', value)
}

const handleLegendClick = (item: LegendItem) => {
  emit('legendClick', item)
}

// 暴露图表实例给父组件
defineExpose({
  chartInstance,
  resize: () => chartInstance?.resize()
})
</script>

<style lang="scss" scoped>
.chart-card {
  .chart-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    
    .chart-title {
      h3 {
        margin: 0 0 4px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
      
      .chart-subtitle {
        margin: 0;
        font-size: 12px;
        color: var(--el-text-color-secondary);
      }
    }
    
    .chart-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  .chart-content {
    position: relative;
    
    .chart-container {
      width: 100%;
    }
    
    .chart-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--el-border-color-lighter);
      
      .legend-item {
        display: flex;
        align-items: center;
        cursor: pointer;
        transition: opacity 0.3s ease;
        
        &:hover {
          opacity: 0.8;
        }
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
          margin-right: 8px;
        }
        
        .legend-name {
          font-size: 14px;
          color: var(--el-text-color-primary);
          margin-right: 8px;
        }
        
        .legend-value {
          font-size: 14px;
          font-weight: 500;
          color: var(--el-text-color-secondary);
        }
      }
    }
  }
  
  .chart-footer {
    border-top: 1px solid var(--el-border-color-lighter);
    padding: 12px 0 0 0;
    margin-top: 16px;
  }
  
  &.loading {
    .chart-content {
      opacity: 0.6;
    }
  }
}

@media (max-width: 768px) {
  .chart-card {
    .chart-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    
    .chart-legend {
      .legend-item {
        font-size: 12px;
      }
    }
  }
}
</style>