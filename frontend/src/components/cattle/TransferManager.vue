<template>
  <div class="transfer-manager">
    <!-- 转群历史 -->
    <div class="transfer-history">
      <div class="section-header">
        <h3>转群历史</h3>
        <el-button type="primary" @click="showTransferDialog = true">
          <el-icon><Plus /></el-icon>
          新增转群记录
        </el-button>
      </div>

      <el-timeline v-if="transfers.length > 0">
        <el-timeline-item
          v-for="transfer in transfers"
          :key="transfer.id"
          :timestamp="formatDateTime(transfer.transfer_date)"
          placement="top"
        >
          <el-card class="transfer-card">
            <div class="transfer-header">
              <h4>{{ getTransferTitle(transfer) }}</h4>
              <el-tag :type="getTransferType(transfer.status)" size="small">
                {{ getTransferStatusText(transfer.status) }}
              </el-tag>
            </div>
            
            <div class="transfer-content">
              <div class="transfer-route">
                <div class="route-item">
                  <span class="route-label">源位置:</span>
                  <span class="route-value">
                    {{ transfer.from_base?.name || '未知基地' }} - 
                    {{ transfer.from_barn?.name || '未知牛棚' }}
                  </span>
                </div>
                <el-icon class="route-arrow"><ArrowRight /></el-icon>
                <div class="route-item">
                  <span class="route-label">目标位置:</span>
                  <span class="route-value">
                    {{ transfer.to_base?.name || '未知基地' }} - 
                    {{ transfer.to_barn?.name || '未知牛棚' }}
                  </span>
                </div>
              </div>
              
              <div class="transfer-details">
                <p v-if="transfer.reason"><strong>转群原因:</strong> {{ transfer.reason }}</p>
                <p v-if="transfer.notes"><strong>备注:</strong> {{ transfer.notes }}</p>
                <p><strong>操作员:</strong> {{ transfer.operator?.real_name || '未知' }}</p>
              </div>
            </div>
            
            <div class="transfer-actions">
              <el-button size="small" @click="viewTransferDetail(transfer)">
                详情
              </el-button>
              <el-button
                v-if="transfer.status === 'pending'"
                size="small"
                type="success"
                @click="confirmTransfer(transfer)"
              >
                确认转群
              </el-button>
              <el-button
                v-if="transfer.status === 'pending'"
                size="small"
                type="danger"
                @click="cancelTransfer(transfer)"
              >
                取消转群
              </el-button>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      
      <el-empty v-else description="暂无转群记录" />
    </div>

    <!-- 新增转群对话框 -->
    <el-dialog
      v-model="showTransferDialog"
      title="新增转群记录"
      width="600px"
      @close="resetTransferForm"
    >
      <el-form
        ref="transferFormRef"
        :model="transferForm"
        :rules="transferRules"
        label-width="120px"
      >
        <el-form-item label="转群日期" prop="transfer_date">
          <el-date-picker
            v-model="transferForm.transfer_date"
            type="datetime"
            placeholder="选择转群日期"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="源基地" prop="from_base_id">
          <el-select
            v-model="transferForm.from_base_id"
            placeholder="请选择源基地"
            style="width: 100%"
            @change="handleFromBaseChange"
          >
            <el-option
              v-for="base in bases"
              :key="base.id"
              :label="base.name"
              :value="base.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="源牛棚" prop="from_barn_id">
          <el-select
            v-model="transferForm.from_barn_id"
            placeholder="请选择源牛棚"
            style="width: 100%"
            :disabled="!transferForm.from_base_id"
          >
            <el-option
              v-for="barn in fromBarns"
              :key="barn.id"
              :label="`${barn.name} (${barn.code})`"
              :value="barn.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="目标基地" prop="to_base_id">
          <el-select
            v-model="transferForm.to_base_id"
            placeholder="请选择目标基地"
            style="width: 100%"
            @change="handleToBaseChange"
          >
            <el-option
              v-for="base in bases"
              :key="base.id"
              :label="base.name"
              :value="base.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="目标牛棚" prop="to_barn_id">
          <el-select
            v-model="transferForm.to_barn_id"
            placeholder="请选择目标牛棚"
            style="width: 100%"
            :disabled="!transferForm.to_base_id"
          >
            <el-option
              v-for="barn in toBarns"
              :key="barn.id"
              :label="`${barn.name} (${barn.code}) - 容量: ${barn.current_count}/${barn.capacity}`"
              :value="barn.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="转群原因" prop="reason">
          <el-select v-model="transferForm.reason" placeholder="请选择转群原因" style="width: 100%">
            <el-option label="正常调配" value="normal_allocation" />
            <el-option label="健康隔离" value="health_isolation" />
            <el-option label="治疗需要" value="treatment_required" />
            <el-option label="繁殖管理" value="breeding_management" />
            <el-option label="饲养阶段调整" value="feeding_stage_adjustment" />
            <el-option label="设施维护" value="facility_maintenance" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="transferForm.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showTransferDialog = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitTransfer">
            提交
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 转群详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="转群详情" width="500px">
      <div v-if="selectedTransfer" class="transfer-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="转群日期">
            {{ formatDateTime(selectedTransfer.transfer_date) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getTransferType(selectedTransfer.status)">
              {{ getTransferStatusText(selectedTransfer.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="源基地">
            {{ selectedTransfer.from_base?.name || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="源牛棚">
            {{ selectedTransfer.from_barn?.name || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="目标基地">
            {{ selectedTransfer.to_base?.name || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="目标牛棚">
            {{ selectedTransfer.to_barn?.name || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="转群原因">
            {{ selectedTransfer.reason || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="备注">
            {{ selectedTransfer.notes || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="操作员">
            {{ selectedTransfer.operator?.real_name || '未知' }}
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">
            {{ formatDateTime(selectedTransfer.created_at) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, ArrowRight } from '@element-plus/icons-vue'
import { baseApi, type Base, type Barn } from '@/api/base'
import dayjs from 'dayjs'

interface Props {
  cattleId: number
}

interface Transfer {
  id: number
  cattle_id: number
  transfer_date: string
  from_base_id?: number
  from_barn_id?: number
  to_base_id: number
  to_barn_id: number
  reason?: string
  notes?: string
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
  from_base?: Base
  from_barn?: Barn
  to_base?: Base
  to_barn?: Barn
  operator?: {
    id: number
    real_name: string
  }
}

const props = defineProps<Props>()

const transferFormRef = ref<FormInstance>()
const showTransferDialog = ref(false)
const showDetailDialog = ref(false)
const submitting = ref(false)
const selectedTransfer = ref<Transfer | null>(null)

const transfers = ref<Transfer[]>([])
const bases = ref<Base[]>([])
const fromBarns = ref<Barn[]>([])
const toBarns = ref<Barn[]>([])

const transferForm = reactive({
  transfer_date: '',
  from_base_id: undefined as number | undefined,
  from_barn_id: undefined as number | undefined,
  to_base_id: undefined as number | undefined,
  to_barn_id: undefined as number | undefined,
  reason: '',
  notes: ''
})

const transferRules: FormRules = {
  transfer_date: [
    { required: true, message: '请选择转群日期', trigger: 'change' }
  ],
  to_base_id: [
    { required: true, message: '请选择目标基地', trigger: 'change' }
  ],
  to_barn_id: [
    { required: true, message: '请选择目标牛棚', trigger: 'change' }
  ],
  reason: [
    { required: true, message: '请选择转群原因', trigger: 'change' }
  ]
}

// 加载转群记录
const loadTransfers = async () => {
  try {
    // 这里需要实现获取转群记录的API
    // const response = await cattleApi.getTransferHistory(props.cattleId)
    // transfers.value = response.data || []
    
    // 模拟数据
    transfers.value = [
      {
        id: 1,
        cattle_id: props.cattleId,
        transfer_date: '2024-01-15 10:30:00',
        from_base_id: 1,
        from_barn_id: 1,
        to_base_id: 1,
        to_barn_id: 2,
        reason: '正常调配',
        notes: '从育肥棚转移到繁殖棚',
        status: 'completed',
        created_at: '2024-01-15 10:00:00',
        updated_at: '2024-01-15 10:30:00',
        from_base: { id: 1, name: '主基地', code: 'BASE001' } as Base,
        from_barn: { id: 1, name: '育肥棚A', code: 'BARN001' } as Barn,
        to_base: { id: 1, name: '主基地', code: 'BASE001' } as Base,
        to_barn: { id: 2, name: '繁殖棚B', code: 'BARN002' } as Barn,
        operator: { id: 1, real_name: '张三' }
      }
    ]
  } catch (error) {
    console.error('加载转群记录失败:', error)
    ElMessage.error('加载转群记录失败')
  }
}

// 加载基地列表
const loadBases = async () => {
  try {
    const response = await baseApi.getBases()
    bases.value = response.data.bases || []
  } catch (error) {
    console.error('加载基地列表失败:', error)
    ElMessage.error('加载基地列表失败')
  }
}

// 处理源基地变更
const handleFromBaseChange = async (baseId: number) => {
  transferForm.from_barn_id = undefined
  fromBarns.value = []
  
  if (baseId) {
    try {
      const barns = await baseApi.getBarnsByBaseId(baseId)
      fromBarns.value = barns || []
    } catch (error) {
      console.error('加载源牛棚列表失败:', error)
      ElMessage.error('加载源牛棚列表失败')
    }
  }
}

// 处理目标基地变更
const handleToBaseChange = async (baseId: number) => {
  transferForm.to_barn_id = undefined
  toBarns.value = []
  
  if (baseId) {
    try {
      const barns = await baseApi.getBarnsByBaseId(baseId)
      toBarns.value = barns || []
    } catch (error) {
      console.error('加载目标牛棚列表失败:', error)
      ElMessage.error('加载目标牛棚列表失败')
    }
  }
}

// 获取转群标题
const getTransferTitle = (transfer: Transfer) => {
  const fromLocation = `${transfer.from_base?.name || '未知基地'} - ${transfer.from_barn?.name || '未知牛棚'}`
  const toLocation = `${transfer.to_base?.name || '未知基地'} - ${transfer.to_barn?.name || '未知牛棚'}`
  return `${fromLocation} → ${toLocation}`
}

// 获取转群状态类型
const getTransferType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'warning',
    completed: 'success',
    cancelled: 'danger'
  }
  return typeMap[status] || 'info'
}

// 获取转群状态文本
const getTransferStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待确认',
    completed: '已完成',
    cancelled: '已取消'
  }
  return textMap[status] || '未知'
}

// 格式化日期时间
const formatDateTime = (dateTime: string) => {
  return dayjs(dateTime).format('YYYY-MM-DD HH:mm')
}

// 查看转群详情
const viewTransferDetail = (transfer: Transfer) => {
  selectedTransfer.value = transfer
  showDetailDialog.value = true
}

// 确认转群
const confirmTransfer = async (transfer: Transfer) => {
  try {
    await ElMessageBox.confirm(
      '确定要确认这次转群吗？',
      '确认转群',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里需要实现确认转群的API
    transfer.status = 'completed'
    ElMessage.success('转群已确认')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('确认转群失败')
    }
  }
}

// 取消转群
const cancelTransfer = async (transfer: Transfer) => {
  try {
    await ElMessageBox.confirm(
      '确定要取消这次转群吗？',
      '取消转群',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里需要实现取消转群的API
    transfer.status = 'cancelled'
    ElMessage.success('转群已取消')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('取消转群失败')
    }
  }
}

// 提交转群记录
const submitTransfer = async () => {
  if (!transferFormRef.value) return
  
  try {
    await transferFormRef.value.validate()
    submitting.value = true
    
    // 这里需要实现创建转群记录的API
    // await cattleApi.createTransferRecord(props.cattleId, transferForm)
    
    ElMessage.success('转群记录已提交')
    showTransferDialog.value = false
    loadTransfers()
  } catch (error) {
    console.error('提交转群记录失败:', error)
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

// 重置转群表单
const resetTransferForm = () => {
  Object.assign(transferForm, {
    transfer_date: '',
    from_base_id: undefined,
    from_barn_id: undefined,
    to_base_id: undefined,
    to_barn_id: undefined,
    reason: '',
    notes: ''
  })
  fromBarns.value = []
  toBarns.value = []
  transferFormRef.value?.resetFields()
}

onMounted(() => {
  loadTransfers()
  loadBases()
})
</script>

<style scoped>
.transfer-manager {
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h3 {
  margin: 0;
  color: #303133;
}

.transfer-card {
  margin-bottom: 0;
}

.transfer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.transfer-header h4 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.transfer-content {
  margin-bottom: 15px;
}

.transfer-route {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 6px;
}

.route-item {
  flex: 1;
}

.route-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.route-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.route-arrow {
  color: #409EFF;
  font-size: 18px;
}

.transfer-details p {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}

.transfer-actions {
  display: flex;
  gap: 8px;
}

.transfer-detail {
  padding: 10px 0;
}

.dialog-footer {
  text-align: right;
}
</style>