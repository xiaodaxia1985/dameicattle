<template>
  <view class="order-detail-container">
    <uni-card v-if="order" :title="'订单号: ' + order.order_number" :extra="getStatusText(order.status)">
      <!-- 基本信息 -->
      <view class="info-section">
        <view class="section-title">基本信息</view>
        <uni-list>
          <uni-list-item title="客户名称" :rightText="order.customer?.name || '-'" />
          <uni-list-item title="订单日期" :rightText="formatDate(order.order_date)" />
          <uni-list-item title="预计交付日期" :rightText="formatDate(order.delivery_date)" />
          <uni-list-item title="实际交付日期" :rightText="formatDate(order.actual_delivery_date)" />
          <uni-list-item title="订单状态">
            <template #right>
              <uni-tag :text="getStatusText(order.status)" :type="getStatusType(order.status)" />
            </template>
          </uni-list-item>
          <uni-list-item title="付款状态">
            <template #right>
              <uni-tag :text="getPaymentStatusText(order.payment_status)" :type="getPaymentStatusType(order.payment_status)" />
            </template>
          </uni-list-item>
          <uni-list-item title="付款方式" :rightText="order.payment_method || '-'" />
          <uni-list-item title="合同编号" :rightText="order.contract_number || '-'" />
          <uni-list-item title="物流公司" :rightText="order.logistics_company || '-'" />
          <uni-list-item title="物流单号" :rightText="order.tracking_number || '-'" />
        </uni-list>
      </view>

      <!-- 金额信息 -->
      <view class="info-section">
        <view class="section-title">金额信息</view>
        <view class="amount-info">
          <view class="amount-row">
            <text class="amount-label">订单总额:</text>
            <text class="amount-value">¥{{ formatAmount(order.total_amount) }}</text>
          </view>
          <view class="amount-row">
            <text class="amount-label">税额:</text>
            <text class="amount-value">¥{{ formatAmount(order.tax_amount) }}</text>
          </view>
          <view class="amount-row">
            <text class="amount-label">折扣金额:</text>
            <text class="amount-value">¥{{ formatAmount(order.discount_amount) }}</text>
          </view>
          <view class="amount-row total">
            <text class="amount-label">实付金额:</text>
            <text class="amount-value">¥{{ formatAmount(order.total_amount) }}</text>
          </view>
        </view>
      </view>

      <!-- 订单明细 -->
      <view class="info-section">
        <view class="section-title">订单明细</view>
        <view class="order-items">
          <view class="item-header">
            <text class="item-col ear-tag">耳标号</text>
            <text class="item-col breed">品种</text>
            <text class="item-col price">单价</text>
            <text class="item-col status">状态</text>
          </view>
          <view class="item-row" v-for="(item, index) in order.items" :key="index">
            <text class="item-col ear-tag">{{ item.ear_tag }}</text>
            <text class="item-col breed">{{ item.breed || '-' }}</text>
            <text class="item-col price">¥{{ formatAmount(item.unit_price) }}</text>
            <text class="item-col status">
              <uni-tag :text="getDeliveryStatusText(item.delivery_status)" :type="getDeliveryStatusType(item.delivery_status)" size="small" />
            </text>
          </view>
        </view>
      </view>

      <!-- 备注信息 -->
      <view class="info-section" v-if="order.remark">
        <view class="section-title">备注信息</view>
        <view class="remark-content">
          {{ order.remark }}
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button 
          v-if="order.status === 'pending'" 
          type="primary" 
          @click="approveOrder"
        >
          审批订单
        </button>
        <button 
          v-if="['pending', 'approved'].includes(order.status)" 
          type="warn" 
          @click="cancelOrder"
        >
          取消订单
        </button>
        <button 
          v-if="order.status === 'approved'" 
          type="primary" 
          @click="updateDelivery"
        >
          更新交付状态
        </button>
        <button 
          v-if="['approved', 'delivered'].includes(order.status)" 
          type="default" 
          @click="updatePayment"
        >
          更新付款状态
        </button>
      </view>
    </uni-card>

    <!-- 加载中 -->
    <view v-else class="loading-container">
      <uni-load-more status="loading" />
    </view>
  </view>
</template>

<script>
import { salesApi } from '@/utils/api'
import { showToast, showModal } from '@/utils/common'

export default {
  data() {
    return {
      orderId: null,
      order: null,
    }
  },

  onLoad(options) {
    this.orderId = options.id
    this.loadOrderDetail()
  },

  onPullDownRefresh() {
    this.loadOrderDetail()
  },

  methods: {
    // 加载订单详情
    async loadOrderDetail() {
      try {
        if (!this.orderId) {
          showToast('订单ID不能为空')
          return
        }

        uni.showLoading({ title: '加载中...' })
        const response = await salesApi.getOrder(this.orderId)
        this.order = response.data
      } catch (error) {
        showToast('加载订单详情失败')
        console.error('加载订单详情失败:', error)
      } finally {
        uni.hideLoading()
        uni.stopPullDownRefresh()
      }
    },

    // 审批订单
    async approveOrder() {
      try {
        const result = await showModal({
          title: '审批订单',
          content: '确定要审批此订单吗？审批后牛只将被标记为已售出。',
          showCancel: true,
        })

        if (result.confirm) {
          uni.showLoading({ title: '处理中...' })
          await salesApi.approveOrder(this.orderId)
          showToast('审批成功')
          this.loadOrderDetail()
        }
      } catch (error) {
        showToast('审批失败')
        console.error('审批订单失败:', error)
      } finally {
        uni.hideLoading()
      }
    },

    // 取消订单
    async cancelOrder() {
      try {
        const result = await showModal({
          title: '取消订单',
          content: '确定要取消此订单吗？',
          showCancel: true,
        })

        if (result.confirm) {
          const reasonResult = await showModal({
            title: '取消原因',
            content: '',
            editable: true,
            placeholderText: '请输入取消原因',
            showCancel: true,
          })

          if (reasonResult.confirm) {
            uni.showLoading({ title: '处理中...' })
            await salesApi.cancelOrder(this.orderId, reasonResult.content || '用户取消')
            showToast('取消成功')
            this.loadOrderDetail()
          }
        }
      } catch (error) {
        showToast('取消失败')
        console.error('取消订单失败:', error)
      } finally {
        uni.hideLoading()
      }
    },

    // 更新交付状态
    updateDelivery() {
      uni.navigateTo({
        url: `/pages/sales/update-delivery?id=${this.orderId}`,
      })
    },

    // 更新付款状态
    updatePayment() {
      uni.navigateTo({
        url: `/pages/sales/update-payment?id=${this.orderId}`,
      })
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },

    // 格式化金额
    formatAmount(amount) {
      return amount ? Number(amount).toLocaleString() : '0'
    },

    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        pending: '待审批',
        approved: '已审批',
        delivered: '已交付',
        completed: '已完成',
        cancelled: '已取消'
      }
      return statusMap[status] || status
    },

    // 获取状态类型
    getStatusType(status) {
      const typeMap = {
        pending: 'warning',
        approved: 'primary',
        delivered: 'info',
        completed: 'success',
        cancelled: 'error'
      }
      return typeMap[status] || 'default'
    },

    // 获取付款状态文本
    getPaymentStatusText(status) {
      const statusMap = {
        unpaid: '未付款',
        partial: '部分付款',
        paid: '已付款'
      }
      return statusMap[status] || status
    },

    // 获取付款状态类型
    getPaymentStatusType(status) {
      const typeMap = {
        unpaid: 'error',
        partial: 'warning',
        paid: 'success'
      }
      return typeMap[status] || 'default'
    },

    // 获取交付状态文本
    getDeliveryStatusText(status) {
      const statusMap = {
        pending: '待交付',
        delivered: '已交付',
        cancelled: '已取消'
      }
      return statusMap[status] || status
    },

    // 获取交付状态类型
    getDeliveryStatusType(status) {
      const typeMap = {
        pending: 'warning',
        delivered: 'success',
        cancelled: 'error'
      }
      return typeMap[status] || 'default'
    }
  }
}
</script>

<style lang="scss" scoped>
.order-detail-container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.info-section {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding-left: 20rpx;
  border-left: 8rpx solid #1890ff;
}

.amount-info {
  background-color: #f9f9f9;
  border-radius: 8rpx;
  padding: 20rpx;
}

.amount-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;
  
  &.total {
    margin-top: 20rpx;
    padding-top: 20rpx;
    border-top: 1px dashed #ddd;
    
    .amount-label, .amount-value {
      font-size: 32rpx;
      font-weight: bold;
      color: #ff6b00;
    }
  }
}

.amount-label {
  color: #666;
}

.amount-value {
  color: #333;
  font-weight: 500;
}

.order-items {
  background-color: #fff;
  border-radius: 8rpx;
  overflow: hidden;
}

.item-header, .item-row {
  display: flex;
  padding: 20rpx 0;
}

.item-header {
  background-color: #f5f5f5;
  font-weight: bold;
  color: #333;
}

.item-row {
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.item-col {
  padding: 0 10rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  
  &.ear-tag {
    flex: 2;
  }
  
  &.breed {
    flex: 2;
  }
  
  &.price {
    flex: 1;
    text-align: right;
  }
  
  &.status {
    flex: 1;
    text-align: center;
  }
}

.remark-content {
  background-color: #f9f9f9;
  border-radius: 8rpx;
  padding: 20rpx;
  color: #666;
  font-size: 28rpx;
  line-height: 1.5;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 30rpx;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300rpx;
}
</style>