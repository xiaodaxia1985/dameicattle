<template>
  <div class="patrol-tasks-page">
    <div class="page-header">
      <div class="header-left">
        <h1>今日巡圈任务</h1>
        <p class="header-desc">查看和管理今日的巡圈任务完成情况</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="quickPatrol">
          <el-icon><Plus /></el-icon>
          快速巡圈
        </el-button>
        <el-button @click="refreshTasks">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 基地选择 -->
    <el-card class="base-selector" shadow="never">
      <el-row :gutter="16">
        <el-col :span="8">
          <div class="selector-item">
            <label>选择基地</label>
            <el-select v-model="selectedBase" placeholder="选择基地" @change="handleBaseChange">
              <el-option
                v-for="base in bases"
                :key="base.id"
                :label="base.name"
                :value="base.id"
              />
            </el-select>
          </div>
        </el-col>
        <el-col :span="16">
          <div class="task-summary">
            <div class="summary-item">
              <span class="label">今日日期：</span>
              <span class="value">{{ tasks.date }}</span>
            </div>
            <div class="summary-item">
              <span class="label">总体完成度：</span>
              <el-progress 
                :percentage="tasks.overall_completion" 
                :color="getProgressColor(tasks.overall_completion)"
                style="width: 200px"
              />
            </div>
            <div class="summary-item">
              <span class="label">已完成：</span>
              <span class="value">{{ tasks.completed_tasks }}/{{ tasks.total_tasks }}</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 任务列表 -->
    <div class="tasks-grid">
      <el-row :gutter="20">
        <el-col 
          v-for="task in tasks.tasks" 
          :key="task.barn_id" 
          :span="12"
        >
          <el-card class="task-card" :class="getTaskCardClass(task.completion_rate)">
            <template #header>
              <div class="task-header">
                <div class="barn-info">
                  <h3>{{ task.barn_name }}</h3>
                  <span class="barn-code">{{ task.barn_code }}</span>
                </div>
                <div class="completion-badge">
                  <el-progress 
                    type="circle" 
                    :percentage="task.completion_rate" 
                    :width="60"
                    :color="getProgressColor(task.completion_rate)"
                  />
                </div>
              </div>
            </template>

            <div class="task-content">
              <!-- 牛只信息 -->
              <div class="cattle-info">
                <el-icon><Grid /></el-icon>
                <span>牛只数量：{{ task.cattle_count }}头</span>
              </div>

              <!-- 巡圈任务状态 -->
              <div class="patrol-status">
                <div class="status-item">
                  <div class="status-label">
                    <el-icon><Sunrise /></el-icon>
                    喂食前巡圈
                  </div>
                  <div class="status-value">
                    <el-tag 
                      :type="task.completed_patrols.includes('before_feeding') ? 'success' : 'info'"
                      size="small"
                    >
                      {{ task.completed_patrols.includes('before_feeding') ? '已完成' : '待完成' }}
                    </el-tag>
                    <el-button 
                      v-if="!task.completed_patrols.includes('before_feeding')"
                      type="text" 
                      size="small"
                      @click="startPatrol(task, 'before_feeding')"
                    >
                      开始巡圈
                    </el-button>
                  </div>
                </div>

                <div class="status-item">
                  <div class="status-label">
                    <el-icon><Sunset /></el-icon>
                    喂食后巡圈
                  </div>
                  <div class="status-value">
                    <el-tag 
                      :type="task.completed_patrols.includes('after_feeding') ? 'success' : 'info'"
                      size="small"
                    >
                      {{ task.completed_patrols.includes('after_feeding') ? '已完成' : '待完成' }}
                    </el-tag>
                    <el-button 
                      v-if="!task.completed_patrols.includes('after_feeding')"
                      type="text" 
                      size="small"
                      @click="startPatrol(task, 'after_feeding')"
                    >
                      开始巡圈
                    </el-button>
                  </div>
                </div>
              </div>

              <!-- 待完成任务提醒 -->
              <div v-if="task.pending_patrols.length > 0" class="pending-tasks">
                <el-alert
                  :title="`还有 ${task.pending_patrols.length} 项巡圈任务待完成`"
                  type="warning"
                  :closable="false"
                  show-icon
                  size="small"
                />
              </div>

              <!-- 操作按钮 -->
              <div class="task-actions">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="viewBarnRecords(task)"
                  style="width: 100%"
                >
                  查看巡圈记录
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 快速巡圈对话框 -->
    <el-dialog
      v-model="quickPatrolDialogVisible"
      title="快速巡圈"
      width="600px"
      @close="resetQuickPatrolForm"
    >
      <el-form
        ref="quickPatrolFormRef"
        :model="quickPatrolForm"
        :rules="quickPatrolRules"
        label-width="100px"
      >
        <el-form-item label="选择牛棚" prop="barnId">
          <el-select v-model="quickPatrolForm.barnId" placeholder="选择牛棚" style="width: 100%">
            <el-option
              v-for="task in tasks.tasks"
              :key="task.barn_id"
              :label="`${task.barn_name} (${task.barn_code})`"
              :value="task.barn_id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="巡圈类型" prop="patrolType">
          <el-radio-group v-model="quickPatrolForm.patrolType">
            <el-radio label="before_feeding">喂食前巡圈</el-radio>
            <el-radio label="after_feeding">喂食后巡圈</el-radio>
            <el-radio label="routine">常规巡圈</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="总牛只数" prop="totalCattleCount">
          <el-input-number
            v-model="quickPatrolForm.totalCattleCount"
            :min="0"
            :max="1000"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="躺卧牛只数">
          <el-input-number
            v-model="quickPatrolForm.lyingCattleCount"
            :min="0"
            :max="quickPatrolForm.totalCattleCount"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="设施状态">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-checkbox v-model="quickPatrolForm.feedTroughClean">草料槽干净</el-checkbox>
            </el-col>
            <el-col :span="12">
              <el-checkbox v-model="quickPatrolForm.waterTroughClean">水槽干净</el-checkbox>
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="quickPatrolForm.overallNotes"
            type="textarea"
            :rows="3"
            placeholder="巡圈备注"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="quickPatrolDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitQuickPatrol" :loading="submitting">
          提交巡圈记录
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Refresh, Grid, Sunrise, Sunset } from '@element-plus/icons-vue'
import { patrolApi } from '@/api/patrol'
import { baseApi } from '@/api/base'
import type { TodayPatrolTasks } from '@/api/patrol'
import { useRouter } from 'vue-router'

const router = useRouter()

// 响应式数据
const bases = ref<any[]>([])
const selectedBase = ref<number>()
const loading = ref(false)
const submitting = ref(false)
const tasks = ref<TodayPatrolTasks>({
  date: '',
  base_id: 0,
  overall_completion: 0,
  total_barns: 0,
  total_tasks: 0,
  completed_tasks: 0,
  tasks: []
})

// 快速巡圈对话框
const quickPatrolDialogVisible = ref(false)
const quickPatrolFormRef = ref()
const quickPatrolForm = ref({
  barnId: 0,
  patrolType: 'before_feeding' as 'before_feeding' | 'after_feeding' | 'routine',
  totalCattleCount: 0,
  lyingCattleCount: 0,
  feedTroughClean: true,
  waterTroughClean: true,
  overallNotes: ''
})

const quickPatrolRules = {
  barnId: [
    { required: true, message: '请选择牛棚', trigger: 'change' }
  ],
  patrolType: [
    { required: true, message: '请选择巡圈类型', trigger: 'change' }
  ],
  totalCattleCount: [
    { required: true, message: '请输入总牛只数', trigger: 'blur' },
    { type: 'number', min: 0, message: '总牛只数不能小于0', trigger: 'blur' }
  ]
}

// 获取基地列表
const fetchBases = async () => {
  try {
    const response = await baseApi.getBases()
    bases.value = response.data.bases || []
    if (bases.value.length > 0) {
      selectedBase.value = bases.value[0].id
    }
  } catch (error) {
    console.error('获取基地列表失败:', error)
  }
}

// 获取今日任务
const fetchTodayTasks = async () => {
  if (!selectedBase.value) return

  loading.value = true
  try {
    const response = await patrolApi.getTodayPatrolTasks({
      base_id: selectedBase.value
    })
    tasks.value = response.data
  } catch (error) {
    console.error('获取今日任务失败:', error)
    ElMessage.error('获取今日任务失败')
  } finally {
    loading.value = false
  }
}

// 事件处理
const handleBaseChange = () => {
  fetchTodayTasks()
}

const refreshTasks = () => {
  fetchTodayTasks()
}

const quickPatrol = () => {
  if (tasks.value.tasks.length === 0) {
    ElMessage.warning('暂无可巡圈的牛棚')
    return
  }
  quickPatrolDialogVisible.value = true
}

const startPatrol = (task: any, patrolType: string) => {
  quickPatrolForm.value = {
    barnId: task.barn_id,
    patrolType: patrolType as any,
    totalCattleCount: task.cattle_count,
    lyingCattleCount: 0,
    feedTroughClean: true,
    waterTroughClean: true,
    overallNotes: ''
  }
  quickPatrolDialogVisible.value = true
}

const viewBarnRecords = (task: any) => {
  // 跳转到巡圈记录页面，并筛选该牛棚的记录
  router.push({
    name: 'PatrolRecords',
    query: {
      base_id: selectedBase.value,
      barn_id: task.barn_id
    }
  })
}

const submitQuickPatrol = async () => {
  if (!quickPatrolFormRef.value) return

  try {
    await quickPatrolFormRef.value.validate()
    
    submitting.value = true
    
    const now = new Date()
    const patrolData = {
      base_id: selectedBase.value!,
      barn_id: quickPatrolForm.value.barnId,
      patrol_date: now.toISOString().split('T')[0],
      patrol_time: now.toTimeString().slice(0, 5),
      patrol_type: quickPatrolForm.value.patrolType,
      total_cattle_count: quickPatrolForm.value.totalCattleCount,
      lying_cattle_count: quickPatrolForm.value.lyingCattleCount,
      feed_trough_clean: quickPatrolForm.value.feedTroughClean,
      water_trough_clean: quickPatrolForm.value.waterTroughClean,
      overall_notes: quickPatrolForm.value.overallNotes
    }
    
    await patrolApi.createPatrolRecord(patrolData)
    ElMessage.success('巡圈记录提交成功')
    
    quickPatrolDialogVisible.value = false
    fetchTodayTasks() // 刷新任务列表
  } catch (error) {
    console.error('提交巡圈记录失败:', error)
    ElMessage.error('提交巡圈记录失败')
  } finally {
    submitting.value = false
  }
}

const resetQuickPatrolForm = () => {
  quickPatrolForm.value = {
    barnId: 0,
    patrolType: 'before_feeding',
    totalCattleCount: 0,
    lyingCattleCount: 0,
    feedTroughClean: true,
    waterTroughClean: true,
    overallNotes: ''
  }
  if (quickPatrolFormRef.value) {
    quickPatrolFormRef.value.clearValidate()
  }
}

// 工具函数
const getProgressColor = (percentage: number) => {
  if (percentage >= 100) return '#67c23a'
  if (percentage >= 50) return '#e6a23c'
  return '#f56c6c'
}

const getTaskCardClass = (completionRate: number) => {
  if (completionRate >= 100) return 'completed'
  if (completionRate >= 50) return 'in-progress'
  return 'pending'
}

// 组件挂载
onMounted(() => {
  fetchBases()
})

// 监听基地变化
watch(() => selectedBase.value, () => {
  if (selectedBase.value) {
    fetchTodayTasks()
  }
})
</script>

<style scoped lang="scss">
.patrol-tasks-page {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;

    .header-left {
      h1 {
        margin: 0 0 4px 0;
        color: #303133;
        font-size: 24px;
        font-weight: 600;
      }

      .header-desc {
        margin: 0;
        color: #909399;
        font-size: 14px;
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }

  .base-selector {
    margin-bottom: 20px;

    .selector-item {
      label {
        display: block;
        font-size: 14px;
        color: #606266;
        margin-bottom: 8px;
        font-weight: 500;
      }
    }

    .task-summary {
      display: flex;
      align-items: center;
      gap: 24px;
      height: 40px;

      .summary-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .label {
          font-size: 14px;
          color: #606266;
        }

        .value {
          font-size: 14px;
          color: #303133;
          font-weight: 500;
        }
      }
    }
  }

  .tasks-grid {
    .task-card {
      margin-bottom: 20px;
      transition: all 0.3s ease;

      &.completed {
        border-left: 4px solid #67c23a;
      }

      &.in-progress {
        border-left: 4px solid #e6a23c;
      }

      &.pending {
        border-left: 4px solid #f56c6c;
      }

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .task-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .barn-info {
          h3 {
            margin: 0 0 4px 0;
            color: #303133;
            font-size: 18px;
            font-weight: 600;
          }

          .barn-code {
            color: #909399;
            font-size: 12px;
          }
        }

        .completion-badge {
          flex-shrink: 0;
        }
      }

      .task-content {
        .cattle-info {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding: 8px 12px;
          background: #f5f7fa;
          border-radius: 4px;
          font-size: 14px;
          color: #606266;
        }

        .patrol-status {
          margin-bottom: 16px;

          .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;

            &:last-child {
              border-bottom: none;
            }

            .status-label {
              display: flex;
              align-items: center;
              gap: 6px;
              font-size: 14px;
              color: #606266;
            }

            .status-value {
              display: flex;
              align-items: center;
              gap: 8px;
            }
          }
        }

        .pending-tasks {
          margin-bottom: 16px;
        }

        .task-actions {
          margin-top: 16px;
        }
      }
    }
  }
}
</style>