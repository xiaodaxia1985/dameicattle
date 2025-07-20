<template>
  <view class="equipment-list">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <uni-search-bar
        v-model="searchKeyword"
        placeholder="搜索设备名称或编码"
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

    <!-- 设备列表 -->
    <view class="equipment-content">
      <uni-list v-if="equipmentList.length > 0">
        <uni-list-item
          v-for="equipment in equipmentList"
          :key="equipment.id"
          :title="equipment.name"
          :note="equipment.code"
          :rightText="getStatusText(equipment.status)"
          :badge="equipment.status"
          :badge-type="getStatusBadgeType(equipment.status)"
          clickable
          @click="viewEquipment(equipment)"
        >
          <template #header>
            <view class="equipment-icon">
              <uni-icons type="gear" size="24" :color="getStatusColor(equipment.status)" />
            </view>
          </template>
          <template #body>
            <view class="equipment-info">
              <view class="equipment-title">{{ equipment.name }}</view>
              <view class="equipment-meta">
                <text class="meta-item">{{ equipment.code }}</text>
                <text class="meta-item">{{ equipment.base?.name || '-' }}</text>
                <text class="meta-item">{{ equipment.category?.name || '-' }}</text>
              </view>
              <view class="equipment-location" v-if="equipment.location">
                <uni-icons type="location" size="12" color="#999" />
                <text>{{ equipment.location }}</text>
              </view>
            </view>
          </template>
          <template #footer>
            <view class="equipment-actions">
              <button
                class="action-btn"
                size="mini"
                type="primary"
                @click.stop="reportFailure(equipment)"
              >
                故障报告
              </button>
              <button
                class="action-btn"
                size="mini"
                type="default"
                @click.stop="viewMaintenance(equipment)"
              >
                维护记录
              </button>
            </view>
          </template>
        </uni-list-item>
      </uni-list>

      <!-- 空状态 -->
      <uni-empty v-else state="nodata" />
    </view>

    <!-- 加载更多 -->
    <uni-load-more
      v-if="equipmentList.length > 0"
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
  </view>
</template>

<script>
import { equipmentApi } from '@/utils/api'
import { showToast, showModal } from '@/utils/common'

export default {
  data() {
    return {
      searchKeyword: '',
      statusFilter: 0,
      statusOptions: ['全部', '正常', '维护中', '故障', '已退役'],
      statusValues: ['', 'normal', 'maintenance', 'broken', 'retired'],
      equipmentList: [],
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
          iconPath: '/static/icons/scan.png',
          selectedIconPath: '/static/icons/scan-active.png',
          text: '扫码',
          active: false,
        },
        {
          iconPath: '/static/icons/add.png',
          selectedIconPath: '/static/icons/add-active.png',
          text: '报告故障',
          active: false,
        },
      ],
    }
  },

  onLoad() {
    this.loadEquipment()
  },

  onPullDownRefresh() {
    this.refreshData()
  },

  onReachBottom() {
    this.loadMore()
  },

  methods: {
    // 加载设备列表
    async loadEquipment(refresh = false) {
      try {
        if (refresh) {
          this.pagination.page = 1
          this.equipmentList = []
        }

        uni.showLoading({ title: '加载中...' })

        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          search: this.searchKeyword,
          status: this.statusValues[this.statusFilter],
        }

        const response = await equipmentApi.getEquipment(params)
        const { data, pagination } = response.data

        if (refresh) {
          this.equipmentList = data
        } else {
          this.equipmentList.push(...data)
        }

        this.pagination = { ...this.pagination, ...pagination }
        this.updateLoadStatus()
      } catch (error) {
        showToast('加载设备列表失败')
        console.error('加载设备列表失败:', error)
      } finally {
        uni.hideLoading()
        uni.stopPullDownRefresh()
      }
    },

    // 刷新数据
    refreshData() {
      this.loadEquipment(true)
    },

    // 加载更多
    loadMore() {
      if (this.loadStatus === 'more' && this.pagination.page * this.pagination.limit < this.pagination.total) {
        this.pagination.page++
        this.loadEquipment()
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
      this.loadEquipment(true)
    },

    // 清除搜索
    handleClear() {
      this.searchKeyword = ''
      this.loadEquipment(true)
    },

    // 处理状态筛选
    handleStatusFilter(e) {
      this.statusFilter = e.currentIndex
      this.loadEquipment(true)
    },

    // 查看设备详情
    viewEquipment(equipment) {
      uni.navigateTo({
        url: `/pages/equipment/detail?id=${equipment.id}`,
      })
    },

    // 报告故障
    async reportFailure(equipment) {
      try {
        const result = await showModal({
          title: '故障报告',
          content: `确定要报告设备"${equipment.name}"的故障吗？`,
          showCancel: true,
        })

        if (result.confirm) {
          uni.navigateTo({
            url: `/pages/equipment/report-failure?equipmentId=${equipment.id}&equipmentName=${equipment.name}`,
          })
        }
      } catch (error) {
        console.error('报告故障失败:', error)
      }
    },

    // 查看维护记录
    viewMaintenance(equipment) {
      uni.navigateTo({
        url: `/pages/equipment/maintenance?equipmentId=${equipment.id}&equipmentName=${equipment.name}`,
      })
    },

    // 处理浮动按钮点击
    handleFabClick(e) {
      const { index } = e.detail
      if (index === 0) {
        // 扫码
        this.scanEquipment()
      } else if (index === 1) {
        // 快速报告故障
        this.quickReportFailure()
      }
    },

    // 扫码设备
    scanEquipment() {
      uni.scanCode({
        success: (res) => {
          // 处理扫码结果
          const equipmentCode = res.result
          this.searchByCode(equipmentCode)
        },
        fail: (error) => {
          showToast('扫码失败')
          console.error('扫码失败:', error)
        },
      })
    },

    // 根据编码搜索
    searchByCode(code) {
      this.searchKeyword = code
      this.loadEquipment(true)
    },

    // 快速报告故障
    quickReportFailure() {
      uni.navigateTo({
        url: '/pages/equipment/report-failure',
      })
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

    // 获取状态徽章类型
    getStatusBadgeType(status) {
      const typeMap = {
        normal: 'success',
        maintenance: 'warning',
        broken: 'error',
        retired: 'info',
      }
      return typeMap[status] || 'info'
    },

    // 获取状态颜色
    getStatusColor(status) {
      const colorMap = {
        normal: '#52c41a',
        maintenance: '#faad14',
        broken: '#ff4d4f',
        retired: '#8c8c8c',
      }
      return colorMap[status] || '#8c8c8c'
    },
  },
}
</script>

<style lang="scss" scoped>
.equipment-list {
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

.equipment-content {
  padding: 20rpx;
}

.equipment-icon {
  margin-right: 20rpx;
}

.equipment-info {
  flex: 1;
}

.equipment-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.equipment-meta {
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

.equipment-location {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #999;
  
  text {
    margin-left: 8rpx;
  }
}

.equipment-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
}

.action-btn {
  flex: 1;
  font-size: 24rpx;
}

.fab-container {
  position: fixed;
  bottom: 100rpx;
  right: 40rpx;
  z-index: 999;
}
</style>