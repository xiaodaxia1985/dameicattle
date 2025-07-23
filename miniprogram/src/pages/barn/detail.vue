<template>
  <view class="barn-detail-container">
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading" />
    </view>
    
    <view v-else-if="barnInfo" class="detail-content">
      <!-- 牛棚基本信息 -->
      <view class="info-card">
        <view class="card-header">
          <view class="card-title">牛棚信息</view>
          <view class="status-badge" :class="utilizationRate === 0 ? 'empty' : utilizationRate >= 100 ? 'full' : utilizationRate >= 80 ? 'near-full' : 'normal'">
            {{ utilizationRate === 0 ? '空置' : utilizationRate >= 100 ? '满载' : utilizationRate >= 80 ? '接近满载' : '正常' }}
          </view>
        </view>
        
        <view class="info-grid">
          <view class="info-item">
            <view class="label">牛棚名称</view>
            <view class="value">{{ barnInfo.name }}</view>
          </view>
          <view class="info-item">
            <view class="label">牛棚编号</view>
            <view class="value">{{ barnInfo.code }}</view>
          </view>
          <view class="info-item">
            <view class="label">牛棚类型</view>
            <view class="value">{{ barnInfo.barnType || '--' }}</view>
          </view>
          <view class="info-item">
            <view class="label">所属基地</view>
            <view class="value">{{ barnInfo.baseName }}</view>
          </view>
          <view class="info-item">
            <view class="label">设计容量</view>
            <view class="value">{{ barnInfo.capacity }} 头</view>
          </view>
          <view class="info-item">
            <view class="label">当前数量</view>
            <view class="value">{{ barnInfo.currentCount }} 头</view>
          </view>
        </view>
        
        <!-- 容量使用情况 -->
        <view class="capacity-section">
          <view class="capacity-header">
            <text>容量使用情况</text>
            <text class="capacity-rate">{{ utilizationRate }}%</text>
          </view>
          <view class="capacity-bar">
            <view 
              class="capacity-fill" 
              :class="utilizationRate >= 100 ? 'full' : utilizationRate >= 80 ? 'warning' : 'normal'"
              :style="{ width: utilizationRate + '%' }"
            ></view>
          </view>
          <view class="capacity-info">
            <text>{{ barnInfo.currentCount }}/{{ barnInfo.capacity }} 头</text>
            <text>剩余容量: {{ barnInfo.capacity - barnInfo.currentCount }} 头</text>
          </view>
        </view>
      </view>

      <!-- 快捷操作 -->
      <view class="actions-card">
        <view class="card-title">快捷操作</view>
        <view class="actions-grid">
          <view class="action-item" @click="quickAction('cattle')">
            <view class="action-icon cattle">
              <text class="iconfont icon-cattle"></text>
            </view>
            <view class="action-text">牛只管理</view>
          </view>
          <view class="action-item" @click="quickAction('feeding')">
            <view class="action-icon feeding">
              <text class="iconfont icon-feeding"></text>
            </view>
            <view class="action-text">饲喂记录</view>
          </view>
          <view class="action-item" @click="quickAction('health')">
            <view class="action-icon health">
              <text class="iconfont icon-health"></text>
            </view>
            <view class="action-text">健康管理</view>
          </view>
          <view class="action-item" @click="quickAction('scan')">
            <view class="action-icon scan">
              <text class="iconfont icon-scan"></text>
            </view>
            <view class="action-text">扫码识别</view>
          </view>
        </view>
      </view>

      <!-- 牛只列表预览 -->
      <view class="cattle-preview-card">
        <view class="card-header">
          <view class="card-title">牛只列表</view>
          <view class="view-all-btn" @click="viewAllCattle">
            <text>查看全部</text>
            <text class="iconfont icon-arrow-right"></text>
          </view>
        </view>
        
        <view v-if="cattleLoading" class="loading-container">
          <uni-load-more status="loading" />
        </view>
        
        <view v-else-if="cattleList.length > 0" class="cattle-list">
          <view 
            v-for="cattle in cattleList.slice(0, 5)" 
            :key="cattle.id"
            class="cattle-item"
            @click="viewCattleDetail(cattle)"
          >
            <view class="cattle-avatar">
              <image 
                v-if="cattle.photo" 
                :src="cattle.photo" 
                mode="aspectFill"
              />
              <text v-else class="iconfont icon-cattle"></text>
            </view>
            <view class="cattle-info">
              <view class="cattle-tag">{{ cattle.earTag }}</view>
              <view class="cattle-details">
                <text>{{ cattle.breed }}</text>
                <text>{{ cattle.gender === 'male' ? '公' : '母' }}</text>
                <text>{{ cattle.weight }}kg</text>
              </view>
            </view>
            <view class="health-status" :class="cattle.healthStatus">
              {{ getHealthStatusText(cattle.healthStatus) }}
            </view>
          </view>
          
          <view v-if="cattleList.length > 5" class="more-cattle">
            <text>还有 {{ cattleList.length - 5 }} 头牛只...</text>
          </view>
        </view>
        
        <view v-else class="empty-state">
          <text>暂无牛只数据</text>
        </view>
      </view>

      <!-- 统计信息 -->
      <view class="stats-card">
        <view class="card-title">统计信息</view>
        <view class="stats-grid">
          <view class="stat-item">
            <view class="stat-number">{{ stats.healthyCount }}</view>
            <view class="stat-label">健康</view>
          </view>
          <view class="stat-item">
            <view class="stat-number">{{ stats.sickCount }}</view>
            <view class="stat-label">患病</view>
          </view>
          <view class="stat-item">
            <view class="stat-number">{{ stats.treatmentCount }}</view>
            <view class="stat-label">治疗中</view>
          </view>
          <view class="stat-item">
            <view class="stat-number">{{ stats.avgWeight }}kg</view>
            <view class="stat-label">平均体重</view>
          </view>
        </view>
      </view>
    </view>
    
    <view v-else class="error-state">
      <text>牛棚信息加载失败</text>
      <button @click="loadBarnDetail" class="retry-btn">重试</button>
    </view>
  </view>
</template>

<script>
// Simple cache utility
const cacheStore = {
  setCacheData(key, data, expirationMinutes = 60) {
    const item = {
      data,
      expiry: Date.now() + expirationMinutes * 60 * 1000
    };
    uni.setStorageSync(key, JSON.stringify(item));
  },
  getCacheData(key) {
    try {
      const item = JSON.parse(uni.getStorageSync(key) || '{}');
      if (!item.expiry || item.expiry < Date.now()) {
        uni.removeStorageSync(key);
        return null;
      }
      return item.data;
    } catch (error) {
      console.error('Error getting cache data:', error);
      return null;
    }
  }
}

export default {
  data() {
    return {
      barnInfo: null,
      cattleList: [],
      loading: false,
      cattleLoading: false,
      barnId: null
    }
  },
  computed: {
    utilizationRate() {
      if (!this.barnInfo || !this.barnInfo.capacity) return 0
      return Math.min(Math.round((this.barnInfo.currentCount / this.barnInfo.capacity) * 100), 100)
    },
    stats() {
      const healthyCount = this.cattleList.filter(c => c.healthStatus === 'healthy').length
      const sickCount = this.cattleList.filter(c => c.healthStatus === 'sick').length
      const treatmentCount = this.cattleList.filter(c => c.healthStatus === 'treatment').length
      const avgWeight = this.cattleList.length > 0 
        ? Math.round(this.cattleList.reduce((sum, c) => sum + (c.weight || 0), 0) / this.cattleList.length)
        : 0
      
      return {
        healthyCount,
        sickCount,
        treatmentCount,
        avgWeight
      }
    }
  },
  onLoad() {
    // 获取页面参数
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    this.barnId = currentPage.options.id
    
    if (this.barnId) {
      this.loadBarnDetail()
      this.loadCattleList()
    }
  },
  methods: {

    // 加载牛棚详情
    async loadBarnDetail() {
      if (!this.barnId) return
      
      this.loading = true
      try {
        const response = await uni.request({
          url: `/api/v1/barns/${this.barnId}`,
          method: 'GET'
        })
        
        if (response.data.success) {
          this.barnInfo = response.data.data
          // 缓存牛棚详情
          cacheStore.setCacheData(`barn_${this.barnId}`, this.barnInfo)
        } else {
          throw new Error(response.data.message || '获取牛棚详情失败')
        }
      } catch (error) {
        console.error('获取牛棚详情失败:', error)
        // 尝试从缓存加载
        const cachedBarn = cacheStore.getCacheData(`barn_${this.barnId}`)
        if (cachedBarn) {
          this.barnInfo = cachedBarn
          uni.showToast({
            title: '已加载离线数据',
            icon: 'none'
          })
        } else {
          uni.showToast({
            title: '获取牛棚详情失败',
            icon: 'error'
          })
        }
      } finally {
        this.loading = false
      }
    },

    // 加载牛只列表
    async loadCattleList() {
      if (!this.barnId) return
      
      this.cattleLoading = true
      try {
        const response = await uni.request({
          url: `/api/v1/cattle?barnId=${this.barnId}&limit=10`,
          method: 'GET'
        })
        
        if (response.data.success) {
          this.cattleList = response.data.data
          // 缓存牛只数据
          cacheStore.setCacheData(`cattle_barn_${this.barnId}`, this.cattleList)
        } else {
          throw new Error(response.data.message || '获取牛只列表失败')
        }
      } catch (error) {
        console.error('获取牛只列表失败:', error)
        // 尝试从缓存加载
        const cachedCattle = cacheStore.getCacheData(`cattle_barn_${this.barnId}`)
        if (cachedCattle) {
          this.cattleList = cachedCattle
          uni.showToast({
            title: '已加载离线数据',
            icon: 'none'
          })
        } else {
          console.log('获取牛只列表失败，但不显示错误提示')
        }
      } finally {
        this.cattleLoading = false
      }
    },

    // 获取健康状态文本
    getHealthStatusText(status) {
      const statusMap = {
        healthy: '健康',
        sick: '患病',
        treatment: '治疗中'
      }
      return statusMap[status] || '未知'
    },

    // 快捷操作
    quickAction(action) {
      switch (action) {
        case 'cattle':
          uni.navigateTo({
            url: `/pages/cattle/list?barnId=${this.barnId}`
          })
          break
        case 'feeding':
          uni.navigateTo({
            url: `/pages/feeding/record?barnId=${this.barnId}`
          })
          break
        case 'health':
          uni.navigateTo({
            url: `/pages/health/list?barnId=${this.barnId}`
          })
          break
        case 'scan':
          uni.navigateTo({
            url: `/pages/scan/index?barnId=${this.barnId}`
          })
          break
      }
    },

    // 查看所有牛只
    viewAllCattle() {
      uni.navigateTo({
        url: `/pages/cattle/list?barnId=${this.barnId}`
      })
    },

    // 查看牛只详情
    viewCattleDetail(cattle) {
      uni.navigateTo({
        url: `/pages/cattle/detail?id=${cattle.id}`
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.barn-detail-container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.loading-container {
  padding: 40rpx;
  text-align: center;
}

.detail-content {
  .info-card, .actions-card, .cattle-preview-card, .stats-card {
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
    
    .status-badge {
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
    
    .view-all-btn {
      display: flex;
      align-items: center;
      gap: 8rpx;
      color: #1890ff;
      font-size: 28rpx;
    }
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30rpx;
    margin-bottom: 30rpx;
    
    .info-item {
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
  
  .capacity-section {
    .capacity-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15rpx;
      font-size: 28rpx;
      color: #333;
      
      .capacity-rate {
        font-weight: bold;
        color: #1890ff;
      }
    }
    
    .capacity-bar {
      height: 16rpx;
      background: #f0f0f0;
      border-radius: 8rpx;
      overflow: hidden;
      margin-bottom: 15rpx;
      
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
    
    .capacity-info {
      display: flex;
      justify-content: space-between;
      font-size: 26rpx;
      color: #666;
    }
  }
  
  .actions-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 30rpx;
    
    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15rpx;
      
      .action-icon {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 40rpx;
        color: white;
        
        &.cattle {
          background: linear-gradient(135deg, #1890ff, #40a9ff);
        }
        
        &.feeding {
          background: linear-gradient(135deg, #52c41a, #73d13d);
        }
        
        &.health {
          background: linear-gradient(135deg, #fa8c16, #ffc53d);
        }
        
        &.scan {
          background: linear-gradient(135deg, #722ed1, #9254de);
        }
      }
      
      .action-text {
        font-size: 26rpx;
        color: #333;
      }
    }
  }
  
  .cattle-list {
    .cattle-item {
      display: flex;
      align-items: center;
      padding: 20rpx 0;
      border-bottom: 1rpx solid #f0f0f0;
      
      &:last-child {
        border-bottom: none;
      }
      
      .cattle-avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 20rpx;
        overflow: hidden;
        
        image {
          width: 100%;
          height: 100%;
        }
        
        .iconfont {
          font-size: 40rpx;
          color: #ccc;
        }
      }
      
      .cattle-info {
        flex: 1;
        
        .cattle-tag {
          font-size: 30rpx;
          font-weight: bold;
          color: #333;
          margin-bottom: 8rpx;
        }
        
        .cattle-details {
          display: flex;
          gap: 15rpx;
          font-size: 24rpx;
          color: #666;
        }
      }
      
      .health-status {
        padding: 6rpx 12rpx;
        border-radius: 12rpx;
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
          background: #fff7e6;
          color: #fa8c16;
        }
      }
    }
    
    .more-cattle {
      text-align: center;
      padding: 20rpx;
      color: #999;
      font-size: 26rpx;
    }
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20rpx;
    
    .stat-item {
      text-align: center;
      padding: 20rpx;
      background: #f8f9fa;
      border-radius: 12rpx;
      
      .stat-number {
        font-size: 32rpx;
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