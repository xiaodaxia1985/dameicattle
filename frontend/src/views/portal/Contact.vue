<template>
  <div class="contact-page">
    <!-- 页面头部 -->
    <section class="page-header">
      <div class="container">
        <h1>联系我们</h1>
        <p>我们期待与您的合作，共创美好未来</p>
      </div>
    </section>

    <!-- 联系方式 -->
    <section class="contact-info">
      <div class="container">
        <div class="contact-grid">
          <div class="contact-item">
            <div class="contact-icon">
              <div class="modern-icon-lg icon-phone icon-pulse"></div>
            </div>
            <h3>联系电话</h3>
            <p>400-123-4567</p>
            <p>010-12345678</p>
            <small>工作时间：周一至周五 9:00-18:00</small>
          </div>
          <div class="contact-item">
            <div class="contact-icon">
              <div class="modern-icon-lg icon-email icon-pulse"></div>
            </div>
            <h3>邮箱地址</h3>
            <p>info@cattle-management.com</p>
            <p>support@cattle-management.com</p>
            <small>我们会在24小时内回复您的邮件</small>
          </div>
          <div class="contact-item">
            <div class="contact-icon">
              <div class="modern-icon-lg icon-location icon-pulse"></div>
            </div>
            <h3>公司地址</h3>
            <p>北京市朝阳区科技园区</p>
            <p>创新大厦A座15层</p>
            <small>欢迎预约到访参观</small>
          </div>
          <div class="contact-item">
            <div class="contact-icon">
              <div class="modern-icon-lg icon-chat icon-pulse"></div>
            </div>
            <h3>在线客服</h3>
            <p>QQ：123456789</p>
            <p>微信：cattle-support</p>
            <small>在线时间：周一至周日 9:00-21:00</small>
          </div>
        </div>
      </div>
    </section>

    <!-- 在线留言表单 -->
    <section class="contact-form-section">
      <div class="container">
        <div class="form-content">
          <div class="form-header">
            <h2>在线留言</h2>
            <p>请填写以下信息，我们会尽快与您联系</p>
          </div>
          <form @submit.prevent="submitForm" class="contact-form">
            <div class="form-row">
              <div class="form-group">
                <label for="name">姓名 *</label>
                <input
                  type="text"
                  id="name"
                  v-model="form.name"
                  required
                  placeholder="请输入您的姓名"
                />
              </div>
              <div class="form-group">
                <label for="company">公司名称</label>
                <input
                  type="text"
                  id="company"
                  v-model="form.company"
                  placeholder="请输入公司名称"
                />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label for="phone">联系电话 *</label>
                <input
                  type="tel"
                  id="phone"
                  v-model="form.phone"
                  required
                  placeholder="请输入联系电话"
                />
              </div>
              <div class="form-group">
                <label for="email">邮箱地址</label>
                <input
                  type="email"
                  id="email"
                  v-model="form.email"
                  placeholder="请输入邮箱地址"
                />
              </div>
            </div>
            <div class="form-group">
              <label for="subject">咨询主题 *</label>
              <select id="subject" v-model="form.subject" required>
                <option value="">请选择咨询主题</option>
                <option value="product">产品咨询</option>
                <option value="price">价格咨询</option>
                <option value="demo">产品演示</option>
                <option value="support">技术支持</option>
                <option value="cooperation">合作洽谈</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div class="form-group">
              <label for="cattleCount">预计管理牛只数量</label>
              <select id="cattleCount" v-model="form.cattleCount">
                <option value="">请选择</option>
                <option value="1-100">1-100头</option>
                <option value="101-500">101-500头</option>
                <option value="501-1000">501-1000头</option>
                <option value="1001-5000">1001-5000头</option>
                <option value="5000+">5000头以上</option>
              </select>
            </div>
            <div class="form-group">
              <label for="message">详细描述 *</label>
              <textarea
                id="message"
                v-model="form.message"
                required
                rows="6"
                placeholder="请详细描述您的需求或问题"
              ></textarea>
            </div>
            <div class="form-group">
              <label for="preferredContact">首选联系方式</label>
              <div class="radio-group">
                <label class="radio-label">
                  <input type="radio" v-model="form.preferredContact" value="phone" />
                  <span class="radio-mark"></span>
                  电话联系
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="form.preferredContact" value="email" />
                  <span class="radio-mark"></span>
                  邮件联系
                </label>
                <label class="radio-label">
                  <input type="radio" v-model="form.preferredContact" value="wechat" />
                  <span class="radio-mark"></span>
                  微信联系
                </label>
              </div>
            </div>
            <div class="form-group checkbox-group">
              <label class="checkbox-label">
                <input type="checkbox" v-model="form.agree" required />
                <span class="checkmark"></span>
                我已阅读并同意<a href="#" @click.prevent="showPrivacy">《隐私政策》</a>
              </label>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="submitting">
                {{ submitting ? '提交中...' : '提交留言' }}
              </button>
              <button type="button" class="btn btn-outline" @click="resetForm">
                重置表单
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>

    <!-- 产品询价表单 -->
    <section class="inquiry-section">
      <div class="container">
        <div class="inquiry-content">
          <div class="inquiry-header">
            <h2>产品询价</h2>
            <p>获取专业的产品报价和解决方案</p>
          </div>
          <div class="inquiry-form-container">
            <form @submit.prevent="submitInquiry" class="inquiry-form">
              <div class="form-row">
                <div class="form-group">
                  <label for="inquiryName">联系人 *</label>
                  <input
                    type="text"
                    id="inquiryName"
                    v-model="inquiryForm.name"
                    required
                    placeholder="请输入联系人姓名"
                  />
                </div>
                <div class="form-group">
                  <label for="inquiryPhone">联系电话 *</label>
                  <input
                    type="tel"
                    id="inquiryPhone"
                    v-model="inquiryForm.phone"
                    required
                    placeholder="请输入联系电话"
                  />
                </div>
              </div>
              <div class="form-group">
                <label for="inquiryCompany">公司名称 *</label>
                <input
                  type="text"
                  id="inquiryCompany"
                  v-model="inquiryForm.company"
                  required
                  placeholder="请输入公司名称"
                />
              </div>
              <div class="form-group">
                <label>需要的功能模块 *</label>
                <div class="checkbox-grid">
                  <label class="checkbox-label" v-for="module in modules" :key="module.value">
                    <input type="checkbox" v-model="inquiryForm.modules" :value="module.value" />
                    <span class="checkmark"></span>
                    {{ module.label }}
                  </label>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label for="baseCount">基地数量</label>
                  <select id="baseCount" v-model="inquiryForm.baseCount">
                    <option value="">请选择</option>
                    <option value="1">1个基地</option>
                    <option value="2-5">2-5个基地</option>
                    <option value="6-10">6-10个基地</option>
                    <option value="10+">10个以上基地</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="userCount">预计用户数</label>
                  <select id="userCount" v-model="inquiryForm.userCount">
                    <option value="">请选择</option>
                    <option value="1-10">1-10人</option>
                    <option value="11-50">11-50人</option>
                    <option value="51-100">51-100人</option>
                    <option value="100+">100人以上</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label for="inquiryRequirements">特殊需求</label>
                <textarea
                  id="inquiryRequirements"
                  v-model="inquiryForm.requirements"
                  rows="4"
                  placeholder="请描述您的特殊需求或定制要求"
                ></textarea>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary" :disabled="submittingInquiry">
                  {{ submittingInquiry ? '提交中...' : '获取报价' }}
                </button>
              </div>
            </form>
            <div class="inquiry-benefits">
              <h3>询价优势</h3>
              <ul>
                <li><div class="modern-icon icon-check" style="display: inline-block; margin-right: 8px;"></div> 专业团队1对1服务</li>
                <li><div class="modern-icon icon-check" style="display: inline-block; margin-right: 8px;"></div> 24小时内响应</li>
                <li><div class="modern-icon icon-check" style="display: inline-block; margin-right: 8px;"></div> 免费产品演示</li>
                <li><div class="modern-icon icon-check" style="display: inline-block; margin-right: 8px;"></div> 定制化解决方案</li>
                <li><div class="modern-icon icon-check" style="display: inline-block; margin-right: 8px;"></div> 透明化报价</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 地图位置 -->
    <section class="map-section">
      <div class="container">
        <div class="section-header">
          <h2>公司位置</h2>
          <p>欢迎到访我们的办公室</p>
        </div>
        <div class="map-container">
          <div class="map-placeholder" @click="openMap">
            <div class="map-icon">
              <div class="modern-icon-xl icon-map"></div>
            </div>
            <p>点击查看详细地图</p>
            <small>北京市朝阳区科技园区创新大厦A座15层</small>
            <div class="map-coordinates">
              <span>经度: 116.4074</span>
              <span>纬度: 39.9042</span>
            </div>
          </div>
          <div class="map-info">
            <h3>交通指南</h3>
            <div class="transport-item">
              <strong><div class="modern-icon icon-subway" style="display: inline-block; margin-right: 8px;"></div> 地铁：</strong>
              <p>地铁10号线科技园站A出口，步行5分钟</p>
            </div>
            <div class="transport-item">
              <strong><div class="modern-icon icon-bus" style="display: inline-block; margin-right: 8px;"></div> 公交：</strong>
              <p>科技园站：123路、456路、789路</p>
            </div>
            <div class="transport-item">
              <strong><div class="modern-icon icon-car" style="display: inline-block; margin-right: 8px;"></div> 自驾：</strong>
              <p>大厦地下停车场，访客可免费停车2小时</p>
            </div>
            <div class="transport-item">
              <strong><div class="modern-icon icon-plane" style="display: inline-block; margin-right: 8px;"></div> 机场：</strong>
              <p>距离首都机场约45分钟车程</p>
            </div>
            <div class="navigation-buttons">
              <button class="btn btn-outline" @click="openNavigation('baidu')">
                百度地图导航
              </button>
              <button class="btn btn-outline" @click="openNavigation('gaode')">
                高德地图导航
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 常见问题 -->
    <section class="faq-section">
      <div class="container">
        <div class="section-header">
          <h2>常见问题</h2>
          <p>以下是客户经常咨询的问题</p>
        </div>
        <div class="faq-list">
          <div class="faq-item" v-for="(faq, index) in faqs" :key="index">
            <div class="faq-question" @click="toggleFaq(index)">
              <h3>{{ faq.question }}</h3>
              <span class="faq-toggle" :class="{ active: faq.open }">+</span>
            </div>
            <div class="faq-answer" v-show="faq.open">
              <p>{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 在线客服 -->
    <div class="online-service" v-if="showOnlineService">
      <div class="service-widget">
        <div class="service-header">
          <h4>在线客服</h4>
          <button class="close-btn" @click="showOnlineService = false">×</button>
        </div>
        <div class="service-content">
          <div class="service-options">
            <a href="tel:400-123-4567" class="service-option">
              <div class="icon modern-icon icon-phone"></div>
              <span>电话咨询</span>
            </a>
            <a href="mailto:info@cattle-management.com" class="service-option">
              <div class="icon modern-icon icon-email"></div>
              <span>邮件咨询</span>
            </a>
            <button class="service-option" @click="openWechat">
              <div class="icon modern-icon icon-chat"></div>
              <span>微信咨询</span>
            </button>
            <button class="service-option" @click="scrollToForm">
              <div class="icon modern-icon icon-edit"></div>
              <span>在线留言</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 浮动客服按钮 -->
    <div class="floating-service" @click="showOnlineService = true">
      <div class="service-icon modern-icon icon-chat"></div>
      <span class="service-text">客服</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

// 表单数据
const form = reactive({
  name: '',
  company: '',
  phone: '',
  email: '',
  subject: '',
  cattleCount: '',
  message: '',
  preferredContact: '',
  agree: false
})

// 询价表单数据
const inquiryForm = reactive({
  name: '',
  phone: '',
  company: '',
  modules: [] as string[],
  baseCount: '',
  userCount: '',
  requirements: ''
})

// 功能模块选项
const modules = ref([
  { value: 'cattle', label: '牛只档案管理' },
  { value: 'health', label: '健康管理' },
  { value: 'feeding', label: '精准饲喂' },
  { value: 'materials', label: '物资管理' },
  { value: 'equipment', label: '设备管理' },
  { value: 'purchase', label: '采购管理' },
  { value: 'sales', label: '销售管理' },
  { value: 'dashboard', label: '数据分析' }
])

// 常见问题数据
const faqs = ref([
  {
    question: '系统支持哪些平台？',
    answer: '我们的系统支持PC端（Windows、Mac、Linux）、移动端（iOS、Android）以及微信小程序，可以满足不同场景的使用需求。',
    open: false
  },
  {
    question: '系统部署需要多长时间？',
    answer: '根据客户的具体需求和环境，系统部署通常需要1-2周时间，包括环境搭建、数据迁移、用户培训等环节。',
    open: false
  },
  {
    question: '是否提供定制开发服务？',
    answer: '是的，我们提供定制开发服务。可以根据客户的特殊需求进行功能定制和界面调整，确保系统完全符合客户的业务流程。',
    open: false
  },
  {
    question: '系统的数据安全如何保障？',
    answer: '我们采用多层次的安全防护措施，包括数据加密传输、权限控制、定期备份、安全审计等，确保客户数据的安全性。',
    open: false
  },
  {
    question: '技术支持服务包括哪些内容？',
    answer: '我们提供7×24小时技术支持，包括系统使用培训、故障排除、功能咨询、系统维护等全方位的技术服务。',
    open: false
  },
  {
    question: '系统的价格如何计算？',
    answer: '系统价格根据功能模块、用户数量、部署方式等因素确定。我们提供灵活的定价方案，请联系我们获取详细报价。',
    open: false
  }
])

const submitting = ref(false)
const submittingInquiry = ref(false)
const showOnlineService = ref(false)

// 访客统计
const visitorStats = reactive({
  totalVisits: 0,
  todayVisits: 0,
  onlineUsers: 0
})

// 提交留言表单
const submitForm = async () => {
  submitting.value = true
  try {
    // 模拟提交过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 记录访客行为
    recordVisitorAction('contact_form_submit', form)
    
    console.log('提交表单数据:', form)
    
    alert('留言提交成功！我们会尽快与您联系。')
    resetForm()
  } catch (error) {
    console.error('提交失败:', error)
    alert('提交失败，请稍后重试。')
  } finally {
    submitting.value = false
  }
}

// 提交询价表单
const submitInquiry = async () => {
  if (inquiryForm.modules.length === 0) {
    alert('请至少选择一个功能模块')
    return
  }
  
  submittingInquiry.value = true
  try {
    // 模拟提交过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 记录访客行为
    recordVisitorAction('inquiry_form_submit', inquiryForm)
    
    console.log('提交询价数据:', inquiryForm)
    
    alert('询价提交成功！我们的销售顾问会在24小时内与您联系。')
    resetInquiryForm()
  } catch (error) {
    console.error('提交失败:', error)
    alert('提交失败，请稍后重试。')
  } finally {
    submittingInquiry.value = false
  }
}

// 重置留言表单
const resetForm = () => {
  Object.assign(form, {
    name: '',
    company: '',
    phone: '',
    email: '',
    subject: '',
    cattleCount: '',
    message: '',
    preferredContact: '',
    agree: false
  })
}

// 重置询价表单
const resetInquiryForm = () => {
  Object.assign(inquiryForm, {
    name: '',
    phone: '',
    company: '',
    modules: [],
    baseCount: '',
    userCount: '',
    requirements: ''
  })
}

// 切换FAQ显示状态
const toggleFaq = (index: number) => {
  faqs.value[index].open = !faqs.value[index].open
  
  // 记录用户行为
  recordVisitorAction('faq_click', { question: faqs.value[index].question })
}

// 显示隐私政策
const showPrivacy = () => {
  alert('隐私政策内容...')
}

// 打开地图
const openMap = () => {
  // 记录用户行为
  recordVisitorAction('map_click')
  
  // 这里可以集成真实的地图API
  alert('正在打开地图...')
}

// 打开导航
const openNavigation = (type: 'baidu' | 'gaode') => {
  const address = '北京市朝阳区科技园区创新大厦A座15层'
  
  // 记录用户行为
  recordVisitorAction('navigation_click', { type })
  
  if (type === 'baidu') {
    // 百度地图导航
    const url = `https://api.map.baidu.com/marker?location=39.9042,116.4074&title=${encodeURIComponent(address)}&content=${encodeURIComponent('肉牛全生命周期管理系统')}&output=html`
    window.open(url, '_blank')
  } else if (type === 'gaode') {
    // 高德地图导航
    const url = `https://uri.amap.com/marker?position=116.4074,39.9042&name=${encodeURIComponent(address)}`
    window.open(url, '_blank')
  }
}

// 打开微信客服
const openWechat = () => {
  recordVisitorAction('wechat_click')
  alert('请添加微信号：cattle-support')
}

// 滚动到表单
const scrollToForm = () => {
  const formElement = document.querySelector('.contact-form-section')
  if (formElement) {
    formElement.scrollIntoView({ behavior: 'smooth' })
  }
  showOnlineService.value = false
}

// 记录访客行为
const recordVisitorAction = (action: string, data?: any) => {
  const actionData = {
    action,
    data,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
  }
  
  console.log('访客行为记录:', actionData)
  
  // 这里可以发送到后端进行统计分析
  // analytics.track(actionData)
}

// 初始化访客统计
const initVisitorStats = () => {
  // 模拟访客统计数据
  visitorStats.totalVisits = Math.floor(Math.random() * 10000) + 5000
  visitorStats.todayVisits = Math.floor(Math.random() * 100) + 50
  visitorStats.onlineUsers = Math.floor(Math.random() * 20) + 5
  
  // 记录页面访问
  recordVisitorAction('page_visit', { page: 'contact' })
}

// 页面加载时初始化
onMounted(() => {
  initVisitorStats()
  
  // 5秒后显示在线客服提示
  setTimeout(() => {
    if (!showOnlineService.value) {
      // 可以显示一个小提示
      console.log('在线客服可用')
    }
  }, 5000)
})
</script>

<style scoped>
.contact-page {
  min-height: 100vh;
  width: 100%;
}

/* 通用容器样式 - 确保内容居中且有合适边距 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
  box-sizing: border-box;
}

/* 针对不同屏幕尺寸的优化 */
@media (min-width: 576px) {
  .container {
    padding: 0 30px;
  }
}

@media (min-width: 768px) {
  .container {
    padding: 0 40px;
  }
}

@media (min-width: 992px) {
  .container {
    padding: 0 50px;
  }
}

@media (min-width: 1200px) {
  .container {
    max-width: 1200px;
    padding: 0 60px;
  }
}

@media (min-width: 1400px) {
  .container {
    max-width: 1300px;
    padding: 0 80px;
  }
}

@media (min-width: 1600px) {
  .container {
    max-width: 1400px;
    padding: 0 100px;
  }
}

/* 确保页面内容在超大屏幕上不会过度拉伸 */
@media (min-width: 1920px) {
  .container {
    max-width: 1500px;
    padding: 0 120px;
  }
}

/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 80px 0;
  text-align: center;
}

.page-header h1 {
  font-size: 48px;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.page-header p {
  font-size: 20px;
  margin: 0;
  opacity: 0.9;
}

/* 联系方式 */
.contact-info {
  padding: 80px 0;
  background: white;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
}

.contact-item {
  text-align: center;
  padding: 40px 30px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 2px solid #e9ecef;
  transition: transform 0.3s, box-shadow 0.3s;
}

.contact-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
}

.contact-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.contact-item h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.contact-item p {
  font-size: 16px;
  color: #495057;
  margin: 4px 0;
}

.contact-item small {
  font-size: 12px;
  color: #6c757d;
  margin-top: 8px;
  display: block;
}

/* 联系表单 */
.contact-form-section {
  padding: 80px 0;
  background-color: #f8f9fa;
}

.form-header {
  text-align: center;
  margin-bottom: 50px;
}

.form-header h2 {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.form-header p {
  font-size: 18px;
  color: #6c757d;
  margin: 0;
}

.contact-form {
  max-width: 800px;
  margin: 0 auto;
  background: white;
  padding: 50px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-group textarea {
  resize: vertical;
  min-height: 120px;
}

.checkbox-group {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #495057;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
  margin-right: 8px;
}

.checkbox-label a {
  color: #667eea;
  text-decoration: none;
}

.checkbox-label a:hover {
  text-decoration: underline;
}

.form-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 30px;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s;
  cursor: pointer;
  border: none;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-outline {
  background-color: transparent;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-outline:hover {
  background-color: #667eea;
  color: white;
}

/* 单选按钮组 */
.radio-group {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #495057;
}

.radio-label input[type="radio"] {
  width: auto;
  margin-right: 8px;
}

/* 产品询价 */
.inquiry-section {
  padding: 80px 0;
  background: white;
}

.inquiry-header {
  text-align: center;
  margin-bottom: 50px;
}

.inquiry-header h2 {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.inquiry-header p {
  font-size: 18px;
  color: #6c757d;
  margin: 0;
}

.inquiry-form-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.inquiry-form {
  background: #f8f9fa;
  padding: 40px;
  border-radius: 12px;
  border: 2px solid #e9ecef;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 8px;
}

.inquiry-benefits {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px 30px;
  border-radius: 12px;
  height: fit-content;
}

.inquiry-benefits h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px 0;
}

.inquiry-benefits ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.inquiry-benefits li {
  padding: 8px 0;
  font-size: 14px;
  opacity: 0.9;
}

/* 地图增强 */
.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-header h2 {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.section-header p {
  font-size: 18px;
  color: #6c757d;
  margin: 0;
}

.map-section {
  padding: 80px 0;
  background-color: #f8f9fa;
}

.map-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 40px;
  align-items: start;
}

.map-placeholder {
  height: 400px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px solid #dee2e6;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.map-placeholder:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.map-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.map-placeholder p {
  font-size: 18px;
  color: #6c757d;
  margin: 0 0 8px 0;
}

.map-placeholder small {
  font-size: 14px;
  color: #adb5bd;
  margin-bottom: 16px;
}

.map-coordinates {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #6c757d;
}

.map-info h3 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 30px 0;
  color: #2c3e50;
}

.transport-item {
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.transport-item strong {
  color: #2c3e50;
  font-size: 16px;
}

.transport-item p {
  margin: 8px 0 0 0;
  color: #6c757d;
  font-size: 14px;
}

.navigation-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.navigation-buttons .btn {
  font-size: 14px;
  padding: 8px 16px;
}

/* 常见问题 */
.faq-section {
  padding: 80px 0;
  background: white;
}

.faq-list {
  max-width: 800px;
  margin: 0 auto;
}

.faq-item {
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 16px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.faq-question {
  padding: 20px 30px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.3s;
}

.faq-question:hover {
  background-color: #e9ecef;
}

.faq-question h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #2c3e50;
}

.faq-toggle {
  font-size: 24px;
  font-weight: 300;
  color: #667eea;
  transition: transform 0.3s;
}

.faq-toggle.active {
  transform: rotate(45deg);
}

.faq-answer {
  padding: 0 30px 20px 30px;
  border-top: 1px solid #dee2e6;
}

.faq-answer p {
  margin: 20px 0 0 0;
  color: #6c757d;
  line-height: 1.6;
}

/* 在线客服 */
.online-service {
  position: fixed;
  bottom: 100px;
  right: 30px;
  z-index: 1000;
}

.service-widget {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  width: 280px;
  overflow: hidden;
}

.service-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.service-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.service-content {
  padding: 20px;
}

.service-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8f9fa;
  border: none;
  border-radius: 8px;
  text-decoration: none;
  color: #2c3e50;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.service-option:hover {
  background-color: #e9ecef;
  color: #2c3e50;
}

.service-option .icon {
  font-size: 18px;
}

/* 浮动客服按钮 */
.floating-service {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
  transition: transform 0.3s, box-shadow 0.3s;
  z-index: 999;
}

.floating-service:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(102, 126, 234, 0.5);
}

.service-icon {
  font-size: 24px;
  color: white;
  margin-bottom: 2px;
}

.service-text {
  font-size: 10px;
  color: white;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 36px;
  }
  
  .page-header p {
    font-size: 18px;
  }
  
  .contact-grid {
    grid-template-columns: 1fr;
  }
  
  .contact-form {
    padding: 30px 20px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .form-header h2,
  .inquiry-header h2 {
    font-size: 28px;
  }
  
  .inquiry-form-container {
    grid-template-columns: 1fr;
  }
  
  .inquiry-form {
    padding: 30px 20px;
  }
  
  .checkbox-grid {
    grid-template-columns: 1fr;
  }
  
  .radio-group {
    flex-direction: column;
    gap: 12px;
  }
  
  .map-container {
    grid-template-columns: 1fr;
  }
  
  .map-placeholder {
    height: 250px;
  }
  
  .navigation-buttons {
    flex-direction: column;
  }
  
  .section-header h2 {
    font-size: 28px;
  }
  
  .faq-question {
    padding: 15px 20px;
  }
  
  .faq-answer {
    padding: 0 20px 15px 20px;
  }
  
  .online-service {
    bottom: 80px;
    right: 20px;
  }
  
  .service-widget {
    width: 260px;
  }
  
  .floating-service {
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
  }
  
  .service-icon {
    font-size: 20px;
  }
  
  .service-text {
    font-size: 9px;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 60px 0;
  }
  
  .page-header h1 {
    font-size: 28px;
  }
  
  .contact-info,
  .contact-form-section,
  .inquiry-section,
  .map-section,
  .faq-section {
    padding: 60px 0;
  }
  
  .contact-item {
    padding: 30px 20px;
  }
  
  .inquiry-benefits {
    padding: 30px 20px;
  }
  
  .service-widget {
    width: calc(100vw - 40px);
    right: 20px;
  }
}
</style>