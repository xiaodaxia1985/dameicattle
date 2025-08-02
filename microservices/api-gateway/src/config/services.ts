export interface ServiceConfig {
  name: string;
  url: string;
  healthPath: string;
  timeout: number;
}

export const services: Record<string, ServiceConfig> = {
  auth: {
    name: 'auth-service',
    url: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
    healthPath: '/health',
    timeout: 5000
  },
  base: {
    name: 'base-service',
    url: process.env.BASE_SERVICE_URL || 'http://base-service:3002',
    healthPath: '/health',
    timeout: 5000
  },
  cattle: {
    name: 'cattle-service',
    url: process.env.CATTLE_SERVICE_URL || 'http://cattle-service:3003',
    healthPath: '/health',
    timeout: 5000
  },
  health: {
    name: 'health-service',
    url: process.env.HEALTH_SERVICE_URL || 'http://health-service:3004',
    healthPath: '/health',
    timeout: 5000
  },
  feeding: {
    name: 'feeding-service',
    url: process.env.FEEDING_SERVICE_URL || 'http://feeding-service:3005',
    healthPath: '/health',
    timeout: 5000
  },
  equipment: {
    name: 'equipment-service',
    url: process.env.EQUIPMENT_SERVICE_URL || 'http://equipment-service:3006',
    healthPath: '/health',
    timeout: 5000
  },
  procurement: {
    name: 'procurement-service',
    url: process.env.PROCUREMENT_SERVICE_URL || 'http://procurement-service:3007',
    healthPath: '/health',
    timeout: 5000
  },
  sales: {
    name: 'sales-service',
    url: process.env.SALES_SERVICE_URL || 'http://sales-service:3008',
    healthPath: '/health',
    timeout: 5000
  },
  material: {
    name: 'material-service',
    url: process.env.MATERIAL_SERVICE_URL || 'http://material-service:3009',
    healthPath: '/health',
    timeout: 5000
  },
  notification: {
    name: 'notification-service',
    url: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3010',
    healthPath: '/health',
    timeout: 5000
  },
  file: {
    name: 'file-service',
    url: process.env.FILE_SERVICE_URL || 'http://file-service:3011',
    healthPath: '/health',
    timeout: 5000
  },
  monitoring: {
    name: 'monitoring-service',
    url: process.env.MONITORING_SERVICE_URL || 'http://monitoring-service:3012',
    healthPath: '/health',
    timeout: 5000
  }
};