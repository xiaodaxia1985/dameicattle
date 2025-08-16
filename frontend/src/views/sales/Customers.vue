<template>
  <div class="customers-container">
    <div class="page-header">
      <h2>客户管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增客户
      </el-button>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.name" placeholder="请输入客户名称" clearable />
        </el-form-item>
        <el-form-item label="客户类型">
          <el-select v-model="searchForm.customerType" placeholder="请选择类型" clearable>
            <el-option 
              v-for="type in customerTypes" 
              :key="type.customer_type" 
              :label="type.customer_type" 
              :value="type.customer_type" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="评级">
          <el-select v-model="searchForm.creditRating" placeholder="请选择评级" clearable>
            <el-option label="5星" :value="5" />
            <el-option label="4星" :value="4" />
            <el-option label="3星" :value="3" />
            <el-option label="2星" :value="2" />
            <el-option label="1星" :value="1" />
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
      <el-table 
        :data="validCustomers" 
        v-loading="loading"
        stripe
      >
        <el-table-column prop="name" label="客户名称" min-width="150">
          <template #default="{ row }">
            {{ row.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="contact_person" label="联系人" width="120">
          <template #default="{ row }">
            {{ row.contact_person || row.contactPerson || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="150">
          <template #default="{ row }">
            {{ row.phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="customer_type" label="类型" width="120">
          <template #default="{ row }">
            {{ row.customer_type || row.customerType || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="credit_rating" label="评级" width="120">
          <template #default="{ row }">
            <el-rate :model-value="Number(row.credit_rating || row.creditRating || 0)" disabled show-score />
          </template>
        </el-table-column>
        <el-table-column prop="credit_limit" label="信用额度" width="120">
          <template #default="{ row }">
            ¥{{ Number(row.credit_limit || row.creditLimit || 0).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag type="success">
              启用
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" type="success" @click="handleVisit(row)">回访</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(row)"
              v-if="row.status === 'active'"
            >
              停用
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>


  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { salesApi, type Customer } from '@/api/sales'
import { validateData, validateDataArray, ensureArray, ensureNumber } from '@/utils/dataValidation'
import { safeApiCall, withPageErrorHandler, withFormErrorHandler } from '@/utils/errorHandler'
import { safeGet } from '@/utils/safeAccess'
import { ensureUserLoggedIn, withAuth } from '@/utils/authGuard'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const customers = ref<Customer[]>([])
const customerTypes = ref<any[]>([])

// 计算属性：过滤有效的客户数据
const validCustomers = computed(() => {
  console.log('🔍 validCustomers 计算属性执行，原始数据:', customers.value)
  
  // 直接返回所有数据，不进行过滤
  const result = customers.value || []
  
  console.log('🎯 validCustomers 最终结果:', {
    originalCount: customers.value?.length || 0,
    resultCount: result.length,
    result
  })
  
  return result
})

// 搜索表单
const searchForm = reactive({
  name: '',
  customerType: '',
  creditRating: undefined as number | undefined
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})



// 方法
const fetchCustomers = async () => {
  loading.value = true
  try {
    // 使用认证守卫确保用户已登录
    const isLoggedIn = await ensureUserLoggedIn()
    if (!isLoggedIn) {
      console.log('❌ 用户未登录，无法获取客户数据')
      return
    }
    
    console.log('🔍 开始获取客户数据...')
    
    // 使用withAuth包装API调用
    await withAuth(async () => {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchForm.name || undefined,
        customer_type: searchForm.customerType || undefined,
        credit_rating: searchForm.creditRating
      }
      
      console.log('🔍 请求参数:', params)
      
      const result = await salesApi.getCustomers(params)
      console.log('📥 API返回结果:', result)
      
      if (result && result.data && result.data.items) {
        customers.value = result.data.items
        pagination.total = result.data.total || 0
        
        console.log('✅ 成功设置客户数据:', {
          count: customers.value.length,
          total: pagination.total,
          firstCustomer: customers.value[0]
        })
      } else {
        console.warn('⚠️ API返回数据格式异常:', result)
        customers.value = []
        pagination.total = 0
      }
    })
  } catch (error) {
    console.error('❌ 获取客户数据失败:', error)
    ElMessage.error('获取客户数据失败')
    customers.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const fetchCustomerTypes = async () => {
  const result = await safeApiCall(
    () => salesApi.getCustomerTypes(),
    {
      showMessage: false,
      fallbackValue: { data: [] }
    }
  )
  
  if (result && result.data) {
    customerTypes.value = ensureArray(safeGet(result, 'data', []))
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchCustomers()
}

const handleReset = () => {
  Object.assign(searchForm, {
    name: '',
    customerType: '',
    creditRating: null
  })
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

const handleDelete = async (row: Customer) => {
  try {
    await ElMessageBox.confirm('确定要停用这个客户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const result = await safeApiCall(
      () => salesApi.deleteCustomer(ensureNumber(row.id, 0)),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result !== null) {
      ElMessage.success('客户已停用')
      fetchCustomers()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('停用失败')
    }
  }
}

const handleVisit = (row: Customer) => {
  router.push(`/admin/sales/customers/${row.id}/visit/new`)
}



const handleSizeChange = (size: number) => {
  pagination.limit = size
  fetchCustomers()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchCustomers()
}

const formatDate = (dateString?: string) => {
  return dateString ? new Date(dateString).toLocaleDateString('zh-CN') : '-'
}

// 生命周期
onMounted(() => {
  fetchCustomers()
  fetchCustomerTypes()
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

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-item {
  margin-bottom: 10px;
}

.detail-item label {
  font-weight: bold;
  color: #606266;
}

.detail-item .amount {
  color: #e6a23c;
  font-weight: bold;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-form-item {
  margin-bottom: 20px;
}
</style>