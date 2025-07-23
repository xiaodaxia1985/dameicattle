<template>
  <div class="culture-page">
    <!-- 页面头部 -->
    <section class="page-header">
      <div class="container">
        <h1>企业文化</h1>
        <p>传承创新精神，共创美好未来</p>
      </div>
    </section>

    <!-- 企业使命愿景 -->
    <section class="mission-vision">
      <div class="container">
        <div class="mission-content" :class="{ 'animate-in': isVisible.mission }">
          <div class="mission-item" style="animation-delay: 0.1s">
            <div class="mission-icon">
              <div class="modern-icon-xl icon-target icon-pulse"></div>
            </div>
            <h2>企业使命</h2>
            <p>通过数字化技术推动畜牧业现代化发展，为客户创造价值，为行业进步贡献力量</p>
          </div>
          <div class="mission-item" style="animation-delay: 0.2s">
            <div class="mission-icon">
              <div class="modern-icon-xl icon-star icon-pulse"></div>
            </div>
            <h2>企业愿景</h2>
            <p>成为中国领先的畜牧业数字化解决方案提供商，引领行业数字化转型</p>
          </div>
          <div class="mission-item" style="animation-delay: 0.3s">
            <div class="mission-icon">
              <div class="modern-icon-xl icon-diamond icon-pulse"></div>
            </div>
            <h2>核心价值观</h2>
            <p>诚信、创新、专业、共赢 - 以诚待人，以创新驱动，以专业服务，与客户共赢</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 企业精神 -->
    <section class="company-spirit">
      <div class="container">
        <div class="section-header">
          <h2>企业精神</h2>
          <p>我们的精神品质指引着团队前进的方向</p>
        </div>
        <div class="spirit-grid" :class="{ 'animate-in': isVisible.spirit }">
          <div class="spirit-card" style="animation-delay: 0.1s">
            <div class="spirit-icon">
              <div class="modern-icon-xl icon-fire icon-bounce"></div>
            </div>
            <h3>激情进取</h3>
            <p>保持对事业的热情，积极进取，勇于挑战，追求卓越</p>
          </div>
          <div class="spirit-card" style="animation-delay: 0.2s">
            <div class="spirit-icon">
              <div class="modern-icon-xl icon-handshake icon-bounce"></div>
            </div>
            <h3>团队协作</h3>
            <p>重视团队合作，相互支持，共同成长，实现团队目标</p>
          </div>
          <div class="spirit-card" style="animation-delay: 0.3s">
            <div class="spirit-icon">
              <div class="modern-icon-xl icon-book icon-bounce"></div>
            </div>
            <h3>持续学习</h3>
            <p>保持学习的心态，不断提升自我，适应行业发展变化</p>
          </div>
          <div class="spirit-card" style="animation-delay: 0.4s">
            <div class="spirit-icon">
              <div class="modern-icon-xl icon-innovation icon-bounce"></div>
            </div>
            <h3>创新思维</h3>
            <p>鼓励创新思维，勇于尝试新方法，推动技术和服务创新</p>
          </div>
          <div class="spirit-card" style="animation-delay: 0.5s">
            <div class="spirit-icon">
              <div class="modern-icon-xl icon-balance icon-bounce"></div>
            </div>
            <h3>责任担当</h3>
            <p>承担社会责任，对客户负责，对员工负责，对社会负责</p>
          </div>
          <div class="spirit-card" style="animation-delay: 0.6s">
            <div class="spirit-icon">
              <div class="modern-icon-xl icon-growth icon-bounce"></div>
            </div>
            <h3>可持续发展</h3>
            <p>关注环境保护，推动绿色发展，实现经济效益与社会效益的统一</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 工作理念 -->
    <section class="work-philosophy">
      <div class="container">
        <div class="philosophy-content" :class="{ 'animate-in': isVisible.philosophy }">
          <div class="philosophy-text">
            <h2>工作理念</h2>
            <div class="philosophy-list">
              <div class="philosophy-item" style="animation-delay: 0.1s">
                <div class="item-number">01</div>
                <div class="item-content">
                  <h3>客户第一</h3>
                  <p>始终将客户需求放在首位，用心服务每一位客户，超越客户期望</p>
                </div>
              </div>
              <div class="philosophy-item" style="animation-delay: 0.2s">
                <div class="item-number">02</div>
                <div class="item-content">
                  <h3>质量至上</h3>
                  <p>严格把控产品质量，精益求精，为客户提供可靠的产品和服务</p>
                </div>
              </div>
              <div class="philosophy-item" style="animation-delay: 0.3s">
                <div class="item-number">03</div>
                <div class="item-content">
                  <h3>效率优先</h3>
                  <p>注重工作效率，优化工作流程，快速响应客户需求</p>
                </div>
              </div>
              <div class="philosophy-item" style="animation-delay: 0.4s">
                <div class="item-number">04</div>
                <div class="item-content">
                  <h3>持续改进</h3>
                  <p>不断总结经验，持续改进工作方法，追求更好的结果</p>
                </div>
              </div>
            </div>
          </div>
          <div class="philosophy-image">
            <div class="image-placeholder">
              <div class="placeholder-icon modern-icon-xl icon-briefcase"></div>
              <p>专业团队协作</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 企业文化活动 -->
    <section class="culture-activities">
      <div class="container">
        <div class="section-header">
          <h2>企业文化活动</h2>
          <p>丰富多彩的企业文化活动，营造积极向上的工作氛围</p>
        </div>
        <div class="activities-grid" :class="{ 'animate-in': isVisible.activities }">
          <div class="activity-card" style="animation-delay: 0.1s">
            <div class="activity-image">
              <div class="image-placeholder">
                <div class="modern-icon-xl icon-team icon-spin"></div>
              </div>
            </div>
            <div class="activity-content">
              <h3>团队建设活动</h3>
              <p>定期组织团队建设活动，增强团队凝聚力，促进员工之间的交流与合作</p>
            </div>
          </div>
          <div class="activity-card" style="animation-delay: 0.2s">
            <div class="activity-image">
              <div class="image-placeholder">
                <div class="modern-icon-xl icon-book icon-spin"></div>
              </div>
            </div>
            <div class="activity-content">
              <h3>技术分享会</h3>
              <p>定期举办技术分享会，鼓励员工分享经验，促进技术交流与学习</p>
            </div>
          </div>
          <div class="activity-card" style="animation-delay: 0.3s">
            <div class="activity-image">
              <div class="image-placeholder">
                <div class="modern-icon-xl icon-trophy icon-spin"></div>
              </div>
            </div>
            <div class="activity-content">
              <h3>员工表彰大会</h3>
              <p>表彰优秀员工，激励团队士气，营造积极向上的工作氛围</p>
            </div>
          </div>
          <div class="activity-card" style="animation-delay: 0.4s">
            <div class="activity-image">
              <div class="image-placeholder">
                <div class="modern-icon-xl icon-graduation icon-spin"></div>
              </div>
            </div>
            <div class="activity-content">
              <h3>培训学习</h3>
              <p>提供多样化的培训机会，支持员工职业发展，提升专业技能</p>
            </div>
          </div>
          <div class="activity-card" style="animation-delay: 0.5s">
            <div class="activity-image">
              <div class="image-placeholder">
                <div class="modern-icon-xl icon-leaf icon-spin"></div>
              </div>
            </div>
            <div class="activity-content">
              <h3>公益活动</h3>
              <p>积极参与社会公益活动，履行企业社会责任，回馈社会</p>
            </div>
          </div>
          <div class="activity-card" style="animation-delay: 0.6s">
            <div class="activity-image">
              <div class="image-placeholder">
                <div class="modern-icon-xl icon-celebration icon-spin"></div>
              </div>
            </div>
            <div class="activity-content">
              <h3>节日庆祝</h3>
              <p>组织各种节日庆祝活动，丰富员工业余生活，增强归属感</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 员工福利 -->
    <section class="employee-benefits">
      <div class="container">
        <div class="section-header">
          <h2>员工福利</h2>
          <p>完善的福利体系，关爱每一位员工</p>
        </div>
        <div class="benefits-content">
          <div class="benefits-grid" :class="{ 'animate-in': isVisible.benefits }">
            <div class="benefit-category" style="animation-delay: 0.1s">
              <h3><div class="modern-icon icon-money" style="display: inline-block; margin-right: 8px;"></div> 薪酬福利</h3>
              <ul>
                <li>具有竞争力的薪酬体系</li>
                <li>年终奖金和绩效奖励</li>
                <li>股权激励计划</li>
                <li>定期薪酬调整机制</li>
              </ul>
            </div>
            <div class="benefit-category" style="animation-delay: 0.2s">
              <h3><div class="modern-icon icon-medical" style="display: inline-block; margin-right: 8px;"></div> 健康保障</h3>
              <ul>
                <li>完善的社会保险</li>
                <li>补充商业医疗保险</li>
                <li>定期健康体检</li>
                <li>心理健康咨询服务</li>
              </ul>
            </div>
            <div class="benefit-category" style="animation-delay: 0.3s">
              <h3><div class="modern-icon icon-book" style="display: inline-block; margin-right: 8px;"></div> 学习发展</h3>
              <ul>
                <li>专业技能培训</li>
                <li>外部学习机会</li>
                <li>职业发展规划</li>
                <li>学历提升支持</li>
              </ul>
            </div>
            <div class="benefit-category" style="animation-delay: 0.4s">
              <h3><div class="modern-icon icon-vacation" style="display: inline-block; margin-right: 8px;"></div> 休假制度</h3>
              <ul>
                <li>带薪年假</li>
                <li>法定节假日</li>
                <li>病假和事假</li>
                <li>婚假和产假</li>
              </ul>
            </div>
            <div class="benefit-category" style="animation-delay: 0.5s">
              <h3><div class="modern-icon icon-target" style="display: inline-block; margin-right: 8px;"></div> 工作环境</h3>
              <ul>
                <li>现代化办公环境</li>
                <li>弹性工作时间</li>
                <li>远程办公支持</li>
                <li>舒适的休息区域</li>
              </ul>
            </div>
            <div class="benefit-category" style="animation-delay: 0.6s">
              <h3><div class="modern-icon icon-celebration" style="display: inline-block; margin-right: 8px;"></div> 生活关怀</h3>
              <ul>
                <li>员工生日祝福</li>
                <li>节日礼品</li>
                <li>家庭关怀计划</li>
                <li>员工活动经费</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 加入我们 -->
    <section class="join-us">
      <div class="container">
        <div class="join-content">
          <h2>加入我们</h2>
          <p>我们正在寻找志同道合的伙伴，一起推动畜牧业数字化发展</p>
          <div class="join-features">
            <div class="join-feature">
              <div class="feature-icon modern-icon icon-rocket"></div>
              <span>广阔的发展空间</span>
            </div>
            <div class="join-feature">
              <div class="feature-icon modern-icon icon-team"></div>
              <span>优秀的团队氛围</span>
            </div>
            <div class="join-feature">
              <div class="feature-icon modern-icon icon-bulb"></div>
              <span>创新的工作环境</span>
            </div>
            <div class="join-feature">
              <div class="feature-icon modern-icon icon-target"></div>
              <span>有意义的工作内容</span>
            </div>
          </div>
          <div class="join-actions">
            <router-link to="/portal/contact" class="btn btn-primary">联系我们</router-link>
            <a href="mailto:hr@cattle-management.com" class="btn btn-outline">发送简历</a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// 动画状态
const isVisible = ref({
  mission: false,
  spirit: false,
  philosophy: false,
  activities: false,
  benefits: false
})

// 滚动监听
const handleScroll = () => {
  const elements = [
    { key: 'mission', selector: '.mission-content' },
    { key: 'spirit', selector: '.spirit-grid' },
    { key: 'philosophy', selector: '.philosophy-content' },
    { key: 'activities', selector: '.activities-grid' },
    { key: 'benefits', selector: '.benefits-grid' }
  ]

  elements.forEach(({ key, selector }) => {
    const element = document.querySelector(selector)
    if (element && !isVisible.value[key]) {
      const rect = element.getBoundingClientRect()
      const windowHeight = window.innerHeight
      
      if (rect.top < windowHeight * 0.8) {
        isVisible.value[key] = true
      }
    }
  })
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll() // 初始检查
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.culture-page {
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

/* 使命愿景 */
.mission-vision {
  padding: 80px 0;
  background: white;
}

.mission-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 40px;
}

.mission-item {
  text-align: center;
  padding: 40px 30px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  border: 2px solid #dee2e6;
}

.mission-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.mission-item h2 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: #2c3e50;
}

.mission-item p {
  font-size: 16px;
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
}

/* 企业精神 */
.company-spirit {
  padding: 80px 0;
  background-color: #f8f9fa;
}

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

.spirit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.spirit-card {
  background: white;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
}

.spirit-card:hover {
  transform: translateY(-5px);
}

.spirit-icon {
  font-size: 40px;
  margin-bottom: 20px;
}

.spirit-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.spirit-card p {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
}

/* 工作理念 */
.work-philosophy {
  padding: 80px 0;
  background: white;
}

.philosophy-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.philosophy-text h2 {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 40px 0;
  color: #2c3e50;
}

.philosophy-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.philosophy-item {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.item-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  flex-shrink: 0;
}

.item-content h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.item-content p {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
}

.philosophy-image {
  display: flex;
  justify-content: center;
}

.image-placeholder {
  width: 400px;
  height: 300px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 2px solid #dee2e6;
}

.placeholder-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.image-placeholder p {
  font-size: 16px;
  color: #6c757d;
  margin: 0;
}

/* 企业文化活动 */
.culture-activities {
  padding: 80px 0;
  background-color: #f8f9fa;
}

.activities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 30px;
}

.activity-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
}

.activity-card:hover {
  transform: translateY(-5px);
}

.activity-image {
  height: 150px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: white;
}

.activity-content {
  padding: 24px;
}

.activity-content h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.activity-content p {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
}

/* 员工福利 */
.employee-benefits {
  padding: 80px 0;
  background: white;
}

.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.benefit-category {
  background: #f8f9fa;
  padding: 30px;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.benefit-category h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px 0;
  color: #2c3e50;
}

.benefit-category ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.benefit-category li {
  padding: 8px 0;
  font-size: 14px;
  color: #6c757d;
  position: relative;
  padding-left: 20px;
}

.benefit-category li::before {
  content: '✓';
  color: #667eea;
  font-weight: bold;
  position: absolute;
  left: 0;
}

/* 加入我们 */
.join-us {
  padding: 80px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.join-content h2 {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 16px 0;
}

.join-content p {
  font-size: 18px;
  margin: 0 0 40px 0;
  opacity: 0.9;
}

.join-features {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.join-feature {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
}

.feature-icon {
  font-size: 20px;
}

.join-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s;
  display: inline-block;
}

.btn-primary {
  background-color: white;
  color: #667eea;
}

.btn-primary:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
}

.btn-outline {
  background-color: transparent;
  color: white;
  border: 2px solid white;
}

.btn-outline:hover {
  background-color: white;
  color: #667eea;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 36px;
  }
  
  .page-header p {
    font-size: 18px;
  }
  
  .mission-content {
    grid-template-columns: 1fr;
  }
  
  .philosophy-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .image-placeholder {
    width: 300px;
    height: 200px;
  }
  
  .placeholder-icon {
    font-size: 60px;
  }
  
  .spirit-grid,
  .activities-grid,
  .benefits-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header h2 {
    font-size: 28px;
  }
  
  .philosophy-text h2,
  .join-content h2 {
    font-size: 28px;
  }
  
  .join-features {
    flex-direction: column;
    gap: 20px;
  }
  
  .join-actions {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 60px 0;
  }
  
  .page-header h1 {
    font-size: 28px;
  }
  
  .mission-vision,
  .company-spirit,
  .work-philosophy,
  .culture-activities,
  .employee-benefits,
  .join-us {
    padding: 60px 0;
  }
  
  .mission-item,
  .spirit-card,
  .benefit-category {
    padding: 20px;
  }
  
  .philosophy-item {
    flex-direction: column;
    text-align: center;
  }
  
  .activity-content {
    padding: 20px;
  }
}
</style>