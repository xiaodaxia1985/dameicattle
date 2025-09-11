<template>
  <el-dialog
    v-model="dialogVisible"
    title="批量转群"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="transfer-container">
      <!-- 选中牛只信息 -->
      <div class="selected-cattle">
        <h4>已选择 {{ cattleIds.length }} 头牛只</h4>
        <el-tag v-for="id in cattleIds" :key="id" class="cattle-tag">
          ID: {{ id }}
        </el-tag>
      </div>

      <!-- 转群表单 -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        @submit.prevent
      >
        <el-form-item label="源基地" prop="from_base_id">
          <el-select
            v-model="form.from_base_id"
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
            v-model="form.from_barn_id"
            placeholder="请选择源牛棚"
            style="width: 100%"
            :disabled="!form.from_base_id"
          >
            <el-option
              v-for="barn in fromBarns"
              :key="barn.id"
              :label="`${barn.name} (${barn.code}) - 当前: ${barn.current_count}/${barn.capacity}`"
              :value="barn.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="目标基地" prop="to_base_id">
          <el-select
            v-model="form.to_base_id"
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
            v-model="form.to_barn_id"
            placeholder="请选择目标牛棚"
            style="width: 100%"
            :disabled="!form.to_base_id"
          >
            <el-option
              v-for="barn in toBarns"
              :key="barn.id"
              :label="`${barn.name} (${barn.code}) - 当前: ${barn.current_count}/${barn.capacity}`"
              :value="barn.id"
              :disabled="barn.current_count + cattleIds.length > barn.capacity"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="转群原因" prop="reason">
          <el-select v-model="form.reason" placeholder="请选择转群原因" style="width: 100%">
            <el-option label="正常调配" value="normal_allocation" />
            <el-option label="健康隔离" value="health_isolation" />
            <el-option label="治疗需要" value="treatment_required" />
            <el-option label="繁殖管理" value="breeding_management" />
            <el-option label="饲养阶段调整" value="feeding_stage_adjustment" />
            <el-option label="设施维护" value="facility_maintenance" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="form.reason === 'other'" label="详细说明" prop="custom_reason">
          <el-input
            v-model="form.custom_reason"
            type="textarea"
            :rows="3"
            placeholder="请输入详细的转群原因"
          />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="2"
            placeholder="请输入备注信息（可选）"
          />
        </el-form-item>
      </el-form>

      <!-- 容量检查提示 -->
      <div v-if="capacityWarning" class="capacity-warning">
        <el-alert
          :title="capacityWarning"
          type="warning"
          :closable="false"
          show-icon
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :loading="loading"
          :disabled="!canTransfer"
          @click="handleTransfer"
        >
          确认转群
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { cattleApi } from '@/api/cattle'
import { baseApi, type Base, type Barn } from '@/api/base'

interface Props {
  modelValue: boolean
  cattleIds: number[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)
const bases = ref<Base[]>([])
const fromBarns = ref<Barn[]>([])
const toBarns = ref<Barn[]>([])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = reactive({
  from_base_id: undefined as number | undefined,
  from_barn_id: undefined as number | undefined,
  to_base_id: undefined as number | undefined,
  to_barn_id: undefined as number | undefined,
  reason: '',
  custom_reason: '',
  notes: ''
})

const rules: FormRules = {
  to_base_id: [
    { required: true, message: '请选择目标基地', trigger: 'change' }
  ],
  to_barn_id: [
    { required: true, message: '请选择目标牛棚', trigger: 'change' }
  ],
  reason: [
    { required: true, message: '请选择转群原因', trigger: 'change' }
  ],
  custom_reason: [
    { required: true, message: '请输入详细说明', trigger: 'blur' }
  ]
}

// 容量检查
const capacityWarning = computed(() => {
  if (!form.to_barn_id || toBarns.value.length === 0) return ''
  
  const targetBarn = toBarns.value.find(barn => barn.id === form.to_barn_id)
  if (!targetBarn) return ''
  
  const availableCapacity = targetBarn.capacity - targetBarn.current_count
  const requiredCapacity = props.cattleIds.length
  
  if (requiredCapacity > availableCapacity) {
    return `目标牛棚容量不足！需要 ${requiredCapacity} 个位置，但只有 ${availableCapacity} 个空位`
  }
  
  if (availableCapacity - requiredCapacity < 5) {
    return `转群后目标牛棚将接近满载，剩余容量仅 ${availableCapacity - requiredCapacity} 个位置`
  }
  
  return ''
})

// 是否可以转群
const canTransfer = computed(() => {
  if (!form.to_base_id || !form.to_barn_id || !form.reason) return false
  if (form.reason === 'other' && !form.custom_reason) return false
  
  const targetBarn = toBarns.value.find(barn => barn.id === form.to_barn_id)
  if (!targetBarn) return false
  
  const availableCapacity = targetBarn.capacity - targetBarn.current_count
  return props.cattleIds.length <= availableCapacity
})

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
  form.from_barn_id = undefined
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
  form.to_barn_id = undefined
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

// 执行转群
const handleTransfer = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    const reason = form.reason === 'other' ? form.custom_reason : form.reason
    
    await ElMessageBox.confirm(
      `确定要将 ${props.cattleIds.length} 头牛只转移到目标牛棚吗？`,
      '确认转群',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    
    await cattleApi.batchTransfer({
      cattle_ids: props.cattleIds,
      from_barn_id: form.from_barn_id,
      to_barn_id: form.to_barn_id!,
      reason: `${reason}${form.notes ? ` - ${form.notes}` : ''}`
    })
    
    ElMessage.success('转群成功')
    emit('success')
    handleClose()
    
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('转群失败:', error)
      ElMessage.error(error.message || '转群失败')
    }
  } finally {
    loading.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  formRef.value?.resetFields()
  Object.assign(form, {
    from_base_id: undefined,
    from_barn_id: undefined,
    to_base_id: undefined,
    to_barn_id: undefined,
    reason: '',
    custom_reason: '',
    notes: ''
  })
  fromBarns.value = []
  toBarns.value = []
  dialogVisible.value = false
}

// 监听对话框显示状态
watch(() => props.modelValue, (visible) => {
  if (visible && props.cattleIds.length === 0) {
    ElMessage.warning('请先选择要转群的牛只')
    dialogVisible.value = false
  }
})

onMounted(() => {
  loadBases()
})
</script>

<style scoped>
.transfer-container {
  padding: 10px 0;
}

.selected-cattle {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 6px;
}

.selected-cattle h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.cattle-tag {
  margin-right: 8px;
  margin-bottom: 5px;
}

.capacity-warning {
  margin-top: 15px;
}

.dialog-footer {
  text-align: right;
}
</style>