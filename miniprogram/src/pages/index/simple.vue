<template>
  <view class="container">
    <view class="header">
      <text class="title">肉牛管理系统</text>
    </view>
    
    <view class="stats-grid">
      <view class="stat-card">
        <view class="stat-number">{{ stats.cattleTotal || 0 }}</view>
        <view class="stat-label">牛只总数</view>
      </view>
      <view class="stat-card">
        <view class="stat-number">{{ stats.healthyCount || 0 }}</view>
        <view class="stat-label">健康牛只</view>
      </view>
    </view>
    
    <view class="actions">
      <button class="action-btn" @tap="navigateToScan">扫码识别</button>
      <button class="action-btn" @tap="navigateToHealth">健康管理</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      stats: {
        cattleTotal: 0,
        healthyCount: 0
      }
    }
  },
  
  onLoad() {
    this.loadStats()
  },
  
  methods: {
    loadStats() {
      // 模拟数据加载
      this.stats = {
        cattleTotal: 120,
        healthyCount: 115
      }
    },
    
    navigateToScan() {
      uni.navigateTo({
        url: '/pages/scan/index'
      })
    },
    
    navigateToHealth() {
      uni.navigateTo({
        url: '/pages/health/list'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.header {
  text-align: center;
  margin-bottom: 40rpx;
  
  .title {
    font-size: 48rpx;
    font-weight: 600;
    color: #333;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-bottom: 40rpx;
}

.stat-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 32rpx 24rpx;
  text-align: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  
  .stat-number {
    font-size: 48rpx;
    font-weight: 600;
    color: #1890ff;
    margin-bottom: 8rpx;
  }
  
  .stat-label {
    font-size: 28rpx;
    color: #666;
  }
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  
  .action-btn {
    background: #1890ff;
    color: #fff;
    border: none;
    border-radius: 8rpx;
    padding: 24rpx;
    font-size: 32rpx;
  }
}
</style>