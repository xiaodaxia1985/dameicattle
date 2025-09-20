<template>
  <div class="health-records">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="showAddDialog = true" v-if="!readOnly">
        <el-icon><Plus /></el-icon>
        添加记录
      </el-button>
      <el-select v-model="recordType" placeholder="记录类型" style="width: 150px" @change="loadRecords">
        <el-option label="全部" value="" />
        <el-option label="疫苗接种" value="vaccine" />
        <el-option label="治疗记录" value="treatment" />
      </el-select>
    </div>

    <!-- 记录列表 -->
    <div class="records-list" v-loading="loading">
      <el-table v-if="records.length > 0" :data="records" style="width: 100%">
        <el-table-column prop="record_date" label="记录日期" width="180" />
        <el-table-column prop="record_type" label="记录类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.record_type === 'vaccine' ? 'success' : 'warning'">
              {{ scope.row.record_type === 'vaccine' ? '疫苗' : '治疗' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" width="180" show-overflow-tooltip />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="doctor.real_name" label="兽医" width="120" show-overflow-tooltip v-if="records.some(r => r.doctor)" />
        <el-table-column prop="operator.real_name" label="操作员" width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" text @click="viewRecord(scope.row)">详情</el-button>
            <el-button size="small" text type="primary" @click="editRecord(scope.row)" v-if="!readOnly">编辑</el-button>
            <el-button size="small" text type="danger" @click="deleteRecord(scope.row)" v-if="!readOnly">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-else description="暂无健康记录" />
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="pagination.total > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 添加/编辑记录对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="editingRecord ? '编辑记录' : '添加记录'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="recordForm"
        :rules="recordRules"
        label-width="120px"
      >
        <el-form-item label="记录类型" prop="record_type">
          <el-select v-model="recordForm.record_type" placeholder="请选择记录类型" style="width: 100%">
            <el-option label="疫苗接种" value="vaccine" />
            <el-option label="治疗记录" value="treatment" />
          </el-select>
        </el-form-item>

        <el-form-item label="记录日期" prop="record_date">
          <el-date-picker
            v-model="recordForm.record_date"
            type="datetime"
            placeholder="选择记录日期"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="疫苗/治疗名称" prop="name">
          <el-input v-model="recordForm.name" placeholder="请输入疫苗或治疗名称" />
        </el-form-item>

        <el-form-item v-if="recordForm.record_type === 'vaccine'" label="疫苗批次" prop="batch_no">
          <el-input v-model="recordForm.batch_no" placeholder="请输入疫苗批次" />
        </el-form-item>

        <el-form-item v-if="recordForm.record_type === 'treatment'" label="症状" prop="symptoms">
          <el-input
            v-model="recordForm.symptoms"
            type="textarea"
            :rows="2"
            placeholder="请输入症状描述"
          />
        </el-form-item>

        <el-form-item v-if="recordForm.record_type === 'treatment'" label="用药" prop="medication">
          <el-input
            v-model="recordForm.medication"
            type="textarea"
            :rows="2"
            placeholder="请输入用药情况"
          />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="recordForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入详细描述"
          />
        </el-form-item>

        <el-form-item label="兽医姓名" prop="doctor_name">
          <el-input v-model="recordForm.doctor_name" placeholder="请输入兽医姓名" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAddDialog = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitRecord">
            {{ editingRecord ? '更新' : '添加' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 记录详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="记录详情" width="500px">
      <div v-if="selectedRecord" class="record-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="记录类型">
            {{ selectedRecord.record_type === 'vaccine' ? '疫苗接种' : '治疗记录' }}
          </el-descriptions-item>
          <el-descriptions-item label="记录日期">
            {{ formatDateTime(selectedRecord.record_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="名称">
            {{ selectedRecord.name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedRecord.record_type === 'vaccine'" label="疫苗批次">
            {{ selectedRecord.batch_no || '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedRecord.record_type === 'treatment'" label="症状">
            {{ selectedRecord.symptoms || '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedRecord.record_type === 'treatment'" label="用药">
            {{ selectedRecord.medication || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="描述">
            {{ selectedRecord.description || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="兽医">
            {{ selectedRecord.doctor?.real_name || selectedRecord.doctor_name || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="操作员">
            {{ selectedRecord.operator?.real_name || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(selectedRecord.created_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElForm, ElFormItem, ElInput, ElSelect, ElDatePicker, ElTable, ElTableColumn, ElPagination, ElButton, ElDialog, ElRow, ElCol, ElTag, ElDivider, ElIcon } from 'element-plus'
import { Edit, Delete, Plus, Eye } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import dayjs from 'dayjs'
import { cattleApi } from '../../api/cattle'

// 定义健康记录类型
interface HealthRecord {
  id: number
  cattle_id: number
  record_type: 'vaccine' | 'treatment'
  record_date: string
  name: string
  batch_no?: string
  symptoms?: string
  medication?: string
  description?: string
  doctor_id?: number
  doctor_name?: string
  operator_id?: number
  created_at: string
  updated_at: string
  doctor?: {
    id: number
    real_name: string
  }
  operator?: {
    id: number
    real_name: string
  }
}

interface Props {
  cattleId: number
  readOnly?: boolean
}

const props = defineProps<Props>()

const formRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const editingRecord = ref<HealthRecord | null>(null)
const selectedRecord = ref<HealthRecord | null>(null)
const recordType = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const records = ref<HealthRecord[]>([])
const pagination = ref({
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0
})

const recordForm = reactive({
  record_type: 'vaccine',
  record_date: '',
  name: '',
  batch_no: '',
  symptoms: '',
  medication: '',
  description: '',
  doctor_name: ''
})

const recordRules: FormRules = {
  record_type: [
    { required: true, message: '请选择记录类型', trigger: 'change' }
  ],
  record_date: [
    { required: true, message: '请选择记录日期', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  batch_no: [
    { required: (): boolean => recordForm.record_type === 'vaccine', message: '请输入疫苗批次', trigger: 'blur' }
  ],
  symptoms: [
    { required: (): boolean => recordForm.record_type === 'treatment', message: '请输入症状描述', trigger: 'blur' }
  ],
  medication: [
    { required: (): boolean => recordForm.record_type === 'treatment', message: '请输入用药情况', trigger: 'blur' }
  ],
  description: [
    { min: 0, max: 500, message: '描述不能超过 500 个字符', trigger: 'blur' }
  ]
}

// 加载记录列表
const loadRecords = async () => {
  loading.value = true
  try {
    // 调用真实API获取健康记录
    const result = await cattleApi.getHealthRecords(props.cattleId, {
      page: currentPage.value,
      limit: pageSize.value,
      recordType: recordType.value
    })
    
    // 检查result.data是否为数组，如果不是则使用空数组
    records.value = Array.isArray(result.data) ? result.data : []
    
    // 安全地访问result.pagination，如果不存在则使用默认值
    const paginationData = result.pagination || {}
    pagination.value = {
      total: paginationData.total || 0,
      page: paginationData.page || 1,
      limit: paginationData.limit || 20,
      totalPages: Math.ceil((paginationData.total || 0) / (paginationData.limit || 20))
    }
    
  } catch (error) {
    console.error('加载健康记录失败:', error)
    ElMessage.error('加载健康记录失败')
  } finally {
    loading.value = false
  }
}

// 生成模拟健康记录数据（用于API调用失败时的降级显示）
const generateMockHealthRecords = (): HealthRecord[] => {
  const mockData: HealthRecord[] = []
  const vaccines = ['口蹄疫疫苗', '牛瘟疫苗', '牛肺疫疫苗', '布病疫苗', '牛结节性皮肤病疫苗']
  const treatments = ['呼吸道感染治疗', '消化不良治疗', '寄生虫防治', '外伤处理', '口腔疾病治疗']
  
  // 生成疫苗接种记录
  for (let i = 0; i < 6; i++) {
    const date = dayjs().subtract(i * 60, 'day').format('YYYY-MM-DD HH:mm:ss')
    mockData.push({
      id: i + 1,
      cattle_id: props.cattleId,
      record_type: 'vaccine',
      record_date: date,
      name: vaccines[i % vaccines.length],
      batch_no: `VAC-${2024}${String(i + 100).slice(1)}`,
      description: `${vaccines[i % vaccines.length]}接种，牛只反应良好，无异常情况`,
      doctor_id: 101,
      doctor_name: '王兽医',
      created_at: date,
      updated_at: date,
      doctor: {
        id: 101,
        real_name: '王兽医'
      },
      operator: {
        id: 1,
        real_name: '张三'
      }
    })
  }
  
  // 生成治疗记录
  for (let i = 0; i < 5; i++) {
    const date = dayjs().subtract(i * 30, 'day').format('YYYY-MM-DD HH:mm:ss')
    mockData.push({
      id: i + 7,
      cattle_id: props.cattleId,
      record_type: 'treatment',
      record_date: date,
      name: treatments[i % treatments.length],
      symptoms: i % 2 === 0 ? '咳嗽、精神不振' : '食欲减退、腹泻',
      medication: i % 2 === 0 ? '抗生素治疗3天' : '益生菌调理肠胃',
      description: `对${treatments[i % treatments.length]}进行治疗，治疗后牛只状况明显好转`,
      doctor_id: 102,
      doctor_name: '李兽医',
      created_at: date,
      updated_at: date,
      doctor: {
        id: 102,
        real_name: '李兽医'
      },
      operator: {
        id: 2,
        real_name: '李四'
      }
    })
  }
  
  // 按日期降序排序
  return mockData.sort((a, b) => dayjs(b.record_date).unix() - dayjs(a.record_date).unix())
}

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm')
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
    record_type: record.record_type,
    record_date: record.record_date,
    name: record.name || '',
    batch_no: record.batch_no || '',
    symptoms: record.symptoms || '',
    medication: record.medication || '',
    description: record.description || '',
    doctor_name: record.doctor?.real_name || record.doctor_name || ''
  })
  showAddDialog.value = true
}

// 删除记录
const deleteRecord = async (record: HealthRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条${record.record_type === 'vaccine' ? '疫苗接种' : '治疗'}记录吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用真实API删除健康记录
    await cattleApi.deleteHealthRecord(record.id)
    ElMessage.success('删除成功')
    loadRecords()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 提交记录
const submitRecord = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    // 构建记录数据
    const recordData: any = {
      ...recordForm
    }
    
    if (editingRecord.value) {
      // 更新记录 - 调用真实API
      await cattleApi.updateHealthRecord(editingRecord.value.id, recordData)
      ElMessage.success('更新成功')
    } else {
      // 添加记录 - 调用真实API
      await cattleApi.addHealthRecord(props.cattleId, recordData)
      ElMessage.success('添加成功')
    }
    
    showAddDialog.value = false
    loadRecords()
  } catch (error) {
    console.error('提交记录失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  editingRecord.value = null
  Object.assign(recordForm, {
    record_type: 'vaccine',
    record_date: '',
    name: '',
    batch_no: '',
    symptoms: '',
    medication: '',
    description: '',
    doctor_name: ''
  })
  formRef.value?.resetFields()
}

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadRecords()
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadRecords()
}

onMounted(() => {
  loadRecords()
})
</script>

<style scoped>
.health-records {
  padding: 20px;
}

.toolbar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.records-list {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.record-detail {
  padding: 10px 0;
}

.dialog-footer {
  text-align: right;
}
</style>