<template>
  <ChartCard
    :title="title"
    :subtitle="subtitle"
    :option="chartOption"
    :height="height"
    :loading="loading"
    :show-legend="showCustomLegend"
    :legend-data="legendData"
    @legend-click="handleLegendClick"
    @chart-click="handleChartClick"
  >
    <template #actions>
      <el-dropdown-item @click="exportData">导出数据</el-dropdown-item>
      <el-dropdown-item @click="refreshData">刷新数据</el-dropdown-item>
    </template>
  </ChartCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChartCard from './ChartCard.vue'
import type { EChartsOption } from 'echarts'

interface PieData {
  name: string
  value: number
  color?: string
}

interface Props {
  title: string
  subtitle?: string
  data: PieData[]
  height?: number
  loading?: boolean
  showCustomLegend?: boolean
  showPercentage?: boolean
  innerRadius?: string
  outerRadius?: string
  roseType?: boolean
  labelPosition?: 'inside' | 'outside'
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  loading: false,
  showCustomLegend: false,
  showPercentage: true,
  innerRadius: '0%',
  outerRadius: '75%',
  roseType: false,
  labelPosition: 'outside'
})

const emit = defineEmits<{
  legendClick: [item: any]
  chartClick: [params: any]
  exportData: []
  refreshData: []
}>()

const total = computed(() => {
  return props.data.reduce((sum, item) => sum + item.value, 0)
})

const legendData = computed(() => {
  return props.data.map(item => ({
    name: item.name,
    color: item.color || '#409EFF',
    value: props.showPercentage ? 
      `${((item.value / total.value) * 100).toFixed(1)}%` : 
      item.value.toLocaleString()
  }))
})

const chartOption = computed((): any => {
  const colors = [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', 
    '#909399', '#C45656', '#73767A', '#626AEF'
  ]
  
  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const percentage = ((params.value / total.value) * 100).toFixed(1)
        return `${params.name}<br/>${params.marker}数量: ${params.value.toLocaleString()}<br/>占比: ${percentage}%`
      }
    },
    legend: props.showCustomLegend ? undefined : {
      orient: 'vertical',
      left: 'left',
      data: props.data.map(item => item.name)
    },
    series: [
      {
        type: 'pie',
        radius: [props.innerRadius, props.outerRadius],
        center: props.showCustomLegend ? ['50%', '50%'] : ['60%', '50%'],
        roseType: props.roseType ? 'radius' : false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: props.labelPosition === 'outside',
          position: props.labelPosition,
          formatter: (params: any) => {
            if (props.showPercentage) {
              const percentage = ((params.value / total.value) * 100).toFixed(1)
              return `${params.name}\n${percentage}%`
            }
            return `${params.name}\n${params.value}`
          }
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        data: props.data.map((item, index) => ({
          name: item.name,
          value: item.value,
          itemStyle: {
            color: item.color || colors[index % colors.length]
          }
        }))
      }
    ]
  }
})

const handleLegendClick = (item: any) => {
  emit('legendClick', item)
}

const handleChartClick = (params: any) => {
  emit('chartClick', params)
}

const exportData = () => {
  emit('exportData')
}

const refreshData = () => {
  emit('refreshData')
}
</script>