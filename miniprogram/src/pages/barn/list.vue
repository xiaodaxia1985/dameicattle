<template>
  <view class="barn-list-container">
    <!-- 基地选择器 -->
    <view class="base-selector">
      <view class="selector-label">当前基地:</view>
      <view class="selector-value" @click="showBaseSelector">
        <text>{{ currentBase && currentBase.name || '请选择基地' }}</text>
        <text class="iconfont icon-arrow-down"></text>
      </view>
    </view>

    <!-- 牛棚统计 -->
    <view class="barn-stats">
      <view class="stat-item">
        <view class="stat-number">{{ barns.length }}</view>
        <view class="stat-label">牛棚总数</view>
      </view>
      <view class="stat-item">
        <view class="stat-number">{{ totalCapacity }}</view>
        <view class="stat-label">总容量</view>
      </view>
      <view class="stat-item">
        <view class="stat-number">{{ totalCattle }}</view>
        <view class="stat-label">牛只总数</view>
      </view>
      <view class="stat-item">
        <view class="stat-number">{{ utilizationRate }}%</view>
        <view class="stat-label">利用率</view>
      </view>
    </view>

    <!-- 搜索和筛选 -->
    <view class="search-section">
      <view class="search-bar">
        <input 
          v-model="searchKeyword" 
          placeholder="搜索牛棚名称或编号"
          @input="handleSearch"
        />
        <text class="iconfont icon-search"></text>
      </view>
      <view class="filter-tabs">
        <view 
          v-for="filter in filterOptions" 
          :key="filter.value"
          class="filter-tab"
          :class="{ active: currentFilter === filter.value }"
          @click="setFilter(filter.value)"
        >
          {{ filter.label }}
        </view>
      </view>
    </view>

    <!-- 牛棚列表 -->
    <view class="barn-list">
      <view v-if="loading" class="loading-container">
        <uni-load-more status="loading" />
      </view>
      
      <view v-else-if="filteredBarns.length > 0">
        <view 
          v-for="barn in filteredBarns" 
          :key="barn.id"
          class="barn-card"
          @click="viewBarnDetail(barn)"
        >
          <view class="barn-header">
            <view class="barn-info">
              <view class="barn-name">{{ barn.name }}</view>
              <view class="barn-code">{{ barn.code }}</view>
            </view>
            <view class="barn-status" :class="'status-' + getBarnStatus(barn)">
              {{ getBarnStatusText(barn) }}
            </view>
          </view>
          
          <view class="barn-details">
            <view class="detail-row">
              <view class="detail-item">
                <text class="label">类型:</text>
                <text class="value">{{ barn.barnType || '--' }}</text>
              </view>
              <view class="detail-item">
                <text class="label">容量:</text>
                <text class="value">{{ barn.capacity }}</text>
              </view>
            </view>
            <view class="detail-row">
              <view class="detail-item">
                <text class="label">当前:</text>
                <text class="value">{{ barn.currentCount }}</text>
              </view>
              <view class="detail-item">
                <text class="label">利用率:</text>
                <text class="value">{{ getUtilizationRate(barn) }}%</text>
              </view>
            </view>
          </view>
          
          <view class="capacity-section">
            <view class="capacity-header">
              <text>容量使用情况</text>
              <text class="capacity-text">{{ barn.currentCount }}/{{ barn.capacity }}</text>
            </view>
            <view class="capacity-bar">
              <view 
                class="capacity-fill" 
                :class="getUtilizationRate(barn) >= 100 ? 'full' : getUtilizationRate(barn) >= 80 ? 'warning' : 'normal'"
                :style="{ width: getUtilizationRate(barn) + '%' }"
              ></view>
            </view>
          </view>
          
          <view class="barn-actions">
            <view class="action-btn" @click.stop="quickAction(barn, 'cattle')">
              <text class="iconfont icon-cattle"></text>
              <text>牛只</text>
            </view>
            <view class="action-btn" @click.stop="quickAction(barn, 'feeding')">
              <text class="iconfont icon-feeding"></text>
              <text>饲喂</text>
            </view>
            <view class="action-btn" @click.stop="quickAction(barn, 'health')">
              <text class="iconfont icon-health"></text>
              <text>健康</text>
            </view>
          </view>
        </view>
      </view>
      
      <view v-else class="empty-state">
        <text>{{ currentBase ? '暂无牛棚数据' : '请先选择基地' }}</text>
      </view>
    </view>

    <!-- 基地选择弹窗 -->
    <uni-popup ref="baseSelectorPopup" type="bottom">
      <view class="base-selector-popup">
        <view class="popup-header">
          <view class="popup-title">选择基地</view>
          <view class="close-btn" @click="hideBaseSelector">
            <text class="iconfont icon-close"></text>
          </view>
        </view>
        <view class="base-list">
          <view 
            v-for="base in bases" 
            :key="base.id"
            class="base-item"
            :class="{ active: base.id === (currentBase && currentBase.id) }"
            @click="selectBase(base)"
          >
            <view class="base-info">
              <view class="base-name">{{ base.name }}</view>
              <view class="base-code">{{ base.code }}</view>
            </view>
            <view v-if="base.id === (currentBase && currentBase.id)" class="check-icon">
              <text class="iconfont icon-check"></text>
            </view>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { baseApi } from '@/api/base'

// Simple state management without pinia
const bases = ref([])
const currentBase = ref(null)
const barns = ref([])
const loading = ref(false)
const searchKeyword = ref('')
const currentFilter = ref('all')

const filterOptions = [
  { label: '全部', value: 'all' },
  { label: '正常', value: 'normal' },
  { label: '接近满载', value: 'near_full' },
  { label: '满载', value: 'full' },
  { label: '空置', value: 'empty' }
]

// 计算属性
const totalCapacity = computed(() => {
  return barns.value.reduce((sum, barn) => sum + (barn.capacity || 0), 0)
})

const totalCattle = computed(() => {
  return barns.value.reduce((sum, barn) => sum + (barn.currentCount || 0), 0)
})

const utilizationRate = computed(() => {
  return totalCapacity.value > 0 ? Math.round((totalCattle.value / totalCapacity.value) * 100) : 0
})

const filteredBarns = computed(() => {
  let result = barns.value

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(barn => 
      barn.name.toLowerCase().includes(keyword) || 
      barn.code.toLowerCase().includes(keyword)
    )
  }

  // 状态过滤
  if (currentFilter.value !== 'all') {
    result = result.filter(barn => {
      const rate = getUtilizationRate(barn)
      switch (currentFilter.value) {
        case 'empty':
          return barn.currentCount === 0
        case 'normal':
          return rate > 0 && rate < 80
        case 'near_full':
          return rate >= 80 && rate < 100
        case 'full':
          return rate >= 100
        default:
          return true
      }
    })
  }

  return result
})

onMounted(async () => {
  await loadBases()
  
  // 恢复当前基地
  const cachedBase = uni.getStorageSync('currentBase')
  if (cachedBase && !currentBase.value) {
    currentBase.value = cachedBase
  }
  
  if (currentBase.value) {
    await loadBarns()
  }
})

// 监听基地变化
watch(currentBase, async (newBase) => {
  if (newBase) {
    await loadBarns()
  } else {
    barns.value = []
  }
})

// 加载基地列表
const loadBases = async () => {
  try {
    const response = await baseApi.getBases()
    bases.value = response.data || []
  } catch (error) {
    console.error('获取基地列表失败:', error)
    bases.value = []
  }
}

// 加载牛棚列表
const loadBarns = async () => {
  if (!currentBase.value) return
  
  loading.value = true
  try {
    // Mock data for now - replace with actual API call
    const mockBarns = [
      { 
        id: 1, 
        name: '1号牛棚', 
        code: 'B001',
        capacity: 50, 
        currentCount: 35, 
        baseId: currentBase.value.id,
        barnType: '育肥棚'
      },
      { 
        id: 2, 
        name: '2号牛棚', 
        code: 'B002',
        capacity: 60, 
        currentCount: 42, 
        baseId: currentBase.value.id,
        barnType: '繁殖棚'
      }
    ]
    barns.value = mockBarns
  } catch (error) {
    console.error('获取牛棚列表失败:', error)
    uni.showToast({
      title: '获取牛棚列表失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

// 显示基地选择器
const showBaseSelector = () => {
  uni.$refs.baseSelectorPopup?.open()
}

// 隐藏基地选择器
const hideBaseSelector = () => {
  uni.$refs.baseSelectorPopup?.close()
}

// 选择基地
const selectBase = (base) => {
  currentBase.value = base
  uni.setStorageSync('currentBase', base)
  hideBaseSelector()
  uni.showToast({
    title: `已切换到${base.name}`,
    icon: 'success'
  })
}

// 搜索处理
const handleSearch = () => {
  // 搜索逻辑在computed中处理
}

// 设置过滤器
const setFilter = (filter) => {
  currentFilter.value = filter
}

// 获取利用率
const getUtilizationRate = (barn) => {
  if (!barn.capacity || barn.capacity === 0) return 0
  return Math.min(Math.round((barn.currentCount / barn.capacity) * 100), 100)
}

// 获取牛棚状态
const getBarnStatus = (barn) => {
  const rate = getUtilizationRate(barn)
  if (rate === 0) return 'empty'
  if (rate >= 100) return 'full'
  if (rate >= 80) return 'near-full'
  return 'normal'
}

// 获取牛棚状态类名
const getBarnStatusClass = (barn) => {
  const rate = getUtilizationRate(barn)
  if (rate === 0) return 'empty'
  if (rate >= 100) return 'full'
  if (rate >= 80) return 'near-full'
  return 'normal'
}

// 获取牛棚状态文本
const getBarnStatusText = (barn) => {
  const rate = getUtilizationRate(barn)
  if (rate === 0) return '空置'
  if (rate >= 100) return '满载'
  if (rate >= 80) return '接近满载'
  return '正常'
}

// 获取容量条类名
const getCapacityClass = (barn) => {
  const rate = getUtilizationRate(barn)
  if (rate >= 100) return 'full'
  if (rate >= 80) return 'warning'
  return 'normal'
}

// 查看牛棚详情
const viewBarnDetail = (barn) => {
  uni.navigateTo({
    url: `/pages/barn/detail?id=${barn.id}`
  })
}

// 快捷操作
const quickAction = (barn, action) => {
  switch (action) {
    case 'cattle':
      uni.navigateTo({
        url: `/pages/cattle/list?barnId=${barn.id}`
      })
      break
    case 'feeding':
      uni.navigateTo({
        url: `/pages/feeding/record?barnId=${barn.id}`
      })
      break
    case 'health':
      uni.navigateTo({
        url: `/pages/health/list?barnId=${barn.id}`
      })
      break
  }
}
</script>

<style lang="scss" scoped>
.barn-list-container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.base-selector {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
  
  .selector-label {
    font-size: 28rpx;
    color: #666;
  }
  
  .selector-value {
    display: flex;
    align-items: center;
    gap: 10rpx;
    color: #1890ff;
    font-size: 30rpx;
  }
}

.barn-stats {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
  
  .stat-item {
    text-align: center;
    
    .stat-number {
      font-size: 36rpx;
      font-weight: bold;
      color: #1890ff;
      margin-bottom: 8rpx;
    }
    
    .stat-label {
      font-size: 24rpx;
      color: #666;
    }
  }
}

.search-section {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
  
  .search-bar {
    position: relative;
    margin-bottom: 20rpx;
    
    input {
      width: 100%;
      height: 80rpx;
      background: #f5f5f5;
      border-radius: 40rpx;
      padding: 0 50rpx 0 30rpx;
      font-size: 28rpx;
      border: none;
    }
    
    .icon-search {
      position: absolute;
      right: 30rpx;
      top: 50%;
      transform: translateY(-50%);
      color: #999;
      font-size: 32rpx;
    }
  }
  
  .filter-tabs {
    display: flex;
    gap: 15rpx;
    
    .filter-tab {
      padding: 12rpx 24rpx;
      background: #f5f5f5;
      border-radius: 20rpx;
      font-size: 26rpx;
      color: #666;
      
      &.active {
        background: #1890ff;
        color: white;
      }
    }
  }
}

.barn-list {
  .loading-container {
    padding: 40rpx;
    text-align: center;
  }
  
  .barn-card {
    background: white;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
    
    .barn-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
      
      .barn-info {
        .barn-name {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 8rpx;
        }
        
        .barn-code {
          font-size: 24rpx;
          color: #999;
          background: #f5f5f5;
          padding: 4rpx 12rpx;
          border-radius: 12rpx;
        }
      }
      
      .barn-status {
        padding: 8rpx 16rpx;
        border-radius: 16rpx;
        font-size: 24rpx;
        
        &.empty {
          background: #f0f0f0;
          color: #999;
        }
        
        &.normal {
          background: #f6ffed;
          color: #52c41a;
        }
        
        &.near-full {
          background: #fff7e6;
          color: #fa8c16;
        }
        
        &.full {
          background: #fff2f0;
          color: #ff4d4f;
        }
      }
    }
    
    .barn-details {
      margin-bottom: 20rpx;
      
      .detail-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10rpx;
        
        .detail-item {
          .label {
            font-size: 26rpx;
            color: #666;
            margin-right: 8rpx;
          }
          
          .value {
            font-size: 26rpx;
            color: #333;
            font-weight: 500;
          }
        }
      }
    }
    
    .capacity-section {
      margin-bottom: 20rpx;
      
      .capacity-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10rpx;
        font-size: 26rpx;
        color: #666;
        
        .capacity-text {
          font-weight: 500;
          color: #333;
        }
      }
      
      .capacity-bar {
        height: 12rpx;
        background: #f0f0f0;
        border-radius: 6rpx;
        overflow: hidden;
        
        .capacity-fill {
          height: 100%;
          transition: width 0.3s ease;
          
          &.normal {
            background: linear-gradient(90deg, #52c41a, #73d13d);
          }
          
          &.warning {
            background: linear-gradient(90deg, #fa8c16, #ffc53d);
          }
          
          &.full {
            background: linear-gradient(90deg, #ff4d4f, #ff7875);
          }
        }
      }
    }
    
    .barn-actions {
      display: flex;
      justify-content: space-around;
      
      .action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8rpx;
        padding: 15rpx;
        color: #666;
        font-size: 24rpx;
        
        .iconfont {
          font-size: 32rpx;
        }
        
        &:active {
          color: #1890ff;
        }
      }
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 100rpx 40rpx;
    color: #999;
    font-size: 28rpx;
  }
}

.base-selector-popup {
  background: white;
  border-radius: 20rpx 20rpx 0 0;
  max-height: 80vh;
  
  .popup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    .popup-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
    
    .close-btn {
      color: #999;
      font-size: 32rpx;
    }
  }
  
  .base-list {
    max-height: 60vh;
    overflow-y: auto;
    
    .base-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 30rpx;
      border-bottom: 1rpx solid #f8f8f8;
      
      &.active {
        background: #f6ffed;
        
        .base-name {
          color: #52c41a;
        }
      }
      
      .base-info {
        .base-name {
          font-size: 30rpx;
          color: #333;
          margin-bottom: 8rpx;
        }
        
        .base-code {
          font-size: 26rpx;
          color: #999;
        }
      }
      
      .check-icon {
        color: #52c41a;
        font-size: 32rpx;
      }
    }
  }
}
</style>