<template>
  <div class="records-page">
    <div class="page-header">
      <h1>饲喂记录管理</h1>
      <div class="header-actions">
        <!-- 基地牛棚牛只级联选择 -->
        <CascadeSelector
          v-model="searchForm.cascade"
          cattle-label="选择牛只(可选)"
          :required="false"
          @change="handleCascadeChange"
        />
        
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          @change="handleDateRangeChange"
        />
        <el-select v-model="selectedFormula" placeholder="选择配方" clearable @change="handleFormulaChange">
          <el-option
            v-for="formula in formulas"
            :key="formula.id"
            :label="formula.name"
            :value="formula.id"
          />
        </el-select>
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          添加记录
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><DataLine /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ totalRecords }}</div>
                <div class="stat-label">总记录数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Dish /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">{{ totalAmount }}kg</div>
                <div class="stat-label">总饲喂量</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ totalCost }}</div>
                <div class="stat-label">总成本</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">¥{{ avgDailyCost }}</div>
                <div class="stat-label">日均成本</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 记录列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>饲喂记录</span>
          <div class="header-tools">
            <el-button type="text" @click="exportRecords">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
            <el-button type="text" @click="showBatchDialog">
              <el-icon><Upload /></el-icon>
              批量导入
            </el-button>
          </div>
        </div>
      </template>

      <el-table :data="records" v-loading="loading" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" />
        <el-table-column prop="feedingDate" label="饲喂日期" width="120" sortable />
        <el-table-column prop="formulaName" label="配方" min-width="150" />
        <el-table-column prop="baseName" label="基地" width="120" />
        <el-table-column prop="barnName" label="牛棚" width="120" />
        <el-table-column prop="amount" label="用量(kg)" width="100" sortable>
          <template #default="{ row }">
            {{ row.amount?.toFixed(1) }}
          </template>
        </el-table-column>
        <el-table-column prop="cost" label="成本(¥)" width="100" sortable>
          <template #default="{ row }">
            ¥{{ row.cost?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="操作员" width="100" />
        <el-table-column prop="remark" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="记录时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="text" @click="viewRecord(row)">查看</el-button>
            <el-button type="text" @click="editRecord(row)">编辑</el-button>
            <el-button type="text" style="color: #f56c6c" @click="deleteRecord(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
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

    <!-- 创建/编辑记录对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogMode === 'create' ? '添加饲喂记录' : '编辑饲喂记录'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="饲喂日期" prop="feedingDate">
          <el-date-picker
            v-model="formData.feedingDate"
            type="date"
            placeholder="选择饲喂日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="配方" prop="formulaId">
          <el-select v-model="formData.formulaId" placeholder="选择配方" style="width: 100%">
            <el-option
              v-for="formula in formulas"
              :key="formula.id"
              :label="`${formula.name} (¥${formula.costPerKg?.toFixed(2)}/kg)`"
              :value="formula.id"
            />
          </el-select>
        </el-form-item>
        <!-- 基地牛棚牛只级联选择 -->
        <CascadeSelector
          v-model="formData.cascade"
          barn-label="目标牛棚"
          cattle-label="目标牛只(可选)"
          barn-prop="barnId"
          cattle-prop="cattleId"
          :required="true"
          @change="handleFormCascadeChange"
        />
        <el-form-item label="饲喂量(kg)" prop="amount">
          <el-input-number
            v-model="formData.amount"
            :min="0.1"
            :max="10000"
            :precision="1"
            style="width: 100%"
            @change="calculateEstimatedCost"
          />
        </el-form-item>
        <el-form-item label="预估成本">
          <span class="estimated-cost">¥{{ estimatedCost.toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ dialogMode === 'create' ? '添加' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 记录详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="饲喂记录详情" width="600px">
      <div v-if="selectedRecord" class="record-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="饲喂日期">{{ selectedRecord.feedingDate }}</el-descriptions-item>
          <el-descriptions-item label="记录时间">{{ formatDate(selectedRecord.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="配方">{{ selectedRecord.formulaName }}</el-descriptions-item>
          <el-descriptions-item label="基地">{{ selectedRecord.baseName }}</el-descriptions-item>
          <el-descriptions-item label="牛棚">{{ selectedRecord.barnName || '未指定' }}</el-descriptions-item>
          <el-descriptions-item label="饲喂量">{{ selectedRecord.amount }}kg</el-descriptions-item>
          <el-descriptions-item label="成本">¥{{ selectedRecord.cost?.toFixed(2) || '0.00' }}</el-descriptions-item>
          <el-descriptions-item label="操作员">{{ selectedRecord.operatorName }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ selectedRecord.remark || '无' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 批量导入对话框 -->
    <el-dialog v-model="batchDialogVisible" title="批量导入饲喂记录" width="500px">
      <div class="batch-import">
        <el-alert
          title="导入说明"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <template #default>
            <p>请下载模板文件，按照格式填写数据后上传。</p>
            <p>支持的文件格式：Excel (.xlsx)</p>
          </template>
        </el-alert>
        <div class="import-actions">
          <el-button @click="downloadTemplate">
            <el-icon><Download /></el-icon>
            下载模板
          </el-button>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="false"
            accept=".xlsx"
            @change="handleFileChange"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              选择文件
            </el-button>
          </el-upload>
        </div>
        <div v-if="uploadFile" class="file-info">
          <p>已选择文件: {{ uploadFile.name }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="batchDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="importRecords" :loading="importing" :disabled="!uploadFile">
          导入
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DataLine, Dish, Money, TrendCharts, Plus, Download, Upload } from '@element-plus/icons-vue'
import { feedingApi } from '@/api/feeding'
import { baseApi } from '@/api/base'
import { barnApi } from '@/api/barn'
import CascadeSelector from '@/components/common/CascadeSelector.vue'
import type { FeedingRecord, FeedFormula, CreateFeedingRecordRequest, UpdateFeedingRecordRequest } from '@/api/feeding'

// 响应式数据
const records = ref<FeedingRecord[]>([])
const formulas = ref<FeedFormula[]>([])
const bases = ref<any[]>([])
const barns = ref<any[]>([])
const loading = ref(false)
const submitting = ref(false)
const importing = ref(false)
const selectedRows = ref<FeedingRecord[]>([])

// 筛选条件
const dateRange = ref<[string, string]>(['', ''])
const selectedFormula = ref<string>()

// 搜索表单
const searchForm = ref({
  cascade: {
    baseId: undefined as number | undefined,
    barnId: undefined as number | undefined,
    cattleId: undefined as number | undefined
  }
})

// 分页
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0
})

// 对话框
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const batchDialogVisible = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const selectedRecord = ref<FeedingRecord | null>(null)

// 表单
const formRef = ref()
const uploadRef = ref()
const uploadFile = ref<File | null>(null)
const formData = ref<CreateFeedingRecordRequest>({
  formulaId: '',
  baseId: 0,
  barnId: 0,
  amount: 0,
  feedingDate: '',
  remark: ''
})

const formRules: Record<string, any> = {
  feedingDate: [
    { required: true, message: '请选择饲喂日期', trigger: 'change' }
  ],
  formulaId: [
    { required: true, message: '请选择配方', trigger: 'change' }
  ],
  baseId: [
    { required: true, message: '请选择基地', trigger: 'change' }
  ],
  amount: [
    { required: true, message: '请输入饲喂量', trigger: 'blur' },
    { type: 'number', min: 0.1, message: '饲喂量必须大于0.1kg', trigger: 'blur' }
  ]
}

// 计算属性
const totalRecords = computed(() => pagination.value.total)
const totalAmount = computed(() => {
  return records.value.reduce((sum, record) => sum + (record.amount || 0), 0).toFixed(1)
})
const totalCost = computed(() => {
  return records.value.reduce((sum, record) => sum + (record.cost || 0), 0).toFixed(2)
})
const avgDailyCost = computed(() => {
  if (!dateRange.value || records.value.length === 0) return '0.00'
  const days = Math.max(1, Math.ceil((new Date(dateRange.value[1]).getTime() - new Date(dateRange.value[0]).getTime()) / (1000 * 60 * 60 * 24)))
  return (parseFloat(totalCost.value) / days).toFixed(2)
})

const availableBarns = computed(() => {
  return barns.value.filter(barn => barn.baseId === formData.value.baseId)
})

const estimatedCost = computed(() => {
  const formula = formulas.value.find(f => f.id === formData.value.formulaId)
  if (!formula || !formData.value.amount) return 0
  return (formula.costPerKg || 0) * formData.value.amount
})

// 初始化日期范围（最近30天）
const initDateRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  dateRange.value = [
    start.toISOString().split('T')[0],
    end.toISOString().split('T')[0]
  ]
}

// 获取基地列表
const fetchBases = async () => {
  try {
    const response = await baseApi.getBases()
    // 根据API实现，response.data 应该是 { bases: [...], pagination: {...} }
    bases.value = response.data.bases || []
  } catch (error) {
    console.error('获取基地列表失败:', error)
  }
}

// 获取牛棚列表
const fetchBarns = async () => {
  try {
    const response = await barnApi.getList()
    barns.value = response.data
  } catch (error) {
    console.error('获取牛棚列表失败:', error)
  }
}

// 获取配方列表
const fetchFormulas = async () => {
  try {
    const response = await feedingApi.getFormulas()
    // 根据API实现，response.data 应该是 { data: [...], total: number, page: number, limit: number }
    formulas.value = response.data.data || []
  } catch (error) {
    console.error('获取配方列表失败:', error)
  }
}

// 获取记录列表
const fetchRecords = async () => {
  loading.value = true
  try {
    const params: any = {
      page: pagination.value.page,
      limit: pagination.value.limit
    }
    
    // 使用级联选择的值
    if (searchForm.value.cascade.baseId) params.baseId = searchForm.value.cascade.baseId
    if (searchForm.value.cascade.barnId) params.barnId = searchForm.value.cascade.barnId
    if (searchForm.value.cascade.cattleId) params.cattleId = searchForm.value.cascade.cattleId
    if (selectedFormula.value) params.formulaId = selectedFormula.value
    if (dateRange.value) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    
    const response = await feedingApi.getFeedingRecords(params)
    // 根据API实现，response.data 应该是 { data: [...], total: number, page: number, limit: number }
    records.value = response.data.data || []
    pagination.value.total = response.data.total || 0
  } catch (error) {
    console.error('获取记录列表失败:', error)
    ElMessage.error('获取记录列表失败')
  } finally {
    loading.value = false
  }
}

// 级联选择变更处理
const handleCascadeChange = (value: { baseId?: number; barnId?: number; cattleId?: number }) => {
  searchForm.value.cascade = value
  pagination.value.page = 1
  fetchRecords()
}

// 表单级联选择变更处理
const handleFormCascadeChange = (value: { baseId?: number; barnId?: number; cattleId?: number }) => {
  formData.value.cascade = value
  formData.value.baseId = value.baseId || 0
  formData.value.barnId = value.barnId || 0
}

// 处理筛选条件变化
const handleDateRangeChange = () => {
  pagination.value.page = 1
  fetchRecords()
}

const handleFormulaChange = () => {
  pagination.value.page = 1
  fetchRecords()
}

// 分页
const handleSizeChange = () => {
  fetchRecords()
}

const handleCurrentChange = () => {
  fetchRecords()
}

// 选择变化
const handleSelectionChange = (selection: FeedingRecord[]) => {
  selectedRows.value = selection
}

// 显示创建对话框
const showCreateDialog = () => {
  dialogMode.value = 'create'
  resetForm()
  formData.value.feedingDate = new Date().toISOString().split('T')[0]
  dialogVisible.value = true
}

// 查看记录
const viewRecord = (record: FeedingRecord) => {
  selectedRecord.value = record
  detailDialogVisible.value = true
}

// 编辑记录
const editRecord = (record: FeedingRecord) => {
  dialogMode.value = 'edit'
  selectedRecord.value = record
  formData.value = {
    formulaId: record.formulaId,
    baseId: record.baseId,
    barnId: record.barnId,
    amount: record.amount,
    feedingDate: record.feedingDate,
    remark: record.remark || ''
  }
  dialogVisible.value = true
}

// 删除记录
const deleteRecord = async (record: FeedingRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条饲喂记录吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await feedingApi.deleteFeedingRecord(record.id)
    ElMessage.success('删除成功')
    fetchRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除记录失败:', error)
      ElMessage.error('删除记录失败')
    }
  }
}

// 处理表单基地变化
const handleFormBaseChange = () => {
  formData.value.barnId = 0
}

// 计算预估成本
const calculateEstimatedCost = () => {
  // 触发响应式更新
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (dialogMode.value === 'create') {
      await feedingApi.createFeedingRecord(formData.value)
      ElMessage.success('添加成功')
    } else {
      await feedingApi.updateFeedingRecord(selectedRecord.value!.id, formData.value)
      ElMessage.success('更新成功')
    }
    
    dialogVisible.value = false
    fetchRecords()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  formData.value = {
    formulaId: '',
    baseId: 0,
    barnId: 0,
    amount: 0,
    feedingDate: '',
    remark: ''
  }
  selectedRecord.value = null
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 导出记录
const exportRecords = () => {
  ElMessage.info('导出功能开发中...')
}

// 显示批量导入对话框
const showBatchDialog = () => {
  batchDialogVisible.value = true
  uploadFile.value = null
}

// 下载模板
const downloadTemplate = () => {
  ElMessage.info('模板下载功能开发中...')
}

// 处理文件选择
const handleFileChange = (file: any) => {
  uploadFile.value = file.raw
}

// 导入记录
const importRecords = async () => {
  if (!uploadFile.value) return
  
  importing.value = true
  try {
    // 这里应该调用批量导入API
    ElMessage.success('导入成功')
    batchDialogVisible.value = false
    fetchRecords()
  } catch (error) {
    console.error('导入失败:', error)
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 组件挂载
onMounted(() => {
  initDateRange()
  fetchBases()
  fetchBarns()
  fetchFormulas()
})

// 监听搜索条件变化
watch(() => searchForm.value.cascade.baseId, () => {
  fetchRecords()
})
</script>

<style scoped lang="scss">
.records-page {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h1 {
      margin: 0;
      color: #303133;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .stats-cards {
    margin-bottom: 20px;

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 16px;

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #409EFF, #67C23A);
          color: white;
          font-size: 24px;
        }

        .stat-info {
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #303133;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .header-tools {
      display: flex;
      gap: 8px;
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }

  .estimated-cost {
    font-size: 16px;
    font-weight: bold;
    color: #67C23A;
  }

  .record-detail {
    .el-descriptions {
      margin-top: 20px;
    }
  }

  .batch-import {
    .import-actions {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .file-info {
      padding: 12px;
      background: #f5f7fa;
      border-radius: 4px;
      color: #606266;
    }
  }
}
</style>