<template>
  <view class="base-detail-container">
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading" />
    </view>
    
    <view v-else-if="baseInfo" class="detail-content">
      <!-- 基地基本信息 -->
      <view class="info-card">
        <view class="card-header">
          <view class="card-title">基地信息</view>
          <view class="location-btn" @click="openLocation">
            <text class="iconfont icon-location"></text>
            <text>导航</text>
          </view>
        </view>
        
        <view class="info-grid">
          <view class="info-item">
            <view class="label">基地名称</view>
            <view class="value">{{ baseInfo.name }}</view>
          </view>
          <view class="info-item">
            <view class="label">基地编号</view>
            <view class="value">{{ baseInfo.code }}</view>
          </view>
          <view class="info-item">
            <view class="label">基地面积</view>
            <view class="value">{{ baseInfo.area || '--' }} 亩</view>
          </view>
          <view class="info-item">
            <view class="label">负责人</view>
            <view class="value">{{ baseInfo.managerName || '--' }}</view>
          </view>
          <view class="info-item full-width">
            <view class="label">基地地址</view>
            <view class="value">{{ baseInfo.address }}</view>
          </view>
        </view>
      </view>

      <!-- 牛棚列表 -->
      <view class="barns-card">
        <view class="card-header">
          <view class="card-title">牛棚列表 ({{ barns.length }})</view>
          <view class="refresh-btn" @click="loadBarns">
            <text class="iconfont icon-refresh"></text>
          </view>
        </view>
        
        <view v-if="barnsLoading" class="loading-container">
          <uni-load-more status="loading" />
        </view>
        
        <view v-else-if="barns.length > 0" class="barns-list">
          <view 
            v-for="barn in barns" 
            :key="barn.id"
            class="barn-item"
            @click="viewBarnDetail(barn)"
          >
            <view class="barn-info">
              <view class="barn-header">
                <view class="barn-name">{{ barn.name }}</view>
                <view class="barn-code">{{ barn.code }}</view>
              </view>
              <view class="barn-stats">
                <view class="stat-item">
                  <text class="stat-label">容量:</text>
                  <text class="stat-value">{{ barn.capacity }}</text>
                </view>
                <view class="stat-item">
                  <text class="stat-label">当前:</text>
                  <text class="stat-value">{{ barn.currentCount }}</text>
                </view>
                <view class="stat-item">
                  <text class="stat-label">类型:</text>
                  <text class="stat-value">{{ barn.barnType || '--' }}</text>
                </view>
              </view>
              <view class="capacity-bar">
                <view class="capacity-progress" :style="{ width: getCapacityPercent(barn) + '%' }"></view>
              </view>
            </view>
            <view class="barn-arrow">
              <text class="iconfont icon-arrow-right"></text>
            </view>
          </view>
        </view>
        
        <view v-else class="empty-state">
          <text>暂无牛棚数据</text>
        </view>
      </view>

      <!-- 统计信息 -->
      <view class="stats-card">
        <view class="card-title">统计信息</view>
        <view class="stats-grid">
          <view class="stat-card">
            <view class="stat-number">{{ stats.totalBarns }}</view>
            <view class="stat-label">牛棚总数</view>
          </view>
          <view class="stat-card">
            <view class="stat-number">{{ stats.totalCapacity }}</view>
            <view class="stat-label">总容量</view>
          </view>
          <view class="stat-card">
            <view class="stat-number">{{ stats.totalCattle }}</view>
            <view class="stat-label">牛只总数</view>
          </view>
          <view class="stat-card">
            <view class="stat-number">{{ stats.utilizationRate }}%</view>
            <view class="stat-label">利用率</view>
          </view>
        </view>
      </view>
    </view>
    
    <view v-else class="error-state">
      <text>基地信息加载失败</text>
      <button @click="loadBaseDetail" class="retry-btn">重试</button>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useBaseStore } from '@/stores/base'
import { useBarnStore } from '@/stores/barn'
import { useCacheStore } from '@/stores/cache'

const baseStore = useBaseStore()
const barnStore = useBarnStore()
const cacheStore = useCacheStore()

const baseInfo = ref(null)
const barns = ref([])
const loading = ref(false)
const barnsLoading = ref(false)
const baseId = ref(null)

// 统计信息
const stats = computed(() => {
  const totalBarns = barns.value.length
  const totalCapacity = barns.value.reduce((sum, barn) => sum + (barn.capacity || 0), 0)
  const totalCattle = barns.value.reduce((sum, barn) => sum + (barn.currentCount || 0), 0)
  const utilizationRate = totalCapacity > 0 ? Math.round((totalCattle / totalCapacity) * 100) : 0
  
  return {
    totalBarns,
    totalCapacity,
    totalCattle,
    utilizationRate
  }
})

onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  baseId.value = currentPage.options.id
  
  if (baseId.value) {
    loadBaseDetail()
    loadBarns()
  }
})

// 加载基地详情
const loadBaseDetail = async () => {
  if (!baseId.value) return
  
  loading.value = true
  try {
    const response = await uni.request({
      url: `/api/v1/bases/${baseId.value}`,
      method: 'GET'
    })
    
    if (response.data.success) {
      baseInfo.value = response.data.data
      // 缓存基地详情
      cacheStore.setCacheData(`base_${baseId.value}`, baseInfo.value)
    } else {
      throw new Error(response.data.message || '获取基地详情失败')
    }
  } catch (error) {
    console.error('获取基地详情失败:', error)
    // 尝试从缓存加载
    const cachedBase = cacheStore.getCacheData(`base_${baseId.value}`)
    if (cachedBase) {
      baseInfo.value = cachedBase
      uni.showToast({
        title: '已加载离线数据',
        icon: 'none'
      })
    } else {
      uni.showToast({
        title: '获取基地详情失败',
        icon: 'error'
      })
    }
  } finally {
    loading.value = false
  }
}

// 加载牛棚列表
const loadBarns = async () => {
  if (!baseId.value) return
  
  barnsLoading.value = true
  try {
    const response = await uni.request({
      url: `/api/v1/barns?baseId=${baseId.value}`,
      method: 'GET'
    })
    
    if (response.data.success) {
      barns.value = response.data.data
      // 缓存牛棚数据
      cacheStore.setCacheData(`barns_${baseId.value}`, barns.value)
    } else {
      throw new Error(response.data.message || '获取牛棚列表失败')
    }
  } catch (error) {
    console.error('获取牛棚列表失败:', error)
    // 尝试从缓存加载
    const cachedBarns = cacheStore.getCacheData(`barns_${baseId.value}`)
    if (cachedBarns) {
      barns.value = cachedBarns
      uni.showToast({
        title: '已加载离线数据',
        icon: 'none'
      })
    } else {
      uni.showToast({
        title: '获取牛棚列表失败',
        icon: 'error'
      })
    }
  } finally {
    barnsLoading.value = false
  }
}

// 计算容量百分比
const getCapacityPercent = (barn) => {
  if (!barn.capacity || barn.capacity === 0) return 0
  return Math.min((barn.currentCount / barn.capacity) * 100, 100)
}

// 查看牛棚详情
const viewBarnDetail = (barn) => {
  uni.navigateTo({
    url: `/pages/barn/detail?id=${barn.id}`
  })
}

// 打开地图导航
const openLocation = async () => {
  if (!baseInfo.value) return
  
  try {
    const location = await baseStore.getBaseLocation(baseId.value)
    
    if (location && location.latitude && location.longitude) {
      uni.openLocation({
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        name: baseInfo.value.name,
        address: location.address || baseInfo.value.address,
        scale: 15
      })
    } else {
      uni.showToast({
        title: '基地位置信息不完整',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('获取基地位置失败:', error)
    uni.showToast({
      title: '获取位置失败',
      icon: 'error'
    })
  }
}
</script>

<style lang="scss" scoped>
.base-detail-container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.loading-container {
  padding: 40rpx;
  text-align: center;
}

.detail-content {
  .info-card, .barns-card, .stats-card {
    background: white;
    border-radius: 16rpx;
    margin-bottom: 20rpx;
    padding: 30rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30rpx;
    
    .card-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
    
    .location-btn {
      display: flex;
      align-items: center;
      gap: 8rpx;
      color: #1890ff;
      font-size: 28rpx;
      padding: 10rpx 20rpx;
      background: #f0f8ff;
      border-radius: 20rpx;
    }
    
    .refresh-btn {
      color: #1890ff;
      font-size: 32rpx;
      padding: 10rpx;
    }
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30rpx;
    
    .info-item {
      &.full-width {
        grid-column: 1 / -1;
      }
      
      .label {
        font-size: 26rpx;
        color: #666;
        margin-bottom: 8rpx;
      }
      
      .value {
        font-size: 30rpx;
        color: #333;
        font-weight: 500;
      }
    }
  }
  
  .barns-list {
    .barn-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 25rpx 0;
      border-bottom: 1rpx solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .barn-info {
        flex: 1;
        
        .barn-header {
          display: flex;
          align-items: center;
          gap: 15rpx;
          margin-bottom: 15rpx;
          
          .barn-name {
            font-size: 30rpx;
            font-weight: bold;
            color: #333;
          }
          
          .barn-code {
            font-size: 24rpx;
            color: #999;
            background: #f5f5f5;
            padding: 4rpx 12rpx;
            border-radius: 12rpx;
          }
        }
        
        .barn-stats {
          display: flex;
          gap: 30rpx;
          margin-bottom: 15rpx;
          
          .stat-item {
            .stat-label {
              font-size: 24rpx;
              color: #666;
              margin-right: 8rpx;
            }
            
            .stat-value {
              font-size: 26rpx;
              color: #333;
              font-weight: 500;
            }
          }
        }
        
        .capacity-bar {
          width: 100%;
          height: 8rpx;
          background: #f0f0f0;
          border-radius: 4rpx;
          overflow: hidden;
          
          .capacity-progress {
            height: 100%;
            background: linear-gradient(90deg, #52c41a, #73d13d);
            transition: width 0.3s ease;
          }
        }
      }
      
      .barn-arrow {
        color: #ccc;
        font-size: 24rpx;
        margin-left: 20rpx;
      }
    }
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20rpx;
    
    .stat-card {
      text-align: center;
      padding: 30rpx 20rpx;
      background: #f8f9fa;
      border-radius: 12rpx;
      
      .stat-number {
        font-size: 40rpx;
        font-weight: bold;
        color: #1890ff;
        margin-bottom: 8rpx;
      }
      
      .stat-label {
        font-size: 26rpx;
        color: #666;
      }
    }
  }
  
  .empty-state {
    text-align: center;
    padding: 60rpx;
    color: #999;
    font-size: 28rpx;
  }
}

.error-state {
  text-align: center;
  padding: 100rpx 40rpx;
  
  text {
    display: block;
    color: #999;
    font-size: 28rpx;
    margin-bottom: 40rpx;
  }
  
  .retry-btn {
    background: #1890ff;
    color: white;
    border: none;
    border-radius: 8rpx;
    padding: 20rpx 40rpx;
    font-size: 28rpx;
  }
}
</style>