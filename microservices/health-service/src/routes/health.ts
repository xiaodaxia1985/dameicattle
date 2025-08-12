import { Router } from 'express';
import { HealthController } from '../controllers/HealthController';
import { authMiddleware, dataPermissionMiddleware } from '../middleware/auth';

const router = Router();

// Apply authentication and data permission middleware to all routes
router.use(authMiddleware);
router.use(dataPermissionMiddleware);

// Health record routes
router.get('/records', HealthController.getHealthRecords);
router.get('/records/:id', HealthController.getHealthRecordById);
router.post('/records', HealthController.createHealthRecord);
router.put('/records/:id', HealthController.updateHealthRecord);
router.delete('/records/:id', HealthController.deleteHealthRecord);

// Vaccination record routes
router.get('/vaccines', HealthController.getVaccinationRecords);
router.get('/vaccines/:id', HealthController.getVaccinationRecordById);
router.post('/vaccines', HealthController.createVaccinationRecord);
router.put('/vaccines/:id', HealthController.updateVaccinationRecord);
router.delete('/vaccines/:id', HealthController.deleteVaccinationRecord);

// Disease record routes
router.get('/diseases', HealthController.getDiseaseRecords);
router.get('/diseases/:id', HealthController.getDiseaseRecordById);
router.post('/diseases', HealthController.createDiseaseRecord);
router.put('/diseases/:id', HealthController.updateDiseaseRecord);
router.delete('/diseases/:id', HealthController.deleteDiseaseRecord);

// Health alerts routes
router.get('/alerts', HealthController.getHealthAlerts);
router.post('/alerts/notify', HealthController.sendHealthAlertNotifications);

// Health trend analysis routes
router.get('/trend', HealthController.getHealthTrend);

// Cattle health profile routes
router.get('/cattle/:cattleId/profile', HealthController.getCattleHealthProfile);

// Statistics routes
router.get('/statistics', HealthController.getHealthStatistics);

export default router;