<template>
  <view class="mobile-chart">
    <view class="chart-header" v-if="title">
      <text class="chart-title">{{ title }}</text>
      <text class="chart-subtitle" v-if="subtitle">{{ subtitle }}</text>
    </view>
    
    <!-- 饼图 -->
    <view v-if="type === 'pie'" class="pie-chart">
      <view class="pie-container">
        <view class="pie-center">
          <text class="pie-total">{{ total }}</text>
          <text class="pie-label">总计</text>
        </view>
        <view 
          v-for="(item, index) in chartData" 
          :key="index"
          class="pie-segment"
          :style="getPieSegmentStyle(item, index)"
        ></view>
      </view>
      <view class="pie-legend">
        <view 
          v-for="(item, index) in chartData" 
          :key="index"
          class="legend-item"
        >
          <view 
            class="legend-color" 
            :style="{ backgroundColor: item.color || colors[index] }"
          ></view>
          <text class="legend-name">{{ item.name }}</text>
          <text class="legend-value">{{ item.value }}</text>
        </view>
      </view>
    </view>
    
    <!-- 柱状图 -->
    <view v-else-if="type === 'bar'" class="bar-chart">
      <view class="bar-container">
        <view 
          v-for="(item, index) in chartData" 
          :key="index"
          class="bar-item"
        >
          <view class="bar-column">
            <view 
              class="bar-fill"
              :style="getBarStyle(item, index)"
            ></view>
          </view>
          <text class="bar-label">{{ item.name }}</text>
          <text class="bar-value">{{ item.value }}</text>
        </view>
      </view>
    </view>
    
    <!-- 趋势图 -->
    <view v-else-if="type === 'trend'" class="trend-chart">
      <view class="trend-container">
        <canvas 
          canvas-id="trendCanvas" 
          class="trend-canvas"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
        ></canvas>
      </view>
      <view class="trend-legend" v-if="showLegend">
        <view 
          v-for="(series, index) in chartData" 
          :key="index"
          class="legend-item"
        >
          <view 
            class="legend-color" 
            :style="{ backgroundColor: series.color || colors[index] }"
          ></view>
          <text class="legend-name">{{ series.name }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'pie' // pie, bar, trend
  },
  title: String,
  subtitle: String,
  data: {
    type: Array,
    default: () => []
  },
  height: {
    type: Number,
    default: 300
  },
  showLegend: {
    type: Boolean,
    default: true
  }
})

const colors = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d',
  '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'
]

const chartData = computed(() => props.data)

const total = computed(() => {
  if (props.type === 'pie') {
    return chartData.value.reduce((sum, item) => sum + item.value, 0)
  }
  return 0
})

// 饼图样式计算
const getPieSegmentStyle = (item, index) => {
  const percentage = (item.value / total.value) * 100
  const color = item.color || colors[index % colors.length]
  
  return {
    background: `conic-gradient(${color} 0% ${percentage}%, transparent ${percentage}% 100%)`,
    transform: `rotate(${getRotationAngle(index)}deg)`
  }
}

const getRotationAngle = (index) => {
  let angle = 0
  for (let i = 0; i < index; i++) {
    angle += (chartData.value[i].value / total.value) * 360
  }
  return angle
}

// 柱状图样式计算
const getBarStyle = (item, index) => {
  const maxValue = Math.max(...chartData.value.map(d => d.value))
  const height = (item.value / maxValue) * 100
  const color = item.color || colors[index % colors.length]
  
  return {
    height: `${height}%`,
    backgroundColor: color
  }
}

// 趋势图绘制
let ctx = null

onMounted(() => {
  if (props.type === 'trend') {
    initTrendChart()
  }
})

watch(() => props.data, () => {
  if (props.type === 'trend') {
    drawTrendChart()
  }
}, { deep: true })

const initTrendChart = () => {
  ctx = uni.createCanvasContext('trendCanvas')
  drawTrendChart()
}

const drawTrendChart = () => {
  if (!ctx || !chartData.value.length) return
  
  const canvasWidth = 300
  const canvasHeight = props.height
  const padding = 40
  
  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  
  // 绘制网格线
  ctx.setStrokeStyle('#f0f0f0')
  ctx.setLineWidth(1)
  
  // 水平网格线
  for (let i = 0; i <= 4; i++) {
    const y = padding + (canvasHeight - 2 * padding) * i / 4
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(canvasWidth - padding, y)
    ctx.stroke()
  }
  
  // 绘制数据线
  chartData.value.forEach((series, seriesIndex) => {
    if (!series.data || !series.data.length) return
    
    const color = series.color || colors[seriesIndex % colors.length]
    ctx.setStrokeStyle(color)
    ctx.setLineWidth(2)
    
    const maxValue = Math.max(...series.data.map(d => d.value))
    const stepX = (canvasWidth - 2 * padding) / (series.data.length - 1)
    
    ctx.beginPath()
    series.data.forEach((point, index) => {
      const x = padding + index * stepX
      const y = canvasHeight - padding - (point.value / maxValue) * (canvasHeight - 2 * padding)
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
    
    // 绘制数据点
    ctx.setFillStyle(color)
    series.data.forEach((point, index) => {
      const x = padding + index * stepX
      const y = canvasHeight - padding - (point.value / maxValue) * (canvasHeight - 2 * padding)
      
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.fill()
    })
  })
  
  ctx.draw()
}

const handleTouchStart = (e) => {
  // 处理触摸开始事件
  console.log('Touch start:', e)
}

const handleTouchMove = (e) => {
  // 处理触摸移动事件
  console.log('Touch move:', e)
}
</script><style 
lang="scss" scoped>
.mobile-chart {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  
  .chart-header {
    margin-bottom: 24rpx;
    
    .chart-title {
      display: block;
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
      margin-bottom: 8rpx;
    }
    
    .chart-subtitle {
      font-size: 24rpx;
      color: #999;
    }
  }
  
  // 饼图样式
  .pie-chart {
    .pie-container {
      position: relative;
      width: 200rpx;
      height: 200rpx;
      margin: 0 auto 32rpx;
      
      .pie-center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        
        .pie-total {
          display: block;
          font-size: 36rpx;
          font-weight: 600;
          color: #333;
          margin-bottom: 4rpx;
        }
        
        .pie-label {
          font-size: 24rpx;
          color: #999;
        }
      }
      
      .pie-segment {
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        clip-path: polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 50% 100%);
      }
    }
    
    .pie-legend {
      .legend-item {
        display: flex;
        align-items: center;
        margin-bottom: 16rpx;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .legend-color {
          width: 24rpx;
          height: 24rpx;
          border-radius: 4rpx;
          margin-right: 16rpx;
        }
        
        .legend-name {
          flex: 1;
          font-size: 28rpx;
          color: #333;
        }
        
        .legend-value {
          font-size: 28rpx;
          font-weight: 500;
          color: #666;
        }
      }
    }
  }
  
  // 柱状图样式
  .bar-chart {
    .bar-container {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 200rpx;
      margin-bottom: 24rpx;
      
      .bar-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        max-width: 80rpx;
        
        .bar-column {
          width: 40rpx;
          height: 160rpx;
          background: #f5f5f5;
          border-radius: 20rpx;
          position: relative;
          margin-bottom: 12rpx;
          
          .bar-fill {
            position: absolute;
            bottom: 0;
            width: 100%;
            border-radius: 20rpx;
            transition: height 0.3s ease;
          }
        }
        
        .bar-label {
          font-size: 24rpx;
          color: #666;
          margin-bottom: 4rpx;
        }
        
        .bar-value {
          font-size: 26rpx;
          font-weight: 500;
          color: #333;
        }
      }
    }
  }
  
  // 趋势图样式
  .trend-chart {
    .trend-container {
      margin-bottom: 24rpx;
      
      .trend-canvas {
        width: 100%;
        height: 300rpx;
        border-radius: 8rpx;
      }
    }
    
    .trend-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 24rpx;
      
      .legend-item {
        display: flex;
        align-items: center;
        
        .legend-color {
          width: 20rpx;
          height: 20rpx;
          border-radius: 50%;
          margin-right: 12rpx;
        }
        
        .legend-name {
          font-size: 26rpx;
          color: #333;
        }
      }
    }
  }
}
</style>