<template>
  <view class="health-container">
    <!-- 统计卡片 -->
    <view class="stats-section">
      <view class="stat-card healthy">
        <view class="stat-value">{{ healthStats.healthy || 0 }}</view>
        <view class="stat-label">健康牛只</view>
      </view>
      <view class="stat-card sick">
        <view class="stat-value">{{ healthStats.sick || 0 }}</view>
        <view class="stat-label">患病牛只</view>
      </view>
      <view class="stat-card alert">
        <view class="stat-value">{{ alertCount || 0 }}</view>
        <view class="stat-label">健康预警</view>
      </view>
    </view>

    <!-- 标签页 -->
    <view class="tabs-section">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'records' }"
        @click="switchTab('records')"
      >
        健康记录
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'vaccines' }"
        @click="switchTab('vaccines')"
      >
        疫苗接种
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'alerts' }"
        @click="switchTab('alerts')"
      >
        健康预警
      </view>
    </view>

    <!-- 健康记录列表 -->
    <view v-if="activeTab === 'records'" class="content-section">
      <!-- 搜索栏 -->
      <view class="search-section">
        <uni-search-bar 
          v-model="searchText" 
          placeholder="搜索牛只耳标"
          @input="onSearchInput"
          @confirm="loadHealthRecords"
        />
      </view>

      <!-- 筛选栏 -->
      <view class="filter-section">
        <picker 
          :range="statusFilterOptions" 
          :value="statusFilterIndex"
          @change="onStatusFilterChange"
        >
          <view class="filter-item">
            状态: {{ statusFilterOptions[statusFilterIndex] }}
            <uni-icons type="arrowdown" size="14" />
          </view>
        </picker>
      </view>

      <!-- 记录列表 -->
      <view class="list-section">
        <view v-if="loading" class="loading-section">
          <uni-load-more status="loading" />
        </view>
        
        <view v-else-if="healthRecords.length === 0" class="empty-section">
          <uni-icons type="info" size="60" color="#ccc" />
          <text class="empty-text">暂无健康记录</text>
          <button class="add-btn" @click="navigateToAddRecord">添加记录</button>
        </view>
        
        <view v-else class="record-list">
          <view 
            v-for="record in healthRecords" 
            :key="record.id" 
            class="record-item"
            @click="viewRecordDetail(record.id)"
          >
            <view class="record-header">
              <view class="cattle-tag">{{ record.cattle?.ear_tag }}</view>
              <view class="record-status" :class="record.status">
                {{ getStatusText(record.status) }}
              </view>
            </view>
            
            <view class="record-content">
              <view class="record-field">
                <text class="field-label">症状:</text>
                <text class="field-value">{{ record.symptoms || '无' }}</text>
              </view>
              <view class="record-field">
                <text class="field-label">诊断:</text>
                <text class="field-value">{{ record.diagnosis || '无' }}</text>
              </view>
              <view class="record-field">
                <text class="field-label">治疗:</text>
                <text class="field-value">{{ record.treatment || '无' }}</text>
              </view>
            </view>
            
            <view class="record-footer">
              <text class="record-date">{{ formatDate(record.diagnosis_date) }}</text>
              <view class="record-actions">
                <button 
                  class="action-btn edit" 
                  @click.stop="editRecord(record.id)"
                  size="mini"
                >
                  编辑
                </button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 疫苗接种列表 -->
    <view v-if="activeTab === 'vaccines'" class="content-section">
      <!-- 搜索栏 -->
      <view class="search-section">
        <uni-search-bar 
          v-model="vaccineSearchText" 
          placeholder="搜索牛只耳标"
          @input="onVaccineSearchInput"
          @confirm="loadVaccineRecords"
        />
      </view>

      <!-- 筛选栏 -->
      <view class="filter-section">
        <picker 
          :range="vaccineFilterOptions" 
          :value="vaccineFilterIndex"
          @change="onVaccineFilterChange"
        >
          <view class="filter-item">
            疫苗: {{ vaccineFilterOptions[vaccineFilterIndex] }}
            <uni-icons type="arrowdown" size="14" />
          </view>
        </picker>
        
        <view class="filter-item switch-item">
          <text>即将到期</text>
          <switch 
            :checked="showDueSoonOnly" 
            @change="toggleDueSoonFilter"
            color="#1890ff"
          />
        </view>
      </view>

      <!-- 疫苗列表 -->
      <view class="list-section">
        <view v-if="loadingVaccines" class="loading-section">
          <uni-load-more status="loading" />
        </view>
        
        <view v-else-if="vaccineRecords.length === 0" class="empty-section">
          <uni-icons type="info" size="60" color="#ccc" />
          <text class="empty-text">暂无疫苗接种记录</text>
          <button class="add-btn" @click="navigateToAddVaccine">添加接种记录</button>
        </view>
        
        <view v-else class="vaccine-list">
          <view 
            v-for="vaccine in vaccineRecords" 
            :key="vaccine.id" 
            class="vaccine-item"
            @click="viewVaccineDetail(vaccine.id)"
          >
            <view class="vaccine-header">
              <view class="cattle-tag">{{ vaccine.cattle?.ear_tag }}</view>
              <view class="vaccine-name">{{ vaccine.vaccine_name }}</view>
            </view>
            
            <view class="vaccine-content">
              <view class="vaccine-dates">
                <view class="date-item">
                  <text class="date-label">接种日期:</text>
                  <text class="date-value">{{ formatDate(vaccine.vaccination_date) }}</text>
                </view>
                <view v-if="vaccine.next_due_date" class="date-item">
                  <text class="date-label">下次接种:</text>
                  <text 
                    class="date-value" 
                    :class="getDueDateClass(vaccine.next_due_date)"
                  >
                    {{ formatDate(vaccine.next_due_date) }}
                  </text>
                </view>
              </view>
              
              <view v-if="vaccine.batch_number" class="vaccine-info">
                <text class="info-label">批次号:</text>
                <text class="info-value">{{ vaccine.batch_number }}</text>
              </view>
            </view>
            
            <view class="vaccine-footer">
              <text v-if="vaccine.veterinarian" class="veterinarian">
                兽医: {{ vaccine.veterinarian.real_name }}
              </text>
              <view class="vaccine-actions">
                <button 
                  v-if="isVaccineDueSoon(vaccine.next_due_date)"
                  class="action-btn renew" 
                  @click.stop="renewVaccine(vaccine.id)"
                  size="mini"
                >
                  续种
                </button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 健康预警列表 -->
    <view v-if="activeTab === 'alerts'" class="content-section">
      <!-- 筛选栏 -->
      <view class="filter-section">
        <picker 
          :range="alertTypeFilterOptions" 
          :value="alertTypeFilterIndex"
          @change="onAlertTypeFilterChange"
        >
          <view class="filter-item">
            类型: {{ alertTypeFilterOptions[alertTypeFilterIndex] }}
            <uni-icons type="arrowdown" size="14" />
          </view>
        </picker>
        
        <picker 
          :range="alertSeverityFilterOptions" 
          :value="alertSeverityFilterIndex"
          @change="onAlertSeverityFilterChange"
        >
          <view class="filter-item">
            严重程度: {{ alertSeverityFilterOptions[alertSeverityFilterIndex] }}
            <uni-icons type="arrowdown" size="14" />
          </view>
        </picker>
      </view>

      <!-- 预警列表 -->
      <view class="list-section">
        <view v-if="loadingAlerts" class="loading-section">
          <uni-load-more status="loading" />
        </view>
        
        <view v-else-if="healthAlerts.length === 0" class="empty-section">
          <uni-icons type="info" size="60" color="#ccc" />
          <text class="empty-text">暂无健康预警</text>
          <button class="refresh-btn" @click="refreshAlerts">刷新预警</button>
        </view>
        
        <view v-else class="alert-list">
          <view 
            v-for="alert in healthAlerts" 
            :key="alert.id" 
            class="alert-item"
            :class="alert.severity"
            @click="viewAlertDetail(alert.id)"
          >
            <view class="alert-header">
              <view class="alert-severity" :class="alert.severity">
                {{ getSeverityText(alert.severity) }}
              </view>
              <view class="alert-type">{{ getAlertTypeText(alert.type) }}</view>
            </view>
            
            <view class="alert-content">
              <view class="alert-title">{{ alert.title }}</view>
              <view class="alert-message">{{ alert.message }}</view>
            </view>
            
            <view class="alert-footer">
              <text class="alert-time">{{ formatTime(alert.created_at) }}</text>
              <view class="alert-actions">
                <button 
                  v-if="alert.cattle_id"
                  class="action-btn view" 
                  @click.stop="viewCattleProfile(alert.cattle_id)"
                  size="mini"
                >
                  查看牛只
                </button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 浮动添加按钮 -->
    <view v-if="activeTab === 'records'" class="fab-button" @click="navigateToAddRecord">
      <uni-icons type="plus" size="24" color="#fff" />
    </view>
    
    <view v-if="activeTab === 'vaccines'" class="fab-button" @click="navigateToAddVaccine">
      <uni-icons type="plus" size="24" color="#fff" />
    </view>
    
    <view v-if="activeTab === 'alerts'" class="refresh-fab" @click="refreshAlerts">
      <uni-icons type="refreshempty" size="24" color="#fff" />
    </view>
  </view>
</template>

<script>
import { healthApi } from '@/utils/request.js'

export default {
  data() {
    return {
      // 页面状态
      activeTab: 'records',
      loading: false,
      loadingVaccines: false,
      loadingAlerts: false,
      
      // 健康统计
      healthStats: {
        healthy: 0,
        sick: 0,
        treatment: 0
      },
      alertCount: 0,
      
      // 健康记录
      healthRecords: [],
      searchText: '',
      statusFilterIndex: 0,
      statusFilterOptions: ['全部状态', '进行中', '已完成', '已取消'],
      page: 1,
      limit: 10,
      hasMoreRecords: false,
      
      // 疫苗记录
      vaccineRecords: [],
      vaccineSearchText: '',
      vaccineFilterIndex: 0,
      vaccineFilterOptions: ['全部疫苗', '口蹄疫疫苗', '牛瘟疫苗', '其他疫苗'],
      showDueSoonOnly: false,
      vaccinePage: 1,
      vaccineLimit: 10,
      hasMoreVaccines: false,
      
      // 健康预警
      healthAlerts: [],
      alertTypeFilterIndex: 0,
      alertTypeFilterOptions: ['全部类型', '健康异常', '疫苗到期', '健康趋势', '紧急健康'],
      alertSeverityFilterIndex: 0,
      alertSeverityFilterOptions: ['全部级别', '紧急', '高级', '中级', '低级']
    }
  },
  
  onLoad(options) {
    // 加载健康统计数据
    this.loadHealthStats()
    
    // 加载健康记录
    this.loadHealthRecords()
    
    // 如果有指定的标签页，切换到该标签页
    if (options.tab) {
      this.activeTab = options.tab
      
      if (options.tab === 'vaccines') {
        this.loadVaccineRecords()
      } else if (options.tab === 'alerts') {
        this.loadHealthAlerts()
      }
    }
  },
  
  onShow() {
    // 每次显示页面时刷新数据
    this.loadHealthStats()
    
    // 根据当前标签页加载相应数据
    if (this.activeTab === 'records') {
      this.loadHealthRecords()
    } else if (this.activeTab === 'vaccines') {
      this.loadVaccineRecords()
    } else if (this.activeTab === 'alerts') {
      this.loadHealthAlerts()
    }
  },
  
  onPullDownRefresh() {
    // 下拉刷新
    if (this.activeTab === 'records') {
      this.page = 1
      this.loadHealthRecords(true)
    } else if (this.activeTab === 'vaccines') {
      this.vaccinePage = 1
      this.loadVaccineRecords(true)
    } else if (this.activeTab === 'alerts') {
      this.loadHealthAlerts(true)
    }
    
    // 刷新健康统计
    this.loadHealthStats()
  },
  
  onReachBottom() {
    // 上拉加载更多
    if (this.activeTab === 'records' && this.hasMoreRecords) {
      this.loadMoreRecords()
    } else if (this.activeTab === 'vaccines' && this.hasMoreVaccines) {
      this.loadMoreVaccines()
    }
  },
  
  methods: {
    // 切换标签页
    switchTab(tab) {
      this.activeTab = tab
      
      // 加载对应标签页的数据
      if (tab === 'records' && this.healthRecords.length === 0) {
        this.loadHealthRecords()
      } else if (tab === 'vaccines' && this.vaccineRecords.length === 0) {
        this.loadVaccineRecords()
      } else if (tab === 'alerts' && this.healthAlerts.length === 0) {
        this.loadHealthAlerts()
      }
    },
    
    // 加载健康统计数据
    async loadHealthStats() {
      try {
        const res = await healthApi.getHealthStatistics()
        if (res.success) {
          // 处理健康状态统计
          const healthStatus = res.data.healthStatus || []
          const healthStats = {
            healthy: 0,
            sick: 0,
            treatment: 0
          }
          
          healthStatus.forEach(item => {
            if (item.health_status in healthStats) {
              healthStats[item.health_status] = item.count
            }
          })
          
          // 计算预警数量
          const alertCount = res.data.dueSoonVaccinations || 0
          
          this.healthStats = healthStats
          this.alertCount = alertCount
        }
      } catch (err) {
        console.error('加载健康统计失败', err)
        uni.showToast({
          title: '加载统计失败',
          icon: 'none'
        })
      }
    },
    
    // 加载健康记录
    async loadHealthRecords(isPullDown = false) {
      this.loading = true
      
      const params = {
        page: this.page,
        limit: this.limit
      }
      
      // 添加搜索条件
      if (this.searchText) {
        params.cattleEarTag = this.searchText
      }
      
      // 添加状态筛选
      if (this.statusFilterIndex > 0) {
        const statusMap = ['', 'ongoing', 'completed', 'cancelled']
        params.status = statusMap[this.statusFilterIndex]
      }
      
      try {
        const res = await healthApi.getHealthRecords(params)
        if (res.success) {
          const records = res.data.records || []
          
          this.healthRecords = this.page === 1 ? records : [...this.healthRecords, ...records]
          this.hasMoreRecords = records.length === this.limit
        }
      } catch (err) {
        console.error('加载健康记录失败', err)
        uni.showToast({
          title: '加载记录失败',
          icon: 'none'
        })
      } finally {
        this.loading = false
        if (isPullDown) {
          uni.stopPullDownRefresh()
        }
      }
    },
    
    // 加载更多健康记录
    loadMoreRecords() {
      this.page += 1
      this.loadHealthRecords()
    },
    
    // 搜索输入变化
    onSearchInput(value) {
      this.searchText = value
    },
    
    // 状态筛选变化
    onStatusFilterChange(e) {
      this.statusFilterIndex = parseInt(e.detail.value)
      this.page = 1
      this.loadHealthRecords()
    },
    
    // 查看记录详情
    async viewRecordDetail(id) {
      try {
        const res = await healthApi.getHealthRecordById(id)
        if (res.success) {
          uni.navigateTo({
            url: `/pages/health/record?id=${id}&mode=view`
          })
        }
      } catch (err) {
        console.error('获取记录详情失败', err)
        uni.showToast({
          title: '获取详情失败',
          icon: 'none'
        })
      }
    },
    
    // 编辑记录
    editRecord(id) {
      uni.navigateTo({
        url: `/pages/health/record?id=${id}&mode=edit`
      })
    },
    
    // 跳转到添加记录页面
    navigateToAddRecord() {
      uni.navigateTo({
        url: '/pages/health/record?mode=add'
      })
    },
    
    // 加载疫苗记录
    async loadVaccineRecords(isPullDown = false) {
      this.loadingVaccines = true
      
      const params = {
        page: this.vaccinePage,
        limit: this.vaccineLimit
      }
      
      // 添加搜索条件
      if (this.vaccineSearchText) {
        params.cattleEarTag = this.vaccineSearchText
      }
      
      // 添加疫苗筛选
      if (this.vaccineFilterIndex > 0) {
        params.vaccine_name = this.vaccineFilterOptions[this.vaccineFilterIndex]
      }
      
      // 添加到期筛选
      if (this.showDueSoonOnly) {
        params.due_soon = true
      }
      
      try {
        const res = await healthApi.getVaccinationRecords(params)
        if (res.success) {
          const records = res.data.records || []
          
          this.vaccineRecords = this.vaccinePage === 1 ? records : [...this.vaccineRecords, ...records]
          this.hasMoreVaccines = records.length === this.vaccineLimit
        }
      } catch (err) {
        console.error('加载疫苗记录失败', err)
        uni.showToast({
          title: '加载记录失败',
          icon: 'none'
        })
      } finally {
        this.loadingVaccines = false
        if (isPullDown) {
          uni.stopPullDownRefresh()
        }
      }
    },
    
    // 加载更多疫苗记录
    loadMoreVaccines() {
      this.vaccinePage += 1
      this.loadVaccineRecords()
    },
    
    // 疫苗搜索输入变化
    onVaccineSearchInput(value) {
      this.vaccineSearchText = value
    },
    
    // 疫苗筛选变化
    onVaccineFilterChange(e) {
      this.vaccineFilterIndex = parseInt(e.detail.value)
      this.vaccinePage = 1
      this.loadVaccineRecords()
    },
    
    // 切换到期筛选
    toggleDueSoonFilter(e) {
      this.showDueSoonOnly = e.detail.value
      this.vaccinePage = 1
      this.loadVaccineRecords()
    },
    
    // 查看疫苗详情
    viewVaccineDetail(id) {
      const vaccine = this.vaccineRecords.find(item => item.id === id)
      if (vaccine) {
        // 可以显示详情弹窗或跳转到详情页面
        uni.showModal({
          title: '疫苗接种详情',
          content: `牛只: ${vaccine.cattle?.ear_tag}\n疫苗: ${vaccine.vaccine_name}\n接种日期: ${this.formatDate(vaccine.vaccination_date)}`,
          showCancel: false
        })
      }
    },
    
    // 续种疫苗
    renewVaccine(id) {
      uni.navigateTo({
        url: `/pages/health/vaccine?id=${id}&mode=renew`
      })
    },
    
    // 跳转到添加疫苗页面
    navigateToAddVaccine() {
      uni.navigateTo({
        url: '/pages/health/vaccine?mode=add'
      })
    },
    
    // 判断疫苗是否即将到期
    isVaccineDueSoon(dueDate) {
      if (!dueDate) return false
      
      const due = new Date(dueDate)
      const now = new Date()
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
      
      return diffDays <= 30
    },
    
    // 获取到期日期样式类
    getDueDateClass(dueDate) {
      if (!dueDate) return ''
      
      const due = new Date(dueDate)
      const now = new Date()
      const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) return 'overdue'
      if (diffDays <= 7) return 'urgent'
      if (diffDays <= 15) return 'warning'
      return ''
    },
    
    // 加载健康预警
    async loadHealthAlerts(isPullDown = false) {
      this.loadingAlerts = true
      
      const params = {}
      
      // 添加类型筛选
      if (this.alertTypeFilterIndex > 0) {
        const typeMap = ['', 'health_anomaly', 'vaccine_due', 'health_trend', 'critical_health']
        params.type = typeMap[this.alertTypeFilterIndex]
      }
      
      // 添加严重程度筛选
      if (this.alertSeverityFilterIndex > 0) {
        const severityMap = ['', 'critical', 'high', 'medium', 'low']
        params.severity = severityMap[this.alertSeverityFilterIndex]
      }
      
      try {
        const res = await healthApi.getHealthAlerts(params)
        if (res.success) {
          this.healthAlerts = res.data.alerts || []
        }
      } catch (err) {
        console.error('加载健康预警失败', err)
        uni.showToast({
          title: '加载预警失败',
          icon: 'none'
        })
      } finally {
        this.loadingAlerts = false
        if (isPullDown) {
          uni.stopPullDownRefresh()
        }
      }
    },
    
    // 刷新预警
    refreshAlerts() {
      this.loadHealthAlerts(true)
    },
    
    // 预警类型筛选变化
    onAlertTypeFilterChange(e) {
      this.alertTypeFilterIndex = parseInt(e.detail.value)
      this.loadHealthAlerts()
    },
    
    // 预警严重程度筛选变化
    onAlertSeverityFilterChange(e) {
      this.alertSeverityFilterIndex = parseInt(e.detail.value)
      this.loadHealthAlerts()
    },
    
    // 查看预警详情
    viewAlertDetail(id) {
      const alert = this.healthAlerts.find(item => item.id === id)
      if (alert) {
        uni.showModal({
          title: '预警详情',
          content: `${alert.title}\n${alert.message}`,
          showCancel: false
        })
      }
    },
    
    // 查看牛只档案
    viewCattleProfile(id) {
      uni.navigateTo({
        url: `/pages/cattle/detail?id=${id}`
      })
    },
    
    // 获取状态文本
    getStatusText(status) {
      const texts = {
        ongoing: '进行中',
        completed: '已完成',
        cancelled: '已取消'
      }
      return texts[status] || status
    },
    
    // 获取严重程度文本
    getSeverityText(severity) {
      const texts = {
        critical: '紧急',
        high: '高级',
        medium: '中级',
        low: '低级'
      }
      return texts[severity] || severity
    },
    
    // 获取预警类型文本
    getAlertTypeText(type) {
      const texts = {
        health_anomaly: '健康异常',
        vaccine_due: '疫苗到期',
        health_trend: '健康趋势',
        critical_health: '紧急健康'
      }
      return texts[type] || type
    },
    
    // 格式化日期
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString('zh-CN')
    },
    
    // 格式化时间
    formatTime(time) {
      if (!time) return ''
      return new Date(time).toLocaleString('zh-CN')
    }
  }
}
</script>

<style lang="scss" scoped>
.health-container {
  padding: 20rpx;
  background-color: #f5f7fa;
  min-height: 100vh;
}

/* 统计卡片 */
.stats-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.stat-card {
  flex: 1;
  background-color: #fff;
  border-radius: 10rpx;
  padding: 20rpx;
  margin: 0 10rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  text-align: center;
  
  &:first-child {
    margin-left: 0;
  }
  
  &:last-child {
    margin-right: 0;
  }
  
  &.healthy {
    border-top: 6rpx solid #67c23a;
  }
  
  &.sick {
    border-top: 6rpx solid #f56c6c;
  }
  
  &.alert {
    border-top: 6rpx solid #e6a23c;
  }
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #909399;
}

/* 标签页 */
.tabs-section {
  display: flex;
  background-color: #fff;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #606266;
  position: relative;
  
  &.active {
    color: #1890ff;
    font-weight: bold;
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40%;
      height: 6rpx;
      background-color: #1890ff;
      border-radius: 3rpx;
    }
  }
}

/* 内容区域 */
.content-section {
  position: relative;
}

/* 搜索栏 */
.search-section {
  margin-bottom: 20rpx;
}

/* 筛选栏 */
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-radius: 10rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.filter-item {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: #606266;
  
  &.switch-item {
    text {
      margin-right: 10rpx;
    }
  }
}

/* 列表区域 */
.list-section {
  background-color: #fff;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.loading-section {
  padding: 40rpx;
  text-align: center;
}

.empty-section {
  padding: 80rpx 40rpx;
  text-align: center;
  
  .empty-text {
    display: block;
    margin: 20rpx 0;
    font-size: 28rpx;
    color: #909399;
  }
  
  .add-btn, .refresh-btn {
    background-color: #1890ff;
    color: #fff;
    border: none;
    border-radius: 30rpx;
    padding: 15rpx 30rpx;
    font-size: 26rpx;
  }
}

/* 记录列表 */
.record-list, .vaccine-list, .alert-list {
  .record-item, .vaccine-item, .alert-item {
    padding: 20rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
  }
}

.record-header, .vaccine-header, .alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.cattle-tag {
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 5rpx 10rpx;
  border-radius: 5rpx;
  font-size: 24rpx;
  font-weight: bold;
}

.record-status {
  padding: 5rpx 10rpx;
  border-radius: 5rpx;
  font-size: 22rpx;
  
  &.ongoing {
    background-color: #fff7e6;
    color: #fa8c16;
  }
  
  &.completed {
    background-color: #f6ffed;
    color: #52c41a;
  }
  
  &.cancelled {
    background-color: #fff2f0;
    color: #ff4d4f;
  }
}

.vaccine-name {
  font-size: 26rpx;
  font-weight: bold;
  color: #333;
}

.record-content, .vaccine-content {
  margin-bottom: 15rpx;
}

.record-field, .vaccine-info {
  display: flex;
  margin-bottom: 8rpx;
  font-size: 24rpx;
  
  .field-label, .info-label {
    color: #909399;
    width: 80rpx;
    flex-shrink: 0;
  }
  
  .field-value, .info-value {
    color: #333;
    flex: 1;
  }
}

.vaccine-dates {
  .date-item {
    display: flex;
    margin-bottom: 8rpx;
    font-size: 24rpx;
    
    .date-label {
      color: #909399;
      width: 120rpx;
      flex-shrink: 0;
    }
    
    .date-value {
      color: #333;
      
      &.overdue {
        color: #ff4d4f;
      }
      
      &.urgent {
        color: #fa8c16;
      }
      
      &.warning {
        color: #faad14;
      }
    }
  }
}

.record-footer, .vaccine-footer, .alert-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 22rpx;
  color: #909399;
}

.record-actions, .vaccine-actions, .alert-actions {
  .action-btn {
    background-color: #1890ff;
    color: #fff;
    border: none;
    border-radius: 15rpx;
    padding: 8rpx 15rpx;
    font-size: 22rpx;
    margin-left: 10rpx;
    
    &.edit {
      background-color: #52c41a;
    }
    
    &.renew {
      background-color: #fa8c16;
    }
    
    &.view {
      background-color: #722ed1;
    }
  }
}

/* 预警相关样式 */
.alert-item {
  &.critical {
    border-left: 6rpx solid #ff4d4f;
  }
  
  &.high {
    border-left: 6rpx solid #fa8c16;
  }
  
  &.medium {
    border-left: 6rpx solid #faad14;
  }
  
  &.low {
    border-left: 6rpx solid #52c41a;
  }
}

.alert-severity {
  padding: 5rpx 10rpx;
  border-radius: 5rpx;
  font-size: 22rpx;
  
  &.critical {
    background-color: #fff2f0;
    color: #ff4d4f;
  }
  
  &.high {
    background-color: #fff7e6;
    color: #fa8c16;
  }
  
  &.medium {
    background-color: #fffbe6;
    color: #faad14;
  }
  
  &.low {
    background-color: #f6ffed;
    color: #52c41a;
  }
}

.alert-type {
  font-size: 24rpx;
  color: #666;
}

.alert-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.alert-message {
  font-size: 24rpx;
  color: #666;
  line-height: 1.4;
}

/* 浮动按钮 */
.fab-button, .refresh-fab {
  position: fixed;
  right: 30rpx;
  bottom: 100rpx;
  width: 100rpx;
  height: 100rpx;
  background-color: #1890ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 20rpx rgba(24, 144, 255, 0.3);
  z-index: 999;
}

.refresh-fab {
  background-color: #52c41a;
  box-shadow: 0 4rpx 20rpx rgba(82, 196, 26, 0.3);
}
</style>