<template>
  <div class="transfer-records">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="showAddDialog = true" v-if="!readOnly">
        <el-icon><Plus /></el-icon>
        添加记录
      </el-button>
      <el-input
        v-model="searchQuery"
        placeholder="搜索栏舍名称"
        prefix-icon="Search"
        style="width: 200px"
        @keypress.enter="loadRecords"
      />
      <el-button type="default" @click="loadRecords">搜索</el-button>
    </div>

    <!-- 记录列表 -->
    <div class="records-list" v-loading="loading">
      <el-table v-if="records.length > 0" :data="records" style="width: 100%">
        <el-table-column prop="transfer_date" label="转群日期" width="180" />
        <el-table-column prop="from_barn.name" label="转出栏舍" width="150" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.from_barn?.name || scope.row.from_barn_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="to_barn.name" label="转入栏舍" width="150" show-overflow-tooltip>
          <template #default="scope">
            {{ scope.row.to_barn?.name || scope.row.to_barn_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="transfer_reason" label="转群原因" width="180" show-overflow-tooltip />
        <el-table-column prop="description" label="备注" show-overflow-tooltip />
        <el-table-column prop="operator.real_name" label="操作员" width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button size="small" text @click="viewRecord(scope.row)">详情</el-button>
            <el-button size="small" text type="primary" @click="editRecord(scope.row)" v-if="!readOnly">编辑</el-button>
            <el-button size="small" text type="danger" @click="deleteRecord(scope.row)" v-if="!readOnly">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-else description="暂无转群记录" />
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
        <el-form-item label="转群日期" prop="transfer_date">
          <el-date-picker
            v-model="recordForm.transfer_date"
            type="datetime"
            placeholder="选择转群日期"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="转出栏舍" prop="from_barn_id">
          <el-select v-model="recordForm.from_barn_id" placeholder="请选择转出栏舍" style="width: 100%">
            <el-option v-for="barn in barns" :key="barn.id" :label="barn.name" :value="barn.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="转入栏舍" prop="to_barn_id">
          <el-select v-model="recordForm.to_barn_id" placeholder="请选择转入栏舍" style="width: 100%">
            <el-option v-for="barn in barns" :key="barn.id" :label="barn.name" :value="barn.id" />
          </el-select>
        </el-form-item>

        <el-form-item label="转群原因" prop="transfer_reason">
          <el-select v-model="recordForm.transfer_reason" placeholder="请选择转群原因" style="width: 100%">
            <el-option label="分群饲养" value="分群饲养" />
            <el-option label="疾病隔离" value="疾病隔离" />
            <el-option label="配种繁殖" value="配种繁殖" />
            <el-option label="育肥阶段" value="育肥阶段" />
            <el-option label="出栏准备" value="出栏准备" />
            <el-option label="其他原因" value="其他原因" />
          </el-select>
        </el-form-item>

        <el-form-item label="备注" prop="description">
          <el-input
            v-model="recordForm.description"
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
          <el-descriptions-item label="转群日期">
            {{ formatDateTime(selectedRecord.transfer_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="转出栏舍">
            <div v-if="selectedRecord.from_barn">
              <div>名称: {{ selectedRecord.from_barn.name }}</div>
              <div v-if="selectedRecord.from_barn.location">位置: {{ selectedRecord.from_barn.location }}</div>
            </div>
            <span v-else>{{ selectedRecord.from_barn_name || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="转入栏舍">
            <div v-if="selectedRecord.to_barn">
              <div>名称: {{ selectedRecord.to_barn.name }}</div>
              <div v-if="selectedRecord.to_barn.location">位置: {{ selectedRecord.to_barn.location }}</div>
            </div>
            <span v-else>{{ selectedRecord.to_barn_name || '-' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="转群原因">
            {{ selectedRecord.transfer_reason || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="备注">
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
import { Plus, Search } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import { cattleServiceApi } from '@/api/microservices'

// 定义栏舍类型
interface Barn {
  id: number
  name: string
  location?: string
  capacity?: number
  current_count?: number
}

// 定义转群记录类型
interface TransferRecord {
  id: number
  cattle_id: number
  transfer_date: string
  from_barn_id: number
  to_barn_id: number
  transfer_reason: string
  description?: string
  operator_id?: number
  created_at: string
  updated_at: string
  from_barn?: Barn
  to_barn?: Barn
  from_barn_name?: string
  to_barn_name?: string
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
const editingRecord = ref<TransferRecord | null>(null)
const selectedRecord = ref<TransferRecord | null>(null)
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(20)

// 模拟栏舍数据
const barns = ref<Barn[]>([
  { id: 1, name: '育成舍A', location: '东区1栋', capacity: 50, current_count: 38 },
  { id: 2, name: '育成舍B', location: '东区2栋', capacity: 50, current_count: 42 },
  { id: 3, name: '育肥舍A', location: '西区1栋', capacity: 60, current_count: 55 },
  { id: 4, name: '育肥舍B', location: '西区2栋', capacity: 60, current_count: 48 },
  { id: 5, name: '繁殖舍', location: '南区1栋', capacity: 40, current_count: 35 },
  { id: 6, name: '隔离舍', location: '北区1栋', capacity: 20, current_count: 5 }
])

const records = ref<TransferRecord[]>([])
const pagination = ref({
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0
})

const recordForm = reactive({
  transfer_date: '',
  from_barn_id: 0,
  to_barn_id: 0,
  transfer_reason: '分群饲养',
  description: ''
})

// 验证转出和转入栏舍不能相同
const validateDifferentBarns = (rule: any, value: number, callback: (error?: Error | string) => void) => {
  if (recordForm.from_barn_id && recordForm.to_barn_id && recordForm.from_barn_id === recordForm.to_barn_id) {
    callback(new Error('转出栏舍和转入栏舍不能相同'))
  } else {
    callback()
  }
}

const recordRules: FormRules = {
  transfer_date: [
    { required: true, message: '请选择转群日期', trigger: 'change' }
  ],
  from_barn_id: [
    { required: true, message: '请选择转出栏舍', trigger: 'change' },
    { validator: validateDifferentBarns, trigger: 'change' }
  ],
  to_barn_id: [
    { required: true, message: '请选择转入栏舍', trigger: 'change' },
    { validator: validateDifferentBarns, trigger: 'change' }
  ],
  transfer_reason: [
    { required: true, message: '请选择转群原因', trigger: 'change' }
  ],
  description: [
    { min: 0, max: 500, message: '备注不能超过 500 个字符', trigger: 'blur' }
  ]
}

// 加载记录列表
const loadRecords = async () => {
  loading.value = true
  try {
    // 调用API获取所有事件，然后筛选出转群相关的事件
    const response = await cattleServiceApi.getCattleEvents(props.cattleId, {
      page: currentPage.value,
      limit: pageSize.value
    })
    
    // 将事件数据转换为转群记录格式
    // 检查response.data是否为数组，如果不是则使用空数组
    const eventsData = Array.isArray(response.data) ? response.data : []
    const transferRecords: TransferRecord[] = eventsData
      .filter((event: any) => event.event_type === 'transfer')
      .map((event: any) => {
        // 从data字段中提取相应的数据
        const data = event.data || {};
        
        return {
          id: event.id,
          cattle_id: event.cattle_id,
          transfer_date: event.event_date,
          from_barn_id: data.from_barn_id || 0,
          to_barn_id: data.to_barn_id || 0,
          transfer_reason: data.transfer_reason || '',
          description: event.description || '',
          operator_id: event.operator_id,
          created_at: event.created_at,
          updated_at: event.updated_at,
          from_barn: data.from_barn || undefined,
          to_barn: data.to_barn || undefined,
          from_barn_name: data.from_barn_name || '',
          to_barn_name: data.to_barn_name || '',
          operator: event.operator
        };
      });
    
    // 应用搜索
    let filteredRecords = transferRecords;
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filteredRecords = transferRecords.filter(record => 
        (record.from_barn?.name?.toLowerCase().includes(query) || 
         record.to_barn?.name?.toLowerCase().includes(query) ||
         record.from_barn_name?.toLowerCase().includes(query) ||
         record.to_barn_name?.toLowerCase().includes(query))
      );
    }
    
    records.value = filteredRecords;
    pagination.value = response.pagination || {
      total: filteredRecords.length,
      page: currentPage.value,
      limit: pageSize.value,
      totalPages: Math.ceil(filteredRecords.length / pageSize.value)
    };
    
  } catch (error) {
    console.error('加载转群记录失败:', error);
    ElMessage.error('加载转群记录失败');
  } finally {
    loading.value = false;
  }
}

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm')
}

// 查看记录详情
const viewRecord = (record: TransferRecord) => {
  selectedRecord.value = record
  showDetailDialog.value = true
}

// 编辑记录
const editRecord = (record: TransferRecord) => {
  editingRecord.value = record
  Object.assign(recordForm, {
    transfer_date: record.transfer_date,
    from_barn_id: record.from_barn_id,
    to_barn_id: record.to_barn_id,
    transfer_reason: record.transfer_reason,
    description: record.description || ''
  })
  showAddDialog.value = true
}

// 删除记录
const deleteRecord = async (record: TransferRecord) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条转群记录吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await cattleServiceApi.delete(record.id)
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
      event_type: 'transfer',
      event_date: recordForm.transfer_date,
      description: recordForm.description,
      data: {
        from_barn_id: recordForm.from_barn_id,
        to_barn_id: recordForm.to_barn_id,
        transfer_reason: recordForm.transfer_reason
      }
    }
    
    if (editingRecord.value) {
      // 更新记录
      await cattleServiceApi.put(editingRecord.value.id, eventData)
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
    transfer_date: '',
    from_barn_id: 0,
    to_barn_id: 0,
    transfer_reason: '分群饲养',
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
.transfer-records {
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