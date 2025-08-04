import express from 'express';
import { BackendProxy } from '@cattle-management/shared';

const router = express.Router();

// 获取代理实例的辅助函数
const getProxy = (req: express.Request): BackendProxy => {
  return (req as any).backendProxy;
};

// 基地相关路由

// 获取基地列表
router.get('/bases', async (req, res) => {
  try {
    const proxy = getProxy(req);
    const result = await proxy.get('/bases', req.query, {
      cache: true,
      cacheTTL: 300 // 5分钟缓存
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || '获取基地列表失败',
      error: 'GET_BASES_FAILED'
    });
  }
});

// 获取基地详情
router.get('/bases/:id', async (req, res) => {
  try {
    const proxy = getProxy(req);
    const result = await proxy.get(`/bases/${req.params.id}`, undefined, {
      cache: true,
      cacheTTL: 600 // 10分钟缓存
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || '获取基地详情失败',
      error: 'GET_BASE_FAILED'
    });
  }
});

// 创建基地
router.post('/bases', async (req, res) => {
  try {
    const proxy = getProxy(req);
    const result = await proxy.post('/bases', req.body, {
      invalidateCache: ['proxy:GET:/bases:*'] // 清除基地列表缓存
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || '创建基地失败',
      error: 'CREATE_BASE_FAILED'
    });
  }
});

// 更新基地
router.put('/bases/:id', async (req, res) => {
  try {
    const proxy = getProxy(req);
    const result = await proxy.put(`/bases/${req.params.id}`, req.body, {
      invalidateCache: [
        'proxy:GET:/bases:*',
        `proxy:GET:/bases/${req.params.id}:*`
      ]
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || '更新基地失败',
      error: 'UPDATE_BASE_FAILED'
    });
  }
});

// 删除基地
router.delete('/bases/:id', async (req, res) => {
  try {
    const proxy = getProxy(req);
    const result = await proxy.delete(`/bases/${req.params.id}`, {
      invalidateCache: [
        'proxy:GET:/bases:*',
        `proxy:GET:/bases/${req.params.id}:*`
      ]
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || '删除基地失败',
      error: 'DELETE_BASE_FAILED'
    });
  }
});

// 牛舍相关路由

// 获取牛舍列表
router.get('/barns', async (req, res) => {
  try {
    const proxy = getProxy(req);
    const result = await proxy.get('/barns', req.query, {
      cache: true,
      cacheTTL: 300
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || '获取牛舍列表失败',
      error: 'GET_BARNS_FAILED'
    });
  }
});

// 获取牛舍详情
router.get('/barns/:id', async (req, res) => {
  try {
    const proxy = getProxy(req);
    const result = await proxy.get(`/barns/${req.params.id}`, undefined, {
      cache: true,
      cacheTTL: 600
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || '获取牛舍详情失败',
      error: 'GET_BARN_FAILED'
    });
  }
});

// 创建牛舍
router.post('/barns', async (req, res) => {
  try {
    const proxy = getProxy(req);
    const result = await proxy.post('/barns', req.body, {
      invalidateCache: ['proxy:GET:/barns:*']
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || '创建牛舍失败',
      error: 'CREATE_BARN_FAILED'
    });
  }
});

// 更新牛舍
router.put('/barns/:id', async (req, res) => {
  try {
    const proxy = getProxy(req);
    const result = await proxy.put(`/barns/${req.params.id}`, req.body, {
      invalidateCache: [
        'proxy:GET:/barns:*',
        `proxy:GET:/barns/${req.params.id}:*`
      ]
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || '更新牛舍失败',
      error: 'UPDATE_BARN_FAILED'
    });
  }
});

// 删除牛舍
router.delete('/barns/:id', async (req, res) => {
  try {
    const proxy = getProxy(req);
    const result = await proxy.delete(`/barns/${req.params.id}`, {
      invalidateCache: [
        'proxy:GET:/barns:*',
        `proxy:GET:/barns/${req.params.id}:*`
      ]
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || '删除牛舍失败',
      error: 'DELETE_BARN_FAILED'
    });
  }
});

// 获取基地统计信息
router.get('/bases/:id/statistics', async (req, res) => {
  try {
    const proxy = getProxy(req);
    const result = await proxy.get(`/bases/${req.params.id}/statistics`, req.query, {
      cache: true,
      cacheTTL: 180 // 3分钟缓存，统计数据更新频繁
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || '获取基地统计失败',
      error: 'GET_BASE_STATISTICS_FAILED'
    });
  }
});

// 获取牛舍容量信息
router.get('/barns/:id/capacity', async (req, res) => {
  try {
    const proxy = getProxy(req);
    const result = await proxy.get(`/barns/${req.params.id}/capacity`, req.query, {
      cache: true,
      cacheTTL: 120 // 2分钟缓存，容量信息变化较快
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || '获取牛舍容量失败',
      error: 'GET_BARN_CAPACITY_FAILED'
    });
  }
});

// 批量操作路由

// 批量创建牛舍
router.post('/barns/batch', async (req, res) => {
  try {
    const proxy = getProxy(req);
    const result = await proxy.post('/barns/batch', req.body, {
      invalidateCache: ['proxy:GET:/barns:*']
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || '批量创建牛舍失败',
      error: 'BATCH_CREATE_BARNS_FAILED'
    });
  }
});

// 批量更新牛舍
router.put('/barns/batch', async (req, res) => {
  try {
    const proxy = getProxy(req);
    const result = await proxy.put('/barns/batch', req.body, {
      invalidateCache: ['proxy:GET:/barns:*']
    });
    
    res.json(result);
  } catch (error: any) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || '批量更新牛舍失败',
      error: 'BATCH_UPDATE_BARNS_FAILED'
    });
  }
});

export default router;