<template>
  <view class="record-page">
    <!-- 表单 -->
    <view class="form-section">
      <view class="form-item">
        <text class="form-label">饲喂日期</text>
        <picker 
          mode="date" 
          :value="formData.feedingDate" 
          @change="onDateChange"
          :end="today"
        >
          <view class="form-input">
            <text class="input-text" :class="{ placeholder: !formData.feedingDate }">
              {{ formData.feedingDate || '请选择饲喂日期' }}
            </text>
            <text class="iconfont icon-arrow-right"></text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="form-label">配方</text>
        <picker 
          :range="formulas" 
          range-key="name" 
          :value="selectedFormulaIndex" 
          @change="onFormulaChange"
        >
          <view class="form-input">
            <text class="input-text" :class="{ placeholder: selectedFormulaIndex === -1 }">
              {{ selectedFormula?.name || '请选择配方' }}
            </text>
            <text class="iconfont icon-arrow-right"></text>
          </view>
        </picker>
      </view>

      <view class="form-item" v-if="selectedFormula">
        <view class="formula-info">
          <text class="info-label">配方成本:</text>
          <text class="info-value">¥{{ selectedFormula.costPerKg?.toFixed(2) }}/kg</text>
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">基地</text>
        <picker 
          :range="bases" 
          range-key="name" 
          :value="selectedBaseIndex" 
          @change="onBaseChange"
        >
          <view class="form-input">
            <text class="input-text" :class="{ placeholder: selectedBaseIndex === -1 }">
              {{ selectedBase?.name || '请选择基地' }}
            </text>
            <text class="iconfont icon-arrow-right"></text>
          </view>
        </picker>
      </view>

      <view class="form-item" v-if="availableBarns.length > 0">
        <text class="form-label">牛棚</text>
        <picker 
          :range="availableBarns" 
          range-key="name" 
          :value="selectedBarnIndex" 
          @change="onBarnChange"
        >
          <view class="form-input">
            <text class="input-text" :class="{ placeholder: selectedBarnIndex === -1 }">
              {{ selectedBarn?.name || '请选择牛棚（可选）' }}
            </text>
            <text class="iconfont icon-arrow-right"></text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="form-label">饲喂量(kg)</text>
        <view class="amount-input">
          <input 
            class="input-field" 
            type="digit" 
            v-model="formData.amount" 
            placeholder="请输入饲喂量"
            @input="calculateCost"
          />
          <view class="amount-controls">
            <button class="control-btn" @tap="adjustAmount(-10)">-10</button>
            <button class="control-btn" @tap="adjustAmount(-1)">-1</button>
            <button class="control-btn" @tap="adjustAmount(1)">+1</button>
            <button class="control-btn" @tap="adjustAmount(10)">+10</button>
          </view>
        </view>
      </view>

      <view class="form-item" v-if="estimatedCost > 0">
        <view class="cost-info">
          <text class="cost-label">预估成本:</text>
          <text class="cost-value">¥{{ estimatedCost.toFixed(2) }}</text>
        </view>
      </view>

      <view class="form-item">
        <text class="form-label">备注</text>
        <textarea 
          class="textarea-field" 
          v-model="formData.remark" 
          placeholder="请输入备注信息（可选）"
          maxlength="200"
        />
      </view>
    </view>

    <!-- 位置信息 -->
    <view class="location-section" v-if="locationInfo">
      <view class="section-header">
        <text class="section-title">位置信息</text>
        <button class="location-btn" @tap="getLocation">重新定位</button>
      </view>
      <view class="location-info">
        <text class="location-text">{{ locationInfo.address || '获取位置中...' }}</text>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button 
        class="submit-btn" 
        :class="{ disabled: !canSubmit }" 
        :disabled="!canSubmit || submitting"
        @tap="submitRecord"
      >
        {{ submitting ? '提交中...' : '提交记录' }}
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      formData: {
        feedingDate: '',
        formulaId: '',
        baseId: '',
        barnId: '',
        amount: '',
        remark: ''
      },
      formulas: [],
      bases: [],
      barns: [],
      selectedFormulaIndex: -1,
      selectedBaseIndex: -1,
      selectedBarnIndex: -1,
      submitting: false,
      locationInfo: null,
      today: '',
      loading: false
    }
  },
  computed: {
    selectedFormula() {
      return this.selectedFormulaIndex >= 0 ? this.formulas[this.selectedFormulaIndex] : null
    },
    selectedBase() {
      return this.selectedBaseIndex >= 0 ? this.bases[this.selectedBaseIndex] : null
    },
    selectedBarn() {
      return this.selectedBarnIndex >= 0 ? this.availableBarns[this.selectedBarnIndex] : null
    },
    availableBarns() {
      if (!this.selectedBase) return []
      return this.barns.filter(barn => barn.baseId === this.selectedBase.id)
    },
    estimatedCost() {
      if (!this.selectedFormula || !this.formData.amount) return 0
      return parseFloat(this.formData.amount) * (this.selectedFormula.costPerKg || 0)
    },
    canSubmit() {
      return this.formData.feedingDate && 
             this.formData.formulaId && 
             this.formData.baseId && 
             this.formData.amount && 
             parseFloat(this.formData.amount) > 0
    }
  },
  onLoad(options) {
    this.initData()
    this.loadData()
    
    // 如果传入了配方ID，预选择配方
    if (options.formulaId) {
      this.preSelectFormula(options.formulaId)
    }
  },
  methods: {

    // API functions
    async fetchFormulas() {
      const response = await uni.request({
        url: '/api/v1/formulas',
        method: 'GET'
      })
      return response.data
    },

    async fetchBases() {
      const response = await uni.request({
        url: '/api/v1/bases',
        method: 'GET'
      })
      return response.data
    },

    async fetchBarns() {
      const response = await uni.request({
        url: '/api/v1/barns',
        method: 'GET'
      })
      return response.data
    },

    async createFeedingRecord(recordData) {
      const response = await uni.request({
        url: '/api/v1/feeding-records',
        method: 'POST',
        data: recordData
      })
      return response.data
    },

    // Methods
    initData() {
      // 设置默认日期为今天
      const todayDate = new Date()
      this.today = todayDate.toISOString().split('T')[0]
      this.formData.feedingDate = this.today
      
      // 获取位置信息
      this.getLocation()
    },

    async loadData() {
      try {
        const [formulasRes, basesRes, barnsRes] = await Promise.all([
          this.fetchFormulas(),
          this.fetchBases(),
          this.fetchBarns()
        ])
        
        this.formulas = formulasRes.data || []
        this.bases = basesRes.data || []
        this.barns = barnsRes.data || []
        
        // 如果只有一个基地，自动选择
        if (this.bases.length === 1) {
          this.selectedBaseIndex = 0
          this.formData.baseId = this.bases[0].id
        }
      } catch (error) {
        console.error('加载数据失败:', error)
        uni.showToast({
          title: '加载数据失败',
          icon: 'error'
        })
      }
    },

    preSelectFormula(formulaId) {
      setTimeout(() => {
        const index = this.formulas.findIndex(f => f.id === formulaId)
        if (index >= 0) {
          this.selectedFormulaIndex = index
          this.formData.formulaId = formulaId
        }
      }, 1000)
    },

    onDateChange(e) {
      this.formData.feedingDate = e.detail.value
    },

    onFormulaChange(e) {
      this.selectedFormulaIndex = e.detail.value
      this.formData.formulaId = this.formulas[e.detail.value]?.id || ''
      this.calculateCost()
    },

    onBaseChange(e) {
      this.selectedBaseIndex = e.detail.value
      this.formData.baseId = this.bases[e.detail.value]?.id || ''
      // 重置牛棚选择
      this.selectedBarnIndex = -1
      this.formData.barnId = ''
    },

    onBarnChange(e) {
      this.selectedBarnIndex = e.detail.value
      this.formData.barnId = this.availableBarns[e.detail.value]?.id || ''
    },

    adjustAmount(delta) {
      const currentAmount = parseFloat(this.formData.amount) || 0
      const newAmount = Math.max(0, currentAmount + delta)
      this.formData.amount = newAmount.toString()
      this.calculateCost()
    },

    calculateCost() {
      // 触发计算属性更新
    },

    async getLocation() {
      try {
        const location = await new Promise((resolve, reject) => {
          uni.getLocation({
            type: 'gcj02',
            success: resolve,
            fail: reject
          })
        })
        
        this.locationInfo = {
          latitude: location.latitude,
          longitude: location.longitude,
          address: '正在获取地址...'
        }
        
        // 获取地址信息
        this.getAddressFromLocation(location.latitude, location.longitude)
      } catch (error) {
        console.error('获取位置失败:', error)
        uni.showToast({
          title: '获取位置失败',
          icon: 'none'
        })
      }
    },

    async getAddressFromLocation(latitude, longitude) {
      try {
        // 这里应该调用地图API获取地址
        // 暂时使用模拟地址
        this.locationInfo.address = `纬度: ${latitude.toFixed(6)}, 经度: ${longitude.toFixed(6)}`
      } catch (error) {
        console.error('获取地址失败:', error)
      }
    },

    async submitRecord() {
      if (!this.canSubmit || this.submitting) return
      
      this.submitting = true
      
      try {
        const recordData = {
          ...this.formData,
          amount: parseFloat(this.formData.amount),
          baseId: parseInt(this.formData.baseId),
          barnId: this.formData.barnId ? parseInt(this.formData.barnId) : undefined
        }
        
        // 添加位置信息
        if (this.locationInfo) {
          recordData.location = this.locationInfo
        }
        
        await this.createFeedingRecord(recordData)
        
        uni.showToast({
          title: '提交成功',
          icon: 'success'
        })
        
        // 延迟返回上一页
        setTimeout(() => {
          uni.navigateBack()
        }, 1500)
        
      } catch (error) {
        console.error('提交失败:', error)
        uni.showToast({
          title: '提交失败',
          icon: 'error'
        })
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.record-page {
  background-color: #f5f7fa;
  min-height: 100vh;
  padding-bottom: 120rpx;
}

.form-section {
  background: white;
  margin-bottom: 20rpx;

  .form-item {
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    .form-label {
      display: block;
      font-size: 28rpx;
      color: #303133;
      margin-bottom: 20rpx;
      font-weight: bold;
    }

    .form-input {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20rpx 0;

      .input-text {
        flex: 1;
        font-size: 28rpx;
        color: #303133;

        &.placeholder {
          color: #c0c4cc;
        }
      }

      .iconfont {
        font-size: 24rpx;
        color: #c0c4cc;
      }
    }

    .input-field {
      width: 100%;
      padding: 20rpx 0;
      font-size: 28rpx;
      color: #303133;
      border: none;
      background: transparent;
    }

    .textarea-field {
      width: 100%;
      min-height: 120rpx;
      padding: 20rpx 0;
      font-size: 28rpx;
      color: #303133;
      border: none;
      background: transparent;
      resize: none;
    }

    .amount-input {
      .amount-controls {
        display: flex;
        gap: 10rpx;
        margin-top: 20rpx;

        .control-btn {
          flex: 1;
          height: 60rpx;
          background: #f5f7fa;
          border: 1rpx solid #e4e7ed;
          border-radius: 8rpx;
          font-size: 24rpx;
          color: #606266;
          display: flex;
          align-items: center;
          justify-content: center;

          &:active {
            background: #e4e7ed;
          }
        }
      }
    }

    .formula-info, .cost-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20rpx;
      background: #f8f9fa;
      border-radius: 8rpx;

      .info-label, .cost-label {
        font-size: 26rpx;
        color: #606266;
      }

      .info-value {
        font-size: 26rpx;
        color: #67C23A;
        font-weight: bold;
      }

      .cost-value {
        font-size: 28rpx;
        color: #67C23A;
        font-weight: bold;
      }
    }
  }
}

.location-section {
  background: white;
  margin-bottom: 20rpx;

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

    .location-btn {
      background: #409EFF;
      color: white;
      border: none;
      padding: 10rpx 20rpx;
      border-radius: 20rpx;
      font-size: 24rpx;
    }
  }

  .location-info {
    padding: 30rpx;

    .location-text {
      font-size: 26rpx;
      color: #606266;
    }
  }
}

.submit-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  background: white;
  border-top: 1rpx solid #f0f0f0;

  .submit-btn {
    width: 100%;
    height: 80rpx;
    background: #409EFF;
    color: white;
    border: none;
    border-radius: 40rpx;
    font-size: 30rpx;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;

    &.disabled {
      background: #c0c4cc;
      color: #ffffff;
    }

    &:not(.disabled):active {
      background: #337ecc;
    }
  }
}
</style>