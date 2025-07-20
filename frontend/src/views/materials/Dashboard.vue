<template>
  <div class="materials-dashboard">
    <div class="page-header">
      <h1 class="page-title">物资管理总览</h1>
      <p class="page-description">查看物资管理关键指标和统计数据</p>
    </div>

    <!-- 关键指标卡片 -->
    <div class="statistics-cards">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ statistics?.total_materials || 0 }}</div>
              <div class="stat-label">物资种类</div>
            </div>
            <el-icon class="stat-icon"><Box /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">¥{{ formatCurrency(statistics?.total_value || 0) }}</div>
              <div class="stat-label">库存总价值</div>
            </div>
            <el-icon class="stat-icon"><Money /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card warning">
            <div class="stat-content">
              <div class="stat-number">{{ statistics?.low_stock_count || 0 }}</div>
              <div class="stat-label">低库存物资</div>
            </div>
            <el-icon class="stat-icon"><Warning /></el-icon>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card danger">
            <div class="stat-content">
              <div class="stat-number">{{ statistics?.alert_count || 0 }}</div>
              <div class="stat-label">待处理预警</div>
            </div>
            <el-icon class="stat-icon"><Bell /></el-icon>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-row :gutter="16">
      <!-- 库存分布图表 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>库存分布</span>
              <el-select v-model="selectedBase" placeholder="选择基地" style="width: 150px" @change="loadChartData">
                <el-option label="全部基地" :value="undefined" />
                <el-option
                  v-for="base in bases"
                  :key="base.id"
                  :label="base.name"
                  :value="base.id"
                />
              </el-select>
            </div>
          </template>
          <div ref="inventoryChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 物资分类统计 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <span>物资分类统计</span>
          </template>
          <div ref="categoryChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <!-- 低库存预警列表 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>低库存预警</span>
              <el-button size="small" @click="$router.push('/materials/inventory?tab=alerts')">
                查看全部
              </el-button>
            </div>
          </template>
          <div class="alert-list">
            <div
              v-for="alert in lowStockAlerts"
              :key="alert.id"
              class="alert-item"
            >
              <div class="alert-content">
                <div class="alert-title">{{ alert.material?.name }}</div>
                <div class="alert-desc">{{ alert.message }}</div>
              </div>
              <div class="alert-actions">
                <el-tag :type="getAlertLevelColor(alert.alert_level)" size="small">
                  {{ getAlertLevelName(alert.alert_level) }}
                </el-tag>
              </div>
            </div>
            <div v-if="lowStockAlerts.length === 0" class="empty-state">
              <el-empty description="暂无低库存预警" :image-size="80" />
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 最近交易记录 -->
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近交易记录</span>
              <el-button size="small" @click="$router.push('/materials/inventory?tab=transactions')">
                查看全部
              </el-button>
            </div>
          </template>
          <div class="transaction-list">
            <div
              v-for="transaction in recentTransactions"
              :key="transaction.id"
              class="transaction-item"
            >
              <div class="transaction-content">
                <div class="transaction-title">{{ transaction.material?.name }}</div>
                <div class="transaction-desc">
                  {{ getTransactionTypeName(transaction.transaction_type) }}
                  {{ transaction.quantity }} {{ transaction.material?.unit }}
                </div>
              </div>
              <div class="transaction-time">
                {{ formatDate(transaction.transaction_date) }}
              </div>
            </div>
            <div v-if="recentTransactions.length === 0" class="empty-state">
              <el-empty description="暂无交易记录" :image-size="80" />
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快速操作 -->
    <el-card style="margin-top: 16px">
      <template #header>
        <span>快速操作</span>
      </template>
      <div class="quick-actions">
        <el-button type="primary" @click="$router.push('/materials/list')">
          <el-icon><Box /></el-icon>
          物资档案管理
        </el-button>
        <el-button @click="$router.push('/materials/inventory')">
          <el-icon><DataAnalysis /></el-icon>
          库存查询
        </el-button>
        <el-button @click="showTransactionDialog('inbound')">
          <el-icon><Plus /></el-icon>
          快速入库
        </el-button>
        <el-button @click="showTransactionDialog('outbound')">
          <el-icon><Minus /></el-icon>
          快速出库
        </el-button>
      </div>
    </el-card>

    <!-- 快速交易对话框 -->
    <el-dialog
      v-model="transactionDialogVisible"
      :title="transactionType === 'inbound' ? '快速入库' : '快速出库'"
      width="500px"
      @close="resetTransactionForm"
    >
      <el-form
        ref="transactionFormRef"
        :model="transactionForm"
        :rules="transactionRules"
        label-width="80px"
      >
        <el-form-item label="物资" prop="material_id">
          <el-select
            v-model="transactionForm.material_id"
            placeholder="请选择物资"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="material in materialStore.materials"
              :key="material.id"
              :label="material.name"
              :value="material.id"
            />
          </el-select>
        </el-form-item>
        
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

        <el-form-item label="数量" prop="quantity">
          <el-input-number
            v-model="transactionForm.quantity"
            :min="0.01"
            :precision="2"
            style="width: 100%"
            placeholder="0.00"
          />
        </el-form-item>

        <el-form-item label="单价">
          <el-input-number
            v-model="transactionForm.unit_price"
            :min="0"
            :precision="2"
            style="width: 100%"
            placeholder="0.00"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="transactionForm.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息"
          />
        </el-form-item>
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
import { ElMessage } from 'element-plus'
import { useMaterialStore } from '@/stores/material'
import { useBaseStore } from '@/stores/base'
import * as echarts from 'echarts'
import type { FormInstance } from 'element-plus'
import type { InventoryStatistics, InventoryAlert, InventoryTransaction } from '@/types/material'

// Stores
const materialStore = useMaterialStore()
const baseStore = useBaseStore()

// Reactive data
const statistics = ref<InventoryStatistics | null>(null)
const lowStockAlerts = ref<InventoryAlert[]>([])
const recentTransactions = ref<InventoryTransaction[]>([])
const selectedBase = ref<number | undefined>()
const transactionDialogVisible = ref(false)
const transactionType = ref<'inbound' | 'outbound'>('inbound')
const saving = ref(false)

// Chart refs
const inventoryChartRef = ref<HTMLDivElement>()
const categoryChartRef = ref<HTMLDivElement>()
let inventoryChart: echarts.ECharts | null = null
let categoryChart: echarts.ECharts | null = null

// Form
const transactionFormRef = ref<FormInstance>()
const transactionForm = reactive({
  material_id: undefined as number | undefined,
  base_id: undefined as number | undefined,
  quantity: 0,
  unit_price: undefined as number | undefined,
  remark: ''
})

const transactionRules = {
  material_id: [{ required: true, message: '请选择物资', trigger: 'change' }],
  base_id: [{ required: true, message: '请选择基地', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }]
}

// Computed
const bases = computed(() => baseStore.bases)

// Methods
const formatCurrency = (amount: number) => {
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getAlertLevelName = (level: string) => {
  const names = { low: '低', medium: '中', high: '高' }
  return names[level as keyof typeof names] || level
}

const getAlertLevelColor = (level: string) => {
  const colors = { low: 'info', medium: 'warning', high: 'danger' }
  return colors[level as keyof typeof colors] || 'default'
}

const getTransactionTypeName = (type: string) => {
  const names = { inbound: '入库', outbound: '出库', transfer: '调拨', adjustment: '盘点' }
  return names[type as keyof typeof names] || type
}

const loadStatistics = async () => {
  try {
    await materialStore.fetchStatistics()
    statistics.value = materialStore.statistics
  } catch (error) {
    ElMessage.error('加载统计数据失败')
  }
}

const loadAlerts = async () => {
  try {
    await materialStore.fetchAlerts()
    lowStockAlerts.value = materialStore.alerts
      .filter(alert => !alert.is_resolved && alert.alert_type === 'low_stock')
      .slice(0, 5)
  } catch (error) {
    ElMessage.error('加载预警数据失败')
  }
}

const loadRecentTransactions = async () => {
  try {
    await materialStore.fetchTransactions({ limit: 5 })
    recentTransactions.value = materialStore.transactions
  } catch (error) {
    ElMessage.error('加载交易记录失败')
  }
}

const loadChartData = async () => {
  try {
    await materialStore.fetchInventory({ 
      base_id: selectedBase.value,
      limit: 1000 
    })
    updateCharts()
  } catch (error) {
    ElMessage.error('加载图表数据失败')
  }
}

const initCharts = () => {
  if (inventoryChartRef.value) {
    inventoryChart = echarts.init(inventoryChartRef.value)
  }
  if (categoryChartRef.value) {
    categoryChart = echarts.init(categoryChartRef.value)
  }
  updateCharts()
}

const updateCharts = () => {
  // 库存分布图表
  if (inventoryChart) {
    const inventoryData = materialStore.inventory.map(item => ({
      name: item.material?.name || '',
      value: item.current_stock,
      unit: item.material?.unit || ''
    })).slice(0, 10)

    inventoryChart.setOption({
      title: {
        text: '库存数量分布',
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      series: [{
        name: '库存数量',
        type: 'pie',
        radius: '60%',
        data: inventoryData,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    })
  }

  // 物资分类统计图表
  if (categoryChart) {
    const categoryData = materialStore.categories.map(category => {
      const count = materialStore.materials.filter(m => m.category_id === category.id).length
      return {
        name: category.name,
        value: count
      }
    })

    categoryChart.setOption({
      title: {
        text: '物资分类统计',
        left: 'center',
        textStyle: { fontSize: 14 }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      xAxis: {
        type: 'category',
        data: categoryData.map(item => item.name),
        axisLabel: { rotate: 45 }
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        name: '物资数量',
        type: 'bar',
        data: categoryData.map(item => item.value),
        itemStyle: {
          color: '#409EFF'
        }
      }]
    })
  }
}

const showTransactionDialog = (type: 'inbound' | 'outbound') => {
  transactionType.value = type
  transactionDialogVisible.value = true
}

const resetTransactionForm = () => {
  Object.assign(transactionForm, {
    material_id: undefined,
    base_id: undefined,
    quantity: 0,
    unit_price: undefined,
    remark: ''
  })
  nextTick(() => {
    transactionFormRef.value?.clearValidate()
  })
}

const handleSaveTransaction = async () => {
  if (!transactionFormRef.value) return
  
  try {
    await transactionFormRef.value.validate()
    saving.value = true
    
    const data = {
      ...transactionForm,
      transaction_type: transactionType.value
    }
    
    await materialStore.createTransaction(data)
    ElMessage.success('交易记录保存成功')
    transactionDialogVisible.value = false
    
    // Refresh data
    await Promise.all([
      loadStatistics(),
      loadRecentTransactions(),
      loadChartData()
    ])
  } catch (error) {
    if (error !== false) {
      ElMessage.error('保存交易记录失败')
    }
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(async () => {
  try {
    await Promise.all([
      baseStore.fetchBases(),
      materialStore.fetchCategories(),
      materialStore.fetchMaterials({ limit: 1000 }),
      loadStatistics(),
      loadAlerts(),
      loadRecentTransactions(),
      loadChartData()
    ])
    
    nextTick(() => {
      initCharts()
    })
  } catch (error) {
    ElMessage.error('初始化数据失败')
  }
})
</script>

<style scoped>
.materials-dashboard {
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

.chart-card {
  height: 400px;
}

.chart-container {
  height: 320px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-list, .transaction-list {
  max-height: 300px;
  overflow-y: auto;
}

.alert-item, .transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.alert-item:last-child, .transaction-item:last-child {
  border-bottom: none;
}

.alert-content, .transaction-content {
  flex: 1;
}

.alert-title, .transaction-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.alert-desc, .transaction-desc {
  font-size: 12px;
  color: #909399;
}

.transaction-time {
  font-size: 12px;
  color: #909399;
}

.empty-state {
  padding: 20px;
  text-align: center;
}

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

:deep(.el-card) {
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
}
</style>