<template>
  <el-dialog
    v-model="dialogVisible"
    title="批量导入牛只"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="import-content">
      <!-- 步骤指示器 -->
      <el-steps :active="currentStep" align-center>
        <el-step title="下载模板" />
        <el-step title="上传文件" />
        <el-step title="导入完成" />
      </el-steps>

      <!-- 步骤1: 下载模板 -->
      <div v-if="currentStep === 0" class="step-content">
        <div class="template-info">
          <el-alert
            title="导入说明"
            type="info"
            :closable="false"
            show-icon
          >
            <template #default>
              <p>1. 请先下载导入模板，按照模板格式填写牛只信息</p>
              <p>2. 支持Excel(.xlsx)和CSV格式文件</p>
              <p>3. 单次最多导入100条记录</p>
              <p>4. 耳标号不能重复，必须唯一</p>
            </template>
          </el-alert>
        </div>
        
        <div class="template-download">
          <el-button 
            type="primary" 
            size="large"
            :loading="downloadLoading"
            @click="downloadTemplate"
          >
            <el-icon><Download /></el-icon>
            下载导入模板
          </el-button>
        </div>

        <div class="step-actions">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="nextStep">下一步</el-button>
        </div>
      </div>

      <!-- 步骤2: 上传文件 -->
      <div v-if="currentStep === 1" class="step-content">
        <div class="upload-area">
          <el-upload
            ref="uploadRef"
            class="upload-demo"
            drag
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
            :limit="1"
            accept=".xlsx,.xls,.csv"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                只能上传Excel或CSV文件，且不超过10MB
              </div>
            </template>
          </el-upload>
        </div>

        <!-- 文件预览信息 -->
        <div v-if="selectedFile" class="file-info">
          <el-descriptions title="文件信息" :column="2" border>
            <el-descriptions-item label="文件名">{{ selectedFile.name }}</el-descriptions-item>
            <el-descriptions-item label="文件大小">{{ formatFileSize(selectedFile.size) }}</el-descriptions-item>
            <el-descriptions-item label="文件类型">{{ selectedFile.type || '未知' }}</el-descriptions-item>
            <el-descriptions-item label="修改时间">{{ formatTime(selectedFile.lastModified) }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="step-actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button 
            type="primary" 
            :disabled="!selectedFile"
            :loading="importLoading"
            @click="startImport"
          >
            开始导入
          </el-button>
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
                <el-statistic
                  title="成功导入"
                  :value="importResult.data?.imported_count || 0"
                  suffix="条记录"
                />
              </div>
              
              <!-- 错误详情 -->
              <div v-if="!importResult.success && importResult.errors" class="error-details">
                <el-collapse>
                  <el-collapse-item title="查看错误详情" name="errors">
                    <el-table :data="importResult.errors" size="small">
                      <el-table-column prop="row" label="行号" width="80" />
                      <el-table-column prop="field" label="字段" width="100" />
                      <el-table-column prop="message" label="错误信息" />
                    </el-table>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </template>
          </el-result>
        </div>

        <div class="step-actions">
          <el-button @click="handleClose">关闭</el-button>
          <el-button v-if="!importResult?.success" @click="resetImport">重新导入</el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { cattleApi } from '@/api/cattle'
import dayjs from 'dayjs'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const currentStep = ref(0)
const downloadLoading = ref(false)
const importLoading = ref(false)
const fileList = ref<any[]>([])
const selectedFile = ref<File | null>(null)
const importResult = ref<any>(null)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const downloadTemplate = async () => {
  try {
    downloadLoading.value = true
    const blob = await cattleApi.getImportTemplate()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cattle_import_template.xlsx'
    link.click()
    window.URL.revokeObjectURL(url)
    ElMessage.success('模板下载成功')
  } catch (error) {
    ElMessage.error('模板下载失败')
  } finally {
    downloadLoading.value = false
  }
}

const handleFileChange = (file: any) => {
  selectedFile.value = file.raw
  fileList.value = [file]
}

const handleFileRemove = () => {
  selectedFile.value = null
  fileList.value = []
}

const startImport = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  try {
    importLoading.value = true
    const result = await cattleApi.batchImport(selectedFile.value)
    
    importResult.value = {
      success: true,
      message: `成功导入 ${result.imported_count} 条牛只记录`,
      data: result
    }
    
    currentStep.value = 2
    emit('success')
  } catch (error: any) {
    console.error('导入失败:', error)
    
    importResult.value = {
      success: false,
      message: error.response?.data?.error?.message || '导入失败',
      errors: error.response?.data?.error?.details || []
    }
    
    currentStep.value = 2
  } finally {
    importLoading.value = false
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

const resetImport = () => {
  currentStep.value = 1
  importResult.value = null
  selectedFile.value = null
  fileList.value = []
}

const handleClose = () => {
  // 重置状态
  currentStep.value = 0
  importResult.value = null
  selectedFile.value = null
  fileList.value = []
  downloadLoading.value = false
  importLoading.value = false
  
  emit('update:modelValue', false)
}

const formatFileSize = (size: number) => {
  if (size < 1024) {
    return size + ' B'
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + ' KB'
  } else {
    return (size / (1024 * 1024)).toFixed(2) + ' MB'
  }
}

const formatTime = (timestamp: number) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}
</script>

<style lang="scss" scoped>
.import-content {
  .step-content {
    margin-top: 30px;
    min-height: 300px;
  }
  
  .template-info {
    margin-bottom: 20px;
    
    :deep(.el-alert__content) {
      p {
        margin: 5px 0;
        line-height: 1.5;
      }
    }
  }
  
  .template-download {
    text-align: center;
    margin: 40px 0;
  }
  
  .upload-area {
    margin-bottom: 20px;
    
    :deep(.el-upload-dragger) {
      width: 100%;
    }
  }
  
  .file-info {
    margin-bottom: 20px;
  }
  
  .import-result {
    .result-stats {
      margin-top: 20px;
    }
    
    .error-details {
      margin-top: 20px;
      text-align: left;
    }
  }
  
  .step-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;
  }
}
</style>