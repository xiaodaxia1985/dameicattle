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
        :data="orders" 
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="order_number" label="订单号" width="150" />
        <el-table-column label="客户" min-width="120">
          <template #default="{ row }">
            {{ row.customer?.name }}
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="订单金额" width="120">
          <template #default="{ row }">
            ¥{{ row.total_amount?.toLocaleString() || 0 }}
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
            {{ row.creator?.real_name }}
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { salesApi, type SalesOrder } from '@/api/sales'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const orders = ref<SalesOrder[]>([])
const selectedOrders = ref<SalesOrder[]>([])
const customerOptions = ref<any[]>([])
const baseOptions = ref<any[]>([])
const cattleOptions = ref<any[]>([])

// 搜索表单
const searchForm = reactive({
  orderNumber: '',
  customerId: undefined as number | undefined,
  status: '',
  paymentStatus: '',
  dateRange: undefined as [string, string] | undefined
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
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      order_number: searchForm.orderNumber,
      customer_id: searchForm.customerId,
      status: searchForm.status,
      payment_status: searchForm.paymentStatus,
      start_date: searchForm.dateRange?.[0],
      end_date: searchForm.dateRange?.[1]
    }
    
    const response = await salesApi.getOrders(params)
    // 根据API实现，response.data 应该是 { items: [...], total: number, page: number, limit: number }
    orders.value = response.data.items || []
    pagination.total = response.data.total || 0
  } catch (error) {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const fetchCustomers = async () => {
  try {
    const response = await salesApi.getCustomers({ limit: 100 })
    // 根据API实现，response.data 应该是 { items: [...], total: number, page: number, limit: number }
    customerOptions.value = response.data.items || []
  } catch (error) {
    console.error('获取客户列表失败')
  }
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
    dateRange: null
  })
  handleSearch()
}

const handleAdd = () => {
  ElMessage.info('新建订单功能开发中')
}

const handleEdit = (row: SalesOrder) => {
  ElMessage.info('编辑订单功能开发中')
}

const handleView = (row: SalesOrder) => {
  ElMessage.info('查看订单详情功能开发中')
}

const handleApprove = async (row: SalesOrder) => {
  try {
    await ElMessageBox.confirm('确定要审批这个订单吗？审批后牛只将被标记为已售出。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await salesApi.approveOrder(row.id)
    ElMessage.success('审批成功')
    fetchOrders()
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
    
    await salesApi.cancelOrder(row.id, reason)
    ElMessage.success('取消成功')
    fetchOrders()
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
</style>