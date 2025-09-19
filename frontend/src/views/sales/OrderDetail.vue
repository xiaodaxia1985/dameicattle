<template>
  <div class="order-detail-container">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
        <h2>订单详情</h2>
        <el-tag v-if="order" :type="getStatusColor(order.status)" size="large">
          {{ getStatusText(order.status) }}
        </el-tag>
      </div>
      <div class="header-right">
        <el-button @click="handleRefresh" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" @click="handleEdit" :disabled="!order || order.status !== 'pending'">
          编辑订单
        </el-button>
        <el-button type="success" @click="handleApprove" :disabled="!order || order.status !== 'pending'">
          审批订单
        </el-button>
        <el-button type="danger" @click="handleCancel" :disabled="!order || !['pending', 'approved'].includes(order.status)">
          取消订单
        </el-button>
      </div>
    </div>

    <div v-loading="loading">
      <div v-if="order" class="order-detail">
        <!-- 基本信息 -->
        <el-card class="detail-section">
          <template #header>
            <div class="section-header">
              <span>基本信息</span>
              <div class="header-extra">
                <el-button 
                  link 
                  @click="handleViewCustomer"
                  v-if="order.customer_id"
                >
                  查看客户详情
                </el-button>
              </div>
            </div>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="detail-item">
                <label>订单号：</label>
                <span class="order-number">{{ order.order_number }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>客户：</label>
                <span>{{ order.customer?.name || order.customer_name || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="detail-item">
                <label>基地：</label>
                <span>{{ order.base?.name || order.base_name || '-' }}</span>
              </div>
            </el-col>
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
        </el-card>

        <!-- 金额信息 -->
        <el-card class="detail-section">
          <template #header>
            <span>金额信息</span>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="detail-item">
                <label>订单总额：</label>
                <span class="amount primary">¥{{ (order.total_amount || 0).toLocaleString() }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="detail-item">
                <label>税额：</label>
                <span class="amount">¥{{ (order.tax_amount || 0).toLocaleString() }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="detail-item">
                <label>折扣：</label>
                <span class="amount">¥{{ (order.discount_amount || 0).toLocaleString() }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="detail-item">
                <label>付款状态：</label>
                <el-tag :type="getPaymentStatusColor(order.payment_status)">
                  {{ getPaymentStatusText(order.payment_status) }}
                </el-tag>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 订单明细 -->
        <el-card class="detail-section" v-if="order.items && order.items.length > 0">
          <template #header>
            <div class="section-header">
              <span>订单明细</span>
              <span class="item-count">共 {{ order.items.length }} 项</span>
            </div>
          </template>
          
          <el-table :data="order.items" stripe>
            <el-table-column prop="itemType" label="类型" width="80">
              <template #default="{ row }">
                <el-tag size="small" :type="getItemTypeColor(row.itemType)">
                  {{ getItemTypeText(row.itemType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="商品信息" min-width="200">
              <template #default="{ row }">
                <div v-if="row.itemType === 'cattle'" class="item-info">
                  <div class="item-name">耳标：{{ row.ear_tag || '-' }}</div>
                  <div class="item-spec">品种：{{ row.breed || '-' }}</div>
                  <div class="item-spec">重量：{{ row.weight || '-' }}kg</div>
                </div>
                <div v-else-if="row.itemType === 'material'" class="item-info">
                  <div class="item-name">{{ row.material_name || '-' }}</div>
                  <div class="item-spec">规格：{{ row.specification || '-' }}</div>
                </div>
                <div v-else-if="row.itemType === 'equipment'" class="item-info">
                  <div class="item-name">{{ row.equipment_name || '-' }}</div>
                  <div class="item-spec">规格：{{ row.specification || '-' }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="100" align="center" />
            <el-table-column prop="unit_price" label="单价" width="120" align="right">
              <template #default="{ row }">
                ¥{{ (row.unit_price || 0).toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="total_price" label="小计" width="120" align="right">
              <template #default="{ row }">
                <span class="amount">¥{{ (row.total_price || 0).toLocaleString() }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="delivered" label="交付状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.delivered ? 'success' : 'warning'" size="small">
                  {{ row.delivered ? '已交付' : '未交付' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="120">
              <template #default="{ row }">
                {{ row.notes || '-' }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 物流信息 -->
        <el-card class="detail-section" v-if="order.logistics_company || order.tracking_number">
          <template #header>
            <span>物流信息</span>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>物流公司：</label>
                <span>{{ order.logistics_company || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>物流单号：</label>
                <span class="tracking-number">{{ order.tracking_number || '-' }}</span>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 其他信息 -->
        <el-card class="detail-section">
          <template #header>
            <span>其他信息</span>
          </template>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>合同编号：</label>
                <span>{{ order.contract_number || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>付款方式：</label>
                <span>{{ order.payment_method || '-' }}</span>
              </div>
            </el-col>
            <el-col :span="24" v-if="order.remark">
              <div class="detail-item">
                <label>备注：</label>
                <div class="remark-content">{{ order.remark }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <!-- 操作记录 -->
        <el-card class="detail-section">
          <template #header>
            <span>操作记录</span>
          </template>
          
          <el-timeline>
            <el-timeline-item 
              timestamp="创建订单" 
              :time="formatDateTime(order.created_at)"
              type="primary"
            >
              <div class="timeline-content">
                <div>创建人：{{ order.creator?.real_name || order.created_by_name || '-' }}</div>
                <div>创建时间：{{ formatDateTime(order.created_at) }}</div>
              </div>
            </el-timeline-item>
            
            <el-timeline-item 
              v-if="order.approved_at"
              timestamp="审批订单" 
              :time="formatDateTime(order.approved_at)"
              type="success"
            >
              <div class="timeline-content">
                <div>审批人：{{ order.approver?.real_name || order.approved_by_name || '-' }}</div>
                <div>审批时间：{{ formatDateTime(order.approved_at) }}</div>
              </div>
            </el-timeline-item>
            
            <el-timeline-item 
              v-if="order.actual_delivery_date"
              timestamp="订单交付" 
              :time="formatDateTime(order.actual_delivery_date)"
              type="success"
            >
              <div class="timeline-content">
                <div>交付时间：{{ formatDateTime(order.actual_delivery_date) }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </div>
      
      <div v-else-if="!loading" class="empty-state">
        <el-empty description="订单不存在或已被删除">
          <el-button type="primary" @click="goBack">返回订单列表</el-button>
        </el-empty>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import { useSalesStore } from '@/stores/sales'
import type { SalesOrder } from '@/api/sales'

const router = useRouter()
const route = useRoute()
const salesStore = useSalesStore()

const loading = ref(false)
const order = ref<SalesOrder | null>(null)
const orderId = Number(route.params.id)

// 从销售store获取订单数据
const fetchOrderData = async () => {
  if (!orderId || isNaN(orderId)) {
    ElMessage.error('无效的订单ID')
    return
  }

  try {
    loading.value = true
    console.log('🔍 获取订单详情:', orderId)
    
    // 优先使用缓存，如果没有则从API获取
    const orderData = await salesStore.getOrderById(orderId)
    order.value = orderData
    
    console.log('✅ 订单详情获取成功:', orderData)
  } catch (error) {
    console.error('❌ 获取订单详情失败:', error)
    ElMessage.error('获取订单详情失败')
  } finally {
    loading.value = false
  }
}

const handleRefresh = async () => {
  await salesStore.getOrderById(orderId, true) // Force refresh
  await fetchOrderData()
}

const goBack = () => router.push('/admin/sales/orders')

const handleEdit = () => {
  if (order.value) {
    router.push(`/admin/sales/orders/${order.value.id}/edit`)
  }
}

const handleViewCustomer = () => {
  if (order.value?.customer_id) {
    router.push(`/admin/sales/customers/${order.value.customer_id}`)
  }
}

const handleApprove = async () => {
  if (!order.value) return
  
  try {
    await ElMessageBox.confirm('确定要审批这个订单吗？审批后牛只将被标记为已售出。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const updatedOrder = await salesStore.approveOrder(order.value.id)
    order.value = updatedOrder
  } catch (error) {
    if (error !== 'cancel') {
      console.error('审批失败:', error)
    }
  }
}

const handleCancel = async () => {
  if (!order.value) return
  
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入取消原因', '取消订单', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPlaceholder: '请输入取消原因'
    })
    
    const updatedOrder = await salesStore.cancelOrder(order.value.id, reason || '用户取消')
    order.value = updatedOrder
  } catch (error) {
    if (error !== 'cancel') {
      console.error('取消失败:', error)
    }
  }
}

// 状态和类型转换方法
const getStatusText = (status?: string) => {
  const statusMap: Record<string, string> = {
    pending: '待审批',
    approved: '已审批',
    delivered: '已交付',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status || ''] || status || '-'
}

const getStatusColor = (status?: string): "success" | "primary" | "warning" | "info" | "danger" => {
  const colorMap: Record<string, "success" | "primary" | "warning" | "info" | "danger"> = {
    pending: 'warning',
    approved: 'primary',
    delivered: 'info',
    completed: 'success',
    cancelled: 'danger'
  }
  return colorMap[status || ''] || 'info'
}

const getPaymentStatusText = (status?: string) => {
  const statusMap: Record<string, string> = {
    unpaid: '未付款',
    partial: '部分付款',
    paid: '已付款'
  }
  return statusMap[status || ''] || status || '-'
}

const getPaymentStatusColor = (status?: string): "success" | "primary" | "warning" | "info" | "danger" => {
  const colorMap: Record<string, "success" | "primary" | "warning" | "info" | "danger"> = {
    unpaid: 'danger',
    partial: 'warning',
    paid: 'success'
  }
  return colorMap[status || ''] || 'info'
}

const getItemTypeText = (type?: string) => {
  const typeMap: Record<string, string> = {
    cattle: '牛只',
    material: '物料',
    equipment: '设备'
  }
  return typeMap[type || ''] || type || '-'
}

const getItemTypeColor = (type?: string): "success" | "primary" | "warning" | "info" | "danger" => {
  const colorMap: Record<string, "success" | "primary" | "warning" | "info" | "danger"> = {
    cattle: 'success',
    material: 'primary',
    equipment: 'warning'
  }
  return colorMap[type || ''] || 'info'
}

const formatDate = (dateString?: string) => {
  return dateString ? new Date(dateString).toLocaleDateString('zh-CN') : '-'
}

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return `${date.toLocaleDateString('zh-CN')} ${date.toLocaleTimeString('zh-CN')}`
}

// 生命周期
onMounted(async () => {
  await fetchOrderData()
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

.header-extra {
  display: flex;
  gap: 10px;
}

.item-count {
  color: #909399;
  font-size: 14px;
}

.detail-item {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
}

.detail-item label {
  font-weight: 600;
  color: #606266;
  min-width: 100px;
  margin-right: 10px;
}

.order-number {
  font-family: 'Courier New', monospace;
  font-weight: bold;
  color: #409eff;
}

.amount {
  font-weight: bold;
  color: #e6a23c;
}

.amount.primary {
  color: #409eff;
  font-size: 18px;
}

.tracking-number {
  font-family: 'Courier New', monospace;
  color: #409eff;
}

.remark-content {
  background: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  margin-top: 5px;
  line-height: 1.6;
}

.item-info {
  line-height: 1.5;
}

.item-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.item-spec {
  color: #606266;
  font-size: 13px;
  margin-bottom: 2px;
}

.timeline-content {
  line-height: 1.6;
}

.timeline-content > div {
  margin-bottom: 4px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-state {
  padding: 20px;
}
</style>