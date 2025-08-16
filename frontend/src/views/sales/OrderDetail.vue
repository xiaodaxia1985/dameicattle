<template>
  <div class="order-detail-container">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
        <h2>订单详情</h2>
      </div>
      <div class="header-right">
        <el-button 
          type="primary" 
          @click="handleEdit"
          :disabled="order?.status !== 'pending'"
        >
          编辑订单
        </el-button>
        <el-button 
          type="success" 
          @click="handleApprove"
          :disabled="order?.status !== 'pending'"
        >
          审批订单
        </el-button>
        <el-button 
          type="danger" 
          @click="handleCancel"
          :disabled="!['pending', 'approved'].includes(order?.status || '')"
        >
          取消订单
        </el-button>
      </div>
    </div>

    <!-- 调试信息 -->
    <div v-if="order && typeof order.id === 'number'" style="background: #f0f0f0; padding: 10px; margin-bottom: 20px; border-radius: 4px;">
      <h4>调试信息（订单数据已加载）:</h4>
      <p>订单ID: {{ order.id }}</p>
      <p>订单号: {{ order.order_number }}</p>
      <p>客户名称: {{ order.customer_name || '-' }}</p>
      <p>订单状态: {{ order.status }}</p>
      <p>数据对象: {{ JSON.stringify(order, null, 2) }}</p>
    </div>

    <div v-if="order && typeof order.id === 'number'" class="order-detail">
      <!-- 基本信息 -->
      <el-card class="detail-section">
        <template #header>
          <div class="section-header">
            <span>基本信息</span>
            <div class="status-tags">
              <el-tag :type="getStatusColor(order.status)">
                {{ getStatusText(order.status) }}
              </el-tag>
              <el-tag :type="getPaymentStatusColor(order.payment_status || 'unpaid')">
                {{ getPaymentStatusText(order.payment_status || 'unpaid') }}
              </el-tag>
            </div>
          </div>
        </template>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-item">
              <label>订单号：</label>
              <span>{{ order.order_number }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>客户：</label>
              <span>{{ order.customer_name || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>基地：</label>
              <span>{{ order.base_name || '-' }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-item">
              <label>订单日期：</label>
              <span>{{ formatDate(order.order_date) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>预计交付：</label>
              <span>{{ formatDate(order.delivery_date) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>实际交付：</label>
              <span>{{ formatDate(order.actual_delivery_date) }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-item">
              <label>创建人：</label>
              <span>{{ order.created_by_name || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>审批人：</label>
              <span>{{ order.approved_by_name || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>审批时间：</label>
              <span>{{ formatDate(order.approved_at) }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 付款信息 -->
      <el-card class="detail-section">
        <template #header>付款信息</template>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-item">
              <label>订单金额：</label>
              <span class="amount">¥{{ Number(order.total_amount || 0).toLocaleString() }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>税费：</label>
              <span>¥{{ Number(order.tax_amount || 0).toFixed(2) }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>折扣：</label>
              <span>¥{{ Number(order.discount_amount || 0).toFixed(2) }}</span>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-item">
              <label>付款方式：</label>
              <span>{{ order.payment_method || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>合同编号：</label>
              <span>{{ order.contract_number || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>付款状态：</label>
              <el-tag :type="getPaymentStatusColor(order.payment_status || 'unpaid')">
                {{ getPaymentStatusText(order.payment_status || 'unpaid') }}
              </el-tag>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 物流信息 -->
      <el-card class="detail-section">
        <template #header>物流信息</template>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="detail-item">
              <label>物流公司：</label>
              <span>{{ order.logistics_company || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>运单号：</label>
              <span>{{ order.tracking_number || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="detail-item">
              <label>交付状态：</label>
              <el-tag :type="order.status === 'delivered' ? 'success' : 'warning'">
                {{ order.status === 'delivered' ? '已交付' : '待交付' }}
              </el-tag>
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="order.remark">
          <el-col :span="24">
            <div class="detail-item">
              <label>备注：</label>
              <span>{{ order.remark }}</span>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 订单明细 -->
      <el-card class="detail-section">
        <template #header>订单明细</template>
        <el-table :data="order.items || []" border>
          <el-table-column prop="ear_tag" label="耳标号" width="120">
            <template #default="{ row }">
              {{ row.ear_tag || row.earTag }}
            </template>
          </el-table-column>
          <el-table-column prop="breed" label="品种" width="120" />
          <el-table-column prop="weight" label="重量(kg)" width="100">
            <template #default="{ row }">
              {{ Number(row.weight || 0).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="unit_price" label="单价(元/kg)" width="120">
            <template #default="{ row }">
              ¥{{ Number(row.unit_price || row.unitPrice || 0).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="total_price" label="小计" width="120">
            <template #default="{ row }">
              ¥{{ Number(row.total_price || row.totalPrice || 0).toLocaleString() }}
            </template>
          </el-table-column>
          <el-table-column prop="quality_grade" label="质量等级" width="100">
            <template #default="{ row }">
              {{ row.quality_grade || row.qualityGrade || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="delivery_status" label="交付状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.delivery_status === 'delivered' ? 'success' : 'warning'">
                {{ row.delivery_status === 'delivered' ? '已交付' : '待交付' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="150" />
        </el-table>
        <div v-if="!order.items?.length" class="empty-state">
          <el-empty description="暂无订单明细" />
        </div>
      </el-card>
    </div>

    <div v-else class="loading-state">
      <el-skeleton :rows="10" animated />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { salesApi, type SalesOrder } from '@/api/sales'
import { safeApiCall } from '@/utils/errorHandler'
import { ensureNumber } from '@/utils/dataValidation'
import { useOrderStore } from '@/store/order'

const router = useRouter()
const route = useRoute()
const orderStore = useOrderStore()

// 响应式数据
const order = ref<SalesOrder | null>(null)

// 优先从 Pinia 获取当前订单
const orderId = Number(route.params.id)
if (orderStore.currentOrder && orderStore.currentOrder.id === orderId) {
  order.value = orderStore.currentOrder
}

// 方法
const goBack = () => {
  router.push('/admin/sales/orders')
}

const handleEdit = () => {
  router.push(`/admin/sales/orders/${order.value?.id}/edit`)
}

const handleApprove = async () => {
  try {
    await ElMessageBox.confirm('确定要审批这个订单吗？审批后牛只将被标记为已售出。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const result = await safeApiCall(
      () => salesApi.approveOrder(ensureNumber(order.value?.id, 0)),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result !== null) {
      ElMessage.success('审批成功')
      loadOrder(Number(route.params.id))
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('审批失败')
    }
  }
}

const handleCancel = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入取消原因', '取消订单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入取消原因'
    })
    
    const result = await safeApiCall(
      () => salesApi.cancelOrder(ensureNumber(order.value?.id, 0), reason || '用户取消'),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    if (result !== null) {
      ElMessage.success('取消成功')
      loadOrder(Number(route.params.id))
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消失败')
    }
  }
}

// 字段名转换函数，兼容后端各种格式
function transformOrder(raw: any): SalesOrder {
  if (!raw || typeof raw !== 'object') return raw
  return {
    ...raw,
    order_number: raw.order_number || raw.orderNumber,
    customer_name: raw.customer_name || raw.customerName,
    base_name: raw.base_name || raw.baseName,
    total_amount: raw.total_amount || raw.totalAmount,
    tax_amount: raw.tax_amount || raw.taxAmount,
    discount_amount: raw.discount_amount || raw.discountAmount,
    payment_status: raw.payment_status || raw.paymentStatus,
    payment_method: raw.payment_method || raw.paymentMethod,
    order_date: raw.order_date || raw.orderDate,
    delivery_date: raw.delivery_date || raw.expectedDeliveryDate,
    actual_delivery_date: raw.actual_delivery_date || raw.actualDeliveryDate,
    contract_number: raw.contract_number || raw.contractNumber,
    logistics_company: raw.logistics_company || raw.logisticsCompany,
    tracking_number: raw.tracking_number || raw.trackingNumber,
    created_by: raw.created_by || raw.createdBy,
    created_by_name: raw.created_by_name || raw.createdByName,
    approved_by: raw.approved_by || raw.approvedBy,
    approved_by_name: raw.approved_by_name || raw.approvedByName,
    approved_at: raw.approved_at || raw.approvedAt,
    created_at: raw.created_at || raw.createdAt,
    updated_at: raw.updated_at || raw.updatedAt,
    customer: raw.customer,
    base: raw.base,
    creator: raw.creator,
    approver: raw.approver,
    items: Array.isArray(raw.items) ? raw.items.map(item => ({
      ...item,
      ear_tag: item.ear_tag || item.earTag,
      unit_price: item.unit_price || item.unitPrice,
      total_price: item.total_price || item.totalPrice,
      quality_grade: item.quality_grade || item.qualityGrade,
      delivery_status: item.delivery_status || item.deliveryStatus
    })) : []
  }
}

const loadOrder = async (id: number) => {
  // 如果 Pinia 已有数据且 id 匹配，直接用，无需请求
  if (orderStore.currentOrder && orderStore.currentOrder.id === id) {
    order.value = orderStore.currentOrder
    return
  }
  try {
    console.log('🔍 开始加载订单详情，ID:', id)
    const result = await safeApiCall(
      () => salesApi.getOrder(id),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    console.log('📥 订单详情加载结果:', result)
    if (result && typeof result === 'object' && typeof result.id === 'number') {
      order.value = transformOrder(result)
      orderStore.setCurrentOrder(order.value)
      console.log('✅ 订单详情加载成功，order.value:', order.value)
      return
    } else {
      console.error('❌ 订单详情数据无效:', result)
      ElMessage.error('获取订单详情失败，请检查订单是否存在')
    }
  } catch (error) {
    ElMessage.error('获取订单详情失败')
  }
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
  const id = route.params.id as string
  if (id) {
    loadOrder(Number(id))
  }
})
watch(() => route.params.id, (newId) => {
  if (newId) {
    loadOrder(Number(newId))
  }
})
</script>

<style scoped>
.order-detail-container {
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

.status-tags {
  display: flex;
  gap: 8px;
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
  font-size: 16px;
}

.empty-state {
  padding: 40px 0;
}

.loading-state {
  padding: 20px;
}
</style>