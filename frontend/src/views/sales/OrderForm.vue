<template>
  <div class="order-form-container">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
        <h2>{{ isEdit ? '编辑订单' : '新建订单' }}</h2>
      </div>
      <div class="header-right">
        <el-button @click="handleSave" type="primary" :loading="submitting">
          {{ isEdit ? '更新订单' : '创建订单' }}
        </el-button>
      </div>
    </div>

    <div v-loading="loading">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        class="order-form"
      >
        <el-card class="form-section">
          <template #header>基本信息</template>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="订单号" prop="order_number">
                <el-input v-model="formData.order_number" :disabled="isEdit" placeholder="系统自动生成" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="客户" prop="customer_id" required>
                <el-select
                  v-model="formData.customer_id"
                  placeholder="请选择客户"
                  filterable
                  clearable
                  style="width: 100%"
                >
                  <el-option
                    v-for="customer in salesStore.customers"
                    :key="customer.id"
                    :label="customer.name"
                    :value="customer.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="基地" prop="base_id" required>
                <el-select
                  v-model="formData.base_id"
                  placeholder="请选择基地"
                  filterable
                  clearable
                  style="width: 100%"
                  @change="handleBaseChange"
                >
                  <el-option
                    v-for="base in baseOptions"
                    :key="base.id"
                    :label="base.name"
                    :value="base.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="订单日期" prop="order_date" required>
                <el-date-picker
                  v-model="formData.order_date"
                  type="date"
                  placeholder="选择订单日期"
                  style="width: 100%"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预计交付日期" prop="delivery_date">
                <el-date-picker
                  v-model="formData.delivery_date"
                  type="date"
                  placeholder="选择预计交付日期"
                  style="width: 100%"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="付款方式" prop="payment_method">
                <el-select v-model="formData.payment_method" placeholder="请选择付款方式" style="width: 100%">
                  <el-option label="现金" value="cash" />
                  <el-option label="银行转账" value="bank_transfer" />
                  <el-option label="支票" value="check" />
                  <el-option label="信用卡" value="credit_card" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="合同编号" prop="contract_number">
                <el-input v-model="formData.contract_number" placeholder="请输入合同编号" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="form-section">
          <template #header>
            <div class="section-header">
              <span>订单明细</span>
              <el-button type="primary" size="small" @click="handleAddItem">
                <el-icon><Plus /></el-icon>
                添加商品
              </el-button>
            </div>
          </template>

          <el-table :data="formData.items" border>
            <el-table-column label="商品类型" width="120">
              <template #default="{ row, $index }">
                <el-select v-model="row.itemType" placeholder="选择类型" @change="handleItemTypeChange(row, $index)">
                  <el-option label="牛只" value="cattle" />
                  <el-option label="物料" value="material" />
                  <el-option label="设备" value="equipment" />
                </el-select>
              </template>
            </el-table-column>
            
            <el-table-column label="商品信息" min-width="200">
              <template #default="{ row }">
                <div v-if="row.itemType === 'cattle'">
                  <el-select 
                    v-model="row.cattle_id" 
                    placeholder="选择牛只" 
                    size="small" 
                    filterable
                    style="width: 100%; margin-bottom: 5px;"
                    @change="handleCattleSelect(row)"
                  >
                    <el-option
                      v-for="cattle in cattleOptions"
                      :key="cattle.id"
                      :label="`${cattle.ear_tag} - ${cattle.breed || '未知品种'}`"
                      :value="cattle.id"
                    />
                  </el-select>
                  <div v-if="row.cattle_id" style="font-size: 12px; color: #666;">
                    品种: {{ row.breed || '-' }} | 重量: {{ row.weight || '-' }}kg
                  </div>
                </div>
                <div v-else-if="row.itemType === 'material'">
                  <el-input v-model="row.material_name" placeholder="物料名称" size="small" style="margin-bottom: 5px;" />
                  <el-input v-model="row.specification" placeholder="规格" size="small" />
                </div>
                <div v-else-if="row.itemType === 'equipment'">
                  <el-input v-model="row.equipment_name" placeholder="设备名称" size="small" style="margin-bottom: 5px;" />
                  <el-input v-model="row.specification" placeholder="规格" size="small" />
                </div>
              </template>
            </el-table-column>

            <el-table-column label="数量" width="100">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.quantity"
                  :min="1"
                  :precision="2"
                  size="small"
                  @change="calculateItemTotal(row)"
                />
              </template>
            </el-table-column>

            <el-table-column label="单价" width="120">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.unit_price"
                  :min="0"
                  :precision="2"
                  size="small"
                  @change="calculateItemTotal(row)"
                />
              </template>
            </el-table-column>

            <el-table-column label="小计" width="120">
              <template #default="{ row }">
                <span class="amount">¥{{ (row.total_price || 0).toLocaleString() }}</span>
              </template>
            </el-table-column>

            <el-table-column label="备注" width="150">
              <template #default="{ row }">
                <el-input v-model="row.notes" placeholder="备注" size="small" />
              </template>
            </el-table-column>

            <el-table-column label="操作" width="80">
              <template #default="{ $index }">
                <el-button type="danger" size="small" @click="handleRemoveItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="formData.items.length === 0" class="empty-items">
            <el-empty description="暂无商品，请添加商品" />
          </div>
        </el-card>

        <el-card class="form-section">
          <template #header>金额信息</template>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="商品总额">
                <el-input :value="`¥${subtotal.toLocaleString()}`" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="税额" prop="tax_amount">
                <el-input-number
                  v-model="formData.tax_amount"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  @change="calculateTotal"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="折扣金额" prop="discount_amount">
                <el-input-number
                  v-model="formData.discount_amount"
                  :min="0"
                  :precision="2"
                  style="width: 100%"
                  @change="calculateTotal"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="订单总额">
                <el-input :value="`¥${formData.total_amount.toLocaleString()}`" disabled class="total-amount" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="form-section">
          <template #header>其他信息</template>
          
          <el-form-item label="备注" prop="remark">
            <el-input
              v-model="formData.remark"
              type="textarea"
              :rows="4"
              placeholder="请输入备注信息"
            />
          </el-form-item>
        </el-card>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus } from '@element-plus/icons-vue'
import { useSalesStore } from '@/stores/sales'
import type { SalesOrder, SalesOrderItem } from '@/api/sales'

const router = useRouter()
const route = useRoute()
const salesStore = useSalesStore()

const formRef = ref()
const loading = ref(false)
const submitting = ref(false)

const orderId = route.params.id ? Number(route.params.id) : null
const isEdit = computed(() => !!orderId)

// 表单数据
const formData = reactive({
  order_number: '',
  customer_id: null as number | null,
  base_id: null as number | null,
  order_date: '',
  delivery_date: '',
  payment_method: '',
  contract_number: '',
  total_amount: 0,
  tax_amount: 0,
  discount_amount: 0,
  remark: '',
  items: [] as SalesOrderItem[]
})

// 选项数据
const baseOptions = ref<any[]>([])
const cattleOptions = ref<any[]>([])

// 表单验证规则
const formRules = {
  customer_id: [
    { required: true, message: '请选择客户', trigger: 'change' }
  ],
  base_id: [
    { required: true, message: '请选择基地', trigger: 'change' }
  ],
  order_date: [
    { required: true, message: '请选择订单日期', trigger: 'change' }
  ]
}

// 计算商品小计总额
const subtotal = computed(() => {
  return formData.items.reduce((sum, item) => sum + (item.total_price || 0), 0)
})

// 方法
const goBack = () => {
  router.push('/admin/sales/orders')
}

const handleAddItem = () => {
  formData.items.push({
    id: 0,
    itemType: 'cattle',
    quantity: 1,
    unit_price: 0,
    total_price: 0
  } as SalesOrderItem)
}

const handleRemoveItem = (index: number) => {
  formData.items.splice(index, 1)
  calculateTotal()
}

const handleItemTypeChange = (row: SalesOrderItem, index: number) => {
  // 清空相关字段
  const newItem = {
    ...row,
    cattle_id: undefined,
    ear_tag: '',
    breed: '',
    weight: undefined,
    material_id: undefined,
    material_name: '',
    material_unit: '',
    equipment_id: undefined,
    equipment_name: '',
    equipment_unit: '',
    specification: ''
  }
  formData.items[index] = newItem
}

const calculateItemTotal = (item: SalesOrderItem) => {
  item.total_price = (item.quantity || 0) * (item.unit_price || 0)
  calculateTotal()
}

const calculateTotal = () => {
  const itemsTotal = subtotal.value
  const tax = formData.tax_amount || 0
  const discount = formData.discount_amount || 0
  formData.total_amount = itemsTotal + tax - discount
}

const handleBaseChange = async (baseId: number) => {
  if (baseId) {
    // 当基地改变时，重新加载该基地的牛只列表
    try {
      const response = await salesStore.getCattle({ base_id: baseId })
      cattleOptions.value = response.data || []
      console.log('✅ 基地牛只列表加载成功:', cattleOptions.value)
    } catch (error) {
      console.error('❌ 加载基地牛只失败:', error)
      cattleOptions.value = []
    }
  } else {
    cattleOptions.value = []
  }
}

const handleCattleSelect = (row: SalesOrderItem) => {
  if (row.cattle_id) {
    // 从牛只选项中找到选中的牛只，填充相关信息
    const selectedCattle = cattleOptions.value.find(cattle => cattle.id === row.cattle_id)
    if (selectedCattle) {
      row.ear_tag = selectedCattle.ear_tag
      row.breed = selectedCattle.breed
      row.weight = selectedCattle.weight
      // 可以根据牛只信息设置默认单价
      if (!row.unit_price && selectedCattle.estimated_price) {
        row.unit_price = selectedCattle.estimated_price
        calculateItemTotal(row)
      }
    }
  }
}

const loadBases = async () => {
  try {
    const response = await salesStore.getBases()
    baseOptions.value = response.data || []
    console.log('✅ 基地列表加载成功:', baseOptions.value)
    
    // 如果只有一个基地，自动选择
    if (baseOptions.value.length === 1) {
      formData.base_id = baseOptions.value[0].id
      await handleBaseChange(formData.base_id)
    }
  } catch (error) {
    console.error('❌ 加载基地列表失败:', error)
    ElMessage.error('加载基地列表失败')
  }
}

const loadOrderData = async () => {
  if (!orderId) return

  try {
    loading.value = true
    const orderData = await salesStore.getOrderById(orderId)
    
    // 填充表单数据
    Object.assign(formData, {
      order_number: orderData.order_number,
      customer_id: orderData.customer_id,
      order_date: orderData.order_date,
      delivery_date: orderData.delivery_date,
      payment_method: orderData.payment_method,
      contract_number: orderData.contract_number,
      total_amount: orderData.total_amount,
      tax_amount: orderData.tax_amount,
      discount_amount: orderData.discount_amount,
      remark: orderData.remark,
      items: orderData.items || []
    })
    
    console.log('✅ 订单数据加载成功:', orderData)
  } catch (error) {
    console.error('❌ 加载订单数据失败:', error)
    ElMessage.error('加载订单数据失败')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  try {
    await formRef.value.validate()
    
    if (formData.items.length === 0) {
      ElMessage.error('请至少添加一个商品')
      return
    }

    submitting.value = true

    const orderData = {
      ...formData,
      customer_id: formData.customer_id,
      order_date: formData.order_date,
      delivery_date: formData.delivery_date || null,
      items: formData.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price)
      }))
    }

    if (isEdit.value && orderId) {
      await salesStore.updateOrder(orderId, orderData)
      ElMessage.success('订单更新成功')
    } else {
      await salesStore.createOrder(orderData)
      ElMessage.success('订单创建成功')
    }

    goBack()
  } catch (error) {
    console.error('保存订单失败:', error)
  } finally {
    submitting.value = false
  }
}

// 生命周期
onMounted(async () => {
  // 加载基础数据
  await Promise.all([
    salesStore.fetchCustomers(),
    loadBases()
  ])
  
  // 如果是编辑模式，加载订单数据
  if (isEdit.value) {
    await loadOrderData()
  } else {
    // 新建模式，设置默认值
    formData.order_date = new Date().toISOString().split('T')[0]
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

.form-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount {
  font-weight: bold;
  color: #e6a23c;
}

.total-amount :deep(.el-input__inner) {
  font-weight: bold;
  color: #409eff;
  font-size: 16px;
}

.empty-items {
  padding: 40px 0;
  text-align: center;
}

.order-form :deep(.el-form-item__label) {
  font-weight: 600;
}
</style>