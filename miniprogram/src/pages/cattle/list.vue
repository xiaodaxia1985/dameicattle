<template>
  <view class="container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input">
        <input 
          v-model="searchKeyword" 
          placeholder="搜索耳标号、品种"
          @input="onSearchInput"
          @confirm="handleSearch"
        />
        <ModernIcon name="search" @click="handleSearch" />
      </view>
      <text class="filter-btn" @tap="showFilterPopup">筛选</text>
    </view>

    <!-- 统计卡片 -->
    <view class="stats-cards">
      <view class="stat-card">
        <text class="stat-number">{{ statistics.total || 0 }}</text>
        <text class="stat-label">总数量</text>
      </view>
      <view class="stat-card healthy">
        <text class="stat-number">{{ getHealthyCount() }}</text>
        <text class="stat-label">健康</text>
      </view>
      <view class="stat-card sick">
        <text class="stat-number">{{ getSickCount() }}</text>
        <text class="stat-label">患病</text>
      </view>
      <view class="stat-card treatment">
        <text class="stat-number">{{ getTreatmentCount() }}</text>
        <text class="stat-label">治疗中</text>
      </view>
    </view>

    <!-- 牛只列表 -->
    <view class="cattle-list">
      <view 
        class="cattle-card" 
        v-for="cattle in cattleList" 
        :key="cattle.id"
        @tap="viewCattleDetail(cattle)"
      >
        <!-- 牛只照片 -->
        <view class="cattle-photo">
          <image 
            v-if="cattle.photos && cattle.photos.length > 0"
            :src="cattle.photos[0]" 
            mode="aspectFill"
            class="photo"
            @error="onPhotoError"
          />
          <view v-else class="photo-placeholder">
            <ModernIcon name="camera" />
          </view>
        </view>

        <!-- 牛只信息 -->
        <view class="cattle-info">
          <view class="cattle-header">
            <text class="ear-tag">{{ cattle.ear_tag }}</text>
            <view class="health-status" :class="cattle.health_status">
              <text>{{ getHealthStatusText(cattle.health_status) }}</text>
            </view>
          </view>
          
          <view class="cattle-details">
            <view class="detail-row">
              <text class="label">品种:</text>
              <text class="value">{{ cattle.breed }}</text>
            </view>
            <view class="detail-row">
              <text class="label">性别:</text>
              <text class="value">{{ cattle.gender === 'male' ? '公' : '母' }}</text>
            </view>
            <view class="detail-row" v-if="cattle.weight">
              <text class="label">体重:</text>
              <text class="value">{{ cattle.weight }}kg</text>
            </view>
            <view class="detail-row" v-if="cattle.age_months">
              <text class="label">月龄:</text>
              <text class="value">{{ cattle.age_months }}个月</text>
            </view>
          </view>

          <view class="cattle-location" v-if="cattle.barn">
            <text class="location-text">
              <ModernIcon name="location" size="sm" /> {{ cattle.barn.name }}
            </text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="cattle-actions" @tap.stop>
          <text class="action-btn" @tap="quickRecord(cattle)">记录</text>
          <text class="action-btn" @tap="takeCattlePhoto(cattle)">拍照</text>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="hasMore">
      <text class="load-text" @tap="loadMore" v-if="!loading">加载更多</text>
      <text class="load-text" v-else>加载中...</text>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="!loading && cattleList.length === 0">
      <view class="empty-icon">
        <ModernIcon name="cattle" size="xl" />
      </view>
      <text class="empty-text">暂无牛只数据</text>
      <text class="empty-hint">请检查网络连接或联系管理员</text>
    </view>

    <!-- 筛选弹窗 -->
    <uni-popup ref="filterPopup" type="bottom">
      <view class="filter-panel">
        <view class="filter-header">
          <text class="filter-title">筛选条件</text>
          <text class="filter-reset" @tap="resetFilter">重置</text>
        </view>
        
        <view class="filter-content">
          <view class="filter-group">
            <text class="group-title">健康状态</text>
            <view class="filter-options">
              <text 
                class="filter-option" 
                :class="{ active: filters.healthStatus === 'healthy' }"
                @tap="setFilter('healthStatus', 'healthy')"
              >健康</text>
              <text 
                class="filter-option" 
                :class="{ active: filters.healthStatus === 'sick' }"
                @tap="setFilter('healthStatus', 'sick')"
              >患病</text>
              <text 
                class="filter-option" 
                :class="{ active: filters.healthStatus === 'treatment' }"
                @tap="setFilter('healthStatus', 'treatment')"
              >治疗中</text>
            </view>
          </view>

          <view class="filter-group">
            <text class="group-title">性别</text>
            <view class="filter-options">
              <text 
                class="filter-option" 
                :class="{ active: filters.gender === 'male' }"
                @tap="setFilter('gender', 'male')"
              >公牛</text>
              <text 
                class="filter-option" 
                :class="{ active: filters.gender === 'female' }"
                @tap="setFilter('gender', 'female')"
              >母牛</text>
            </view>
          </view>
        </view>

        <view class="filter-actions">
          <button class="cancel-btn" @tap="hideFilterPopup">取消</button>
          <button class="confirm-btn" @tap="applyFilter">确定</button>
        </view>
      </view>
    </uni-popup>

    <!-- 快速记录弹窗 -->
    <uni-popup ref="recordPopup" type="center">
      <view class="record-panel">
        <view class="record-header">
          <text class="record-title">快速记录</text>
        </view>
        <view class="record-content">
          <view class="record-cattle" v-if="selectedCattle">
            <text class="cattle-tag">{{ selectedCattle.ear_tag }}</text>
            <text class="cattle-breed">{{ selectedCattle.breed }}</text>
          </view>
          <view class="record-options">
            <view class="record-option" @tap="recordHealth">
              <view class="option-icon">
                <ModernIcon name="medical" size="lg" />
              </view>
              <text class="option-text">健康记录</text>
            </view>
            <view class="record-option" @tap="recordFeeding">
              <view class="option-icon">
                <ModernIcon name="feed" size="lg" />
              </view>
              <text class="option-text">饲喂记录</text>
            </view>
            <view class="record-option" @tap="recordWeight">
              <view class="option-icon">
                <ModernIcon name="chart" size="lg" />
              </view>
              <text class="option-text">称重记录</text>
            </view>
          </view>
        </view>
        <view class="record-actions">
          <button class="cancel-btn" @tap="hideRecordPopup">取消</button>
        </view>
      </view>
    </uni-popup>

    <!-- 悬浮按钮 -->
    <view class="fab-container">
      <view class="fab" @tap="showFabMenu">
        <text class="fab-icon">{{ showFabOptions ? '✕' : '+' }}</text>
      </view>
      <view class="fab-options" v-if="showFabOptions">
        <view class="fab-option" @tap="startScan">
          <view class="fab-option-icon">
            <ModernIcon name="mobile" />
          </view>
          <text class="fab-option-text">扫码</text>
        </view>
        <view class="fab-option" @tap="refreshData">
          <view class="fab-option-icon">
            <ModernIcon name="refresh" />
          </view>
          <text class="fab-option-text">刷新</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted, onShow } from 'vue'
import { useCattleStore } from '@/stores/cattle'
import { useBaseStore } from '@/stores/base'
import ModernIcon from '@/components/ModernIcon.vue'

const cattleStore = useCattleStore()
const baseStore = useBaseStore()

const cattleList = ref([])
const statistics = ref({})
const loading = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const searchKeyword = ref('')
const selectedCattle = ref(null)
const showFabOptions = ref(false)

const filters = reactive({
  healthStatus: '',
  gender: '',
  baseId: ''
})

const filterPopup = ref(null)
const recordPopup = ref(null)

onMounted(() => {
  loadData()
})

onShow(() => {
  // 页面显示时刷新数据
  refreshData()
})

const loadData = async () => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    // 获取当前基地ID
    const currentBase = baseStore.currentBase
    if (!currentBase) {
      uni.showToast({
        title: '请先选择基地',
        icon: 'none'
      })
      return
    }

    // 构建查询参数
    const params = {
      page: currentPage.value,
      limit: 20,
      baseId: currentBase.id,
      search: searchKeyword.value,
      ...filters
    }

    // 加载牛只列表
    const response = await cattleStore.fetchCattleList(params)
    
    if (currentPage.value === 1) {
      cattleList.value = response.data
    } else {
      cattleList.value.push(...response.data)
    }
    
    hasMore.value = response.data.length === 20
    
    // 加载统计数据
    await loadStatistics(currentBase.id)
    
  } catch (error) {
    console.error('加载数据失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const loadStatistics = async (baseId) => {
  try {
    const stats = await cattleStore.fetchCattleStatistics(baseId)
    statistics.value = stats
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const refreshData = () => {
  currentPage.value = 1
  hasMore.value = true
  loadData()
}

const loadMore = () => {
  if (hasMore.value && !loading.value) {
    currentPage.value++
    loadData()
  }
}

const onSearchInput = (e) => {
  searchKeyword.value = e.detail.value
}

const handleSearch = () => {
  currentPage.value = 1
  hasMore.value = true
  loadData()
}

const showFilterPopup = () => {
  filterPopup.value.open()
}

const hideFilterPopup = () => {
  filterPopup.value.close()
}

const setFilter = (key, value) => {
  if (filters[key] === value) {
    filters[key] = ''
  } else {
    filters[key] = value
  }
}

const resetFilter = () => {
  Object.keys(filters).forEach(key => {
    filters[key] = ''
  })
}

const applyFilter = () => {
  hideFilterPopup()
  currentPage.value = 1
  hasMore.value = true
  loadData()
}

const viewCattleDetail = (cattle) => {
  uni.navigateTo({
    url: `/pages/cattle/detail?id=${cattle.id}`
  })
}

const quickRecord = (cattle) => {
  selectedCattle.value = cattle
  recordPopup.value.open()
}

const hideRecordPopup = () => {
  selectedCattle.value = null
  recordPopup.value.close()
}

const recordHealth = () => {
  hideRecordPopup()
  uni.navigateTo({
    url: `/pages/health/record?cattleId=${selectedCattle.value.id}`
  })
}

const recordFeeding = () => {
  hideRecordPopup()
  uni.navigateTo({
    url: `/pages/feeding/record?cattleId=${selectedCattle.value.id}`
  })
}

const recordWeight = () => {
  hideRecordPopup()
  // 这里可以实现快速称重记录功能
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

const takeCattlePhoto = (cattle) => {
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: (res) => {
      // 这里可以实现照片上传功能
      console.log('拍照成功:', res)
      uni.showToast({
        title: '照片上传功能开发中',
        icon: 'none'
      })
    },
    fail: (err) => {
      console.error('拍照失败:', err)
    }
  })
}

const showFabMenu = () => {
  showFabOptions.value = !showFabOptions.value
}

const startScan = () => {
  showFabOptions.value = false
  uni.navigateTo({
    url: '/pages/scan/index'
  })
}

const onPhotoError = (e) => {
  console.log('图片加载失败:', e)
}

const getHealthyCount = () => {
  if (!statistics.value.health_status) return 0
  const healthy = statistics.value.health_status.find(item => item.health_status === 'healthy')
  return healthy ? healthy.count : 0
}

const getSickCount = () => {
  if (!statistics.value.health_status) return 0
  const sick = statistics.value.health_status.find(item => item.health_status === 'sick')
  return sick ? sick.count : 0
}

const getTreatmentCount = () => {
  if (!statistics.value.health_status) return 0
  const treatment = statistics.value.health_status.find(item => item.health_status === 'treatment')
  return treatment ? treatment.count : 0
}

const getHealthStatusText = (status) => {
  switch (status) {
    case 'healthy': return '健康'
    case 'sick': return '患病'
    case 'treatment': return '治疗中'
    default: return '未知'
  }
}
</script>

<style lang="scss" scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx;
  background: #fff;
  
  .search-input {
    flex: 1;
    display: flex;
    align-items: center;
    background: #f5f5f5;
    border-radius: 50rpx;
    padding: 0 30rpx;
    height: 70rpx;
    
    input {
      flex: 1;
      font-size: 28rpx;
    }
    
    .search-icon {
      font-size: 32rpx;
      color: #999;
    }
  }
  
  .filter-btn {
    color: #1890ff;
    font-size: 28rpx;
    padding: 0 20rpx;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
  padding: 20rpx;
  background: #fff;
  margin-bottom: 20rpx;
}

.stat-card {
  text-align: center;
  padding: 20rpx 10rpx;
  border-radius: 12rpx;
  background: #f8f9fa;
  
  .stat-number {
    display: block;
    font-size: 36rpx;
    font-weight: 600;
    color: #1890ff;
    margin-bottom: 8rpx;
  }
  
  .stat-label {
    font-size: 24rpx;
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

.cattle-list {
  padding: 0 20rpx;
}

.cattle-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  
  .cattle-photo {
    width: 120rpx;
    height: 120rpx;
    border-radius: 12rpx;
    overflow: hidden;
    margin-right: 24rpx;
    
    .photo {
      width: 100%;
      height: 100%;
    }
    
    .photo-placeholder {
      width: 100%;
      height: 100%;
      background: #f5f5f5;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .photo-icon {
        font-size: 40rpx;
        color: #ccc;
      }
    }
  }
  
  .cattle-info {
    flex: 1;
    
    .cattle-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16rpx;
      
      .ear-tag {
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
      }
      
      .health-status {
        padding: 6rpx 16rpx;
        border-radius: 20rpx;
        font-size: 22rpx;
        
        &.healthy {
          background: #f6ffed;
          color: #52c41a;
        }
        
        &.sick {
          background: #fff2f0;
          color: #ff4d4f;
        }
        
        &.treatment {
          background: #fffbe6;
          color: #faad14;
        }
      }
    }
    
    .cattle-details {
      margin-bottom: 12rpx;
      
      .detail-row {
        display: flex;
        margin-bottom: 6rpx;
        
        .label {
          width: 80rpx;
          font-size: 26rpx;
          color: #999;
        }
        
        .value {
          font-size: 26rpx;
          color: #333;
        }
      }
    }
    
    .cattle-location {
      .location-text {
        font-size: 24rpx;
        color: #666;
      }
    }
  }
  
  .cattle-actions {
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    
    .action-btn {
      padding: 8rpx 16rpx;
      background: #f0f0f0;
      border-radius: 8rpx;
      font-size: 24rpx;
      color: #666;
      text-align: center;
      
      &:active {
        background: #e0e0e0;
      }
    }
  }
}

.load-more {
  text-align: center;
  padding: 40rpx;
  
  .load-text {
    color: #999;
    font-size: 28rpx;
  }
}

.empty-state {
  text-align: center;
  padding: 120rpx 40rpx;
  
  .empty-icon {
    display: block;
    font-size: 120rpx;
    margin-bottom: 32rpx;
  }
  
  .empty-text {
    display: block;
    font-size: 32rpx;
    color: #666;
    margin-bottom: 16rpx;
  }
  
  .empty-hint {
    font-size: 26rpx;
    color: #999;
  }
}

.filter-panel {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  
  .filter-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx 40rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    .filter-title {
      font-size: 32rpx;
      font-weight: 600;
    }
    
    .filter-reset {
      color: #1890ff;
      font-size: 28rpx;
    }
  }
  
  .filter-content {
    padding: 32rpx 40rpx;
    
    .filter-group {
      margin-bottom: 32rpx;
      
      .group-title {
        display: block;
        font-size: 28rpx;
        color: #333;
        margin-bottom: 16rpx;
      }
      
      .filter-options {
        display: flex;
        gap: 16rpx;
        
        .filter-option {
          padding: 12rpx 24rpx;
          background: #f5f5f5;
          border-radius: 20rpx;
          font-size: 26rpx;
          color: #666;
          
          &.active {
            background: #1890ff;
            color: #fff;
          }
        }
      }
    }
  }
  
  .filter-actions {
    display: flex;
    border-top: 1rpx solid #f0f0f0;
    
    .cancel-btn, .confirm-btn {
      flex: 1;
      height: 88rpx;
      border: none;
      font-size: 30rpx;
      
      &:first-child {
        border-right: 1rpx solid #f0f0f0;
      }
    }
    
    .cancel-btn {
      background: #fff;
      color: #666;
    }
    
    .confirm-btn {
      background: #1890ff;
      color: #fff;
    }
  }
}

.record-panel {
  background: #fff;
  border-radius: 16rpx;
  width: 600rpx;
  
  .record-header {
    padding: 32rpx;
    text-align: center;
    border-bottom: 1rpx solid #f0f0f0;
    
    .record-title {
      font-size: 32rpx;
      font-weight: 600;
    }
  }
  
  .record-content {
    padding: 32rpx;
    
    .record-cattle {
      text-align: center;
      margin-bottom: 32rpx;
      
      .cattle-tag {
        display: block;
        font-size: 36rpx;
        font-weight: 600;
        color: #1890ff;
        margin-bottom: 8rpx;
      }
      
      .cattle-breed {
        font-size: 28rpx;
        color: #666;
      }
    }
    
    .record-options {
      display: flex;
      justify-content: space-around;
      
      .record-option {
        text-align: center;
        
        .option-icon {
          display: block;
          font-size: 48rpx;
          margin-bottom: 12rpx;
        }
        
        .option-text {
          font-size: 24rpx;
          color: #666;
        }
      }
    }
  }
  
  .record-actions {
    border-top: 1rpx solid #f0f0f0;
    
    .cancel-btn {
      width: 100%;
      height: 88rpx;
      border: none;
      background: #fff;
      color: #666;
      font-size: 30rpx;
    }
  }
}

.fab-container {
  position: fixed;
  right: 40rpx;
  bottom: 120rpx;
  z-index: 999;
  
  .fab {
    width: 112rpx;
    height: 112rpx;
    background: #1890ff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.4);
    
    .fab-icon {
      color: #fff;
      font-size: 48rpx;
      font-weight: 300;
    }
  }
  
  .fab-options {
    position: absolute;
    bottom: 132rpx;
    right: 0;
    
    .fab-option {
      display: flex;
      align-items: center;
      background: #fff;
      border-radius: 50rpx;
      padding: 16rpx 24rpx;
      margin-bottom: 16rpx;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
      
      .fab-option-icon {
        font-size: 32rpx;
        margin-right: 12rpx;
      }
      
      .fab-option-text {
        font-size: 26rpx;
        color: #333;
      }
    }
  }
}
</style>