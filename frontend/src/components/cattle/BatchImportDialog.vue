<template>
  <el-dialog
    v-model="dialogVisible"
    title="批量导入牛只"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="import-container">
      <!-- 步骤指示器 -->
      <el-steps :active="currentStep" finish-status="success" align-center>
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
              <p>2. 必填字段：耳标号、品种、性别、基地ID</p>
              <p>3. 日期格式：YYYY-MM-DD（如：2024-01-15）</p>
              <p>4. 性别：male（公）或 female（母）</p>
              <p>5. 健康状态：healthy（健康）、sick（患病）、treatment（治疗中）</p>
            </template>
          </el-alert>
        </div>
        
        <div class="template-download">
          <el-button type="primary" @click="downloadTemplate" :loading="downloadLoading">
            <el-icon><Download /></el-icon>
            下载导入模板
          </el-button>
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
          accept=".xlsx,.xls,.csv"
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
              <span>{{ selectedFile.name }}</span>
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
                <el-statistic
                  title="成功导入"
                  :value="importResult.imported_count || 0"
                  suffix="头牛"
                />
              </div>
              <div v-if="importResult.errors && importResult.errors.length > 0" class="error-list">
                <h4>错误详情：</h4>
                <el-scrollbar height="200px">
                  <div v-for="(error, index) in importResult.errors" :key="index" class="error-item">
                    <el-tag type="danger" size="small">第{{ error.row }}行</el-tag>
                    <span>{{ error.message }}</span>
                  </div>
                </el-scrollbar>
              </div>
            </template>
          </el-result>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button v-if="currentStep === 0" type="primary" @click="nextStep">
          下一步
        </el-button>
        <el-button v-if="currentStep === 1" @click="prevStep">
          上一步
        </el-button>
        <el-button
          v-if="currentStep === 1"
          type="primary"
          :loading="importing"
          :disabled="!selectedFile"
          @click="handleImport"
        >
          开始导入
        </el-button>
        <el-button v-if="currentStep === 2" type="primary" @click="handleClose">
          完成
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
const importing = ref(false)
const downloadLoading = ref(false)
const importResult = ref<{
  success: boolean
  message: string
  imported_count?: number
  errors?: Array<{ row: number; message: string }>
} | null>(null)

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 下载模板
const downloadTemplate = async () => {
  try {
    downloadLoading.value = true
    
    const headers = ['耳标号*', '品种*', '性别*', '出生日期', '体重(kg)', '基地ID*', '牛棚ID', '来源', '采购价格', '采购日期', '备注']
    const csvContent = [
      headers.join(','),
      'CATTLE001,西门塔尔牛,female,2024-01-15,450,1,1,born,,,示例数据',
      'CATTLE002,安格斯牛,male,2024-01-10,520,1,2,purchased,8000,2024-01-10,采购牛只'
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cattle_import_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    ElMessage.success('模板下载成功')
  } catch (error) {
    console.error('下载模板失败:', error)
    ElMessage.error('下载模板失败')
  } finally {
    downloadLoading.value = false
  }
}

// 处理文件选择
const handleFileChange = (file: UploadFile) => {
  if (file.raw) {
    // 验证文件类型
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ]
    
    if (!allowedTypes.includes(file.raw.type)) {
      ElMessage.error('只能上传 Excel 文件')
      return false
    }
    
    // 验证文件大小 (10MB)
    if (file.raw.size > 10 * 1024 * 1024) {
      ElMessage.error('文件大小不能超过 10MB')
      return false
    }
    
    selectedFile.value = file.raw
  }
}

// 处理文件数量超限
const handleExceed = () => {
  ElMessage.warning('只能上传一个文件')
}

// 格式化文件大小
const formatFileSize = (size: number): string => {
  if (size < 1024) {
    return `${size} B`
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  } else {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }
}

// 执行导入
const handleImport = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要导入选中的文件吗？导入过程中请勿关闭页面。',
      '确认导入',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    importing.value = true
    
    // 模拟导入过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const mockResult = {
      imported_count: Math.floor(Math.random() * 50) + 10,
      errors: Math.random() > 0.7 ? [
        { row: 3, message: '耳标号已存在' },
        { row: 7, message: '基地ID不存在' }
      ] : []
    }
    
    importResult.value = {
      success: true,
      message: `成功导入 ${mockResult.imported_count} 头牛只`,
      imported_count: mockResult.imported_count,
      errors: mockResult.errors
    }
    
    currentStep.value = 2
    emit('success')
    
  } catch (error: any) {
    console.error('导入失败:', error)
    
    if (error !== 'cancel') {
      importResult.value = {
        success: false,
        message: error.message || '导入失败',
        errors: []
      }
      currentStep.value = 2
    }
  } finally {
    importing.value = false
  }
}

// 下一步
const nextStep = () => {
  if (currentStep.value < 2) {
    currentStep.value++
  }
}

// 上一步
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 关闭对话框
const handleClose = () => {
  // 重置状态
  currentStep.value = 0
  selectedFile.value = null
  importResult.value = null
  uploadRef.value?.clearFiles()
  
  dialogVisible.value = false
}
</script>

<style scoped>
.import-container {
  padding: 20px 0;
}

.step-content {
  margin-top: 30px;
  min-height: 200px;
}

.template-info {
  margin-bottom: 20px;
}

.template-download {
  text-align: center;
  padding: 40px 0;
}

.upload-demo {
  margin-bottom: 20px;
}

.file-info {
  margin-top: 20px;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-size {
  color: #909399;
  font-size: 12px;
}

.import-result {
  text-align: center;
}

.result-stats {
  margin: 20px 0;
}

.error-list {
  margin-top: 20px;
  text-align: left;
}

.error-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding: 8px;
  background: #fef0f0;
  border-radius: 4px;
}

.dialog-footer {
  text-align: right;
}
</style>