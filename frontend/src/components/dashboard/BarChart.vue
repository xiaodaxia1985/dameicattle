<template>
  <ChartCard
    :title="title"
    :subtitle="subtitle"
    :option="chartOption"
    :height="height"
    :loading="loading"
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

interface BarData {
  name: string
  value: number
  color?: string
}

interface Props {
  title: string
  subtitle?: string
  data: BarData[]
  height?: number
  loading?: boolean
  horizontal?: boolean
  showDataLabels?: boolean
  yAxisFormatter?: (value: number) => string
  maxBarWidth?: number
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  loading: false,
  horizontal: false,
  showDataLabels: true,
  maxBarWidth: 50
})

const emit = defineEmits<{
  chartClick: [params: any]
  exportData: []
  refreshData: []
}>()

const chartOption = computed<EChartsOption>(() => {
  const colors = [
    '#409EFF', '#67C23A', '#E6A23C', '#F56C6C', 
    '#909399', '#C45656', '#73767A', '#626AEF'
  ]
  
  const categories = props.data.map(item => item.name)
  const values = props.data.map(item => item.value)
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const param = params[0]
        const value = props.yAxisFormatter ? 
          props.yAxisFormatter(param.value) : 
          param.value.toLocaleString()
        return `${param.name}<br/>${param.marker}数量: ${value}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: props.horizontal ? 'value' : 'category',
      data: props.horizontal ? undefined : categories,
      axisLabel: props.horizontal ? {
        formatter: props.yAxisFormatter || ((value: number) => value.toString())
      } : {
        interval: 0,
        rotate: categories.length > 6 ? 45 : 0
      }
    },
    yAxis: {
      type: props.horizontal ? 'category' : 'value',
      data: props.horizontal ? categories : undefined,
      axisLabel: props.horizontal ? undefined : {
        formatter: props.yAxisFormatter || ((value: number) => value.toString())
      }
    },
    series: [
      {
        type: 'bar',
        data: props.horizontal ? values : props.data.map((item, index) => ({
          value: item.value,
          itemStyle: {
            color: item.color || colors[index % colors.length]
          }
        })),
        barMaxWidth: props.maxBarWidth,
        itemStyle: props.horizontal ? {
          color: (params: any) => {
            const item = props.data[params.dataIndex]
            return item.color || colors[params.dataIndex % colors.length]
          }
        } : undefined,
        label: {
          show: props.showDataLabels,
          position: props.horizontal ? 'right' : 'top',
          formatter: (params: any) => {
            return props.yAxisFormatter ? 
              props.yAxisFormatter(params.value) : 
              params.value.toLocaleString()
          }
        },
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
})

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