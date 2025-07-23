<template>
  <view class="container">
    <!-- 基地选择 -->
    <view class="base-selector card">
      <view class="flex-between">
        <text class="title">当前基地</text>
        <view class="base-actions">
          <text class="location-btn" @tap="autoSelectNearestBase" v-if="!currentBase">
            <text class="iconfont icon-location"></text>
            <text>附近</text>
          </text>
          <text class="change-btn" @tap="showBasePicker">切换</text>
        </view>
      </view>
      <view class="base-info" @tap="viewBaseDetail" v-if="currentBase">
        <view class="base-main">
          <text class="base-name">{{ currentBase.name }}</text>
          <text class="base-distance" v-if="baseDistance">{{ formatDistance(baseDistance) }}</text>
        </view>
        <text class="base-address">{{ currentBase.address }}</text>
        <view class="base-stats" v-if="baseStats">
          <text class="stat-item">牛棚: {{ baseStats.barnCount }}个</text>
          <text class="stat-item">牛只: {{ baseStats.cattleCount }}头</text>
          <text class="stat-item">利用率: {{ baseStats.utilizationRate }}%</text>
        </view>
      </view>
      <view class="no-base-selected" v-else @tap="showBasePicker">
        <text class="select-text">点击选择基地</text>
        <text class="select-hint">或点击"附近"自动选择最近的基地</text>
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
          <view class="action-icon">
            <ModernIcon name="mobile" size="lg" />
          </view>
          <text class="action-text">扫码识别</text>
        </view>
        <view class="action-item" @tap="navigateTo('/pages/health/record')">
          <view class="action-icon">
            <ModernIcon name="medical" size="lg" />
          </view>
          <text class="action-text">健康记录</text>
        </view>
        <view class="action-item" @tap="navigateTo('/pages/feeding/record')">
          <view class="action-icon">
            <ModernIcon name="feed" size="lg" />
          </view>
          <text class="action-text">饲喂记录</text>
        </view>
        <view class="action-item" @tap="showComingSoon">
          <view class="action-icon">
            <ModernIcon name="chart" size="lg" />
          </view>
          <text class="action-text">数据统计</text>
        </view>
      </view>
    </view>

    <!-- 数据可视化 -->
    <view class="charts-section" v-if="currentBase">
      <MobileChart
        type="pie"
        title="牛只健康状态"
        subtitle="当前基地健康状况分布"
        :data="healthChartData"
        :height="250"
      />
      
      <MobileChart
        type="bar"
        title="各牛棚牛只数量"
        subtitle="当前基地牛棚分布"
        :data="barnChartData"
        :height="200"
      />
    </view>

    <!-- 待处理事项 -->
    <view class="todos card" v-if="pendingTasks.length > 0">
      <view class="section-title">
        <text>待处理事项</text>
        <view class="priority-filter">
          <text 
            class="filter-btn" 
            :class="{ active: taskFilter === 'all' }"
            @tap="setTaskFilter('all')"
          >全部</text>
          <text 
            class="filter-btn high" 
            :class="{ active: taskFilter === 'high' }"
            @tap="setTaskFilter('high')"
          >高优先级</text>
        </view>
      </view>
      <view class="todo-list">
        <view 
          class="todo-item" 
          v-for="todo in filteredTasks" 
          :key="todo.id"
          @tap="handleTaskClick(todo)"
        >
          <view class="todo-icon" :class="todo.priority">
            <text class="iconfont" :class="'icon-' + todo.type"></text>
          </view>
          <view class="todo-content">
            <text class="todo-title">{{ todo.title }}</text>
            <text class="todo-desc">{{ todo.description }}</text>
            <text class="todo-time">{{ formatTime(todo.createdAt) }}</text>
          </view>
          <view class="todo-badge" :class="todo.priority">
            {{ getPriorityText(todo.priority) }}
          </view>
        </view>
      </view>
      <view class="load-more" v-if="hasMoreTasks" @tap="loadMoreTasks">
        <text class="load-more-text">加载更多</text>
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
import { ref, onMounted, watch, computed } from 'vue'
import { useBaseStore } from '@/stores/base'
import { useDashboardStore } from '@/stores/dashboard'
import { useCacheStore } from '@/stores/cache'
import { formatDistance, formatTime } from '@/utils/location'
import MobileChart from '@/components/MobileChart.vue'
import notificationManager from '@/utils/notification'
import ModernIcon from '@/components/ModernIcon.vue'

const baseStore = useBaseStore()
const dashboardStore = useDashboardStore()
const cacheStore = useCacheStore()

const { currentBase } = baseStore
const { 
  keyIndicators, 
  pendingTasks: storePendingTasks, 
  healthDistribution,
  loading 
} = dashboardStore

const bases = ref([])
const stats = ref({})
const baseStats = ref(null)
const baseDistance = ref(null)
const basePopup = ref(null)
const taskFilter = ref('all')
const hasMoreTasks = ref(false)

onMounted(() => {
  loadData()
  
  // 监听基地变化事件
  uni.$on('baseChanged', (base) => {
    loadBaseData(base)
  })
})

// 监听当前基地变化
watch(currentBase, (newBase) => {
  if (newBase) {
    loadBaseData(newBase)
  }
})

const loadData = async () => {
  try {
    // 加载基地列表
    await baseStore.fetchAllBases()
    bases.value = baseStore.bases
    
    // 如果有当前基地，加载相关数据
    if (currentBase.value) {
      await loadBaseData(currentBase.value)
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    // 尝试从缓存加载
    const cachedBases = cacheStore.getCacheData('bases')
    if (cachedBases) {
      bases.value = cachedBases
      uni.showToast({
        title: '已加载离线数据',
        icon: 'none'
      })
    } else {
      uni.showToast({
        title: '加载数据失败',
        icon: 'error'
      })
    }
  }
}

const loadBaseData = async (base) => {
  if (!base) return
  
  try {
    // 并行加载统计数据、基地统计和距离
    const promises = [
      loadStats(base.id),
      loadBaseStats(base.id),
      loadBaseDistance(base.id)
    ]
    
    await Promise.allSettled(promises)
  } catch (error) {
    console.error('加载基地数据失败:', error)
  }
}

const loadStats = async (baseId) => {
  try {
    const response = await uni.request({
      url: `/api/v1/dashboard/stats?baseId=${baseId}`,
      method: 'GET'
    })
    
    if (response.data.success) {
      stats.value = response.data.data
      // 缓存统计数据
      cacheStore.setCacheData(`stats_${baseId}`, stats.value)
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    // 尝试从缓存加载
    const cachedStats = cacheStore.getCacheData(`stats_${baseId}`)
    if (cachedStats) {
      stats.value = cachedStats
    }
  }
}

const loadBaseStats = async (baseId) => {
  try {
    const response = await uni.request({
      url: `/api/v1/bases/${baseId}/stats`,
      method: 'GET'
    })
    
    if (response.data.success) {
      baseStats.value = response.data.data
      // 缓存基地统计
      cacheStore.setCacheData(`base_stats_${baseId}`, baseStats.value)
    }
  } catch (error) {
    console.error('加载基地统计失败:', error)
    // 尝试从缓存加载
    const cachedBaseStats = cacheStore.getCacheData(`base_stats_${baseId}`)
    if (cachedBaseStats) {
      baseStats.value = cachedBaseStats
    }
  }
}

const loadBaseDistance = async (baseId) => {
  try {
    const distance = await baseStore.getDistanceToBase(baseId)
    baseDistance.value = distance
  } catch (error) {
    console.error('计算基地距离失败:', error)
    baseDistance.value = null
  }
}

const loadTodos = async (baseId) => {
  try {
    const response = await uni.request({
      url: `/api/v1/dashboard/todos?baseId=${baseId}`,
      method: 'GET'
    })
    
    if (response.data.success) {
      todos.value = response.data.data
      // 缓存待办事项
      cacheStore.setCacheData(`todos_${baseId}`, todos.value)
    }
  } catch (error) {
    console.error('加载待办事项失败:', error)
    // 尝试从缓存加载
    const cachedTodos = cacheStore.getCacheData(`todos_${baseId}`)
    if (cachedTodos) {
      todos.value = cachedTodos
    }
  }
}

const showBasePicker = () => {
  basePopup.value.open()
}

const hideBasePicker = () => {
  basePopup.value.close()
}

const selectBase = (base) => {
  baseStore.setCurrentBase(base)
  hideBasePicker()
  
  uni.showToast({
    title: `已切换到${base.name}`,
    icon: 'success'
  })
}

const autoSelectNearestBase = async () => {
  uni.showLoading({
    title: '定位中...'
  })
  
  try {
    const nearestBase = await baseStore.autoSelectNearestBase()
    if (nearestBase) {
      // 自动选择成功，数据会通过watch自动加载
    }
  } catch (error) {
    console.error('自动选择最近基地失败:', error)
    uni.showToast({
      title: '定位失败',
      icon: 'error'
    })
  } finally {
    uni.hideLoading()
  }
}

const viewBaseDetail = () => {
  if (currentBase.value) {
    uni.navigateTo({
      url: `/pages/base/detail?id=${currentBase.value.id}`
    })
  }
}

const navigateTo = (url) => {
  if (!currentBase.value) {
    uni.showToast({
      title: '请先选择基地',
      icon: 'none'
    })
    return
  }
  
  // 在URL中添加基地ID参数
  const separator = url.includes('?') ? '&' : '?'
  const fullUrl = `${url}${separator}baseId=${currentBase.value.id}`
  
  uni.navigateTo({ url: fullUrl })
}

const showComingSoon = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  })
}

// 计算属性
const pendingTasks = computed(() => storePendingTasks.value || [])

const filteredTasks = computed(() => {
  if (taskFilter.value === 'all') {
    return pendingTasks.value
  }
  return pendingTasks.value.filter(task => task.priority === taskFilter.value)
})

const healthChartData = computed(() => {
  if (!healthDistribution.value || !Array.isArray(healthDistribution.value)) {
    return []
  }
  
  const colorMap = {
    healthy: '#52c41a',
    sick: '#ff4d4f',
    treatment: '#faad14'
  }
  
  const labelMap = {
    healthy: '健康',
    sick: '患病',
    treatment: '治疗中'
  }
  
  return healthDistribution.value.map(item => ({
    name: labelMap[item.status] || item.status,
    value: item.count,
    color: colorMap[item.status]
  }))
})

const barnChartData = computed(() => {
  if (!baseStats.value || !baseStats.value.barnStats) {
    return []
  }
  
  return baseStats.value.barnStats.map((barn, index) => ({
    name: barn.name,
    value: barn.cattleCount,
    color: ['#1890ff', '#52c41a', '#faad14', '#f5222d'][index % 4]
  }))
})

// 任务相关方法
const setTaskFilter = (filter) => {
  taskFilter.value = filter
}

const handleTaskClick = (task) => {
  // 处理任务点击事件
  if (task.url) {
    uni.navigateTo({
      url: task.url
    })
  } else {
    // 根据任务类型跳转到相应页面
    switch (task.type) {
      case 'health_alert':
        navigateTo('/pages/health/list')
        break
      case 'equipment_failure':
        navigateTo('/pages/equipment/list')
        break
      case 'inventory_alert':
        navigateTo('/pages/materials/list')
        break
      default:
        uni.showToast({
          title: '查看任务详情',
          icon: 'none'
        })
    }
  }
}

const loadMoreTasks = async () => {
  try {
    uni.showLoading({ title: '加载中...' })
    
    // 这里可以实现加载更多任务的逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    uni.hideLoading()
    uni.showToast({
      title: '暂无更多数据',
      icon: 'none'
    })
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '加载失败',
      icon: 'error'
    })
  }
}

const getTaskIcon = (type) => {
  const iconMap = {
    health_alert: 'icon-health',
    equipment_failure: 'icon-equipment',
    inventory_alert: 'icon-inventory',
    feeding_reminder: 'icon-feeding'
  }
  return iconMap[type] || 'icon-task'
}

const getPriorityText = (priority) => {
  const textMap = {
    high: '高',
    medium: '中',
    low: '低'
  }
  return textMap[priority] || priority
}
</script>

<style lang="scss" scoped>
.base-selector {
  .title {
    font-size: 32rpx;
    font-weight: 600;
  }
  
  .base-actions {
    display: flex;
    align-items: center;
    gap: 20rpx;
    
    .location-btn {
      display: flex;
      align-items: center;
      gap: 8rpx;
      color: #52c41a;
      font-size: 26rpx;
      padding: 8rpx 16rpx;
      background: #f6ffed;
      border-radius: 16rpx;
    }
    
    .change-btn {
      color: #1890ff;
      font-size: 28rpx;
    }
  }
  
  .base-info {
    margin-top: 20rpx;
    
    .base-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8rpx;
      
      .base-name {
        font-size: 36rpx;
        font-weight: 600;
        color: #333;
      }
      
      .base-distance {
        font-size: 24rpx;
        color: #52c41a;
        background: #f6ffed;
        padding: 4rpx 12rpx;
        border-radius: 12rpx;
      }
    }
    
    .base-address {
      font-size: 28rpx;
      color: #999;
      margin-bottom: 12rpx;
    }
    
    .base-stats {
      display: flex;
      gap: 20rpx;
      
      .stat-item {
        font-size: 24rpx;
        color: #666;
        background: #f5f5f5;
        padding: 6rpx 12rpx;
        border-radius: 12rpx;
      }
    }
  }
  
  .no-base-selected {
    margin-top: 20rpx;
    text-align: center;
    padding: 40rpx 20rpx;
    border: 2rpx dashed #d9d9d9;
    border-radius: 12rpx;
    
    .select-text {
      display: block;
      font-size: 30rpx;
      color: #666;
      margin-bottom: 8rpx;
    }
    
    .select-hint {
      font-size: 24rpx;
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
.chart
s-section {
  margin: 0 20rpx 20rpx;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
  
  .priority-filter {
    display: flex;
    gap: 16rpx;
    
    .filter-btn {
      font-size: 24rpx;
      padding: 8rpx 16rpx;
      border-radius: 16rpx;
      background: #f5f5f5;
      color: #666;
      
      &.active {
        background: #1890ff;
        color: #fff;
      }
      
      &.high.active {
        background: #ff4d4f;
      }
    }
  }
}

.todo-list {
  .todo-item {
    display: flex;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .todo-icon {
      width: 60rpx;
      height: 60rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 20rpx;
      
      .iconfont {
        font-size: 28rpx;
      }
      
      &.high {
        background: rgba(255, 77, 79, 0.1);
        color: #ff4d4f;
      }
      
      &.medium {
        background: rgba(250, 173, 20, 0.1);
        color: #faad14;
      }
      
      &.low {
        background: rgba(24, 144, 255, 0.1);
        color: #1890ff;
      }
    }
    
    .todo-content {
      flex: 1;
      
      .todo-title {
        display: block;
        font-size: 30rpx;
        color: #333;
        margin-bottom: 8rpx;
      }
      
      .todo-desc {
        font-size: 26rpx;
        color: #999;
        margin-bottom: 8rpx;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .todo-time {
        font-size: 24rpx;
        color: #ccc;
      }
    }
    
    .todo-badge {
      padding: 8rpx 16rpx;
      border-radius: 20rpx;
      font-size: 24rpx;
      color: #fff;
      
      &.high {
        background: #ff4d4f;
      }
      
      &.medium {
        background: #faad14;
      }
      
      &.low {
        background: #1890ff;
      }
    }
  }
}

.load-more {
  text-align: center;
  padding: 32rpx 0;
  border-top: 1rpx solid #f0f0f0;
  
  .load-more-text {
    font-size: 28rpx;
    color: #1890ff;
  }
}