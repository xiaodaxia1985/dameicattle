<template>
  <div class="visit-form-container">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
        <h2>{{ isEdit ? '编辑回访记录' : '添加回访记录' }}</h2>
      </div>
      <div class="header-right">
        <el-button @click="goBack">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </div>

    <el-card class="form-card">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        size="large"
      >
        <div class="form-section">
          <h3>回访信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="回访日期" prop="visit_date">
                <el-date-picker
                  v-model="form.visit_date"
                  type="date"
                  placeholder="请选择回访日期"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="回访类型" prop="visit_type">
                <el-select v-model="form.visit_type" placeholder="请选择回访类型">
                  <el-option label="电话回访" value="phone" />
                  <el-option label="实地拜访" value="visit" />
                  <el-option label="邮件回访" value="mail" />
                  <el-option label="视频会议" value="video" />
                  <el-option label="微信沟通" value="wechat" />
                  <el-option label="其他" value="other" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="回访目的" prop="purpose">
            <el-input v-model="form.purpose" placeholder="请输入回访目的" />
          </el-form-item>

          <el-form-item label="回访内容" prop="content">
            <el-input 
              v-model="form.content" 
              type="textarea" 
              :rows="4"
              placeholder="请详细描述回访内容" 
            />
          </el-form-item>

          <el-form-item label="回访结果">
            <el-input 
              v-model="form.result" 
              type="textarea" 
              :rows="4"
              placeholder="请输入回访结果" 
            />
          </el-form-item>

          <el-form-item label="下次回访日期">
            <el-date-picker
              v-model="form.next_visit_date"
              type="date"
              placeholder="请选择下次回访日期"
              style="width: 100%"
            />
          </el-form-item>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { salesApi } from '@/api/sales'
import { safeApiCall, withFormErrorHandler } from '@/utils/errorHandler'
import { ensureNumber } from '@/utils/dataValidation'

const router = useRouter()
const route = useRoute()

// 响应式数据
const submitting = ref(false)
const isEdit = ref(false)
const formRef = ref()

// 表单数据
const form = reactive({
  id: null as number | null,
  customer_id: null as number | null,
  visit_date: '',
  visit_type: 'phone',
  purpose: '',
  content: '',
  result: '',
  next_visit_date: ''
})

// 表单验证规则
const rules = {
  visit_date: [{ required: true, message: '请选择回访日期', trigger: 'change' }],
  visit_type: [{ required: true, message: '请选择回访类型', trigger: 'change' }],
  purpose: [{ required: true, message: '请输入回访目的', trigger: 'blur' }],
  content: [{ required: true, message: '请输入回访内容', trigger: 'blur' }]
}

// 方法
const goBack = () => {
  const customerId = route.params.customerId as string
  router.push(`/admin/sales/customers/${customerId}`)
}

const loadVisit = async (customerId: number, visitId: number) => {
  try {
    console.log('🔍 开始加载回访记录，客户ID:', customerId, '回访ID:', visitId)
    
    // 这里需要实现获取单个回访记录的API
    // 暂时先获取客户信息，然后从回访记录中找到对应的记录
    const result = await safeApiCall(
      () => salesApi.getCustomer(customerId),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    console.log('📥 客户信息加载结果:', result)
    
    if (result && result.data) {
      const visits = result.data.visit_records || result.data.visitRecords || []
      const visit = visits.find((v: any) => v.id === visitId)
      if (visit) {
        Object.assign(form, {
          id: visit.id,
          customer_id: customerId,
          visit_date: visit.visit_date || visit.visitDate,
          visit_type: visit.visit_type || visit.visitType,
          purpose: visit.purpose,
          content: visit.content,
          result: visit.result,
          next_visit_date: visit.next_visit_date || visit.nextVisitDate
        })
        console.log('✅ 回访记录加载成功')
      } else {
        console.error('❌ 回访记录不存在，但不立即返回')
        ElMessage.error('回访记录不存在，请检查记录是否已被删除')
        // 不立即返回，让用户选择是否返回
      }
    } else {
      console.error('❌ 获取回访记录失败，但不立即返回')
      ElMessage.error('获取回访记录失败，请检查客户是否存在')
      // 不立即返回，让用户选择是否返回
    }
  } catch (error) {
    console.error('❌ 加载回访记录时发生错误:', error)
    ElMessage.error('获取回访记录失败')
    // 不立即返回，让用户选择是否返回
  }
}

const handleSubmit = withFormErrorHandler(async () => {
  if (!formRef.value) return
  
  await formRef.value.validate()
  submitting.value = true
  
  try {
    // 格式化日期数据
    const visitData = {
      ...form,
      visitDate: form.visit_date,
      visitType: form.visit_type,
      nextVisitDate: form.next_visit_date || null
    }
    
    if (isEdit.value) {
      // 这里需要实现更新回访记录的API
      ElMessage.info('更新回访记录功能开发中')
      goBack()
    } else {
      const result = await safeApiCall(
        () => salesApi.createCustomerVisit(ensureNumber(form.customer_id, 0), visitData),
        {
          showMessage: false,
          fallbackValue: null
        }
      )
      if (result !== null) {
        ElMessage.success('创建成功')
        goBack()
      }
    }
  } finally {
    submitting.value = false
  }
}, '', '操作失败')

// 生命周期
onMounted(() => {
  const customerId = route.params.customerId as string
  const visitId = route.params.visitId as string
  
  form.customer_id = Number(customerId)
  
  if (visitId && visitId !== 'new') {
    isEdit.value = true
    loadVisit(Number(customerId), Number(visitId))
  } else {
    // 新建回访记录，设置默认日期
    form.visit_date = new Date().toISOString().split('T')[0]
  }
})
</script>

<style scoped>
.visit-form-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-left h2 {
  margin: 0;
  color: #303133;
}

.header-right {
  display: flex;
  gap: 12px;
}

.form-card {
  margin-bottom: 20px;
}

.form-section {
  margin-bottom: 40px;
}

.form-section h3 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid #409eff;
  padding-bottom: 8px;
}

.el-form-item {
  margin-bottom: 24px;
}
</style>