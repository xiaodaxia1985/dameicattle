<template>
  <el-dialog
    v-model="visible"
    title="在线客服"
    width="500px"
    :before-close="handleClose"
    class="chat-dialog"
  >
    <div class="chat-container">
      <!-- 聊天消息区域 -->
      <div class="chat-messages" ref="messagesContainer">
        <div
          v-for="message in messages"
          :key="message.id"
          :class="['message', message.isStaff ? 'staff-message' : 'user-message']"
        >
          <div class="message-avatar">
            <el-avatar
              :size="32"
              :src="message.user?.avatar"
              :icon="message.isStaff ? 'Service' : 'User'"
            />
          </div>
          <div class="message-content">
            <div class="message-header">
              <span class="sender-name">
                {{ message.isStaff ? '客服' : (message.user?.realName || '我') }}
              </span>
              <span class="message-time">
                {{ formatTime(message.createdAt) }}
              </span>
            </div>
            <div class="message-body">
              <div v-if="message.type === 'text'" class="text-message">
                {{ message.message }}
              </div>
              <div v-else-if="message.type === 'image'" class="image-message">
                <el-image
                  :src="message.message"
                  :preview-src-list="[message.message]"
                  fit="cover"
                  style="max-width: 200px; max-height: 200px;"
                />
              </div>
              <div v-else-if="message.type === 'file'" class="file-message">
                <el-link :href="message.message" target="_blank">
                  <el-icon><Document /></el-icon>
                  {{ getFileName(message.message) }}
                </el-link>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 客服正在输入提示 -->
        <div v-if="staffTyping" class="typing-indicator">
          <div class="message staff-message">
            <div class="message-avatar">
              <el-avatar :size="32" icon="Service" />
            </div>
            <div class="message-content">
              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input">
        <div class="input-toolbar">
          <el-upload
            :show-file-list="false"
            :before-upload="handleImageUpload"
            accept="image/*"
            action="#"
          >
            <el-button size="small" type="text">
              <el-icon><Picture /></el-icon>
            </el-button>
          </el-upload>
          
          <el-upload
            :show-file-list="false"
            :before-upload="handleFileUpload"
            action="#"
          >
            <el-button size="small" type="text">
              <el-icon><Paperclip /></el-icon>
            </el-button>
          </el-upload>
        </div>
        
        <div class="input-area">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="输入消息..."
            @keydown.enter.exact="handleSendMessage"
            @keydown.enter.shift.exact.prevent="inputMessage += '\n'"
            :disabled="!sessionId || sending"
          />
          <el-button
            type="primary"
            @click="handleSendMessage"
            :loading="sending"
            :disabled="!inputMessage.trim() || !sessionId"
          >
            发送
          </el-button>
        </div>
      </div>
    </div>

    <!-- 初始化表单 -->
    <div v-if="!sessionId" class="init-form">
      <el-form @submit.prevent="initSession">
        <el-form-item label="咨询主题">
          <el-input v-model="initData.subject" placeholder="请简要描述您的问题" />
        </el-form-item>
        <el-form-item label="详细描述">
          <el-input
            v-model="initData.initialMessage"
            type="textarea"
            :rows="4"
            placeholder="请详细描述您遇到的问题..."
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="initSession" :loading="initializing">
            开始咨询
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="session-info" v-if="sessionId">
          <span class="session-status">
            <el-icon :class="statusIcon"><CircleCheck /></el-icon>
            {{ statusText }}
          </span>
        </div>
        <div class="footer-actions">
          <el-button @click="handleClose">关闭</el-button>
          <el-button v-if="sessionId" @click="endSession" type="danger" plain>
            结束会话
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Service,
  User,
  Document,
  Picture,
  Paperclip,
  CircleCheck
} from '@element-plus/icons-vue'
import { helpApi } from '@/api/help'
import { uploadApi } from '@/api/upload'
import { formatTime } from '@/utils/date'

// Props & Emits
const emit = defineEmits(['close'])

// 响应式数据
const visible = ref(true)
const sessionId = ref(null)
const messages = ref([])
const inputMessage = ref('')
const sending = ref(false)
const initializing = ref(false)
const staffTyping = ref(false)
const messagesContainer = ref(null)

// 初始化数据
const initData = reactive({
  subject: '',
  initialMessage: ''
})

// WebSocket连接
let websocket = null
let heartbeatTimer = null

// 计算属性
const statusIcon = computed(() => {
  return sessionId.value ? 'status-online' : 'status-offline'
})

const statusText = computed(() => {
  return sessionId.value ? '会话进行中' : '未连接'
})

// 方法
const handleClose = async () => {
  if (sessionId.value) {
    try {
      await ElMessageBox.confirm('确定要关闭会话吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
    } catch {
      return
    }
  }
  
  closeWebSocket()
  visible.value = false
  emit('close')
}

const initSession = async () => {
  if (!initData.subject.trim()) {
    ElMessage.warning('请输入咨询主题')
    return
  }

  initializing.value = true
  try {
    const response = await helpApi.initChatSession({
      subject: initData.subject,
      initialMessage: initData.initialMessage
    })
    
    sessionId.value = response.data.sessionId
    await loadMessages()
    initWebSocket()
    
    ElMessage.success('会话创建成功')
  } catch (error) {
    ElMessage.error('创建会话失败')
  } finally {
    initializing.value = false
  }
}

const loadMessages = async () => {
  if (!sessionId.value) return

  try {
    const response = await helpApi.getChatMessages(sessionId.value)
    messages.value = response.data.messages
    await nextTick()
    scrollToBottom()
  } catch (error) {
    ElMessage.error('加载消息失败')
  }
}

const handleSendMessage = async () => {
  if (!inputMessage.value.trim() || !sessionId.value || sending.value) {
    return
  }

  const message = inputMessage.value.trim()
  inputMessage.value = ''
  sending.value = true

  try {
    await helpApi.sendChatMessage(sessionId.value, {
      message,
      type: 'text'
    })
    
    // 消息会通过WebSocket接收，这里不需要手动添加
  } catch (error) {
    ElMessage.error('发送消息失败')
    inputMessage.value = message // 恢复消息内容
  } finally {
    sending.value = false
  }
}

const handleImageUpload = async (file) => {
  if (!sessionId.value) {
    ElMessage.warning('请先开始会话')
    return false
  }

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'chat_image')
    
    const response = await uploadApi.uploadImage(formData)
    
    await helpApi.sendChatMessage(sessionId.value, {
      message: response.data.url,
      type: 'image'
    })
    
    ElMessage.success('图片发送成功')
  } catch (error) {
    ElMessage.error('图片上传失败')
  }
  
  return false // 阻止默认上传行为
}

const handleFileUpload = async (file) => {
  if (!sessionId.value) {
    ElMessage.warning('请先开始会话')
    return false
  }

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'chat_file')
    
    const response = await uploadApi.uploadFile(formData)
    
    await helpApi.sendChatMessage(sessionId.value, {
      message: response.data.url,
      type: 'file'
    })
    
    ElMessage.success('文件发送成功')
  } catch (error) {
    ElMessage.error('文件上传失败')
  }
  
  return false
}

const endSession = async () => {
  try {
    await ElMessageBox.confirm('确定要结束会话吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    // 发送结束会话消息
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({
        type: 'end_session',
        sessionId: sessionId.value
      }))
    }
    
    closeWebSocket()
    sessionId.value = null
    messages.value = []
    
    ElMessage.success('会话已结束')
  } catch {
    // 用户取消
  }
}

const initWebSocket = () => {
  if (!sessionId.value) return

  const wsUrl = `${import.meta.env.VITE_WS_URL}/chat/${sessionId.value}`
  websocket = new WebSocket(wsUrl)

  websocket.onopen = () => {
    console.log('WebSocket连接已建立')
    startHeartbeat()
  }

  websocket.onmessage = (event) => {
    const data = JSON.parse(event.data)
    handleWebSocketMessage(data)
  }

  websocket.onclose = () => {
    console.log('WebSocket连接已关闭')
    stopHeartbeat()
  }

  websocket.onerror = (error) => {
    console.error('WebSocket错误:', error)
    ElMessage.error('连接异常，请刷新重试')
  }
}

const handleWebSocketMessage = (data) => {
  switch (data.type) {
    case 'new_message':
      messages.value.push(data.message)
      nextTick(() => scrollToBottom())
      break
    
    case 'staff_typing':
      staffTyping.value = data.typing
      if (data.typing) {
        nextTick(() => scrollToBottom())
      }
      break
    
    case 'session_ended':
      ElMessage.info('客服已结束会话')
      sessionId.value = null
      break
    
    case 'staff_joined':
      ElMessage.success('客服已加入会话')
      break
  }
}

const startHeartbeat = () => {
  heartbeatTimer = setInterval(() => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      websocket.send(JSON.stringify({ type: 'ping' }))
    }
  }, 30000) // 30秒心跳
}

const stopHeartbeat = () => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

const closeWebSocket = () => {
  stopHeartbeat()
  if (websocket) {
    websocket.close()
    websocket = null
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const getFileName = (url) => {
  return url.split('/').pop() || '文件'
}

// 生命周期
onMounted(() => {
  // 如果用户已登录，可以自动显示历史会话
})

onUnmounted(() => {
  closeWebSocket()
})
</script>

<style scoped>
.chat-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.chat-container {
  height: 500px;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f7fa;
}

.message {
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
}

.user-message {
  flex-direction: row-reverse;
}

.user-message .message-content {
  margin-right: 10px;
  margin-left: 0;
}

.staff-message .message-content {
  margin-left: 10px;
  margin-right: 0;
}

.message-content {
  max-width: 70%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-size: 12px;
  color: #999;
}

.user-message .message-header {
  flex-direction: row-reverse;
}

.sender-name {
  font-weight: 500;
}

.message-body {
  background: white;
  padding: 10px 15px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.user-message .message-body {
  background: #409eff;
  color: white;
}

.text-message {
  word-wrap: break-word;
  white-space: pre-wrap;
}

.image-message,
.file-message {
  max-width: 200px;
}

.typing-indicator {
  margin-bottom: 20px;
}

.typing-dots {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ccc;
  margin-right: 4px;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.chat-input {
  border-top: 1px solid #e0e0e0;
  padding: 15px 20px;
  background: white;
}

.input-toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.input-area {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.input-area .el-input {
  flex: 1;
}

.init-form {
  padding: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.session-info {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #666;
}

.session-status {
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-online {
  color: #67c23a;
}

.status-offline {
  color: #f56c6c;
}

.footer-actions {
  display: flex;
  gap: 10px;
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>