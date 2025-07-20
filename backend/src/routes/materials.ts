import { Router } from 'express';
import { MaterialController } from '@/controllers/MaterialController';
import { InventoryController } from '@/controllers/InventoryController';
import { auth } from '@/middleware/auth';
import { permission } from '@/middleware/permission';
import { dataPermissionMiddleware as dataPermission } from '@/middleware/dataPermission';
import { validate } from '@/middleware/validation';
import {
  createMaterialCategoryValidator,
  updateMaterialCategoryValidator,
  createSupplierValidator,
  updateSupplierValidator,
  createProductionMaterialValidator,
  updateProductionMaterialValidator,
  createInventoryTransactionValidator,
  materialListQueryValidator,
  inventoryQueryValidator,
  transactionQueryValidator,
  idParamValidator,
} from '@/validators/material';

const router = Router();
const materialController = new MaterialController();
const inventoryController = new InventoryController();

// Apply authentication to all routes
router.use(auth);

// Material Categories Routes
router.get('/categories', 
  permission('material:read'),
  materialController.getMaterialCategories
);

router.post('/categories',
  permission('material:create'),
  createMaterialCategoryValidator,
  validate,
  materialController.createMaterialCategory
);

router.put('/categories/:id',
  permission('material:update'),
  updateMaterialCategoryValidator,
  validate,
  materialController.updateMaterialCategory
);

router.delete('/categories/:id',
  permission('material:delete'),
  idParamValidator,
  validate,
  materialController.deleteMaterialCategory
);

// Suppliers Routes
router.get('/suppliers',
  permission('material:read'),
  materialListQueryValidator,
  validate,
  materialController.getSuppliers
);

router.post('/suppliers',
  permission('material:create'),
  createSupplierValidator,
  validate,
  materialController.createSupplier
);

router.put('/suppliers/:id',
  permission('material:update'),
  updateSupplierValidator,
  validate,
  materialController.updateSupplier
);

router.delete('/suppliers/:id',
  permission('material:delete'),
  idParamValidator,
  validate,
  materialController.deleteSupplier
);

// Production Materials Routes
router.get('/production-materials',
  permission('material:read'),
  dataPermission,
  materialListQueryValidator,
  validate,
  materialController.getProductionMaterials
);

router.get('/production-materials/:id',
  permission('material:read'),
  idParamValidator,
  validate,
  materialController.getProductionMaterialById
);

router.post('/production-materials',
  permission('material:create'),
  createProductionMaterialValidator,
  validate,
  materialController.createProductionMaterial
);

router.put('/production-materials/:id',
  permission('material:update'),
  updateProductionMaterialValidator,
  validate,
  materialController.updateProductionMaterial
);

router.delete('/production-materials/:id',
  permission('material:delete'),
  idParamValidator,
  validate,
  materialController.deleteProductionMaterial
);

// Inventory Routes
router.get('/inventory',
  permission('inventory:read'),
  dataPermission,
  inventoryQueryValidator,
  validate,
  inventoryController.getInventory
);

router.get('/inventory/statistics',
  permission('inventory:read'),
  dataPermission,
  inventoryController.getInventoryStatistics
);

router.get('/inventory/:material_id/:base_id',
  permission('inventory:read'),
  inventoryController.getInventoryByMaterialAndBase
);

// Inventory Transactions Routes
router.get('/inventory/transactions',
  permission('inventory:read'),
  dataPermission,
  transactionQueryValidator,
  validate,
  inventoryController.getInventoryTransactions
);

router.post('/inventory/transactions',
  permission('inventory:create'),
  createInventoryTransactionValidator,
  validate,
  inventoryController.createInventoryTransaction
);

// Inventory Alerts Routes
router.get('/inventory/alerts',
  permission('inventory:read'),
  dataPermission,
  inventoryController.getInventoryAlerts
);

router.put('/inventory/alerts/:id/resolve',
  permission('inventory:update'),
  idParamValidator,
  validate,
  inventoryController.resolveInventoryAlert
);

export default router;