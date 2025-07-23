<template>
  <view class="add-visit-container">
    <uni-card :title="'添加回访记录'" :extra="customerName">
      <uni-forms ref="form" :model="formData" :rules="rules">
        <uni-forms-item label="回访日期" required name="visit_date">
          <uni-datetime-picker
            v-model="formData.visit_date"
            type="date"
            return-type="date"
            placeholder="请选择回访日期"
          />
        </uni-forms-item>
        
        <uni-forms-item label="回访类型" required name="visit_type">
          <uni-data-checkbox
            v-model="formData.visit_type"
            :localdata="visitTypeOptions"
            mode="tag"
          />
        </uni-forms-item>
        
        <uni-forms-item label="回访目的" required name="purpose">
          <uni-easyinput
            v-model="formData.purpose"
            placeholder="请输入回访目的"
            trim="both"
          />
        </uni-forms-item>
        
        <uni-forms-item label="回访内容" required name="content">
          <uni-easyinput
            v-model="formData.content"
            type="textarea"
            placeholder="请输入回访内容"
            trim="both"
          />
        </uni-forms-item>
        
        <uni-forms-item label="回访结果" name="result">
          <uni-easyinput
            v-model="formData.result"
            type="textarea"
            placeholder="请输入回访结果"
            trim="both"
          />
        </uni-forms-item>
        
        <uni-forms-item label="下次回访日期" name="next_visit_date">
          <uni-datetime-picker
            v-model="formData.next_visit_date"
            type="date"
            return-type="date"
            placeholder="请选择下次回访日期"
          />
        </uni-forms-item>
      </uni-forms>
      
      <view class="form-actions">
        <button type="default" @click="goBack">取消</button>
        <button type="primary" @click="submitForm" :loading="submitting">提交</button>
      </view>
    </uni-card>
  </view>
</template>

<script>
import { salesApi } from '@/utils/api'
import { showToast } from '@/utils/common'

export default {
  data() {
    return {
      customerId: null,
      customerName: '',
      formData: {
        visit_date: new Date().toISOString().split('T')[0],
        visit_type: '电话回访',
        purpose: '',
        content: '',
        result: '',
        next_visit_date: ''
      },
      rules: {
        visit_date: {
          rules: [
            { required: true, errorMessage: '请选择回访日期' }
          ]
        },
        visit_type: {
          rules: [
            { required: true, errorMessage: '请选择回访类型' }
          ]
        },
        purpose: {
          rules: [
            { required: true, errorMessage: '请输入回访目的' }
          ]
        },
        content: {
          rules: [
            { required: true, errorMessage: '请输入回访内容' }
          ]
        }
      },
      visitTypeOptions: [
        { text: '电话回访', value: '电话回访' },
        { text: '实地拜访', value: '实地拜访' },
        { text: '邮件回访', value: '邮件回访' }
      ],
      submitting: false
    }
  },

  onLoad(options) {
    this.customerId = options.customerId
    this.customerName = decodeURIComponent(options.customerName || '')
  },

  methods: {
    // 提交表单
    submitForm() {
      this.$refs.form.validate().then(async (valid) => {
        if (valid) {
          try {
            this.submitting = true
            uni.showLoading({ title: '提交中...' })
            
            await salesApi.createCustomerVisit(this.customerId, this.formData)
            
            showToast('回访记录添加成功')
            setTimeout(() => {
              uni.navigateBack()
            }, 1500)
          } catch (error) {
            showToast('添加回访记录失败')
            console.error('添加回访记录失败:', error)
          } finally {
            this.submitting = false
            uni.hideLoading()
          }
        }
      }).catch(errors => {
        console.log('表单验证失败:', errors)
      })
    },
    
    // 返回上一页
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss" scoped>
.add-visit-container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 40rpx;
  gap: 20rpx;
  
  button {
    flex: 1;
  }
}
</style>