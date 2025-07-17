<template>
  <div class="cattle-list">
    <div class="page-header">
      <h1 class="page-title">牛只管理</h1>
      <p class="page-description">管理牛只档案信息</p>
    </div>

    <div class="page-content">
      <el-card>
        <div class="toolbar">
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            添加牛只
          </el-button>
        </div>

        <el-table :data="cattleList" v-loading="loading">
          <el-table-column prop="earTag" label="耳标号" width="120" />
          <el-table-column prop="breed" label="品种" width="100" />
          <el-table-column prop="gender" label="性别" width="80">
            <template #default="{ row }">
              {{ row.gender === 'male' ? '公' : '母' }}
            </template>
          </el-table-column>
          <el-table-column prop="weight" label="体重(kg)" width="100" />
          <el-table-column prop="healthStatus" label="健康状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getHealthStatusType(row.healthStatus)">
                {{ getHealthStatusText(row.healthStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button size="small" @click="viewDetail(row)">详情</el-button>
              <el-button size="small" type="primary" @click="editCattle(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteCattle(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useCattleStore } from '@/stores'
import dayjs from 'dayjs'

const cattleStore = useCattleStore()

const cattleList = ref<any[]>([])
const loading = ref(false)

onMounted(() => {
  loadCattleList()
})

const loadCattleList = async () => {
  loading.value = true
  try {
    await cattleStore.fetchCattleList()
    cattleList.value = cattleStore.cattleList
  } catch (error) {
    ElMessage.error('加载牛只列表失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  ElMessage.info('添加牛只功能开发中')
}

const viewDetail = (cattle: any) => {
  ElMessage.info('查看详情功能开发中')
}

const editCattle = (cattle: any) => {
  ElMessage.info('编辑牛只功能开发中')
}

const deleteCattle = (cattle: any) => {
  ElMessage.info('删除牛只功能开发中')
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

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}
</script>

<style lang="scss" scoped>
.cattle-list {
  .toolbar {
    margin-bottom: 16px;
  }
}
</style>