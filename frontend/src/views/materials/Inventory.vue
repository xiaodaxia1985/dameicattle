<template>
  <div class="inventory-page">
    <div class="page-header">
      <h1 class="page-title">库存管理</h1>
      <p class="page-description">管理物资库存，包括入库、出库、调拨、盘点和预警</p>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ materialStore.inventory.length }}</div>
              <div class="stat-label">库存物资种类</div>
            </div>
            <el-icon class="stat-icon"><Box /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">¥{{ formatCurrency(materialStore.totalInventoryValue) }}</div>
              <div class="stat-label">库存总价值</div>
            </div>
            <el-icon class="stat-icon"><Money /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card warning">
            <div class="stat-content">
              <div class="stat-number">{{ materialStore.lowStockCount }}</div>
              <div class="stat-label">低库存预警</div>
            </div>
            <el-icon class="stat-icon"><Warning /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card danger">
            <div class="stat-content">
              <div class="stat-number">{{ materialStore.activeAlertsCount }}</div>
              <div class="stat-label">待处理预警</div>
            </div>
            <el-icon class="stat-icon"><Bell /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="page-content">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <!-- 库存查询 -->
        <el-tab-pane label="库存查询" name="inventory">
          <div class="tab-header">
            <div class="search-filters">
              <el-input
                v-model="searchKeyword"
                placeholder="搜索物资名称或编码"
                style="width: 250px"
                clearable
                @input="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
              
              <el-select
                v-model="selectedMaterial"
                placeholder="选择物资"
                style="width: 200px"
                clearable
                filterable
                @change="handleSearch"
              >
                <el-option
                  v-for="material in materialStore.materials"
                  :key="material.id"
                  :label="material.name"
                  :value="material.id"
                />
              </el-select>

              <el-select
                v-model="selectedBase"
                placeholder="选择基地"
                style="width: 150px"
                clearable
                @change="handleSearch"
              >
                <el-option
                  v-for="base in bases"
                  :key="base.id"
                  :label="base.name"
                  :value="base.id"
                />
              </el-select>

              <el-checkbox v-model="lowStockOnly" @change="handleSearch">
                仅显示低库存
              </el-checkbox>
            </div>

            <div class="header-actions">
              <el-button @click="showTransactionDialog('inbound')">
                <el-icon><Plus /></el-icon>
                入库
              </el-button>
              <el-button @click="showTransactionDialog('outbound')">
                <el-icon><Minus /></el-icon>
                出库
              </el-button>
              <el-button @click="showTransactionDialog('transfer')">
                <el-icon><Switch /></el-icon>
                调拨
              </el-button>
              <el-button @click="showTransactionDialog('adjustment')">
                <el-icon><Edit /></el-icon>
                盘点
              </el-button>
            </div>
          </div>

          <el-card>
            <el-table
              :data="materialStore.inventory"
              v-loading="materialStore.loading"
              @selection-change="handleSelectionChange"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column label="物资信息" min-width="200">
                <template #default="{ row }">
                  <div class="material-info">
                    <div class="material-name">{{ row.material?.name }}</div>
                    <div class="material-code">{{ row.material?.code }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="基地" width="120">
                <template #default="{ row }">
                  {{ row.base?.name }}
                </template>
              </el-table-column>
              <el-table-column label="当前库存" width="120">
                <template #default="{ row }">
                  <span :class="{ 'low-stock': row.current_stock <= (row.material?.safety_stock || 0) }">
                    {{ row.current_stock }} {{ row.material?.unit }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="预留库存" width="120">
                <template #default="{ row }">
                  {{ row.reserved_stock }} {{ row.material?.unit }}
                </template>
              </el-table-column>
              <el-table-column label="可用库存" width="120">
                <template #default="{ row }">
                  {{ row.current_stock - row.reserved_stock }} {{ row.material?.unit }}
                </template>
              </el-table-column>
              <el-table-column label="安全库存" width="120">
                <template #default="{ row }">
                  {{ row.material?.safety_stock || 0 }} {{ row.material?.unit }}
                </template>
              </el-table-column>
              <el-table-column label="库存价值" width="120">
                <template #default="{ row }">
                  ¥{{ formatCurrency(row.current_stock * (row.material?.purchase_price || 0)) }}
                </template>
              </el-table-column>
              <el-table-column label="最后更新" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.last_updated) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="200" fixed="right">
                <template #default="{ row }">
                  <el-button size="small" @click="showTransactionDialog('inbound', row)">入库</el-button>
                  <el-button size="small" @click="showTransactionDialog('outbound', row)">出库</el-button>
                  <el-button size="small" @click="viewTransactionHistory(row)">记录</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination">
              <el-pagination
                v-model:current-page="materialStore.currentPage"
                v-model:page-size="materialStore.pageSize"
                :total="materialStore.total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 交易记录 -->
        <el-tab-pane label="交易记录" name="transactions">
          <div class="tab-header">
            <div class="search-filters">
              <el-select
                v-model="transactionMaterialId"
                placeholder="选择物资"
                style="width: 200px"
                clearable
                filterable
                @change="handleTransactionSearch"
              >
                <el-option
                  v-for="material in materialStore.materials"
                  :key="material.id"
                  :label="material.name"
                  :value="material.id"
                />
              </el-select>

              <el-select
                v-model="transactionBaseId"
                placeholder="选择基地"
                style="width: 150px"
                clearable
                @change="handleTransactionSearch"
              >
                <el-option
                  v-for="base in bases"
                  :key="base.id"
                  :label="base.name"
                  :value="base.id"
                />
              </el-select>

              <el-select
                v-model="transactionType"
                placeholder="交易类型"
                style="width: 120px"
                clearable
                @change="handleTransactionSearch"
              >
                <el-option label="入库" value="inbound" />
                <el-option label="出库" value="outbound" />
                <el-option label="调拨" value="transfer" />
                <el-option label="盘点" value="adjustment" />
              </el-select>

              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                style="width: 240px"
                @change="handleTransactionSearch"
              />
            </div>
          </div>

          <el-card>
            <el-table :data="materialStore.transactions" v-loading="materialStore.loading">
              <el-table-column label="交易时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.transaction_date) }}
                </template>
              </el-table-column>
              <el-table-column label="物资信息" min-width="180">
                <template #default="{ row }">
                  <div class="material-info">
                    <div class="material-name">{{ row.material?.name }}</div>
                    <div class="material-code">{{ row.material?.code }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="基地" width="100">
                <template #default="{ row }">
                  {{ row.base?.name }}
                </template>
              </el-table-column>
              <el-table-column label="交易类型" width="100">
                <template #default="{ row }">
                  <el-tag :type="getTransactionTypeColor(row.transaction_type)" size="small">
                    {{ getTransactionTypeName(row.transaction_type) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="数量" width="120">
                <template #default="{ row }">
                  <span :class="{ 'negative': row.transaction_type === 'outbound' }">
                    {{ row.transaction_type === 'outbound' ? '-' : '+' }}{{ row.quantity }} {{ row.material?.unit }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column label="单价" width="100">
                <template #default="{ row }">
                  <span v-if="row.unit_price">¥{{ row.unit_price.toFixed(2) }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="总价" width="120">
                <template #default="{ row }">
                  <span v-if="row.unit_price">¥{{ (row.quantity * row.unit_price).toFixed(2) }}</span>
                  <span v-else>-</span>
                </template>
              </el-table-column>
              <el-table-column label="批次号" width="120" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.batch_number || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="操作员" width="100">
                <template #default="{ row }">
                  {{ row.operator?.real_name || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="备注" min-width="150" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.remark || '-' }}
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination">
              <el-pagination
                v-model:current-page="materialStore.currentPage"
                v-model:page-size="materialStore.pageSize"
                :total="materialStore.total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </el-card>
        </el-tab-pane>

        <!-- 库存预警 -->
        <el-tab-pane label="库存预警" name="alerts">
          <div class="tab-header">
            <div class="search-filters">
              <el-select
                v-model="alertBaseId"
                placeholder="选择基地"
                style="width: 150px"
                clearable
                @change="handleAlertSearch"
              >
                <el-option
                  v-for="base in bases"
                  :key="base.id"
                  :label="base.name"
                  :value="base.id"
                />
              </el-select>
            </div>

            <div class="header-actions">
              <el-button @click="handleResolveSelectedAlerts" :disabled="selectedAlerts.length === 0">
                批量解决
              </el-button>
            </div>
          </div>

          <el-card>
            <el-table
              :data="materialStore.alerts"
              v-loading="materialStore.loading"
              @selection-change="handleAlertSelectionChange"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column label="预警时间" width="180">
                <template #default="{ row }">
                  {{ formatDate(row.created_at) }}
                </template>
              </el-table-column>
              <el-table-column label="物资信息" min-width="180">
                <template #default="{ row }">
                  <div class="material-info">
                    <div class="material-name">{{ row.material?.name }}</div>
                    <div class="material-code">{{ row.material?.code }}</div>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="基地" width="100">
                <template #default="{ row }">
                  {{ row.base?.name }}
                </template>
              </el-table-column>
              <el-table-column label="预警类型" width="100">
                <template #default="{ row }">
                  <el-tag :type="getAlertTypeColor(row.alert_type)" size="small">
                    {{ getAlertTypeName(row.alert_type) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="预警级别" width="100">
                <template #default="{ row }">
                  <el-tag :type="getAlertLevelColor(row.alert_level)" size="small">
                    {{ getAlertLevelName(row.alert_level) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="预警信息" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">
                  {{ row.message }}
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.is_resolved ? 'success' : 'warning'" size="small">
                    {{ row.is_resolved ? '已解决' : '待处理' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="解决时间" width="180">
                <template #default="{ row }">
                  {{ row.resolved_at ? formatDate(row.resolved_at) : '-' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="100" fixed="right">
                <template #default="{ row }">
                  <el-button
                    v-if="!row.is_resolved"
                    size="small"
                    type="primary"
                    @click="handleResolveAlert(row)"
                  >
                    解决
                  </el-button>
                  <span v-else class="resolved-text">已解决</span>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination">
              <el-pagination
                v-model:current-page="materialStore.currentPage"
                v-model:page-size="materialStore.pageSize"
                :total="materialStore.total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handleSizeChange"
                @current-change="handleCurrentChange"
              />
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 库存交易对话框 -->
    <el-dialog
      v-model="transactionDialogVisible"
      :title="getTransactionDialogTitle()"
      width="600px"
      @close="resetTransactionForm"
    >
      <el-form
        ref="transactionFormRef"
        :model="transactionForm"
        :rules="transactionRules"
        label-width="100px"
      >
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="物资" prop="material_id">
              <el-select
                v-model="transactionForm.material_id"
                placeholder="请选择物资"
                style="width: 100%"
                filterable
                @change="handleMaterialChange"
              >
                <el-option
                  v-for="material in materialStore.materials"
                  :key="material.id"
                  :label="material.name"
                  :value="material.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="基地" prop="base_id">
              <el-select v-model="transactionForm.base_id" placeholder="请选择基地" style="width: 100%">
                <el-option
                  v-for="base in bases"
                  :key="base.id"
                  :label="base.name"
                  :value="base.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="数量" prop="quantity">
              <el-input-number
                v-model="transactionForm.quantity"
                :min="0.01"
                :precision="2"
                style="width: 100%"
                placeholder="0.00"
              />
              <span class="unit-text">{{ selectedMaterialUnit }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单价">
              <el-input-number
                v-model="transactionForm.unit_price"
                :min="0"
                :precision="2"
                style="width: 100%"
                placeholder="0.00"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" v-if="transactionForm.transaction_type === 'inbound'">
          <el-col :span="12">
            <el-form-item label="批次号">
              <el-input v-model="transactionForm.batch_number" placeholder="请输入批次号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="过期日期">
              <el-date-picker
                v-model="transactionForm.expiry_date"
                type="date"
                placeholder="选择过期日期"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="备注">
          <el-input
            v-model="transactionForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>

        <div v-if="currentStock !== null" class="stock-info">
          <el-alert
            :title="`当前库存：${currentStock} ${selectedMaterialUnit}`"
            type="info"
            :closable="false"
          />
        </div>
      </el-form>

      <template #footer>
        <el-button @click="transactionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTransaction" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Box, 
  Money, 
  Warning, 
  Bell, 
  Search, 
  Plus, 
  Minus, 
  Switch, 
  Edit 
} from '@element-plus/icons-vue'
import { useMaterialStore } from '@/stores/material'
import { useBaseStore } from '@/stores/base'
import { materialApi } from '@/api/material'
import type { FormInstance } from 'element-plus'
import type { Inventory, InventoryTransaction, InventoryAlert } from '@/types/material'

// Stores
const materialStore = useMaterialStore()
const baseStore = useBaseStore()

// Reactive data
const activeTab = ref('inventory')
const searchKeyword = ref('')
const selectedMaterial = ref<number | undefined>()
const selectedBase = ref<number | undefined>()
const lowStockOnly = ref(false)
const selectedInventory = ref<Inventory[]>([])

// Transaction filters
const transactionMaterialId = ref<number | undefined>()
const transactionBaseId = ref<number | undefined>()
const transactionType = ref<string | undefined>()
const dateRange = ref<[Date, Date] | null>(null)

// Alert filters
const alertBaseId = ref<number | undefined>()
const selectedAlerts = ref<InventoryAlert[]>([])

// Dialog and form
const transactionDialogVisible = ref(false)
const saving = ref(false)
const currentStock = ref<number | null>(null)

// Form refs
const transactionFormRef = ref<FormInstance>()

// Transaction form
const transactionForm = reactive({
  material_id: undefined as number | undefined,
  base_id: undefined as number | undefined,
  transaction_type: 'inbound' as 'inbound' | 'outbound' | 'transfer' | 'adjustment',
  quantity: 0,
  unit_price: undefined as number | undefined,
  batch_number: '',
  expiry_date: null as Date | null,
  remark: ''
})

// Form rules
const transactionRules = {
  material_id: [{ required: true, message: '请选择物资', trigger: 'change' }],
  base_id: [{ required: true, message: '请选择基地', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }]
}

// Computed
const bases = computed(() => baseStore.bases)
const selectedMaterialUnit = computed(() => {
  const material = materialStore.materials.find(m => m.id === transactionForm.material_id)
  return material?.unit || ''
})

// Methods
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatCurrency = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const handleTabChange = (tabName: string) => {
  activeTab.value = tabName
  switch (tabName) {
    case 'inventory':
      loadInventory()
      break
    case 'transactions':
      loadTransactions()
      break
    case 'alerts':
      loadAlerts()
      break
  }
}

const handleSearch = () => {
  loadInventory()
}

const handleTransactionSearch = () => {
  loadTransactions()
}

const handleAlertSearch = () => {
  loadAlerts()
}

const handleSelectionChange = (selection: Inventory[]) => {
  selectedInventory.value = selection
}

const handleAlertSelectionChange = (selection: InventoryAlert[]) => {
  selectedAlerts.value = selection
}

const handleSizeChange = (size: number) => {
  materialStore.pageSize = size
  loadCurrentTabData()
}

const handleCurrentChange = (page: number) => {
  materialStore.currentPage = page
  loadCurrentTabData()
}

const loadCurrentTabData = () => {
  switch (activeTab.value) {
    case 'inventory':
      loadInventory()
      break
    case 'transactions':
      loadTransactions()
      break
    case 'alerts':
      loadAlerts()
      break
  }
}

const loadInventory = async () => {
  try {
    await materialStore.fetchInventory({
      page: materialStore.currentPage,
      limit: materialStore.pageSize,
      keyword: searchKeyword.value || undefined,
      material_id: selectedMaterial.value,
      base_id: selectedBase.value,
      low_stock_only: lowStockOnly.value || undefined
    })
  } catch (error) {
    ElMessage.error('加载库存列表失败')
  }
}

const loadTransactions = async () => {
  try {
    const params: any = {
      page: materialStore.currentPage,
      limit: materialStore.pageSize,
      material_id: transactionMaterialId.value,
      base_id: transactionBaseId.value,
      transaction_type: transactionType.value
    }

    if (dateRange.value) {
      params.start_date = dateRange.value[0].toISOString().split('T')[0]
      params.end_date = dateRange.value[1].toISOString().split('T')[0]
    }

    await materialStore.fetchTransactions(params)
  } catch (error) {
    ElMessage.error('加载交易记录失败')
  }
}

const loadAlerts = async () => {
  try {
    await materialStore.fetchAlerts({
      base_id: alertBaseId.value
    })
  } catch (error) {
    ElMessage.error('加载库存预警失败')
  }
}

// Transaction operations
const showTransactionDialog = (type: 'inbound' | 'outbound' | 'transfer' | 'adjustment', inventory?: Inventory) => {
  transactionForm.transaction_type = type
  
  if (inventory) {
    transactionForm.material_id = inventory.material_id
    transactionForm.base_id = inventory.base_id
    currentStock.value = inventory.current_stock
  } else {
    currentStock.value = null
  }
  
  transactionDialogVisible.value = true
}

const resetTransactionForm = () => {
  Object.assign(transactionForm, {
    material_id: undefined,
    base_id: undefined,
    transaction_type: 'inbound',
    quantity: 0,
    unit_price: undefined,
    batch_number: '',
    expiry_date: null,
    remark: ''
  })
  currentStock.value = null
  nextTick(() => {
    transactionFormRef.value?.clearValidate()
  })
}

const handleMaterialChange = async () => {
  if (transactionForm.material_id && transactionForm.base_id) {
    try {
      const response = await materialApi.getInventoryByMaterialAndBase(
        transactionForm.material_id,
        transactionForm.base_id
      )
      currentStock.value = response.data.current_stock
    } catch (error) {
      currentStock.value = 0
    }
  }
}

const getTransactionDialogTitle = () => {
  const titles = {
    inbound: '物资入库',
    outbound: '物资出库',
    transfer: '库存调拨',
    adjustment: '库存盘点'
  }
  return titles[transactionForm.transaction_type]
}

const handleSaveTransaction = async () => {
  if (!transactionFormRef.value) return
  
  try {
    await transactionFormRef.value.validate()
    saving.value = true
    
    const data = {
      ...transactionForm,
      expiry_date: transactionForm.expiry_date?.toISOString().split('T')[0]
    }
    
    await materialStore.createTransaction(data)
    ElMessage.success('库存交易记录成功')
    transactionDialogVisible.value = false
    
    // Refresh current tab data
    loadCurrentTabData()
  } catch (error) {
    if (error !== false) {
      ElMessage.error('保存交易记录失败')
    }
  } finally {
    saving.value = false
  }
}

const viewTransactionHistory = (inventory: Inventory) => {
  activeTab.value = 'transactions'
  transactionMaterialId.value = inventory.material_id
  transactionBaseId.value = inventory.base_id
  loadTransactions()
}

// Transaction type helpers
const getTransactionTypeName = (type: string) => {
  const names = {
    inbound: '入库',
    outbound: '出库',
    transfer: '调拨',
    adjustment: '盘点'
  }
  return names[type as keyof typeof names] || type
}

const getTransactionTypeColor = (type: string): 'success' | 'primary' | 'warning' | 'info' | 'danger' => {
  const colors = {
    inbound: 'success',
    outbound: 'warning',
    transfer: 'info',
    adjustment: 'primary'
  }
  return colors[type as keyof typeof colors] || 'info'
}

// Alert operations
const handleResolveAlert = async (alert: InventoryAlert) => {
  try {
    await ElMessageBox.confirm(
      `确定要解决预警"${alert.message}"吗？`,
      '确认解决',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await materialStore.resolveAlert(alert.id)
    ElMessage.success('预警已解决')
    loadAlerts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('解决预警失败')
    }
  }
}

const handleResolveSelectedAlerts = async () => {
  if (selectedAlerts.value.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      `确定要批量解决 ${selectedAlerts.value.length} 个预警吗？`,
      '确认批量解决',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const promises = selectedAlerts.value.map(alert => materialStore.resolveAlert(alert.id))
    await Promise.all(promises)
    
    ElMessage.success('批量解决预警成功')
    loadAlerts()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量解决预警失败')
    }
  }
}

// Alert type helpers
const getAlertTypeName = (type: string) => {
  const names = {
    low_stock: '低库存',
    expired: '过期',
    quality_issue: '质量问题'
  }
  return names[type as keyof typeof names] || type
}

const getAlertTypeColor = (type: string): 'success' | 'primary' | 'warning' | 'info' | 'danger' => {
  const colors = {
    low_stock: 'warning',
    expired: 'danger',
    quality_issue: 'danger'
  }
  return colors[type as keyof typeof colors] || 'info'
}

const getAlertLevelName = (level: string) => {
  const names = {
    low: '低',
    medium: '中',
    high: '高'
  }
  return names[level as keyof typeof names] || level
}

const getAlertLevelColor = (level: string): 'success' | 'primary' | 'warning' | 'info' | 'danger' => {
  const colors = {
    low: 'info',
    medium: 'warning',
    high: 'danger'
  }
  return colors[level as keyof typeof colors] || 'info'
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      baseStore.fetchBases(),
      materialStore.fetchMaterials({ limit: 1000 }), // Load all materials for dropdown
      materialStore.fetchStatistics(),
      loadInventory()
    ])
  } catch (error) {
    ElMessage.error('初始化数据失败')
  }
})
</script>

<style scoped>
.inventory-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-description {
  color: #606266;
  margin: 0;
}

.statistics-cards {
  margin-bottom: 20px;
}

.stat-card {
  position: relative;
  overflow: hidden;
}

.stat-card.warning {
  border-left: 4px solid #e6a23c;
}

.stat-card.danger {
  border-left: 4px solid #f56c6c;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 8px;
}

.stat-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 32px;
  color: #e4e7ed;
}

.page-content {
  background: white;
  border-radius: 8px;
  padding: 20px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.material-info {
  display: flex;
  flex-direction: column;
}

.material-name {
  font-weight: 500;
  color: #303133;
}

.material-code {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.low-stock {
  color: #e6a23c;
  font-weight: 600;
}

.negative {
  color: #f56c6c;
}

.resolved-text {
  color: #67c23a;
  font-size: 12px;
}

.unit-text {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

.stock-info {
  margin-top: 16px;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-card) {
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
}

:deep(.el-tabs__item) {
  font-size: 16px;
  font-weight: 500;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-alert) {
  margin: 0;
}
</style>