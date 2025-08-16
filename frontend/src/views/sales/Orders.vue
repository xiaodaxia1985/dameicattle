<template>
  <div class="orders-container">
    <div class="page-header">
      <h2>销售订单管理</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新建订单
      </el-button>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderNumber" placeholder="请输入订单号" clearable />
        </el-form-item>
        <!-- 基地选择 -->
        <CascadeSelector
          v-model="searchForm.cascade"
          base-label="选择基地"
          barn-label="选择牛棚(可选)"
          cattle-label="选择牛只(可选)"
          :required="false"
          @change="handleCascadeChange"
        />
        <el-form-item label="客户">
          <el-select v-model="searchForm.customerId" placeholder="请选择客户" clearable filterable>
            <el-option 
              v-for="customer in customerOptions" 
              :key="customer.id" 
              :label="customer.name" 
              :value="customer.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="待审批" value="pending" />
            <el-option label="已审批" value="approved" />
            <el-option label="已交付" value="delivered" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="付款状态">
          <el-select v-model="searchForm.paymentStatus" placeholder="请选择付款状态" clearable>
            <el-option label="未付款" value="unpaid" />
            <el-option label="部分付款" value="partial" />
            <el-option label="已付款" value="paid" />
          </el-select>
        </el-form-item>
        <el-form-item label="订单日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 订单列表 -->
    <el-card class="table-card">
      <div class="table-header">
        <div class="batch-actions">
          <el-button 
            type="success" 
            :disabled="selectedOrders.length === 0"
            @click="handleBatchApprove"
          >
            批量审批
          </el-button>
          <el-button 
            type="warning" 
            :disabled="selectedOrders.length === 0"
            @click="handleBatchExport"
          >
            批量导出
          </el-button>
        </div>
      </div>

      <el-table 
        :data="validOrders" 
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="order_number" label="订单号" width="150" />
        <el-table-column label="客户" min-width="120">
          <template #default="{ row }">
            {{ safeGet(row, 'customer.name', '-') }}
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="订单金额" width="120">
          <template #default="{ row }">
            ¥{{ ensureNumber(safeGet(row, 'total_amount', safeGet(row, 'totalAmount', 0)), 0).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(safeGet(row, 'status', 'pending'))">
              {{ getStatusText(safeGet(row, 'status', 'pending')) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payment_status" label="付款状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getPaymentStatusColor(safeGet(row, 'payment_status', safeGet(row, 'paymentStatus', 'unpaid')))">
              {{ getPaymentStatusText(safeGet(row, 'payment_status', safeGet(row, 'paymentStatus', 'unpaid'))) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order_date" label="订单日期" width="120">
          <template #default="{ row }">
            {{ formatDate(safeGet(row, 'order_date', safeGet(row, 'orderDate', ''))) }}
          </template>
        </el-table-column>
        <el-table-column prop="delivery_date" label="预计交付" width="120">
          <template #default="{ row }">
            {{ formatDate(safeGet(row, 'delivery_date', safeGet(row, 'expectedDeliveryDate', ''))) }}
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="100">
          <template #default="{ row }">
            {{ safeGet(row, 'creator.real_name', '-') }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button 
              size="small" 
              type="primary" 
              @click="handleEdit(row)"
              :disabled="row.status !== 'pending'"
            >
              编辑
            </el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="handleApprove(row)"
              :disabled="row.status !== 'pending'"
            >
              审批
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleCancel(row)"
              :disabled="!['pending', 'approved'].includes(row.status)"
            >
              取消
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
import { salesApi, type SalesOrder } from '@/api/sales'
import CascadeSelector from '@/components/common/CascadeSelector.vue'
import { validateData, validateDataArray, ensureArray, ensureNumber } from '@/utils/dataValidation'
import { safeApiCall, withPageErrorHandler, withFormErrorHandler } from '@/utils/errorHandler'
import { safeGet } from '@/utils/safeAccess'
import { ensureUserLoggedIn, withAuth } from '@/utils/authGuard'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const orders = ref<SalesOrder[]>([])
const selectedOrders = ref<SalesOrder[]>([])
const customerOptions = ref<any[]>([])
const baseOptions = ref<any[]>([])
const cattleOptions = ref<any[]>([])



// 计算属性：过滤有效的订单数据
const validOrders = computed(() => {
  console.log('🔍 validOrders 计算属性执行，原始数据:', orders.value)
  
  // 直接返回所有数据，不进行过滤
  const result = orders.value || []
  
  console.log('🎯 validOrders 最终结果:', {
    originalCount: orders.value?.length || 0,
    resultCount: result.length,
    result
  })
  
  return result
})

// 搜索表单
const searchForm = reactive({
  orderNumber: '',
  customerId: undefined as number | undefined,
  status: '',
  paymentStatus: '',
  dateRange: undefined as [string, string] | undefined,
  cascade: {
    baseId: undefined as number | undefined,
    barnId: undefined as number | undefined,
    cattleId: undefined as number | undefined
  }
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 方法
const fetchOrders = async () => {
  loading.value = true
  try {
    const isLoggedIn = await ensureUserLoggedIn()
    if (!isLoggedIn) {
      console.log('❌ 用户未登录，无法获取订单数据')
      return
    }
    console.log('🔍 开始获取销售订单数据...')
    await withAuth(async () => {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        order_number: searchForm.orderNumber || undefined,
        customer_id: searchForm.customerId,
        status: searchForm.status || undefined,
        payment_status: searchForm.paymentStatus || undefined,
        start_date: searchForm.dateRange?.[0],
        end_date: searchForm.dateRange?.[1]
      }
      console.log('🔍 销售订单请求参数:', params)
      const result = await salesApi.getOrders(params)
      console.log('📥 销售订单API返回结果:', result)
      // 兼容多种后端返回格式
      let items = []
      let total = 0
      if (result && result.data) {
        if (Array.isArray(result.data)) {
          items = result.data
          total = items.length
        } else if (Array.isArray(result.data.items)) {
          items = result.data.items
          total = result.data.total || items.length
        } else if (Array.isArray(result.data.orders)) {
          items = result.data.orders
          total = result.data.total || items.length
        } else if (Array.isArray(result.data.data)) {
          items = result.data.data
          total = result.data.total || items.length
        } else if (Array.isArray(result.data)) {
          items = result.data
          total = items.length
        }
      } else if (Array.isArray(result)) {
        items = result
        total = items.length
      }
      orders.value = items
      pagination.total = total
      console.log('✅ 成功设置销售订单数据:', {
        count: orders.value.length,
        total: pagination.total,
        firstOrder: orders.value[0]
      })
    })
  } catch (error) {
    console.error('❌ 获取销售订单数据失败:', error)
    ElMessage.error('获取销售订单数据失败')
    orders.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const fetchCustomers = async () => {
  try {
    // 使用认证守卫确保用户已登录
    const isLoggedIn = await ensureUserLoggedIn()
    if (!isLoggedIn) {
      console.log('❌ 用户未登录，无法获取客户选项')
      return
    }
    
    // 使用withAuth包装API调用
    await withAuth(async () => {
      const result = await salesApi.getCustomers({ limit: 100 })
      
      if (result && result.data && result.data.items) {
        const customersData = ensureArray(result.data.items)
        customerOptions.value = customersData.filter(customer => 
          customer && 
          typeof customer === 'object' && 
          ensureNumber(customer.id, 0) > 0 &&
          customer.name &&
          typeof customer.name === 'string'
        )
        console.log('✅ 成功获取客户选项:', customerOptions.value.length)
      }
    })
  } catch (error) {
    console.error('❌ 获取客户选项失败:', error)
    customerOptions.value = []
  }
}

// 级联选择变更处理
const handleCascadeChange = async (value: { baseId?: number; barnId?: number; cattleId?: number }) => {
  // 使用 modulesFix 工具进行安全的级联数据处理
  const { handleCascadeChange: safeCascadeChange } = await import('@/utils/modulesFix')
  
  safeCascadeChange(value, searchForm, () => {
    pagination.page = 1
    fetchOrders()
  })
}

const handleSearch = () => {
  pagination.page = 1
  fetchOrders()
}

const handleReset = () => {
  Object.assign(searchForm, {
    orderNumber: '',
    customerId: null,
    status: '',
    paymentStatus: '',
    dateRange: null,
    cascade: {
      baseId: undefined,
      barnId: undefined,
      cattleId: undefined
    }
  })
  handleSearch()
}

const handleAdd = () => {
  router.push('/admin/sales/orders/new')
}

const handleEdit = (row: SalesOrder) => {
  router.push(`/admin/sales/orders/${row.id}/edit`)
}

const handleView = (row: SalesOrder) => {
  router.push(`/admin/sales/orders/${row.id}`)
}

const handleApprove = async (row: SalesOrder) => {
  try {
    await ElMessageBox.confirm('确定要审批这个订单吗？审批后牛只将被标记为已售出。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const result = await safeApiCall(
      () => salesApi.approveOrder(ensureNumber(row.id, 0)),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result !== null) {
      ElMessage.success('审批成功')
      fetchOrders()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('审批失败')
    }
  }
}

const handleCancel = async (row: SalesOrder) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入取消原因', '取消订单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入取消原因'
    })
    
    const result = await safeApiCall(
      () => salesApi.cancelOrder(ensureNumber(row.id, 0), reason || '用户取消'),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result !== null) {
      ElMessage.success('取消成功')
      fetchOrders()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

const handleBatchApprove = async () => {
  try {
    await ElMessageBox.confirm(`确定要批量审批选中的 ${selectedOrders.value.length} 个订单吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 批量审批功能待实现
    ElMessage.info('批量审批功能开发中')
    
    fetchOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量审批失败')
    }
  }
}

const handleBatchExport = () => {
  ElMessage.info('批量导出功能开发中')
}

const handleSelectionChange = (selection: SalesOrder[]) => {
  selectedOrders.value = selection
}

const handleSizeChange = (size: number) => {
  pagination.limit = size
  fetchOrders()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchOrders()
}

// 状态和类型转换方法
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: '待审批',
    approved: '已审批',
    delivered: '已交付',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

const getStatusColor = (status: string): "success" | "primary" | "warning" | "info" | "danger" => {
  const colorMap: Record<string, "success" | "primary" | "warning" | "info" | "danger"> = {
    pending: 'warning',
    approved: 'primary',
    delivered: 'info',
    completed: 'success',
    cancelled: 'danger'
  }
  return colorMap[status] || 'info'
}

const getPaymentStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    unpaid: '未付款',
    partial: '部分付款',
    paid: '已付款'
  }
  return statusMap[status] || status
}

const getPaymentStatusColor = (status: string): "success" | "primary" | "warning" | "info" | "danger" => {
  const colorMap: Record<string, "success" | "primary" | "warning" | "info" | "danger"> = {
    unpaid: 'danger',
    partial: 'warning',
    paid: 'success'
  }
  return colorMap[status] || 'info'
}

const formatDate = (dateString?: string) => {
  return dateString ? new Date(dateString).toLocaleDateString('zh-CN') : '-'
}



// 生命周期
onMounted(() => {
  fetchOrders()
  fetchCustomers()
})
</script>

<style scoped>
.orders-container {
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

.table-header {
  margin-bottom: 16px;
}

.batch-actions {
  display: flex;
  gap: 10px;
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

.order-detail .el-card {
  margin-bottom: 20px;
}

.order-detail .el-card:last-child {
  margin-bottom: 0;
}
</style>