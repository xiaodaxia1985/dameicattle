import { FeedFormula } from './FeedFormula';
import { FeedingRecord } from './FeedingRecord';
import { PatrolRecord } from './PatrolRecord';
import { User } from './User';
import { Barn } from './Barn';

// Define associations
FeedFormula.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
User.hasMany(FeedFormula, { as: 'created_formulas', foreignKey: 'created_by' });

FeedingRecord.belongsTo(FeedFormula, { as: 'formula', foreignKey: 'formula_id' });
FeedFormula.hasMany(FeedingRecord, { as: 'feeding_records', foreignKey: 'formula_id' });

FeedingRecord.belongsTo(User, { as: 'operator', foreignKey: 'operator_id' });
User.hasMany(FeedingRecord, { as: 'feeding_records', foreignKey: 'operator_id' });

PatrolRecord.belongsTo(User, { as: 'patroller', foreignKey: 'patroller_id' });
User.hasMany(PatrolRecord, { as: 'patrol_records', foreignKey: 'patroller_id' });

PatrolRecord.belongsTo(Barn, { as: 'barn', foreignKey: 'barn_id' });
Barn.hasMany(PatrolRecord, { as: 'patrol_records', foreignKey: 'barn_id' });

FeedingRecord.belongsTo(Barn, { as: 'barn', foreignKey: 'barn_id' });
Barn.hasMany(FeedingRecord, { as: 'feeding_records', foreignKey: 'barn_id' });

export { FeedFormula, FeedingRecord, PatrolRecord, User, Barn };