<template>
  <view class="orders-container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <uni-search-bar
        v-model="searchKeyword"
        placeholder="搜索订单号或客户"
        @confirm="handleSearch"
        @clear="handleClear"
      />
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

    <!-- 订单列表 -->
    <view class="orders-content">
      <uni-list v-if="ordersList.length > 0">
        <uni-list-item
          v-for="order in ordersList"
          :key="order.id"
          :title="order.order_number"
          :note="order.customer?.name || '未知客户'"
          :rightText="formatDate(order.order_date)"
          clickable
          @click="viewOrder(order)"
        >
          <template #header>
            <view class="order-icon">
              <uni-icons type="list" size="24" :color="getStatusColor(order.status)" />
            </view>
          </template>
          <template #body>
            <view class="order-info">
              <view class="order-title">{{ order.order_number }}</view>
              <view class="order-meta">
                <text class="meta-item">{{ order.customer?.name || '未知客户' }}</text>
                <text class="meta-item">{{ formatDate(order.order_date) }}</text>
              </view>
              <view class="order-amount">
                <text>订单金额: </text>
                <text class="amount">¥{{ formatAmount(order.total_amount) }}</text>
              </view>
            </view>
          </template>
          <template #footer>
            <view class="order-status">
              <view class="status-tags">
                <uni-tag :text="getStatusText(order.status)" :type="getStatusType(order.status)" size="small" />
                <uni-tag :text="getPaymentStatusText(order.payment_status)" :type="getPaymentStatusType(order.payment_status)" size="small" />
              </view>
              <view class="order-actions">
                <button
                  v-if="order.status === 'pending'"
                  class="action-btn"
                  size="mini"
                  type="primary"
                  @click.stop="approveOrder(order)"
                >
                  审批
                </button>
                <button
                  v-if="['pending', 'approved'].includes(order.status)"
                  class="action-btn"
                  size="mini"
                  type="default"
                  @click.stop="cancelOrder(order)"
                >
                  取消
                </button>
              </view>
            </view>
          </template>
        </uni-list-item>
      </uni-list>

      <!-- 空状态 -->
      <uni-empty v-else state="nodata" text="暂无销售订单" />
    </view>

    <!-- 加载更多 -->
    <uni-load-more
      v-if="ordersList.length > 0"
      :status="loadStatus"
      @clickLoadMore="loadMore"
    />
  </view>
</template>

<script>
import { salesApi } from '@/utils/api'
import { showToast, showModal } from '@/utils/common'

export default {
  data() {
    return {
      searchKeyword: '',
      statusFilter: 0,
      statusOptions: ['全部', '待审批', '已审批', '已交付', '已完成', '已取消'],
      statusValues: ['', 'pending', 'approved', 'delivered', 'completed', 'cancelled'],
      ordersList: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
      },
      loadStatus: 'more',
    }
  },

  onLoad() {
    this.loadOrders()
  },

  onPullDownRefresh() {
    this.refreshData()
  },

  onReachBottom() {
    this.loadMore()
  },

  methods: {
    // 加载订单列表
    async loadOrders(refresh = false) {
      try {
        if (refresh) {
          this.pagination.page = 1
          this.ordersList = []
        }

        uni.showLoading({ title: '加载中...' })

        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          search: this.searchKeyword,
          status: this.statusValues[this.statusFilter],
        }

        const response = await salesApi.getOrders(params)
        const { items, total } = response.data

        if (refresh) {
          this.ordersList = items
        } else {
          this.ordersList.push(...items)
        }

        this.pagination.total = total
        this.updateLoadStatus()
      } catch (error) {
        showToast('加载订单列表失败')
        console.error('加载订单列表失败:', error)
      } finally {
        uni.hideLoading()
        uni.stopPullDownRefresh()
      }
    },

    // 刷新数据
    refreshData() {
      this.loadOrders(true)
    },

    // 加载更多
    loadMore() {
      if (this.loadStatus === 'more' && this.pagination.page * this.pagination.limit < this.pagination.total) {
        this.pagination.page++
        this.loadOrders()
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

    // 处理搜索
    handleSearch() {
      this.loadOrders(true)
    },

    // 清除搜索
    handleClear() {
      this.searchKeyword = ''
      this.loadOrders(true)
    },

    // 处理状态筛选
    handleStatusFilter(e) {
      this.statusFilter = e.currentIndex
      this.loadOrders(true)
    },

    // 查看订单详情
    viewOrder(order) {
      uni.navigateTo({
        url: `/pages/sales/order-detail?id=${order.id}`,
      })
    },

    // 审批订单
    async approveOrder(order) {
      try {
        const result = await showModal({
          title: '审批订单',
          content: `确定要审批订单"${order.order_number}"吗？审批后牛只将被标记为已售出。`,
          showCancel: true,
        })

        if (result.confirm) {
          uni.showLoading({ title: '处理中...' })
          await salesApi.approveOrder(order.id)
          showToast('审批成功')
          this.refreshData()
        }
      } catch (error) {
        showToast('审批失败')
        console.error('审批订单失败:', error)
      } finally {
        uni.hideLoading()
      }
    },

    // 取消订单
    async cancelOrder(order) {
      try {
        const result = await showModal({
          title: '取消订单',
          content: `确定要取消订单"${order.order_number}"吗？`,
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
            await salesApi.cancelOrder(order.id, reasonResult.content || '用户取消')
            showToast('取消成功')
            this.refreshData()
          }
        }
      } catch (error) {
        showToast('取消失败')
        console.error('取消订单失败:', error)
      } finally {
        uni.hideLoading()
      }
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

    // 获取状态颜色
    getStatusColor(status) {
      const colorMap = {
        pending: '#faad14',
        approved: '#1890ff',
        delivered: '#8c8c8c',
        completed: '#52c41a',
        cancelled: '#ff4d4f'
      }
      return colorMap[status] || '#8c8c8c'
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
    }
  }
}
</script>

<style lang="scss" scoped>
.orders-container {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.search-bar {
  padding: 20rpx;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.filter-bar {
  padding: 20rpx;
  background-color: #fff;
  border-bottom: 1px solid #eee;
}

.orders-content {
  padding: 20rpx;
}

.order-icon {
  margin-right: 20rpx;
}

.order-info {
  flex: 1;
}

.order-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.order-meta {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 10rpx;
}

.meta-item {
  font-size: 24rpx;
  color: #666;
  margin-right: 20rpx;
  
  &:not(:last-child)::after {
    content: '|';
    margin-left: 20rpx;
    color: #ddd;
  }
}

.order-amount {
  font-size: 28rpx;
  color: #666;
  
  .amount {
    color: #ff6b00;
    font-weight: bold;
  }
}

.order-status {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 20rpx;
}

.status-tags {
  display: flex;
  gap: 10rpx;
}

.order-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  font-size: 24rpx;
}
</style>