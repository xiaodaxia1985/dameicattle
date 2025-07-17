import { sequelize } from '@/config/database';
import { User } from './User';
import { Role } from './Role';

// Define associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

// Export models
export {
  sequelize,
  User,
  Role,
};

// Export database instance
export default sequelize;