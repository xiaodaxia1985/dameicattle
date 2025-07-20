<template>
  <view class="customers-container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <uni-search-bar
        v-model="searchKeyword"
        placeholder="搜索客户名称或联系人"
        @confirm="handleSearch"
        @clear="handleClear"
      />
    </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <uni-segmented-control
        :current="typeFilter"
        :values="typeOptions"
        @clickItem="handleTypeFilter"
        style-type="button"
      />
    </view>

    <!-- 客户列表 -->
    <view class="customers-content">
      <uni-list v-if="customersList.length > 0">
        <uni-list-item
          v-for="customer in customersList"
          :key="customer.id"
          :title="customer.name"
          :note="customer.contact_person || '无联系人'"
          :rightText="customer.phone || '-'"
          clickable
          @click="viewCustomer(customer)"
        >
          <template #header>
            <view class="customer-icon">
              <uni-icons type="person" size="24" color="#1890ff" />
            </view>
          </template>
          <template #body>
            <view class="customer-info">
              <view class="customer-title">{{ customer.name }}</view>
              <view class="customer-meta">
                <text class="meta-item">{{ customer.contact_person || '无联系人' }}</text>
                <text class="meta-item">{{ customer.phone || '无电话' }}</text>
                <text class="meta-item">{{ customer.customer_type || '未分类' }}</text>
              </view>
              <view class="customer-rating">
                <text>信用评级: </text>
                <uni-rate v-model="customer.credit_rating" disabled size="15" />
              </view>
            </view>
          </template>
          <template #footer>
            <view class="customer-actions">
              <button
                class="action-btn"
                size="mini"
                type="primary"
                @click.stop="addVisit(customer)"
              >
                添加回访
              </button>
              <button
                class="action-btn"
                size="mini"
                type="default"
                @click.stop="viewOrders(customer)"
              >
                查看订单
              </button>
            </view>
          </template>
        </uni-list-item>
      </uni-list>

      <!-- 空状态 -->
      <uni-empty v-else state="nodata" text="暂无客户数据" />
    </view>

    <!-- 加载更多 -->
    <uni-load-more
      v-if="customersList.length > 0"
      :status="loadStatus"
      @clickLoadMore="loadMore"
    />
  </view>
</template>

<script>
import { salesApi } from '@/utils/api'
import { showToast } from '@/utils/common'

export default {
  data() {
    return {
      searchKeyword: '',
      typeFilter: 0,
      typeOptions: ['全部', '个人', '企业', '经销商'],
      typeValues: ['', '个人', '企业', '经销商'],
      customersList: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
      },
      loadStatus: 'more',
    }
  },

  onLoad() {
    this.loadCustomers()
  },

  onPullDownRefresh() {
    this.refreshData()
  },

  onReachBottom() {
    this.loadMore()
  },

  methods: {
    // 加载客户列表
    async loadCustomers(refresh = false) {
      try {
        if (refresh) {
          this.pagination.page = 1
          this.customersList = []
        }

        uni.showLoading({ title: '加载中...' })

        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          search: this.searchKeyword,
          customer_type: this.typeValues[this.typeFilter],
          status: 'active',
        }

        const response = await salesApi.getCustomers(params)
        const { items, total } = response.data

        if (refresh) {
          this.customersList = items
        } else {
          this.customersList.push(...items)
        }

        this.pagination.total = total
        this.updateLoadStatus()
      } catch (error) {
        showToast('加载客户列表失败')
        console.error('加载客户列表失败:', error)
      } finally {
        uni.hideLoading()
        uni.stopPullDownRefresh()
      }
    },

    // 刷新数据
    refreshData() {
      this.loadCustomers(true)
    },

    // 加载更多
    loadMore() {
      if (this.loadStatus === 'more' && this.pagination.page * this.pagination.limit < this.pagination.total) {
        this.pagination.page++
        this.loadCustomers()
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
      this.loadCustomers(true)
    },

    // 清除搜索
    handleClear() {
      this.searchKeyword = ''
      this.loadCustomers(true)
    },

    // 处理类型筛选
    handleTypeFilter(e) {
      this.typeFilter = e.currentIndex
      this.loadCustomers(true)
    },

    // 查看客户详情
    viewCustomer(customer) {
      uni.navigateTo({
        url: `/pages/sales/customer-detail?id=${customer.id}`,
      })
    },

    // 添加回访记录
    addVisit(customer) {
      uni.navigateTo({
        url: `/pages/sales/add-visit?customerId=${customer.id}&customerName=${encodeURIComponent(customer.name)}`,
      })
    },

    // 查看客户订单
    viewOrders(customer) {
      uni.navigateTo({
        url: `/pages/sales/orders?customerId=${customer.id}&customerName=${encodeURIComponent(customer.name)}`,
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.customers-container {
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

.customers-content {
  padding: 20rpx;
}

.customer-icon {
  margin-right: 20rpx;
}

.customer-info {
  flex: 1;
}

.customer-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.customer-meta {
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

.customer-rating {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #666;
}

.customer-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
}

.action-btn {
  flex: 1;
  font-size: 24rpx;
}
</style>