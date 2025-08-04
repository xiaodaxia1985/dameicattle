import { FeedFormula } from './FeedFormula';
import { FeedingRecord } from './FeedingRecord';
import { User } from './User';

// Define associations
FeedFormula.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
User.hasMany(FeedFormula, { as: 'created_formulas', foreignKey: 'created_by' });

FeedingRecord.belongsTo(FeedFormula, { as: 'formula', foreignKey: 'formula_id' });
FeedFormula.hasMany(FeedingRecord, { as: 'feeding_records', foreignKey: 'formula_id' });

FeedingRecord.belongsTo(User, { as: 'operator', foreignKey: 'operator_id' });
User.hasMany(FeedingRecord, { as: 'feeding_records', foreignKey: 'operator_id' });

export { FeedFormula, FeedingRecord, User };