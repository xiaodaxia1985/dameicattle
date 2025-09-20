<template>
  <div class="breeding-records">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button v-if="!readOnly" type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加记录
      </el-button>
      <el-select v-model="recordType" placeholder="记录类型" style="width: 150px" @change="loadRecords">
        <el-option label="全部" value="" />
        <el-option label="出生记录" value="birth" />
        <el-option label="配种记录" value="mating" />
        <el-option label="产犊记录" value="calving" />
      </el-select>
    </div>

    <!-- 记录列表 -->
    <div class="records-list" v-loading="loading">
      <el-table v-if="records.length > 0" :data="records" style="width: 100%">
        <el-table-column prop="record_date" label="记录日期" width="180" />
        <el-table-column prop="record_type" label="记录类型" width="100">
          <template #default="scope">
            <el-tag :type="getTagType(scope.row.record_type)">
              {{ getRecordTypeLabel(scope.row.record_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="mother.ear_tag" label="母牛耳标" width="120" show-overflow-tooltip v-if="recordType !== 'birth'" />
        <el-table-column prop="calf.ear_tag" label="犊牛耳标" width="120" show-overflow-tooltip v-if="recordType !== 'mating'" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="operator.real_name" label="操作员" width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" text @click="viewRecord(scope.row)">详情</el-button>
            <el-button v-if="!readOnly" size="small" text type="primary" @click="editRecord(scope.row)">编辑</el-button>
            <el-button v-if="!readOnly" size="small" text type="danger" @click="deleteRecord(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-else description="暂无繁殖记录" />
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
            <el-option label="出生记录" value="birth" />
            <el-option label="配种记录" value="mating" />
            <el-option label="产犊记录" value="calving" />
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

        <el-form-item v-if="recordForm.record_type === 'birth'" label="出生日期" prop="birth_date">
          <el-date-picker
            v-model="recordForm.birth_date"
            type="date"
            placeholder="选择出生日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item v-if="recordForm.record_type === 'mating'" label="配种日期" prop="mating_date">
          <el-date-picker
            v-model="recordForm.mating_date"
            type="date"
            placeholder="选择配种日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item v-if="recordForm.record_type === 'calving'" label="产犊日期" prop="calving_date">
          <el-date-picker
            v-model="recordForm.calving_date"
            type="date"
            placeholder="选择产犊日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item v-if="recordForm.record_type !== 'birth'" label="母牛耳标" prop="mother_ear_tag">
          <el-input v-model="recordForm.mother_ear_tag" placeholder="请输入母牛耳标" />
        </el-form-item>

        <el-form-item v-if="recordForm.record_type !== 'mating'" label="犊牛耳标" prop="calf_ear_tag">
          <el-input v-model="recordForm.calf_ear_tag" placeholder="请输入犊牛耳标" />
        </el-form-item>

        <el-form-item v-if="recordForm.record_type === 'birth'" label="性别" prop="gender">
          <el-select v-model="recordForm.gender" placeholder="请选择性别" style="width: 100%">
            <el-option label="公" value="male" />
            <el-option label="母" value="female" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="recordForm.record_type === 'mating'" label="公牛信息" prop="bull_info">
          <el-input v-model="recordForm.bull_info" placeholder="请输入公牛信息" />
        </el-form-item>

        <el-form-item v-if="recordForm.record_type === 'calving'" label="产犊情况" prop="calving_details">
          <el-input
            v-model="recordForm.calving_details"
            type="textarea"
            :rows="2"
            placeholder="请输入产犊情况描述"
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
            {{ getRecordTypeLabel(selectedRecord.record_type) }}
          </el-descriptions-item>
          <el-descriptions-item label="记录日期">
            {{ formatDateTime(selectedRecord.record_date) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedRecord.record_type === 'birth'" label="出生日期">
            {{ selectedRecord.birth_date }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedRecord.record_type === 'mating'" label="配种日期">
            {{ selectedRecord.mating_date }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedRecord.record_type === 'calving'" label="产犊日期">
            {{ selectedRecord.calving_date }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedRecord.record_type !== 'birth'" label="母牛信息">
            <div v-if="selectedRecord.mother">
              <div>耳标: {{ selectedRecord.mother.ear_tag }}</div>
              <div v-if="selectedRecord.mother.name">名称: {{ selectedRecord.mother.name }}</div>
            </div>
            <span v-else>{{ selectedRecord.mother_ear_tag || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedRecord.record_type !== 'mating'" label="犊牛信息">
            <div v-if="selectedRecord.calf">
              <div>耳标: {{ selectedRecord.calf.ear_tag }}</div>
              <div v-if="selectedRecord.calf.name">名称: {{ selectedRecord.calf.name }}</div>
              <div v-if="selectedRecord.calf.gender">性别: {{ selectedRecord.calf.gender === 'male' ? '公' : '母' }}</div>
            </div>
            <span v-else>{{ selectedRecord.calf_ear_tag || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedRecord.record_type === 'birth'" label="性别">
            {{ selectedRecord.gender === 'male' ? '公' : '母' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedRecord.record_type === 'mating'" label="公牛信息">
            {{ selectedRecord.bull_info || '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedRecord.record_type === 'calving'" label="产犊情况">
            {{ selectedRecord.calving_details || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="描述">
            {{ selectedRecord.description || '无' }}
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { cattleServiceApi } from '@/api/microservices'

// 定义繁殖记录类型
interface BreedingRecord {
  id: number
  cattle_id: number
  record_type: 'birth' | 'mating' | 'calving'
  record_date: string
  birth_date?: string
  mating_date?: string
  calving_date?: string
  mother_id?: number
  mother_ear_tag?: string
  calf_id?: number
  calf_ear_tag?: string
  gender?: 'male' | 'female'
  bull_info?: string
  calving_details?: string
  description?: string
  operator_id?: number
  created_at: string
  updated_at: string
  mother?: {
    id: number
    ear_tag: string
    name?: string
  }
  calf?: {
    id: number
    ear_tag: string
    name?: string
    gender?: 'male' | 'female'
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
const editingRecord = ref<BreedingRecord | null>(null)
const selectedRecord = ref<BreedingRecord | null>(null)
const recordType = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const records = ref<BreedingRecord[]>([])
const pagination = ref({
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0
})

const recordForm = reactive({
  record_type: 'birth',
  record_date: '',
  birth_date: '',
  mating_date: '',
  calving_date: '',
  mother_ear_tag: '',
  calf_ear_tag: '',
  gender: 'male',
  bull_info: '',
  calving_details: '',
  description: ''
})

const recordRules: FormRules = {
  record_type: [
    { required: true, message: '请选择记录类型', trigger: 'change' }
  ],
  record_date: [
    { required: true, message: '请选择记录日期', trigger: 'change' }
  ],
  birth_date: [
    { required: (): boolean => recordForm.record_type === 'birth', message: '请选择出生日期', trigger: 'change' }
  ],
  mating_date: [
    { required: (): boolean => recordForm.record_type === 'mating', message: '请选择配种日期', trigger: 'change' }
  ],
  calving_date: [
    { required: (): boolean => recordForm.record_type === 'calving', message: '请选择产犊日期', trigger: 'change' }
  ],
  mother_ear_tag: [
    { required: (): boolean => recordForm.record_type !== 'birth', message: '请输入母牛耳标', trigger: 'blur' }
  ],
  calf_ear_tag: [
    { required: (): boolean => recordForm.record_type !== 'mating', message: '请输入犊牛耳标', trigger: 'blur' }
  ],
  gender: [
    { required: (): boolean => recordForm.record_type === 'birth', message: '请选择性别', trigger: 'change' }
  ],
  bull_info: [
    { required: (): boolean => recordForm.record_type === 'mating', message: '请输入公牛信息', trigger: 'blur' }
  ],
  calving_details: [
    { required: (): boolean => recordForm.record_type === 'calving', message: '请输入产犊情况', trigger: 'blur' }
  ],
  description: [
    { min: 0, max: 500, message: '描述不能超过 500 个字符', trigger: 'blur' }
  ]
}

// 加载记录列表
const loadRecords = async () => {
  loading.value = true
  try {
    // 调用API获取所有事件，然后筛选出繁殖相关的事件
    const response = await cattleServiceApi.getCattleEvents(props.cattleId, {
      page: currentPage.value,
      limit: pageSize.value
    })
    
    // 将事件数据转换为繁殖记录格式
    // 检查response.data是否为数组，如果不是则使用空数组
    const eventsData = Array.isArray(response.data) ? response.data : []
    const breedingRecords: BreedingRecord[] = eventsData
      .filter((event: any) => 
        event.event_type === 'birth' || 
        event.event_type === 'mating' || 
        event.event_type === 'calving'
      )
      .map((event: any) => {
        // 从事件类型中获取记录类型
        const record_type = event.event_type === 'birth' ? 'birth' : 
                           event.event_type === 'mating' ? 'mating' : 'calving';
        
        // 从data字段中提取相应的数据
        const data = event.data || {};
        
        return {
          id: event.id,
          cattle_id: event.cattle_id,
          record_type: record_type,
          record_date: event.event_date,
          birth_date: data.birth_date || '',
          mating_date: data.mating_date || '',
          calving_date: data.calving_date || '',
          mother_id: data.mother_id || undefined,
          mother_ear_tag: data.mother_ear_tag || '',
          calf_id: data.calf_id || undefined,
          calf_ear_tag: data.calf_ear_tag || '',
          gender: data.gender || undefined,
          bull_info: data.bull_info || '',
          calving_details: data.calving_details || '',
          description: event.description || '',
          operator_id: event.operator_id,
          created_at: event.created_at,
          updated_at: event.updated_at,
          mother: data.mother || undefined,
          calf: data.calf || undefined,
          operator: event.operator
        };
      });
    
    // 应用筛选
    let filteredRecords = breedingRecords;
    if (recordType.value) {
      filteredRecords = breedingRecords.filter(record => record.record_type === recordType.value);
    }
    
    records.value = filteredRecords;
    pagination.value = response.pagination || {
      total: filteredRecords.length,
      page: currentPage.value,
      limit: pageSize.value,
      totalPages: Math.ceil(filteredRecords.length / pageSize.value)
    };
    
  } catch (error) {
    console.error('加载繁殖记录失败:', error);
    ElMessage.error('加载繁殖记录失败');
  } finally {
    loading.value = false;
  }
}

// 获取记录类型标签样式
const getTagType = (type: string) => {
  switch (type) {
    case 'birth':
      return 'success'
    case 'mating':
      return 'primary'
    case 'calving':
      return 'warning'
    default:
      return 'info'
  }
}

// 获取记录类型标签文本
const getRecordTypeLabel = (type: string) => {
  switch (type) {
    case 'birth':
      return '出生'
    case 'mating':
      return '配种'
    case 'calving':
      return '产犊'
    default:
      return '未知'
  }
}

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm')
}

// 查看记录详情
const viewRecord = (record: BreedingRecord) => {
  selectedRecord.value = record
  showDetailDialog.value = true
}

// 编辑记录
const editRecord = (record: BreedingRecord) => {
  editingRecord.value = record
  Object.assign(recordForm, {
    record_type: record.record_type,
    record_date: record.record_date,
    birth_date: record.birth_date || '',
    mating_date: record.mating_date || '',
    calving_date: record.calving_date || '',
    mother_ear_tag: record.mother?.ear_tag || record.mother_ear_tag || '',
    calf_ear_tag: record.calf?.ear_tag || record.calf_ear_tag || '',
    gender: record.gender || 'male',
    bull_info: record.bull_info || '',
    calving_details: record.calving_details || '',
    description: record.description || ''
  })
  showAddDialog.value = true
}

// 删除记录
const deleteRecord = async (record: BreedingRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条${getRecordTypeLabel(record.record_type)}记录吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 调用删除API
    await cattleServiceApi.delete(`/cattle/events/${record.id}`)
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
    
    // 构建事件数据
    const eventData: any = {
      event_type: recordForm.record_type,
      event_date: recordForm.record_date,
      description: recordForm.description,
      data: {
        birth_date: recordForm.birth_date,
        mating_date: recordForm.mating_date,
        calving_date: recordForm.calving_date,
        mother_ear_tag: recordForm.mother_ear_tag,
        calf_ear_tag: recordForm.calf_ear_tag,
        gender: recordForm.gender,
        bull_info: recordForm.bull_info,
        calving_details: recordForm.calving_details
      }
    }
    
    if (editingRecord.value) {
      // 更新记录
      await cattleServiceApi.put(`/cattle/events/${editingRecord.value.id}`, eventData)
      ElMessage.success('更新成功')
    } else {
      // 添加记录
      await cattleServiceApi.addCattleEvent(props.cattleId, eventData)
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
    record_type: 'birth',
    record_date: '',
    birth_date: '',
    mating_date: '',
    calving_date: '',
    mother_ear_tag: '',
    calf_ear_tag: '',
    gender: 'male',
    bull_info: '',
    calving_details: '',
    description: ''
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
.breeding-records {
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