<template>
  <view class="maintenance-records">
    <!-- 设备信息 -->
    <view class="equipment-info" v-if="equipmentName">
      <view class="equipment-name">{{ equipmentName }}</view>
      <view class="equipment-subtitle">维护记录</view>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <uni-segmented-control
        :current="statusFilter"
        :values="statusOptions"
        @clickItem="handleStatusFilter"
        style-type="button"
      />
    </view>

    <!-- 维护记录列表 -->
    <view class="records-content">
      <view v-if="recordsList.length > 0" class="records-list">
        <view
          v-for="record in recordsList"
          :key="record.id"
          class="record-item"
          @click="viewRecord(record)"
        >
          <view class="record-header">
            <view class="record-type">{{ record.maintenance_type }}</view>
            <uni-tag
              :text="getStatusText(record.status)"
              :type="getStatusTagType(record.status)"
              size="small"
            />
          </view>
          
          <view class="record-info">
            <view class="info-row">
              <uni-icons type="calendar" size="14" color="#666" />
              <text class="info-text">{{ formatDate(record.maintenance_date) }}</text>
            </view>
            <view class="info-row" v-if="record.operator">
              <uni-icons type="person" size="14" color="#666" />
              <text class="info-text">{{ record.operator.real_name }}</text>
            </view>
            <view class="info-row" v-if="record.duration_hours">
              <uni-icons type="clock" size="14" color="#666" />
              <text class="info-text">{{ record.duration_hours }}小时</text>
            </view>
            <view class="info-row" v-if="record.cost">
              <uni-icons type="wallet" size="14" color="#666" />
              <text class="info-text">¥{{ record.cost }}</text>
            </view>
          </view>
          
          <view class="record-description" v-if="record.issues_found">
            <text class="description-label">发现问题：</text>
            <text class="description-text">{{ record.issues_found }}</text>
          </view>
          
          <view class="record-actions" v-if="record.actions_taken">
            <text class="description-label">处理措施：</text>
            <text class="description-text">{{ record.actions_taken }}</text>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <uni-empty v-else state="nodata" />
    </view>

    <!-- 加载更多 -->
    <uni-load-more
      v-if="recordsList.length > 0"
      :status="loadStatus"
      @clickLoadMore="loadMore"
    />

    <!-- 浮动操作按钮 -->
    <view class="fab-container">
      <uni-fab
        :pattern="fabPattern"
        :content="fabContent"
        @trigger="handleFabClick"
      />
    </view>

    <!-- 维护记录详情弹窗 -->
    <uni-popup ref="recordDetailPopup" type="bottom" background-color="#fff">
      <view class="record-detail" v-if="selectedRecord">
        <view class="detail-header">
          <view class="detail-title">维护记录详情</view>
          <view class="close-btn" @click="closeDetail">
            <uni-icons type="close" size="18" color="#666" />
          </view>
        </view>
        
        <view class="detail-content">
          <view class="detail-section">
            <view class="section-title">基本信息</view>
            <view class="detail-grid">
              <view class="detail-item">
                <text class="detail-label">维护类型</text>
                <text class="detail-value">{{ selectedRecord.maintenance_type }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">维护日期</text>
                <text class="detail-value">{{ formatDate(selectedRecord.maintenance_date) }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">操作员</text>
                <text class="detail-value">{{ selectedRecord.operator?.real_name || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">耗时</text>
                <text class="detail-value">{{ selectedRecord.duration_hours || '-' }}小时</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">成本</text>
                <text class="detail-value">{{ selectedRecord.cost ? `¥${selectedRecord.cost}` : '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">状态</text>
                <uni-tag
                  :text="getStatusText(selectedRecord.status)"
                  :type="getStatusTagType(selectedRecord.status)"
                  size="small"
                />
              </view>
            </view>
          </view>
          
          <view class="detail-section" v-if="selectedRecord.issues_found">
            <view class="section-title">发现问题</view>
            <view class="section-content">{{ selectedRecord.issues_found }}</view>
          </view>
          
          <view class="detail-section" v-if="selectedRecord.actions_taken">
            <view class="section-title">处理措施</view>
            <view class="section-content">{{ selectedRecord.actions_taken }}</view>
          </view>
          
          <view class="detail-section" v-if="selectedRecord.parts_replaced && Object.keys(selectedRecord.parts_replaced).length > 0">
            <view class="section-title">更换零件</view>
            <view class="parts-list">
              <view
                v-for="(quantity, part) in selectedRecord.parts_replaced"
                :key="part"
                class="part-item"
              >
                <text class="part-name">{{ part }}</text>
                <text class="part-quantity">{{ quantity }}</text>
              </view>
            </view>
          </view>
          
          <view class="detail-section" v-if="selectedRecord.next_maintenance_date">
            <view class="section-title">下次维护</view>
            <view class="section-content">{{ formatDate(selectedRecord.next_maintenance_date) }}</view>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { equipmentApi } from '@/utils/api'
import { showToast } from '@/utils/common'

export default {
  data() {
    return {
      equipmentId: '',
      equipmentName: '',
      statusFilter: 0,
      statusOptions: ['全部', '计划中', '进行中', '已完成', '已取消'],
      statusValues: ['', 'scheduled', 'in_progress', 'completed', 'cancelled'],
      recordsList: [],
      selectedRecord: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
      },
      loadStatus: 'more',
      fabPattern: {
        color: '#007AFF',
        backgroundColor: '#fff',
        selectedColor: '#007AFF',
      },
      fabContent: [
        {
          iconPath: '/static/icons/add.png',
          selectedIconPath: '/static/icons/add-active.png',
          text: '添加记录',
          active: false,
        },
      ],
    }
  },

  onLoad(options) {
    this.equipmentId = options.equipmentId || ''
    this.equipmentName = options.equipmentName || ''
    this.loadRecords()
  },

  onPullDownRefresh() {
    this.refreshData()
  },

  onReachBottom() {
    this.loadMore()
  },

  methods: {
    // 加载维护记录
    async loadRecords(refresh = false) {
      try {
        if (refresh) {
          this.pagination.page = 1
          this.recordsList = []
        }

        uni.showLoading({ title: '加载中...' })

        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          status: this.statusValues[this.statusFilter],
        }

        if (this.equipmentId) {
          params.equipmentId = this.equipmentId
        }

        const response = await equipmentApi.getMaintenanceRecords(params)
        const { data, pagination } = response.data

        if (refresh) {
          this.recordsList = data
        } else {
          this.recordsList.push(...data)
        }

        this.pagination = { ...this.pagination, ...pagination }
        this.updateLoadStatus()
      } catch (error) {
        showToast('加载维护记录失败')
        console.error('加载维护记录失败:', error)
      } finally {
        uni.hideLoading()
        uni.stopPullDownRefresh()
      }
    },

    // 刷新数据
    refreshData() {
      this.loadRecords(true)
    },

    // 加载更多
    loadMore() {
      if (this.loadStatus === 'more' && this.pagination.page * this.pagination.limit < this.pagination.total) {
        this.pagination.page++
        this.loadRecords()
      }
    },

    // 更新加载状态
    updateLoadStatus() {
      const { page, limit, total } = this.pagination
      if (page * limit >= total) {
        this.loadStatus = 'noMore'
      } else {
        this.loadStatus = 'more'
      }
    },

    // 处理状态筛选
    handleStatusFilter(e) {
      this.statusFilter = e.currentIndex
      this.loadRecords(true)
    },

    // 查看记录详情
    viewRecord(record) {
      this.selectedRecord = record
      this.$refs.recordDetailPopup.open()
    },

    // 关闭详情
    closeDetail() {
      this.$refs.recordDetailPopup.close()
      this.selectedRecord = null
    },

    // 处理浮动按钮点击
    handleFabClick(e) {
      const { index } = e.detail
      if (index === 0) {
        this.addMaintenanceRecord()
      }
    },

    // 添加维护记录
    addMaintenanceRecord() {
      uni.navigateTo({
        url: `/pages/equipment/add-maintenance?equipmentId=${this.equipmentId}&equipmentName=${this.equipmentName}`,
      })
    },

    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        scheduled: '计划中',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消',
      }
      return statusMap[status] || status
    },

    // 获取状态标签类型
    getStatusTagType(status) {
      const typeMap = {
        scheduled: 'info',
        in_progress: 'warning',
        completed: 'success',
        cancelled: 'error',
      }
      return typeMap[status] || 'info'
    },

    // 格式化日期
    formatDate(date) {
      return new Date(date).toLocaleDateString()
    },
  },
}
</script>

<style lang="scss" scoped>
.maintenance-records {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.equipment-info {
  background-color: #fff;
  padding: 30rpx;
  border-bottom: 1px solid #eee;
}

.equipment-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.equipment-subtitle {
  font-size: 24rpx;
  color: #666;
}

.filter-bar {
  padding: 20rpx;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.records-content {
  padding: 20rpx;
}

.records-list {
  .record-item {
    background-color: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  }
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.record-type {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.record-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15rpx;
  margin-bottom: 20rpx;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.info-text {
  font-size: 24rpx;
  color: #666;
}

.record-description,
.record-actions {
  margin-bottom: 15rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.description-label {
  font-size: 24rpx;
  color: #333;
  font-weight: 500;
}

.description-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
  margin-left: 10rpx;
}

.fab-container {
  position: fixed;
  bottom: 100rpx;
  right: 40rpx;
  z-index: 999;
}

.record-detail {
  max-height: 80vh;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1px solid #eee;
}

.detail-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  padding: 10rpx;
}

.detail-content {
  padding: 30rpx;
}

.detail-section {
  margin-bottom: 40rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.section-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.detail-label {
  font-size: 24rpx;
  color: #999;
}

.detail-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.parts-list {
  .part-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20rpx;
    background-color: #f8f9fa;
    border-radius: 8rpx;
    margin-bottom: 10rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .part-name {
    font-size: 26rpx;
    color: #333;
  }
  
  .part-quantity {
    font-size: 26rpx;
    color: #666;
  }
}
</style>