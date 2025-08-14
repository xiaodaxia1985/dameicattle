<template>
  <div class="health-records">
    <!-- 页面标题和操作 -->
    <div class="page-header">
      <h1>健康记录管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新增记录
        </el-button>
        <el-button @click="exportRecords">
          <el-icon><Download /></el-icon>
          导出记录
        </el-button>
      </div>
    </div>

    <!-- 搜索筛选 -->
    <el-card class="search-card">
      <el-form :model="searchForm" label-width="80px">
        <!-- 基地牛棚牛只级联选择 -->
        <CascadeSelector
          v-model="searchForm.cascade"
          cattle-label="选择牛只(可选)"
          :required="false"
          @change="handleCascadeChange"
        />
        
        <el-row :gutter="16" style="margin-top: 16px;">
          <el-col :span="6">
            <el-form-item label="诊断状态">
              <el-select 
                v-model="searchForm.status" 
                placeholder="请选择状态"
                clearable
                style="width: 100%"
              >
                <el-option label="进行中" value="ongoing" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="诊断日期">
              <el-date-picker
                v-model="searchForm.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="兽医">
              <el-select 
                v-model="searchForm.veterinarianId" 
                placeholder="请选择兽医"
                clearable
                style="width: 100%"
              >
                <el-option 
                  v-for="vet in veterinarians" 
                  :key="vet.id" 
                  :label="vet.name" 
                  :value="vet.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item>
              <el-button type="primary" @click="searchRecords">
                <el-icon><Search /></el-icon>
                搜索
              </el-button>
              <el-button @click="resetSearch">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <el-table 
        :data="records" 
        v-loading="loading"
        stripe
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="牛只耳标" width="120">
          <template #default="{ row }">
            {{ safeGet(row, 'cattleEarTag', safeGet(row, 'cattle.ear_tag', '-')) }}
          </template>
        </el-table-column>
        <el-table-column prop="symptoms" label="症状" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="safeGet(row, 'symptoms', '')" placement="top">
              <span class="text-ellipsis">{{ safeGet(row, 'symptoms', '-') }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="diagnosis" label="诊断结果" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="safeGet(row, 'diagnosis', '')" placement="top">
              <span class="text-ellipsis">{{ safeGet(row, 'diagnosis', '-') }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="treatment" label="治疗方案" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="safeGet(row, 'treatment', '')" placement="top">
              <span class="text-ellipsis">{{ safeGet(row, 'treatment', '-') }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="兽医" width="100">
          <template #default="{ row }">
            {{ safeGet(row, 'veterinarianName', safeGet(row, 'veterinarian.real_name', '-')) }}
          </template>
        </el-table-column>
        <el-table-column label="诊断日期" width="120">
          <template #default="{ row }">
            {{ formatDate(safeGet(row, 'diagnosisDate', safeGet(row, 'diagnosis_date', ''))) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getStatusType(row.status)"
              size="small"
            >
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small" 
              @click="viewRecord(row)"
            >
              查看
            </el-button>
            <el-button 
              type="warning" 
              size="small" 
              @click="editRecord(row)"
            >
              编辑
            </el-button>
            <el-popconfirm
              title="确定要删除这条记录吗？"
              @confirm="deleteRecord(row.id)"
            >
              <template #reference>
                <el-button 
                  type="danger" 
                  size="small"
                >
                  删除
                </el-button>
              </template>
            </el-popconfirm>
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
          @size-change="loadRecords"
          @current-change="loadRecords"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingRecord ? '编辑健康记录' : '新增健康记录'"
      width="600px"
      @close="resetForm"
    >
      <el-form 
        ref="formRef"
        :model="recordForm" 
        :rules="formRules"
        label-width="100px"
      >
        <!-- 基地牛棚牛只级联选择 -->
        <CascadeSelector
          v-model="recordForm.cascade"
          base-label="选择基地"
          barn-label="选择牛棚"
          cattle-label="选择牛只"
          :required="true"
          :disabled="!!editingRecord"
          @change="handleFormCascadeChange"
        />
        
        <!-- 编辑时显示牛只信息 -->
        <div v-if="editingRecord" class="cattle-info">
          <el-alert
            :title="`当前牛只: ${editingRecord.cattleEarTag || '未知'} (基地-牛棚-牛只信息不可修改)`"
            type="info"
            :closable="false"
            show-icon
          />
        </div>
        <el-form-item label="症状" prop="symptoms">
          <el-input 
            v-model="recordForm.symptoms" 
            type="textarea"
            :rows="3"
            placeholder="请描述牛只症状"
          />
        </el-form-item>
        <el-form-item label="诊断结果" prop="diagnosis">
          <el-input 
            v-model="recordForm.diagnosis" 
            type="textarea"
            :rows="3"
            placeholder="请输入诊断结果"
          />
        </el-form-item>
        <el-form-item label="治疗方案" prop="treatment">
          <el-input 
            v-model="recordForm.treatment" 
            type="textarea"
            :rows="3"
            placeholder="请输入治疗方案"
          />
        </el-form-item>
        <el-form-item label="兽医" prop="veterinarianId">
          <el-select 
            v-model="recordForm.veterinarianId" 
            placeholder="请选择兽医"
            style="width: 100%"
          >
            <el-option 
              v-for="vet in veterinarians" 
              :key="vet.id" 
              :label="vet.name" 
              :value="vet.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="诊断日期" prop="diagnosisDate">
          <el-date-picker
            v-model="recordForm.diagnosisDate"
            type="date"
            placeholder="请选择诊断日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="recordForm.status">
            <el-radio value="ongoing">进行中</el-radio>
            <el-radio value="completed">已完成</el-radio>
            <el-radio value="cancelled">已取消</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRecord" :loading="saving">
          {{ editingRecord ? '更新' : '保存' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="健康记录详情"
      width="500px"
    >
      <div v-if="selectedRecord" class="record-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="牛只耳标">
            {{ selectedRecord.cattleEarTag }}
          </el-descriptions-item>
          <el-descriptions-item label="症状">
            {{ selectedRecord.symptoms }}
          </el-descriptions-item>
          <el-descriptions-item label="诊断结果">
            {{ selectedRecord.diagnosis }}
          </el-descriptions-item>
          <el-descriptions-item label="治疗方案">
            {{ selectedRecord.treatment }}
          </el-descriptions-item>
          <el-descriptions-item label="兽医">
            {{ selectedRecord.veterinarianName }}
          </el-descriptions-item>
          <el-descriptions-item label="诊断日期">
            {{ formatDate(selectedRecord.diagnosisDate) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(selectedRecord.status)">
              {{ getStatusText(selectedRecord.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(selectedRecord.createdAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间">
            {{ formatDateTime(selectedRecord.updatedAt) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Search } from '@element-plus/icons-vue'
import { healthApi } from '@/api/health'
import type { HealthRecord } from '@/api/health'
import CascadeSelector from '@/components/common/CascadeSelector.vue'
import { validateDataArray, ensureArray, ensureNumber } from '@/utils/dataValidation'
import { safeApiCall, withPageErrorHandler, withFormErrorHandler } from '@/utils/errorHandler'
import { safeGet } from '@/utils/safeAccess'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const records = ref<HealthRecord[]>([])
const selectedRecords = ref<HealthRecord[]>([])
const selectedRecord = ref<HealthRecord | null>(null)
const editingRecord = ref<HealthRecord | null>(null)

// 对话框显示状态
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)

// 搜索表单
const searchForm = reactive({
  cascade: {
    baseId: undefined as number | undefined,
    barnId: undefined as number | undefined,
    cattleId: undefined as number | undefined
  },
  status: undefined as 'ongoing' | 'completed' | 'cancelled' | undefined,
  dateRange: [],
  veterinarianId: ''
})

// 级联选择变更处理
const handleCascadeChange = (value: { baseId?: number; barnId?: number; cattleId?: number }) => {
  searchForm.cascade = value
}

// 分页信息
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 表单数据
const recordForm = reactive({
  cascade: {
    baseId: undefined as number | undefined,
    barnId: undefined as number | undefined,
    cattleId: undefined as number | undefined
  },
  cattleId: '',
  symptoms: '',
  diagnosis: '',
  treatment: '',
  veterinarianId: '',
  diagnosisDate: '',
  status: 'ongoing' as 'ongoing' | 'completed' | 'cancelled'
})

// 表单级联选择变更处理
const handleFormCascadeChange = (value: { baseId?: number; barnId?: number; cattleId?: number }) => {
  recordForm.cascade = value
  recordForm.cattleId = value.cattleId?.toString() || ''
}

// 表单验证规则
const formRules = {
  cattleId: [
    { required: true, message: '请选择牛只', trigger: 'change' }
  ],
  symptoms: [
    { required: true, message: '请输入症状', trigger: 'blur' }
  ],
  diagnosisDate: [
    { required: true, message: '请选择诊断日期', trigger: 'change' }
  ]
}

// 基础数据
const cattleList = ref<Array<{ id: number; earTag: string; breed: string }>>([])
const veterinarians = ref<Array<{ id: number; name: string }>>([])

// 表单引用
const formRef = ref()

// 加载健康记录
const loadRecords = withPageErrorHandler(async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      cattleId: searchForm.cascade.cattleId,
      baseId: searchForm.cascade.baseId,
      status: searchForm.status,
      startDate: searchForm.dateRange?.[0],
      endDate: searchForm.dateRange?.[1],
      veterinarianId: searchForm.veterinarianId
    }
    
    console.log('🔍 健康记录API调用参数:', params)
    
    const result = await safeApiCall(
      () => healthApi.getHealthRecords(params),
      {
        showMessage: false,
        fallbackValue: { data: { data: [], total: 0 } }
      }
    )
    
    console.log('📥 健康记录API原始响应:', result)
    
    if (result && result.data) {
      // 尝试多种可能的数据结构
      let recordsData = []
      
      // 检查不同的数据结构
      if (result.data.data) {
        recordsData = ensureArray(result.data.data)
      } else if (result.data.records) {
        recordsData = ensureArray(result.data.records)
      } else if (Array.isArray(result.data)) {
        recordsData = result.data
      } else {
        recordsData = []
      }
      
      console.log('📋 提取的记录数据:', recordsData)
      
      records.value = validateDataArray(recordsData, (record: any) => {
        if (!record || typeof record !== 'object') return null
        
        console.log('🔧 处理单条记录:', record)
        
        // 标准化数据字段，处理不同的字段名
        const normalizedRecord = {
          id: safeGet(record, 'id', ''),
          cattleId: safeGet(record, 'cattleId', safeGet(record, 'cattle_id', '')),
          cattleEarTag: safeGet(record, 'cattleEarTag', safeGet(record, 'cattle_ear_tag', safeGet(record, 'cattle.ear_tag', ''))),
          symptoms: safeGet(record, 'symptoms', ''),
          diagnosis: safeGet(record, 'diagnosis', ''),
          treatment: safeGet(record, 'treatment', ''),
          veterinarianId: safeGet(record, 'veterinarianId', safeGet(record, 'veterinarian_id', '')),
          veterinarianName: safeGet(record, 'veterinarianName', safeGet(record, 'veterinarian_name', safeGet(record, 'veterinarian.real_name', ''))),
          diagnosisDate: safeGet(record, 'diagnosisDate', safeGet(record, 'diagnosis_date', '')),
          status: safeGet(record, 'status', 'ongoing'),
          createdAt: safeGet(record, 'createdAt', safeGet(record, 'created_at', '')),
          updatedAt: safeGet(record, 'updatedAt', safeGet(record, 'updated_at', ''))
        }
        
        console.log('✅ 标准化后的记录:', normalizedRecord)
        
        // 验证必要字段
        return normalizedRecord.id ? normalizedRecord : null
      })
      
      // 获取总数
      let total = 0
      if (result.data.total !== undefined) {
        total = ensureNumber(result.data.total, 0)
      } else if (result.data.pagination && result.data.pagination.total !== undefined) {
        total = ensureNumber(result.data.pagination.total, 0)
      } else {
        total = records.value.length
      }
      
      pagination.total = total
      
      console.log('✅ 健康记录数据加载完成:', records.value.length, '条记录，总数:', pagination.total)
    } else {
      console.log('❌ 健康记录API返回空数据')
      records.value = []
      pagination.total = 0
    }
  } finally {
    loading.value = false
  }
}, '加载健康记录失败')

// 搜索记录
const searchRecords = () => {
  pagination.page = 1
  loadRecords()
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    cattleEarTag: '',
    status: '',
    dateRange: [],
    veterinarianId: ''
  })
  searchRecords()
}

// 查看记录详情
const viewRecord = (record: HealthRecord) => {
  selectedRecord.value = record
  showDetailDialog.value = true
}

// 编辑记录
const editRecord = (record: HealthRecord) => {
  editingRecord.value = record
  Object.assign(recordForm, {
    cattleId: record.cattleId,
    symptoms: record.symptoms,
    diagnosis: record.diagnosis,
    treatment: record.treatment,
    veterinarianId: record.veterinarianId,
    diagnosisDate: record.diagnosisDate,
    status: record.status
  })
  showCreateDialog.value = true
}

// 删除记录
const deleteRecord = async (id: string) => {
  const result = await safeApiCall(
    () => healthApi.deleteHealthRecord(id),
    {
      showMessage: false,
      fallbackValue: null
    }
  )
  
  if (result !== null) {
    ElMessage.success('删除成功')
    loadRecords()
  } else {
    ElMessage.error('删除失败')
  }
}

// 保存记录
const saveRecord = withFormErrorHandler(async () => {
  if (!formRef.value) {
    ElMessage.error('表单引用为空')
    return
  }
  
  await formRef.value.validate()
  saving.value = true
  
  try {
    // 确保cattleId有值
    if (!recordForm.cattleId && recordForm.cascade.cattleId) {
      recordForm.cattleId = recordForm.cascade.cattleId.toString()
    }
    
    if (editingRecord.value) {
      const updateData = {
        symptoms: recordForm.symptoms,
        diagnosis: recordForm.diagnosis,
        treatment: recordForm.treatment,
        status: recordForm.status
      }
      
      const result = await safeApiCall(
        () => healthApi.updateHealthRecord(editingRecord.value!.id, updateData),
        {
          showMessage: false,
          fallbackValue: null
        }
      )
      
      if (result !== null) {
        showCreateDialog.value = false
        resetForm()
        loadRecords()
      }
    } else {
      const createData = {
        cattleId: recordForm.cattleId,
        symptoms: recordForm.symptoms,
        diagnosis: recordForm.diagnosis,
        treatment: recordForm.treatment,
        diagnosisDate: recordForm.diagnosisDate
      }
      
      const result = await safeApiCall(
        () => healthApi.createHealthRecord(createData),
        {
          showMessage: false,
          fallbackValue: null
        }
      )
      
      if (result !== null) {
        showCreateDialog.value = false
        resetForm()
        loadRecords()
      }
    }
  } finally {
    saving.value = false
  }
}, editingRecord.value ? '更新成功' : '创建成功', '保存失败')

// 重置表单
const resetForm = () => {
  editingRecord.value = null
  Object.assign(recordForm, {
    cattleId: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    veterinarianId: '',
    diagnosisDate: '',
    status: 'ongoing'
  })
  formRef.value?.resetFields()
}

// 处理选择变化
const handleSelectionChange = (selection: HealthRecord[]) => {
  selectedRecords.value = selection
}

// 导出记录
const exportRecords = () => {
  ElMessage.info('导出功能开发中...')
}

// 获取状态类型
const getStatusType = (status: string) => {
  const types: Record<string, 'success' | 'primary' | 'warning' | 'info' | 'danger'> = {
    ongoing: 'warning',
    completed: 'success',
    cancelled: 'info'
  }
  return types[status] || 'info'
}

// 获取状态文本
const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    ongoing: '进行中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

// 格式化日期时间
const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString()
}

// 加载基础数据
const loadBaseData = async () => {
  // 这里应该加载牛只列表和兽医列表
  // 暂时使用模拟数据
  cattleList.value = []
  veterinarians.value = []
}

// 组件挂载
onMounted(() => {
  loadRecords()
  loadBaseData()
})
</script>

<style scoped>
.health-records {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.search-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.text-ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.record-detail {
  padding: 10px 0;
}
</style>