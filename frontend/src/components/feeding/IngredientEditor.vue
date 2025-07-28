<template>
  <div class="ingredient-editor">
    <div class="editor-header">
      <h3>配方成分编辑</h3>
      <p class="editor-description">请添加饲料配方的各种成分，确保所有成分的比重总和为100%</p>
    </div>

    <!-- 成分列表 -->
    <div class="ingredients-list">
      <div class="list-header">
        <div class="header-row">
          <div class="header-cell name">成分名称</div>
          <div class="header-cell weight">重量 (kg)</div>
          <div class="header-cell cost">成本 (元/kg)</div>
          <div class="header-cell energy">能量 (MJ/kg)</div>
          <div class="header-cell ratio">比重 (%)</div>
          <div class="header-cell actions">操作</div>
        </div>
      </div>

      <div class="list-body">
        <div 
          v-for="(ingredient, index) in localIngredients" 
          :key="index"
          class="ingredient-row"
          :class="{ 'error': hasError(index) }"
        >
          <div class="input-cell name">
            <el-input
              v-model="ingredient.name"
              placeholder="请输入成分名称"
              @blur="validateIngredient(index)"
              :class="{ 'is-error': errors[index]?.name }"
            />
            <div v-if="errors[index]?.name" class="error-text">{{ errors[index].name }}</div>
          </div>

          <div class="input-cell weight">
            <el-input-number
              v-model="ingredient.weight"
              :min="0.01"
              :max="9999.99"
              :precision="2"
              :step="0.1"
              placeholder="重量"
              @blur="validateIngredient(index)"
              :class="{ 'is-error': errors[index]?.weight }"
            />
            <div v-if="errors[index]?.weight" class="error-text">{{ errors[index].weight }}</div>
          </div>

          <div class="input-cell cost">
            <el-input-number
              v-model="ingredient.cost"
              :min="0"
              :max="9999.99"
              :precision="2"
              :step="0.1"
              placeholder="成本"
              @blur="validateIngredient(index)"
              :class="{ 'is-error': errors[index]?.cost }"
            />
            <div v-if="errors[index]?.cost" class="error-text">{{ errors[index].cost }}</div>
          </div>

          <div class="input-cell energy">
            <el-input-number
              v-model="ingredient.energy"
              :min="0"
              :max="99.99"
              :precision="1"
              :step="0.1"
              placeholder="能量"
              @blur="validateIngredient(index)"
              :class="{ 'is-error': errors[index]?.energy }"
            />
            <div v-if="errors[index]?.energy" class="error-text">{{ errors[index].energy }}</div>
          </div>

          <div class="input-cell ratio">
            <el-input-number
              v-model="ingredient.ratio"
              :min="0.1"
              :max="100"
              :precision="1"
              :step="0.1"
              placeholder="比重"
              @blur="validateIngredient(index)"
              :class="{ 'is-error': errors[index]?.ratio }"
            />
            <div v-if="errors[index]?.ratio" class="error-text">{{ errors[index].ratio }}</div>
          </div>

          <div class="input-cell actions">
            <el-button
              type="danger"
              size="small"
              icon="Delete"
              @click="removeIngredient(index)"
              :disabled="localIngredients.length <= 1"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加成分按钮 -->
    <div class="add-ingredient">
      <el-button
        type="primary"
        icon="Plus"
        @click="addIngredient"
        :disabled="localIngredients.length >= 20"
      >
        添加成分
      </el-button>
      <span class="add-tip">最多可添加20种成分</span>
    </div>

    <!-- 统计信息 -->
    <div class="statistics">
      <el-card class="stats-card">
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">成分数量:</span>
            <span class="stat-value">{{ localIngredients.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总重量:</span>
            <span class="stat-value weight">{{ totalWeight.toFixed(2) }} kg</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均成本:</span>
            <span class="stat-value cost">¥{{ averageCost.toFixed(2) }}/kg</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总能量:</span>
            <span class="stat-value energy">{{ totalEnergy.toFixed(1) }} MJ/kg</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">比重总和:</span>
            <span class="stat-value ratio" :class="{ 'error': Math.abs(totalRatio - 100) > 0.01 }">
              {{ totalRatio.toFixed(1) }}%
            </span>
          </div>
        </div>
        
        <div v-if="Math.abs(totalRatio - 100) > 0.01" class="ratio-warning">
          <el-alert
            :title="`比重总和必须等于100%，当前为${totalRatio.toFixed(1)}%`"
            type="warning"
            :closable="false"
            show-icon
          />
        </div>
      </el-card>
    </div>

    <!-- 操作按钮 -->
    <div class="editor-actions">
      <el-button @click="resetIngredients">重置</el-button>
      <el-button type="primary" @click="saveIngredients" :disabled="!isValid">
        保存配方
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { IngredientItem } from '@/api/feeding'

interface Props {
  modelValue: IngredientItem[]
}

interface Emits {
  (e: 'update:modelValue', value: IngredientItem[]): void
  (e: 'save', value: IngredientItem[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 本地成分数据
const localIngredients = ref<IngredientItem[]>([])

// 错误信息
const errors = ref<Record<number, Record<string, string>>>({})

// 初始化数据
const initializeIngredients = () => {
  if (props.modelValue && props.modelValue.length > 0) {
    localIngredients.value = JSON.parse(JSON.stringify(props.modelValue))
  } else {
    localIngredients.value = [createEmptyIngredient()]
  }
  errors.value = {}
}

// 创建空成分
const createEmptyIngredient = (): IngredientItem => ({
  name: '',
  weight: 0,
  cost: 0,
  energy: 0,
  ratio: 0
})

// 监听props变化
watch(() => props.modelValue, initializeIngredients, { immediate: true })

// 监听本地数据变化
watch(localIngredients, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

// 计算属性
const totalWeight = computed(() => {
  return localIngredients.value.reduce((sum, item) => sum + (item.weight || 0), 0)
})

const averageCost = computed(() => {
  const totalCost = localIngredients.value.reduce((sum, item) => {
    return sum + ((item.cost || 0) * (item.ratio || 0) / 100)
  }, 0)
  return totalCost
})

const totalEnergy = computed(() => {
  return localIngredients.value.reduce((sum, item) => {
    return sum + ((item.energy || 0) * (item.ratio || 0) / 100)
  }, 0)
})

const totalRatio = computed(() => {
  return localIngredients.value.reduce((sum, item) => sum + (item.ratio || 0), 0)
})

const isValid = computed(() => {
  // 检查是否有错误
  if (Object.keys(errors.value).length > 0) {
    return false
  }
  
  // 检查比重总和
  if (Math.abs(totalRatio.value - 100) > 0.01) {
    return false
  }
  
  // 检查所有成分是否完整
  return localIngredients.value.every(ingredient => {
    return ingredient.name && 
           ingredient.name.trim() !== '' &&
           ingredient.weight > 0 &&
           ingredient.cost >= 0 &&
           ingredient.energy >= 0 &&
           ingredient.ratio > 0
  })
})

// 添加成分
const addIngredient = () => {
  if (localIngredients.value.length >= 20) {
    ElMessage.warning('最多只能添加20种成分')
    return
  }
  
  localIngredients.value.push(createEmptyIngredient())
}

// 删除成分
const removeIngredient = (index: number) => {
  if (localIngredients.value.length <= 1) {
    ElMessage.warning('至少需要保留一种成分')
    return
  }
  
  localIngredients.value.splice(index, 1)
  delete errors.value[index]
  
  // 重新整理错误索引
  const newErrors: Record<number, Record<string, string>> = {}
  Object.keys(errors.value).forEach(key => {
    const oldIndex = parseInt(key)
    if (oldIndex > index) {
      newErrors[oldIndex - 1] = errors.value[oldIndex]
    } else if (oldIndex < index) {
      newErrors[oldIndex] = errors.value[oldIndex]
    }
  })
  errors.value = newErrors
}

// 验证单个成分
const validateIngredient = (index: number) => {
  const ingredient = localIngredients.value[index]
  const ingredientErrors: Record<string, string> = {}
  
  // 验证名称
  if (!ingredient.name || ingredient.name.trim() === '') {
    ingredientErrors.name = '成分名称不能为空'
  } else {
    // 检查名称重复
    const duplicateIndex = localIngredients.value.findIndex((item, i) => 
      i !== index && item.name.trim() === ingredient.name.trim()
    )
    if (duplicateIndex !== -1) {
      ingredientErrors.name = '成分名称不能重复'
    }
  }
  
  // 验证重量
  if (!ingredient.weight || ingredient.weight <= 0) {
    ingredientErrors.weight = '重量必须大于0'
  }
  
  // 验证成本
  if (ingredient.cost < 0) {
    ingredientErrors.cost = '成本不能为负数'
  }
  
  // 验证能量
  if (ingredient.energy < 0) {
    ingredientErrors.energy = '能量不能为负数'
  }
  
  // 验证比重
  if (!ingredient.ratio || ingredient.ratio <= 0 || ingredient.ratio > 100) {
    ingredientErrors.ratio = '比重必须在0-100之间'
  }
  
  if (Object.keys(ingredientErrors).length > 0) {
    errors.value[index] = ingredientErrors
  } else {
    delete errors.value[index]
  }
}

// 检查是否有错误
const hasError = (index: number) => {
  return errors.value[index] && Object.keys(errors.value[index]).length > 0
}

// 重置成分
const resetIngredients = () => {
  localIngredients.value = [createEmptyIngredient()]
  errors.value = {}
}

// 保存成分
const saveIngredients = () => {
  // 验证所有成分
  localIngredients.value.forEach((_, index) => {
    validateIngredient(index)
  })
  
  if (!isValid.value) {
    ElMessage.error('请检查并修正所有错误后再保存')
    return
  }
  
  emit('save', localIngredients.value)
  ElMessage.success('配方成分保存成功')
}
</script>

<style scoped>
.ingredient-editor {
  padding: 20px;
}

.editor-header {
  margin-bottom: 24px;
}

.editor-header h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.editor-description {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.ingredients-list {
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  margin-bottom: 20px;
}

.list-header {
  background-color: #F5F7FA;
  border-bottom: 1px solid #EBEEF5;
}

.header-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 120px;
  gap: 12px;
  padding: 12px;
  font-weight: 600;
  color: #303133;
}

.header-cell {
  text-align: center;
  font-size: 14px;
}

.list-body {
  max-height: 400px;
  overflow-y: auto;
}

.ingredient-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr 1fr 120px;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #EBEEF5;
  transition: background-color 0.3s;
}

.ingredient-row:hover {
  background-color: #F5F7FA;
}

.ingredient-row.error {
  background-color: #FEF0F0;
}

.ingredient-row:last-child {
  border-bottom: none;
}

.input-cell {
  position: relative;
}

.error-text {
  position: absolute;
  top: 100%;
  left: 0;
  font-size: 12px;
  color: #F56C6C;
  margin-top: 2px;
  white-space: nowrap;
}

.add-ingredient {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.add-tip {
  font-size: 12px;
  color: #909399;
}

.statistics {
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
}

.stat-value.weight {
  color: #409EFF;
}

.stat-value.cost {
  color: #E6A23C;
}

.stat-value.energy {
  color: #67C23A;
}

.stat-value.ratio {
  color: #F56C6C;
}

.stat-value.ratio.error {
  color: #F56C6C;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

.ratio-warning {
  margin-top: 12px;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-row,
  .ingredient-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .header-cell {
    text-align: left;
    padding: 4px 0;
  }
  
  .input-cell {
    margin-bottom: 20px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .editor-actions {
    flex-direction: column;
  }
}
</style>