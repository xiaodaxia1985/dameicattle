<template>
  <div class="customer-form-container">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
        <h2>{{ isEdit ? '编辑客户' : '新增客户' }}</h2>
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
          <h3>基本信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="客户名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入客户名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="客户类型" prop="customer_type">
                <el-select v-model="form.customer_type" placeholder="请选择类型">
                  <el-option label="个人" value="个人" />
                  <el-option label="企业" value="企业" />
                  <el-option label="经销商" value="经销商" />
                  <el-option label="加工企业" value="加工企业" />
                  <el-option label="物流企业" value="物流企业" />
                  <el-option label="餐饮企业" value="餐饮企业" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="联系人" prop="contact_person">
                <el-input v-model="form.contact_person" placeholder="请输入联系人" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系电话" prop="phone">
                <el-input v-model="form.phone" placeholder="请输入联系电话" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="邮箱">
                <el-input v-model="form.email" placeholder="请输入邮箱" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="信用评级">
                <el-rate v-model="form.credit_rating" show-score />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="地址">
            <el-input v-model="form.address" type="textarea" placeholder="请输入地址" />
          </el-form-item>
        </div>

        <div class="form-section">
          <h3>企业信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="营业执照号">
                <el-input v-model="form.business_license" placeholder="请输入营业执照号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="税号">
                <el-input v-model="form.tax_number" placeholder="请输入税号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="银行账户">
                <el-input v-model="form.bank_account" placeholder="请输入银行账户" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="信用额度">
                <el-input-number 
                  v-model="form.credit_limit" 
                  :min="0" 
                  :precision="2"
                  placeholder="请输入信用额度"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="付款条件">
            <el-input v-model="form.payment_terms" placeholder="请输入付款条件" />
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
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  credit_rating: 5,
  customer_type: '',
  business_license: '',
  tax_number: '',
  bank_account: '',
  credit_limit: 0,
  payment_terms: ''
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  contact_person: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  customer_type: [{ required: true, message: '请选择客户类型', trigger: 'change' }]
}

// 方法
const goBack = () => {
  router.push('/admin/sales/customers')
}

const loadCustomer = async (id: number) => {
  try {
    console.log('🔍 开始加载客户信息，ID:', id)
    
    const result = await safeApiCall(
      () => salesApi.getCustomer(id),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    console.log('📥 客户信息加载结果:', result)
    
    if (result && result.data) {
      Object.assign(form, result.data)
      console.log('✅ 客户信息加载成功')
    } else {
      console.error('❌ 客户信息加载失败，但不立即返回')
      ElMessage.error('获取客户信息失败，请检查客户是否存在')
      // 不立即返回，让用户选择是否返回
    }
  } catch (error) {
    console.error('❌ 加载客户信息时发生错误:', error)
    ElMessage.error('获取客户信息失败')
    // 不立即返回，让用户选择是否返回
  }
}

const handleSubmit = withFormErrorHandler(async () => {
  if (!formRef.value) return
  
  await formRef.value.validate()
  submitting.value = true
  
  try {
    if (isEdit.value) {
      const result = await safeApiCall(
        () => salesApi.updateCustomer(ensureNumber(form.id, 0), form),
        {
          showMessage: false,
          fallbackValue: null
        }
      )
      if (result !== null) {
        ElMessage.success('更新成功')
        goBack()
      }
    } else {
      const result = await safeApiCall(
        () => salesApi.createCustomer(form),
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
  const id = route.params.id as string
  if (id && id !== 'new') {
    isEdit.value = true
    loadCustomer(Number(id))
  }
})
</script>

<style scoped>
.customer-form-container {
  padding: 20px;
  max-width: 1200px;
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

.form-section:last-child {
  margin-bottom: 0;
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