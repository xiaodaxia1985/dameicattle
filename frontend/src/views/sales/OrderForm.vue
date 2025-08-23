<template>
  <div class="order-form-container">
    <div class="page-header">
      <div class="header-left">
        <el-button @click="goBack" icon="ArrowLeft">返回</el-button>
        <h2>{{ isEdit ? '编辑订单' : '新建订单' }}</h2>
      </div>
      <div class="header-right">
        <el-button @click="handleSave" type="primary" :loading="submitting" :disabled="initializationError">
          {{ isEdit ? '更新订单' : '创建订单' }}
        </el-button>
      </div>
    </div>

    <!-- 错误状态 -->
    <el-alert
      v-if="initializationError"
      title="页面初始化失败"
      type="error"
      description="无法加载订单表单数据，请检查网络连接或刷新页面重试"
      show-icon
      style="margin-bottom: 20px"
    >
      <template #default>
        <div style="margin-top: 10px;">
          <el-button type="primary" @click="retryInitialization">重试加载</el-button>
        </div>
      </template>
    </el-alert>

    <div v-loading="loading" v-if="!initializationError || isComponentMounted">
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
                  :loading="salesStore.customersLoading"
                  :disabled="salesStore.customers.length === 0"
                >
                  <el-option
                    v-for="customer in salesStore.customers"
                    :key="customer.id"
                    :label="customer.name"
                    :value="customer.id"
                  />
                  <!-- 客户数据为空时的提示 -->
                  <template v-if="salesStore.customers.length === 0 && !salesStore.customersLoading">
                    <el-option label="暂无客户数据，请先添加客户" value="" disabled />
                  </template>
                </el-select>
                <!-- 显示客户数据加载状态 -->
                <div v-if="salesStore.customersLoading" style="font-size: 12px; color: #999; margin-top: 4px;">
                  🔄 正在加载客户数据...
                </div>
                <div v-else-if="salesStore.customers.length === 0" style="font-size: 12px; color: #f56c6c; margin-top: 4px;">
                  ⚠️ 暂无客户数据，请检查网络或联系管理员
                  <el-button type="text" size="small" @click="retryLoadCustomers">重试加载</el-button>
                </div>
                <div v-else style="font-size: 12px; color: #67c23a; margin-top: 4px;">
                  ✅ 已加载 {{ salesStore.customers.length }} 个客户
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="基地" prop="base_id" required>
                <!-- 管理员用户显示选择器 -->
                <el-select
                  v-if="isAdminUser"
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
                <!-- 普通用户显示只读基地信息 -->
                <el-input
                  v-else
                  :value="userBaseName"
                  disabled
                  placeholder="自动绑定到用户所属基地"
                  style="width: 100%"
                >
                  <template #suffix>
                    <el-tooltip content="普通用户订单将自动绑定到所属基地" placement="top">
                      <el-icon><InfoFilled /></el-icon>
                    </el-tooltip>
                  </template>
                </el-input>
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
                  <el-select 
                    v-model="row.material_id" 
                    placeholder="选择物资" 
                    size="small" 
                    filterable
                    style="width: 100%; margin-bottom: 5px;"
                    @change="handleMaterialSelect(row)"
                  >
                    <el-option
                      v-for="material in materialOptions"
                      :key="material.id"
                      :label="`${material.name} - ${material.specification || '无规格'}`"
                      :value="material.id"
                    />
                  </el-select>
                  <div v-if="row.material_id" style="font-size: 12px; color: #666;">
                    类别: {{ row.material_category || '-' }} | 单位: {{ row.material_unit || '-' }}
                  </div>
                </div>
                <div v-else-if="row.itemType === 'equipment'">
                  <el-select 
                    v-model="row.equipment_id" 
                    placeholder="选择设备" 
                    size="small" 
                    filterable
                    style="width: 100%; margin-bottom: 5px;"
                    @change="handleEquipmentSelect(row)"
                  >
                    <el-option
                      v-for="equipment in equipmentOptions"
                      :key="equipment.id"
                      :label="`${equipment.name} - ${equipment.model || equipment.specification || '无型号'}`"
                      :value="equipment.id"
                    />
                  </el-select>
                  <div v-if="row.equipment_id" style="font-size: 12px; color: #666;">
                    类别: {{ row.equipment_category || '-' }} | 状态: {{ getEquipmentStatusText(row.equipment_status) || '-' }}
                  </div>
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
import { ref, reactive, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus, InfoFilled } from '@element-plus/icons-vue'
import { useSalesStore } from '@/stores/sales'
import { useAuthStore } from '@/stores/auth'
import type { SalesOrder, SalesOrderItem } from '@/api/sales'

const router = useRouter()
const route = useRoute()
const salesStore = useSalesStore()
const authStore = useAuthStore()

const formRef = ref()
const loading = ref(false)
const submitting = ref(false)

// 组件状态管理
const isComponentMounted = ref(false)
const initializationError = ref(false)

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
const materialOptions = ref<any[]>([])
const equipmentOptions = ref<any[]>([])

// 表单验证规则
const formRules = computed(() => {
  const rules: any = {
    customer_id: [
      { required: true, message: '请选择客户', trigger: 'change' }
    ],
    order_date: [
      { required: true, message: '请选择订单日期', trigger: 'change' }
    ]
  }
  
  // 只为管理员用户添加基地验证规则
  if (isAdminUser.value) {
    rules.base_id = [
      { required: true, message: '请选择基地', trigger: 'change' }
    ]
  }
  
  return rules
})

// 计算属性
const isAdminUser = computed(() => {
  const user = authStore.user
  return user?.role === 'admin' || user?.role === 'super_admin' || authStore.hasRole('admin') || authStore.hasRole('super_admin')
})

const userBaseName = computed(() => {
  const user = authStore.user
  if (!user || isAdminUser.value) return ''
  
  // 尝试从用户的base对象获取名称
  if (user.base?.name) {
    return user.base.name
  }
  
  // 如果没有base对象，尝试从baseOptions中根据base_id查找
  if (user.base_id && baseOptions.value.length > 0) {
    const userBase = baseOptions.value.find(base => base.id === user.base_id)
    return userBase?.name || `基地 ${user.base_id}`
  }
  
  return '未分配基地'
})

// 安全的小计计算
const subtotal = computed(() => {
  if (!isComponentMounted.value || !formData.items || !Array.isArray(formData.items)) {
    return 0
  }
  
  try {
    return formData.items.reduce((sum, item) => {
      return sum + ((item.total_price || 0))
    }, 0)
  } catch (error) {
    console.warn('⚠️ 计算小计失败:', error)
    return 0
  }
})

// 方法
const retryLoadCustomers = async () => {
  try {
    console.log('🔄 用户手动重试加载客户数据...')
    await salesStore.fetchCustomers({}, true) // 强制刷新
    if (salesStore.customers.length > 0) {
      ElMessage.success(`客户数据加载成功，共 ${salesStore.customers.length} 个客户`)
    } else {
      ElMessage.warning('客户数据仍为空，请检查数据库或联系管理员')
    }
  } catch (error) {
    console.error('❌ 重试加载客户数据失败:', error)
    ElMessage.error('加载客户数据失败，请检查网络连接')
  }
}

const retryInitialization = async () => {
  initializationError.value = false
  loading.value = true
  
  try {
    console.log('🔄 重试初始化订单表单数据...')
    
    // 重新加载基础数据
    await Promise.all([
      salesStore.fetchCustomers({}, true), // 强制刷新
      loadBases()
    ])
    
    // 如果是编辑模式，重新加载订单数据
    if (isEdit.value) {
      await loadOrderData()
    }
    
    ElMessage.success('数据重新加载成功')
  } catch (error) {
    console.error('❌ 重试初始化失败:', error)
    initializationError.value = true
    ElMessage.error('重试失败，请稍后再试')
  } finally {
    loading.value = false
  }
}

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
    // 当基地改变时，重新加载该基地的牛只、物资和设备列表
    try {
      console.log(`🔄 开始加载基地 ${baseId} 的所有资源...`)
      
      // 并发加载牛只、物资和设备数据
      const [cattleResponse, materialResponse, equipmentResponse] = await Promise.allSettled([
        salesStore.getCattle({ base_id: baseId }),
        salesStore.getMaterials({ base_id: baseId }),
        salesStore.getEquipment({ base_id: baseId })
      ])
      
      // 处理牛只数据
      if (cattleResponse.status === 'fulfilled') {
        console.log('📥 牛只API响应:', cattleResponse.value)
        
        // 处理不同的响应格式
        let cattleData = []
        if (cattleResponse.value?.data) {
          if (Array.isArray(cattleResponse.value.data)) {
            cattleData = cattleResponse.value.data
          } else if (cattleResponse.value.data.cattle && Array.isArray(cattleResponse.value.data.cattle)) {
            cattleData = cattleResponse.value.data.cattle
          } else if (cattleResponse.value.data.items && Array.isArray(cattleResponse.value.data.items)) {
            cattleData = cattleResponse.value.data.items
          }
        }
        
        cattleOptions.value = cattleData
        console.log(`✅ 基地牛只列表加载成功: ${cattleOptions.value.length} 头牛`)
        
        if (cattleOptions.value.length === 0) {
          console.warn(`⚠️ 基地 ${baseId} 没有可用牛只`)
        }
      } else {
        console.error('❌ 加载牛只失败:', cattleResponse.reason)
        cattleOptions.value = []
      }
      
      // 处理物资数据
      if (materialResponse.status === 'fulfilled') {
        console.log('📥 物资API响应:', materialResponse.value)
        
        let materialData = []
        if (materialResponse.value?.data) {
          if (Array.isArray(materialResponse.value.data)) {
            materialData = materialResponse.value.data
          } else if (materialResponse.value.data.materials && Array.isArray(materialResponse.value.data.materials)) {
            materialData = materialResponse.value.data.materials
          } else if (materialResponse.value.data.items && Array.isArray(materialResponse.value.data.items)) {
            materialData = materialResponse.value.data.items
          }
        }
        
        materialOptions.value = materialData
        console.log(`✅ 基地物资列表加载成功: ${materialOptions.value.length} 个物资`)
      } else {
        console.warn('⚠️ 加载物资失败:', materialResponse.reason)
        materialOptions.value = [] // 物资服务可能不可用，但不阻断操作
      }
      
      // 处理设备数据
      if (equipmentResponse.status === 'fulfilled') {
        console.log('📥 设备API响应:', equipmentResponse.value)
        
        let equipmentData = []
        if (equipmentResponse.value?.data) {
          if (Array.isArray(equipmentResponse.value.data)) {
            equipmentData = equipmentResponse.value.data
          } else if (equipmentResponse.value.data.equipment && Array.isArray(equipmentResponse.value.data.equipment)) {
            equipmentData = equipmentResponse.value.data.equipment
          } else if (equipmentResponse.value.data.items && Array.isArray(equipmentResponse.value.data.items)) {
            equipmentData = equipmentResponse.value.data.items
          }
        }
        
        equipmentOptions.value = equipmentData
        console.log(`✅ 基地设备列表加载成功: ${equipmentOptions.value.length} 个设备`)
      } else {
        console.warn('⚠️ 加载设备失败:', equipmentResponse.reason)
        equipmentOptions.value = [] // 设备服务可能不可用，但不阻断操作
      }
      
      // 显示加载结果统计
      const totalItems = cattleOptions.value.length + materialOptions.value.length + equipmentOptions.value.length
      if (totalItems > 0) {
        ElMessage.success(`基地资源加载成功：牛只 ${cattleOptions.value.length}头，物资 ${materialOptions.value.length}个，设备 ${equipmentOptions.value.length}个`)
      } else {
        ElMessage.info(`基地中暂无可用的牛只、物资或设备`)
      }
      
    } catch (error) {
      console.error('❌ 加载基地资源失败:', error)
      console.error('错误详情:', error.response || error.message || error)
      cattleOptions.value = []
      materialOptions.value = []
      equipmentOptions.value = []
      ElMessage.error(`加载基地资源失败: ${error.message || '未知错误'}`)
    }
  } else {
    console.log('🧹 清空所有选项列表')
    cattleOptions.value = []
    materialOptions.value = []
    equipmentOptions.value = []
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

const handleMaterialSelect = (row: SalesOrderItem) => {
  if (row.material_id) {
    // 从物资选项中找到选中的物资，填充相关信息
    const selectedMaterial = materialOptions.value.find(material => material.id === row.material_id)
    if (selectedMaterial) {
      row.material_name = selectedMaterial.name
      row.material_category = selectedMaterial.category
      row.material_unit = selectedMaterial.unit
      row.specification = selectedMaterial.specification
      // 可以根据物资信息设置默认单价
      if (!row.unit_price && selectedMaterial.unit_price) {
        row.unit_price = selectedMaterial.unit_price
        calculateItemTotal(row)
      }
    }
  }
}

const handleEquipmentSelect = (row: SalesOrderItem) => {
  if (row.equipment_id) {
    // 从设备选项中找到选中的设备，填充相关信息
    const selectedEquipment = equipmentOptions.value.find(equipment => equipment.id === row.equipment_id)
    if (selectedEquipment) {
      row.equipment_name = selectedEquipment.name
      row.equipment_category = selectedEquipment.category
      row.equipment_status = selectedEquipment.status
      row.specification = selectedEquipment.specification || selectedEquipment.model
      // 可以根据设备信息设置默认单价
      if (!row.unit_price && selectedEquipment.rental_price) {
        row.unit_price = selectedEquipment.rental_price
        calculateItemTotal(row)
      }
    }
  }
}

const getEquipmentStatusText = (status: string) => {
  const statusMap = {
    'active': '正常',
    'inactive': '停用',
    'maintenance': '维护中',
    'retired': '已退役'
  }
  return statusMap[status] || status
}

const loadBases = async () => {
  try {
    console.log('🔄 开始加载基地列表...')
    
    // 检查用户认证状态
    const currentUser = authStore.user
    const currentToken = authStore.token
    console.log('👤 当前用户信息:', {
      username: currentUser?.username,
      role: currentUser?.role,
      base_id: currentUser?.base_id,
      hasToken: !!currentToken,
      isAdminUser: isAdminUser.value,
      hasAdminRole: authStore.hasRole && authStore.hasRole('admin'),
      hasSuperAdminRole: authStore.hasRole && authStore.hasRole('super_admin')
    })
    
    const response = await salesStore.getBases()
    console.log('📥 基地API响应:', response)
    
    // 处理不同的响应格式
    let basesData = []
    if (response?.data) {
      if (Array.isArray(response.data)) {
        basesData = response.data
        console.log('✅ 从response.data直接数组提取基地数据:', basesData.length, '个基地')
      } else if (response.data.bases && Array.isArray(response.data.bases)) {
        basesData = response.data.bases
        console.log('✅ 从response.data.bases提取基地数据:', basesData.length, '个基地')
      } else if (response.data.items && Array.isArray(response.data.items)) {
        basesData = response.data.items
        console.log('✅ 从response.data.items提取基地数据:', basesData.length, '个基地')
      } else {
        console.warn('⚠️ 未识别的响应格式:', response.data)
      }
    } else {
      console.warn('⚠️ 响应中没有data字段:', response)
    }
    
    baseOptions.value = basesData
    console.log('✅ 基地列表处理结果:', baseOptions.value)
    
    // 验证基地数据有效性
    if (!Array.isArray(basesData)) {
      console.error('❌ 基地数据不是数组格式:', basesData)
      ElMessage.error('基地数据格式错误')
      return
    }
    
    if (basesData.length === 0) {
      console.warn('⚠️ 基地列表为空')
      console.warn('可能原因: 1. 权限问题 2. 数据库中没有基地数据 3. API返回格式问题')
      
      // 对管理员和普通用户显示不同的提示
      if (isAdminUser.value) {
        ElMessage.warning('没有找到任何基地，请联系系统管理员添加基地数据')
      } else {
        ElMessage.warning('未找到可用基地，请联系管理员分配基地权限')
      }
      return
    }
    
    console.log('🎯 基地数据详情:', basesData.map(base => ({ id: base.id, name: base.name })))
    console.log('📊 组件状态检查:', {
      isComponentMounted: isComponentMounted.value,
      isAdminUser: isAdminUser.value,
      baseOptionsLength: baseOptions.value.length,
      formDataBaseId: formData.base_id
    })
    
    // 根据用户角色处理基地选择
    if (isAdminUser.value) {
      console.log('👨‍💼 管理员用户，允许选择基地')
      // 管理员用户：如果只有一个基地，自动选择
      if (baseOptions.value.length === 1) {
        formData.base_id = baseOptions.value[0].id
        await handleBaseChange(formData.base_id)
        console.log('✅ 自动选择唯一基地:', baseOptions.value[0])
      } else {
        console.log('📋 管理员有多个基地可选择，等待用户手动选择')
      }
    } else {
      console.log('👤 普通用户，自动绑定所属基地')
      // 普通用户：自动绑定到用户所属基地
      const user = authStore.user
      console.log('👤 当前用户信息:', user)
      
      if (user?.base_id) {
        // 验证用户所属基地是否在基地列表中
        const userBase = basesData.find(base => base.id === user.base_id)
        if (userBase) {
          formData.base_id = user.base_id
          await handleBaseChange(formData.base_id)
          console.log(`✅ 普通用户自动绑定到基地: ${user.base_id} (${userBase.name})`)
        } else {
          console.warn(`⚠️ 用户所属基地 ${user.base_id} 不在可用基地列表中`)
          ElMessage.warning(`您的所属基地不在可用范围内，请联系管理员`)
        }
      } else {
        console.warn('⚠️ 普通用户未分配基地')
        ElMessage.warning('您未分配基地，请联系管理员')
      }
    }
  } catch (error) {
    console.error('❌ 加载基地列表失败:', error)
    console.error('错误详情:', error.response?.data || error.message || error)
    
    // 根据错误类型提供更具体的错误信息
    let errorMessage = '加载基地列表失败'
    if (error.response?.status === 401) {
      errorMessage = '用户认证失败，请重新登录'
    } else if (error.response?.status === 403) {
      errorMessage = '权限不足，无法获取基地列表'
    } else if (error.response?.status === 500) {
      errorMessage = '服务器内部错误，请稍后重试'
    } else if (error.message) {
      errorMessage = `加载失败: ${error.message}`
    }
    
    ElMessage.error(errorMessage)
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

    // 计算订单总金额（从items中计算）
    const calculatedTotalAmount = formData.items.reduce((sum, item) => {
      const itemTotal = Number(item.quantity || 0) * Number(item.unit_price || 0)
      return sum + itemTotal
    }, 0)

    const orderData = {
      ...formData,
      customer_id: Number(formData.customer_id),
      base_id: Number(formData.base_id),
      order_date: formData.order_date,
      delivery_date: formData.delivery_date || null,
      total_amount: calculatedTotalAmount, // 使用计算出的总金额
      items: formData.items.map(item => ({
        ...item,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        total_price: Number(item.quantity || 0) * Number(item.unit_price || 0)
      }))
    }
    
    console.log('📊 订单保存数据验证:')
    console.log('- customer_id:', orderData.customer_id, typeof orderData.customer_id)
    console.log('- base_id:', orderData.base_id, typeof orderData.base_id)
    console.log('- order_date:', orderData.order_date, typeof orderData.order_date)
    console.log('- total_amount:', orderData.total_amount, typeof orderData.total_amount)
    console.log('- items count:', orderData.items.length)
    console.log('- 完整订单数据:', orderData)
    
    // 为管理员用户确保基地ID已选择
    if (isAdminUser.value && !orderData.base_id) {
      ElMessage.error('请选择基地')
      return
    }
    
    // 为普通用户自动设置基地ID
    if (!isAdminUser.value) {
      const user = authStore.user
      if (!user?.base_id) {
        ElMessage.error('您未分配基地，无法创建订单，请联系管理员')
        return
      }
      orderData.base_id = user.base_id
      console.log(`🔄 普通用户订单自动绑定基地: ${user.base_id}`)
    }

    // 最终数据验证
    if (!orderData.customer_id || !orderData.base_id || !orderData.order_date) {
      ElMessage.error('请填写完整的订单信息（客户、基地、订单日期）')
      return
    }

    if (isEdit.value && orderId) {
      await salesStore.updateOrder(orderId, orderData)
      ElMessage.success('订单更新成功')
    } else {
      const result = await salesStore.createOrder(orderData)
      console.log('📝 订单创建结果:', result)
      
      // 显示成功消息，包含基地绑定信息
      if (isAdminUser.value) {
        ElMessage.success('订单创建成功')
      } else {
        ElMessage.success(`订单创建成功，已自动绑定到基地: ${userBaseName.value}`)
      }
    }

    goBack()
  } catch (error) {
    console.error('保存订单失败:', error)
    
    // 更详细的错误信息
    let errorMessage = '保存订单失败，请检查数据并重试'
    if (error && typeof error === 'object') {
      if (error.message) {
        errorMessage = error.message
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
    }
    
    ElMessage.error(errorMessage)
  } finally {
    submitting.value = false
  }
}

// 生命周期
onMounted(async () => {
  try {
    console.log('🚀 OrderForm组件开始挂载...')
    
    // 确保DOM已经渲染
    await nextTick()
    
    // 标记组件已挂载
    isComponentMounted.value = true
    
    console.log('🔄 初始化订单表单数据...')
    
    // 加载基础数据
    await Promise.all([
      salesStore.fetchCustomers().then(() => {
        console.log('✅ 客户数据加载结果:', {
          count: salesStore.customers.length,
          loading: salesStore.customersLoading,
          customers: salesStore.customers.slice(0, 3).map(c => ({ id: c.id, name: c.name }))
        })
        
        if (salesStore.customers.length === 0) {
          console.warn('⚠️ 客户数据为空，可能的原因:')
          console.warn('1. 数据库中没有客户数据')
          console.warn('2. API认证失败')
          console.warn('3. 权限问题')
          console.warn('4. 网络连接问题')
        }
      }).catch(error => {
        console.error('❌ 获取客户列表失败:', error)
        console.error('错误详情:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message
        })
        ElMessage.error('获取客户列表失败，请检查网络或联系管理员')
        return { data: { items: [], total: 0, page: 1, limit: 20 } }
      }),
      loadBases().catch(error => {
        console.error('❌ 加载基地列表失败:', error)
        ElMessage.error('加载基地列表失败')
      })
    ])
    
    // 如果是编辑模式，加载订单数据
    if (isEdit.value) {
      await loadOrderData().catch(error => {
        console.error('❌ 加载订单数据失败:', error)
        ElMessage.error('加载订单数据失败')
      })
    } else {
      // 新建模式，设置默认值
      formData.order_date = new Date().toISOString().split('T')[0]
    }
    
    console.log('✅ 订单表单数据初始化完成')
  } catch (error) {
    console.error('❌ 订单表单初始化失败:', error)
    initializationError.value = true
    ElMessage.error('页面初始化失败，请刷新重试')
  }
})

// 组件销毁时清理
onUnmounted(() => {
  console.log('🧹 OrderForm组件卸载，清理资源...')
  isComponentMounted.value = false
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