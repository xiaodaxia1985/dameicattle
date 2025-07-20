<template>
  <el-card class="stat-card" :class="[type, { 'has-trend': showTrend }]">
    <div class="stat-content">
      <div class="stat-header">
        <div class="stat-icon-wrapper">
          <el-icon class="stat-icon" :size="iconSize">
            <component :is="icon" />
          </el-icon>
        </div>
        <div class="stat-actions" v-if="$slots.actions">
          <slot name="actions" />
        </div>
      </div>
      
      <div class="stat-body">
        <div class="stat-number">
          <span class="number">{{ formattedValue }}</span>
          <span class="unit" v-if="unit">{{ unit }}</span>
        </div>
        <div class="stat-label">{{ label }}</div>
        
        <div class="stat-trend" v-if="showTrend && trend">
          <el-icon class="trend-icon" :class="trendClass">
            <ArrowUp v-if="trend.direction === 'up'" />
            <ArrowDown v-if="trend.direction === 'down'" />
            <Minus v-if="trend.direction === 'stable'" />
          </el-icon>
          <span class="trend-value" :class="trendClass">
            {{ trend.value }}{{ trend.isPercentage ? '%' : '' }}
          </span>
          <span class="trend-label">{{ trend.label || '较上期' }}</span>
        </div>
      </div>
    </div>
    
    <div class="stat-footer" v-if="$slots.footer">
      <slot name="footer" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUp, ArrowDown, Minus } from '@element-plus/icons-vue'

interface Trend {
  direction: 'up' | 'down' | 'stable'
  value: number | string
  isPercentage?: boolean
  label?: string
}

interface Props {
  value: number | string
  label: string
  icon: any
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  unit?: string
  trend?: Trend
  showTrend?: boolean
  iconSize?: number
  precision?: number
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  showTrend: false,
  iconSize: 24,
  precision: 0
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    if (props.value >= 10000) {
      return (props.value / 10000).toFixed(1) + '万'
    }
    return props.value.toLocaleString()
  }
  return props.value
})

const trendClass = computed(() => {
  if (!props.trend) return ''
  
  switch (props.trend.direction) {
    case 'up':
      return 'trend-up'
    case 'down':
      return 'trend-down'
    default:
      return 'trend-stable'
  }
})
</script>

<style lang="scss" scoped>
.stat-card {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
  
  :deep(.el-card__body) {
    padding: 20px;
  }
  
  .stat-content {
    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      
      .stat-icon-wrapper {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--el-color-primary-light-9);
        
        .stat-icon {
          color: var(--el-color-primary);
        }
      }
    }
    
    .stat-body {
      .stat-number {
        display: flex;
        align-items: baseline;
        margin-bottom: 8px;
        
        .number {
          font-size: 32px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          line-height: 1;
        }
        
        .unit {
          font-size: 14px;
          color: var(--el-text-color-secondary);
          margin-left: 4px;
        }
      }
      
      .stat-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-bottom: 12px;
      }
      
      .stat-trend {
        display: flex;
        align-items: center;
        font-size: 12px;
        
        .trend-icon {
          margin-right: 4px;
        }
        
        .trend-value {
          font-weight: 500;
          margin-right: 4px;
        }
        
        .trend-label {
          color: var(--el-text-color-secondary);
        }
        
        &.trend-up {
          .trend-icon,
          .trend-value {
            color: var(--el-color-success);
          }
        }
        
        &.trend-down {
          .trend-icon,
          .trend-value {
            color: var(--el-color-danger);
          }
        }
        
        &.trend-stable {
          .trend-icon,
          .trend-value {
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }
  
  .stat-footer {
    border-top: 1px solid var(--el-border-color-lighter);
    padding: 12px 20px;
    background: var(--el-bg-color-page);
    margin: 0 -20px -20px;
  }
  
  // Type variations
  &.success {
    .stat-header .stat-icon-wrapper {
      background: var(--el-color-success-light-9);
      .stat-icon {
        color: var(--el-color-success);
      }
    }
    .stat-number .number {
      color: var(--el-color-success);
    }
  }
  
  &.warning {
    .stat-header .stat-icon-wrapper {
      background: var(--el-color-warning-light-9);
      .stat-icon {
        color: var(--el-color-warning);
      }
    }
    .stat-number .number {
      color: var(--el-color-warning);
    }
  }
  
  &.danger {
    .stat-header .stat-icon-wrapper {
      background: var(--el-color-danger-light-9);
      .stat-icon {
        color: var(--el-color-danger);
      }
    }
    .stat-number .number {
      color: var(--el-color-danger);
    }
  }
  
  &.info {
    .stat-header .stat-icon-wrapper {
      background: var(--el-color-info-light-9);
      .stat-icon {
        color: var(--el-color-info);
      }
    }
    .stat-number .number {
      color: var(--el-color-info);
    }
  }
}

@media (max-width: 768px) {
  .stat-card {
    .stat-content {
      .stat-body {
        .stat-number .number {
          font-size: 24px;
        }
      }
    }
  }
}
</style>