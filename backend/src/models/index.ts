import { sequelize } from '@/config/database';
import { User } from './User';
import { Role } from './Role';
import { SecurityLog } from './SecurityLog';
import { Base } from './Base';
import { Barn } from './Barn';
import { Cattle } from './Cattle';
import { CattleEvent } from './CattleEvent';
import { HealthRecord } from './HealthRecord';
import { VaccinationRecord } from './VaccinationRecord';
import { FeedFormula } from './FeedFormula';
import { FeedingRecord } from './FeedingRecord';
import { MaterialCategory } from './MaterialCategory';
import { Supplier } from './Supplier';
import { ProductionMaterial } from './ProductionMaterial';
import { Inventory } from './Inventory';
import { InventoryTransaction } from './InventoryTransaction';
import { InventoryAlert } from './InventoryAlert';
import EquipmentCategory from './EquipmentCategory';
import ProductionEquipment from './ProductionEquipment';
import EquipmentMaintenancePlan from './EquipmentMaintenancePlan';
import EquipmentMaintenanceRecord from './EquipmentMaintenanceRecord';
import EquipmentFailure from './EquipmentFailure';
import { PurchaseOrder } from './PurchaseOrder';
import { PurchaseOrderItem } from './PurchaseOrderItem';

// Define associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

User.belongsTo(Base, { foreignKey: 'base_id', as: 'base' });
Base.hasMany(User, { foreignKey: 'base_id', as: 'users' });

Base.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });
User.hasOne(Base, { foreignKey: 'manager_id', as: 'managed_base' });

// Barn associations
Base.hasMany(Barn, { foreignKey: 'base_id', as: 'barns' });
Barn.belongsTo(Base, { foreignKey: 'base_id', as: 'base' });

// Cattle associations
Base.hasMany(Cattle, { foreignKey: 'base_id', as: 'cattle' });
Cattle.belongsTo(Base, { foreignKey: 'base_id', as: 'base' });

Barn.hasMany(Cattle, { foreignKey: 'barn_id', as: 'cattle' });
Cattle.belongsTo(Barn, { foreignKey: 'barn_id', as: 'barn' });

// Cattle parent relationships
Cattle.belongsTo(Cattle, { foreignKey: 'parent_male_id', as: 'father' });
Cattle.belongsTo(Cattle, { foreignKey: 'parent_female_id', as: 'mother' });
Cattle.hasMany(Cattle, { foreignKey: 'parent_male_id', as: 'offspring_as_father' });
Cattle.hasMany(Cattle, { foreignKey: 'parent_female_id', as: 'offspring_as_mother' });

// Cattle events associations
Cattle.hasMany(CattleEvent, { foreignKey: 'cattle_id', as: 'events' });
CattleEvent.belongsTo(Cattle, { foreignKey: 'cattle_id', as: 'cattle' });

User.hasMany(CattleEvent, { foreignKey: 'operator_id', as: 'cattle_events' });
CattleEvent.belongsTo(User, { foreignKey: 'operator_id', as: 'operator' });

SecurityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(SecurityLog, { foreignKey: 'user_id', as: 'security_logs' });

// Health record associations
Cattle.hasMany(HealthRecord, { foreignKey: 'cattle_id', as: 'health_records' });
HealthRecord.belongsTo(Cattle, { foreignKey: 'cattle_id', as: 'cattle' });

User.hasMany(HealthRecord, { foreignKey: 'veterinarian_id', as: 'health_records' });
HealthRecord.belongsTo(User, { foreignKey: 'veterinarian_id', as: 'veterinarian' });

// Vaccination record associations
Cattle.hasMany(VaccinationRecord, { foreignKey: 'cattle_id', as: 'vaccination_records' });
VaccinationRecord.belongsTo(Cattle, { foreignKey: 'cattle_id', as: 'cattle' });

User.hasMany(VaccinationRecord, { foreignKey: 'veterinarian_id', as: 'vaccination_records' });
VaccinationRecord.belongsTo(User, { foreignKey: 'veterinarian_id', as: 'veterinarian' });

// Feed formula associations
User.hasMany(FeedFormula, { foreignKey: 'created_by', as: 'feed_formulas' });
FeedFormula.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// Feeding record associations
FeedFormula.hasMany(FeedingRecord, { foreignKey: 'formula_id', as: 'feeding_records' });
FeedingRecord.belongsTo(FeedFormula, { foreignKey: 'formula_id', as: 'formula' });

Base.hasMany(FeedingRecord, { foreignKey: 'base_id', as: 'feeding_records' });
FeedingRecord.belongsTo(Base, { foreignKey: 'base_id', as: 'base' });

Barn.hasMany(FeedingRecord, { foreignKey: 'barn_id', as: 'feeding_records' });
FeedingRecord.belongsTo(Barn, { foreignKey: 'barn_id', as: 'barn' });

User.hasMany(FeedingRecord, { foreignKey: 'operator_id', as: 'feeding_records' });
FeedingRecord.belongsTo(User, { foreignKey: 'operator_id', as: 'operator' });

// Material category associations (self-referencing)
MaterialCategory.belongsTo(MaterialCategory, { foreignKey: 'parent_id', as: 'parent' });
MaterialCategory.hasMany(MaterialCategory, { foreignKey: 'parent_id', as: 'children' });

// Production material associations
MaterialCategory.hasMany(ProductionMaterial, { foreignKey: 'category_id', as: 'materials' });
ProductionMaterial.belongsTo(MaterialCategory, { foreignKey: 'category_id', as: 'category' });

Supplier.hasMany(ProductionMaterial, { foreignKey: 'supplier_id', as: 'materials' });
ProductionMaterial.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

// Inventory associations
ProductionMaterial.hasMany(Inventory, { foreignKey: 'material_id', as: 'inventory' });
Inventory.belongsTo(ProductionMaterial, { foreignKey: 'material_id', as: 'material' });

Base.hasMany(Inventory, { foreignKey: 'base_id', as: 'inventory' });
Inventory.belongsTo(Base, { foreignKey: 'base_id', as: 'base' });

// Inventory transaction associations
ProductionMaterial.hasMany(InventoryTransaction, { foreignKey: 'material_id', as: 'transactions' });
InventoryTransaction.belongsTo(ProductionMaterial, { foreignKey: 'material_id', as: 'material' });

Base.hasMany(InventoryTransaction, { foreignKey: 'base_id', as: 'inventory_transactions' });
InventoryTransaction.belongsTo(Base, { foreignKey: 'base_id', as: 'base' });

User.hasMany(InventoryTransaction, { foreignKey: 'operator_id', as: 'inventory_transactions' });
InventoryTransaction.belongsTo(User, { foreignKey: 'operator_id', as: 'operator' });

// Inventory alert associations
ProductionMaterial.hasMany(InventoryAlert, { foreignKey: 'material_id', as: 'alerts' });
InventoryAlert.belongsTo(ProductionMaterial, { foreignKey: 'material_id', as: 'material' });

Base.hasMany(InventoryAlert, { foreignKey: 'base_id', as: 'inventory_alerts' });
InventoryAlert.belongsTo(Base, { foreignKey: 'base_id', as: 'base' });

// Equipment associations
EquipmentCategory.hasMany(ProductionEquipment, { foreignKey: 'category_id', as: 'equipment' });
ProductionEquipment.belongsTo(EquipmentCategory, { foreignKey: 'category_id', as: 'category' });

Base.hasMany(ProductionEquipment, { foreignKey: 'base_id', as: 'equipment' });
ProductionEquipment.belongsTo(Base, { foreignKey: 'base_id', as: 'base' });

Barn.hasMany(ProductionEquipment, { foreignKey: 'barn_id', as: 'equipment' });
ProductionEquipment.belongsTo(Barn, { foreignKey: 'barn_id', as: 'barn' });

// Equipment maintenance plan associations
ProductionEquipment.hasMany(EquipmentMaintenancePlan, { foreignKey: 'equipment_id', as: 'maintenance_plans' });
EquipmentMaintenancePlan.belongsTo(ProductionEquipment, { foreignKey: 'equipment_id', as: 'equipment' });

// Equipment maintenance record associations
ProductionEquipment.hasMany(EquipmentMaintenanceRecord, { foreignKey: 'equipment_id', as: 'maintenance_records' });
EquipmentMaintenanceRecord.belongsTo(ProductionEquipment, { foreignKey: 'equipment_id', as: 'equipment' });

EquipmentMaintenancePlan.hasMany(EquipmentMaintenanceRecord, { foreignKey: 'plan_id', as: 'records' });
EquipmentMaintenanceRecord.belongsTo(EquipmentMaintenancePlan, { foreignKey: 'plan_id', as: 'plan' });

User.hasMany(EquipmentMaintenanceRecord, { foreignKey: 'operator_id', as: 'maintenance_records' });
EquipmentMaintenanceRecord.belongsTo(User, { foreignKey: 'operator_id', as: 'operator' });

// Equipment failure associations
ProductionEquipment.hasMany(EquipmentFailure, { foreignKey: 'equipment_id', as: 'failures' });
EquipmentFailure.belongsTo(ProductionEquipment, { foreignKey: 'equipment_id', as: 'equipment' });

User.hasMany(EquipmentFailure, { foreignKey: 'reported_by', as: 'reported_failures' });
EquipmentFailure.belongsTo(User, { foreignKey: 'reported_by', as: 'reporter' });

User.hasMany(EquipmentFailure, { foreignKey: 'repaired_by', as: 'repaired_failures' });
EquipmentFailure.belongsTo(User, { foreignKey: 'repaired_by', as: 'repairer' });

// Purchase order associations
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id', as: 'purchase_orders' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });

Base.hasMany(PurchaseOrder, { foreignKey: 'base_id', as: 'purchase_orders' });
PurchaseOrder.belongsTo(Base, { foreignKey: 'base_id', as: 'base' });

User.hasMany(PurchaseOrder, { foreignKey: 'created_by', as: 'created_purchase_orders' });
PurchaseOrder.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

User.hasMany(PurchaseOrder, { foreignKey: 'approved_by', as: 'approved_purchase_orders' });
PurchaseOrder.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// Purchase order item associations
PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'order_id', as: 'items' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'order_id', as: 'order' });

// Export models
export {
  sequelize,
  User,
  Role,
  SecurityLog,
  Base,
  Barn,
  Cattle,
  CattleEvent,
  HealthRecord,
  VaccinationRecord,
  FeedFormula,
  FeedingRecord,
  MaterialCategory,
  Supplier,
  ProductionMaterial,
  Inventory,
  InventoryTransaction,
  InventoryAlert,
  EquipmentCategory,
  ProductionEquipment,
  EquipmentMaintenancePlan,
  EquipmentMaintenanceRecord,
  EquipmentFailure,
  PurchaseOrder,
  PurchaseOrderItem,
};

// Export database instance
export default sequelize;