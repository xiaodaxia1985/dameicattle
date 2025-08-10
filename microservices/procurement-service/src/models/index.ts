import { ProcurementOrder } from './ProcurementOrder';
import { Supplier } from './Supplier';
import { User } from './User';

// Define associations
ProcurementOrder.belongsTo(Supplier, { as: 'supplier', foreignKey: 'supplier_id' });
Supplier.hasMany(ProcurementOrder, { as: 'orders', foreignKey: 'supplier_id' });

ProcurementOrder.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
User.hasMany(ProcurementOrder, { as: 'created_orders', foreignKey: 'created_by' });

export { ProcurementOrder, Supplier, User };