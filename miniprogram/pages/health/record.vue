<template>
  <view class="record-container">
    <form @submit="handleSubmit">
      <!-- 基本信息 -->
      <view class="form-section">
        <view class="section-title">基本信息</view>
        
        <!-- 牛只选择 -->
        <view class="form-item">
          <text class="form-label">选择牛只 *</text>
          <picker 
            :range="cattleOptions" 
            :range-key="'ear_tag'"
            :value="selectedCattleIndex"
            @change="onCattleChange"
            :disabled="mode === 'view'"
          >
            <view class="picker-input" :class="{ disabled: mode === 'view' }">
              {{ selectedCattle ? selectedCattle.ear_tag : '请选择牛只' }}
              <uni-icons v-if="mode !== 'view'" type="arrowdown" size="14" />
            </view>
          </picker>
        </view>
        
        <!-- 诊断日期 -->
        <view class="form-item">
          <text class="form-label">诊断日期 *</text>
          <picker 
            mode="date" 
            :value="formData.diagnosis_date"
            @change="onDateChange"
            :disabled="mode === 'view'"
          >
            <view class="picker-input" :class="{ disabled: mode === 'view' }">
              {{ formData.diagnosis_date || '请选择日期' }}
              <uni-icons v-if="mode !== 'view'" type="calendar" size="14" />
            </view>
          </picker>
        </view>
        
        <!-- 状态 -->
        <view class="form-item">
          <text class="form-label">状态 *</text>
          <picker 
            :range="statusOptions" 
            :range-key="'label'"
            :value="selectedStatusIndex"
            @change="onStatusChange"
            :disabled="mode === 'view'"
          >
            <view class="picker-input" :class="{ disabled: mode === 'view' }">
              {{ statusOptions[selectedStatusIndex]?.label || '请选择状态' }}
              <uni-icons v-if="mode !== 'view'" type="arrowdown" size="14" />
            </view>
          </picker>
        </view>
      </view>
      
      <!-- 健康信息 -->
      <view class="form-section">
        <view class="section-title">健康信息</view>
        
        <!-- 症状 -->
        <view class="form-item">
          <text class="form-label">症状描述</text>
          <textarea 
            v-model="formData.symptoms"
            placeholder="请描述牛只症状"
            :disabled="mode === 'view'"
            class="form-textarea"
            :class="{ disabled: mode === 'view' }"
          />
        </view>
        
        <!-- 诊断 -->
        <view class="form-item">
          <text class="form-label">诊断结果</text>
          <textarea 
            v-model="formData.diagnosis"
            placeholder="请输入诊断结果"
            :disabled="mode === 'view'"
            class="form-textarea"
            :class="{ disabled: mode === 'view' }"
          />
        </view>
        
        <!-- 治疗方案 -->
        <view class="form-item">
          <text class="form-label">治疗方案</text>
          <textarea 
            v-model="formData.treatment"
            placeholder="请输入治疗方案"
            :disabled="mode === 'view'"
            class="form-textarea"
            :class="{ disabled: mode === 'view' }"
          />
        </view>
        
        <!-- 兽医 -->
        <view class="form-item">
          <text class="form-label">负责兽医</text>
          <picker 
            :range="veterinarianOptions" 
            :range-key="'real_name'"
            :value="selectedVeterinarianIndex"
            @change="onVeterinarianChange"
            :disabled="mode === 'view'"
          >
            <view class="picker-input" :class="{ disabled: mode === 'view' }">
              {{ selectedVeterinarian ? selectedVeterinarian.real_name : '请选择兽医' }}
              <uni-icons v-if="mode !== 'view'" type="arrowdown" size="14" />
            </view>
          </picker>
        </view>
      </view>
      
      <!-- 附加信息 -->
      <view class="form-section">
        <view class="section-title">附加信息</view>
        
        <!-- 体温 -->
        <view class="form-item">
          <text class="form-label">体温 (°C)</text>
          <input 
            v-model="formData.temperature"
            type="digit"
            placeholder="请输入体温"
            :disabled="mode === 'view'"
            class="form-input"
            :class="{ disabled: mode === 'view' }"
          />
        </view>
        
        <!-- 体重 -->
        <view class="form-item">
          <text class="form-label">体重 (kg)</text>
          <input 
            v-model="formData.weight"
            type="digit"
            placeholder="请输入体重"
            :disabled="mode === 'view'"
            class="form-input"
            :class="{ disabled: mode === 'view' }"
          />
        </view>
        
        <!-- 备注 -->
        <view class="form-item">
          <text class="form-label">备注</text>
          <textarea 
            v-model="formData.notes"
            placeholder="请输入备注信息"
            :disabled="mode === 'view'"
            class="form-textarea"
            :class="{ disabled: mode === 'view' }"
          />
        </view>
      </view>
      
      <!-- 操作按钮 -->
      <view v-if="mode !== 'view'" class="button-section">
        <button class="cancel-btn" @click="handleCancel">取消</button>
        <button 
          class="submit-btn" 
          form-type="submit"
          :loading="submitting"
          :disabled="!isFormValid"
        >
          {{ mode === 'add' ? '添加记录' : '保存修改' }}
        </button>
      </view>
      
      <!-- 查看模式的操作按钮 -->
      <view v-if="mode === 'view'" class="button-section">
        <button class="back-btn" @click="handleBack">返回</button>
        <button class="edit-btn" @click="switchToEditMode">编辑</button>
      </view>
    </form>
  </view>
</template>

<script>
import { healthApi, cattleApi, userApi } from '@/utils/request.js'

export default {
  data() {
    return {
      mode: 'add', // add, edit, view
      recordId: null,
      submitting: false,
      
      // 表单数据
      formData: {
        cattle_id: '',
        diagnosis_date: '',
        status: 'ongoing',
        symptoms: '',
        diagnosis: '',
        treatment: '',
        veterinarian_id: '',
        temperature: '',
        weight: '',
        notes: ''
      },
      
      // 选项数据
      cattleOptions: [],
      selectedCattleIndex: -1,
      selectedCattle: null,
      
      statusOptions: [
        { value: 'ongoing', label: '进行中' },
        { value: 'completed', label: '已完成' },
        { value: 'cancelled', label: '已取消' }
      ],
      selectedStatusIndex: 0,
      
      veterinarianOptions: [],
      selectedVeterinarianIndex: -1,
      selectedVeterinarian: null
    }
  },
  
  computed: {
    isFormValid() {
      return this.formData.cattle_id && 
             this.formData.diagnosis_date && 
             this.formData.status
    }
  },
  
  onLoad(options) {
    this.mode = options.mode || 'add'
    this.recordId = options.id
    
    // 设置默认日期为今天
    if (this.mode === 'add') {
      this.formData.diagnosis_date = new Date().toISOString().split('T')[0]
    }
    
    // 加载基础数据
    this.loadCattleOptions()
    this.loadVeterinarianOptions()
    
    // 如果是编辑或查看模式，加载记录数据
    if (this.recordId && (this.mode === 'edit' || this.mode === 'view')) {
      this.loadRecordData()
    }
  },
  
  methods: {
    // 加载牛只选项
    async loadCattleOptions() {
      try {
        const res = await cattleApi.getCattleList({ limit: 1000 })
        if (res.success) {
          this.cattleOptions = res.data.cattle || []
        }
      } catch (err) {
        console.error('加载牛只列表失败', err)
        uni.showToast({
          title: '加载牛只失败',
          icon: 'none'
        })
      }
    },
    
    // 加载兽医选项
    async loadVeterinarianOptions() {
      try {
        const res = await userApi.getUserList({ role: 'veterinarian', limit: 100 })
        if (res.success) {
          this.veterinarianOptions = res.data.users || []
        }
      } catch (err) {
        console.error('加载兽医列表失败', err)
        uni.showToast({
          title: '加载兽医失败',
          icon: 'none'
        })
      }
    },
    
    // 加载记录数据
    async loadRecordData() {
      try {
        const res = await healthApi.getHealthRecordById(this.recordId)
        if (res.success) {
          const record = res.data
          
          // 填充表单数据
          this.formData = {
            cattle_id: record.cattle_id,
            diagnosis_date: record.diagnosis_date?.split('T')[0] || '',
            status: record.status,
            symptoms: record.symptoms || '',
            diagnosis: record.diagnosis || '',
            treatment: record.treatment || '',
            veterinarian_id: record.veterinarian_id || '',
            temperature: record.temperature || '',
            weight: record.weight || '',
            notes: record.notes || ''
          }
          
          // 设置选中的牛只
          const cattleIndex = this.cattleOptions.findIndex(cattle => cattle.id === record.cattle_id)
          if (cattleIndex !== -1) {
            this.selectedCattleIndex = cattleIndex
            this.selectedCattle = this.cattleOptions[cattleIndex]
          }
          
          // 设置选中的状态
          const statusIndex = this.statusOptions.findIndex(status => status.value === record.status)
          if (statusIndex !== -1) {
            this.selectedStatusIndex = statusIndex
          }
          
          // 设置选中的兽医
          if (record.veterinarian_id) {
            const veterinarianIndex = this.veterinarianOptions.findIndex(vet => vet.id === record.veterinarian_id)
            if (veterinarianIndex !== -1) {
              this.selectedVeterinarianIndex = veterinarianIndex
              this.selectedVeterinarian = this.veterinarianOptions[veterinarianIndex]
            }
          }
        }
      } catch (err) {
        console.error('加载记录数据失败', err)
        uni.showToast({
          title: '加载记录失败',
          icon: 'none'
        })
      }
    },
    
    // 牛只选择变化
    onCattleChange(e) {
      const index = parseInt(e.detail.value)
      this.selectedCattleIndex = index
      this.selectedCattle = this.cattleOptions[index]
      this.formData.cattle_id = this.selectedCattle.id
    },
    
    // 日期变化
    onDateChange(e) {
      this.formData.diagnosis_date = e.detail.value
    },
    
    // 状态变化
    onStatusChange(e) {
      const index = parseInt(e.detail.value)
      this.selectedStatusIndex = index
      this.formData.status = this.statusOptions[index].value
    },
    
    // 兽医选择变化
    onVeterinarianChange(e) {
      const index = parseInt(e.detail.value)
      this.selectedVeterinarianIndex = index
      this.selectedVeterinarian = this.veterinarianOptions[index]
      this.formData.veterinarian_id = this.selectedVeterinarian.id
    },
    
    // 提交表单
    async handleSubmit() {
      if (!this.isFormValid) {
        uni.showToast({
          title: '请填写必填项',
          icon: 'none'
        })
        return
      }
      
      this.submitting = true
      
      try {
        const submitData = { ...this.formData }
        
        // 转换数据类型
        if (submitData.temperature) {
          submitData.temperature = parseFloat(submitData.temperature)
        }
        if (submitData.weight) {
          submitData.weight = parseFloat(submitData.weight)
        }
        
        let res
        if (this.mode === 'add') {
          res = await healthApi.createHealthRecord(submitData)
        } else {
          res = await healthApi.updateHealthRecord(this.recordId, submitData)
        }
        
        if (res.success) {
          uni.showToast({
            title: this.mode === 'add' ? '添加成功' : '保存成功',
            icon: 'success'
          })
          
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        }
      } catch (err) {
        console.error('提交失败', err)
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        })
      } finally {
        this.submitting = false
      }
    },
    
    // 取消操作
    handleCancel() {
      uni.navigateBack()
    },
    
    // 返回
    handleBack() {
      uni.navigateBack()
    },
    
    // 切换到编辑模式
    switchToEditMode() {
      this.mode = 'edit'
    }
  }
}
</script>

<style lang="scss" scoped>
.record-container {
  padding: 20rpx;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.form-section {
  background-color: #fff;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.section-title {
  padding: 20rpx;
  background-color: #f8f9fa;
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  border-bottom: 1rpx solid #e9ecef;
}

.form-item {
  padding: 20rpx;
  border-bottom: 1rpx solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.form-label {
  display: block;
  font-size: 26rpx;
  color: #333;
  margin-bottom: 15rpx;
  
  &::after {
    content: ' *';
    color: #ff4d4f;
  }
}

.picker-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15rpx 20rpx;
  background-color: #f8f9fa;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #333;
  
  &.disabled {
    background-color: #f5f5f5;
    color: #999;
  }
}

.form-input {
  width: 100%;
  padding: 15rpx 20rpx;
  background-color: #f8f9fa;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #333;
  border: none;
  
  &.disabled {
    background-color: #f5f5f5;
    color: #999;
  }
}

.form-textarea {
  width: 100%;
  min-height: 120rpx;
  padding: 15rpx 20rpx;
  background-color: #f8f9fa;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #333;
  border: none;
  resize: none;
  
  &.disabled {
    background-color: #f5f5f5;
    color: #999;
  }
}

.button-section {
  display: flex;
  justify-content: space-between;
  padding: 40rpx 0;
  
  button {
    flex: 1;
    height: 80rpx;
    line-height: 80rpx;
    border-radius: 40rpx;
    font-size: 28rpx;
    border: none;
    
    &:first-child {
      margin-right: 20rpx;
    }
  }
}

.cancel-btn, .back-btn {
  background-color: #f5f5f5;
  color: #666;
}

.submit-btn {
  background-color: #1890ff;
  color: #fff;
  
  &:disabled {
    background-color: #d9d9d9;
    color: #999;
  }
}

.edit-btn {
  background-color: #52c41a;
  color: #fff;
}
</style>