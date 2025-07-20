<template>
  <div class="barn-visualization">
    <div class="barn-grid">
      <div
        v-for="barn in barns"
        :key="barn.id"
        class="barn-item"
        :class="getBarnStatusClass(barn)"
        @click="$emit('select-barn', barn)"
      >
        <div class="barn-header">
          <h4>{{ barn.name }}</h4>
          <span class="barn-code">{{ barn.code }}</span>
        </div>
        
        <div class="barn-content">
          <div class="capacity-info">
            <div class="capacity-bar">
              <div 
                class="capacity-fill" 
                :style="{ width: getCapacityPercentage(barn) + '%' }"
              ></div>
            </div>
            <span class="capacity-text">
              {{ barn.currentCount }}/{{ barn.capacity }}
            </span>
          </div>
          
          <div class="barn-type">
            <el-tag :type="getBarnTypeColor(barn.barnType)" size="small">
              {{ getBarnTypeName(barn.barnType) }}
            </el-tag>
          </div>
        </div>
        
        <div class="barn-actions">
          <el-button 
            type="text" 
            size="small" 
            @click.stop="$emit('edit-barn', barn)"
          >
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button 
            type="text" 
            size="small" 
            @click.stop="$emit('delete-barn', barn)"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
      
      <div class="add-barn-item" @click="$emit('add-barn')">
        <div class="add-barn-content">
          <el-icon class="add-icon"><Plus /></el-icon>
          <span>新增牛棚</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Edit, Delete, Plus } from '@element-plus/icons-vue'
import type { Barn } from '@/api/base'

interface Props {
  barns: Barn[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'select-barn': [barn: Barn]
  'edit-barn': [barn: Barn]
  'delete-barn': [barn: Barn]
  'add-barn': []
}>()

// 获取容量百分比
const getCapacityPercentage = (barn: Barn) => {
  return Math.round((barn.currentCount / barn.capacity) * 100)
}

// 获取牛棚状态样式类
const getBarnStatusClass = (barn: Barn) => {
  const percentage = getCapacityPercentage(barn)
  if (percentage >= 90) return 'barn-full'
  if (percentage >= 70) return 'barn-warning'
  return 'barn-normal'
}

// 获取牛棚类型颜色
const getBarnTypeColor = (type: string): 'success' | 'primary' | 'warning' | 'info' | 'danger' => {
  const colorMap: Record<string, 'success' | 'primary' | 'warning' | 'info' | 'danger'> = {
    'fattening': 'success',
    'breeding': 'primary',
    'isolation': 'warning',
    'other': 'info'
  }
  return colorMap[type] || 'info'
}

// 获取牛棚类型名称
const getBarnTypeName = (type: string) => {
  const nameMap: Record<string, string> = {
    'fattening': '育肥棚',
    'breeding': '繁殖棚',
    'isolation': '隔离棚',
    'other': '其他'
  }
  return nameMap[type] || '未知'
}
</script>

<style scoped lang="scss">
.barn-visualization {
  .barn-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    
    .barn-item {
      background: var(--el-bg-color);
      border: 2px solid var(--el-border-color-lighter);
      border-radius: var(--el-border-radius-base);
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--el-box-shadow);
      }
      
      &.barn-normal {
        border-color: var(--el-color-success-light-5);
        
        .capacity-fill {
          background: var(--el-color-success);
        }
      }
      
      &.barn-warning {
        border-color: var(--el-color-warning-light-5);
        
        .capacity-fill {
          background: var(--el-color-warning);
        }
      }
      
      &.barn-full {
        border-color: var(--el-color-danger-light-5);
        
        .capacity-fill {
          background: var(--el-color-danger);
        }
      }
      
      .barn-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        
        h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin: 0;
        }
        
        .barn-code {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          background: var(--el-bg-color-page);
          padding: 2px 6px;
          border-radius: 4px;
        }
      }
      
      .barn-content {
        margin-bottom: 12px;
        
        .capacity-info {
          margin-bottom: 8px;
          
          .capacity-bar {
            width: 100%;
            height: 6px;
            background: var(--el-border-color-lighter);
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 4px;
            
            .capacity-fill {
              height: 100%;
              transition: width 0.3s ease;
            }
          }
          
          .capacity-text {
            font-size: 12px;
            color: var(--el-text-color-regular);
          }
        }
        
        .barn-type {
          text-align: center;
        }
      }
      
      .barn-actions {
        position: absolute;
        top: 8px;
        right: 8px;
        display: flex;
        gap: 4px;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      &:hover .barn-actions {
        opacity: 1;
      }
    }
    
    .add-barn-item {
      background: var(--el-bg-color);
      border: 2px dashed var(--el-border-color);
      border-radius: var(--el-border-radius-base);
      padding: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 120px;
      
      &:hover {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }
      
      .add-barn-content {
        text-align: center;
        color: var(--el-text-color-secondary);
        
        .add-icon {
          font-size: 24px;
          margin-bottom: 8px;
          display: block;
        }
        
        span {
          font-size: 14px;
        }
      }
      
      &:hover .add-barn-content {
        color: var(--el-color-primary);
      }
    }
  }
}

@media (max-width: 768px) {
  .barn-visualization {
    .barn-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 12px;
    }
  }
}
</style>