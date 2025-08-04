import { sequelize } from '../config/database';
import { User } from './User';
import { Role } from './Role';
import { SecurityLog } from './SecurityLog';

// 定义关联关系
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

SecurityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(SecurityLog, { foreignKey: 'user_id', as: 'security_logs' });

// 导出模型
export {
  sequelize,
  User,
  Role,
  SecurityLog,
};

// 导出数据库实例
export default sequelize;