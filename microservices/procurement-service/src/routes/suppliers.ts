import { Router } from 'express';
import { SupplierController } from '../controllers/SupplierController';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, SupplierController.getSuppliers);
router.post('/', authMiddleware, SupplierController.createSupplier);
router.get('/:id', authMiddleware, SupplierController.getSupplierById);
router.put('/:id', authMiddleware, SupplierController.updateSupplier);
router.delete('/:id', authMiddleware, SupplierController.deleteSupplier);

export default router;