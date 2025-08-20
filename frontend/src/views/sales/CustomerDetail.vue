<template>
  <div class="customer-detail-container">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
        <h2>客户详情</h2>
      </div>
      <div class="header-right">
        <el-button @click="handleRefresh" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="handleEdit">编辑客户</el-button>
        <el-button type="success" @click="handleAddVisit">添加回访</el-button>
      </div>
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
import { ArrowLeft, Plus, Refresh } from '@element-plus/icons-vue'
import { useSalesStore } from '@/stores/sales'
import type { Customer } from '@/api/sales'

const router = useRouter()
const route = useRoute()
const salesStore = useSalesStore()

// 响应式数据
const loading = ref(false)
const customer = ref<Customer | null>(null)
const customerId = Number(route.params.id)

// 方法
const goBack = () => {
  router.push('/admin/sales/customers')
}

const handleEdit = () => {
  if (customer.value) {
    router.push(`/admin/sales/customers/${customer.value.id}/edit`)
  }
}

const handleAddVisit = () => {
  if (customer.value) {
    router.push(`/admin/sales/customers/${customer.value.id}/visit/new`)
  }
}

const handleEditVisit = (visit: any) => {
  if (customer.value) {
    router.push(`/admin/sales/customers/${customer.value.id}/visit/${visit.id}/edit`)
  }
}

const handleRefresh = async () => {
  await fetchCustomerData(true) // Force refresh
}

// 从销售store获取客户数据
const fetchCustomerData = async (forceRefresh = false) => {
  if (!customerId || isNaN(customerId)) {
    ElMessage.error('无效的客户ID')
    return
  }

  try {
    loading.value = true
    console.log('🔍 获取客户详情:', customerId)
    
    // 优先使用缓存，如果没有则从API获取
    const customerData = await salesStore.getCustomerById(customerId, forceRefresh)
    customer.value = customerData
    
    console.log('✅ 客户详情获取成功:', customerData)
  } catch (error) {
    console.error('❌ 获取客户详情失败:', error)
    ElMessage.error('获取客户详情失败')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString?: string) => {
  return dateString ? new Date(dateString).toLocaleDateString('zh-CN') : '-'
}

// 生命周期
onMounted(async () => {
  await fetchCustomerData()
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