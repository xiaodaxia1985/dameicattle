<template>
  <el-card 
    class="cattle-card" 
    :class="{ 'selected': selected }"
    @click="handleCardClick"
  >
    <template #header>
      <div class="card-header">
        <div class="ear-tag">
          <el-tag type="primary" size="large">{{ cattle.ear_tag }}</el-tag>
        </div>
        <div class="actions" @click.stop>
          <el-checkbox 
            v-if="selectable"
            :model-value="selected"
            @change="handleSelect"
          />
          <el-dropdown @command="handleAction">
            <el-button size="small" text>
              <el-icon><MoreFilled /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="view">查看详情</el-dropdown-item>
                <el-dropdown-item command="edit">编辑</el-dropdown-item>
                <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </template>

    <div class="card-content">
      <!-- 牛只照片 -->
      <div class="cattle-photo">
        <el-image
          v-if="cattle.photos && cattle.photos.length > 0"
          :src="cattle.photos[0]"
          fit="cover"
          class="photo"
        >
          <template #error>
            <div class="photo-placeholder">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
        <div v-else class="photo-placeholder">
          <el-icon><Picture /></el-icon>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="basic-info">
        <div class="info-row">
          <span class="label">品种:</span>
          <span class="value">{{ cattle.breed }}</span>
        </div>
        <div class="info-row">
          <span class="label">性别:</span>
          <el-tag :type="cattle.gender === 'male' ? 'primary' : 'success'" size="small">
            {{ cattle.gender === 'male' ? '公' : '母' }}
          </el-tag>
        </div>
        <div class="info-row" v-if="cattle.weight">
          <span class="label">体重:</span>
          <span class="value">{{ cattle.weight }}kg</span>
        </div>
        <div class="info-row" v-if="cattle.age_months">
          <span class="label">月龄:</span>
          <span class="value">{{ cattle.age_months }}个月</span>
        </div>
      </div>

      <!-- 健康状态 -->
      <div class="health-status">
        <el-tag :type="getHealthStatusType(cattle.health_status)" size="small">
          {{ getHealthStatusText(cattle.health_status) }}
        </el-tag>
      </div>

      <!-- 位置信息 -->
      <div class="location-info">
        <div class="info-row" v-if="cattle.base">
          <span class="label">基地:</span>
          <span class="value">{{ cattle.base.name }}</span>
        </div>
        <div class="info-row" v-if="cattle.barn">
          <span class="label">牛棚:</span>
          <span class="value">{{ cattle.barn.name }}</span>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Cattle } from '@/api/cattle'

interface Props {
  cattle: Cattle
  selectable?: boolean
  selected?: boolean
}

interface Emits {
  (e: 'select', cattleId: number, selected: boolean): void
  (e: 'view', cattle: Cattle): void
  (e: 'edit', cattle: Cattle): void
  (e: 'delete', cattle: Cattle): void
}

const props = withDefaults(defineProps<Props>(), {
  selectable: false,
  selected: false
})

const emit = defineEmits<Emits>()

const handleCardClick = () => {
  if (props.selectable) {
    handleSelect(!props.selected)
  } else {
    emit('view', props.cattle)
  }
}

const handleSelect = (selected: boolean) => {
  emit('select', props.cattle.id, selected)
}

const handleAction = (command: string) => {
  switch (command) {
    case 'view':
      emit('view', props.cattle)
      break
    case 'edit':
      emit('edit', props.cattle)
      break
    case 'delete':
      emit('delete', props.cattle)
      break
  }
}

const getHealthStatusType = (status: string) => {
  switch (status) {
    case 'healthy': return 'success'
    case 'sick': return 'danger'
    case 'treatment': return 'warning'
    default: return 'info'
  }
}

const getHealthStatusText = (status: string) => {
  switch (status) {
    case 'healthy': return '健康'
    case 'sick': return '患病'
    case 'treatment': return '治疗中'
    default: return '未知'
  }
}
</script>

<style lang="scss" scoped>
.cattle-card {
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }
  
  &.selected {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .ear-tag {
      font-weight: bold;
    }
    
    .actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
  
  .card-content {
    .cattle-photo {
      margin-bottom: 12px;
      
      .photo {
        width: 100%;
        height: 120px;
        border-radius: 4px;
      }
      
      .photo-placeholder {
        width: 100%;
        height: 120px;
        background: #f5f7fa;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #c0c4cc;
        font-size: 24px;
      }
    }
    
    .basic-info {
      margin-bottom: 12px;
    }
    
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      
      .label {
        font-size: 12px;
        color: #909399;
      }
      
      .value {
        font-size: 13px;
        color: #303133;
        font-weight: 500;
      }
    }
    
    .health-status {
      margin-bottom: 12px;
      text-align: center;
    }
    
    .location-info {
      border-top: 1px solid #ebeef5;
      padding-top: 8px;
      
      .info-row {
        margin-bottom: 4px;
        
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}
</style>