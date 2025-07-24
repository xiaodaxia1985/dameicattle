import { Router } from 'express';
import { PortalController } from '@/controllers/PortalController';
import { requirePermission } from '@/middleware/auth';

const router = Router();
const portalController = new PortalController();

// ========== 门户网站配置管理 ==========

// 获取门户配置列表
router.get('/configs', 
  requirePermission('portal:read'), 
  portalController.getConfigs
);

// 获取单个配置
router.get('/configs/:key', 
  requirePermission('portal:read'), 
  portalController.getConfig
);

// 更新配置
router.put('/configs/:key', 
  requirePermission('portal:update'), 
  portalController.updateConfig
);

// ========== 轮播图管理 ==========

// 获取轮播图列表
router.get('/carousels', 
  requirePermission('portal:read'), 
  portalController.getCarousels
);

// ========== 广告管理 ==========

// 获取广告列表
router.get('/advertisements', 
  requirePermission('portal:read'), 
  portalController.getAdvertisements
);

// ========== 页面内容管理 ==========

// 获取页面内容列表
router.get('/page-contents', 
  requirePermission('portal:read'), 
  portalController.getPageContents
);

// ========== 留言管理 ==========

// 获取留言列表
router.get('/contact-messages', 
  requirePermission('portal:read'), 
  portalController.getContactMessages
);

// ========== 询价管理 ==========

// 获取询价列表
router.get('/inquiries', 
  requirePermission('portal:read'), 
  portalController.getInquiries
);

export default router;