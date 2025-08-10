import { Material } from './Material';
import { MaterialInventory } from './MaterialInventory';
import { InventoryRecord } from './InventoryRecord';
import { User } from './User';

// Define associations
MaterialInventory.belongsTo(Material, { as: 'material', foreignKey: 'material_id' });
Material.hasMany(MaterialInventory, { as: 'inventory', foreignKey: 'material_id' });

InventoryRecord.belongsTo(Material, { as: 'material', foreignKey: 'material_id' });
Material.hasMany(InventoryRecord, { as: 'records', foreignKey: 'material_id' });

InventoryRecord.belongsTo(User, { as: 'operator', foreignKey: 'operator_id' });
User.hasMany(InventoryRecord, { as: 'operated_records', foreignKey: 'operator_id' });

export { Material, MaterialInventory, InventoryRecord, User };