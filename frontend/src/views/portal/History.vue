<template>
  <div class="history-page">
    <!-- 页面头部 -->
    <section class="page-header">
      <div class="container">
        <h1>发展历程</h1>
        <p>见证我们的成长足迹，共创美好未来</p>
      </div>
    </section>

    <!-- 发展历程时间线 -->
    <section class="timeline-section">
      <div class="container">
        <div class="section-header">
          <h2>发展历程</h2>
          <p>从初创到成长，每一步都是坚实的足迹</p>
        </div>
        <div class="timeline">
          <div class="timeline-item" v-for="(milestone, index) in milestones" :key="index">
            <div class="timeline-marker">
              <div class="marker-dot"></div>
              <div class="marker-line" v-if="index < milestones.length - 1"></div>
            </div>
            <div class="timeline-content">
              <div class="timeline-year">{{ milestone.year }}</div>
              <h3>{{ milestone.title }}</h3>
              <p>{{ milestone.description }}</p>
              <div class="timeline-achievements" v-if="milestone.achievements">
                <div class="achievement" v-for="achievement in milestone.achievements" :key="achievement">
                  <i class="achievement-icon">✓</i>
                  <span>{{ achievement }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 重要里程碑 -->
    <section class="milestones-section">
      <div class="container">
        <div class="section-header">
          <h2>重要里程碑</h2>
          <p>关键节点见证我们的成长与突破</p>
        </div>
        <div class="milestones-grid">
          <div class="milestone-card">
            <div class="milestone-icon">🏢</div>
            <h3>公司成立</h3>
            <div class="milestone-year">2020年</div>
            <p>公司正式成立，开始专注于畜牧业数字化解决方案的研发</p>
          </div>
          <div class="milestone-card">
            <div class="milestone-icon">💻</div>
            <h3>产品发布</h3>
            <div class="milestone-year">2021年</div>
            <p>首个肉牛管理系统正式发布，获得市场积极反响</p>
          </div>
          <div class="milestone-card">
            <div class="milestone-icon">🏆</div>
            <h3>行业认可</h3>
            <div class="milestone-year">2022年</div>
            <p>获得行业优秀解决方案奖，技术实力得到权威认可</p>
          </div>
          <div class="milestone-card">
            <div class="milestone-icon">📈</div>
            <h3>快速发展</h3>
            <div class="milestone-year">2023年</div>
            <p>客户数量突破50家，管理牛只超过10万头</p>
          </div>
          <div class="milestone-card">
            <div class="milestone-icon">🌟</div>
            <h3>技术创新</h3>
            <div class="milestone-year">2024年</div>
            <p>推出移动端解决方案，实现全平台覆盖</p>
          </div>
          <div class="milestone-card">
            <div class="milestone-icon">🚀</div>
            <h3>未来展望</h3>
            <div class="milestone-year">2025年</div>
            <p>计划拓展更多业务领域，成为行业领导者</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 数据成就 -->
    <section class="achievements-section">
      <div class="container">
        <div class="section-header">
          <h2>发展成就</h2>
          <p>用数据见证我们的成长与进步</p>
        </div>
        <div class="achievements-grid">
          <div class="achievement-item">
            <div class="achievement-number">50+</div>
            <div class="achievement-label">服务客户</div>
            <p>为超过50家牧场提供专业服务</p>
          </div>
          <div class="achievement-item">
            <div class="achievement-number">10万+</div>
            <div class="achievement-label">管理牛只</div>
            <p>系统管理牛只数量超过10万头</p>
          </div>
          <div class="achievement-item">
            <div class="achievement-number">99%</div>
            <div class="achievement-label">客户满意度</div>
            <p>客户满意度持续保持在99%以上</p>
          </div>
          <div class="achievement-item">
            <div class="achievement-number">5项</div>
            <div class="achievement-label">软件著作权</div>
            <p>获得多项软件著作权认证</p>
          </div>
          <div class="achievement-item">
            <div class="achievement-number">24/7</div>
            <div class="achievement-label">技术支持</div>
            <p>提供全天候技术支持服务</p>
          </div>
          <div class="achievement-item">
            <div class="achievement-number">3个</div>
            <div class="achievement-label">研发中心</div>
            <p>在多个城市设立研发中心</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 团队发展 -->
    <section class="team-growth">
      <div class="container">
        <div class="growth-content">
          <div class="growth-text">
            <h2>团队发展</h2>
            <p>
              从最初的几人创业团队，发展到现在拥有技术、产品、销售、服务等完整部门的专业团队。
              我们始终坚持人才是企业发展的核心动力，不断吸引优秀人才加入，为团队成员提供良好的发展平台。
            </p>
            <div class="growth-stats">
              <div class="stat-item">
                <div class="stat-number">30+</div>
                <div class="stat-label">团队成员</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">80%</div>
                <div class="stat-label">技术人员占比</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">5年</div>
                <div class="stat-label">平均工作经验</div>
              </div>
            </div>
          </div>
          <div class="growth-image">
            <div class="image-placeholder">
              <i class="placeholder-icon">👥</i>
              <p>团队合作</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 技术演进 -->
    <section class="tech-evolution">
      <div class="container">
        <div class="section-header">
          <h2>技术演进</h2>
          <p>持续的技术创新推动产品不断升级</p>
        </div>
        <div class="evolution-timeline">
          <div class="evolution-item">
            <div class="evolution-year">2020</div>
            <div class="evolution-content">
              <h3>技术选型</h3>
              <p>确定技术架构，选择现代化的开发框架和工具</p>
              <div class="tech-tags">
                <span class="tech-tag">Node.js</span>
                <span class="tech-tag">Vue.js</span>
                <span class="tech-tag">PostgreSQL</span>
              </div>
            </div>
          </div>
          <div class="evolution-item">
            <div class="evolution-year">2021</div>
            <div class="evolution-content">
              <h3>系统架构</h3>
              <p>建立前后端分离架构，实现模块化设计</p>
              <div class="tech-tags">
                <span class="tech-tag">RESTful API</span>
                <span class="tech-tag">微服务</span>
                <span class="tech-tag">Docker</span>
              </div>
            </div>
          </div>
          <div class="evolution-item">
            <div class="evolution-year">2022</div>
            <div class="evolution-content">
              <h3>性能优化</h3>
              <p>引入缓存机制，优化数据库性能，提升系统响应速度</p>
              <div class="tech-tags">
                <span class="tech-tag">Redis</span>
                <span class="tech-tag">CDN</span>
                <span class="tech-tag">负载均衡</span>
              </div>
            </div>
          </div>
          <div class="evolution-item">
            <div class="evolution-year">2023</div>
            <div class="evolution-content">
              <h3>移动端支持</h3>
              <p>开发移动端应用，支持多平台访问</p>
              <div class="tech-tags">
                <span class="tech-tag">uni-app</span>
                <span class="tech-tag">React Native</span>
                <span class="tech-tag">响应式设计</span>
              </div>
            </div>
          </div>
          <div class="evolution-item">
            <div class="evolution-year">2024</div>
            <div class="evolution-content">
              <h3>智能化升级</h3>
              <p>集成AI技术，提供智能分析和预测功能</p>
              <div class="tech-tags">
                <span class="tech-tag">机器学习</span>
                <span class="tech-tag">数据分析</span>
                <span class="tech-tag">智能预警</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 未来展望 -->
    <section class="future-vision">
      <div class="container">
        <div class="vision-content">
          <h2>未来展望</h2>
          <p>
            展望未来，我们将继续深耕畜牧业数字化领域，不断创新技术和服务模式，
            为更多客户提供优质的解决方案。我们计划在以下几个方面持续发力：
          </p>
          <div class="vision-goals">
            <div class="goal-item">
              <div class="goal-icon">🎯</div>
              <h3>市场拓展</h3>
              <p>扩大市场覆盖范围，服务更多类型的养殖企业</p>
            </div>
            <div class="goal-item">
              <div class="goal-icon">🔬</div>
              <h3>技术创新</h3>
              <p>持续投入研发，引入更多前沿技术</p>
            </div>
            <div class="goal-item">
              <div class="goal-icon">🤝</div>
              <h3>合作伙伴</h3>
              <p>建立更广泛的合作伙伴关系，共同发展</p>
            </div>
            <div class="goal-item">
              <div class="goal-icon">🌍</div>
              <h3>国际化</h3>
              <p>探索国际市场机会，推广中国方案</p>
            </div>
          </div>
          <div class="vision-cta">
            <router-link to="/portal/contact" class="btn btn-primary">与我们一起成长</router-link>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 发展历程数据
const milestones = ref([
  {
    year: '2020',
    title: '公司成立',
    description: '公司正式成立，确定专注于畜牧业数字化解决方案的发展方向，组建核心技术团队。',
    achievements: ['确定技术架构', '组建核心团队', '完成市场调研']
  },
  {
    year: '2021',
    title: '产品研发',
    description: '完成第一版肉牛管理系统的开发，实现核心功能模块，开始与首批客户合作。',
    achievements: ['系统V1.0发布', '获得首批客户', '建立服务体系']
  },
  {
    year: '2022',
    title: '市场拓展',
    description: '产品功能不断完善，客户数量快速增长，获得行业认可和多项荣誉。',
    achievements: ['客户数量突破20家', '获得行业奖项', '完成A轮融资']
  },
  {
    year: '2023',
    title: '技术升级',
    description: '推出移动端解决方案，实现多平台支持，系统性能和用户体验大幅提升。',
    achievements: ['移动端上线', '性能优化50%', '用户满意度99%']
  },
  {
    year: '2024',
    title: '智能化发展',
    description: '集成AI技术，推出智能分析功能，为客户提供更加智能化的管理体验。',
    achievements: ['AI功能上线', '客户数量突破50家', '获得高新技术企业认定']
  }
])
</script>

<style scoped>
.history-page {
  min-height: 100vh;
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

/* 时间线 */
.timeline-section {
  padding: 80px 0;
  background: white;
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

.timeline {
  max-width: 800px;
  margin: 0 auto;
}

.timeline-item {
  display: flex;
  margin-bottom: 40px;
}

.timeline-marker {
  position: relative;
  margin-right: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.marker-dot {
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 0 0 4px #667eea;
}

.marker-line {
  width: 2px;
  height: 100px;
  background: #e9ecef;
  margin-top: 10px;
}

.timeline-content {
  flex: 1;
  background: #f8f9fa;
  padding: 30px;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.timeline-year {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 8px;
}

.timeline-content h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.timeline-content p {
  font-size: 16px;
  color: #6c757d;
  line-height: 1.6;
  margin: 0 0 20px 0;
}

.timeline-achievements {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.achievement {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #495057;
}

.achievement-icon {
  color: #667eea;
  font-weight: bold;
}

/* 重要里程碑 */
.milestones-section {
  padding: 80px 0;
  background-color: #f8f9fa;
}

.milestones-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.milestone-card {
  background: white;
  padding: 40px 30px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s;
}

.milestone-card:hover {
  transform: translateY(-5px);
}

.milestone-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.milestone-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.milestone-year {
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
  margin-bottom: 16px;
}

.milestone-card p {
  font-size: 14px;
  color: #6c757d;
  line-height: 1.6;
  margin: 0;
}

/* 数据成就 */
.achievements-section {
  padding: 80px 0;
  background: white;
}

.achievements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
}

.achievement-item {
  text-align: center;
}

.achievement-number {
  font-size: 48px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 8px;
}

.achievement-label {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
}

.achievement-item p {
  font-size: 14px;
  color: #6c757d;
  margin: 0;
}

/* 团队发展 */
.team-growth {
  padding: 80px 0;
  background-color: #f8f9fa;
}

.growth-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.growth-text h2 {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 24px 0;
  color: #2c3e50;
}

.growth-text p {
  font-size: 16px;
  line-height: 1.8;
  color: #6c757d;
  margin: 0 0 30px 0;
}

.growth-stats {
  display: flex;
  gap: 40px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #667eea;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #6c757d;
}

.growth-image {
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

/* 技术演进 */
.tech-evolution {
  padding: 80px 0;
  background: white;
}

.evolution-timeline {
  max-width: 800px;
  margin: 0 auto;
}

.evolution-item {
  display: flex;
  align-items: flex-start;
  gap: 30px;
  margin-bottom: 40px;
  padding-bottom: 40px;
  border-bottom: 1px solid #e9ecef;
}

.evolution-item:last-child {
  border-bottom: none;
}

.evolution-year {
  font-size: 24px;
  font-weight: 700;
  color: #667eea;
  min-width: 80px;
}

.evolution-content {
  flex: 1;
}

.evolution-content h3 {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.evolution-content p {
  font-size: 16px;
  color: #6c757d;
  line-height: 1.6;
  margin: 0 0 16px 0;
}

.tech-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tech-tag {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

/* 未来展望 */
.future-vision {
  padding: 80px 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
}

.vision-content h2 {
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 24px 0;
}

.vision-content p {
  font-size: 18px;
  line-height: 1.8;
  margin: 0 0 50px 0;
  opacity: 0.9;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.vision-goals {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
  margin-bottom: 50px;
}

.goal-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 30px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.goal-icon {
  font-size: 40px;
  margin-bottom: 20px;
}

.goal-item h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.goal-item p {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

.vision-cta {
  margin-top: 40px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 36px;
  }
  
  .page-header p {
    font-size: 18px;
  }
  
  .timeline-item {
    flex-direction: column;
  }
  
  .timeline-marker {
    flex-direction: row;
    margin-right: 0;
    margin-bottom: 20px;
  }
  
  .marker-line {
    width: 100px;
    height: 2px;
    margin-top: 0;
    margin-left: 10px;
  }
  
  .growth-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .growth-stats {
    justify-content: center;
  }
  
  .image-placeholder {
    width: 300px;
    height: 200px;
  }
  
  .placeholder-icon {
    font-size: 60px;
  }
  
  .evolution-item {
    flex-direction: column;
    gap: 15px;
  }
  
  .evolution-year {
    min-width: auto;
  }
  
  .milestones-grid,
  .achievements-grid,
  .vision-goals {
    grid-template-columns: 1fr;
  }
  
  .section-header h2 {
    font-size: 28px;
  }
  
  .growth-text h2,
  .vision-content h2 {
    font-size: 28px;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 60px 0;
  }
  
  .page-header h1 {
    font-size: 28px;
  }
  
  .timeline-section,
  .milestones-section,
  .achievements-section,
  .team-growth,
  .tech-evolution,
  .future-vision {
    padding: 60px 0;
  }
  
  .timeline-content,
  .milestone-card,
  .goal-item {
    padding: 20px;
  }
  
  .growth-stats {
    flex-direction: column;
    gap: 20px;
  }
}
</style>