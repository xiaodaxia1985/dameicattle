import { Router } from 'express'
import { Request, Response } from 'express'
import { authenticateToken } from '../middleware/auth'
import { logger } from '../utils/logger'

const router = Router()

// 所有路由都需要认证
router.use(authenticateToken)

// 获取基地列表（用于下拉选择）
router.get('/', async (req: Request, res: Response) => {
  try {
    // 这里应该从基地服务获取数据，暂时使用模拟数据
    const mockBases = [
      {
        id: 1,
        name: '主基地',
        address: '北京市朝阳区农业园区1号',
        status: 'active',
        manager: '张经理',
        phone: '13800138001'
      },
      {
        id: 2,
        name: '分基地A',
        address: '河北省廊坊市农业园区2号',
        status: 'active',
        manager: '李经理',
        phone: '13800138002'
      },
      {
        id: 3,
        name: '分基地B',
        address: '天津市武清区农业园区3号',
        status: 'active',
        manager: '王经理',
        phone: '13800138003'
      }
    ]

    // 过滤活跃的基地
    const activeBases = mockBases.filter(base => base.status === 'active')

    res.json({
      success: true,
      data: {
        bases: activeBases,
        pagination: {
          total: activeBases.length,
          page: 1,
          limit: 20,
          pages: 1
        }
      },
      message: '获取基地列表成功'
    })
  } catch (error) {
    logger.error('获取基地列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取基地列表失败',
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
})

export default router