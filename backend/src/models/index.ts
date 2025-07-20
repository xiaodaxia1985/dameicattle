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
};

// Export database instance
export default sequelize;