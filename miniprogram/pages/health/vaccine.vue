<template>
  <view class="vaccine-container">
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
        
        <!-- 疫苗名称 -->
        <view class="form-item">
          <text class="form-label">疫苗名称 *</text>
          <picker 
            :range="vaccineOptions" 
            :value="selectedVaccineIndex"
            @change="onVaccineChange"
            :disabled="mode === 'view'"
          >
            <view class="picker-input" :class="{ disabled: mode === 'view' }">
              {{ formData.vaccine_name || '请选择疫苗' }}
              <uni-icons v-if="mode !== 'view'" type="arrowdown" size="14" />
            </view>
          </picker>
        </view>
        
        <!-- 接种日期 -->
        <view class="form-item">
          <text class="form-label">接种日期 *</text>
          <picker 
            mode="date" 
            :value="formData.vaccination_date"
            @change="onVaccinationDateChange"
            :disabled="mode === 'view'"
          >
            <view class="picker-input" :class="{ disabled: mode === 'view' }">
              {{ formData.vaccination_date || '请选择日期' }}
              <uni-icons v-if="mode !== 'view'" type="calendar" size="14" />
            </view>
          </picker>
        </view>
        
        <!-- 下次接种日期 -->
        <view class="form-item">
          <text class="form-label">下次接种日期</text>
          <picker 
            mode="date" 
            :value="formData.next_due_date"
            @change="onNextDueDateChange"
            :disabled="mode === 'view'"
          >
            <view class="picker-input" :class="{ disabled: mode === 'view' }">
              {{ formData.next_due_date || '请选择日期' }}
              <uni-icons v-if="mode !== 'view'" type="calendar" size="14" />
            </view>
          </picker>
        </view>
      </view>
      
      <!-- 疫苗信息 -->
      <view class="form-section">
        <view class="section-title">疫苗信息</view>
        
        <!-- 批次号 -->
        <view class="form-item">
          <text class="form-label">批次号</text>
          <input 
            v-model="formData.batch_number"
            placeholder="请输入批次号"
            :disabled="mode === 'view'"
            class="form-input"
            :class="{ disabled: mode === 'view' }"
          />
        </view>
        
        <!-- 生产厂家 -->
        <view class="form-item">
          <text class="form-label">生产厂家</text>
          <input 
            v-model="formData.manufacturer"
            placeholder="请输入生产厂家"
            :disabled="mode === 'view'"
            class="form-input"
            :class="{ disabled: mode === 'view' }"
          />
        </view>
        
        <!-- 有效期 -->
        <view class="form-item">
          <text class="form-label">有效期</text>
          <picker 
            mode="date" 
            :value="formData.expiry_date"
            @change="onExpiryDateChange"
            :disabled="mode === 'view'"
          >
            <view class="picker-input" :class="{ disabled: mode === 'view' }">
              {{ formData.expiry_date || '请选择有效期' }}
              <uni-icons v-if="mode !== 'view'" type="calendar" size="14" />
            </view>
          </picker>
        </view>
        
        <!-- 剂量 -->
        <view class="form-item">
          <text class="form-label">剂量 (ml)</text>
          <input 
            v-model="formData.dosage"
            type="digit"
            placeholder="请输入剂量"
            :disabled="mode === 'view'"
            class="form-input"
            :class="{ disabled: mode === 'view' }"
          />
        </view>
      </view>
      
      <!-- 接种信息 -->
      <view class="form-section">
        <view class="section-title">接种信息</view>
        
        <!-- 接种部位 -->
        <view class="form-item">
          <text class="form-label">接种部位</text>
          <picker 
            :range="injectionSiteOptions" 
            :value="selectedInjectionSiteIndex"
            @change="onInjectionSiteChange"
            :disabled="mode === 'view'"
          >
            <view class="picker-input" :class="{ disabled: mode === 'view' }">
              {{ formData.injection_site || '请选择接种部位' }}
              <uni-icons v-if="mode !== 'view'" type="arrowdown" size="14" />
            </view>
          </picker>
        </view>
        
        <!-- 负责兽医 -->
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
        
        <!-- 接种反应 -->
        <view class="form-item">
          <text class="form-label">接种反应</text>
          <textarea 
            v-model="formData.reaction"
            placeholder="请描述接种后反应（如有）"
            :disabled="mode === 'view'"
            class="form-textarea"
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
          {{ getSubmitButtonText() }}
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
      mode: 'add', // add, edit, view, renew
      recordId: null,
      submitting: false,
      
      // 表单数据
      formData: {
        cattle_id: '',
        vaccine_name: '',
        vaccination_date: '',
        next_due_date: '',
        batch_number: '',
        manufacturer: '',
        expiry_date: '',
        dosage: '',
        injection_site: '',
        veterinarian_id: '',
        reaction: '',
        notes: ''
      },
      
      // 选项数据
      cattleOptions: [],
      selectedCattleIndex: -1,
      selectedCattle: null,
      
      vaccineOptions: [
        '口蹄疫疫苗',
        '牛瘟疫苗',
        '牛流行热疫苗',
        '牛传染性鼻气管炎疫苗',
        '牛病毒性腹泻疫苗',
        '炭疽疫苗',
        '布鲁氏菌病疫苗',
        '其他疫苗'
      ],
      selectedVaccineIndex: -1,
      
      injectionSiteOptions: [
        '颈部肌肉注射',
        '臀部肌肉注射',
        '皮下注射',
        '静脉注射',
        '其他部位'
      ],
      selectedInjectionSiteIndex: -1,
      
      veterinarianOptions: [],
      selectedVeterinarianIndex: -1,
      selectedVeterinarian: null
    }
  },
  
  computed: {
    isFormValid() {
      return this.formData.cattle_id && 
             this.formData.vaccine_name && 
             this.formData.vaccination_date
    }
  },
  
  onLoad(options) {
    this.mode = options.mode || 'add'
    this.recordId = options.id
    
    // 设置默认日期为今天
    if (this.mode === 'add' || this.mode === 'renew') {
      this.formData.vaccination_date = new Date().toISOString().split('T')[0]
    }
    
    // 加载基础数据
    this.loadCattleOptions()
    this.loadVeterinarianOptions()
    
    // 如果是编辑、查看或续种模式，加载记录数据
    if (this.recordId && (this.mode === 'edit' || this.mode === 'view' || this.mode === 'renew')) {
      this.loadVaccineData()
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
    
    // 加载疫苗数据
    async loadVaccineData() {
      try {
        const res = await healthApi.getVaccinationRecordById(this.recordId)
        if (res.success) {
          const record = res.data
          
          // 如果是续种模式，复制部分数据并重置日期
          if (this.mode === 'renew') {
            this.formData = {
              cattle_id: record.cattle_id,
              vaccine_name: record.vaccine_name,
              vaccination_date: new Date().toISOString().split('T')[0],
              next_due_date: this.calculateNextDueDate(record.vaccine_name),
              batch_number: '',
              manufacturer: record.manufacturer || '',
              expiry_date: '',
              dosage: record.dosage || '',
              injection_site: record.injection_site || '',
              veterinarian_id: record.veterinarian_id || '',
              reaction: '',
              notes: `续种 - 上次接种日期: ${record.vaccination_date}`
            }
          } else {
            // 编辑或查看模式，填充所有数据
            this.formData = {
              cattle_id: record.cattle_id,
              vaccine_name: record.vaccine_name,
              vaccination_date: record.vaccination_date?.split('T')[0] || '',
              next_due_date: record.next_due_date?.split('T')[0] || '',
              batch_number: record.batch_number || '',
              manufacturer: record.manufacturer || '',
              expiry_date: record.expiry_date?.split('T')[0] || '',
              dosage: record.dosage || '',
              injection_site: record.injection_site || '',
              veterinarian_id: record.veterinarian_id || '',
              reaction: record.reaction || '',
              notes: record.notes || ''
            }
          }
          
          // 设置选中的牛只
          const cattleIndex = this.cattleOptions.findIndex(cattle => cattle.id === record.cattle_id)
          if (cattleIndex !== -1) {
            this.selectedCattleIndex = cattleIndex
            this.selectedCattle = this.cattleOptions[cattleIndex]
          }
          
          // 设置选中的疫苗
          const vaccineIndex = this.vaccineOptions.findIndex(vaccine => vaccine === record.vaccine_name)
          if (vaccineIndex !== -1) {
            this.selectedVaccineIndex = vaccineIndex
          }
          
          // 设置选中的接种部位
          const siteIndex = this.injectionSiteOptions.findIndex(site => site === record.injection_site)
          if (siteIndex !== -1) {
            this.selectedInjectionSiteIndex = siteIndex
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
        console.error('加载疫苗数据失败', err)
        uni.showToast({
          title: '加载数据失败',
          icon: 'none'
        })
      }
    },
    
    // 计算下次接种日期
    calculateNextDueDate(vaccineName) {
      const now = new Date()
      let months = 12 // 默认12个月后
      
      // 根据疫苗类型设置不同的间隔
      if (vaccineName.includes('口蹄疫')) {
        months = 6 // 口蹄疫疫苗6个月
      } else if (vaccineName.includes('牛瘟')) {
        months = 12 // 牛瘟疫苗12个月
      } else if (vaccineName.includes('流行热')) {
        months = 12 // 流行热疫苗12个月
      }
      
      const nextDate = new Date(now.getFullYear(), now.getMonth() + months, now.getDate())
      return nextDate.toISOString().split('T')[0]
    },
    
    // 牛只选择变化
    onCattleChange(e) {
      const index = parseInt(e.detail.value)
      this.selectedCattleIndex = index
      this.selectedCattle = this.cattleOptions[index]
      this.formData.cattle_id = this.selectedCattle.id
    },
    
    // 疫苗选择变化
    onVaccineChange(e) {
      const index = parseInt(e.detail.value)
      this.selectedVaccineIndex = index
      this.formData.vaccine_name = this.vaccineOptions[index]
      
      // 自动计算下次接种日期
      if (this.formData.vaccination_date) {
        this.formData.next_due_date = this.calculateNextDueDateFromVaccination(
          this.formData.vaccination_date, 
          this.formData.vaccine_name
        )
      }
    },
    
    // 根据接种日期和疫苗类型计算下次接种日期
    calculateNextDueDateFromVaccination(vaccinationDate, vaccineName) {
      const vaccineDate = new Date(vaccinationDate)
      let months = 12 // 默认12个月后
      
      // 根据疫苗类型设置不同的间隔
      if (vaccineName.includes('口蹄疫')) {
        months = 6
      } else if (vaccineName.includes('牛瘟')) {
        months = 12
      } else if (vaccineName.includes('流行热')) {
        months = 12
      }
      
      const nextDate = new Date(vaccineDate.getFullYear(), vaccineDate.getMonth() + months, vaccineDate.getDate())
      return nextDate.toISOString().split('T')[0]
    },
    
    // 接种日期变化
    onVaccinationDateChange(e) {
      this.formData.vaccination_date = e.detail.value
      
      // 自动计算下次接种日期
      if (this.formData.vaccine_name) {
        this.formData.next_due_date = this.calculateNextDueDateFromVaccination(
          this.formData.vaccination_date, 
          this.formData.vaccine_name
        )
      }
    },
    
    // 下次接种日期变化
    onNextDueDateChange(e) {
      this.formData.next_due_date = e.detail.value
    },
    
    // 有效期变化
    onExpiryDateChange(e) {
      this.formData.expiry_date = e.detail.value
    },
    
    // 接种部位变化
    onInjectionSiteChange(e) {
      const index = parseInt(e.detail.value)
      this.selectedInjectionSiteIndex = index
      this.formData.injection_site = this.injectionSiteOptions[index]
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
        if (submitData.dosage) {
          submitData.dosage = parseFloat(submitData.dosage)
        }
        
        let res
        if (this.mode === 'add' || this.mode === 'renew') {
          res = await healthApi.createVaccinationRecord(submitData)
        } else {
          res = await healthApi.updateVaccinationRecord(this.recordId, submitData)
        }
        
        if (res.success) {
          uni.showToast({
            title: this.getSuccessMessage(),
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
    
    // 获取提交按钮文本
    getSubmitButtonText() {
      switch (this.mode) {
        case 'add':
          return '添加接种记录'
        case 'edit':
          return '保存修改'
        case 'renew':
          return '添加续种记录'
        default:
          return '保存'
      }
    },
    
    // 获取成功消息
    getSuccessMessage() {
      switch (this.mode) {
        case 'add':
          return '添加成功'
        case 'edit':
          return '保存成功'
        case 'renew':
          return '续种记录添加成功'
        default:
          return '操作成功'
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
.vaccine-container {
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