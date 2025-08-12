import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Notification routes
router.get('/', NotificationController.getNotifications);
router.get('/:id', NotificationController.getNotificationById);
router.post('/', NotificationController.createNotification);
router.put('/:id', NotificationController.updateNotification);
router.delete('/:id', NotificationController.deleteNotification);

// Notification status management
router.put('/:id/read', NotificationController.markAsRead);
router.put('/:id/unread', NotificationController.markAsUnread);
router.put('/read-all', NotificationController.markAllAsRead);

// Notification sending
router.post('/send', NotificationController.sendNotification);
router.post('/send/batch', NotificationController.sendBatchNotifications);

// Notification templates
router.get('/templates', NotificationController.getNotificationTemplates);
router.post('/templates', NotificationController.createNotificationTemplate);
router.put('/templates/:id', NotificationController.updateNotificationTemplate);
router.delete('/templates/:id', NotificationController.deleteNotificationTemplate);

// Notification settings
router.get('/settings', NotificationController.getNotificationSettings);
router.put('/settings', NotificationController.updateNotificationSettings);

// Notification statistics
router.get('/statistics', NotificationController.getNotificationStatistics);

export default router;