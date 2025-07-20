<template>
  <view class="alerts-page">
    <!-- 统计栏 -->
    <view class="stats-bar">
      <view class="stat-item">
        <text class="stat-number">{{ totalAlerts }}</text>
        <text class="stat-label">总预警</text>
      </view>
      <view class="stat-item">
        <text class="stat-number">{{ activeAlerts }}</text>
        <text class="stat-label">待处理</text>
      </view>
      <view class="stat-item">
        <text class="stat-number">{{ resolvedAlerts }}</text>
        <text class="stat-label">已解决</text>
      </view>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-section">
      <picker 
        :range="bases" 
        range-key="name" 
        @change="onBaseChange"
        :value="selectedBaseIndex"
      >
        <view class="filter-item">
          <text>{{ selectedBase?.name || '全部基地' }}</text>
          <text class="filter-arrow">▼</text>
        </view>
      </picker>
      
      <picker 
        :range="alertTypes" 
        range-key="label" 
        @change="onTypeChange"
        :value="selectedTypeIndex"
      >
        <view class="filter-item">
          <text>{{ selectedType?.label || '全部类型' }}</text>
          <text class="filter-arrow">▼</text>
        </view>
      </picker>
      
      <picker 
        :range="statusOptions" 
        range-key="label" 
        @change="onStatusChange"
        :value="selectedStatusIndex"
      >
        <view class="filter-item">
          <text>{{ selectedStatus?.label || '全部状态' }}</text>
          <text class="filter-arrow">▼</text>
        </view>
      </picker>
    </view>

    <!-- 预警列表 -->
    <view class="alerts-list">
      <view 
        v-for="alert in alertsList" 
        :key="alert.id"
        class="alert-item"
        :class="getAlertClass(alert)"
        @click="showAlertDetail(alert)"
      >
        <view class="alert-header">
          <view class="alert-title">{{ alert.material?.name }}</view>
          <view class="alert-level" :class="`level-${alert.alert_level}`">
            {{ getAlertLevelName(alert.alert_level) }}
          </view>
        </view>
        
        <view class="alert-content">
          <view class="alert-message">{{ alert.message }}</view>
          <view class="alert-meta">
            <text class="meta-item">{{ alert.base?.name }}</text>
            <text class="meta-item">{{ formatTime(alert.created_at) }}</text>
          </view>
        </view>
        
        <view class="alert-actions" v-if="!alert.is_resolved">
          <view class="action-btn resolve" @click.stop="resolveAlert(alert)">
            解决
          </view>
        </view>
        
        <view class="alert-status resolved" v-else>
          <text>✓ 已解决</text>
          <text class="resolved-time">{{ formatTime(alert.resolved_at) }}</text>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="alertsList.length === 0 && !loading" class="empty-state">
        <view class="empty-icon">⚠️</view>
        <view class="empty-text">暂无预警信息</view>
        <view class="empty-desc">系统会自动检测库存异常并生成预警</view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="hasMore && !loading">
      <view class="load-more-btn" @click="loadMore">加载更多</view>
    </view>

    <!-- 预警详情弹窗 -->
    <uni-popup ref="detailPopup" type="bottom" :safe-area="false">
      <view class="detail-modal" v-if="selectedAlert">
        <view class="modal-header">
          <view class="modal-title">预警详情</view>
          <view class="modal-close" @click="closeDetailModal">✕</view>
        </view>
        
        <view class="modal-content">
          <view class="detail-section">
            <view class="section-title">预警信息</view>
            <view class="detail-grid">
              <view class="detail-item">
                <text class="detail-label">物资名称</text>
                <text class="detail-value">{{ selectedAlert.material?.name }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">物资编码</text>
                <text class="detail-value">{{ selectedAlert.material?.code }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">所属基地</text>
                <text class="detail-value">{{ selectedAlert.base?.name }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">预警类型</text>
                <text class="detail-value">{{ getAlertTypeName(selectedAlert.alert_type) }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">预警级别</text>
                <text class="detail-value" :class="`level-${selectedAlert.alert_level}`">
                  {{ getAlertLevelName(selectedAlert.alert_level) }}
                </text>
              </view>
              <view class="detail-item">
                <text class="detail-label">预警时间</text>
                <text class="detail-value">{{ formatDateTime(selectedAlert.created_at) }}</text>
              </view>
            </view>
          </view>
          
          <view class="detail-section">
            <view class="section-title">预警描述</view>
            <view class="alert-description">{{ selectedAlert.message }}</view>
          </view>
          
          <view class="detail-section" v-if="selectedAlert.is_resolved">
            <view class="section-title">解决信息</view>
            <view class="resolve-info">
              <text class="resolve-time">解决时间: {{ formatDateTime(selectedAlert.resolved_at) }}</text>
            </view>
          </view>
        </view>
        
        <view class="modal-footer" v-if="!selectedAlert.is_resolved">
          <button class="btn-resolve" @click="resolveAlert(selectedAlert)">
            标记为已解决
          </button>
        </view>
      </view>
    </uni-popup>

    <!-- 批量操作栏 -->
    <view class="batch-actions" v-if="selectedAlerts.length > 0">
      <view class="batch-info">
        已选择 {{ selectedAlerts.length }} 项
      </view>
      <view class="batch-buttons">
        <button class="btn-batch" @click="batchResolve">批量解决</button>
        <button class="btn-cancel" @click="clearSelection">取消</button>
      </view>
    </view>

    <!-- 加载状态 -->
    <uni-load-more 
      v-if="loading" 
      status="loading" 
      :content-text="{ contentdown: '加载中...', contentrefresh: '加载中...', contentnomore: '加载完成' }"
    />
  </view>
</template>

<script>
import { useMaterialStore } from '@/stores/material'
import { useBaseStore } from '@/stores/base'

export default {
  data() {
    return {
      materialStore: null,
      baseStore: null,
      alertsList: [],
      bases: [],
      selectedBaseIndex: 0,
      selectedTypeIndex: 0,
      selectedStatusIndex: 0,
      selectedBase: null,
      selectedType: null,
      selectedStatus: null,
      selectedAlert: null,
      selectedAlerts: [],
      loading: false,
      hasMore: true,
      page: 1,
      limit: 20,
      alertTypes: [
        { value: null, label: '全部类型' },
        { value: 'low_stock', label: '低库存' },
        { value: 'expired', label: '过期' },
        { value: 'quality_issue', label: '质量问题' }
      ],
      statusOptions: [
        { value: null, label: '全部状态' },
        { value: false, label: '待处理' },
        { value: true, label: '已解决' }
      ]
    }
  },

  computed: {
    totalAlerts() {
      return this.alertsList.length
    },

    activeAlerts() {
      return this.alertsList.filter(alert => !alert.is_resolved).length
    },

    resolvedAlerts() {
      return this.alertsList.filter(alert => alert.is_resolved).length
    }
  },

  onLoad() {
    this.materialStore = useMaterialStore()
    this.baseStore = useBaseStore()
    this.loadInitialData()
  },

  onPullDownRefresh() {
    this.refreshData().finally(() => {
      uni.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.hasMore && !this.loading) {
      this.loadMore()
    }
  },

  methods: {
    async loadInitialData() {
      this.loading = true
      try {
        await this.loadBases()
        await this.loadAlerts()
      } catch (error) {
        console.error('加载初始数据失败:', error)
        uni.showToast({
          title: '加载数据失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    async refreshData() {
      this.page = 1
      this.hasMore = true
      await this.loadAlerts(true)
    },

    async loadBases() {
      try {
        await this.baseStore.fetchBases()
        this.bases = [{ id: null, name: '全部基地' }, ...this.baseStore.bases]
      } catch (error) {
        console.error('加载基地列表失败:', error)
      }
    },

    async loadAlerts(refresh = false) {
      if (this.loading && !refresh) return

      this.loading = true
      try {
        const params = {
          page: this.page,
          limit: this.limit,
          base_id: this.selectedBase?.id || undefined,
          alert_type: this.selectedType?.value || undefined,
          is_resolved: this.selectedStatus?.value
        }

        const result = await this.materialStore.fetchAlerts(params)
        
        if (refresh || this.page === 1) {
          this.alertsList = result.data
        } else {
          this.alertsList.push(...result.data)
        }

        this.hasMore = result.data.length === this.limit
      } catch (error) {
        console.error('加载预警数据失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    async loadMore() {
      if (!this.hasMore || this.loading) return
      
      this.page++
      await this.loadAlerts()
    },

    onBaseChange(e) {
      this.selectedBaseIndex = e.detail.value
      this.selectedBase = this.bases[this.selectedBaseIndex]
      if (this.selectedBase?.id === null) {
        this.selectedBase = null
      }
      this.handleFilter()
    },

    onTypeChange(e) {
      this.selectedTypeIndex = e.detail.value
      this.selectedType = this.alertTypes[this.selectedTypeIndex]
      if (this.selectedType?.value === null) {
        this.selectedType = null
      }
      this.handleFilter()
    },

    onStatusChange(e) {
      this.selectedStatusIndex = e.detail.value
      this.selectedStatus = this.statusOptions[this.selectedStatusIndex]
      if (this.selectedStatus?.value === null) {
        this.selectedStatus = null
      }
      this.handleFilter()
    },

    handleFilter() {
      this.page = 1
      this.hasMore = true
      this.loadAlerts(true)
    },

    showAlertDetail(alert) {
      this.selectedAlert = alert
      this.$refs.detailPopup.open()
    },

    closeDetailModal() {
      this.$refs.detailPopup.close()
      this.selectedAlert = null
    },

    async resolveAlert(alert) {
      try {
        uni.showLoading({ title: '处理中...' })
        
        await this.materialStore.resolveAlert(alert.id)
        
        // 更新本地状态
        const index = this.alertsList.findIndex(item => item.id === alert.id)
        if (index !== -1) {
          this.alertsList[index].is_resolved = true
          this.alertsList[index].resolved_at = new Date().toISOString()
        }
        
        // 如果是详情弹窗中的操作，也要更新
        if (this.selectedAlert && this.selectedAlert.id === alert.id) {
          this.selectedAlert.is_resolved = true
          this.selectedAlert.resolved_at = new Date().toISOString()
        }
        
        uni.showToast({
          title: '已标记为解决',
          icon: 'success'
        })
        
        // 关闭详情弹窗
        if (this.$refs.detailPopup) {
          this.$refs.detailPopup.close()
        }
      } catch (error) {
        console.error('解决预警失败:', error)
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },

    async batchResolve() {
      if (this.selectedAlerts.length === 0) return

      try {
        uni.showLoading({ title: '批量处理中...' })
        
        const promises = this.selectedAlerts.map(alert => 
          this.materialStore.resolveAlert(alert.id)
        )
        
        await Promise.all(promises)
        
        // 更新本地状态
        this.selectedAlerts.forEach(selectedAlert => {
          const index = this.alertsList.findIndex(item => item.id === selectedAlert.id)
          if (index !== -1) {
            this.alertsList[index].is_resolved = true
            this.alertsList[index].resolved_at = new Date().toISOString()
          }
        })
        
        uni.showToast({
          title: `已解决 ${this.selectedAlerts.length} 个预警`,
          icon: 'success'
        })
        
        this.clearSelection()
      } catch (error) {
        console.error('批量解决预警失败:', error)
        uni.showToast({
          title: '批量操作失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },

    clearSelection() {
      this.selectedAlerts = []
    },

    getAlertClass(alert) {
      return {
        resolved: alert.is_resolved,
        [`level-${alert.alert_level}`]: true,
        [`type-${alert.alert_type}`]: true
      }
    },

    getAlertTypeName(type) {
      const names = {
        low_stock: '低库存',
        expired: '过期',
        quality_issue: '质量问题'
      }
      return names[type] || type
    },

    getAlertLevelName(level) {
      const names = {
        low: '低',
        medium: '中',
        high: '高'
      }
      return names[level] || level
    },

    formatTime(dateString) {
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date
      
      if (diff < 60000) { // 1分钟内
        return '刚刚'
      } else if (diff < 3600000) { // 1小时内
        return `${Math.floor(diff / 60000)}分钟前`
      } else if (diff < 86400000) { // 1天内
        return `${Math.floor(diff / 3600000)}小时前`
      } else {
        return date.toLocaleDateString('zh-CN')
      }
    },

    formatDateTime(dateString) {
      return new Date(dateString).toLocaleString('zh-CN')
    }
  }
}
</script>

<style lang="scss" scoped>
.alerts-page {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding-bottom: 120rpx; // 为批量操作栏留空间
}

.stats-bar {
  display: flex;
  background: white;
  padding: 30rpx 20rpx;
  margin-bottom: 20rpx;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-top: 10rpx;
}

.filter-section {
  display: flex;
  gap: 20rpx;
  background: white;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.filter-item {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #333;
}

.filter-arrow {
  font-size: 20rpx;
  color: #999;
}

.alerts-list {
  padding: 0 20rpx;
}

.alert-item {
  background: white;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  border-left: 6rpx solid #ddd;

  &.level-low {
    border-left-color: #1890ff;
  }

  &.level-medium {
    border-left-color: #faad14;
  }

  &.level-high {
    border-left-color: #ff4d4f;
  }

  &.resolved {
    opacity: 0.7;
    background: #f9f9f9;
  }
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.alert-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.alert-level {
  font-size: 20rpx;
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
  color: white;

  &.level-low {
    background: #1890ff;
  }

  &.level-medium {
    background: #faad14;
  }

  &.level-high {
    background: #ff4d4f;
  }
}

.alert-content {
  margin-bottom: 20rpx;
}

.alert-message {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 15rpx;
  line-height: 1.5;
}

.alert-meta {
  display: flex;
  gap: 30rpx;
}

.meta-item {
  font-size: 22rpx;
  color: #666;
}

.alert-actions {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  padding: 12rpx 24rpx;
  border-radius: 6rpx;
  font-size: 24rpx;
  color: white;

  &.resolve {
    background: #52c41a;
  }
}

.alert-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 24rpx;

  &.resolved {
    color: #52c41a;
  }
}

.resolved-time {
  font-size: 20rpx;
  color: #999;
}

.load-more {
  padding: 40rpx;
  text-align: center;
}

.load-more-btn {
  background: white;
  padding: 20rpx 40rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
  color: #666;
  border: 1rpx solid #e0e0e0;
}

.empty-state {
  text-align: center;
  padding: 120rpx 40rpx;
  color: #999;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 32rpx;
  margin-bottom: 10rpx;
}

.empty-desc {
  font-size: 24rpx;
}

.detail-modal {
  background: white;
  border-radius: 20rpx 20rpx 0 0;
  max-height: 80vh;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.modal-close {
  font-size: 40rpx;
  color: #999;
  padding: 10rpx;
}

.modal-content {
  padding: 30rpx;
  max-height: 60vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 40rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.detail-label {
  font-size: 24rpx;
  color: #666;
}

.detail-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;

  &.level-low {
    color: #1890ff;
  }

  &.level-medium {
    color: #faad14;
  }

  &.level-high {
    color: #ff4d4f;
  }
}

.alert-description {
  background: #f8f9fa;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #333;
  line-height: 1.5;
}

.resolve-info {
  background: #f6ffed;
  padding: 20rpx;
  border-radius: 8rpx;
  border: 1rpx solid #b7eb8f;
}

.resolve-time {
  font-size: 24rpx;
  color: #52c41a;
}

.modal-footer {
  padding: 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.btn-resolve {
  width: 100%;
  padding: 24rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  background: #52c41a;
  color: white;
  border: none;
}

.batch-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  padding: 20rpx;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
}

.batch-info {
  font-size: 28rpx;
  color: #333;
}

.batch-buttons {
  display: flex;
  gap: 20rpx;
}

.btn-batch, .btn-cancel {
  padding: 16rpx 32rpx;
  border-radius: 6rpx;
  font-size: 24rpx;
  border: none;
}

.btn-batch {
  background: #52c41a;
  color: white;
}

.btn-cancel {
  background: #f8f9fa;
  color: #666;
}
</style>