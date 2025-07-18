import { sequelize } from '@/config/database';
import { User } from './User';
import { Role } from './Role';
import { SecurityLog } from './SecurityLog';

// Define associations
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

SecurityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(SecurityLog, { foreignKey: 'user_id', as: 'security_logs' });

// Export models
export {
  sequelize,
  User,
  Role,
  SecurityLog,
};

// Export database instance
export default sequelize;