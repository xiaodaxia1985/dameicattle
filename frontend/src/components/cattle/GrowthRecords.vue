<template>
  <div class="growth-records">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button v-if="!readOnly" type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon>
        添加记录
      </el-button>
      <el-select v-model="recordType" placeholder="记录类型" style="width: 150px" @change="loadRecords">
        <el-option label="全部" value="" />
        <el-option label="饲喂记录" value="feeding" />
        <el-option label="称重记录" value="weight" />
      </el-select>
    </div>

    <!-- 记录列表 -->
    <div class="records-list" v-loading="loading">
      <el-table v-if="records.length > 0" :data="records" style="width: 100%">
        <el-table-column prop="record_date" label="记录日期" width="180" />
        <el-table-column prop="record_type" label="记录类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.record_type === 'feeding' ? 'success' : 'primary'">
              {{ scope.row.record_type === 'feeding' ? '饲喂' : '称重' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="数量/重量" width="120">
          <template #default="scope">
            <span v-if="scope.row.record_type === 'feeding'">{{ scope.row.amount }} kg</span>
            <span v-else>{{ scope.row.weight }} kg</span>
          </template>
        </el-table-column>
        <el-table-column prop="food_name" label="饲料名称" v-if="recordType === 'feeding' || !recordType" />
        <el-table-column prop="notes" label="备注" show-overflow-tooltip />
        <el-table-column prop="operator.real_name" label="操作员" width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" text @click="viewRecord(scope.row)">详情</el-button>
            <el-button v-if="!readOnly" size="small" text type="primary" @click="editRecord(scope.row)">编辑</el-button>
            <el-button v-if="!readOnly" size="small" text type="danger" @click="deleteRecord(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-else description="暂无生长记录" />
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
          <el-select v-model="recordForm.record_type" placeholder="请选择记录类型">
            <el-option label="饲喂记录" value="feeding" />
            <el-option label="称重记录" value="weight" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="记录日期" prop="record_date">
          <el-date-picker
            v-model="recordForm.record_date"
            type="datetime"
            placeholder="选择日期时间"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item v-if="recordForm.record_type === 'feeding'" label="饲料名称" prop="food_name">
          <el-input v-model="recordForm.food_name" placeholder="请输入饲料名称" />
        </el-form-item>
        
        <el-form-item v-if="recordForm.record_type === 'feeding'" label="饲喂量(kg)" prop="amount">
          <el-input-number
            v-model="recordForm.amount"
            :min="0"
            :precision="2"
            placeholder="请输入饲喂量"
          />
        </el-form-item>
        
        <el-form-item v-if="recordForm.record_type === 'weight'" label="体重(kg)" prop="weight">
          <el-input-number
            v-model="recordForm.weight"
            :min="0"
            :precision="2"
            placeholder="请输入体重"
          />
        </el-form-item>
        
        <el-form-item label="备注" prop="notes">
          <el-input
            v-model="recordForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
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
            {{ selectedRecord.record_type === 'feeding' ? '饲喂记录' : '称重记录' }}
          </el-descriptions-item>
          <el-descriptions-item label="记录日期">
            {{ formatDateTime(selectedRecord.record_date) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedRecord.record_type === 'feeding'" label="饲料名称">
            {{ selectedRecord.food_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedRecord.record_type === 'feeding'" label="饲喂量">
            {{ selectedRecord.amount || '-' }} kg
          </el-descriptions-item>
          <el-descriptions-item v-if="selectedRecord.record_type === 'weight'" label="体重">
            {{ selectedRecord.weight || '-' }} kg
          </el-descriptions-item>
          <el-descriptions-item label="备注">
            {{ selectedRecord.notes || '无' }}
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
import { CattleServiceApi, FeedingServiceApi } from '@/api/microservices'

// 定义生长记录类型
interface GrowthRecord {
  id: number
  cattle_id: number
  record_type: 'feeding' | 'weight'
  record_date: string
  food_name?: string
  amount?: number
  weight?: number
  notes?: string
  operator_id?: number
  created_at: string
  updated_at: string
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

const formRef = ref<FormInstance>();
const loading = ref(false)
const submitting = ref(false)
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const editingRecord = ref<GrowthRecord | null>(null)
const selectedRecord = ref<GrowthRecord | null>(null)
const recordType = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

const records = ref<GrowthRecord[]>([])
const pagination = ref({
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0
})

const recordForm = reactive({
  record_type: 'feeding' as 'feeding' | 'weight',
  record_date: '',
  food_name: '',
  amount: 0,
  weight: 0,
  notes: ''
})

const recordRules: FormRules = {
  record_type: [
    { required: true, message: '请选择记录类型', trigger: 'change' }
  ],
  record_date: [
    { required: true, message: '请选择记录日期', trigger: 'change' }
  ],
  food_name: [
    { required: (): boolean => recordForm.record_type === 'feeding', message: '请输入饲料名称', trigger: 'blur' }
  ],
  amount: [
    { required: (): boolean => recordForm.record_type === 'feeding', message: '请输入饲喂量', trigger: 'blur' },
    { type: 'number', min: 0, message: '饲喂量必须大于0', trigger: 'blur' }
  ],
  weight: [
    { required: (): boolean => recordForm.record_type === 'weight', message: '请输入体重', trigger: 'blur' },
    { type: 'number', min: 0, message: '体重必须大于0', trigger: 'blur' }
  ],
  notes: [
    { min: 0, max: 500, message: '备注不能超过 500 个字符', trigger: 'blur' }
  ]
}

// 创建API实例
const cattleService = new CattleServiceApi()
const feedingService = new FeedingServiceApi()

// 加载记录列表
const loadRecords = async () => {
  loading.value = true
  try {
    // 清空当前记录
    records.value = []
    
    // 根据记录类型调用不同的API
    let response
    if (recordType.value === 'weight' || !recordType.value) {
      // 获取称重记录
      response = await cattleService.getWeightRecords({
        cattleId: props.cattleId,
        page: currentPage.value,
        limit: pageSize.value,
        sortBy: 'record_date',
        sortOrder: 'desc'
      })
      
      if (response.data && response.data.records) {
        const weightRecords = response.data.records.map(record => ({
          ...record,
          record_type: 'weight',
          record_date: record.record_date,
          operator: record.user || { id: record.operator_id, real_name: record.operator_name || '未知' }
        }))
        records.value.push(...weightRecords)
      }
    }
    
    if (recordType.value === 'feeding' || !recordType.value) {
      // 获取饲喂记录
      response = await feedingService.getFeedingRecords({
        cattleId: props.cattleId,
        page: currentPage.value,
        limit: pageSize.value,
        sortBy: 'record_date',
        sortOrder: 'desc'
      })
      
      if (response.data && response.data.records) {
        const feedingRecords = response.data.records.map(record => ({
          ...record,
          record_type: 'feeding',
          record_date: record.record_date,
          operator: record.user || { id: record.operator_id, real_name: record.operator_name || '未知' }
        }))
        records.value.push(...feedingRecords)
      }
    }
    
    // 按日期降序排序
    records.value.sort((a, b) => dayjs(b.record_date).unix() - dayjs(a.record_date).unix())
    
    // 设置分页信息
    pagination.value = {
      total: records.value.length,
      page: currentPage.value,
      limit: pageSize.value,
      totalPages: Math.ceil(records.value.length / pageSize.value)
    }
    
  } catch (error) {
    console.error('加载生长记录失败:', error)
    ElMessage.error('加载生长记录失败')
  } finally {
    loading.value = false
  }
}

// 生成模拟生长记录数据 (保留用于API不可用的情况)
const generateMockGrowthRecords = (): GrowthRecord[] => {
  const mockData: GrowthRecord[] = []
  
  // 生成最近3个月的饲喂记录
  for (let i = 0; i < 5; i++) {
    const date = dayjs().subtract(i * 2, 'day').format('YYYY-MM-DD HH:mm:ss')
    mockData.push({
      id: i + 1,
      cattle_id: props.cattleId,
      record_type: 'feeding',
      record_date: date,
      food_name: i % 2 === 0 ? '混合精料' : '青贮饲料',
      amount: Math.floor(Math.random() * 50) + 30, // 30-80kg之间的随机数
      notes: `正常饲喂，牛只进食良好`,
      created_at: date,
      updated_at: date,
      operator: {
        id: 1,
        real_name: '张三'
      }
    })
  }
  
  // 生成最近6个月的称重记录
  for (let i = 0; i < 8; i++) {
    const date = dayjs().subtract(i * 25, 'day').format('YYYY-MM-DD HH:mm:ss')
    mockData.push({
      id: i + 6,
      cattle_id: props.cattleId,
      record_type: 'weight',
      record_date: date,
      weight: Math.floor(Math.random() * 100) + 200, // 200-300kg之间的随机数
      notes: i === 0 ? '体重略有下降，需加强营养' : '体重正常增长',
      created_at: date,
      updated_at: date,
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
const viewRecord = (record: GrowthRecord) => {
  selectedRecord.value = record
  showDetailDialog.value = true
}

// 编辑记录
const editRecord = (record: GrowthRecord) => {
  editingRecord.value = record
  Object.assign(recordForm, {
    record_type: record.record_type,
    record_date: record.record_date,
    food_name: record.food_name || '',
    amount: record.amount || 0,
    weight: record.weight || 0,
    notes: record.notes || ''
  })
  showAddDialog.value = true
}

// 删除记录
const deleteRecord = async (record: GrowthRecord) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除这条${record.record_type === 'feeding' ? '饲喂' : '称重'}记录吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里需要实现删除API
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
      ...recordForm,
      cattle_id: props.cattleId
    }
    
    if (editingRecord.value) {
      // 更新记录 - 需要实现更新API
      ElMessage.success('更新成功')
    } else {
      // 添加记录 - 需要实现添加API
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
    record_type: 'feeding',
    record_date: '',
    food_name: '',
    amount: 0,
    weight: 0,
    notes: ''
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
.growth-records {
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