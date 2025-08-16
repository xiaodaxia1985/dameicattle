<template>
  <div class="order-form-container">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
        <h2>{{ isEdit ? '编辑订单' : '新建订单' }}</h2>
      </div>
      <div class="header-right">
        <el-button @click="goBack">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </div>

    <el-card class="form-card">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        size="large"
      >
        <div class="form-section">
          <h3>基本信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="客户" prop="customerId">
                <el-select v-model="form.customerId" placeholder="请选择客户" filterable>
                  <el-option 
                    v-for="customer in customerOptions" 
                    :key="customer.id" 
                    :label="customer.name" 
                    :value="customer.id" 
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="基地" prop="baseId">
                <el-select v-model="form.baseId" placeholder="请选择基地">
                  <el-option label="主基地" :value="1" />
                  <el-option label="分基地A" :value="2" />
                  <el-option label="分基地B" :value="3" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="订单日期" prop="orderDate">
                <el-date-picker
                  v-model="form.orderDate"
                  type="date"
                  placeholder="请选择订单日期"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预计交付日期">
                <el-date-picker
                  v-model="form.expectedDeliveryDate"
                  type="date"
                  placeholder="请选择预计交付日期"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <h3>付款信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="付款方式">
                <el-select v-model="form.paymentMethod" placeholder="请选择付款方式">
                  <el-option label="现金" value="cash" />
                  <el-option label="银行转账" value="transfer" />
                  <el-option label="支票" value="check" />
                  <el-option label="信用证" value="credit" />
                  <el-option label="月结" value="monthly" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="税费">
                <el-input-number 
                  v-model="form.taxAmount" 
                  :min="0" 
                  :precision="2"
                  placeholder="请输入税费"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="折扣金额">
                <el-input-number 
                  v-model="form.discountAmount" 
                  :min="0" 
                  :precision="2"
                  placeholder="请输入折扣金额"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="合同编号">
                <el-input v-model="form.contractNumber" placeholder="请输入合同编号" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <div class="form-section">
          <h3>物流信息</h3>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="物流公司">
                <el-input v-model="form.logisticsCompany" placeholder="请输入物流公司" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="运单号">
                <el-input v-model="form.trackingNumber" placeholder="请输入运单号" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="备注">
            <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
          </el-form-item>
        </div>

        <div class="form-section">
          <h3>订单明细</h3>
          <div class="items-header">
            <el-button type="primary" @click="handleAddItem">添加明细</el-button>
          </div>
          <el-table :data="form.items" border style="margin-top: 16px;">
            <el-table-column label="商品类型" width="100">
              <template #default="{ row }">
                <el-select v-model="row.itemType" placeholder="请选择类型">
                  <el-option v-for="opt in itemTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="明细" min-width="200">
              <template #default="{ row }">
                <template v-if="row.itemType === 'cattle'">
                  <el-input v-model="row.earTag" placeholder="耳标号" style="width: 100px;" />
                  <el-input v-model="row.breed" placeholder="品种" style="width: 100px; margin-left: 8px;" />
                  <el-input-number v-model="row.weight" placeholder="体重(kg)" :min="1" :precision="2" style="width: 100px; margin-left: 8px;" />
                </template>
                <template v-else-if="row.itemType === 'material'">
                  <el-input v-model="row.materialName" placeholder="物资名称" style="width: 120px;" />
                  <el-input v-model="row.materialUnit" placeholder="单位" style="width: 80px; margin-left: 8px;" />
                </template>
                <template v-else-if="row.itemType === 'equipment'">
                  <el-input v-model="row.equipmentName" placeholder="设备名称" style="width: 120px;" />
                  <el-input v-model="row.equipmentUnit" placeholder="单位" style="width: 80px; margin-left: 8px;" />
                  <el-input v-model="row.specification" placeholder="规格型号" style="width: 120px; margin-left: 8px;" />
                </template>
              </template>
            </el-table-column>
            <el-table-column label="数量" width="100">
              <template #default="{ row }">
                <el-input-number v-model="row.quantity" :min="1" :precision="2" />
              </template>
            </el-table-column>
            <el-table-column label="单价(元)" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.unitPrice" :min="0" :precision="2" @change="calculateItemTotal(row)" />
              </template>
            </el-table-column>
            <el-table-column label="小计" width="120">
              <template #default="{ row }">
                ¥{{ (row.totalPrice || 0).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="150">
              <template #default="{ row }">
                <el-input v-model="row.remark" placeholder="备注" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row, $index }">
                <el-button size="small" type="danger" @click="handleRemoveItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="form.items.length === 0" class="empty-items">
            <el-empty description="请添加订单明细" />
          </div>
          <div class="order-summary">
            <div class="summary-item">
              <label>明细小计：</label>
              <span>¥{{ subtotal.toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <label>税费：</label>
              <span>¥{{ form.taxAmount.toFixed(2) }}</span>
            </div>
            <div class="summary-item">
              <label>折扣：</label>
              <span>-¥{{ form.discountAmount.toFixed(2) }}</span>
            </div>
            <div class="summary-item total">
              <label>订单合计：</label>
              <span>¥{{ totalAmount.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { salesApi } from '@/api/sales'
import { safeApiCall, withFormErrorHandler } from '@/utils/errorHandler'
import { ensureNumber, ensureArray } from '@/utils/dataValidation'
import { withAuth } from '@/utils/authGuard'

const router = useRouter()
const route = useRoute()

// 响应式数据
const submitting = ref(false)
const isEdit = ref(false)
const formRef = ref()
const customerOptions = ref<any[]>([])

// 表单数据
const form = reactive({
  id: null as number | null,
  customerId: undefined as number | undefined,
  customerName: '',
  baseId: 1,
  baseName: '主基地',
  orderDate: '',
  expectedDeliveryDate: '',
  paymentMethod: '',
  contractNumber: '',
  logisticsCompany: '',
  trackingNumber: '',
  remark: '',
  taxAmount: 0,
  discountAmount: 0,
  items: [] as any[]
})

// 表单验证规则
const rules = {
  customerId: [{ required: true, message: '请选择客户', trigger: 'change' }],
  baseId: [{ required: true, message: '请选择基地', trigger: 'change' }],
  orderDate: [{ required: true, message: '请选择订单日期', trigger: 'change' }]
}

// 计算属性
const subtotal = computed(() => {
  return form.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0)
})

const totalAmount = computed(() => {
  return subtotal.value + form.taxAmount - form.discountAmount
})

// 方法
const goBack = () => {
  router.push('/admin/sales/orders')
}

const fetchCustomers = async () => {
  try {
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
      }
    })
  } catch (error) {
    console.error('❌ 获取客户选项失败:', error)
    customerOptions.value = []
  }
}

const loadOrder = async (id: number) => {
  try {
    console.log('🔍 开始加载订单信息，ID:', id)
    
    const result = await safeApiCall(
      () => salesApi.getOrder(id),
      {
        showMessage: false,
        fallbackValue: null
      }
    )
    
    console.log('📥 订单信息加载结果:', result)
    
    if (result && result.data) {
      const order = result.data
      Object.assign(form, {
        id: order.id,
        customerId: order.customer_id,
        customerName: order.customer_name || order.customerName,
        baseId: order.base_id || order.baseId || 1,
        baseName: order.base_name || order.baseName || '主基地',
        orderDate: formatDateForInput(order.order_date || order.orderDate),
        expectedDeliveryDate: formatDateForInput(order.delivery_date || order.expectedDeliveryDate),
        paymentMethod: order.payment_method || order.paymentMethod || '',
        contractNumber: order.contract_number || order.contractNumber || '',
        logisticsCompany: order.logistics_company || order.logisticsCompany || '',
        trackingNumber: order.tracking_number || order.trackingNumber || '',
        remark: order.remark || '',
        taxAmount: ensureNumber(order.tax_amount || order.taxAmount, 0),
        discountAmount: ensureNumber(order.discount_amount || order.discountAmount, 0),
        items: order.items || []
      })
      console.log('✅ 订单信息加载成功')
    } else {
      console.error('❌ 订单信息加载失败，但不立即返回')
      ElMessage.error('获取订单信息失败，请检查订单是否存在')
      // 不立即返回，让用户选择是否返回
    }
  } catch (error) {
    console.error('❌ 加载订单信息时发生错误:', error)
    ElMessage.error('获取订单信息失败')
    // 不立即返回，让用户选择是否返回
  }
}

const formatDateForInput = (dateString?: string) => {
  if (!dateString) return ''
  return new Date(dateString).toISOString().split('T')[0]
}

const itemTypeOptions = [
  { label: '牛只', value: 'cattle' },
  { label: '物资', value: 'material' },
  { label: '设备', value: 'equipment' }
]

const handleAddItem = () => {
  form.items.push({
    itemType: 'cattle', // 默认牛只
    cattleId: null,
    materialId: null,
    equipmentId: null,
    earTag: '',
    breed: '',
    materialName: '',
    equipmentName: '',
    weight: 0,
    unitPrice: 0,
    quantity: 1,
    totalPrice: 0,
    qualityGrade: 'A',
    healthCertificate: '',
    quarantineCertificate: '',
    remark: ''
  })
}

const calculateItemTotal = (item: any) => {
  if (item.itemType === 'cattle') {
    item.totalPrice = ensureNumber(item.weight, 1) * ensureNumber(item.unitPrice, 0) * ensureNumber(item.quantity, 1)
  } else if (item.itemType === 'material' || item.itemType === 'equipment') {
    item.totalPrice = ensureNumber(item.unitPrice, 0) * ensureNumber(item.quantity, 1)
  } else {
    item.totalPrice = 0
  }
}

const validateItem = (item: any): string[] => {
  const errors: string[] = []
  if (!item.itemType) errors.push('请选择商品类型')
  if (item.itemType === 'cattle') {
    if (!item.earTag) errors.push('牛只需填写耳标号')
    if (!item.breed) errors.push('牛只需填写品种')
    if (!item.weight || item.weight <= 0) errors.push('牛只需填写有效体重')
  } else if (item.itemType === 'material') {
    if (!item.materialName) errors.push('物资需填写名称')
  } else if (item.itemType === 'equipment') {
    if (!item.equipmentName) errors.push('设备需填写名称')
  }
  if (!item.unitPrice || item.unitPrice < 0) errors.push('请填写有效单价')
  if (!item.quantity || item.quantity <= 0) errors.push('请填写有效数量')
  return errors
}

const handleRemoveItem = async (index: number) => {
  const confirm = await ElMessageBox.confirm('确定要删除该订单明细吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).catch(() => false)
  if (confirm !== 'cancel') {
    form.items.splice(index, 1)
  }
}

const getCurrentUserId = () => {
  // 假设有全局 userStore 或 authStore
  // 可根据实际项目结构调整
  return window.userStore?.user?.id || 1;
}

const handleSubmit = withFormErrorHandler(async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  if (form.items.length === 0) {
    ElMessage.error('请添加至少一个订单明细')
    return
  }
  // 校验所有明细
  for (const [i, item] of form.items.entries()) {
    const errors = validateItem(item)
    if (errors.length > 0) {
      ElMessage.error(`第${i + 1}条明细有错误：${errors.join('，')}`)
      return
    }
  }
  submitting.value = true
  try {
    const orderData = {
      ...form,
      customerName: customerOptions.value.find(c => c.id === form.customerId)?.name || form.customerName,
      baseName: form.baseName,
      createdBy: getCurrentUserId(),
      items: form.items.map(item => {
        if (item.itemType === 'cattle') {
          return {
            itemType: 'cattle',
            earTag: item.earTag,
            breed: item.breed,
            weight: item.weight,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            qualityGrade: item.qualityGrade,
            healthCertificate: item.healthCertificate,
            quarantineCertificate: item.quarantineCertificate,
            remark: item.remark
          }
        } else if (item.itemType === 'material') {
          return {
            itemType: 'material',
            materialName: item.materialName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            remark: item.remark
          }
        } else if (item.itemType === 'equipment') {
          return {
            itemType: 'equipment',
            equipmentName: item.equipmentName,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            remark: item.remark
          }
        }
        return {}
      })
    }
    if (isEdit.value) {
      const result = await safeApiCall(
        () => salesApi.updateOrder(ensureNumber(form.id, 0), orderData),
        {
          showMessage: false,
          fallbackValue: null
        }
      )
      if (result !== null) {
        ElMessage.success('更新成功')
        goBack()
      }
    } else {
      const result = await safeApiCall(
        () => salesApi.createOrder(orderData),
        {
          showMessage: false,
          fallbackValue: null
        }
      )
      if (result !== null) {
        ElMessage.success('创建成功')
        goBack()
      }
    }
  } finally {
    submitting.value = false
  }
}, '', '操作失败')

// 生命周期
onMounted(() => {
  const id = route.params.id as string
  
  fetchCustomers()
  
  if (id && id !== 'new') {
    isEdit.value = true
    loadOrder(Number(id))
  } else {
    // 新建订单，设置默认日期
    form.orderDate = new Date().toISOString().split('T')[0]
  }
})
</script>

<style scoped>
.order-form-container {
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

.form-card {
  margin-bottom: 20px;
}

.form-section {
  margin-bottom: 40px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section h3 {
  margin: 0 0 20px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 2px solid #409eff;
  padding-bottom: 8px;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-items {
  padding: 40px 0;
}

.order-summary {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.summary-item.total {
  font-size: 18px;
  font-weight: bold;
  color: #e6a23c;
}

.summary-item label {
  font-weight: 600;
  color: #606266;
}

.el-form-item {
  margin-bottom: 24px;
}
</style>