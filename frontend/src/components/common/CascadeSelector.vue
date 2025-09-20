<template>
  <div class="cascade-selector">
    <el-row :gutter="16">
      <el-col :span="8">
        <el-form-item :label="baseLabel" :prop="baseProp">
          <el-select 
            v-model="selectedBase" 
            :placeholder="basePlaceholder"
            clearable
            style="width: 100%"
            @change="handleBaseChange"
          >
            <el-option
              v-for="base in bases"
              :key="base.id"
              :label="base.name"
              :value="base.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="barnLabel" :prop="barnProp">
          <el-select 
            v-model="selectedBarn" 
            :placeholder="barnPlaceholder"
            clearable
            style="width: 100%"
            @change="handleBarnChange"
            :disabled="!selectedBase"
          >
            <el-option
              v-for="barn in availableBarns"
              :key="barn.value"
              :label="barn.label"
              :value="barn.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="cattleLabel" :prop="cattleProp">
          <el-select 
            v-model="selectedCattle" 
            :placeholder="cattlePlaceholder"
            clearable
            filterable
            style="width: 100%"
            @change="handleCattleChange"
            :disabled="!selectedBarn"
          >
            <el-option
              v-for="cattle in availableCattle"
              :key="cattle.id"
              :label="`${cattle.ear_tag} - ${cattle.breed}`"
              :value="cattle.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useBaseStore } from '@/stores/base'
import { cattleApi } from '@/api/cattle'
import { barnApi } from '@/api/barn'

interface Props {
  modelValue?: {
    baseId?: number
    barnId?: number
    cattleId?: number
  }
  baseLabel?: string
  barnLabel?: string
  cattleLabel?: string
  basePlaceholder?: string
  barnPlaceholder?: string
  cattlePlaceholder?: string
  baseProp?: string
  barnProp?: string
  cattleProp?: string
  required?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: { baseId?: number; barnId?: number; cattleId?: number }): void
  (e: 'change', value: { baseId?: number; barnId?: number; cattleId?: number }): void
}

const props = withDefaults(defineProps<Props>(), {
  baseLabel: '基地',
  barnLabel: '牛棚',
  cattleLabel: '牛只',
  basePlaceholder: '请选择基地',
  barnPlaceholder: '请选择牛棚',
  cattlePlaceholder: '请选择牛只',
  baseProp: 'baseId',
  barnProp: 'barnId',
  cattleProp: 'cattleId',
  required: false
})

const emit = defineEmits<Emits>()

const baseStore = useBaseStore()

// 选中的值
const selectedBase = ref<number | undefined>()
const selectedBarn = ref<number | undefined>()
const selectedCattle = ref<number | undefined>()

// 可用选项
const bases = computed(() => baseStore.bases)
const availableBarns = ref<Array<{
  value: number
  label: string
}>>([])
const availableCattle = ref<Array<{
  id: number
  ear_tag: string
  breed: string
}>>([])

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedBase.value = newValue.baseId
    selectedBarn.value = newValue.barnId
    selectedCattle.value = newValue.cattleId
    
    // 如果有基地ID，加载牛棚
    if (newValue.baseId) {
      loadBarns(newValue.baseId)
    }
    
    // 如果有牛棚ID，加载牛只
    if (newValue.barnId) {
      loadCattle(newValue.barnId)
    }
  }
}, { immediate: true })

// 基地变更处理
const handleBaseChange = async (baseId: number | undefined) => {
  selectedBarn.value = undefined
  selectedCattle.value = undefined
  availableBarns.value = []
  availableCattle.value = []
  
  if (baseId) {
    await loadBarns(baseId)
  }
  
  emitChange()
}

// 牛棚变更处理
const handleBarnChange = async (barnId: number | undefined) => {
  selectedCattle.value = undefined
  availableCattle.value = []
  
  if (barnId) {
    await loadCattle(barnId)
  }
  
  emitChange()
}

// 牛只变更处理
const handleCattleChange = () => {
  emitChange()
}

// 加载牛棚
const loadBarns = async (baseId: number) => {
  try {
    const response = await baseStore.fetchBarnsByBaseId(baseId)
    // 安全处理响应，确保response是数组
    const barnsData = Array.isArray(response) ? response : []
    availableBarns.value = barnsData.map((barn: any) => ({
      value: barn.id,
      label: `${barn.name} (${barn.code})`
    }))
  } catch (error) {
    console.error('加载牛棚选项失败:', error)
    ElMessage.error('加载牛棚选项失败')
    // 确保availableBarns始终是数组
    availableBarns.value = []
  }
}

// 加载牛只
const loadCattle = async (barnId: number) => {
  try {
    const response = await cattleApi.getList({ barnId, status: 'active' })
    console.log('加载牛只响应:', response)
    
    // 使用 quickFix 工具进行安全的数据处理
    const { ensureArray, safeGet } = await import('@/utils/quickFix')
    
    // 安全获取牛只数据
    const cattleData = safeGet(response, 'data', [])
    availableCattle.value = ensureArray(cattleData)
  } catch (error) {
    console.error('加载牛只选项失败:', error)
    availableCattle.value = []
    // 不显示错误消息，因为这可能是正常情况（牛棚为空）
  }
}

// 发出变更事件
const emitChange = () => {
  const value = {
    baseId: selectedBase.value,
    barnId: selectedBarn.value,
    cattleId: selectedCattle.value
  }
  emit('update:modelValue', value)
  emit('change', value)
}

// 初始化
onMounted(async () => {
  // 确保基地数据已加载
  if (baseStore.bases.length === 0) {
    try {
      await baseStore.fetchAllBases()
    } catch (error) {
      console.error('加载基地数据失败:', error)
      ElMessage.error('加载基地数据失败')
    }
  }
})
</script>

<style lang="scss" scoped>
.cascade-selector {
  .el-form-item {
    margin-bottom: 0;
  }
}
</style>