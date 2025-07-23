<template>
  <view class="materials-page">
    <!-- 统计卡片 -->
    <view class="stats-section">
      <view class="stats-grid">
        <view class="stat-card">
          <view class="stat-number">{{ statistics.total_materials || 0 }}</view>
          <view class="stat-label">物资种类</view>
        </view>
        <view class="stat-card">
          <view class="stat-number">¥{{ formatCurrency(statistics.total_value || 0) }}</view>
          <view class="stat-label">库存价值</view>
        </view>
        <view class="stat-card warning">
          <view class="stat-number">{{ statistics.low_stock_count || 0 }}</view>
          <view class="stat-label">低库存</view>
        </view>
        <view class="stat-card danger">
          <view class="stat-number">{{ statistics.alert_count || 0 }}</view>
          <view class="stat-label">待处理预警</view>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <view class="menu-title">物资管理</view>
      <view class="menu-grid">
        <view class="menu-item" @click="navigateTo('/pages/materials/inventory')">
          <view class="menu-icon">
            <ModernIcon name="package" size="lg" />
          </view>
          <view class="menu-text">库存查询</view>
          <view class="menu-desc">查看物资库存情况</view>
        </view>
        <view class="menu-item" @click="showTransactionModal('inbound')">
          <view class="menu-icon">
            <ModernIcon name="download" size="lg" />
          </view>
          <view class="menu-text">快速入库</view>
          <view class="menu-desc">物资入库操作</view>
        </view>
        <view class="menu-item" @click="showTransactionModal('outbound')">
          <view class="menu-icon">
            <ModernIcon name="upload" size="lg" />
          </view>
          <view class="menu-text">快速出库</view>
          <view class="menu-desc">物资出库操作</view>
        </view>
        <view class="menu-item" @click="navigateTo('/pages/materials/stocktaking')">
          <view class="menu-icon">
            <ModernIcon name="document" size="lg" />
          </view>
          <view class="menu-text">库存盘点</view>
          <view class="menu-desc">盘点库存数量</view>
        </view>
        <view class="menu-item" @click="navigateTo('/pages/materials/alerts')">
          <view class="menu-icon">
            <ModernIcon name="warning" size="lg" />
          </view>
          <view class="menu-text">库存预警</view>
          <view class="menu-desc">查看预警信息</view>
          <view v-if="activeAlertsCount > 0" class="badge">{{ activeAlertsCount }}</view>
        </view>
        <view class="menu-item" @click="syncOfflineData">
          <view class="menu-icon">
            <ModernIcon name="refresh" size="lg" />
          </view>
          <view class="menu-text">数据同步</view>
          <view class="menu-desc">同步离线数据</view>
        </view>
      </view>
    </view>

    <!-- 最近交易记录 -->
    <view class="recent-section">
      <view class="section-header">
        <view class="section-title">最近交易</view>
        <view class="section-more" @click="navigateTo('/pages/materials/inventory?tab=transactions')">
          查看更多
        </view>
      </view>
      <view class="transaction-list">
        <view 
          v-for="transaction in recentTransactions" 
          :key="transaction.id"
          class="transaction-item"
        >
          <view class="transaction-info">
            <view class="transaction-title">{{ transaction.material && transaction.material.name }}</view>
            <view class="transaction-desc">
              {{ getTransactionTypeName(transaction.transaction_type) }}
              {{ transaction.quantity }} {{ transaction.material && transaction.material.unit }}
            </view>
          </view>
          <view class="transaction-meta">
            <view class="transaction-time">{{ formatTime(transaction.transaction_date) }}</view>
            <view 
              class="transaction-type" 
              :class="'transaction-type-' + transaction.transaction_type"
            >
              {{ getTransactionTypeName(transaction.transaction_type) }}
            </view>
          </view>
        </view>
        <view v-if="recentTransactions.length === 0" class="empty-state">
          <view class="empty-icon">
            <ModernIcon name="document" size="xl" />
          </view>
          <view class="empty-text">暂无交易记录</view>
        </view>
      </view>
    </view>

    <!-- 低库存预警 -->
    <view class="alerts-section" v-if="lowStockAlerts.length > 0">
      <view class="section-header">
        <view class="section-title">低库存预警</view>
        <view class="section-more" @click="navigateTo('/pages/materials/alerts')">
          查看全部
        </view>
      </view>
      <view class="alert-list">
        <view 
          v-for="alert in lowStockAlerts" 
          :key="alert.id"
          class="alert-item"
          :class="alert.alert_level === 'high' ? 'alert-high' : alert.alert_level === 'medium' ? 'alert-medium' : 'alert-low'"
        >
          <view class="alert-info">
            <view class="alert-title">{{ alert.material && alert.material.name }}</view>
            <view class="alert-desc">{{ alert.message }}</view>
          </view>
          <view class="alert-level">{{ getAlertLevelName(alert.alert_level) }}</view>
        </view>
      </view>
    </view>

    <!-- 快速交易弹窗 -->
    <uni-popup ref="transactionPopup" type="bottom" :safe-area="false">
      <view class="transaction-modal">
        <view class="modal-header">
          <view class="modal-title">{{ transactionType === 'inbound' ? '快速入库' : '快速出库' }}</view>
          <view class="modal-close" @click="closeTransactionModal">✕</view>
        </view>
        <view class="modal-content">
          <view class="form-group">
            <view class="form-label">选择物资</view>
            <picker 
              :range="materials" 
              range-key="name" 
              @change="onMaterialChange"
              :value="selectedMaterialIndex"
            >
              <view class="picker-input">
                {{ selectedMaterial && selectedMaterial.name || '请选择物资' }}
              </view>
            </picker>
          </view>
          
          <view class="form-group">
            <view class="form-label">选择基地</view>
            <picker 
              :range="bases" 
              range-key="name" 
              @change="onBaseChange"
              :value="selectedBaseIndex"
            >
              <view class="picker-input">
                {{ selectedBase && selectedBase.name || '请选择基地' }}
              </view>
            </picker>
          </view>

          <view class="form-group">
            <view class="form-label">数量</view>
            <input 
              class="form-input" 
              type="digit" 
              v-model="transactionForm.quantity"
              placeholder="请输入数量"
            />
            <view class="form-unit">{{ selectedMaterial && selectedMaterial.unit || '' }}</view>
          </view>

          <view class="form-group">
            <view class="form-label">单价（可选）</view>
            <input 
              class="form-input" 
              type="digit" 
              v-model="transactionForm.unit_price"
              placeholder="请输入单价"
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

          <view v-if="currentStock !== null" class="stock-info">
            <text>当前库存：{{ currentStock }} {{ selectedMaterial && selectedMaterial.unit || '' }}</text>
          </view>
        </view>
        <view class="modal-footer">
          <button class="btn-cancel" @click="closeTransactionModal">取消</button>
          <button class="btn-confirm" @click="submitTransaction" :disabled="!canSubmit">
            {{ transactionType === 'inbound' ? '入库' : '出库' }}
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
import { materialApi } from '@/api/material'
import { baseApi } from '@/api/base'
import ModernIcon from '@/components/ModernIcon.vue'

export default {
  data() {
    return {
      materialStore: null,
      baseStore: null,
      statistics: {},
      recentTransactions: [],
      lowStockAlerts: [],
      materials: [],
      bases: [],
      transactionType: 'inbound',
      selectedMaterialIndex: 0,
      selectedBaseIndex: 0,
      selectedMaterial: null,
      selectedBase: null,
      currentStock: null,
      transactionForm: {
        quantity: '',
        unit_price: '',
        remark: ''
      },
      loading: false
    }
  },

  computed: {
    activeAlertsCount() {
      return this.lowStockAlerts.filter(alert => !alert.is_resolved).length
    },

    canSubmit() {
      return this.selectedMaterial && 
             this.selectedBase && 
             this.transactionForm.quantity && 
             parseFloat(this.transactionForm.quantity) > 0
    }
  },

  onLoad() {
    this.loadData()
  },

  onPullDownRefresh() {
    this.loadData().finally(() => {
      uni.stopPullDownRefresh()
    })
  },

  onShow() {
    // 页面显示时刷新数据
    this.loadData()
  },

  methods: {
    async loadData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadStatistics(),
          this.loadRecentTransactions(),
          this.loadLowStockAlerts(),
          this.loadMaterials(),
          this.loadBases()
        ])
      } catch (error) {
        console.error('加载数据失败:', error)
        uni.showToast({
          title: '加载数据失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
      }
    },

    async loadStatistics() {
      try {
        const response = await materialApi.getStatistics()
        this.statistics = response.data || {}
      } catch (error) {
        console.error('加载统计数据失败:', error)
        this.statistics = {}
      }
    },

    async loadRecentTransactions() {
      try {
        const response = await materialApi.getTransactions({ limit: 5 })
        this.recentTransactions = response.data || []
      } catch (error) {
        console.error('加载交易记录失败:', error)
        this.recentTransactions = []
      }
    },

    async loadLowStockAlerts() {
      try {
        const response = await materialApi.getAlerts()
        const alerts = response.data || []
        this.lowStockAlerts = alerts
          .filter(alert => !alert.is_resolved && alert.alert_type === 'low_stock')
          .slice(0, 3)
      } catch (error) {
        console.error('加载预警数据失败:', error)
        this.lowStockAlerts = []
      }
    },

    async loadMaterials() {
      try {
        const response = await materialApi.getMaterials({ limit: 1000 })
        this.materials = response.data || []
      } catch (error) {
        console.error('加载物资列表失败:', error)
        this.materials = []
      }
    },

    async loadBases() {
      try {
        const response = await baseApi.getBases()
        this.bases = response.data || []
      } catch (error) {
        console.error('加载基地列表失败:', error)
        this.bases = []
      }
    },

    navigateTo(url) {
      uni.navigateTo({ url })
    },

    showTransactionModal(type) {
      this.transactionType = type
      this.resetTransactionForm()
      this.$refs.transactionPopup.open()
    },

    closeTransactionModal() {
      this.$refs.transactionPopup.close()
      this.resetTransactionForm()
    },

    resetTransactionForm() {
      this.selectedMaterialIndex = 0
      this.selectedBaseIndex = 0
      this.selectedMaterial = null
      this.selectedBase = null
      this.currentStock = null
      this.transactionForm = {
        quantity: '',
        unit_price: '',
        remark: ''
      }
    },

    onMaterialChange(e) {
      this.selectedMaterialIndex = e.detail.value
      this.selectedMaterial = this.materials[this.selectedMaterialIndex]
      this.updateCurrentStock()
    },

    onBaseChange(e) {
      this.selectedBaseIndex = e.detail.value
      this.selectedBase = this.bases[this.selectedBaseIndex]
      this.updateCurrentStock()
    },

    async updateCurrentStock() {
      if (this.selectedMaterial && this.selectedBase) {
        try {
          const response = await materialApi.getInventory({
            material_id: this.selectedMaterial.id,
            base_id: this.selectedBase.id
          })
          const inventory = response.data || {}
          this.currentStock = inventory.current_stock || 0
        } catch (error) {
          this.currentStock = 0
        }
      }
    },

    async submitTransaction() {
      if (!this.canSubmit) return

      try {
        uni.showLoading({ title: '提交中...' })

        const data = {
          material_id: this.selectedMaterial.id,
          base_id: this.selectedBase.id,
          transaction_type: this.transactionType,
          quantity: parseFloat(this.transactionForm.quantity),
          unit_price: this.transactionForm.unit_price ? parseFloat(this.transactionForm.unit_price) : undefined,
          remark: this.transactionForm.remark
        }

        await materialApi.createTransaction(data)
        
        uni.showToast({
          title: '操作成功',
          icon: 'success'
        })

        this.closeTransactionModal()
        this.loadData() // 刷新数据
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

    async syncOfflineData() {
      try {
        uni.showLoading({ title: '同步中...' })
        
        const response = await materialApi.syncOfflineData()
        const result = response.data || { synced: 0, failed: 0 }
        
        if (result.synced > 0 || result.failed > 0) {
          uni.showToast({
            title: `同步完成：成功${result.synced}条，失败${result.failed}条`,
            icon: 'none',
            duration: 3000
          })
          
          // 刷新数据
          this.loadData()
        } else {
          uni.showToast({
            title: '暂无需要同步的数据',
            icon: 'none'
          })
        }
      } catch (error) {
        console.error('数据同步失败:', error)
        uni.showToast({
          title: '同步失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },

    formatCurrency(amount) {
      return amount.toLocaleString('zh-CN', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })
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
    },

    getTransactionTypeName(type) {
      const names = {
        inbound: '入库',
        outbound: '出库',
        transfer: '调拨',
        adjustment: '盘点'
      }
      return names[type] || type
    },

    getTransactionTypeClass(type) {
      return `transaction-type-${type}`
    },

    getAlertLevelName(level) {
      const names = {
        low: '低',
        medium: '中',
        high: '高'
      }
      return names[level] || level
    },

    getAlertLevelClass(level) {
      return `alert-level-${level}`
    }
  }
}
</script>

<style lang="scss" scoped>
.materials-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.stats-section {
  background: white;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30rpx 20rpx;
  border-radius: 12rpx;
  color: white;
  text-align: center;

  &.warning {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &.danger {
    background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
  }
}

.stat-number {
  font-size: 48rpx;
  font-weight: bold;
  line-height: 1;
}

.stat-label {
  font-size: 24rpx;
  margin-top: 10rpx;
  opacity: 0.9;
}

.menu-section {
  background: white;
  padding: 30rpx 20rpx;
  margin-bottom: 20rpx;
}

.menu-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 30rpx;
}

.menu-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.menu-item {
  position: relative;
  background: #f8f9fa;
  padding: 30rpx 20rpx;
  border-radius: 12rpx;
  text-align: center;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;

  &:active {
    background: #e9ecef;
    border-color: #007aff;
  }
}

.menu-icon {
  font-size: 48rpx;
  margin-bottom: 10rpx;
}

.menu-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 5rpx;
}

.menu-desc {
  font-size: 22rpx;
  color: #666;
}

.badge {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  background: #ff4757;
  color: white;
  font-size: 20rpx;
  padding: 4rpx 8rpx;
  border-radius: 20rpx;
  min-width: 32rpx;
  text-align: center;
}

.recent-section, .alerts-section {
  background: white;
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 20rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.section-more {
  font-size: 24rpx;
  color: #007aff;
}

.transaction-list, .alert-list {
  padding: 0 20rpx;
}

.transaction-item, .alert-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;

  &:last-child {
    border-bottom: none;
  }
}

.transaction-info, .alert-info {
  flex: 1;
}

.transaction-title, .alert-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 8rpx;
}

.transaction-desc, .alert-desc {
  font-size: 24rpx;
  color: #666;
}

.transaction-meta {
  text-align: right;
}

.transaction-time {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.transaction-type {
  font-size: 20rpx;
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  color: white;

  &.transaction-type-inbound {
    background: #52c41a;
  }

  &.transaction-type-outbound {
    background: #faad14;
  }

  &.transaction-type-transfer {
    background: #1890ff;
  }

  &.transaction-type-adjustment {
    background: #722ed1;
  }
}

.alert-level {
  font-size: 20rpx;
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
  color: white;
}

.alert-level-low {
  .alert-level {
    background: #1890ff;
  }
}

.alert-level-medium {
  .alert-level {
    background: #faad14;
  }
}

.alert-level-high {
  .alert-level {
    background: #ff4d4f;
  }
}

.empty-state {
  text-align: center;
  padding: 80rpx 20rpx;
  color: #999;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
}

.transaction-modal {
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

.form-group {
  margin-bottom: 40rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 20rpx;
}

.picker-input, .form-input {
  background: #f8f9fa;
  padding: 24rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: 1rpx solid #e9ecef;
}

.form-input {
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

.stock-info {
  background: #e6f7ff;
  padding: 20rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  color: #1890ff;
}

.modal-footer {
  display: flex;
  padding: 30rpx;
  gap: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 24rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: none;
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