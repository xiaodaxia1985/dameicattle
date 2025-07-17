<template>
  <view class="container">
    <!-- 基地选择 -->
    <view class="base-selector card">
      <view class="flex-between">
        <text class="title">当前基地</text>
        <text class="change-btn" @tap="showBasePicker">切换</text>
      </view>
      <view class="base-info">
        <text class="base-name">{{ currentBase?.name || '请选择基地' }}</text>
        <text class="base-address">{{ currentBase?.address || '' }}</text>
      </view>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-grid">
      <view class="stat-card" @tap="navigateTo('/pages/cattle/list')">
        <view class="stat-number">{{ stats.cattleTotal || 0 }}</view>
        <view class="stat-label">牛只总数</view>
      </view>
      <view class="stat-card healthy" @tap="navigateTo('/pages/health/list')">
        <view class="stat-number">{{ stats.healthyCount || 0 }}</view>
        <view class="stat-label">健康牛只</view>
      </view>
      <view class="stat-card sick" @tap="navigateTo('/pages/health/list')">
        <view class="stat-number">{{ stats.sickCount || 0 }}</view>
        <view class="stat-label">患病牛只</view>
      </view>
      <view class="stat-card treatment" @tap="navigateTo('/pages/health/list')">
        <view class="stat-number">{{ stats.treatmentCount || 0 }}</view>
        <view class="stat-label">治疗中</view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions card">
      <view class="section-title">快捷操作</view>
      <view class="action-grid">
        <view class="action-item" @tap="navigateTo('/pages/scan/index')">
          <view class="action-icon">📱</view>
          <text class="action-text">扫码识别</text>
        </view>
        <view class="action-item" @tap="navigateTo('/pages/health/record')">
          <view class="action-icon">🏥</view>
          <text class="action-text">健康记录</text>
        </view>
        <view class="action-item" @tap="navigateTo('/pages/feeding/record')">
          <view class="action-icon">🌾</view>
          <text class="action-text">饲喂记录</text>
        </view>
        <view class="action-item" @tap="showComingSoon">
          <view class="action-icon">📊</view>
          <text class="action-text">数据统计</text>
        </view>
      </view>
    </view>

    <!-- 待处理事项 -->
    <view class="todos card" v-if="todos.length > 0">
      <view class="section-title">待处理事项</view>
      <view class="todo-list">
        <view class="todo-item" v-for="todo in todos" :key="todo.id">
          <view class="todo-content">
            <text class="todo-title">{{ todo.title }}</text>
            <text class="todo-desc">{{ todo.description }}</text>
          </view>
          <view class="todo-badge" :class="todo.level">{{ todo.count }}</view>
        </view>
      </view>
    </view>

    <!-- 基地选择弹窗 -->
    <uni-popup ref="basePopup" type="bottom">
      <view class="base-picker">
        <view class="picker-header">
          <text class="picker-title">选择基地</text>
          <text class="picker-close" @tap="hideBasePicker">关闭</text>
        </view>
        <view class="base-list">
          <view 
            class="base-item" 
            v-for="base in bases" 
            :key="base.id"
            @tap="selectBase(base)"
          >
            <text class="base-name">{{ base.name }}</text>
            <text class="base-address">{{ base.address }}</text>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useBaseStore } from '@/stores/base'
import { useDashboardStore } from '@/stores/dashboard'

const baseStore = useBaseStore()
const dashboardStore = useDashboardStore()

const currentBase = ref(null)
const bases = ref([])
const stats = ref({})
const todos = ref([])
const basePopup = ref(null)

onMounted(() => {
  loadData()
})

const loadData = async () => {
  try {
    // 加载基地列表
    const baseResponse = await baseStore.fetchAllBases()
    bases.value = baseResponse
    
    // 设置默认基地
    if (bases.value.length > 0 && !currentBase.value) {
      currentBase.value = bases.value[0]
    }
    
    // 加载统计数据
    if (currentBase.value) {
      const statsResponse = await dashboardStore.fetchStats({ baseId: currentBase.value.id })
      stats.value = statsResponse
      
      const todosResponse = await dashboardStore.fetchTodos({ baseId: currentBase.value.id })
      todos.value = todosResponse
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    uni.showToast({
      title: '加载数据失败',
      icon: 'none'
    })
  }
}

const showBasePicker = () => {
  basePopup.value.open()
}

const hideBasePicker = () => {
  basePopup.value.close()
}

const selectBase = (base) => {
  currentBase.value = base
  baseStore.setCurrentBase(base)
  hideBasePicker()
  loadData()
}

const navigateTo = (url) => {
  uni.navigateTo({ url })
}

const showComingSoon = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}
</script>

<style lang="scss" scoped>
.base-selector {
  .title {
    font-size: 32rpx;
    font-weight: 600;
  }
  
  .change-btn {
    color: #1890ff;
    font-size: 28rpx;
  }
  
  .base-info {
    margin-top: 20rpx;
    
    .base-name {
      display: block;
      font-size: 36rpx;
      font-weight: 600;
      margin-bottom: 8rpx;
    }
    
    .base-address {
      font-size: 28rpx;
      color: #999;
    }
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
  margin-bottom: 20rpx;
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
  
  &.healthy .stat-number {
    color: #52c41a;
  }
  
  &.sick .stat-number {
    color: #ff4d4f;
  }
  
  &.treatment .stat-number {
    color: #faad14;
  }
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24rpx;
}

.action-item {
  text-align: center;
  
  .action-icon {
    font-size: 48rpx;
    margin-bottom: 12rpx;
  }
  
  .action-text {
    font-size: 24rpx;
    color: #666;
  }
}

.todo-list {
  .todo-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .todo-content {
    flex: 1;
    
    .todo-title {
      display: block;
      font-size: 30rpx;
      margin-bottom: 8rpx;
    }
    
    .todo-desc {
      font-size: 26rpx;
      color: #999;
    }
  }
  
  .todo-badge {
    background: #1890ff;
    color: #fff;
    padding: 8rpx 16rpx;
    border-radius: 20rpx;
    font-size: 24rpx;
    
    &.high {
      background: #ff4d4f;
    }
    
    &.medium {
      background: #faad14;
    }
  }
}

.base-picker {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  
  .picker-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 40rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    .picker-title {
      font-size: 32rpx;
      font-weight: 600;
    }
    
    .picker-close {
      color: #1890ff;
      font-size: 28rpx;
    }
  }
  
  .base-list {
    max-height: 600rpx;
    overflow-y: auto;
    
    .base-item {
      padding: 32rpx 40rpx;
      border-bottom: 1rpx solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .base-name {
        display: block;
        font-size: 30rpx;
        margin-bottom: 8rpx;
      }
      
      .base-address {
        font-size: 26rpx;
        color: #999;
      }
    }
  }
}
</style>