<template>
  <div class="orders-container">
    <div class="page-header">
      <h2>销售订单管理</h2>
      <div class="header-actions">
        <el-button @click="handleRefresh" :loading="salesStore.ordersLoading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新建订单
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards" v-if="!initializationError">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ safeOrdersStatistics.total || 0 }}</div>
          <div class="stat-label">总订单数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ safeOrdersStatistics.pending || 0 }}</div>
          <div class="stat-label">待审批</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ safeOrdersStatistics.approved || 0 }}</div>
          <div class="stat-label">已审批</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">¥{{ (safeOrdersStatistics.totalAmount || 0).toLocaleString() }}</div>
          <div class="stat-label">总金额</div>
        </div>
      </el-card>
    </div>
    
    <!-- 错误状态 -->
    <el-alert
      v-if="initializationError"
      title="页面初始化失败"
      type="error"
      description="请检查网络连接或刷新页面重试"
      show-icon
      style="margin-bottom: 20px"
    >
      <template #default>
        <div style="margin-top: 10px;">
          <el-button type="primary" @click="retryInitialization">重试加载</el-button>
        </div>
      </template>
    </el-alert>

    <!-- 搜索筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="订单号">
          <el-input v-model="searchForm.orderNumber" placeholder="请输入订单号" clearable />
        </el-form-item>
        <el-form-item label="客户">
          <el-select v-model="searchForm.customerId" placeholder="请选择客户" clearable filterable>
            <el-option 
              v-for="customer in salesStore.customers" 
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
            :disabled="salesStore.selectedOrderIds.length === 0"
            @click="handleBatchApprove"
          >
            批量审批 ({{ salesStore.selectedOrderIds.length }})
          </el-button>
          <el-button 
            type="warning" 
            :disabled="salesStore.selectedOrderIds.length === 0"
            @click="handleBatchExport"
          >
            批量导出
          </el-button>
        </div>
        <div class="table-info">
          <span>共 {{ salesStore.ordersPagination.total }} 条记录</span>
        </div>
      </div>

      <el-table 
        :data="salesStore.orders" 
        v-loading="salesStore.ordersLoading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="order_number" label="订单号" width="150" />
        <el-table-column label="客户" min-width="120">
          <template #default="{ row }">
            <el-button 
              link 
              @click="handleViewCustomer(row.customer_id)"
              v-if="row.customer?.name"
            >
              {{ row.customer.name }}
            </el-button>
            <span v-else>{{ row.customer_name || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="订单金额" width="120">
          <template #default="{ row }">
            ¥{{ (row.total_amount || 0).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payment_status" label="付款状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getPaymentStatusColor(row.payment_status)">
              {{ getPaymentStatusText(row.payment_status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order_date" label="订单日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.order_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="delivery_date" label="预计交付" width="120">
          <template #default="{ row }">
            {{ formatDate(row.delivery_date) }}
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="100">
          <template #default="{ row }">
            {{ row.creator?.real_name || row.created_by_name || '-' }}
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
          v-model:current-page="salesStore.ordersPage"
          v-model:page-size="salesStore.ordersLimit"
          :total="salesStore.ordersPagination.total"
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
import { ref, reactive, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useSalesStore } from '@/stores/sales'
import type { SalesOrder } from '@/api/sales'

const router = useRouter()
const salesStore = useSalesStore()

// 组件状态管理
const isComponentMounted = ref(false)
const initializationError = ref(false)

// 搜索表单
const searchForm = reactive({
  orderNumber: '',
  customerId: undefined as number | undefined,
  status: '',
  paymentStatus: '',
  dateRange: undefined as [string, string] | undefined
})

// 安全的统计数据computed
const safeOrdersStatistics = computed(() => {
  if (!isComponentMounted.value || !salesStore.orders) {
    return {
      total: 0,
      pending: 0,
      approved: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
      totalAmount: 0
    }
  }
  
  try {
    return salesStore.getOrdersStatistics || {
      total: 0,
      pending: 0,
      approved: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
      totalAmount: 0
    }
  } catch (error) {
    console.warn('⚠️ 获取订单统计失败:', error)
    return {
      total: 0,
      pending: 0,
      approved: 0,
      delivered: 0,
      completed: 0,
      cancelled: 0,
      totalAmount: 0
    }
  }
})

// 方法
const retryInitialization = async () => {
  initializationError.value = false
  try {
    console.log('🔄 重试初始化数据...')
    await Promise.all([
      salesStore.fetchOrders({}, true), // 强制刷新
      salesStore.fetchCustomers({}, true)
    ])
    ElMessage.success('数据重新加载成功')
  } catch (error) {
    console.error('❌ 重试初始化失败:', error)
    initializationError.value = true
    ElMessage.error('重试失败，请稍后再试')
  }
}

const fetchOrders = async () => {
  if (!isComponentMounted.value) {
    console.warn('⚠️ 组件尚未挂载，跳过获取订单')
    return
  }
  
  const params = {
    page: salesStore.ordersPage,
    limit: salesStore.ordersLimit,
    order_number: searchForm.orderNumber || undefined,
    customer_id: searchForm.customerId,
    status: searchForm.status || undefined,
    payment_status: searchForm.paymentStatus || undefined,
    start_date: searchForm.dateRange?.[0],
    end_date: searchForm.dateRange?.[1]
  }
  
  salesStore.setOrderFilters(params)
  await salesStore.fetchOrders(params)
}

const handleRefresh = async () => {
  if (initializationError.value) {
    await retryInitialization()
  } else {
    await salesStore.fetchOrders({}, true) // Force refresh
  }
}

const handleSearch = () => {
  fetchOrders()
}

const handleReset = () => {
  Object.assign(searchForm, {
    orderNumber: '',
    customerId: undefined,
    status: '',
    paymentStatus: '',
    dateRange: undefined
  })
  salesStore.clearOrdersCache()
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

const handleViewCustomer = (customerId: number) => {
  if (customerId) {
    router.push(`/admin/sales/customers/${customerId}`)
  }
}

const handleApprove = async (row: SalesOrder) => {
  try {
    await ElMessageBox.confirm('确定要审批这个订单吗？审批后牛只将被标记为已售出。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await salesStore.approveOrder(row.id)
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审批失败:', error)
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
    
    await salesStore.cancelOrder(row.id, reason || '用户取消')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消失败:', error)
    }
  }
}

const handleBatchApprove = async () => {
  try {
    await ElMessageBox.confirm(`确定要批量审批选中的 ${salesStore.selectedOrderIds.length} 个订单吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await salesStore.batchApproveOrders(salesStore.selectedOrderIds)
    salesStore.clearSelections()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量审批失败:', error)
    }
  }
}

const handleBatchExport = () => {
  ElMessage.info('批量导出功能开发中')
}

const handleSelectionChange = (selection: SalesOrder[]) => {
  const selectedIds = selection.map(order => order.id)
  salesStore.selectOrders(selectedIds)
}

const handleSizeChange = (size: number) => {
  salesStore.ordersLimit = size
  fetchOrders()
}

const handleCurrentChange = (page: number) => {
  salesStore.ordersPage = page
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
onMounted(async () => {
  try {
    console.log('🚀 Orders组件开始挂载...')
    
    // 确保DOM已经渲染
    await nextTick()
    
    // 标记组件已挂载
    isComponentMounted.value = true
    
    console.log('🔄 初始化销售订单页面数据...')
    
    // 初始化数据
    await Promise.all([
      salesStore.fetchOrders().catch(error => {
        console.error('❌ 获取订单列表失败:', error)
        ElMessage.error('获取订单列表失败')
        return { data: { items: [], total: 0, page: 1, limit: 20 } }
      }),
      salesStore.fetchCustomers().catch(error => {
        console.error('❌ 获取客户列表失败:', error)
        ElMessage.error('获取客户列表失败')
        return { data: { items: [], total: 0, page: 1, limit: 20 } }
      })
    ])
    
    console.log('✅ 销售订单页面数据初始化完成')
  } catch (error) {
    console.error('❌ 销售订单页面初始化失败:', error)
    initializationError.value = true
    ElMessage.error('页面数据加载失败，请刷新重试')
  }
})

// 组件销毁时清理
onUnmounted(() => {
  console.log('🧹 Orders组件卸载，清理资源...')
  isComponentMounted.value = false
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

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>