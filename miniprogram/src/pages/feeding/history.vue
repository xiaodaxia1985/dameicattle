<template>
  <view class="history-page">
    <!-- 筛选栏 -->
    <view class="filter-section">
      <scroll-view class="filter-scroll" scroll-x>
        <view class="filter-list">
          <picker 
            mode="date" 
            :value="startDate" 
            @change="onStartDateChange"
            :end="endDate"
          >
            <view class="filter-item">
              <text class="filter-label">开始日期</text>
              <text class="filter-value">{{ startDate || '选择日期' }}</text>
            </view>
          </picker>
          
          <picker 
            mode="date" 
            :value="endDate" 
            @change="onEndDateChange"
            :start="startDate"
            :end="today"
          >
            <view class="filter-item">
              <text class="filter-label">结束日期</text>
              <text class="filter-value">{{ endDate || '选择日期' }}</text>
            </view>
          </picker>
          
          <picker 
            :range="bases" 
            range-key="name" 
            :value="selectedBaseIndex" 
            @change="onBaseChange"
          >
            <view class="filter-item">
              <text class="filter-label">基地</text>
              <text class="filter-value">{{ selectedBase && selectedBase.name || '全部基地' }}</text>
            </view>
          </picker>
          
          <picker 
            :range="formulas" 
            range-key="name" 
            :value="selectedFormulaIndex" 
            @change="onFormulaChange"
          >
            <view class="filter-item">
              <text class="filter-label">配方</text>
              <text class="filter-value">{{ selectedFormula && selectedFormula.name || '全部配方' }}</text>
            </view>
          </picker>
        </view>
      </scroll-view>
      
      <view class="filter-actions">
        <button class="filter-btn reset" @tap="resetFilters">重置</button>
        <button class="filter-btn search" @tap="searchRecords">搜索</button>
      </view>
    </view>

    <!-- 统计信息 -->
    <view class="stats-section" v-if="statistics">
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-value">{{ statistics.totalRecords }}</text>
          <text class="stat-label">总记录数</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ statistics.totalAmount }}kg</text>
          <text class="stat-label">总饲喂量</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">¥{{ statistics.totalCost }}</text>
          <text class="stat-label">总成本</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">¥{{ statistics.avgDailyCost }}</text>
          <text class="stat-label">日均成本</text>
        </view>
      </view>
    </view>

    <!-- 记录列表 -->
    <view class="records-section">
      <view class="section-header">
        <text class="section-title">饲喂记录</text>
        <text class="section-count">共{{ totalRecords }}条</text>
      </view>
      
      <view class="records-list">
        <view 
          class="record-item" 
          v-for="record in records" 
          :key="record.id"
          @tap="viewRecord(record)"
        >
          <view class="record-date">
            <text class="date-day">{{ formatDay(record.feedingDate) }}</text>
            <text class="date-month">{{ formatMonth(record.feedingDate) }}</text>
          </view>
          
          <view class="record-content">
            <view class="record-header">
              <text class="record-formula">{{ record.formulaName }}</text>
              <text class="record-cost">¥{{ record.cost?.toFixed(2) || '0.00' }}</text>
            </view>
            
            <view class="record-details">
              <text class="detail-item">{{ record.baseName }}</text>
              <text class="detail-item" v-if="record.barnName">{{ record.barnName }}</text>
              <text class="detail-item">{{ record.amount }}kg</text>
            </view>
            
            <view class="record-footer">
              <text class="record-operator">{{ record.operatorName }}</text>
              <text class="record-time">{{ formatTime(record.createdAt) }}</text>
            </view>
          </view>
          
          <view class="record-actions">
            <text class="iconfont icon-arrow-right"></text>
          </view>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view class="load-more" v-if="hasMore">
        <button class="load-btn" @tap="loadMore" :disabled="loading">
          {{ loading ? '加载中...' : '加载更多' }}
        </button>
      </view>
      
      <!-- 空状态 -->
      <view class="empty-state" v-if="records.length === 0 && !loading">
        <text class="empty-text">暂无饲喂记录</text>
        <button class="empty-action" @tap="navigateToRecord">立即添加</button>
      </view>
    </view>

    <!-- 记录详情弹窗 -->
    <uni-popup ref="recordPopup" type="bottom" :safe-area="false">
      <view class="record-detail" v-if="selectedRecord">
        <view class="detail-header">
          <text class="detail-title">饲喂记录详情</text>
          <text class="detail-close" @tap="closeDetail">×</text>
        </view>
        
        <view class="detail-content">
          <view class="detail-info">
            <view class="info-row">
              <text class="info-label">饲喂日期</text>
              <text class="info-value">{{ selectedRecord.feedingDate }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">配方名称</text>
              <text class="info-value">{{ selectedRecord.formulaName }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">基地</text>
              <text class="info-value">{{ selectedRecord.baseName }}</text>
            </view>
            <view class="info-row" v-if="selectedRecord.barnName">
              <text class="info-label">牛棚</text>
              <text class="info-value">{{ selectedRecord.barnName }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">饲喂量</text>
              <text class="info-value">{{ selectedRecord.amount }}kg</text>
            </view>
            <view class="info-row">
              <text class="info-label">成本</text>
              <text class="info-value cost">¥{{ selectedRecord.cost?.toFixed(2) || '0.00' }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">操作员</text>
              <text class="info-value">{{ selectedRecord.operatorName }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">记录时间</text>
              <text class="info-value">{{ formatDateTime(selectedRecord.createdAt) }}</text>
            </view>
            <view class="info-row" v-if="selectedRecord.remark">
              <text class="info-label">备注</text>
              <text class="info-value">{{ selectedRecord.remark }}</text>
            </view>
          </view>
        </view>
        
        <view class="detail-actions">
          <button class="detail-btn secondary" @tap="closeDetail">关闭</button>
          <button class="detail-btn primary" @tap="editRecord">编辑记录</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
// Removed pinia imports - using direct API calls instead

export default {
  name: 'FeedingHistory',
  data() {
    return {
      records: [],
      bases: [],
      formulas: [],
      startDate: '',
      endDate: '',
      selectedBaseIndex: -1,
      selectedFormulaIndex: -1,
      selectedRecord: null,
      statistics: null,
      loading: false,
      hasMore: true,
      totalRecords: 0,
      currentPage: 1,
      pageSize: 20,
      today: ''
    }
  },
  computed: {
    selectedBase() {
      return this.selectedBaseIndex >= 0 ? this.bases[this.selectedBaseIndex] : null
    },
    
    selectedFormula() {
      return this.selectedFormulaIndex >= 0 ? this.formulas[this.selectedFormulaIndex] : null
    }
  },
  onLoad() {
    this.initData()
    this.loadData()
  },
  onPullDownRefresh() {
    this.refreshData().finally(() => {
      uni.stopPullDownRefresh()
    })
  },
  methods: {
    // Mock API methods - replace with actual API calls
    async fetchBases() {
      return { data: [{ id: 1, name: '主基地' }, { id: 2, name: '分基地' }] }
    },
    
    async fetchFormulas() {
      return { data: [{ id: 1, name: '标准配方' }, { id: 2, name: '育肥配方' }] }
    },
    
    async fetchFeedingRecords(params) {
      // Mock data
      const mockRecords = [
        {
          id: 1,
          feedingDate: '2024-01-15',
          formulaName: '标准配方',
          baseName: '主基地',
          barnName: '1号牛棚',
          amount: 100,
          cost: 350.00,
          operatorName: '张三',
          createdAt: '2024-01-15T08:30:00',
          remark: '正常饲喂'
        }
      ]
      return { data: mockRecords, total: mockRecords.length }
    },
    
    async fetchFeedingStatistics(params) {
      return { data: {} }
    },
    
    initData() {
      // 设置默认日期范围（最近30天）
      const today = new Date()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(today.getDate() - 30)
      
      this.today = today.toISOString().split('T')[0]
      this.endDate = this.today
      this.startDate = thirtyDaysAgo.toISOString().split('T')[0]
    },
    
    async loadData() {
      try {
        const [basesRes, formulasRes] = await Promise.all([
          this.fetchBases(),
          this.fetchFormulas()
        ])
        
        this.bases = [{ id: '', name: '全部基地' }, ...(basesRes.data || [])]
        this.formulas = [{ id: '', name: '全部配方' }, ...(formulasRes.data || [])]
        
        await this.loadRecords()
        await this.loadStatistics()
      } catch (error) {
        console.error('加载数据失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'error'
        })
      }
    },
    
    async refreshData() {
      this.currentPage = 1
      this.records = []
      this.hasMore = true
      await this.loadRecords()
      await this.loadStatistics()
    },
    
    async loadRecords() {
      if (this.loading) return
      
      this.loading = true
      try {
        const params = {
          page: this.currentPage,
          limit: this.pageSize,
          startDate: this.startDate,
          endDate: this.endDate
        }
        
        if (this.selectedBase?.id) {
          params.baseId = this.selectedBase.id
        }
        
        if (this.selectedFormula?.id) {
          params.formulaId = this.selectedFormula.id
        }
        
        const response = await this.fetchFeedingRecords(params)
        const newRecords = response.data || []
        
        if (this.currentPage === 1) {
          this.records = newRecords
        } else {
          this.records = [...this.records, ...newRecords]
        }
        
        this.totalRecords = response.total || 0
        this.hasMore = newRecords.length === this.pageSize
      } catch (error) {
        console.error('加载记录失败:', error)
        uni.showToast({
          title: '加载记录失败',
          icon: 'error'
        })
      } finally {
        this.loading = false
      }
    },
    
    async loadStatistics() {
      try {
        const params = {
          startDate: this.startDate,
          endDate: this.endDate
        }
        
        if (this.selectedBase?.id) {
          params.baseId = this.selectedBase.id
        }
        
        const response = await this.fetchFeedingStatistics(params)
        
        // 计算统计数据
        const totalAmount = this.records.reduce((sum, record) => sum + (record.amount || 0), 0)
        const totalCost = this.records.reduce((sum, record) => sum + (record.cost || 0), 0)
        const days = Math.max(1, Math.ceil((new Date(this.endDate).getTime() - new Date(this.startDate).getTime()) / (1000 * 60 * 60 * 24)))
        
        this.statistics = {
          totalRecords: this.totalRecords,
          totalAmount: totalAmount.toFixed(1),
          totalCost: totalCost.toFixed(2),
          avgDailyCost: (totalCost / days).toFixed(2)
        }
      } catch (error) {
        console.error('加载统计失败:', error)
      }
    },
    
    onStartDateChange(e) {
      this.startDate = e.detail.value
    },
    
    onEndDateChange(e) {
      this.endDate = e.detail.value
    },
    
    onBaseChange(e) {
      this.selectedBaseIndex = e.detail.value
    },
    
    onFormulaChange(e) {
      this.selectedFormulaIndex = e.detail.value
    },
    
    resetFilters() {
      this.initData()
      this.selectedBaseIndex = 0
      this.selectedFormulaIndex = 0
      this.refreshData()
    },
    
    searchRecords() {
      this.refreshData()
    },
    
    loadMore() {
      if (this.hasMore && !this.loading) {
        this.currentPage++
        this.loadRecords()
      }
    },
    
    viewRecord(record) {
      this.selectedRecord = record
      this.$refs.recordPopup.open()
    },
    
    closeDetail() {
      this.$refs.recordPopup.close()
      this.selectedRecord = null
    },
    
    editRecord() {
      if (this.selectedRecord) {
        this.closeDetail()
        uni.navigateTo({
          url: `/pages/feeding/record?id=${this.selectedRecord.id}`
        })
      }
    },
    
    navigateToRecord() {
      uni.navigateTo({
        url: '/pages/feeding/record'
      })
    },
    
    formatDay(dateString) {
      const date = new Date(dateString)
      return date.getDate().toString().padStart(2, '0')
    },
    
    formatMonth(dateString) {
      const date = new Date(dateString)
      const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
      return months[date.getMonth()]
    },
    
    formatTime(dateString) {
      const date = new Date(dateString)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    },
    
    formatDateTime(dateString) {
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN')
    }
  }
}
</script>

<style lang="scss" scoped>
.history-page {
  background-color: #f5f7fa;
  min-height: 100vh;
}

.filter-section {
  background: white;
  padding: 30rpx;
  margin-bottom: 20rpx;

  .filter-scroll {
    white-space: nowrap;
    margin-bottom: 20rpx;

    .filter-list {
      display: flex;
      gap: 20rpx;

      .filter-item {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20rpx;
        background: #f5f7fa;
        border-radius: 12rpx;
        min-width: 120rpx;

        .filter-label {
          font-size: 22rpx;
          color: #909399;
          margin-bottom: 8rpx;
        }

        .filter-value {
          font-size: 24rpx;
          color: #303133;
          font-weight: bold;
        }
      }
    }
  }

  .filter-actions {
    display: flex;
    gap: 20rpx;

    .filter-btn {
      flex: 1;
      height: 60rpx;
      border-radius: 30rpx;
      font-size: 26rpx;
      border: none;

      &.reset {
        background: #f5f7fa;
        color: #606266;
      }

      &.search {
        background: #409EFF;
        color: white;
      }
    }
  }
}

.stats-section {
  background: white;
  padding: 30rpx;
  margin-bottom: 20rpx;

  .stats-grid {
    display: flex;
    justify-content: space-between;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;

      .stat-value {
        font-size: 32rpx;
        font-weight: bold;
        color: #303133;
        margin-bottom: 8rpx;
      }

      .stat-label {
        font-size: 22rpx;
        color: #909399;
      }
    }
  }
}

.records-section {
  background: white;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;

    .section-title {
      font-size: 28rpx;
      font-weight: bold;
      color: #303133;
    }

    .section-count {
      font-size: 24rpx;
      color: #909399;
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

      .record-date {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 80rpx;
        margin-right: 20rpx;

        .date-day {
          font-size: 32rpx;
          font-weight: bold;
          color: #303133;
        }

        .date-month {
          font-size: 20rpx;
          color: #909399;
        }
      }

      .record-content {
        flex: 1;

        .record-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12rpx;

          .record-formula {
            font-size: 28rpx;
            font-weight: bold;
            color: #303133;
          }

          .record-cost {
            font-size: 26rpx;
            color: #67C23A;
            font-weight: bold;
          }
        }

        .record-details {
          display: flex;
          gap: 16rpx;
          margin-bottom: 12rpx;

          .detail-item {
            font-size: 22rpx;
            color: #909399;
            padding: 4rpx 12rpx;
            background: #f5f7fa;
            border-radius: 8rpx;
          }
        }

        .record-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .record-operator {
            font-size: 22rpx;
            color: #c0c4cc;
          }

          .record-time {
            font-size: 22rpx;
            color: #c0c4cc;
          }
        }
      }

      .record-actions {
        .iconfont {
          font-size: 24rpx;
          color: #c0c4cc;
        }
      }
    }
  }

  .load-more {
    padding: 30rpx;
    text-align: center;

    .load-btn {
      background: #f5f7fa;
      color: #606266;
      border: none;
      padding: 20rpx 40rpx;
      border-radius: 40rpx;
      font-size: 26rpx;

      &:disabled {
        opacity: 0.6;
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
}

.record-detail {
  background: white;
  border-radius: 20rpx 20rpx 0 0;
  max-height: 80vh;
  overflow: hidden;

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;

    .detail-title {
      font-size: 32rpx;
      font-weight: bold;
      color: #303133;
    }

    .detail-close {
      font-size: 40rpx;
      color: #c0c4cc;
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .detail-content {
    max-height: 60vh;
    overflow-y: auto;
    padding: 30rpx;

    .detail-info {
      .info-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20rpx 0;
        border-bottom: 1rpx solid #f0f0f0;

        &:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: 26rpx;
          color: #909399;
        }

        .info-value {
          font-size: 26rpx;
          color: #303133;
          font-weight: bold;

          &.cost {
            color: #67C23A;
          }
        }
      }
    }
  }

  .detail-actions {
    display: flex;
    gap: 20rpx;
    padding: 30rpx;
    border-top: 1rpx solid #f0f0f0;

    .detail-btn {
      flex: 1;
      height: 80rpx;
      border-radius: 40rpx;
      font-size: 28rpx;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;

      &.primary {
        background: #409EFF;
        color: white;
      }

      &.secondary {
        background: #f5f7fa;
        color: #606266;
      }
    }
  }
}
</style>