<template>
  <el-dialog
    v-model="dialogVisible"
    title="批量转群"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="transfer-content">
      <!-- 选中的牛只信息 -->
      <div class="selected-cattle">
        <el-alert
          :title="`已选择 ${cattleIds.length} 头牛只`"
          type="info"
          :closable="false"
          show-icon
        />
        
        <div class="cattle-list" v-if="selectedCattleList.length > 0">
          <el-tag
            v-for="cattle in selectedCattleList"
            :key="cattle.id"
            class="cattle-tag"
            closable
            @close="removeCattle(cattle.id)"
          >
            {{ cattle.ear_tag }} - {{ cattle.breed }}
          </el-tag>
        </div>
      </div>

      <!-- 转移表单 -->
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        @submit.prevent
      >
        <el-form-item label="源牛棚" prop="from_barn_id">
          <el-select 
            v-model="form.from_barn_id" 
            placeholder="选择源牛棚（可选）" 
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="barn in availableBarns"
              :key="barn.id"
              :label="`${barn.name} (${barn.code})`"
              :value="barn.id"
            />
          </el-select>
          <div class="form-tip">
            如果选择源牛棚，只会转移当前在该牛棚的牛只
          </div>
        </el-form-item>

        <el-form-item label="目标牛棚" prop="to_barn_id">
          <el-select 
            v-model="form.to_barn_id" 
            placeholder="选择目标牛棚" 
            style="width: 100%"
            clearable
          >
            <el-option
              v-for="barn in availableBarns"
              :key="barn.id"
              :label="`${barn.name} (${barn.code}) - 可用容量: ${barn.available_capacity || 0}`"
              :value="barn.id"
              :disabled="barn.available_capacity === 0"
            />
          </el-select>
          <div class="form-tip">
            选择空值表示转移到无牛棚状态
          </div>
        </el-form-item>

        <el-form-item label="转移原因" prop="reason">
          <el-input
            v-model="form.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入转移原因（可选）"
          />
        </el-form-item>
      </el-form>

      <!-- 容量检查警告 -->
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
          :disabled="cattleIds.length === 0"
          @click="handleSubmit"
        >
          确认转移
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useCattleStore } from '@/stores/cattle'
import { useBarnStore } from '@/stores/barn'
import type { Cattle } from '@/api/cattle'

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

const cattleStore = useCattleStore()
const barnStore = useBarnStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 表单数据
const form = reactive({
  from_barn_id: undefined as number | undefined,
  to_barn_id: undefined as number | undefined,
  reason: ''
})

// 表单验证规则
const rules: FormRules = {
  // 暂时不设置必填验证，允许灵活转移
}

// 选中的牛只列表
const selectedCattleList = computed(() => {
  return cattleStore.cattleList.filter(cattle => props.cattleIds.includes(cattle.id))
})

// 可用的牛棚列表
const availableBarns = computed(() => {
  // 获取选中牛只所属的基地
  const baseIds = [...new Set(selectedCattleList.value.map(cattle => cattle.base_id))]
  if (baseIds.length === 0) return []
  
  // 如果牛只来自多个基地，只显示第一个基地的牛棚
  const baseId = baseIds[0]
  return barnStore.barnList.filter(barn => barn.base_id === baseId)
})

// 容量检查警告
const capacityWarning = computed(() => {
  if (!form.to_barn_id) return ''
  
  const targetBarn = availableBarns.value.find(barn => barn.id === form.to_barn_id)
  if (!targetBarn) return ''
  
  const transferCount = props.cattleIds.length
  const availableCapacity = targetBarn.available_capacity || 0
  
  if (transferCount > availableCapacity) {
    return `目标牛棚容量不足！需要转移 ${transferCount} 头牛，但只有 ${availableCapacity} 个空位`
  }
  
  return ''
})

// 监听对话框打开
watch(dialogVisible, (visible) => {
  if (visible) {
    loadData()
    resetForm()
  }
})

const loadData = async () => {
  try {
    await barnStore.fetchBarnList()
  } catch (error) {
    console.error('加载牛棚列表失败:', error)
  }
}

const resetForm = () => {
  form.from_barn_id = undefined
  form.to_barn_id = undefined
  form.reason = ''
}

const removeCattle = (cattleId: number) => {
  // 这里需要通知父组件移除选中的牛只
  // 由于props是只读的，需要通过事件通知父组件
  ElMessage.info('请在列表中取消选择该牛只')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    // 容量检查
    if (capacityWarning.value) {
      await ElMessageBox.confirm(
        capacityWarning.value + '，是否继续？',
        '容量警告',
        {
          confirmButtonText: '继续转移',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
    }
    
    // 确认转移
    const fromBarnName = form.from_barn_id 
      ? availableBarns.value.find(b => b.id === form.from_barn_id)?.name || '未知牛棚'
      : '任意牛棚'
    const toBarnName = form.to_barn_id 
      ? availableBarns.value.find(b => b.id === form.to_barn_id)?.name || '未知牛棚'
      : '无牛棚'
    
    await ElMessageBox.confirm(
      `确定要将 ${props.cattleIds.length} 头牛只从 ${fromBarnName} 转移到 ${toBarnName} 吗？`,
      '确认转移',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    loading.value = true
    
    await cattleStore.batchTransferCattle(
      props.cattleIds,
      form.from_barn_id,
      form.to_barn_id,
      form.reason
    )
    
    emit('success')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量转移失败:', error)
      ElMessage.error('转移失败，请重试')
    }
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  formRef.value?.resetFields()
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.transfer-content {
  .selected-cattle {
    margin-bottom: 20px;
    
    .cattle-list {
      margin-top: 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .cattle-tag {
        margin: 0;
      }
    }
  }
  
  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
    line-height: 1.4;
  }
  
  .capacity-warning {
    margin-top: 16px;
  }
}

.dialog-footer {
  text-align: right;
}
</style>