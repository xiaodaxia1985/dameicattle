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
      <el-form :model="searchForm" inline>
        <el-form-item label="牛只耳标">
          <el-input 
            v-model="searchForm.cattleEarTag" 
            placeholder="请输入牛只耳标"
            clearable
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="诊断状态">
          <el-select 
            v-model="searchForm.status" 
            placeholder="请选择状态"
            clearable
            style="width: 150px"
          >
            <el-option label="进行中" value="ongoing" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="诊断日期">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="兽医">
          <el-select 
            v-model="searchForm.veterinarianId" 
            placeholder="请选择兽医"
            clearable
            style="width: 150px"
          >
            <el-option 
              v-for="vet in veterinarians" 
              :key="vet.id" 
              :label="vet.name" 
              :value="vet.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="searchRecords">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
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
        <el-table-column prop="cattleEarTag" label="牛只耳标" width="120" />
        <el-table-column prop="symptoms" label="症状" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="row.symptoms" placement="top">
              <span class="text-ellipsis">{{ row.symptoms }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="diagnosis" label="诊断结果" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="row.diagnosis" placement="top">
              <span class="text-ellipsis">{{ row.diagnosis }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="treatment" label="治疗方案" min-width="150">
          <template #default="{ row }">
            <el-tooltip :content="row.treatment" placement="top">
              <span class="text-ellipsis">{{ row.treatment }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="veterinarianName" label="兽医" width="100" />
        <el-table-column prop="diagnosisDate" label="诊断日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.diagnosisDate) }}
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
        <el-form-item label="牛只" prop="cattleId">
          <el-select 
            v-model="recordForm.cattleId" 
            placeholder="请选择牛只"
            filterable
            style="width: 100%"
          >
            <el-option 
              v-for="cattle in cattleList" 
              :key="cattle.id" 
              :label="`${cattle.earTag} - ${cattle.breed}`" 
              :value="cattle.id" 
            />
          </el-select>
        </el-form-item>
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
  cattleEarTag: '',
  status: undefined as 'ongoing' | 'completed' | 'cancelled' | undefined,
  dateRange: [],
  veterinarianId: ''
})

// 分页信息
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 表单数据
const recordForm = reactive({
  cattleId: '',
  symptoms: '',
  diagnosis: '',
  treatment: '',
  veterinarianId: '',
  diagnosisDate: '',
  status: 'ongoing' as 'ongoing' | 'completed' | 'cancelled'
})

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
const loadRecords = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm,
      startDate: searchForm.dateRange?.[0],
      endDate: searchForm.dateRange?.[1]
    }
    
    const { data } = await healthApi.getHealthRecords(params)
    records.value = data.data || []
    pagination.total = data.total || 0
  } catch (error) {
    console.error('加载健康记录失败:', error)
    ElMessage.error('加载健康记录失败')
  } finally {
    loading.value = false
  }
}

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
  try {
    await healthApi.deleteHealthRecord(id)
    ElMessage.success('删除成功')
    loadRecords()
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

// 保存记录
const saveRecord = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    if (editingRecord.value) {
      await healthApi.updateHealthRecord(editingRecord.value.id, recordForm)
      ElMessage.success('更新成功')
    } else {
      await healthApi.createHealthRecord(recordForm)
      ElMessage.success('创建成功')
    }
    
    showCreateDialog.value = false
    loadRecords()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

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