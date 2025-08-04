import { Cattle } from './Cattle';
import { CattleEvent } from './CattleEvent';
import { Base } from './Base';
import { Barn } from './Barn';
import { User } from './User';

// Define associations
Cattle.belongsTo(Base, { as: 'base', foreignKey: 'base_id' });
Base.hasMany(Cattle, { as: 'cattle', foreignKey: 'base_id' });

Cattle.belongsTo(Barn, { as: 'barn', foreignKey: 'barn_id' });
Barn.hasMany(Cattle, { as: 'cattle', foreignKey: 'barn_id' });

Cattle.belongsTo(Cattle, { as: 'father', foreignKey: 'parent_male_id' });
Cattle.belongsTo(Cattle, { as: 'mother', foreignKey: 'parent_female_id' });
Cattle.hasMany(Cattle, { as: 'offspring_as_father', foreignKey: 'parent_male_id' });
Cattle.hasMany(Cattle, { as: 'offspring_as_mother', foreignKey: 'parent_female_id' });

CattleEvent.belongsTo(Cattle, { as: 'cattle', foreignKey: 'cattle_id' });
Cattle.hasMany(CattleEvent, { as: 'events', foreignKey: 'cattle_id' });

CattleEvent.belongsTo(User, { as: 'operator', foreignKey: 'operator_id' });
User.hasMany(CattleEvent, { as: 'operated_events', foreignKey: 'operator_id' });

Barn.belongsTo(Base, { as: 'base', foreignKey: 'base_id' });
Base.hasMany(Barn, { as: 'barns', foreignKey: 'base_id' });

User.belongsTo(Base, { as: 'base', foreignKey: 'base_id' });
Base.hasMany(User, { as: 'users', foreignKey: 'base_id' });

export { Cattle, CattleEvent, Base, Barn, User };