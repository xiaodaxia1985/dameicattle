<template>
  <view class="dashboard-container">
    <!-- 页面头部 -->
    <view class="dashboard-header">
      <view class="header-content">
        <text class="page-title">数据总览</text>
        <view class="header-actions">
          <text class="refresh-btn" @tap="handleRefresh">
            <text class="iconfont icon-refresh" :class="{ rotating: loading }"></text>
          </text>
        </view>
      </view>
      <text class="last-updated" v-if="lastUpdated">
        更新时间: {{ formatTime(lastUpdated) }}
      </text>
    </view>

    <!-- 基地选择器 -->
    <view class="base-selector" @tap="showBasePicker">
      <view class="selector-content">
        <text class="selector-label">当前基地</text>
        <view class="selector-value">
          <text class="base-name">{{ currentBase?.name || '请选择基地' }}</text>
          <text class="iconfont icon-arrow-down"></text>
        </view>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-section">
      <view class="stats-grid">
        <view class="stat-card primary" @tap="navigateTo('/pages/cattle/list')">
          <view class="stat-icon">🐄</view>
          <view class="stat-content">
            <text class="stat-number">{{ keyIndicators.totalCattle || 0 }}</text>
            <text class="stat-label">牛只总数</text>
          </view>
        </view>
        
        <view class="stat-card success" @tap="navigateTo('/pages/health/list')">
          <view class="stat-icon">💚</view>
          <view class="stat-content">
            <text class="stat-number">{{ keyIndicators.healthRate || 0 }}%</text>
            <text class="stat-label">健康率</text>
          </view>
        </view>
        
        <view class="stat-card warning" @tap="navigateTo('/pages/health/alerts')">
          <view class="stat-icon">⚠️</view>
          <view class="stat-content">
            <text class="stat-number">{{ pendingTasks.length || 0 }}</text>
            <text class="stat-label">待处理</text>
          </view>
        </view>
        
        <view class="stat-card info" @tap="showRevenueDetail">
          <view class="stat-icon">💰</view>
          <view class="stat-content">
            <text class="stat-number">{{ formatCurrency(keyIndicators.monthlyRevenue || 0) }}</text>
            <text class="stat-label">月收入</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template><scrip
t setup>
import { ref, onMounted, computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useBaseStore } from '@/stores/base'
import { formatTime, formatCurrency } from '@/utils/common'

const dashboardStore = useDashboardStore()
const baseStore = useBaseStore()

const {
  keyIndicators,
  pendingTasks,
  loading,
  lastUpdated
} = dashboardStore

const { currentBase } = baseStore

onMounted(() => {
  loadDashboardData()
  
  // 设置定时刷新
  setInterval(() => {
    if (!loading.value) {
      loadDashboardData(true) // 静默刷新
    }
  }, 5 * 60 * 1000) // 5分钟刷新一次
})

const loadDashboardData = async (silent = false) => {
  if (!currentBase.value) {
    uni.showToast({
      title: '请先选择基地',
      icon: 'none'
    })
    return
  }
  
  try {
    if (!silent) {
      uni.showLoading({ title: '加载中...' })
    }
    
    await dashboardStore.refreshAll(currentBase.value.id)
    
    if (!silent) {
      uni.hideLoading()
    }
  } catch (error) {
    console.error('加载仪表盘数据失败:', error)
    if (!silent) {
      uni.hideLoading()
      uni.showToast({
        title: '加载失败',
        icon: 'error'
      })
    }
  }
}

const handleRefresh = async () => {
  await loadDashboardData()
  uni.showToast({
    title: '刷新成功',
    icon: 'success'
  })
}

const showBasePicker = () => {
  uni.navigateTo({
    url: '/pages/base/selector'
  })
}

const navigateTo = (url) => {
  if (!currentBase.value) {
    uni.showToast({
      title: '请先选择基地',
      icon: 'none'
    })
    return
  }
  
  const separator = url.includes('?') ? '&' : '?'
  const fullUrl = `${url}${separator}baseId=${currentBase.value.id}`
  
  uni.navigateTo({ url: fullUrl })
}

const showRevenueDetail = () => {
  uni.showModal({
    title: '月度收入详情',
    content: `当前月度收入: ${formatCurrency(keyIndicators.value.monthlyRevenue || 0)}`,
    showCancel: false
  })
}
</script><
style lang="scss" scoped>
.dashboard-container {
  background: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 40rpx;
}

.dashboard-header {
  background: #fff;
  padding: 32rpx 32rpx 24rpx;
  margin-bottom: 20rpx;
  
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12rpx;
    
    .page-title {
      font-size: 36rpx;
      font-weight: 600;
      color: #333;
    }
    
    .header-actions {
      .refresh-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60rpx;
        height: 60rpx;
        background: #f0f0f0;
        border-radius: 50%;
        
        .iconfont {
          font-size: 32rpx;
          color: #666;
          
          &.rotating {
            animation: rotate 1s linear infinite;
          }
        }
      }
    }
  }
  
  .last-updated {
    font-size: 24rpx;
    color: #999;
  }
}

.base-selector {
  background: #fff;
  margin: 0 20rpx 20rpx;
  border-radius: 12rpx;
  padding: 24rpx;
  
  .selector-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    .selector-label {
      font-size: 28rpx;
      color: #666;
    }
    
    .selector-value {
      display: flex;
      align-items: center;
      gap: 12rpx;
      
      .base-name {
        font-size: 30rpx;
        color: #333;
        font-weight: 500;
      }
      
      .iconfont {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
}

.stats-section {
  margin: 0 20rpx;
  
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20rpx;
    
    .stat-card {
      background: #fff;
      border-radius: 12rpx;
      padding: 32rpx 24rpx;
      display: flex;
      align-items: center;
      gap: 20rpx;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
      
      .stat-icon {
        font-size: 48rpx;
        width: 80rpx;
        height: 80rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(24, 144, 255, 0.1);
      }
      
      .stat-content {
        flex: 1;
        
        .stat-number {
          display: block;
          font-size: 32rpx;
          font-weight: 600;
          color: #333;
          margin-bottom: 8rpx;
        }
        
        .stat-label {
          font-size: 24rpx;
          color: #666;
        }
      }
      
      &.primary {
        .stat-icon {
          background: rgba(24, 144, 255, 0.1);
        }
        .stat-number {
          color: #1890ff;
        }
      }
      
      &.success {
        .stat-icon {
          background: rgba(82, 196, 26, 0.1);
        }
        .stat-number {
          color: #52c41a;
        }
      }
      
      &.warning {
        .stat-icon {
          background: rgba(250, 173, 20, 0.1);
        }
        .stat-number {
          color: #faad14;
        }
      }
      
      &.info {
        .stat-icon {
          background: rgba(114, 46, 209, 0.1);
        }
        .stat-number {
          color: #722ed1;
        }
      }
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式适配
@media (max-width: 750rpx) {
  .stats-section .stats-grid {
    grid-template-columns: 1fr;
    gap: 16rpx;
  }
}
</style>