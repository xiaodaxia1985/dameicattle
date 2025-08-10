<template>
  <div class="transfer-manager">
    <div class="manager-header">
      <div class="header-left">
        <h3>转群管理</h3>
        <p>管理牛只在不同基地和牛棚之间的转移</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showTransferDialog = true">
          <el-icon><Switch /></el-icon>
          转群操作
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="transfer-records">
      <el-table :data="transfers" stripe>
        <el-table-column prop="transfer_date" label="转移日期" width="120">
          <template #default="{ row }">
            {{ formatDate(row.transfer_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="transfer_type" label="转移类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTransferTypeTag(row.transfer_type)">
              {{ getTransferTypeName(row.transfer_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="from_location" label="源位置" width="200">
          <template #default="{ row }">
            <div v-if="row.from_base || row.from_barn">
              <div>{{ row.from_base?.name || '-' }}</div>
              <div class="location-sub">{{ row.from_barn?.name || '-' }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="to_location" label="目标位置" width="200">
          <template #default="{ row }">
            <div v-if="row.to_base || row.to_barn">
              <div>{{ row.to_base?.name || '-' }}</div>
              <div class="location-sub">{{ row.to_barn?.name || '-' }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="转移原因" min-width="150" />
        <el-table-column prop="operator" label="操作人" width="100">
          <template #default="{ row }">
            {{ row.operator?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)">
              {{ getStatusName(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button size="small" text @click="viewTransferDetail(row)">
              <el-icon><View /></el-icon>
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-if="transfers.length === 0" description="暂无转群记录" />
    </div>

    <!-- 转群操作对话框 -->
    <el-dialog
      v-model="showTransferDialog"
      title="转群操作"
      width="600px"
      @close="resetTransferForm"
    >
      <el-form
        ref="transferFormRef"
        :model="transferForm"
        :rules="transferFormRules"
        label-width="100px"
      >
        <el-form-item label="转移类型" prop="transfer_type">
          <el-select v-model="transferForm.transfer_type" placeholder="请选择转移类型" style="width: 100%">
            <el-option label="基地内转棚" value="barn_transfer" />
            <el-option label="跨基地转移" value="base_transfer" />
            <el-option label="临时隔离" value="isolation" />
            <el-option label="治疗转移" value="treatment" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="目标基地" prop="target_base_id">
          <el-select 
            v-model="transferForm.target_base_id" 
            placeholder="请选择目标基地" 
            style="width: 100%"
            @change="handleBaseChange"
          >
            <el-option
              v-for="base in availableBases"
              :key="base.id"
              :label="base.name"
              :value="base.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="目标牛棚" prop="target_barn_id">
          <el-select 
            v-model="transferForm.target_barn_id" 
            placeholder="请选择目标牛棚" 
            style="width: 100%"
            :disabled="!transferForm.target_base_id"
          >
            <el-option
              v-for="barn in availableBarns"
              :key="barn.id"
              :label="`${barn.name} (${barn.current_count}/${barn.capacity})`"
              :value="barn.id"
              :disabled="barn.current_count >= barn.capacity"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="转移日期" prop="transfer_date">
          <el-date-picker
            v-model="transferForm.transfer_date"
            type="date"
            placeholder="选择转移日期"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="转移原因" prop="reason">
          <el-input
            v-model="transferForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入转移原因"
          />
        </el-form-item>
        
        <el-form-item label="备注">
          <el-input
            v-model="transferForm.notes"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息（可选）"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showTransferDialog = false">取消</el-button>
        <el-button type="primary" @click="handleTransfer" :loading="submitting">确定转群</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Switch, View } from '@element-plus/icons-vue'
import { cattleApi } from '@/api/cattle'
import { baseApi } from '@/api/base'
import dayjs from 'dayjs'

interface Props {
  cattleId: number
}

const props = defineProps<Props>()

const loading = ref(false)
const submitting = ref(false)
const transfers = ref<any[]>([])
const availableBases = ref<any[]>([])
const availableBarns = ref<any[]>([])
const showTransferDialog = ref(false)

const transferForm = reactive({
  transfer_type: '',
  target_base_id: null,
  target_barn_id: null,
  transfer_date: '',
  reason: '',
  notes: ''
})

const transferFormRules = {
  transfer_type: [{ required: true, message: '请选择转移类型', trigger: 'change' }],
  target_base_id: [{ required: true, message: '请选择目标基地', trigger: 'change' }],
  target_barn_id: [{ required: true, message: '请选择目标牛棚', trigger: 'change' }],
  transfer_date: [{ required: true, message: '请选择转移日期', trigger: 'change' }],
  reason: [{ required: true, message: '请输入转移原因', trigger: 'blur' }]
}

const transferFormRef = ref()

onMounted(() => {
  loadTransferRecords()
  loadAvailableBases()
})

const loadTransferRecords = async () => {
  try {
    loading.value = true
    const response = await cattleApi.getCattleTransfers(props.cattleId)
    transfers.value = response.data || []
  } catch (error) {
    console.error('加载转群记录失败:', error)
    ElMessage.error('加载转群记录失败')
  } finally {
    loading.value = false
  }
}

const loadAvailableBases = async () => {
  try {
    const response = await baseApi.getBases()
    availableBases.value = response.data || []
  } catch (error) {
    console.error('加载基地列表失败:', error)
  }
}

const handleBaseChange = async () => {
  if (!transferForm.target_base_id) {
    availableBarns.value = []
    return
  }
  
  try {
    const response = await baseApi.getBarnsByBaseId(transferForm.target_base_id)
    availableBarns.value = response.data?.barns || []
  } catch (error) {
    console.error('加载牛棚列表失败:', error)
    availableBarns.value = []
  }
}

const handleTransfer = async () => {
  try {
    await transferFormRef.value?.validate()
    
    await ElMessageBox.confirm(
      '确定要执行转群操作吗？转群后牛只将移动到新的位置。',
      '确认转群',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    submitting.value = true
    
    const transferData = {
      transfer_type: transferForm.transfer_type,
      target_base_id: transferForm.target_base_id,
      target_barn_id: transferForm.target_barn_id,
      transfer_date: dayjs(transferForm.transfer_date).format('YYYY-MM-DD'),
      reason: transferForm.reason,
      notes: transferForm.notes
    }
    
    await cattleApi.transferCattle(props.cattleId, transferData)
    
    ElMessage.success('转群操作成功')
    showTransferDialog.value = false
    resetTransferForm()
    loadTransferRecords()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('转群操作失败:', error)
      ElMessage.error('转群操作失败')
    }
  } finally {
    submitting.value = false
  }
}

const resetTransferForm = () => {
  Object.assign(transferForm, {
    transfer_type: '',
    target_base_id: null,
    target_barn_id: null,
    transfer_date: '',
    reason: '',
    notes: ''
  })
  availableBarns.value = []
  transferFormRef.value?.resetFields()
}

const viewTransferDetail = (transfer: any) => {
  ElMessageBox.alert(
    `<div>
      <p><strong>转移类型:</strong> ${getTransferTypeName(transfer.transfer_type)}</p>
      <p><strong>转移日期:</strong> ${formatDate(transfer.transfer_date)}</p>
      <p><strong>源位置:</strong> ${transfer.from_base?.name || '-'} - ${transfer.from_barn?.name || '-'}</p>
      <p><strong>目标位置:</strong> ${transfer.to_base?.name || '-'} - ${transfer.to_barn?.name || '-'}</p>
      <p><strong>转移原因:</strong> ${transfer.reason || '-'}</p>
      <p><strong>状态:</strong> ${getStatusName(transfer.status)}</p>
      <p><strong>操作人:</strong> ${transfer.operator?.name || '-'}</p>
      ${transfer.notes ? `<p><strong>备注:</strong> ${transfer.notes}</p>` : ''}
    </div>`,
    '转群详情',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定'
    }
  )
}

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD')
}

const getTransferTypeName = (type: string) => {
  const nameMap: Record<string, string> = {
    barn_transfer: '基地内转棚',
    base_transfer: '跨基地转移',
    isolation: '临时隔离',
    treatment: '治疗转移'
  }
  return nameMap[type] || type
}

const getTransferTypeTag = (type: string) => {
  const tagMap: Record<string, string> = {
    barn_transfer: 'info',
    base_transfer: 'warning',
    isolation: 'danger',
    treatment: 'warning'
  }
  return tagMap[type] || 'info'
}

const getStatusName = (status: string) => {
  const nameMap: Record<string, string> = {
    pending: '待执行',
    completed: '已完成',
    cancelled: '已取消'
  }
  return nameMap[status] || status
}

const getStatusTag = (status: string) => {
  const tagMap: Record<string, string> = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'info'
  }
  return tagMap[status] || 'info'
}
</script>

<style scoped>
.transfer-manager {
  padding: 20px;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.header-left p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.transfer-records {
  min-height: 400px;
}

.location-sub {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}
</style>