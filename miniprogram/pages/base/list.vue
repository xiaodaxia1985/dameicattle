<template>
  <view class="base-list-container">
    <!-- 当前基地显示 -->
    <view class="current-base-section">
      <view class="section-title">当前基地</view>
      <view v-if="currentBase" class="current-base-card" @click="showBaseSelector = true">
        <view class="base-info">
          <view class="base-name">{{ currentBase.name }}</view>
          <view class="base-code">编号: {{ currentBase.code }}</view>
          <view class="base-address">{{ currentBase.address }}</view>
        </view>
        <view class="switch-icon">
          <text class="iconfont icon-switch"></text>
        </view>
      </view>
      <view v-else class="no-base-selected" @click="showBaseSelector = true">
        <text>点击选择基地</text>
      </view>
    </view>

    <!-- 基地列表 -->
    <view class="base-list-section">
      <view class="section-header">
        <view class="section-title">所有基地</view>
        <view class="refresh-btn" @click="refreshBases">
          <text class="iconfont icon-refresh"></text>
        </view>
      </view>
      
      <view v-if="loading" class="loading-container">
        <uni-load-more status="loading" />
      </view>
      
      <view v-else class="base-list">
        <view 
          v-for="base in bases" 
          :key="base.id" 
          class="base-item"
          @click="selectBase(base)"
        >
          <view class="base-content">
            <view class="base-header">
              <view class="base-name">{{ base.name }}</view>
              <view v-if="base.id === currentBase?.id" class="current-tag">当前</view>
            </view>
            <view class="base-details">
              <view class="detail-item">
                <text class="label">编号:</text>
                <text class="value">{{ base.code }}</text>
              </view>
              <view class="detail-item">
                <text class="label">面积:</text>
                <text class="value">{{ base.area || '--' }} 亩</text>
              </view>
              <view class="detail-item">
                <text class="label">负责人:</text>
                <text class="value">{{ base.managerName || '--' }}</text>
              </view>
            </view>
            <view class="base-address">{{ base.address }}</view>
          </view>
          <view class="base-actions">
            <view class="action-btn" @click.stop="viewBaseDetail(base)">
              <text class="iconfont icon-detail"></text>
            </view>
            <view class="action-btn" @click.stop="navigateToBase(base)">
              <text class="iconfont icon-location"></text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 基地选择弹窗 -->
    <uni-popup ref="baseSelectorPopup" type="bottom">
      <view class="base-selector">
        <view class="selector-header">
          <view class="selector-title">选择基地</view>
          <view class="close-btn" @click="showBaseSelector = false">
            <text class="iconfont icon-close"></text>
          </view>
        </view>
        <view class="selector-list">
          <view 
            v-for="base in bases" 
            :key="base.id"
            class="selector-item"
            :class="{ active: base.id === currentBase?.id }"
            @click="selectBase(base)"
          >
            <view class="item-content">
              <view class="item-name">{{ base.name }}</view>
              <view class="item-code">{{ base.code }}</view>
            </view>
            <view v-if="base.id === currentBase?.id" class="check-icon">
              <text class="iconfont icon-check"></text>
            </view>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useBaseStore } from '@/stores/base'
import { useCacheStore } from '@/stores/cache'

const baseStore = useBaseStore()
const cacheStore = useCacheStore()

const { bases, currentBase, loading } = baseStore
const showBaseSelector = ref(false)

// 监听基地选择器显示状态
watch(showBaseSelector, (newVal) => {
  if (newVal) {
    uni.$refs.baseSelectorPopup?.open()
  } else {
    uni.$refs.baseSelectorPopup?.close()
  }
})

onMounted(async () => {
  await loadBases()
  // 从缓存恢复当前基地
  const cachedBase = uni.getStorageSync('currentBase')
  if (cachedBase && !currentBase.value) {
    baseStore.setCurrentBase(cachedBase)
  }
})

// 加载基地列表
const loadBases = async () => {
  try {
    await baseStore.fetchAllBases()
    // 缓存基地数据
    cacheStore.setCacheData('bases', bases.value)
  } catch (error) {
    console.error('加载基地失败:', error)
    // 尝试从缓存加载
    const cachedBases = cacheStore.getCacheData('bases')
    if (cachedBases && cachedBases.length > 0) {
      bases.value = cachedBases
      uni.showToast({
        title: '已加载离线数据',
        icon: 'none'
      })
    } else {
      uni.showToast({
        title: '加载基地失败',
        icon: 'error'
      })
    }
  }
}

// 刷新基地列表
const refreshBases = async () => {
  await loadBases()
  uni.showToast({
    title: '刷新成功',
    icon: 'success'
  })
}

// 选择基地
const selectBase = (base) => {
  baseStore.setCurrentBase(base)
  showBaseSelector.value = false
  
  uni.showToast({
    title: `已切换到${base.name}`,
    icon: 'success'
  })
  
  // 触发其他页面数据刷新
  uni.$emit('baseChanged', base)
}

// 查看基地详情
const viewBaseDetail = (base) => {
  uni.navigateTo({
    url: `/pages/base/detail?id=${base.id}`
  })
}

// 导航到基地
const navigateToBase = async (base) => {
  try {
    // 获取基地位置信息
    const location = await baseStore.getBaseLocation(base.id)
    
    if (location && location.latitude && location.longitude) {
      uni.openLocation({
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        name: base.name,
        address: location.address || base.address,
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
.base-list-container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.current-base-section {
  margin-bottom: 30rpx;
  
  .section-title {
    font-size: 32rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
  }
  
  .current-base-card {
    background: linear-gradient(135deg, #1890ff, #40a9ff);
    border-radius: 16rpx;
    padding: 30rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.3);
    
    .base-info {
      flex: 1;
      
      .base-name {
        font-size: 36rpx;
        font-weight: bold;
        color: white;
        margin-bottom: 10rpx;
      }
      
      .base-code {
        font-size: 28rpx;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 8rpx;
      }
      
      .base-address {
        font-size: 26rpx;
        color: rgba(255, 255, 255, 0.7);
      }
    }
    
    .switch-icon {
      color: white;
      font-size: 40rpx;
    }
  }
  
  .no-base-selected {
    background: #fff;
    border: 2rpx dashed #d9d9d9;
    border-radius: 16rpx;
    padding: 60rpx;
    text-align: center;
    color: #999;
    font-size: 30rpx;
  }
}

.base-list-section {
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    
    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
    
    .refresh-btn {
      padding: 10rpx;
      color: #1890ff;
      font-size: 32rpx;
    }
  }
  
  .loading-container {
    padding: 40rpx;
    text-align: center;
  }
  
  .base-list {
    .base-item {
      background: white;
      border-radius: 16rpx;
      margin-bottom: 20rpx;
      padding: 30rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);
      
      .base-content {
        flex: 1;
        
        .base-header {
          display: flex;
          align-items: center;
          margin-bottom: 15rpx;
          
          .base-name {
            font-size: 32rpx;
            font-weight: bold;
            color: #333;
            margin-right: 15rpx;
          }
          
          .current-tag {
            background: #52c41a;
            color: white;
            font-size: 22rpx;
            padding: 4rpx 12rpx;
            border-radius: 12rpx;
          }
        }
        
        .base-details {
          display: flex;
          flex-wrap: wrap;
          margin-bottom: 10rpx;
          
          .detail-item {
            margin-right: 30rpx;
            margin-bottom: 8rpx;
            
            .label {
              font-size: 26rpx;
              color: #666;
              margin-right: 8rpx;
            }
            
            .value {
              font-size: 26rpx;
              color: #333;
            }
          }
        }
        
        .base-address {
          font-size: 26rpx;
          color: #999;
        }
      }
      
      .base-actions {
        display: flex;
        flex-direction: column;
        gap: 15rpx;
        
        .action-btn {
          width: 60rpx;
          height: 60rpx;
          background: #f0f0f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          font-size: 28rpx;
          
          &:active {
            background: #e0e0e0;
          }
        }
      }
    }
  }
}

.base-selector {
  background: white;
  border-radius: 20rpx 20rpx 0 0;
  max-height: 80vh;
  
  .selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    .selector-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #333;
    }
    
    .close-btn {
      color: #999;
      font-size: 32rpx;
    }
  }
  
  .selector-list {
    max-height: 60vh;
    overflow-y: auto;
    
    .selector-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 30rpx;
      border-bottom: 1rpx solid #f8f8f8;
      
      &.active {
        background: #f6ffed;
        
        .item-name {
          color: #52c41a;
        }
      }
      
      .item-content {
        .item-name {
          font-size: 30rpx;
          color: #333;
          margin-bottom: 8rpx;
        }
        
        .item-code {
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