import { Base } from './Base';
import { Barn } from './Barn';
import { User } from './User';

// Define associations
Base.belongsTo(User, { as: 'manager', foreignKey: 'manager_id' });
User.hasOne(Base, { as: 'managedBase', foreignKey: 'manager_id' });

Base.hasMany(Barn, { as: 'barns', foreignKey: 'base_id' });
Barn.belongsTo(Base, { as: 'base', foreignKey: 'base_id' });

User.belongsTo(Base, { as: 'base', foreignKey: 'base_id' });
Base.hasMany(User, { as: 'users', foreignKey: 'base_id' });

export { Base, Barn, User };