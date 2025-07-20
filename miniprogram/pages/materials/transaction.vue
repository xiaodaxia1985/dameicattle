<template>
  <view class="transaction-page">
    <!-- 页面头部 -->
    <view class="page-header">
      <view class="header-title">{{ getPageTitle() }}</view>
      <view class="header-desc">{{ getPageDescription() }}</view>
    </view>

    <!-- 操作表单 -->
    <view class="form-section">
      <!-- 基地选择 -->
      <view class="form-group">
        <view class="form-label">选择基地 *</view>
        <picker 
          :range="bases" 
          range-key="name" 
          @change="onBaseChange"
          :value="selectedBaseIndex"
        >
          <view class="picker-input">
            {{ selectedBase?.name || '请选择基地' }}
          </view>
        </picker>
      </view>

      <!-- 物资选择 -->
      <view class="form-group">
        <view class="form-label">选择物资 *</view>
        <picker 
          :range="materials" 
          range-key="name" 
          @change="onMaterialChange"
          :value="selectedMaterialIndex"
        >
          <view class="picker-input">
            {{ selectedMaterial?.name || '请选择物资' }}
          </view>
        </picker>
        
        <!-- 物资信息展示 -->
        <view class="material-info" v-if="selectedMaterial">
          <view class="info-row">
            <text class="info-label">物资编码:</text>
            <text class="info-value">{{ selectedMaterial.code }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">规格:</text>
            <text class="info-value">{{ selectedMaterial.specification || '-' }}</text>
          </view>
          <view class="info-row" v-if="currentStock !== null">
            <text class="info-label">当前库存:</text>
            <text class="info-value">{{ currentStock }} {{ selectedMaterial.unit }}</text>
          </view>
        </view>
      </view>

      <!-- 数量输入 -->
      <view class="form-group">
        <view class="form-label">数量 *</view>
        <view class="quantity-input">
          <input 
            class="quantity-field" 
            type="digit" 
            v-model="transactionForm.quantity"
            placeholder="请输入数量"
          />
          <text class="unit-text">{{ selectedMaterial?.unit || '' }}</text>
        </view>
        
        <!-- 库存提醒 -->
        <view class="stock-warning" v-if="showStockWarning">
          <text class="warning-text">⚠️ 出库数量超过当前库存</text>
        </view>
      </view>

      <!-- 单价输入（可选） -->
      <view class="form-group">
        <view class="form-label">单价（可选）</view>
        <view class="price-input">
          <input 
            class="price-field" 
            type="digit" 
            v-model="transactionForm.unit_price"
            placeholder="请输入单价"
          />
          <text class="currency-text">元</text>
        </view>
      </view>

      <!-- 调拨目标基地（仅调拨时显示） -->
      <view class="form-group" v-if="transactionType === 'transfer'">
        <view class="form-label">调拨到基地 *</view>
        <picker 
          :range="targetBases" 
          range-key="name" 
          @change="onTargetBaseChange"
          :value="selectedTargetBaseIndex"
        >
          <view class="picker-input">
            {{ selectedTargetBase?.name || '请选择目标基地' }}
          </view>
        </picker>
      </view>

      <!-- 批次号（入库时显示） -->
      <view class="form-group" v-if="transactionType === 'inbound'">
        <view class="form-label">批次号</view>
        <input 
          class="form-input" 
          type="text" 
          v-model="transactionForm.batch_number"
          placeholder="请输入批次号（可选）"
        />
      </view>

      <!-- 过期日期（入库时显示） -->
      <view class="form-group" v-if="transactionType === 'inbound'">
        <view class="form-label">过期日期</view>
        <picker 
          mode="date" 
          @change="onExpiryDateChange"
          :value="transactionForm.expiry_date"
        >
          <view class="picker-input">
            {{ transactionForm.expiry_date || '请选择过期日期（可选）' }}
          </view>
        </picker>
      </view>

      <!-- 备注 -->
      <view class="form-group">
        <view class="form-label">备注</view>
        <textarea 
          class="form-textarea" 
          v-model="transactionForm.remark"
          placeholder="请输入备注信息（可选）"
          maxlength="200"
        />
      </view>

      <!-- 操作按钮 -->
      <view class="form-actions">
        <button class="btn-cancel" @click="goBack">取消</button>
        <button 
          class="btn-submit" 
          @click="submitTransaction"
          :disabled="!canSubmit"
        >
          {{ getSubmitButtonText() }}
        </button>
      </view>
    </view>

    <!-- 操作说明 -->
    <view class="help-section">
      <view class="help-title">操作说明</view>
      <view class="help-content">
        <view class="help-item" v-for="tip in getHelpTips()" :key="tip">
          • {{ tip }}
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

export default {
  data() {
    return {
      materialStore: null,
      baseStore: null,
      transactionType: 'inbound', // inbound | outbound | transfer | adjustment
      bases: [],
      materials: [],
      targetBases: [],
      selectedBaseIndex: 0,
      selectedMaterialIndex: 0,
      selectedTargetBaseIndex: 0,
      selectedBase: null,
      selectedMaterial: null,
      selectedTargetBase: null,
      currentStock: null,
      transactionForm: {
        quantity: '',
        unit_price: '',
        batch_number: '',
        expiry_date: '',
        remark: ''
      },
      loading: false
    }
  },

  computed: {
    canSubmit() {
      const basicValid = this.selectedBase && 
                        this.selectedMaterial && 
                        this.transactionForm.quantity && 
                        parseFloat(this.transactionForm.quantity) > 0

      if (this.transactionType === 'transfer') {
        return basicValid && this.selectedTargetBase && this.selectedTargetBase.id !== this.selectedBase.id
      }

      return basicValid
    },

    showStockWarning() {
      return this.transactionType === 'outbound' && 
             this.currentStock !== null && 
             this.transactionForm.quantity && 
             parseFloat(this.transactionForm.quantity) > this.currentStock
    }
  },

  onLoad(options) {
    this.materialStore = useMaterialStore()
    this.baseStore = useBaseStore()
    
    // 获取页面参数
    if (options.type) {
      this.transactionType = options.type
    }
    if (options.materialId) {
      this.presetMaterial = parseInt(options.materialId)
    }
    if (options.baseId) {
      this.presetBase = parseInt(options.baseId)
    }
    
    this.loadInitialData()
  },

  methods: {
    async loadInitialData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadBases(),
          this.loadMaterials()
        ])
        
        // 预设选择项
        if (this.presetBase) {
          const baseIndex = this.bases.findIndex(base => base.id === this.presetBase)
          if (baseIndex !== -1) {
            this.selectedBaseIndex = baseIndex
            this.selectedBase = this.bases[baseIndex]
          }
        }
        
        if (this.presetMaterial) {
          const materialIndex = this.materials.findIndex(material => material.id === this.presetMaterial)
          if (materialIndex !== -1) {
            this.selectedMaterialIndex = materialIndex
            this.selectedMaterial = this.materials[materialIndex]
            this.loadCurrentStock()
          }
        }
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
        this.targetBases = this.baseStore.bases
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

    onBaseChange(e) {
      this.selectedBaseIndex = e.detail.value
      this.selectedBase = this.bases[this.selectedBaseIndex]
      this.loadCurrentStock()
    },

    onMaterialChange(e) {
      this.selectedMaterialIndex = e.detail.value
      this.selectedMaterial = this.materials[this.selectedMaterialIndex]
      this.loadCurrentStock()
    },

    onTargetBaseChange(e) {
      this.selectedTargetBaseIndex = e.detail.value
      this.selectedTargetBase = this.targetBases[this.selectedTargetBaseIndex]
    },

    onExpiryDateChange(e) {
      this.transactionForm.expiry_date = e.detail.value
    },

    async submitTransaction() {
      if (!this.canSubmit) return

      // 出库时检查库存
      if (this.transactionType === 'outbound' && this.showStockWarning) {
        const confirmed = await this.showConfirmDialog(
          '库存不足',
          `当前库存仅有 ${this.currentStock} ${this.selectedMaterial.unit}，确定要出库 ${this.transactionForm.quantity} ${this.selectedMaterial.unit} 吗？`
        )
        if (!confirmed) return
      }

      try {
        uni.showLoading({ title: '提交中...' })

        const data = {
          material_id: this.selectedMaterial.id,
          base_id: this.selectedBase.id,
          transaction_type: this.transactionType,
          quantity: parseFloat(this.transactionForm.quantity),
          unit_price: this.transactionForm.unit_price ? parseFloat(this.transactionForm.unit_price) : undefined,
          batch_number: this.transactionForm.batch_number || undefined,
          expiry_date: this.transactionForm.expiry_date || undefined,
          remark: this.transactionForm.remark || undefined
        }

        // 调拨时添加目标基地信息
        if (this.transactionType === 'transfer') {
          data.target_base_id = this.selectedTargetBase.id
          data.remark = `从 ${this.selectedBase.name} 调拨到 ${this.selectedTargetBase.name}` + 
                       (data.remark ? `，备注：${data.remark}` : '')
        }

        await this.materialStore.createTransaction(data)
        
        uni.showToast({
          title: '操作成功',
          icon: 'success'
        })

        // 延迟返回上一页
        setTimeout(() => {
          this.goBack()
        }, 1500)
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

    showConfirmDialog(title, content) {
      return new Promise((resolve) => {
        uni.showModal({
          title,
          content,
          success: (res) => {
            resolve(res.confirm)
          }
        })
      })
    },

    goBack() {
      uni.navigateBack()
    },

    getPageTitle() {
      const titles = {
        inbound: '物资入库',
        outbound: '物资出库',
        transfer: '库存调拨',
        adjustment: '库存盘点'
      }
      return titles[this.transactionType] || '库存操作'
    },

    getPageDescription() {
      const descriptions = {
        inbound: '记录物资入库信息',
        outbound: '记录物资出库信息',
        transfer: '在基地间调拨物资',
        adjustment: '调整库存数量'
      }
      return descriptions[this.transactionType] || '进行库存操作'
    },

    getSubmitButtonText() {
      const texts = {
        inbound: '确认入库',
        outbound: '确认出库',
        transfer: '确认调拨',
        adjustment: '确认调整'
      }
      return texts[this.transactionType] || '确认操作'
    },

    getHelpTips() {
      const tips = {
        inbound: [
          '入库会增加选定基地的物资库存',
          '建议填写批次号便于追溯',
          '有保质期的物资请设置过期日期',
          '单价用于计算库存价值'
        ],
        outbound: [
          '出库会减少选定基地的物资库存',
          '出库数量不能超过当前库存',
          '请在备注中说明出库用途',
          '系统会自动记录操作时间和操作人'
        ],
        transfer: [
          '调拨会从源基地减少库存，向目标基地增加库存',
          '源基地和目标基地不能相同',
          '调拨数量不能超过源基地当前库存',
          '系统会自动记录调拨路径'
        ],
        adjustment: [
          '盘点用于调整系统库存与实际库存的差异',
          '输入的数量为调整后的最终库存数量',
          '系统会自动计算差异并记录',
          '建议定期进行库存盘点'
        ]
      }
      return tips[this.transactionType] || []
    }
  }
}
</script>

<style lang="scss" scoped>
.transaction-page {
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

.form-section {
  background: white;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.form-group {
  margin-bottom: 40rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 20rpx;
  font-weight: 500;
}

.picker-input, .form-input {
  background: #f8f9fa;
  padding: 24rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: 1rpx solid #e9ecef;
  color: #333;
}

.material-info {
  background: #f0f8ff;
  padding: 20rpx;
  border-radius: 8rpx;
  margin-top: 20rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.info-label {
  font-size: 24rpx;
  color: #666;
}

.info-value {
  font-size: 24rpx;
  color: #333;
  font-weight: 500;
}

.quantity-input, .price-input {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.quantity-field, .price-field {
  flex: 1;
  background: #f8f9fa;
  padding: 24rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: 1rpx solid #e9ecef;
}

.unit-text, .currency-text {
  font-size: 24rpx;
  color: #666;
}

.stock-warning {
  background: #fff2e8;
  padding: 16rpx;
  border-radius: 6rpx;
  margin-top: 15rpx;
  border: 1rpx solid #ffbb96;
}

.warning-text {
  font-size: 24rpx;
  color: #fa8c16;
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

.form-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 60rpx;
}

.btn-cancel, .btn-submit {
  flex: 1;
  padding: 28rpx;
  border-radius: 8rpx;
  font-size: 32rpx;
  font-weight: bold;
  border: none;
}

.btn-cancel {
  background: #f8f9fa;
  color: #666;
}

.btn-submit {
  background: #1890ff;
  color: white;

  &:disabled {
    background: #ccc;
    color: #999;
  }
}

.help-section {
  background: white;
  padding: 30rpx;
}

.help-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.help-content {
  background: #f8f9fa;
  padding: 20rpx;
  border-radius: 8rpx;
}

.help-item {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
  margin-bottom: 10rpx;

  &:last-child {
    margin-bottom: 0;
  }
}
</style>