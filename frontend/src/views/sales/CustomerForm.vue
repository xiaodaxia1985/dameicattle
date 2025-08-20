<template>
  <div class="customer-form-container">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
        <h2>{{ isEdit ? '编辑客户' : '新增客户' }}</h2>
      </div>
      <div class="header-right">
        <el-button @click="handleSave" type="primary" :loading="submitting">
          {{ isEdit ? '更新客户' : '创建客户' }}
        </el-button>
      </div>
    </div>

    <div v-loading="loading">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="customer-form"
      >
        <el-card class="form-section">
          <template #header>基本信息</template>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="客户名称" prop="name" required>
                <el-input v-model="formData.name" placeholder="请输入客户名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="客户类型" prop="customer_type">
                <el-select v-model="formData.customer_type" placeholder="请选择客户类型" style="width: 100%">
                  <el-option label="个人客户" value="individual" />
                  <el-option label="企业客户" value="enterprise" />
                  <el-option label="经销商" value="dealer" />
                  <el-option label="批发商" value="wholesaler" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="联系人" prop="contact_person" required>
                <el-input v-model="formData.contact_person" placeholder="请输入联系人姓名" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="联系电话" prop="phone" required>
                <el-input v-model="formData.phone" placeholder="请输入联系电话" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="formData.email" placeholder="请输入邮箱地址" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="客户状态" prop="status">
                <el-select v-model="formData.status" placeholder="请选择状态" style="width: 100%">
                  <el-option label="活跃" value="active" />
                  <el-option label="停用" value="inactive" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="地址" prop="address" required>
                <el-input v-model="formData.address" placeholder="请输入详细地址" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="form-section">
          <template #header>企业信息</template>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="营业执照号" prop="business_license">
                <el-input v-model="formData.business_license" placeholder="请输入营业执照号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="税号" prop="tax_number">
                <el-input v-model="formData.tax_number" placeholder="请输入税号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="银行账户" prop="bank_account">
                <el-input v-model="formData.bank_account" placeholder="请输入银行账户" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="付款条件" prop="payment_terms">
                <el-input v-model="formData.payment_terms" placeholder="请输入付款条件" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="form-section">
          <template #header>信用信息</template>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="信用评级" prop="credit_rating">
                <el-rate
                  v-model="formData.credit_rating"
                  :max="5"
                  show-score
                  text-color="#ff9900"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="信用额度" prop="credit_limit">
                <el-input-number
                  v-model="formData.credit_limit"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  placeholder="请输入信用额度"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useSalesStore } from '@/stores/sales'
import type { Customer } from '@/api/sales'

const router = useRouter()
const route = useRoute()
const salesStore = useSalesStore()

const formRef = ref()
const loading = ref(false)
const submitting = ref(false)

const customerId = route.params.id ? Number(route.params.id) : null
const isEdit = computed(() => !!customerId)

// 表单数据
const formData = reactive({
  name: '',
  customer_type: 'individual',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  business_license: '',
  tax_number: '',
  bank_account: '',
  credit_limit: 0,
  credit_rating: 5,
  payment_terms: '',
  status: 'active'
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入客户名称', trigger: 'blur' },
    { min: 2, max: 100, message: '客户名称长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  contact_person: [
    { required: true, message: '请输入联系人姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '联系人姓名长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$|^0\d{2,3}-?\d{7,8}$/, message: '请输入正确的电话号码', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, max: 200, message: '地址长度在 5 到 200 个字符', trigger: 'blur' }
  ]
}

// 方法
const goBack = () => {
  router.push('/admin/sales/customers')
}

const loadCustomerData = async () => {
  if (!customerId) return

  try {
    loading.value = true
    const customerData = await salesStore.getCustomerById(customerId)
    
    // 填充表单数据
    Object.assign(formData, {
      name: customerData.name,
      customer_type: customerData.customer_type || 'individual',
      contact_person: customerData.contact_person,
      phone: customerData.phone,
      email: customerData.email || '',
      address: customerData.address,
      business_license: customerData.business_license || '',
      tax_number: customerData.tax_number || '',
      bank_account: customerData.bank_account || '',
      credit_limit: customerData.credit_limit || 0,
      credit_rating: customerData.credit_rating || 5,
      payment_terms: customerData.payment_terms || '',
      status: customerData.status || 'active'
    })
    
    console.log('✅ 客户数据加载成功:', customerData)
  } catch (error) {
    console.error('❌ 加载客户数据失败:', error)
    ElMessage.error('加载客户数据失败')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  try {
    await formRef.value.validate()

    submitting.value = true

    const customerData = {
      ...formData,
      credit_limit: Number(formData.credit_limit),
      credit_rating: Number(formData.credit_rating)
    }

    if (isEdit.value && customerId) {
      await salesStore.updateCustomer(customerId, customerData)
      ElMessage.success('客户更新成功')
    } else {
      await salesStore.createCustomer(customerData)
      ElMessage.success('客户创建成功')
    }

    goBack()
  } catch (error) {
    console.error('保存客户失败:', error)
  } finally {
    submitting.value = false
  }
}

// 生命周期
onMounted(async () => {
  // 如果是编辑模式，加载客户数据
  if (isEdit.value) {
    await loadCustomerData()
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

.form-section {
  margin-bottom: 20px;
}

.customer-form :deep(.el-form-item__label) {
  font-weight: 600;
}

.customer-form :deep(.el-rate) {
  display: flex;
  align-items: center;
}
</style>