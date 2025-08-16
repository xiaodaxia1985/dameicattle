<template>
  <div class="customer-detail-container">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
        <h2>客户详情</h2>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="handleEdit">编辑客户</el-button>
        <el-button type="success" @click="handleAddVisit">添加回访</el-button>
      </div>
    </div>

    <!-- 调试信息 -->
    <div v-if="customer" style="background: #f0f0f0; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
      <h4>调试信息（数据已加载）:</h4>
      <p>客户ID: {{ customer.id }}</p>
      <p>客户名称: {{ customer.name }}</p>
      <p>联系人: {{ customer.contact_person || '未设置' }}</p>
      <p>电话: {{ customer.phone || '未设置' }}</p>
      <p>数据对象: {{ JSON.stringify(customer, null, 2) }}</p>
    </div>

    <div v-if="customer" class="customer-detail">
      <!-- 基本信息 -->
      <el-card class="detail-section">
        <template #header>
          <div class="section-header">
            <span>基本信息</span>
            <el-tag :type="customer.status === 'active' ? 'success' : 'danger'">
              {{ customer.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-item">
              <label>客户名称：</label>
              <span>{{ customer.name }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>客户类型：</label>
              <span>{{ customer.customer_type }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>信用评级：</label>
              <el-rate :model-value="Number(customer.credit_rating || 0)" disabled show-score />
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-item">
              <label>联系人：</label>
              <span>{{ customer.contact_person }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>联系电话：</label>
              <span>{{ customer.phone }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>邮箱：</label>
              <span>{{ customer.email || '-' }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <div class="detail-item">
              <label>地址：</label>
              <span>{{ customer.address || '-' }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 企业信息 -->
      <el-card class="detail-section">
        <template #header>企业信息</template>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-item">
              <label>营业执照号：</label>
              <span>{{ customer.business_license || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>税号：</label>
              <span>{{ customer.tax_number || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>银行账户：</label>
              <span>{{ customer.bank_account || '-' }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-item">
              <label>信用额度：</label>
              <span class="amount">¥{{ Number(customer.credit_limit || 0).toLocaleString() }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>付款条件：</label>
              <span>{{ customer.payment_terms || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>创建时间：</label>
              <span>{{ formatDate(customer.created_at) }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 回访记录 -->
      <el-card class="detail-section">
        <template #header>
          <div class="section-header">
            <span>回访记录</span>
            <el-button size="small" type="primary" @click="handleAddVisit">
              <el-icon><Plus /></el-icon>
              添加回访
            </el-button>
          </div>
        </template>
        <el-table :data="customer.visit_records || []" border>
          <el-table-column prop="visit_date" label="回访日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.visit_date || row.visitDate) }}
            </template>
          </el-table-column>
          <el-table-column prop="visit_type" label="回访类型" width="120">
            <template #default="{ row }">
              {{ row.visit_type || row.visitType }}
            </template>
          </el-table-column>
          <el-table-column prop="purpose" label="回访目的" min-width="150" />
          <el-table-column prop="content" label="回访内容" min-width="200" />
          <el-table-column prop="result" label="回访结果" min-width="150" />
          <el-table-column prop="next_visit_date" label="下次回访" width="120">
            <template #default="{ row }">
              {{ formatDate(row.next_visit_date || row.nextVisitDate) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button size="small" type="primary" @click="handleEditVisit(row)">编辑</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div v-if="!customer.visit_records?.length" class="empty-state">
          <el-empty description="暂无回访记录" />
        </div>
      </el-card>
    </div>

    <div v-else class="loading-state">
      <el-skeleton :rows="10" animated />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import { salesApi, type Customer } from '@/api/sales'
import { safeApiCall } from '@/utils/errorHandler'
import { ensureNumber } from '@/utils/dataValidation'

const router = useRouter()
const route = useRoute()

// 响应式数据
const customer = ref<Customer | null>(null)

// 方法
const goBack = () => {
  router.push('/admin/sales/customers')
}

const handleEdit = () => {
  router.push(`/admin/sales/customers/${customer.value?.id}/edit`)
}

const handleAddVisit = () => {
  router.push(`/admin/sales/customers/${customer.value?.id}/visit/new`)
}

const handleEditVisit = (visit: any) => {
  router.push(`/admin/sales/customers/${customer.value?.id}/visit/${visit.id}/edit`)
}

// 字段名转换函数，兼容后端各种格式
function transformCustomer(raw: any): Customer {
  if (!raw || typeof raw !== 'object') return raw
  return {
    ...raw,
    contact_person: raw.contact_person || raw.contactPerson,
    customer_type: raw.customer_type || raw.customerType,
    business_license: raw.business_license || raw.businessLicense,
    tax_number: raw.tax_number || raw.taxNumber,
    bank_account: raw.bank_account || raw.bankAccount,
    credit_limit: raw.credit_limit || raw.creditLimit,
    credit_rating: raw.credit_rating || raw.creditRating,
    payment_terms: raw.payment_terms || raw.paymentTerms,
    created_at: raw.created_at || raw.createdAt,
    updated_at: raw.updated_at || raw.updatedAt,
    visit_records: Array.isArray(raw.visit_records) ? raw.visit_records : (raw.visitRecords || [])
  }
}

const loadCustomer = async (id: number) => {
  try {
    console.log('🔍 开始加载客户详情，ID:', id)
    const result = await safeApiCall(
      () => salesApi.getCustomer(id),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    console.log('📥 客户详情加载结果:', result)
    if (result && typeof result === 'object' && typeof result.id === 'number') {
      customer.value = transformCustomer(result)
      console.log('✅ 客户详情加载成功，customer.value:', customer.value)
      return
    } else {
      console.error('❌ 客户详情数据无效:', result)
      ElMessage.error('获取客户详情失败，请检查客户是否存在')
    }
  } catch (error) {
    ElMessage.error('获取客户详情失败')
  }
}

const formatDate = (dateString?: string) => {
  return dateString ? new Date(dateString).toLocaleDateString('zh-CN') : '-'
}

// 生命周期
onMounted(() => {
  const id = route.params.id as string
  if (id) {
    loadCustomer(Number(id))
  }
})
</script>

<style scoped>
.customer-detail-container {
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

.detail-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-item {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}

.detail-item label {
  font-weight: 600;
  color: #606266;
  min-width: 100px;
  margin-right: 8px;
}

.detail-item .amount {
  color: #e6a23c;
  font-weight: bold;
}

.empty-state {
  padding: 40px 0;
}

.loading-state {
  padding: 20px;
}
</style>