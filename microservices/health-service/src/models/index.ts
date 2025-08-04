import { HealthRecord } from './HealthRecord';
import { VaccinationRecord } from './VaccinationRecord';
import { Cattle } from './Cattle';
import { User } from './User';

// Define associations
HealthRecord.belongsTo(Cattle, { as: 'cattle', foreignKey: 'cattle_id' });
Cattle.hasMany(HealthRecord, { as: 'health_records', foreignKey: 'cattle_id' });

HealthRecord.belongsTo(User, { as: 'veterinarian', foreignKey: 'veterinarian_id' });
User.hasMany(HealthRecord, { as: 'health_records', foreignKey: 'veterinarian_id' });

VaccinationRecord.belongsTo(Cattle, { as: 'cattle', foreignKey: 'cattle_id' });
Cattle.hasMany(VaccinationRecord, { as: 'vaccination_records', foreignKey: 'cattle_id' });

VaccinationRecord.belongsTo(User, { as: 'veterinarian', foreignKey: 'veterinarian_id' });
User.hasMany(VaccinationRecord, { as: 'vaccination_records', foreignKey: 'veterinarian_id' });

export { HealthRecord, VaccinationRecord, Cattle, User };