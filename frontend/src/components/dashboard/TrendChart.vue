<template>
  <ChartCard
    :title="title"
    :subtitle="subtitle"
    :option="chartOption"
    :height="height"
    :loading="loading"
    :time-ranges="timeRanges"
    :active-time-range="activeTimeRange"
    @time-range-change="handleTimeRangeChange"
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

interface TrendData {
  date: string
  value: number
  [key: string]: any
}

interface SeriesConfig {
  name: string
  data: TrendData[]
  color?: string
  type?: 'line' | 'bar'
  smooth?: boolean
}

interface Props {
  title: string
  subtitle?: string
  series: SeriesConfig[]
  height?: number
  loading?: boolean
  timeRanges?: Array<{ label: string; value: string }>
  activeTimeRange?: string
  showArea?: boolean
  showDataZoom?: boolean
  yAxisFormatter?: (value: number) => string
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  loading: false,
  timeRanges: () => [
    { label: '7天', value: '7d' },
    { label: '30天', value: '30d' },
    { label: '90天', value: '90d' }
  ],
  activeTimeRange: '30d',
  showArea: false,
  showDataZoom: false
})

const emit = defineEmits<{
  timeRangeChange: [value: string]
  chartClick: [params: any]
  exportData: []
  refreshData: []
}>()

const chartOption = computed<EChartsOption>(() => {
  const dates = props.series[0]?.data.map(item => item.date) || []
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach((param: any) => {
          const value = props.yAxisFormatter ? 
            props.yAxisFormatter(param.value) : 
            param.value.toLocaleString()
          result += `${param.marker}${param.seriesName}: ${value}<br/>`
        })
        return result
      }
    },
    legend: {
      data: props.series.map(s => s.name),
      top: 0,
      right: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: props.showDataZoom ? '15%' : '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        formatter: (value: string) => {
          const date = new Date(value)
          return `${date.getMonth() + 1}/${date.getDate()}`
        }
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: props.yAxisFormatter || ((value: number) => value.toString())
      }
    },
    dataZoom: props.showDataZoom ? [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100,
        height: 30
      }
    ] : undefined,
    series: props.series.map(seriesItem => ({
      name: seriesItem.name,
      type: seriesItem.type || 'line',
      smooth: seriesItem.smooth !== false,
      data: seriesItem.data.map(item => item.value),
      itemStyle: {
        color: seriesItem.color
      },
      lineStyle: {
        color: seriesItem.color
      },
      areaStyle: props.showArea ? {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0,
            color: seriesItem.color + '40'
          }, {
            offset: 1,
            color: seriesItem.color + '10'
          }]
        }
      } : undefined
    }))
  }
})

const handleTimeRangeChange = (value: string) => {
  emit('timeRangeChange', value)
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