<template>
  <view class="inventory-page">
    <!-- 搜索栏 -->
    <view class="search-section">
      <view class="search-bar">
        <input 
          class="search-input" 
          type="text" 
          v-model="searchKeyword"
          placeholder="搜索物资名称或编码"
          @input="onSearchInput"
        />
        <ModernIcon name="search" @click="handleSearch" />
      </view>
      
      <!-- 筛选器 -->
      <view class="filter-bar">
        <picker 
          :range="bases" 
          range-key="name" 
          @change="onBaseChange"
          :value="selectedBaseIndex"
        >
          <view class="filter-item">
            <text>{{ selectedBase && selectedBase.name || '全部基地' }}</text>
            <text class="filter-arrow">▼</text>
          </view>
        </picker>
        
        <picker 
          :range="categories" 
          range-key="name" 
          @change="onCategoryChange"
          :value="selectedCategoryIndex"
        >
          <view class="filter-item">
            <text>{{ selectedCategory && selectedCategory.name || '全部分类' }}</text>
            <text class="filter-arrow">▼</text>
          </view>
        </picker>
        
        <view class="filter-item" @click="toggleLowStockOnly">
          <text :class="{ active: lowStockOnly }">低库存</text>
          <text class="filter-check">{{ lowStockOnly ? '✓' : '' }}</text>
        </view>
      </view>
    </view>

    <!-- 库存列表 -->
    <view class="inventory-list">
      <view 
        v-for="(item, index) in inventoryList" 
        :key="index"
        class="inventory-item"
        @click="showInventoryDetail(item)"
      >
        <view class="item-header">
          <view class="item-title">{{ item.material && item.material.name }}</view>
          <view class="item-code">{{ item.material && item.material.code }}</view>
        </view>
        
        <view class="item-content">
          <view class="stock-info">
            <view class="stock-row">
              <text class="stock-label">当前库存:</text>
              <text 
                class="stock-value" 
                :class="{ 'low-stock': item.current_stock <= (item.material && item.material.safety_stock || 0) }"
              >
                {{ item.current_stock }} {{ item.material && item.material.unit }}
              </text>
            </view>
            <view class="stock-row">
              <text class="stock-label">安全库存:</text>
              <text class="stock-value">{{ item.material && item.material.safety_stock || 0 }} {{ item.material && item.material.unit }}</text>
            </view>
            <view class="stock-row">
              <text class="stock-label">可用库存:</text>
              <text class="stock-value">{{ item.current_stock - item.reserved_stock }} {{ item.material && item.material.unit }}</text>
            </view>
          </view>
          
          <view class="item-meta">
            <view class="meta-item">
              <text class="meta-label">基地:</text>
              <text class="meta-value">{{ item.base && item.base.name }}</text>
            </view>
            <view class="meta-item">
              <text class="meta-label">更新:</text>
              <text class="meta-value">{{ formatTime(item.last_updated) }}</text>
            </view>
          </view>
        </view>
        
        <view class="item-actions">
          <view class="action-btn inbound" @click.stop="showTransactionModal('inbound', item)">
            入库
          </view>
          <view class="action-btn outbound" @click.stop="showTransactionModal('outbound', item)">
            出库
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="inventoryList.length === 0 && !loading" class="empty-state">
        <view class="empty-icon">
          <ModernIcon name="package" size="xl" />
        </view>
        <view class="empty-text">暂无库存数据</view>
        <view class="empty-desc">请检查筛选条件或联系管理员</view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view class="load-more" v-if="hasMore && !loading">
      <view class="load-more-btn" @click="loadMore">加载更多</view>
    </view>

    <!-- 库存详情弹窗 -->
    <uni-popup ref="detailPopup" type="bottom" :safe-area="false">
      <view class="detail-modal" v-if="selectedInventory">
        <view class="modal-header">
          <view class="modal-title">{{ selectedInventory.material && selectedInventory.material.name }}</view>
          <view class="modal-close" @click="closeDetailModal">✕</view>
        </view>
        
        <view class="modal-content">
          <view class="detail-section">
            <view class="section-title">库存信息</view>
            <view class="detail-grid">
              <view class="detail-item">
                <text class="detail-label">当前库存</text>
                <text class="detail-value">{{ selectedInventory.current_stock }} {{ selectedInventory.material && selectedInventory.material.unit }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">预留库存</text>
                <text class="detail-value">{{ selectedInventory.reserved_stock }} {{ selectedInventory.material && selectedInventory.material.unit }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">可用库存</text>
                <text class="detail-value">{{ selectedInventory.current_stock - selectedInventory.reserved_stock }} {{ selectedInventory.material && selectedInventory.material.unit }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">安全库存</text>
                <text class="detail-value">{{ selectedInventory.material && selectedInventory.material.safety_stock || 0 }} {{ selectedInventory.material && selectedInventory.material.unit }}</text>
              </view>
            </view>
          </view>
          
          <view class="detail-section">
            <view class="section-title">物资信息</view>
            <view class="detail-grid">
              <view class="detail-item">
                <text class="detail-label">物资编码</text>
                <text class="detail-value">{{ selectedInventory.material && selectedInventory.material.code }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">规格</text>
                <text class="detail-value">{{ selectedInventory.material && selectedInventory.material.specification || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">供应商</text>
                <text class="detail-value">{{ selectedInventory.material && selectedInventory.material.supplier && selectedInventory.material.supplier.name || '-' }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">采购价格</text>
                <text class="detail-value">
                  {{ selectedInventory.material && selectedInventory.material.purchase_price ? `¥${selectedInventory.material.purchase_price.toFixed(2)}` : '-' }}
                </text>
              </view>
            </view>
          </view>
        </view>
        
        <view class="modal-footer">
          <button class="btn-action inbound" @click="showTransactionModal('inbound', selectedInventory)">
            入库操作
          </button>
          <button class="btn-action outbound" @click="showTransactionModal('outbound', selectedInventory)">
            出库操作
          </button>
        </view>
      </view>
    </uni-popup>

    <!-- 交易操作弹窗 -->
    <uni-popup ref="transactionPopup" type="bottom" :safe-area="false">
      <view class="transaction-modal">
        <view class="modal-header">
          <view class="modal-title">{{ transactionType === 'inbound' ? '入库操作' : '出库操作' }}</view>
          <view class="modal-close" @click="closeTransactionModal">✕</view>
        </view>
        
        <view class="modal-content">
          <view class="material-info" v-if="transactionMaterial">
            <view class="info-title">{{ transactionMaterial.material && transactionMaterial.material.name }}</view>
            <view class="info-desc">当前库存: {{ transactionMaterial.current_stock }} {{ transactionMaterial.material && transactionMaterial.material.unit }}</view>
          </view>
          
          <view class="form-group">
            <view class="form-label">数量 *</view>
            <input 
              class="form-input" 
              type="digit" 
              v-model="transactionForm.quantity"
              placeholder="请输入数量"
            />
            <view class="form-unit">{{ transactionMaterial && transactionMaterial.material && transactionMaterial.material.unit || '' }}</view>
          </view>

          <view class="form-group">
            <view class="form-label">单价</view>
            <input 
              class="form-input" 
              type="digit" 
              v-model="transactionForm.unit_price"
              placeholder="请输入单价（可选）"
            />
          </view>

          <view class="form-group">
            <view class="form-label">备注</view>
            <textarea 
              class="form-textarea" 
              v-model="transactionForm.remark"
              placeholder="请输入备注信息"
              maxlength="200"
            />
          </view>
        </view>
        
        <view class="modal-footer">
          <button class="btn-cancel" @click="closeTransactionModal">取消</button>
          <button 
            class="btn-confirm" 
            @click="submitTransaction" 
            :disabled="!canSubmitTransaction"
          >
            确认{{ transactionType === 'inbound' ? '入库' : '出库' }}
          </button>
        </view>
      </view>
    </uni-popup>

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
import ModernIcon from '@/components/ModernIcon.vue'

export default {
  data() {
    return {
      materialStore: null,
      baseStore: null,
      inventoryList: [],
      bases: [],
      categories: [],
      searchKeyword: '',
      selectedBaseIndex: 0,
      selectedCategoryIndex: 0,
      selectedBase: null,
      selectedCategory: null,
      lowStockOnly: false,
      loading: false,
      hasMore: true,
      page: 1,
      limit: 20,
      selectedInventory: null,
      transactionType: 'inbound',
      transactionMaterial: null,
      transactionForm: {
        quantity: '',
        unit_price: '',
        remark: ''
      },
      searchTimer: null
    }
  },

  computed: {
    canSubmitTransaction() {
      return this.transactionForm.quantity && 
             parseFloat(this.transactionForm.quantity) > 0
    }
  },

  onLoad(options) {
    this.materialStore = useMaterialStore()
    this.baseStore = useBaseStore()
    
    // 处理页面参数
    if (options.tab) {
      // 如果有tab参数，可以切换到对应标签页
    }
    
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
        await Promise.all([
          this.loadBases(),
          this.loadCategories()
        ])
        await this.loadInventory()
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
      await this.loadInventory(true)
    },

    async loadBases() {
      try {
        await this.baseStore.fetchBases()
        this.bases = [{ id: null, name: '全部基地' }, ...this.baseStore.bases]
      } catch (error) {
        console.error('加载基地列表失败:', error)
      }
    },

    async loadCategories() {
      try {
        await this.materialStore.fetchCategories()
        this.categories = [{ id: null, name: '全部分类' }, ...this.materialStore.categories]
      } catch (error) {
        console.error('加载分类列表失败:', error)
      }
    },

    async loadInventory(refresh = false) {
      if (this.loading && !refresh) return

      this.loading = true
      try {
        const params = {
          page: this.page,
          limit: this.limit,
          keyword: this.searchKeyword || undefined,
          base_id: this.selectedBase && this.selectedBase.id || undefined,
          category_id: this.selectedCategory && this.selectedCategory.id || undefined,
          low_stock_only: this.lowStockOnly || undefined
        }

        const result = await this.materialStore.fetchInventory(params)
        
        if (refresh || this.page === 1) {
          this.inventoryList = result.data
        } else {
          this.inventoryList.push(...result.data)
        }

        this.hasMore = result.data.length === this.limit
      } catch (error) {
        console.error('加载库存数据失败:', error)
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
      await this.loadInventory()
    },

    onSearchInput() {
      // 防抖搜索
      if (this.searchTimer) {
        clearTimeout(this.searchTimer)
      }
      this.searchTimer = setTimeout(() => {
        this.handleSearch()
      }, 500)
    },

    handleSearch() {
      this.page = 1
      this.hasMore = true
      this.loadInventory(true)
    },

    onBaseChange(e) {
      this.selectedBaseIndex = e.detail.value
      this.selectedBase = this.bases[this.selectedBaseIndex]
      if (this.selectedBase && this.selectedBase.id === null) {
        this.selectedBase = null
      }
      this.handleSearch()
    },

    onCategoryChange(e) {
      this.selectedCategoryIndex = e.detail.value
      this.selectedCategory = this.categories[this.selectedCategoryIndex]
      if (this.selectedCategory && this.selectedCategory.id === null) {
        this.selectedCategory = null
      }
      this.handleSearch()
    },

    toggleLowStockOnly() {
      this.lowStockOnly = !this.lowStockOnly
      this.handleSearch()
    },

    showInventoryDetail(item) {
      this.selectedInventory = item
      this.$refs.detailPopup.open()
    },

    closeDetailModal() {
      this.$refs.detailPopup.close()
      this.selectedInventory = null
    },

    showTransactionModal(type, item) {
      this.transactionType = type
      this.transactionMaterial = item
      this.resetTransactionForm()
      
      // 关闭详情弹窗
      if (this.$refs.detailPopup) {
        this.$refs.detailPopup.close()
      }
      
      this.$refs.transactionPopup.open()
    },

    closeTransactionModal() {
      this.$refs.transactionPopup.close()
      this.resetTransactionForm()
    },

    resetTransactionForm() {
      this.transactionForm = {
        quantity: '',
        unit_price: '',
        remark: ''
      }
    },

    async submitTransaction() {
      if (!this.canSubmitTransaction) return

      try {
        uni.showLoading({ title: '提交中...' })

        const data = {
          material_id: this.transactionMaterial.material_id,
          base_id: this.transactionMaterial.base_id,
          transaction_type: this.transactionType,
          quantity: parseFloat(this.transactionForm.quantity),
          unit_price: this.transactionForm.unit_price ? parseFloat(this.transactionForm.unit_price) : undefined,
          remark: this.transactionForm.remark
        }

        await this.materialStore.createTransaction(data)
        
        uni.showToast({
          title: '操作成功',
          icon: 'success'
        })

        this.closeTransactionModal()
        this.refreshData() // 刷新数据
      } catch (error) {
        console.error('提交交易失败:', error)
        uni.showToast({
          title: error.message || '操作失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
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
    }
  }
}
</script>

<style lang="scss" scoped>
.inventory-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.search-section {
  background: white;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.search-bar {
  display: flex;
  align-items: center;
  background: #f8f9fa;
  border-radius: 50rpx;
  padding: 0 20rpx;
  margin-bottom: 20rpx;
}

.search-input {
  flex: 1;
  padding: 20rpx;
  font-size: 28rpx;
  background: transparent;
  border: none;
}

.search-btn {
  font-size: 32rpx;
  color: #666;
  padding: 10rpx;
}

.filter-bar {
  display: flex;
  gap: 20rpx;
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

  &.active {
    background: #e6f7ff;
    color: #1890ff;
  }
}

.filter-arrow, .filter-check {
  font-size: 20rpx;
  color: #999;
}

.inventory-list {
  padding: 0 20rpx;
}

.inventory-item {
  background: white;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.item-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.item-code {
  font-size: 24rpx;
  color: #666;
  background: #f0f0f0;
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
}

.item-content {
  margin-bottom: 20rpx;
}

.stock-info {
  margin-bottom: 20rpx;
}

.stock-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.stock-label {
  font-size: 26rpx;
  color: #666;
}

.stock-value {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;

  &.low-stock {
    color: #ff4d4f;
  }
}

.item-meta {
  display: flex;
  justify-content: space-between;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.meta-label {
  font-size: 22rpx;
  color: #999;
}

.meta-value {
  font-size: 22rpx;
  color: #666;
}

.item-actions {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  text-align: center;
  padding: 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: white;

  &.inbound {
    background: #52c41a;
  }

  &.outbound {
    background: #faad14;
  }
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

.detail-modal, .transaction-modal {
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
}

.material-info {
  background: #f8f9fa;
  padding: 20rpx;
  border-radius: 8rpx;
  margin-bottom: 30rpx;
}

.info-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.info-desc {
  font-size: 24rpx;
  color: #666;
}

.form-group {
  margin-bottom: 40rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 20rpx;
}

.form-input {
  background: #f8f9fa;
  padding: 24rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: 1rpx solid #e9ecef;
  width: 100%;
  box-sizing: border-box;
}

.form-unit {
  font-size: 24rpx;
  color: #666;
  margin-top: 10rpx;
}

.form-textarea {
  background: #f8f9fa;
  padding: 24rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: 1rpx solid #e9ecef;
  width: 100%;
  min-height: 120rpx;
  box-sizing: border-box;
}

.modal-footer {
  display: flex;
  padding: 30rpx;
  gap: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.btn-action, .btn-cancel, .btn-confirm {
  flex: 1;
  padding: 24rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: none;
  text-align: center;
}

.btn-action.inbound {
  background: #52c41a;
  color: white;
}

.btn-action.outbound {
  background: #faad14;
  color: white;
}

.btn-cancel {
  background: #f8f9fa;
  color: #666;
}

.btn-confirm {
  background: #007aff;
  color: white;

  &:disabled {
    background: #ccc;
    color: #999;
  }
}
</style>