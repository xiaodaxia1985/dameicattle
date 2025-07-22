<template>
  <el-dialog
    v-model="visible"
    title="数据导出"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="export-dialog">
      <el-form :model="exportForm" label-width="100px">
        <el-form-item label="导出类型">
          <el-radio-group v-model="exportForm.type">
            <el-radio value="dashboard">仪表盘数据</el-radio>
            <el-radio value="indicators">关键指标</el-radio>
            <el-radio value="trends">趋势分析</el-radio>
            <el-radio value="tasks">待处理任务</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="exportForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="数据格式">
          <el-radio-group v-model="exportForm.format">
            <el-radio value="excel">Excel (.xlsx)</el-radio>
            <el-radio value="csv">CSV (.csv)</el-radio>
            <el-radio value="pdf">PDF (.pdf)</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="包含图表" v-if="exportForm.format === 'pdf'">
          <el-switch v-model="exportForm.includeCharts" />
        </el-form-item>
        
        <el-form-item label="基地筛选" v-if="availableBases.length > 1">
          <el-select 
            v-model="exportForm.baseIds" 
            multiple 
            placeholder="选择基地"
            style="width: 100%"
          >
            <el-option
              v-for="base in availableBases"
              :key="base.id"
              :label="base.name"
              :value="base.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="导出选项">
          <el-checkbox-group v-model="exportForm.options">
            <el-checkbox value="summary">包含汇总信息</el-checkbox>
            <el-checkbox value="details">包含详细数据</el-checkbox>
            <el-checkbox value="charts">包含图表截图</el-checkbox>
            <el-checkbox value="analysis">包含分析报告</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      
      <div class="export-preview" v-if="previewData">
        <h4>数据预览</h4>
        <div class="preview-stats">
          <div class="stat-item">
            <span class="stat-label">数据条数:</span>
            <span class="stat-value">{{ previewData.recordCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">预计大小:</span>
            <span class="stat-value">{{ previewData.estimatedSize }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">生成时间:</span>
            <span class="stat-value">{{ previewData.estimatedTime }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button @click="handlePreview" :loading="previewing">预览</el-button>
        <el-button 
          type="primary" 
          @click="handleExport" 
          :loading="exporting"
          :disabled="!isFormValid"
        >
          导出
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

interface ExportForm {
  type: string
  dateRange: any
  format: string
  includeCharts: boolean
  baseIds: number[]
  options: string[]
}

interface PreviewData {
  recordCount: number
  estimatedSize: string
  estimatedTime: string
}

interface Base {
  id: number
  name: string
}

interface Props {
  modelValue: boolean
  availableBases?: Base[]
}

const props = withDefaults(defineProps<Props>(), {
  availableBases: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  export: [form: ExportForm]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const exportForm = ref<ExportForm>({
  type: 'dashboard',
  dateRange: [
    dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD')
  ],
  format: 'excel',
  includeCharts: false,
  baseIds: [],
  options: ['summary', 'details']
})

const previewData = ref<PreviewData | null>(null)
const previewing = ref(false)
const exporting = ref(false)

const isFormValid = computed(() => {
  return exportForm.value.type && 
         exportForm.value.format && 
         exportForm.value.dateRange &&
         exportForm.value.options.length > 0
})

watch(() => exportForm.value, () => {
  previewData.value = null
}, { deep: true })

const handleClose = () => {
  visible.value = false
  resetForm()
}

const resetForm = () => {
  exportForm.value = {
    type: 'dashboard',
    dateRange: [
      dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
      dayjs().format('YYYY-MM-DD')
    ],
    format: 'excel',
    includeCharts: false,
    baseIds: [],
    options: ['summary', 'details']
  }
  previewData.value = null
}

const handlePreview = async () => {
  if (!isFormValid.value) {
    ElMessage.warning('请完善导出配置')
    return
  }
  
  previewing.value = true
  
  try {
    // 模拟预览数据获取
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    previewData.value = {
      recordCount: Math.floor(Math.random() * 1000) + 100,
      estimatedSize: (Math.random() * 10 + 1).toFixed(1) + ' MB',
      estimatedTime: Math.floor(Math.random() * 30 + 10) + ' 秒'
    }
    
    ElMessage.success('预览生成成功')
  } catch (error) {
    ElMessage.error('预览生成失败')
  } finally {
    previewing.value = false
  }
}

const handleExport = async () => {
  if (!isFormValid.value) {
    ElMessage.warning('请完善导出配置')
    return
  }
  
  exporting.value = true
  
  try {
    emit('export', { ...exportForm.value })
    
    // 模拟导出过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    ElMessage.success('导出任务已提交，请稍后查看下载')
    handleClose()
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}
</script>

<style lang="scss" scoped>
.export-dialog {
  .export-preview {
    margin-top: 24px;
    padding: 16px;
    background: var(--el-bg-color-page);
    border-radius: 6px;
    
    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
    }
    
    .preview-stats {
      display: flex;
      gap: 24px;
      
      .stat-item {
        display: flex;
        flex-direction: column;
        
        .stat-label {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-bottom: 4px;
        }
        
        .stat-value {
          font-size: 14px;
          font-weight: 500;
          color: var(--el-text-color-primary);
        }
      }
    }
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .export-dialog {
    .export-preview .preview-stats {
      flex-direction: column;
      gap: 12px;
    }
  }
}
</style>