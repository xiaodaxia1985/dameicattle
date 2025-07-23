<template>
  <view class="equipment-detail" v-if="equipment">
    <!-- 设备基本信息 -->
    <view class="info-card">
      <view class="card-header">
        <view class="equipment-name">{{ equipment.name }}</view>
        <uni-tag
          :text="getStatusText(equipment.status)"
          :type="getStatusTagType(equipment.status)"
        />
      </view>
      
      <view class="info-grid">
        <view class="info-item">
          <text class="label">设备编码</text>
          <text class="value">{{ equipment.code }}</text>
        </view>
        <view class="info-item">
          <text class="label">设备分类</text>
          <text class="value">{{ equipment.category?.name || '-' }}</text>
        </view>
        <view class="info-item">
          <text class="label">所属基地</text>
          <text class="value">{{ equipment.base?.name || '-' }}</text>
        </view>
        <view class="info-item">
          <text class="label">所属牛棚</text>
          <text class="value">{{ equipment.barn?.name || '-' }}</text>
        </view>
        <view class="info-item">
          <text class="label">品牌型号</text>
          <text class="value">{{ getBrandModel(equipment) }}</text>
        </view>
        <view class="info-item">
          <text class="label">安装位置</text>
          <text class="value">{{ equipment.location || '-' }}</text>
        </view>
      </view>
    </view>

    <!-- 技术规格 -->
    <view class="info-card" v-if="equipment.specifications && Object.keys(equipment.specifications).length > 0">
      <view class="card-title">技术规格</view>
      <view class="specs-grid">
        <view
          v-for="(value, key) in equipment.specifications"
          :key="key"
          class="spec-item"
        >
          <text class="spec-key">{{ key }}</text>
          <text class="spec-value">{{ value }}</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button
        class="action-btn primary"
        @click="reportFailure"
      >
        <uni-icons type="warning" size="16" color="#fff" />
        <text>故障报告</text>
      </button>
      <button
        class="action-btn secondary"
        @click="viewMaintenance"
      >
        <uni-icons type="gear" size="16" color="#007AFF" />
        <text>维护记录</text>
      </button>
    </view>

    <!-- 最近维护记录 -->
    <view class="info-card">
      <view class="card-title">
        <text>最近维护记录</text>
        <text class="more-link" @click="viewAllMaintenance">查看全部</text>
      </view>
      
      <view v-if="recentMaintenance.length > 0">
        <view
          v-for="record in recentMaintenance"
          :key="record.id"
          class="maintenance-item"
        >
          <view class="maintenance-header">
            <text class="maintenance-type">{{ record.maintenance_type }}</text>
            <text class="maintenance-date">{{ formatDate(record.maintenance_date) }}</text>
          </view>
          <view class="maintenance-info">
            <text class="operator">操作员: {{ record.operator?.real_name || '-' }}</text>
            <text class="duration" v-if="record.duration_hours">
              耗时: {{ record.duration_hours }}小时
            </text>
          </view>
          <view class="maintenance-status">
            <uni-tag
              :text="getMaintenanceStatusText(record.status)"
              :type="getMaintenanceStatusType(record.status)"
              size="small"
            />
          </view>
        </view>
      </view>
      
      <uni-empty v-else state="nodata" mode="data" />
    </view>

    <!-- 最近故障记录 -->
    <view class="info-card">
      <view class="card-title">
        <text>最近故障记录</text>
        <text class="more-link" @click="viewAllFailures">查看全部</text>
      </view>
      
      <view v-if="recentFailures.length > 0">
        <view
          v-for="failure in recentFailures"
          :key="failure.id"
          class="failure-item"
        >
          <view class="failure-header">
            <text class="failure-type">{{ failure.failure_type || '设备故障' }}</text>
            <uni-tag
              :text="getSeverityText(failure.severity)"
              :type="getSeverityTagType(failure.severity)"
              size="small"
            />
          </view>
          <view class="failure-info">
            <text class="failure-date">{{ formatDate(failure.failure_date) }}</text>
            <text class="reporter">报告人: {{ failure.reporter?.real_name || '-' }}</text>
          </view>
          <view class="failure-description">{{ failure.description }}</view>
          <view class="failure-status">
            <uni-tag
              :text="getFailureStatusText(failure.status)"
              :type="getFailureStatusType(failure.status)"
              size="small"
            />
          </view>
        </view>
      </view>
      
      <uni-empty v-else state="nodata" mode="data" />
    </view>
  </view>
</template>

<script>
import { equipmentApi } from '@/utils/api'
import { showToast } from '@/utils/common'

export default {
  data() {
    return {
      equipmentId: '',
      equipment: null,
      recentMaintenance: [],
      recentFailures: [],
    }
  },

  onLoad(options) {
    this.equipmentId = options.id
    if (this.equipmentId) {
      this.loadEquipmentDetail()
      this.loadRecentRecords()
    }
  },

  onPullDownRefresh() {
    this.refreshData()
  },

  methods: {
    // 加载设备详情
    async loadEquipmentDetail() {
      try {
        uni.showLoading({ title: '加载中...' })
        const response = await equipmentApi.getEquipmentById(this.equipmentId)
        this.equipment = response.data
      } catch (error) {
        showToast('加载设备详情失败')
        console.error('加载设备详情失败:', error)
      } finally {
        uni.hideLoading()
      }
    },

    // 加载最近记录
    async loadRecentRecords() {
      try {
        // 加载最近维护记录
        const maintenanceResponse = await equipmentApi.getMaintenanceRecords({
          equipmentId: this.equipmentId,
          limit: 3,
        })
        this.recentMaintenance = maintenanceResponse.data.data || []

        // 加载最近故障记录
        const failureResponse = await equipmentApi.getFailures({
          equipmentId: this.equipmentId,
          limit: 3,
        })
        this.recentFailures = failureResponse.data.data || []
      } catch (error) {
        console.error('加载最近记录失败:', error)
      }
    },

    // 刷新数据
    async refreshData() {
      try {
        await Promise.all([
          this.loadEquipmentDetail(),
          this.loadRecentRecords(),
        ])
      } finally {
        uni.stopPullDownRefresh()
      }
    },

    // 报告故障
    reportFailure() {
      uni.navigateTo({
        url: `/pages/equipment/report-failure?equipmentId=${this.equipmentId}&equipmentName=${this.equipment.name}`,
      })
    },

    // 查看维护记录
    viewMaintenance() {
      uni.navigateTo({
        url: `/pages/equipment/maintenance?equipmentId=${this.equipmentId}&equipmentName=${this.equipment.name}`,
      })
    },

    // 查看全部维护记录
    viewAllMaintenance() {
      this.viewMaintenance()
    },

    // 查看全部故障记录
    viewAllFailures() {
      uni.navigateTo({
        url: `/pages/equipment/failures?equipmentId=${this.equipmentId}&equipmentName=${this.equipment.name}`,
      })
    },

    // 获取品牌型号
    getBrandModel(equipment) {
      const parts = []
      if (equipment.brand) parts.push(equipment.brand)
      if (equipment.model) parts.push(equipment.model)
      return parts.length > 0 ? parts.join(' ') : '-'
    },

    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        normal: '正常',
        maintenance: '维护中',
        broken: '故障',
        retired: '已退役',
      }
      return statusMap[status] || status
    },

    // 获取状态标签类型
    getStatusTagType(status) {
      const typeMap = {
        normal: 'success',
        maintenance: 'warning',
        broken: 'error',
        retired: 'info',
      }
      return typeMap[status] || 'info'
    },

    // 获取维护状态文本
    getMaintenanceStatusText(status) {
      const statusMap = {
        scheduled: '计划中',
        in_progress: '进行中',
        completed: '已完成',
        cancelled: '已取消',
      }
      return statusMap[status] || status
    },

    // 获取维护状态类型
    getMaintenanceStatusType(status) {
      const typeMap = {
        scheduled: 'info',
        in_progress: 'warning',
        completed: 'success',
        cancelled: 'error',
      }
      return typeMap[status] || 'info'
    },

    // 获取严重程度文本
    getSeverityText(severity) {
      const severityMap = {
        low: '轻微',
        medium: '中等',
        high: '严重',
        critical: '紧急',
      }
      return severityMap[severity] || severity
    },

    // 获取严重程度标签类型
    getSeverityTagType(severity) {
      const typeMap = {
        low: 'success',
        medium: 'warning',
        high: 'error',
        critical: 'error',
      }
      return typeMap[severity] || 'info'
    },

    // 获取故障状态文本
    getFailureStatusText(status) {
      const statusMap = {
        reported: '已报告',
        in_repair: '维修中',
        resolved: '已解决',
        closed: '已关闭',
      }
      return statusMap[status] || status
    },

    // 获取故障状态类型
    getFailureStatusType(status) {
      const typeMap = {
        reported: 'warning',
        in_repair: 'primary',
        resolved: 'success',
        closed: 'info',
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
.equipment-detail {
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 20rpx;
}

.info-card {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.equipment-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.more-link {
  font-size: 24rpx;
  color: #007AFF;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30rpx;
}

.info-item {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.specs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.spec-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 8rpx;
}

.spec-key {
  font-size: 24rpx;
  color: #666;
}

.spec-value {
  font-size: 24rpx;
  color: #333;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  
  &.primary {
    background-color: #ff4d4f;
    color: #fff;
    border: none;
  }
  
  &.secondary {
    background-color: #fff;
    color: #007AFF;
    border: 2rpx solid #007AFF;
  }
}

.maintenance-item,
.failure-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #eee;
  
  &:last-child {
    border-bottom: none;
  }
}

.maintenance-header,
.failure-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.maintenance-type,
.failure-type {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.maintenance-info,
.failure-info {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.failure-description {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 10rpx;
  line-height: 1.4;
}

.maintenance-status,
.failure-status {
  text-align: right;
}
</style>