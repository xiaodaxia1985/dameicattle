<template>
  <view class="feeding-page">
    <!-- 顶部统计卡片 -->
    <view class="stats-section">
      <view class="stats-grid">
        <view class="stat-card">
          <view class="stat-icon">
            <text class="iconfont icon-dish"></text>
          </view>
          <view class="stat-info">
            <text class="stat-value">{{ todayAmount }}kg</text>
            <text class="stat-label">今日饲喂</text>
          </view>
        </view>
        <view class="stat-card">
          <view class="stat-icon">
            <text class="iconfont icon-money"></text>
          </view>
          <view class="stat-info">
            <text class="stat-value">¥{{ todayCost }}</text>
            <text class="stat-label">今日成本</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <view class="action-grid">
        <view class="action-item" @tap="navigateToRecord">
          <view class="action-icon">
            <text class="iconfont icon-add"></text>
          </view>
          <text class="action-label">添加记录</text>
        </view>
        <view class="action-item" @tap="navigateToFormulas">
          <view class="action-icon">
            <text class="iconfont icon-formula"></text>
          </view>
          <text class="action-label">查看配方</text>
        </view>
        <view class="action-item" @tap="navigateToHistory">
          <view class="action-icon">
            <text class="iconfont icon-history"></text>
          </view>
          <text class="action-label">历史记录</text>
        </view>
        <view class="action-item" @tap="navigateToPlans">
          <view class="action-icon">
            <text class="iconfont icon-plan"></text>
          </view>
          <text class="action-label">饲喂计划</text>
        </view>
      </view>
    </view>

    <!-- 今日饲喂记录 -->
    <view class="today-records">
      <view class="section-header">
        <text class="section-title">今日饲喂记录</text>
        <text class="section-more" @tap="navigateToHistory">查看全部</text>
      </view>
      <view class="records-list" v-if="todayRecords.length > 0">
        <view 
          class="record-item" 
          v-for="record in todayRecords" 
          :key="record.id"
          @tap="viewRecord(record)"
        >
          <view class="record-info">
            <view class="record-title">{{ record.formulaName }}</view>
            <view class="record-details">
              <text class="detail-item">{{ record.baseName }}</text>
              <text class="detail-item" v-if="record.barnName">{{ record.barnName }}</text>
              <text class="detail-item">{{ record.amount }}kg</text>
            </view>
            <view class="record-time">{{ formatTime(record.createdAt) }}</view>
          </view>
          <view class="record-cost">
            <text class="cost-value">¥{{ record.cost?.toFixed(2) || '0.00' }}</text>
          </view>
        </view>
      </view>
      <view class="empty-state" v-else>
        <text class="empty-text">今日暂无饲喂记录</text>
        <button class="empty-action" @tap="navigateToRecord">立即添加</button>
      </view>
    </view>

    <!-- 配方推荐 -->
    <view class="recommendations" v-if="recommendations.length > 0">
      <view class="section-header">
        <text class="section-title">推荐配方</text>
      </view>
      <scroll-view class="formula-scroll" scroll-x>
        <view class="formula-list">
          <view 
            class="formula-card" 
            v-for="formula in recommendations" 
            :key="formula.id"
            @tap="selectFormula(formula)"
          >
            <view class="formula-name">{{ formula.name }}</view>
            <view class="formula-cost">¥{{ formula.costPerKg?.toFixed(2) }}/kg</view>
            <view class="formula-usage">使用{{ formula.usageCount }}次</view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 底部导航占位 -->
    <view class="bottom-safe"></view>
  </view>
</template>

<script>
import { mapState, mapActions } from 'pinia'
import { useFeedingStore } from '@/stores/feeding'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'FeedingIndex',
  data() {
    return {
      todayRecords: [],
      recommendations: [],
      todayAmount: 0,
      todayCost: 0,
      loading: false
    }
  },
  computed: {
    ...mapState(useAuthStore, ['currentBase'])
  },
  onLoad() {
    this.loadData()
  },
  onShow() {
    this.loadTodayRecords()
  },
  onPullDownRefresh() {
    this.loadData().finally(() => {
      uni.stopPullDownRefresh()
    })
  },
  methods: {
    ...mapActions(useFeedingStore, ['fetchTodayRecords', 'fetchRecommendations']),
    
    async loadData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadTodayRecords(),
          this.loadRecommendations()
        ])
      } catch (error) {
        console.error('加载数据失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'error'
        })
      } finally {
        this.loading = false
      }
    },

    async loadTodayRecords() {
      try {
        const today = new Date().toISOString().split('T')[0]
        const response = await this.fetchTodayRecords({
          baseId: this.currentBase?.id,
          startDate: today,
          endDate: today
        })
        
        this.todayRecords = response.data || []
        this.calculateTodayStats()
      } catch (error) {
        console.error('加载今日记录失败:', error)
      }
    },

    async loadRecommendations() {
      try {
        const response = await this.fetchRecommendations({
          baseId: this.currentBase?.id
        })
        this.recommendations = response.data?.slice(0, 5) || []
      } catch (error) {
        console.error('加载推荐配方失败:', error)
      }
    },

    calculateTodayStats() {
      this.todayAmount = this.todayRecords.reduce((sum, record) => sum + (record.amount || 0), 0)
      this.todayCost = this.todayRecords.reduce((sum, record) => sum + (record.cost || 0), 0)
    },

    navigateToRecord() {
      uni.navigateTo({
        url: '/pages/feeding/record'
      })
    },

    navigateToFormulas() {
      uni.navigateTo({
        url: '/pages/feeding/formulas'
      })
    },

    navigateToHistory() {
      uni.navigateTo({
        url: '/pages/feeding/history'
      })
    },

    navigateToPlans() {
      uni.navigateTo({
        url: '/pages/feeding/plans'
      })
    },

    viewRecord(record) {
      uni.navigateTo({
        url: `/pages/feeding/record-detail?id=${record.id}`
      })
    },

    selectFormula(formula) {
      uni.navigateTo({
        url: `/pages/feeding/record?formulaId=${formula.id}`
      })
    },

    formatTime(dateString) {
      const date = new Date(dateString)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
  }
}
</script>

<style lang="scss" scoped>
.feeding-page {
  background-color: #f5f7fa;
  min-height: 100vh;
  padding-bottom: 20rpx;
}

.stats-section {
  padding: 30rpx;
  background: white;
  margin-bottom: 20rpx;

  .stats-grid {
    display: flex;
    gap: 20rpx;

    .stat-card {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 30rpx;
      background: linear-gradient(135deg, #409EFF, #67C23A);
      border-radius: 16rpx;
      color: white;

      .stat-icon {
        width: 80rpx;
        height: 80rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        margin-right: 20rpx;
        font-size: 40rpx;
      }

      .stat-info {
        flex: 1;

        .stat-value {
          display: block;
          font-size: 36rpx;
          font-weight: bold;
          margin-bottom: 8rpx;
        }

        .stat-label {
          font-size: 24rpx;
          opacity: 0.9;
        }
      }
    }
  }
}

.quick-actions {
  padding: 30rpx;
  background: white;
  margin-bottom: 20rpx;

  .action-grid {
    display: flex;
    justify-content: space-between;

    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20rpx;
      min-width: 120rpx;

      .action-icon {
        width: 80rpx;
        height: 80rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f0f9ff;
        border-radius: 50%;
        margin-bottom: 16rpx;
        font-size: 36rpx;
        color: #409EFF;
      }

      .action-label {
        font-size: 24rpx;
        color: #606266;
      }
    }
  }
}

.today-records, .recommendations {
  background: white;
  margin-bottom: 20rpx;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;

    .section-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #303133;
    }

    .section-more {
      font-size: 26rpx;
      color: #409EFF;
    }
  }

  .records-list {
    .record-item {
      display: flex;
      align-items: center;
      padding: 30rpx;
      border-bottom: 1rpx solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .record-info {
        flex: 1;

        .record-title {
          font-size: 30rpx;
          font-weight: bold;
          color: #303133;
          margin-bottom: 12rpx;
        }

        .record-details {
          display: flex;
          gap: 20rpx;
          margin-bottom: 8rpx;

          .detail-item {
            font-size: 24rpx;
            color: #909399;
            padding: 4rpx 12rpx;
            background: #f5f7fa;
            border-radius: 8rpx;
          }
        }

        .record-time {
          font-size: 22rpx;
          color: #c0c4cc;
        }
      }

      .record-cost {
        .cost-value {
          font-size: 28rpx;
          font-weight: bold;
          color: #67C23A;
        }
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 80rpx 30rpx;

    .empty-text {
      font-size: 28rpx;
      color: #909399;
      margin-bottom: 30rpx;
    }

    .empty-action {
      background: #409EFF;
      color: white;
      border: none;
      padding: 16rpx 40rpx;
      border-radius: 40rpx;
      font-size: 26rpx;
    }
  }

  .formula-scroll {
    white-space: nowrap;

    .formula-list {
      display: flex;
      padding: 30rpx;
      gap: 20rpx;

      .formula-card {
        flex-shrink: 0;
        width: 200rpx;
        padding: 30rpx 20rpx;
        background: #f8f9fa;
        border-radius: 12rpx;
        text-align: center;

        .formula-name {
          font-size: 26rpx;
          font-weight: bold;
          color: #303133;
          margin-bottom: 12rpx;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .formula-cost {
          font-size: 24rpx;
          color: #67C23A;
          margin-bottom: 8rpx;
        }

        .formula-usage {
          font-size: 22rpx;
          color: #909399;
        }
      }
    }
  }
}

.bottom-safe {
  height: 40rpx;
}
</style>