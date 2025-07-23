<template>
  <view class="stocktaking-page">
    <!-- 页面头部 -->
    <view class="page-header">
      <view class="header-title">库存盘点</view>
      <view class="header-desc">扫码或手动录入进行库存盘点</view>
    </view>

    <!-- 盘点模式选择 -->
    <view class="mode-section">
      <view class="mode-title">盘点模式</view>
      <view class="mode-options">
        <view 
          class="mode-option" 
          :class="{ active: mode === 'scan' }"
          @click="setMode('scan')"
        >
          <view class="mode-icon">
            <ModernIcon name="mobile" size="lg" />
          </view>
          <view class="mode-text">扫码盘点</view>
          <view class="mode-desc">扫描物资二维码</view>
        </view>
        <view 
          class="mode-option" 
          :class="{ active: mode === 'manual' }"
          @click="setMode('manual')"
        >
          <view class="mode-icon">
            <ModernIcon name="edit" size="lg" />
          </view>
          <view class="mode-text">手动盘点</view>
          <view class="mode-desc">手动选择物资</view>
        </view>
      </view>
    </view>

    <!-- 基地选择 -->
    <view class="base-section">
      <view class="section-title">选择基地</view>
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

    <!-- 扫码盘点区域 -->
    <view class="scan-section" v-if="mode === 'scan'">
      <view class="scan-area">
        <view class="scan-icon">
          <ModernIcon name="camera" size="xl" />
        </view>
        <view class="scan-text">点击扫描物资二维码</view>
        <button class="scan-btn" @click="startScan">开始扫码</button>
      </view>
    </view>

    <!-- 手动盘点区域 -->
    <view class="manual-section" v-if="mode === 'manual'">
      <view class="material-select">
        <view class="section-title">选择物资</view>
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

      <view class="quantity-input" v-if="selectedMaterial">
        <view class="section-title">实际库存数量</view>
        <view class="input-group">
          <input 
            class="quantity-field" 
            type="digit" 
            v-model="actualQuantity"
            placeholder="请输入实际库存数量"
          />
          <text class="unit-text">{{ selectedMaterial.unit }}</text>
        </view>
        <view class="current-stock" v-if="currentStock !== null">
          <text>系统库存: {{ currentStock }} {{ selectedMaterial.unit }}</text>
          <text class="diff" :class="diffClass">
            差异: {{ getDifference() }} {{ selectedMaterial.unit }}
          </text>
        </view>
      </view>

      <view class="remark-input">
        <view class="section-title">备注</view>
        <textarea 
          class="remark-field" 
          v-model="remark"
          placeholder="请输入盘点备注（可选）"
          maxlength="200"
        />
      </view>

      <button 
        class="submit-btn" 
        @click="submitStocktaking"
        :disabled="!canSubmit"
      >
        提交盘点记录
      </button>
    </view>

    <!-- 盘点记录列表 -->
    <view class="records-section">
      <view class="section-header">
        <view class="section-title">今日盘点记录</view>
        <view class="record-count">{{ stocktakingRecords.length }} 条</view>
      </view>
      
      <view class="records-list">
        <view 
          v-for="record in stocktakingRecords" 
          :key="record.id"
          class="record-item"
        >
          <view class="record-header">
            <view class="record-title">{{ record.material && record.material.name }}</view>
            <view class="record-time">{{ formatTime(record.transaction_date) }}</view>
          </view>
          
          <view class="record-content">
            <view class="record-row">
              <text class="record-label">系统库存:</text>
              <text class="record-value">{{ record.system_stock }} {{ record.material && record.material.unit }}</text>
            </view>
            <view class="record-row">
              <text class="record-label">实际库存:</text>
              <text class="record-value">{{ record.actual_stock }} {{ record.material && record.material.unit }}</text>
            </view>
            <view class="record-row">
              <text class="record-label">差异:</text>
              <text class="record-value" :class="record.difference > 0 ? 'positive' : record.difference < 0 ? 'negative' : 'zero'">
                {{ record.difference }} {{ record.material && record.material.unit }}
              </text>
            </view>
            <view class="record-row" v-if="record.remark">
              <text class="record-label">备注:</text>
              <text class="record-value">{{ record.remark }}</text>
            </view>
          </view>
        </view>
        
        <!-- 空状态 -->
        <view v-if="stocktakingRecords.length === 0" class="empty-state">
          <view class="empty-icon">
            <ModernIcon name="document" size="xl" />
          </view>
          <view class="empty-text">今日暂无盘点记录</view>
          <view class="empty-desc">开始盘点以记录库存差异</view>
        </view>
      </view>
    </view>

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
      mode: 'scan', // scan | manual
      bases: [],
      materials: [],
      selectedBaseIndex: 0,
      selectedMaterialIndex: 0,
      selectedBase: null,
      selectedMaterial: null,
      actualQuantity: '',
      currentStock: null,
      remark: '',
      stocktakingRecords: [],
      loading: false
    }
  },

  computed: {
    canSubmit() {
      return this.selectedBase && 
             this.selectedMaterial && 
             this.actualQuantity !== '' && 
             !isNaN(parseFloat(this.actualQuantity))
    },

    getDifference() {
      if (this.currentStock === null || this.actualQuantity === '') {
        return 0
      }
      return parseFloat(this.actualQuantity) - this.currentStock
    },

    diffClass() {
      const diff = this.getDifference()
      if (diff > 0) return 'positive'
      if (diff < 0) return 'negative'
      return 'zero'
    }
  },

  onLoad() {
    this.materialStore = useMaterialStore()
    this.baseStore = useBaseStore()
    this.loadInitialData()
  },

  onPullDownRefresh() {
    this.loadInitialData().finally(() => {
      uni.stopPullDownRefresh()
    })
  },

  methods: {
    async loadInitialData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadBases(),
          this.loadMaterials(),
          this.loadTodayRecords()
        ])
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

    async loadBases() {
      try {
        await this.baseStore.fetchBases()
        this.bases = this.baseStore.bases
      } catch (error) {
        console.error('加载基地列表失败:', error)
      }
    },

    async loadMaterials() {
      try {
        await this.materialStore.fetchMaterials({ limit: 1000 })
        this.materials = this.materialStore.materials
      } catch (error) {
        console.error('加载物资列表失败:', error)
      }
    },

    async loadTodayRecords() {
      try {
        const today = new Date().toISOString().split('T')[0]
        await this.materialStore.fetchTransactions({
          transaction_type: 'adjustment',
          start_date: today,
          end_date: today,
          limit: 100
        })
        
        // 处理盘点记录，添加计算字段
        this.stocktakingRecords = this.materialStore.transactions.map(record => ({
          ...record,
          system_stock: record.system_stock || 0, // 需要后端提供
          actual_stock: record.quantity,
          difference: record.quantity - (record.system_stock || 0)
        }))
      } catch (error) {
        console.error('加载盘点记录失败:', error)
      }
    },

    setMode(mode) {
      this.mode = mode
      this.resetForm()
    },

    onBaseChange(e) {
      this.selectedBaseIndex = e.detail.value
      this.selectedBase = this.bases[this.selectedBaseIndex]
      this.resetMaterialSelection()
    },

    onMaterialChange(e) {
      this.selectedMaterialIndex = e.detail.value
      this.selectedMaterial = this.materials[this.selectedMaterialIndex]
      this.loadCurrentStock()
    },

    async loadCurrentStock() {
      if (!this.selectedMaterial || !this.selectedBase) return

      try {
        const inventory = await this.materialStore.getInventoryByMaterial(
          this.selectedMaterial.id,
          this.selectedBase.id
        )
        this.currentStock = inventory.current_stock
      } catch (error) {
        console.error('获取当前库存失败:', error)
        this.currentStock = 0
      }
    },

    startScan() {
      uni.scanCode({
        success: (res) => {
          this.handleScanResult(res.result)
        },
        fail: (err) => {
          console.error('扫码失败:', err)
          uni.showToast({
            title: '扫码失败',
            icon: 'none'
          })
        }
      })
    },

    async handleScanResult(scanData) {
      try {
        uni.showLoading({ title: '识别中...' })
        
        // 这里需要根据扫码结果解析物资信息
        // 假设扫码结果是物资编码或包含物资信息的JSON
        let materialCode = scanData
        
        // 如果是JSON格式，解析出物资编码
        try {
          const parsed = JSON.parse(scanData)
          if (parsed.materialCode) {
            materialCode = parsed.materialCode
          }
        } catch (e) {
          // 不是JSON格式，直接使用扫码结果作为物资编码
        }
        
        // 根据物资编码查找物资
        const material = this.materials.find(m => m.code === materialCode)
        if (!material) {
          throw new Error('未找到对应的物资信息')
        }
        
        // 设置选中的物资
        this.selectedMaterialIndex = this.materials.indexOf(material)
        this.selectedMaterial = material
        
        // 加载当前库存
        await this.loadCurrentStock()
        
        // 切换到手动模式以便输入数量
        this.mode = 'manual'
        
        uni.showToast({
          title: '识别成功',
          icon: 'success'
        })
      } catch (error) {
        console.error('处理扫码结果失败:', error)
        uni.showToast({
          title: error.message || '识别失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },

    async submitStocktaking() {
      if (!this.canSubmit) return

      try {
        uni.showLoading({ title: '提交中...' })

        const data = {
          material_id: this.selectedMaterial.id,
          base_id: this.selectedBase.id,
          transaction_type: 'adjustment',
          quantity: parseFloat(this.actualQuantity),
          remark: this.remark || `盘点调整，实际库存：${this.actualQuantity}${this.selectedMaterial.unit}，系统库存：${this.currentStock}${this.selectedMaterial.unit}`
        }

        await this.materialStore.createTransaction(data)
        
        uni.showToast({
          title: '盘点记录提交成功',
          icon: 'success'
        })

        // 重置表单
        this.resetForm()
        
        // 刷新记录列表
        await this.loadTodayRecords()
      } catch (error) {
        console.error('提交盘点记录失败:', error)
        uni.showToast({
          title: error.message || '提交失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },

    resetForm() {
      this.actualQuantity = ''
      this.currentStock = null
      this.remark = ''
      this.resetMaterialSelection()
    },

    resetMaterialSelection() {
      this.selectedMaterialIndex = 0
      this.selectedMaterial = null
    },

    getDiffClass() {
      const diff = this.getDifference()
      if (diff > 0) return 'positive'
      if (diff < 0) return 'negative'
      return 'zero'
    },

    getRecordDiffClass(record) {
      if (record.difference > 0) return 'positive'
      if (record.difference < 0) return 'negative'
      return 'zero'
    },

    formatTime(dateString) {
      return new Date(dateString).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.stocktaking-page {
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40rpx 30rpx;
  text-align: center;
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.header-desc {
  font-size: 24rpx;
  opacity: 0.9;
}

.mode-section {
  background: white;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.mode-title, .section-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.mode-options {
  display: flex;
  gap: 20rpx;
}

.mode-option {
  flex: 1;
  background: #f8f9fa;
  padding: 30rpx 20rpx;
  border-radius: 12rpx;
  text-align: center;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;

  &.active {
    background: #e6f7ff;
    border-color: #1890ff;
  }
}

.mode-icon {
  font-size: 48rpx;
  margin-bottom: 10rpx;
}

.mode-text {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 5rpx;
}

.mode-desc {
  font-size: 22rpx;
  color: #666;
}

.base-section, .manual-section {
  background: white;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.picker-input {
  background: #f8f9fa;
  padding: 24rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: 1rpx solid #e9ecef;
  color: #333;
}

.scan-section {
  background: white;
  padding: 60rpx 30rpx;
  margin-bottom: 20rpx;
  text-align: center;
}

.scan-area {
  padding: 80rpx 40rpx;
  border: 2rpx dashed #ddd;
  border-radius: 12rpx;
}

.scan-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.scan-text {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 40rpx;
}

.scan-btn {
  background: #1890ff;
  color: white;
  padding: 24rpx 48rpx;
  border-radius: 50rpx;
  font-size: 28rpx;
  border: none;
}

.material-select, .quantity-input, .remark-input {
  margin-bottom: 40rpx;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.quantity-field {
  flex: 1;
  background: #f8f9fa;
  padding: 24rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: 1rpx solid #e9ecef;
}

.unit-text {
  font-size: 24rpx;
  color: #666;
}

.current-stock {
  background: #f0f8ff;
  padding: 20rpx;
  border-radius: 8rpx;
  margin-top: 20rpx;
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
}

.diff {
  font-weight: bold;

  &.positive {
    color: #52c41a;
  }

  &.negative {
    color: #ff4d4f;
  }

  &.zero {
    color: #666;
  }
}

.remark-field {
  background: #f8f9fa;
  padding: 24rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: 1rpx solid #e9ecef;
  width: 100%;
  min-height: 120rpx;
  box-sizing: border-box;
}

.submit-btn {
  width: 100%;
  background: #52c41a;
  color: white;
  padding: 28rpx;
  border-radius: 8rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;

  &:disabled {
    background: #ccc;
    color: #999;
  }
}

.records-section {
  background: white;
  padding: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.record-count {
  font-size: 24rpx;
  color: #666;
  background: #f0f0f0;
  padding: 6rpx 12rpx;
  border-radius: 12rpx;
}

.records-list {
  max-height: 600rpx;
  overflow-y: auto;
}

.record-item {
  background: #f8f9fa;
  border-radius: 8rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  border-left: 4rpx solid #1890ff;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.record-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.record-time {
  font-size: 22rpx;
  color: #666;
}

.record-content {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.record-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-label {
  font-size: 24rpx;
  color: #666;
}

.record-value {
  font-size: 24rpx;
  color: #333;
  font-weight: 500;

  &.positive {
    color: #52c41a;
  }

  &.negative {
    color: #ff4d4f;
  }

  &.zero {
    color: #666;
  }
}

.empty-state {
  text-align: center;
  padding: 80rpx 40rpx;
  color: #999;
}

.empty-icon {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  margin-bottom: 10rpx;
}

.empty-desc {
  font-size: 24rpx;
}
</style>