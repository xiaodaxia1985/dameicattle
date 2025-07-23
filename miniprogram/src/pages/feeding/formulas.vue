<template>
  <view class="formulas-page">
    <!-- 搜索栏 -->
    <view class="search-section">
      <view class="search-bar">
        <text class="iconfont icon-search"></text>
        <input 
          class="search-input" 
          v-model="searchKeyword" 
          placeholder="搜索配方名称"
          @input="onSearchInput"
        />
        <text class="search-clear" v-if="searchKeyword" @tap="clearSearch">清除</text>
      </view>
    </view>

    <!-- 配方列表 -->
    <view class="formulas-list">
      <view 
        class="formula-card" 
        v-for="formula in filteredFormulas" 
        :key="formula.id"
        @tap="viewFormula(formula)"
      >
        <view class="formula-header">
          <view class="formula-name">{{ formula.name }}</view>
          <view class="formula-cost">¥{{ formula.costPerKg?.toFixed(2) }}/kg</view>
        </view>
        
        <view class="formula-description" v-if="formula.description">
          {{ formula.description }}
        </view>
        
        <view class="formula-ingredients">
          <view class="ingredients-title">配方成分:</view>
          <view class="ingredients-list">
            <text 
              class="ingredient-tag" 
              v-for="(ingredient, index) in formula.ingredients.slice(0, 3)" 
              :key="index"
            >
              {{ ingredient.name }} {{ ingredient.ratio }}%
            </text>
            <text class="ingredient-more" v-if="formula.ingredients.length > 3">
              +{{ formula.ingredients.length - 3 }}
            </text>
          </view>
        </view>
        
        <view class="formula-footer">
          <view class="formula-meta">
            <text class="meta-item">创建人: {{ formula.createdByName }}</text>
            <text class="meta-item">{{ formatDate(formula.createdAt) }}</text>
          </view>
          <view class="formula-actions">
            <button class="action-btn primary" @tap.stop="useFormula(formula)">
              使用配方
            </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="filteredFormulas.length === 0 && !loading">
      <text class="empty-text">{{ searchKeyword ? '未找到相关配方' : '暂无配方数据' }}</text>
    </view>

    <!-- 加载状态 -->
    <view class="loading-state" v-if="loading">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 配方详情弹窗 -->
    <uni-popup ref="formulaPopup" type="bottom" :safe-area="false">
      <view class="formula-detail" v-if="selectedFormula">
        <view class="detail-header">
          <text class="detail-title">{{ selectedFormula.name }}</text>
          <text class="detail-close" @tap="closeDetail">×</text>
        </view>
        
        <view class="detail-content">
          <view class="detail-section">
            <text class="section-title">基本信息</text>
            <view class="info-grid">
              <view class="info-item">
                <text class="info-label">成本</text>
                <text class="info-value">¥{{ selectedFormula.costPerKg?.toFixed(2) }}/kg</text>
              </view>
              <view class="info-item">
                <text class="info-label">创建人</text>
                <text class="info-value">{{ selectedFormula.createdByName }}</text>
              </view>
            </view>
            <view class="info-description" v-if="selectedFormula.description">
              <text class="info-label">描述</text>
              <text class="info-text">{{ selectedFormula.description }}</text>
            </view>
          </view>
          
          <view class="detail-section">
            <text class="section-title">配方成分</text>
            <view class="ingredients-table">
              <view class="table-header">
                <text class="col-name">成分名称</text>
                <text class="col-ratio">比例</text>
                <text class="col-cost">成本</text>
              </view>
              <view 
                class="table-row" 
                v-for="(ingredient, index) in selectedFormula.ingredients" 
                :key="index"
              >
                <text class="col-name">{{ ingredient.name }}</text>
                <text class="col-ratio">{{ ingredient.ratio }}%</text>
                <text class="col-cost">¥{{ ingredient.cost?.toFixed(2) || '0.00' }}</text>
              </view>
            </view>
          </view>
        </view>
        
        <view class="detail-actions">
          <button class="detail-btn secondary" @tap="closeDetail">关闭</button>
          <button class="detail-btn primary" @tap="useSelectedFormula">使用配方</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
// Removed pinia imports - using direct API calls instead

export default {
  name: 'FeedingFormulas',
  data() {
    return {
      formulas: [],
      searchKeyword: '',
      selectedFormula: null,
      loading: false
    }
  },
  computed: {
    filteredFormulas() {
      if (!this.searchKeyword) return this.formulas
      
      const keyword = this.searchKeyword.toLowerCase()
      return this.formulas.filter(formula => 
        formula.name.toLowerCase().includes(keyword) ||
        formula.description?.toLowerCase().includes(keyword) ||
        formula.ingredients.some(ingredient => 
          ingredient.name.toLowerCase().includes(keyword)
        )
      )
    }
  },
  onLoad() {
    this.loadFormulas()
  },
  onPullDownRefresh() {
    this.loadFormulas().finally(() => {
      uni.stopPullDownRefresh()
    })
  },
  methods: {
    async loadFormulas() {
      this.loading = true
      try {
        // Mock data for now - replace with actual API call
        this.formulas = [
          {
            id: 1,
            name: '标准育肥配方',
            description: '适用于育肥期牛只的标准饲料配方',
            costPerKg: 3.50,
            createdByName: '管理员',
            createdAt: new Date().toISOString(),
            ingredients: [
              { name: '玉米', ratio: 45, cost: 1.58 },
              { name: '豆粕', ratio: 25, cost: 0.88 },
              { name: '麸皮', ratio: 15, cost: 0.53 },
              { name: '预混料', ratio: 15, cost: 0.51 }
            ]
          }
        ]
      } catch (error) {
        console.error('加载配方失败:', error)
        uni.showToast({
          title: '加载失败',
          icon: 'error'
        })
      } finally {
        this.loading = false
      }
    },
    
    onSearchInput() {
      // 搜索输入处理
    },
    
    clearSearch() {
      this.searchKeyword = ''
    },
    
    viewFormula(formula) {
      this.selectedFormula = formula
      this.$refs.formulaPopup.open()
    },
    
    closeDetail() {
      this.$refs.formulaPopup.close()
      this.selectedFormula = null
    },
    
    useFormula(formula) {
      uni.navigateTo({
        url: `/pages/feeding/record?formulaId=${formula.id}`
      })
    },
    
    useSelectedFormula() {
      if (this.selectedFormula) {
        this.closeDetail()
        this.useFormula(this.selectedFormula)
      }
    },
    
    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN')
    }
  }
}
</script>

<style lang="scss" scoped>
.formulas-page {
  background-color: #f5f7fa;
  min-height: 100vh;
}

.search-section {
  background: white;
  padding: 30rpx;
  margin-bottom: 20rpx;

  .search-bar {
    display: flex;
    align-items: center;
    background: #f5f7fa;
    border-radius: 40rpx;
    padding: 0 30rpx;
    height: 70rpx;

    .iconfont {
      font-size: 32rpx;
      color: #c0c4cc;
      margin-right: 20rpx;
    }

    .search-input {
      flex: 1;
      font-size: 28rpx;
      color: #303133;
      background: transparent;
      border: none;
    }

    .search-clear {
      font-size: 24rpx;
      color: #409EFF;
      padding: 10rpx;
    }
  }
}

.formulas-list {
  padding: 0 30rpx;

  .formula-card {
    background: white;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.1);

    .formula-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;

      .formula-name {
        font-size: 32rpx;
        font-weight: bold;
        color: #303133;
        flex: 1;
      }

      .formula-cost {
        font-size: 28rpx;
        color: #67C23A;
        font-weight: bold;
      }
    }

    .formula-description {
      font-size: 26rpx;
      color: #606266;
      margin-bottom: 20rpx;
      line-height: 1.5;
    }

    .formula-ingredients {
      margin-bottom: 20rpx;

      .ingredients-title {
        font-size: 24rpx;
        color: #909399;
        margin-bottom: 12rpx;
      }

      .ingredients-list {
        display: flex;
        flex-wrap: wrap;
        gap: 12rpx;

        .ingredient-tag {
          background: #f0f9ff;
          color: #409EFF;
          padding: 8rpx 16rpx;
          border-radius: 20rpx;
          font-size: 22rpx;
        }

        .ingredient-more {
          background: #f5f7fa;
          color: #909399;
          padding: 8rpx 16rpx;
          border-radius: 20rpx;
          font-size: 22rpx;
        }
      }
    }

    .formula-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .formula-meta {
        flex: 1;

        .meta-item {
          display: block;
          font-size: 22rpx;
          color: #c0c4cc;
          margin-bottom: 4rpx;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .formula-actions {
        .action-btn {
          padding: 12rpx 24rpx;
          border-radius: 20rpx;
          font-size: 24rpx;
          border: none;

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
  }
}

.empty-state, .loading-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;

  .empty-text, .loading-text {
    font-size: 28rpx;
    color: #909399;
  }
}

.formula-detail {
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

    .detail-section {
      margin-bottom: 40rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .section-title {
        font-size: 28rpx;
        font-weight: bold;
        color: #303133;
        margin-bottom: 20rpx;
        display: block;
      }

      .info-grid {
        display: flex;
        gap: 40rpx;
        margin-bottom: 20rpx;

        .info-item {
          flex: 1;

          .info-label {
            display: block;
            font-size: 24rpx;
            color: #909399;
            margin-bottom: 8rpx;
          }

          .info-value {
            font-size: 26rpx;
            color: #303133;
            font-weight: bold;
          }
        }
      }

      .info-description {
        .info-label {
          display: block;
          font-size: 24rpx;
          color: #909399;
          margin-bottom: 8rpx;
        }

        .info-text {
          font-size: 26rpx;
          color: #606266;
          line-height: 1.5;
        }
      }

      .ingredients-table {
        .table-header {
          display: flex;
          background: #f5f7fa;
          padding: 20rpx;
          border-radius: 8rpx;
          margin-bottom: 12rpx;

          .col-name {
            flex: 2;
            font-size: 24rpx;
            color: #909399;
            font-weight: bold;
          }

          .col-ratio, .col-cost {
            flex: 1;
            font-size: 24rpx;
            color: #909399;
            font-weight: bold;
            text-align: center;
          }
        }

        .table-row {
          display: flex;
          padding: 20rpx;
          border-bottom: 1rpx solid #f0f0f0;

          &:last-child {
            border-bottom: none;
          }

          .col-name {
            flex: 2;
            font-size: 26rpx;
            color: #303133;
          }

          .col-ratio, .col-cost {
            flex: 1;
            font-size: 26rpx;
            color: #606266;
            text-align: center;
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