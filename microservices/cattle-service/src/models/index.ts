import { Cattle } from './Cattle';
import { Barn } from './Barn';
import { Base } from './Base';
import { User } from './User';
import { WeightRecord } from './WeightRecord';
import { CattleEvent } from './CattleEvent';

// 导出模型
export { Cattle, Barn, Base, User, WeightRecord, CattleEvent };

// 初始化关联关系
const models: any = {
  Cattle,
  Barn,
  Base,
  User,
  WeightRecord,
  CattleEvent
};

// 调用关联关系配置
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});