import { Router } from 'express';
import { NewsController } from '@/controllers/NewsController';
import { PortalController } from '@/controllers/PortalController';

const router = Router();
const portalController = new PortalController();

// ========== 公开新闻接口 ==========

// 获取公开新闻列表（门户网站使用）
router.get('/news', NewsController.getPublicNews);

// 获取公开新闻详情（门户网站使用）
router.get('/news/:id', NewsController.getPublicNewsById);

// 增加新闻浏览量
router.post('/news/:id/view', NewsController.incrementViewCount);

// ========== 公开广告接口 ==========

// 获取公开广告（前端展示用）
router.get('/advertisements/:position', portalController.getPublicAdvertisements);

// ========== 公开页面内容接口 ==========

// 获取公开页面内容（前端展示用）
router.get('/page-contents/:page', portalController.getPublicPageContent);

// ========== 访客统计接口 ==========

// 记录访客行为
router.post('/visitor-actions', portalController.recordVisitorAction);

// ========== 留言和询价接口 ==========

// 提交留言（公开接口）
router.post('/contact-messages', portalController.submitContactMessage);

// 提交询价（公开接口）
router.post('/inquiries', portalController.submitInquiry);

export default router;