<template>
  <div class="orders-container">
    <div class="page-header">
      <h2>采购订单管理</h2>
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
          cattle-label=""
          :required="false"
          @change="handleCascadeChange"
        />
        <el-form-item label="供应商">
          <el-select v-model="searchForm.supplierId" placeholder="请选择供应商" clearable filterable>
            <el-option 
              v-for="supplier in supplierOptions" 
              :key="supplier.id" 
              :label="supplier.name" 
              :value="supplier.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="订单类型">
          <el-select v-model="searchForm.orderType" placeholder="请选择类型" clearable>
            <el-option label="牛只采购" value="cattle" />
            <el-option label="物资采购" value="material" />
            <el-option label="设备采购" value="equipment" />
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
        <el-table-column prop="orderNumber" label="订单号" width="150" />
        <el-table-column prop="supplierName" label="供应商" min-width="120" />
        <el-table-column prop="orderType" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getOrderTypeColor(row.orderType)">
              {{ getOrderTypeText(row.orderType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="订单金额" width="120">
          <template #default="{ row }">
            ¥{{ row.totalAmount?.toLocaleString() || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="订单状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusColor(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="paymentStatus" label="付款状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getPaymentStatusColor(row.paymentStatus)">
              {{ getPaymentStatusText(row.paymentStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="orderDate" label="订单日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.orderDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="expectedDeliveryDate" label="预计交付" width="120">
          <template #default="{ row }">
            {{ formatDate(row.expectedDeliveryDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdByName" label="创建人" width="100" />
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

    <!-- 订单表单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="1200px"
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <!-- 基本信息 -->
        <el-card class="form-section">
          <template #header>
            <span>基本信息</span>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="供应商" prop="supplierId">
                <el-select 
                  v-model="form.supplierId" 
                  placeholder="请选择供应商" 
                  filterable
                  @change="handleSupplierChange"
                >
                  <el-option 
                    v-for="supplier in supplierOptions" 
                    :key="supplier.id" 
                    :label="supplier.name" 
                    :value="supplier.id" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="基地" prop="baseId">
                <el-select v-model="form.baseId" placeholder="请选择基地">
                  <el-option 
                    v-for="base in baseOptions" 
                    :key="base.id" 
                    :label="base.name" 
                    :value="base.id" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="订单类型" prop="orderType">
                <el-select v-model="form.orderType" placeholder="请选择类型">
                  <el-option label="牛只采购" value="cattle" />
                  <el-option label="物资采购" value="material" />
                  <el-option label="设备采购" value="equipment" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="订单日期" prop="orderDate">
                <el-date-picker
                  v-model="form.orderDate"
                  type="date"
                  placeholder="请选择订单日期"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="预计交付日期">
                <el-date-picker
                  v-model="form.expectedDeliveryDate"
                  type="date"
                  placeholder="请选择预计交付日期"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="付款方式">
                <el-select v-model="form.paymentMethod" placeholder="请选择付款方式">
                  <el-option label="现金" value="cash" />
                  <el-option label="银行转账" value="transfer" />
                  <el-option label="支票" value="check" />
                  <el-option label="信用证" value="credit" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="合同编号">
                <el-input v-model="form.contractNumber" placeholder="请输入合同编号" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="备注">
                <el-input v-model="form.remark" placeholder="请输入备注" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <!-- 订单明细 -->
        <el-card class="form-section">
          <template #header>
            <div class="section-header">
              <span>订单明细</span>
              <el-button size="small" type="primary" @click="handleAddItem">
                <el-icon><Plus /></el-icon>
                添加明细
              </el-button>
            </div>
          </template>

          <el-table :data="form.items" border>
            <el-table-column label="序号" type="index" width="60" />
            <el-table-column label="商品名称" min-width="150">
              <template #default="{ row, $index }">
                <el-input v-model="row.itemName" placeholder="请输入商品名称" />
              </template>
            </el-table-column>
            <el-table-column label="规格" width="120">
              <template #default="{ row, $index }">
                <el-input v-model="row.specification" placeholder="请输入规格" />
              </template>
            </el-table-column>
            <el-table-column label="数量" width="100">
              <template #default="{ row, $index }">
                <el-input-number 
                  v-model="row.quantity" 
                  :min="0" 
                  :precision="2"
                  @change="calculateItemTotal(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="单位" width="80">
              <template #default="{ row, $index }">
                <el-input v-model="row.unit" placeholder="单位" />
              </template>
            </el-table-column>
            <el-table-column label="单价" width="120">
              <template #default="{ row, $index }">
                <el-input-number 
                  v-model="row.unitPrice" 
                  :min="0" 
                  :precision="2"
                  @change="calculateItemTotal(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="小计" width="120">
              <template #default="{ row }">
                ¥{{ row.totalPrice?.toLocaleString() || 0 }}
              </template>
            </el-table-column>
            <el-table-column label="备注" width="120">
              <template #default="{ row, $index }">
                <el-input v-model="row.remark" placeholder="备注" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row, $index }">
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="handleRemoveItem($index)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 金额汇总 -->
          <div class="amount-summary">
            <el-row :gutter="20">
              <el-col :span="6" :offset="12">
                <el-form-item label="折扣金额">
                  <el-input-number 
                    v-model="form.discountAmount" 
                    :min="0" 
                    :precision="2"
                    @change="calculateTotal"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="税额">
                  <el-input-number 
                    v-model="form.taxAmount" 
                    :min="0" 
                    :precision="2"
                    @change="calculateTotal"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="total-amount">
              <strong>订单总额: ¥{{ form.totalAmount?.toLocaleString() || 0 }}</strong>
            </div>
          </div>
        </el-card>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="订单详情"
      width="1000px"
    >
      <div v-if="currentOrder" class="order-detail">
        <!-- 基本信息 -->
        <el-card class="detail-section">
          <template #header>基本信息</template>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-item">
                <label>订单号：</label>
                <span>{{ currentOrder.orderNumber }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>供应商：</label>
                <span>{{ currentOrder.supplierName }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>订单类型：</label>
                <el-tag :type="getOrderTypeColor(currentOrder.orderType)">
                  {{ getOrderTypeText(currentOrder.orderType) }}
                </el-tag>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-item">
                <label>订单状态：</label>
                <el-tag :type="getStatusColor(currentOrder.status)">
                  {{ getStatusText(currentOrder.status) }}
                </el-tag>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>付款状态：</label>
                <el-tag :type="getPaymentStatusColor(currentOrder.paymentStatus)">
                  {{ getPaymentStatusText(currentOrder.paymentStatus) }}
                </el-tag>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>订单金额：</label>
                <span class="amount">¥{{ currentOrder.totalAmount?.toLocaleString() || 0 }}</span>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 订单明细 -->
        <el-card class="detail-section">
          <template #header>订单明细</template>
          <el-table :data="(currentOrder as any)?.items || []" border>
            <el-table-column label="序号" type="index" width="60" />
            <el-table-column prop="itemName" label="商品名称" min-width="150" />
            <el-table-column prop="specification" label="规格" width="120" />
            <el-table-column prop="quantity" label="数量" width="100" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="unitPrice" label="单价" width="120">
              <template #default="{ row }">
                ¥{{ row.unitPrice?.toLocaleString() || 0 }}
              </template>
            </el-table-column>
            <el-table-column prop="totalPrice" label="小计" width="120">
              <template #default="{ row }">
                ¥{{ row.totalPrice?.toLocaleString() || 0 }}
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="120" />
          </el-table>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { purchaseApi, type PurchaseOrder } from '@/api/purchase'
import CascadeSelector from '@/components/common/CascadeSelector.vue'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const orders = ref<PurchaseOrder[]>([])
const selectedOrders = ref<PurchaseOrder[]>([])
const supplierOptions = ref<any[]>([])
const baseOptions = ref<any[]>([])

// 搜索表单
const searchForm = reactive({
  orderNumber: '',
  supplierId: undefined as number | undefined,
  orderType: '',
  status: '',
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

// 对话框
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const currentOrder = ref<PurchaseOrder | null>(null)

// 表单数据
const form = reactive({
  supplierId: undefined as number | undefined,
  baseId: undefined as number | undefined,
  orderType: '',
  orderDate: '',
  expectedDeliveryDate: '',
  paymentMethod: '',
  contractNumber: '',
  remark: '',
  discountAmount: 0,
  taxAmount: 0,
  totalAmount: 0,
  items: [] as any[]
})

// 表单验证规则
const rules = {
  supplierId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  baseId: [{ required: true, message: '请选择基地', trigger: 'change' }],
  orderType: [{ required: true, message: '请选择订单类型', trigger: 'change' }],
  orderDate: [{ required: true, message: '请选择订单日期', trigger: 'change' }]
}

// 计算属性
const dialogTitle = computed(() => isEdit.value ? '编辑采购订单' : '新建采购订单')

// 方法
const fetchOrders = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm,
      startDate: searchForm.dateRange?.[0],
      endDate: searchForm.dateRange?.[1]
    }
    // Remove dateRange from params since we've extracted startDate and endDate
    const { dateRange, ...finalParams } = params
    
    const response = await purchaseApi.getOrders(params)
    // 根据API实现，response.data 可能是 { items: [...], total: number } 或直接是数组
    if (response.data.items) {
      orders.value = response.data.items || []
      pagination.total = response.data.total || 0
    } else {
      orders.value = response.data || []
      pagination.total = response.data.length || 0
    }
  } catch (error) {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const fetchSuppliers = async () => {
  try {
    const response = await purchaseApi.getSuppliers()
    // 根据API实现，response.data 可能是 { items: [...], total: number } 或直接是数组
    if (response.data.items) {
      supplierOptions.value = response.data.items || []
    } else {
      supplierOptions.value = response.data || []
    }
  } catch (error) {
    console.error('获取供应商列表失败')
  }
}

// 级联选择变更处理
const handleCascadeChange = (value: { baseId?: number; barnId?: number; cattleId?: number }) => {
  searchForm.cascade = value
  pagination.page = 1
  fetchOrders()
}

const handleSearch = () => {
  pagination.page = 1
  fetchOrders()
}

const handleReset = () => {
  Object.assign(searchForm, {
    orderNumber: '',
    supplierId: null,
    orderType: '',
    status: '',
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
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: PurchaseOrder) => {
  isEdit.value = true
  Object.assign(form, {
    ...row,
    orderDate: row.orderDate ? new Date(row.orderDate) : '',
    expectedDeliveryDate: row.expectedDeliveryDate ? new Date(row.expectedDeliveryDate) : ''
  })
  dialogVisible.value = true
}

const handleView = (row: PurchaseOrder) => {
  currentOrder.value = row
  detailDialogVisible.value = true
}

const handleApprove = async (row: PurchaseOrder) => {
  try {
    await ElMessageBox.confirm('确定要审批这个订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await purchaseApi.approveOrder(row.id)
    ElMessage.success('审批成功')
    fetchOrders()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('审批失败')
    }
  }
}

const handleCancel = async (row: PurchaseOrder) => {
  try {
    await ElMessageBox.confirm('确定要取消这个订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await purchaseApi.cancelOrder(row.id, '用户手动取消')
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
    const orderIds = selectedOrders.value.map(order => order.id)
    await purchaseApi.batchApproveOrders(orderIds)
    ElMessage.success('批量审批成功')
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

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      // 更新订单
      ElMessage.success('更新成功')
    } else {
      // 创建订单
      await purchaseApi.createOrder(form)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    fetchOrders()
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const handleDialogClose = () => {
  formRef.value?.resetFields()
  resetForm()
}

const resetForm = () => {
  Object.assign(form, {
    supplierId: null,
    baseId: null,
    orderType: '',
    orderDate: '',
    expectedDeliveryDate: '',
    paymentMethod: '',
    contractNumber: '',
    remark: '',
    discountAmount: 0,
    taxAmount: 0,
    totalAmount: 0,
    items: []
  })
}

const handleAddItem = () => {
  form.items.push({
    itemName: '',
    specification: '',
    quantity: 1,
    unit: '',
    unitPrice: 0,
    totalPrice: 0,
    remark: ''
  })
}

const handleRemoveItem = (index: number) => {
  form.items.splice(index, 1)
  calculateTotal()
}

const calculateItemTotal = (item: any) => {
  item.totalPrice = (item.quantity || 0) * (item.unitPrice || 0)
  calculateTotal()
}

const calculateTotal = () => {
  const subtotal = form.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
  form.totalAmount = subtotal + (form.taxAmount || 0) - (form.discountAmount || 0)
}

const handleSupplierChange = () => {
  // 可以根据供应商类型自动设置订单类型
}

const handleSelectionChange = (selection: PurchaseOrder[]) => {
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
const getOrderTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    cattle: '牛只采购',
    material: '物资采购',
    equipment: '设备采购'
  }
  return typeMap[type] || type
}

const getOrderTypeColor = (type: string): "success" | "primary" | "warning" | "info" | "danger" => {
  const colorMap: Record<string, "success" | "primary" | "warning" | "info" | "danger"> = {
    cattle: 'success',
    material: 'primary',
    equipment: 'warning'
  }
  return colorMap[type] || 'info'
}

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

const formatDate = (dateString: string) => {
  return dateString ? new Date(dateString).toLocaleDateString('zh-CN') : '-'
}

// 生命周期
onMounted(() => {
  fetchOrders()
  fetchSuppliers()
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

.form-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-summary {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.total-amount {
  text-align: right;
  margin-top: 10px;
  font-size: 16px;
  color: #e6a23c;
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

.el-form-item {
  margin-bottom: 20px;
}
</style>