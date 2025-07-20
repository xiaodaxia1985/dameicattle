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
      <el-dropdown-item @click="refreshData">刷新数据</el-dropdown-item>
    </template>
  </ChartCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChartCard from './ChartCard.vue'
import type { EChartsOption } from 'echarts'

interface Props {
  title: string
  subtitle?: string
  value: number
  max?: number
  min?: number
  height?: number
  loading?: boolean
  unit?: string
  thresholds?: Array<{
    value: number
    color: string
    label?: string
  }>
}

const props = withDefaults(defineProps<Props>(), {
  height: 300,
  loading: false,
  max: 100,
  min: 0,
  unit: '%'
})

const emit = defineEmits<{
  chartClick: [params: any]
  refreshData: []
}>()

const getColor = computed(() => {
  if (!props.thresholds || props.thresholds.length === 0) {
    return '#409EFF'
  }
  
  // 找到当前值对应的颜色
  for (let i = props.thresholds.length - 1; i >= 0; i--) {
    if (props.value >= props.thresholds[i].value) {
      return props.thresholds[i].color
    }
  }
  
  return props.thresholds[0].color
})

const chartOption = computed<EChartsOption>(() => {
  return {
    tooltip: {
      formatter: `${props.title}<br/>当前值: ${props.value}${props.unit}`
    },
    series: [
      {
        type: 'gauge',
        center: ['50%', '60%'],
        startAngle: 200,
        endAngle: -40,
        min: props.min,
        max: props.max,
        splitNumber: 5,
        itemStyle: {
          color: getColor.value
        },
        progress: {
          show: true,
          width: 30
        },
        pointer: {
          show: false
        },
        axisLine: {
          lineStyle: {
            width: 30,
            color: [
              [1, '#E6E8EB']
            ]
          }
        },
        axisTick: {
          distance: -45,
          splitNumber: 5,
          lineStyle: {
            width: 2,
            color: '#999'
          }
        },
        splitLine: {
          distance: -52,
          length: 14,
          lineStyle: {
            width: 3,
            color: '#999'
          }
        },
        axisLabel: {
          distance: -20,
          color: '#999',
          fontSize: 12,
          formatter: (value: number) => {
            return value + (props.unit === '%' ? '' : props.unit)
          }
        },
        anchor: {
          show: false
        },
        title: {
          show: false
        },
        detail: {
          valueAnimation: true,
          width: '60%',
          lineHeight: 40,
          borderRadius: 8,
          offsetCenter: [0, '-15%'],
          fontSize: 32,
          fontWeight: 'bolder',
          formatter: `{value}${props.unit}`,
          color: 'inherit'
        },
        data: [
          {
            value: props.value
          }
        ]
      }
    ]
  }
})

const handleChartClick = (params: any) => {
  emit('chartClick', params)
}

const refreshData = () => {
  emit('refreshData')
}
</script>