import { Router } from 'express';
import { HttpClient } from '@cattle-management/shared';
import { services } from '../config/services';

const router = Router();

router.get('/health', async (req, res) => {
  const healthChecks: Record<string, any> = {};
  
  // 检查所有服务的健康状态
  const checkPromises = Object.entries(services).map(async ([key, service]) => {
    try {
      const client = new HttpClient(service.url, 3000);
      const health = await client.get(service.healthPath);
      healthChecks[key] = {
        status: 'healthy',
        url: service.url,
        response: health
      };
    } catch (error) {
      healthChecks[key] = {
        status: 'unhealthy',
        url: service.url,
        error: error.message
      };
    }
  });

  await Promise.all(checkPromises);

  const overallStatus = Object.values(healthChecks).every(
    (check: any) => check.status === 'healthy'
  ) ? 'healthy' : 'degraded';

  res.success({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    services: healthChecks
  }, 'Gateway health check completed');
});

export default router;