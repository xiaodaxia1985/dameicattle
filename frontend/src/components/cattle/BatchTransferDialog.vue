<template>
  <el-dialog
    v-model="visible"
    title="批量转群"
    width="600px"
    @close="handleClose"
  >
    <div class="transfer-content">
      <el-alert
        title="转群说明"
        type="info"
        :closable="false"
        show-icon
        class="transfer-alert"
      >
        <template #default>
          <p>已选择 {{ cattleIds.length }} 头牛只进行转群操作</p>
          <p>请选择目标牛棚，系统将自动检查牛棚容量</p>
        </template>
      </el-alert>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="transfer-form"
      >
        <el-form-item label="目标基地" prop="target_base_id">
          <el-select 
            v-model="form.target_base_id" 
            placeholder="请选择目标基地" 
            style="width: 100%"
            @change="handleBaseChange"
          >
            <el-option
              v-for="base in baseStore.bases"
              :key="base.id"
              :label="base.name"
              :value="base.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="目标牛棚" prop="target_barn_id">
          <el-select 
            v-model="form.target_barn_id" 
            placeholder="请选择目标牛棚" 
            style="width: 100%"
          >
            <el-option
              v-for="barn in availableBarns"
              :key="barn.value"
              :label="barn.label"
              :value="barn.value"
              :disabled="barn.disabled"
            >
              <div class="barn-option">
                <span>{{ barn.label }}</span>
                <span class="barn-capacity">
                  ({{ barn.current_count }}/{{ barn.capacity }})
                </span>
              </div>
            </el-option>
          </el-select>
          <div v-if="selectedBarn" class="barn-info">
            <el-tag :type="getCapacityType(selectedBarn)" size="small">
              可用容量: {{ selectedBarn.available_capacity }}
            </el-tag>
          </div>
        </el-form-item>

        <el-form-item label="转群原因" prop="reason">
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入转群原因"
          />
        </el-form-item>
      </el-form>

      <!-- 容量警告 -->
      <el-alert
        v-if="capacityWarning"
        :title="capacityWarning"
        type="warning"
        :closable="false"
        show-icon
        class="capacity-warning"
      />
    </div>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button 
        type="primary" 
        @click="handleTransfer"
        :loading="transferring"
        :disabled="!canTransfer"
      >
        确认转群
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useBaseStore } from '@/stores/base'
import { cattleApi } from '@/api/cattle'
import { barnApi } from '@/api/barn'

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

const baseStore = useBaseStore()
const formRef = ref<FormInstance>()
const transferring = ref(false)

const availableBarns = ref<Array<{
  value: number
  label: string
  capacity: number
  current_count: number
  available_capacity: number
  barn_type: string
  disabled: boolean
}>>([])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = reactive({
  target_base_id: undefined as number | undefined,
  target_barn_id: undefined as number | undefined,
  reason: ''
})

const rules = {
  target_base_id: [
    { required: true, message: '请选择目标基地', trigger: 'change' }
  ],
  target_barn_id: [
    { required: true, message: '请选择目标牛棚', trigger: 'change' }
  ],
  reason: [
    { required: true, message: '请输入转群原因', trigger: 'blur' }
  ]
}

const selectedBarn = computed(() => {
  if (!form.target_barn_id) return null
  return availableBarns.value.find(barn => barn.value === form.target_barn_id)
})

const capacityWarning = computed(() => {
  if (!selectedBarn.value) return null
  
  const requiredCapacity = props.cattleIds.length
  const availableCapacity = selectedBarn.value.available_capacity
  
  if (requiredCapacity > availableCapacity) {
    return `目标牛棚容量不足！需要 ${requiredCapacity} 个位置，但只有 ${availableCapacity} 个可用位置`
  }
  
  return null
})

const canTransfer = computed(() => {
  return form.target_base_id && 
         form.target_barn_id && 
         form.reason && 
         !capacityWarning.value
})

watch(() => props.modelValue, async (newVal) => {
  if (newVal) {
    resetForm()
    
    // 确保基地数据已加载
    if (baseStore.bases.length === 0) {
      try {
        await baseStore.fetchAllBases()
      } catch (error) {
        console.error('加载基地数据失败:', error)
        ElMessage.error('加载基地数据失败')
      }
    }
  }
})

const handleBaseChange = (baseId: number) => {
  form.target_barn_id = undefined
  if (baseId) {
    loadBarns(baseId)
  } else {
    availableBarns.value = []
  }
}

const loadBarns = async (baseId: number) => {
  try {
    const response = await barnApi.getBarnOptions({ base_id: baseId })
    availableBarns.value = response.data
  } catch (error) {
    console.error('加载牛棚选项失败:', error)
    ElMessage.error('加载牛棚选项失败')
  }
}

const getCapacityType = (barn: any) => {
  const rate = barn.current_count / barn.capacity
  if (rate < 0.5) return 'success'
  if (rate < 0.8) return 'warning'
  return 'danger'
}

const handleTransfer = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (capacityWarning.value) {
      ElMessage.error('目标牛棚容量不足，无法完成转群')
      return
    }
    
    await ElMessageBox.confirm(
      `确定要将 ${props.cattleIds.length} 头牛只转移到选定的牛棚吗？`,
      '确认转群',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    transferring.value = true
    
    await cattleApi.batchTransfer({
      cattle_ids: props.cattleIds,
      to_barn_id: form.target_barn_id!,
      reason: form.reason
    })
    
    ElMessage.success('转群成功')
    emit('success')
    handleClose()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '转群失败')
    }
  } finally {
    transferring.value = false
  }
}

const handleClose = () => {
  visible.value = false
  resetForm()
}

const resetForm = () => {
  Object.assign(form, {
    target_base_id: undefined,
    target_barn_id: undefined,
    reason: ''
  })
  availableBarns.value = []
  formRef.value?.clearValidate()
}
</script>

<style lang="scss" scoped>
.transfer-content {
  .transfer-alert {
    margin-bottom: 20px;
  }
  
  .transfer-form {
    .barn-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      
      .barn-capacity {
        color: #909399;
        font-size: 12px;
      }
    }
    
    .barn-info {
      margin-top: 8px;
    }
  }
  
  .capacity-warning {
    margin-top: 20px;
  }
}
</style>