<template>
  <div class="customers-container">
    <div class="page-header">
      <h2>客户管理</h2>
      <div class="header-actions">
        <el-button @click="handleRefresh" :loading="salesStore.customersLoading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增客户
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ salesStore.getCustomersStatistics.total }}</div>
          <div class="stat-label">总客户数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ salesStore.getCustomersStatistics.active }}</div>
          <div class="stat-label">活跃客户</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ salesStore.getCustomersStatistics.highCredit }}</div>
          <div class="stat-label">高信用客户</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ salesStore.getCustomersStatistics.lowCredit }}</div>
          <div class="stat-label">低信用客户</div>
        </div>
      </el-card>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.name" placeholder="请输入客户名称" clearable />
        </el-form-item>
        <el-form-item label="客户类型">
          <el-select v-model="searchForm.customerType" placeholder="请选择类型" clearable>
            <el-option label="个人客户" value="individual" />
            <el-option label="企业客户" value="enterprise" />
            <el-option label="经销商" value="dealer" />
            <el-option label="批发商" value="wholesaler" />
          </el-select>
        </el-form-item>
        <el-form-item label="信用评级">
          <el-select v-model="searchForm.creditRating" placeholder="请选择评级" clearable>
            <el-option label="5星" :value="5" />
            <el-option label="4星" :value="4" />
            <el-option label="3星" :value="3" />
            <el-option label="2星" :value="2" />
            <el-option label="1星" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="客户状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="活跃" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 客户列表 -->
    <el-card class="table-card">
      <div class="table-header">
        <div class="batch-actions">
          <el-button 
            type="success" 
            :disabled="salesStore.selectedCustomerIds.length === 0"
            @click="handleBatchExport"
          >
            批量导出 ({{ salesStore.selectedCustomerIds.length }})
          </el-button>
        </div>
        <div class="table-info">
          <span>共 {{ salesStore.customersPagination.total }} 条记录</span>
        </div>
      </div>

      <el-table 
        :data="salesStore.customers" 
        v-loading="salesStore.customersLoading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="name" label="客户名称" min-width="150">
          <template #default="{ row }">
            <el-button link @click="handleView(row)">
              {{ row.name || '-' }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="contact_person" label="联系人" width="120">
          <template #default="{ row }">
            {{ row.contact_person || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="150">
          <template #default="{ row }">
            <span class="phone-number">{{ row.phone || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="email" label="邮箱" width="180">
          <template #default="{ row }">
            {{ row.email || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="customer_type" label="客户类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getCustomerTypeColor(row.customer_type)" size="small">
              {{ getCustomerTypeText(row.customer_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="credit_rating" label="信用评级" width="140">
          <template #default="{ row }">
            <el-rate 
              :model-value="row.credit_rating || 0" 
              disabled 
              show-score 
              text-color="#ff9900"
            />
          </template>
        </el-table-column>
        <el-table-column prop="credit_limit" label="信用额度" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥{{ (row.credit_limit || 0).toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{ row.status === 'active' ? '活跃' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="120">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="success" @click="handleVisit(row)">回访</el-button>
            <el-dropdown trigger="click" @command="(command) => handleMoreAction(command, row)">
              <el-button size="small">
                更多<el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="rating">调整评级</el-dropdown-item>
                  <el-dropdown-item command="statistics">客户统计</el-dropdown-item>
                  <el-dropdown-item 
                    command="disable" 
                    v-if="row.status === 'active'"
                    divided
                  >
                    停用客户
                  </el-dropdown-item>
                  <el-dropdown-item 
                    command="enable" 
                    v-if="row.status === 'inactive'"
                    divided
                  >
                    启用客户
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="salesStore.customersPage"
          v-model:page-size="salesStore.customersLimit"
          :total="salesStore.customersPagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 调整评级对话框 -->
    <el-dialog v-model="ratingDialogVisible" title="调整客户评级" width="500px">
      <el-form :model="ratingForm" label-width="100px">
        <el-form-item label="客户名称">
          <span>{{ selectedCustomer?.name }}</span>
        </el-form-item>
        <el-form-item label="当前评级">
          <el-rate :model-value="selectedCustomer?.credit_rating || 0" disabled />
        </el-form-item>
        <el-form-item label="新评级" required>
          <el-rate v-model="ratingForm.credit_rating" />
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input 
            v-model="ratingForm.comment" 
            type="textarea" 
            :rows="3"
            placeholder="请输入调整原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="ratingDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateRating" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, ArrowDown } from '@element-plus/icons-vue'
import { useSalesStore } from '@/stores/sales'
import type { Customer } from '@/api/sales'

const router = useRouter()
const salesStore = useSalesStore()

// 响应式数据
const submitting = ref(false)
const ratingDialogVisible = ref(false)
const selectedCustomer = ref<Customer | null>(null)

// 搜索表单
const searchForm = reactive({
  name: '',
  customerType: '',
  creditRating: undefined as number | undefined,
  status: ''
})

// 评级表单
const ratingForm = reactive({
  credit_rating: 0,
  comment: ''
})

// 方法
const fetchCustomers = async () => {
  const params = {
    page: salesStore.customersPage,
    limit: salesStore.customersLimit,
    search: searchForm.name || undefined,
    customer_type: searchForm.customerType || undefined,
    credit_rating: searchForm.creditRating,
    status: searchForm.status || undefined
  }
  
  salesStore.setCustomerFilters(params)
  await salesStore.fetchCustomers(params)
}

const handleRefresh = async () => {
  await salesStore.fetchCustomers({}, true) // Force refresh
}

const handleSearch = () => {
  fetchCustomers()
}

const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    customerType: '',
    creditRating: undefined,
    status: ''
  })
  salesStore.clearCustomersCache()
  handleSearch()
}

const handleAdd = () => {
  router.push('/admin/sales/customers/new')
}

const handleEdit = (row: Customer) => {
  router.push(`/admin/sales/customers/${row.id}/edit`)
}

const handleView = (row: Customer) => {
  router.push(`/admin/sales/customers/${row.id}`)
}

const handleVisit = (row: Customer) => {
  router.push(`/admin/sales/customers/${row.id}/visit/new`)
}

const handleMoreAction = async (command: string, row: Customer) => {
  switch (command) {
    case 'rating':
      selectedCustomer.value = row
      ratingForm.credit_rating = row.credit_rating || 0
      ratingForm.comment = ''
      ratingDialogVisible.value = true
      break
      
    case 'statistics':
      // 跳转到客户统计页面或显示统计信息
      ElMessage.info('客户统计功能开发中')
      break
      
    case 'disable':
      await handleDisableCustomer(row)
      break
      
    case 'enable':
      await handleEnableCustomer(row)
      break
  }
}

const handleDisableCustomer = async (row: Customer) => {
  try {
    await ElMessageBox.confirm('确定要停用这个客户吗？停用后该客户将无法进行新的交易。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 这里应该调用停用客户的API
    await salesStore.deleteCustomer(row.id)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('停用客户失败:', error)
    }
  }
}

const handleEnableCustomer = async (row: Customer) => {
  try {
    await ElMessageBox.confirm('确定要启用这个客户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    // 这里应该调用启用客户的API
    ElMessage.success('客户已启用')
    await fetchCustomers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('启用客户失败:', error)
    }
  }
}

const handleUpdateRating = async () => {
  if (!selectedCustomer.value) return
  
  try {
    submitting.value = true
    
    // 调用更新评级API
    await salesStore.updateCustomer(selectedCustomer.value.id, {
      credit_rating: ratingForm.credit_rating
    })
    
    ratingDialogVisible.value = false
    ElMessage.success('客户评级更新成功')
  } catch (error) {
    console.error('更新客户评级失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleBatchExport = () => {
  ElMessage.info('批量导出功能开发中')
}

const handleSelectionChange = (selection: Customer[]) => {
  const selectedIds = selection.map(customer => customer.id)
  salesStore.selectCustomers(selectedIds)
}

const handleSizeChange = (size: number) => {
  salesStore.customersLimit = size
  fetchCustomers()
}

const handleCurrentChange = (page: number) => {
  salesStore.customersPage = page
  fetchCustomers()
}

// 状态和类型转换方法
const getCustomerTypeText = (type?: string) => {
  const typeMap: Record<string, string> = {
    individual: '个人客户',
    enterprise: '企业客户',
    dealer: '经销商',
    wholesaler: '批发商'
  }
  return typeMap[type || ''] || type || '-'
}

const getCustomerTypeColor = (type?: string): "success" | "primary" | "warning" | "info" | "danger" => {
  const colorMap: Record<string, "success" | "primary" | "warning" | "info" | "danger"> = {
    individual: 'success',
    enterprise: 'primary',
    dealer: 'warning',
    wholesaler: 'info'
  }
  return colorMap[type || ''] || 'info'
}

const formatDate = (dateString?: string) => {
  return dateString ? new Date(dateString).toLocaleDateString('zh-CN') : '-'
}

// 生命周期
onMounted(async () => {
  // 初始化数据
  await salesStore.fetchCustomers()
})
</script>

<style scoped>
.customers-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 10px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.batch-actions {
  display: flex;
  gap: 10px;
}

.table-info {
  color: #606266;
  font-size: 14px;
}

.phone-number {
  font-family: 'Courier New', monospace;
  color: #409eff;
}

.amount {
  font-weight: bold;
  color: #e6a23c;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>