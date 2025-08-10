import { SalesOrder } from './SalesOrder';
import { Customer } from './Customer';
import { User } from './User';
import { Cattle } from './Cattle';

// Define associations
SalesOrder.belongsTo(Customer, { as: 'customer', foreignKey: 'customer_id' });
Customer.hasMany(SalesOrder, { as: 'orders', foreignKey: 'customer_id' });

SalesOrder.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
User.hasMany(SalesOrder, { as: 'created_orders', foreignKey: 'created_by' });

export { SalesOrder, Customer, User, Cattle };