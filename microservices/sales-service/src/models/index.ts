import { SalesOrder } from './SalesOrder';
import { SalesOrderItem } from './SalesOrderItem';
import { Customer } from './Customer';
import { User } from './User';
import { Cattle } from './Cattle';
import { Material } from './Material';
import { Equipment } from './Equipment';

// Define associations
SalesOrder.belongsTo(Customer, { as: 'customer', foreignKey: 'customerId' });
Customer.hasMany(SalesOrder, { as: 'orders', foreignKey: 'customerId' });

SalesOrder.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });
User.hasMany(SalesOrder, { as: 'created_orders', foreignKey: 'createdBy' });

// 订单与订单明细的关联
SalesOrder.hasMany(SalesOrderItem, { as: 'items', foreignKey: 'orderId' });
SalesOrderItem.belongsTo(SalesOrder, { as: 'order', foreignKey: 'orderId' });

// 订单明细与牛只的关联
SalesOrderItem.belongsTo(Cattle, { as: 'cattle', foreignKey: 'cattleId' });
Cattle.hasMany(SalesOrderItem, { as: 'salesItems', foreignKey: 'cattleId' });

export { SalesOrder, SalesOrderItem, Customer, User, Cattle, Material, Equipment };