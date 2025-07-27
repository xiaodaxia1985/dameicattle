<template>
  <el-dialog
    v-model="visible"
    title="批量导入牛只"
    width="600px"
    @close="handleClose"
  >
    <div class="import-content">
      <!-- 步骤指示器 -->
      <el-steps :active="currentStep" finish-status="success" class="import-steps">
        <el-step title="下载模板" />
        <el-step title="上传文件" />
        <el-step title="导入完成" />
      </el-steps>

      <!-- 步骤1: 下载模板 -->
      <div v-if="currentStep === 0" class="step-content">
        <div class="template-section">
          <el-alert
            title="导入说明"
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>1. 请先下载导入模板，按照模板格式填写牛只信息</p>
              <p>2. 必填字段：耳标号、品种、性别、所属基地</p>
              <p>3. 日期格式：YYYY-MM-DD（如：2024-01-01）</p>
              <p>4. 性别填写：male（公牛）或 female（母牛）</p>
            </template>
          </el-alert>
          
          <div class="template-download">
            <el-button type="primary" @click="downloadTemplate" :loading="downloadingTemplate">
              <el-icon><Download /></el-icon>
              下载导入模板
            </el-button>
          </div>
        </div>
      </div>

      <!-- 步骤2: 上传文件 -->
      <div v-if="currentStep === 1" class="step-content">
        <el-upload
          ref="uploadRef"
          class="upload-demo"
          drag
          :auto-upload="false"
          :limit="1"
          :on-change="handleFileChange"
          :on-exceed="handleExceed"
          accept=".xlsx,.xls"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              只能上传 xlsx/xls 文件，且不超过 10MB
            </div>
          </template>
        </el-upload>

        <div v-if="selectedFile" class="file-info">
          <el-card>
            <div class="file-details">
              <el-icon><Document /></el-icon>
              <span class="file-name">{{ selectedFile.name }}</span>
              <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 步骤3: 导入结果 -->
      <div v-if="currentStep === 2" class="step-content">
        <div v-if="importResult" class="import-result">
          <el-result
            :icon="importResult.success ? 'success' : 'error'"
            :title="importResult.success ? '导入成功' : '导入失败'"
            :sub-title="importResult.message"
          >
            <template #extra>
              <div class="result-stats" v-if="importResult.success">
                <el-statistic title="成功导入" :value="importResult.imported_count" />
              </div>
            </template>
          </el-result>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
        <el-button 
          v-if="currentStep < 2" 
          type="primary" 
          @click="nextStep"
          :disabled="currentStep === 1 && !selectedFile"
        >
          下一步
        </el-button>
        <el-button 
          v-if="currentStep === 1" 
          type="success" 
          @click="handleImport"
          :loading="importing"
          :disabled="!selectedFile"
        >
          开始导入
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox, type UploadInstance, type UploadFile } from 'element-plus'
import { Download, UploadFilled, Document } from '@element-plus/icons-vue'
import { cattleApi } from '@/api/cattle'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const uploadRef = ref<UploadInstance>()
const currentStep = ref(0)
const selectedFile = ref<File | null>(null)
const downloadingTemplate = ref(false)
const importing = ref(false)
const importResult = ref<{
  success: boolean
  message: string
  imported_count?: number
} | null>(null)

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const downloadTemplate = async () => {
  try {
    downloadingTemplate.value = true
    const blob = await cattleApi.getImportTemplate()
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '牛只导入模板.xlsx'
    link.click()
    window.URL.revokeObjectURL(url)
    
    ElMessage.success('模板下载成功')
  } catch (error) {
    ElMessage.error('模板下载失败')
  } finally {
    downloadingTemplate.value = false
  }
}

const handleFileChange = (file: UploadFile) => {
  if (file.raw) {
    // 检查文件大小
    if (file.raw.size > 10 * 1024 * 1024) {
      ElMessage.error('文件大小不能超过 10MB')
      return
    }
    
    // 检查文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
    
    if (!allowedTypes.includes(file.raw.type)) {
      ElMessage.error('只支持 Excel 文件格式')
      return
    }
    
    selectedFile.value = file.raw
  }
}

const handleExceed = () => {
  ElMessage.warning('只能上传一个文件')
}

const handleImport = async () => {
  if (!selectedFile.value) {
    ElMessage.error('请选择要导入的文件')
    return
  }
  
  try {
    importing.value = true
    const result = await cattleApi.batchImport(selectedFile.value)
    
    importResult.value = {
      success: true,
      message: `成功导入 ${result.imported_count} 条牛只记录`,
      imported_count: result.imported_count
    }
    
    currentStep.value = 2
    emit('success')
  } catch (error: any) {
    importResult.value = {
      success: false,
      message: error.message || '导入失败，请检查文件格式和数据'
    }
    currentStep.value = 2
  } finally {
    importing.value = false
  }
}

const nextStep = () => {
  if (currentStep.value < 2) {
    currentStep.value++
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const handleClose = () => {
  visible.value = false
  resetDialog()
}

const resetDialog = () => {
  currentStep.value = 0
  selectedFile.value = null
  importResult.value = null
  uploadRef.value?.clearFiles()
}

const formatFileSize = (size: number): string => {
  if (size < 1024) {
    return size + ' B'
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(1) + ' KB'
  } else {
    return (size / (1024 * 1024)).toFixed(1) + ' MB'
  }
}
</script>

<style lang="scss" scoped>
.import-content {
  .import-steps {
    margin-bottom: 30px;
  }
  
  .step-content {
    min-height: 200px;
    
    .template-section {
      .el-alert {
        margin-bottom: 20px;
      }
      
      .template-download {
        text-align: center;
        padding: 20px 0;
      }
    }
    
    .file-info {
      margin-top: 20px;
      
      .file-details {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .file-name {
          font-weight: 500;
          flex: 1;
        }
        
        .file-size {
          color: #909399;
          font-size: 12px;
        }
      }
    }
    
    .import-result {
      .result-stats {
        margin-top: 20px;
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>