import { Router } from 'express';
import { requirePermission } from '@/middleware/auth';

const router = Router();

// GET /api/v1/permissions - 获取权限列表
router.get('/', requirePermission('users:read'), (req, res) => {
  // 模拟权限数据
  const permissions = {
    'users': ['users:read', 'users:create', 'users:update', 'users:delete'],
    'bases': ['bases:read', 'bases:create', 'bases:update', 'bases:delete'],
    'cattle': ['cattle:read', 'cattle:create', 'cattle:update', 'cattle:delete'],
    'feeding': ['feeding:read', 'feeding:create', 'feeding:update', 'feeding:delete'],
    'health': ['health:read', 'health:create', 'health:update', 'health:delete'],
    'equipment': ['equipment:read', 'equipment:create', 'equipment:update', 'equipment:delete'],
    'materials': ['materials:read', 'materials:create', 'materials:update', 'materials:delete'],
    'purchase': ['purchase:read', 'purchase:create', 'purchase:update', 'purchase:delete', 'purchase:approve'],
    'sales': ['sales:read', 'sales:create', 'sales:update', 'sales:delete', 'sales:approve'],
    'news': ['news:read', 'news:create', 'news:update', 'news:delete'],
    'portal': ['portal:read', 'portal:update'],
    'help': ['help:read', 'help:chat'],
    'upload': ['upload:image', 'upload:file', 'upload:avatar', 'upload:batch', 'upload:delete'],
    'dashboard': ['dashboard:read'],
    'reports': ['reports:read', 'reports:export']
  };

  res.json({
    success: true,
    data: permissions
  });
});

export default router;