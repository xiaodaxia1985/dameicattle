<template>
  <view class="customer-detail-container">
    <uni-card v-if="customer" :title="customer.name" :extra="customer.customer_type || '未分类'">
      <!-- 基本信息 -->
      <view class="info-section">
        <view class="section-title">基本信息</view>
        <uni-list>
          <uni-list-item title="联系人" :rightText="customer.contact_person || '-'" />
          <uni-list-item title="联系电话" :rightText="customer.phone || '-'" />
          <uni-list-item title="邮箱" :rightText="customer.email || '-'" />
          <uni-list-item title="地址" :rightText="customer.address || '-'" />
          <uni-list-item title="信用评级">
            <template #right>
              <uni-rate v-model="customer.credit_rating" disabled />
            </template>
          </uni-list-item>
          <uni-list-item title="信用额度" :rightText="'¥' + formatAmount(customer.credit_limit)" />
          <uni-list-item title="付款条件" :rightText="customer.payment_terms || '-'" />
          <uni-list-item title="状态">
            <template #right>
              <uni-tag :text="customer.status === 'active' ? '启用' : '停用'" :type="customer.status === 'active' ? 'success' : 'error'" />
            </template>
          </uni-list-item>
        </uni-list>
      </view>

      <!-- 企业信息 -->
      <view class="info-section" v-if="customer.customer_type === '企业' || customer.customer_type === '经销商'">
        <view class="section-title">企业信息</view>
        <uni-list>
          <uni-list-item title="营业执照号" :rightText="customer.business_license || '-'" />
          <uni-list-item title="税号" :rightText="customer.tax_number || '-'" />
          <uni-list-item title="银行账户" :rightText="customer.bank_account || '-'" />
        </uni-list>
      </view>

      <!-- 回访记录 -->
      <view class="info-section">
        <view class="section-header">
          <view class="section-title">回访记录</view>
          <button class="add-btn" size="mini" type="primary" @click="addVisit">添加回访</button>
        </view>
        
        <view v-if="customer.visit_records && customer.visit_records.length > 0" class="visit-records">
          <view class="visit-card" v-for="(visit, index) in customer.visit_records" :key="index">
            <view class="visit-header">
              <view class="visit-type">{{ visit.visit_type }}</view>
              <view class="visit-date">{{ formatDate(visit.visit_date) }}</view>
            </view>
            <view class="visit-content">
              <view class="visit-item">
                <text class="item-label">目的:</text>
                <text class="item-value">{{ visit.purpose }}</text>
              </view>
              <view class="visit-item">
                <text class="item-label">内容:</text>
                <text class="item-value">{{ visit.content }}</text>
              </view>
              <view class="visit-item" v-if="visit.result">
                <text class="item-label">结果:</text>
                <text class="item-value">{{ visit.result }}</text>
              </view>
              <view class="visit-item" v-if="visit.next_visit_date">
                <text class="item-label">下次回访:</text>
                <text class="item-value">{{ formatDate(visit.next_visit_date) }}</text>
              </view>
            </view>
          </view>
        </view>
        <view v-else class="empty-visits">
          <uni-empty text="暂无回访记录" />
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button type="primary" @click="viewOrders">查看订单</button>
        <button type="default" @click="updateRating">更新评级</button>
      </view>
    </uni-card>

    <!-- 加载中 -->
    <view v-else class="loading-container">
      <uni-load-more status="loading" />
    </view>
  </view>
</template>

<script>
import { salesApi } from '@/utils/api'
import { showToast, showModal } from '@/utils/common'

export default {
  data() {
    return {
      customerId: null,
      customer: null,
    }
  },

  onLoad(options) {
    this.customerId = options.id
    this.loadCustomerDetail()
  },

  onPullDownRefresh() {
    this.loadCustomerDetail()
  },

  // 页面显示时刷新数据
  onShow() {
    if (this.customerId) {
      this.loadCustomerDetail()
    }
  },

  methods: {
    // 加载客户详情
    async loadCustomerDetail() {
      try {
        if (!this.customerId) {
          showToast('客户ID不能为空')
          return
        }

        uni.showLoading({ title: '加载中...' })
        const response = await salesApi.getCustomer(this.customerId)
        this.customer = response.data
      } catch (error) {
        showToast('加载客户详情失败')
        console.error('加载客户详情失败:', error)
      } finally {
        uni.hideLoading()
        uni.stopPullDownRefresh()
      }
    },

    // 添加回访记录
    addVisit() {
      uni.navigateTo({
        url: `/pages/sales/add-visit?customerId=${this.customerId}&customerName=${encodeURIComponent(this.customer.name)}`,
      })
    },

    // 查看客户订单
    viewOrders() {
      uni.navigateTo({
        url: `/pages/sales/orders?customerId=${this.customerId}&customerName=${encodeURIComponent(this.customer.name)}`,
      })
    },

    // 更新客户评级
    async updateRating() {
      try {
        const result = await showModal({
          title: '更新客户评级',
          content: '请选择新的评级 (1-5星)',
          showCancel: true,
          editable: true,
          placeholderText: '请输入1-5的数字',
        })

        if (result.confirm) {
          const rating = parseInt(result.content)
          if (isNaN(rating) || rating < 1 || rating > 5) {
            showToast('请输入1-5之间的数字')
            return
          }

          uni.showLoading({ title: '处理中...' })
          await salesApi.updateCustomerRating(this.customerId, {
            credit_rating: rating,
            comment: '移动端更新评级'
          })
          showToast('评级更新成功')
          this.loadCustomerDetail()
        }
      } catch (error) {
        showToast('更新评级失败')
        console.error('更新客户评级失败:', error)
      } finally {
        uni.hideLoading()
      }
    },

    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    },

    // 格式化金额
    formatAmount(amount) {
      return amount ? Number(amount).toLocaleString() : '0'
    }
  }
}
</script>

<style lang="scss" scoped>
.customer-detail-container {
  padding: 20rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.info-section {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
  padding-left: 20rpx;
  border-left: 8rpx solid #1890ff;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.add-btn {
  font-size: 24rpx;
}

.visit-records {
  margin-top: 20rpx;
}

.visit-card {
  background-color: #fff;
  border-radius: 8rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.visit-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
  padding-bottom: 10rpx;
  border-bottom: 1px solid #f0f0f0;
}

.visit-type {
  font-weight: bold;
  color: #1890ff;
}

.visit-date {
  color: #999;
  font-size: 24rpx;
}

.visit-content {
  font-size: 28rpx;
}

.visit-item {
  margin-bottom: 10rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.item-label {
  color: #666;
  margin-right: 10rpx;
}

.item-value {
  color: #333;
}

.empty-visits {
  padding: 40rpx 0;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 30rpx;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300rpx;
}
</style>