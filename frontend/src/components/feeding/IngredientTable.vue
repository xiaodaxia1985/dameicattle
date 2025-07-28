<template>
  <div class="ingredient-table">
    <div class="table-header">
      <h3>配方成分详情</h3>
      <p class="table-description">以下是该饲料配方的详细成分信息，包含各成分的重量、成本、能量值和所占比重</p>
    </div>
    
    <el-table 
      :data="ingredients" 
      border 
      stripe
      class="ingredients-table"
      :summary-method="getSummaries"
      show-summary
    >
      <el-table-column 
        prop="name" 
        label="成分名称" 
        width="150"
        align="center"
      >
        <template #default="{ row }">
          <el-tag type="primary" size="small">{{ row.name }}</el-tag>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="weight" 
        label="重量 (kg)" 
        width="120"
        align="center"
      >
        <template #default="{ row }">
          <span class="weight-value">{{ formatWeight(row.weight) }}</span>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="cost" 
        label="成本 (元/kg)" 
        width="130"
        align="center"
      >
        <template #default="{ row }">
          <span class="cost-value">¥{{ formatCost(row.cost) }}</span>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="energy" 
        label="能量 (MJ/kg)" 
        width="130"
        align="center"
      >
        <template #default="{ row }">
          <span class="energy-value">{{ formatEnergy(row.energy) }}</span>
        </template>
      </el-table-column>
      
      <el-table-column 
        prop="ratio" 
        label="所占比重 (%)" 
        width="140"
        align="center"
      >
        <template #default="{ row }">
          <el-progress 
            :percentage="row.ratio" 
            :stroke-width="12"
            :show-text="true"
            :format="() => `${formatRatio(row.ratio)}%`"
            :color="getProgressColor(row.ratio)"
          />
        </template>
      </el-table-column>
      
      <el-table-column 
        label="单项总成本 (元)" 
        width="140"
        align="center"
      >
        <template #default="{ row }">
          <span class="total-cost">¥{{ formatTotalCost(row) }}</span>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="table-footer" v-if="showSummary">
      <div class="summary-cards">
        <el-card class="summary-card">
          <div class="summary-item">
            <span class="summary-label">总重量:</span>
            <span class="summary-value weight">{{ formatWeight(totalWeight) }} kg</span>
          </div>
        </el-card>
        
        <el-card class="summary-card">
          <div class="summary-item">
            <span class="summary-label">平均成本:</span>
            <span class="summary-value cost">¥{{ formatCost(averageCost) }}/kg</span>
          </div>
        </el-card>
        
        <el-card class="summary-card">
          <div class="summary-item">
            <span class="summary-label">总能量:</span>
            <span class="summary-value energy">{{ formatEnergy(totalEnergy) }} MJ/kg</span>
          </div>
        </el-card>
        
        <el-card class="summary-card">
          <div class="summary-item">
            <span class="summary-label">比重总和:</span>
            <span class="summary-value ratio">{{ formatRatio(totalRatio) }}%</span>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IngredientItem } from '@/api/feeding'

interface Props {
  ingredients: IngredientItem[]
  showSummary?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showSummary: true
})

// 计算总重量
const totalWeight = computed(() => {
  return props.ingredients.reduce((sum, item) => sum + item.weight, 0)
})

// 计算平均成本
const averageCost = computed(() => {
  if (props.ingredients.length === 0) return 0
  const totalCost = props.ingredients.reduce((sum, item) => sum + (item.cost * item.ratio / 100), 0)
  return totalCost
})

// 计算总能量
const totalEnergy = computed(() => {
  return props.ingredients.reduce((sum, item) => sum + (item.energy * item.ratio / 100), 0)
})

// 计算比重总和
const totalRatio = computed(() => {
  return props.ingredients.reduce((sum, item) => sum + item.ratio, 0)
})

// 格式化函数
const formatWeight = (weight: number) => {
  return weight.toFixed(2)
}

const formatCost = (cost: number) => {
  return cost.toFixed(2)
}

const formatEnergy = (energy: number) => {
  return energy.toFixed(1)
}

const formatRatio = (ratio: number) => {
  return ratio.toFixed(1)
}

const formatTotalCost = (ingredient: IngredientItem) => {
  const totalCost = ingredient.cost * ingredient.weight
  return totalCost.toFixed(2)
}

// 进度条颜色
const getProgressColor = (ratio: number) => {
  if (ratio < 10) return '#909399'
  if (ratio < 30) return '#E6A23C'
  if (ratio < 50) return '#409EFF'
  return '#67C23A'
}

// 表格汇总行
const getSummaries = (param: any) => {
  const { columns } = param
  const sums: string[] = []
  
  columns.forEach((column: any, index: number) => {
    if (index === 0) {
      sums[index] = '合计'
      return
    }
    
    switch (column.property) {
      case 'weight':
        sums[index] = `${formatWeight(totalWeight.value)} kg`
        break
      case 'cost':
        sums[index] = `¥${formatCost(averageCost.value)}/kg`
        break
      case 'energy':
        sums[index] = `${formatEnergy(totalEnergy.value)} MJ/kg`
        break
      case 'ratio':
        sums[index] = `${formatRatio(totalRatio.value)}%`
        break
      default:
        if (index === columns.length - 1) {
          // 最后一列显示总成本
          const totalCost = props.ingredients.reduce((sum, item) => sum + (item.cost * item.weight), 0)
          sums[index] = `¥${totalCost.toFixed(2)}`
        } else {
          sums[index] = '-'
        }
    }
  })
  
  return sums
}
</script>

<style scoped>
.ingredient-table {
  margin: 20px 0;
}

.table-header {
  margin-bottom: 16px;
}

.table-header h3 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.table-description {
  margin: 0;
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
}

.ingredients-table {
  width: 100%;
  margin-bottom: 20px;
}

.weight-value {
  font-weight: 600;
  color: #409EFF;
}

.cost-value {
  font-weight: 600;
  color: #E6A23C;
}

.energy-value {
  font-weight: 600;
  color: #67C23A;
}

.total-cost {
  font-weight: 600;
  color: #F56C6C;
}

.table-footer {
  margin-top: 20px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.summary-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.summary-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
}

.summary-value.weight {
  color: #409EFF;
}

.summary-value.cost {
  color: #E6A23C;
}

.summary-value.energy {
  color: #67C23A;
}

.summary-value.ratio {
  color: #F56C6C;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
  
  .ingredients-table {
    font-size: 12px;
  }
  
  .table-header h3 {
    font-size: 16px;
  }
  
  .table-description {
    font-size: 12px;
  }
}
</style>