import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Cattle } from './Cattle';
import { User } from './User';

export interface WeightRecordAttributes {
  id: number;
  cattle_id: number;
  weight: number;
  record_date: Date;
  operator_id?: number;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface WeightRecordCreationAttributes extends Optional<WeightRecordAttributes, 'id' | 'created_at' | 'updated_at' | 'operator_id' | 'notes'> {}

export class WeightRecord extends Model<WeightRecordAttributes, WeightRecordCreationAttributes> implements WeightRecordAttributes {
  public static associate?: (models: any) => void;
  public id!: number;
  public cattle_id!: number;
  public weight!: number;
  public record_date!: Date;
  public operator_id?: number;
  public notes?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // 计算两次称重之间的体重变化
  public static async getWeightChange(cattleId: number) {
    try {
      const records = await WeightRecord.findAll({
        where: { cattle_id: cattleId },
        order: [['record_date', 'ASC']],
        limit: 2
      });

      if (records.length < 2) {
        return {
          changed: false,
          changeAmount: 0,
          changePercentage: 0
        };
      }

      const [first, last] = records;
      const changeAmount = Number(last.weight) - Number(first.weight);
      const changePercentage = (changeAmount / Number(first.weight)) * 100;

      return {
        changed: true,
        changeAmount,
        changePercentage
      };
    } catch (error) {
      return {
        changed: false,
        changeAmount: 0,
        changePercentage: 0
      };
    }
  }

  // 获取牛只的平均日增重
  public static async getAverageDailyGain(cattleId: number) {
    try {
      const records = await WeightRecord.findAll({
        where: { cattle_id: cattleId },
        order: [['record_date', 'ASC']]
      });

      if (records.length < 2) {
        return 0;
      }

      const firstRecord = records[0];
      const lastRecord = records[records.length - 1];
      
      const weightGain = Number(lastRecord.weight) - Number(firstRecord.weight);
      const daysDiff = Math.ceil((lastRecord.record_date.getTime() - firstRecord.record_date.getTime()) / (1000 * 60 * 60 * 24));
      
      return daysDiff > 0 ? weightGain / daysDiff : 0;
    } catch (error) {
      return 0;
    }
  }
}

WeightRecord.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cattle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cattle',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    weight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      validate: {
        min: 0,
        max: 9999.99,
      },
    },
    record_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    operator_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'weight_records',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['cattle_id'],
      },
      {
        fields: ['record_date'],
      },
      {
        fields: ['operator_id'],
      },
    ],
  }
);

// 添加关联关系
WeightRecord.associate = function (models: any) {
  WeightRecord.belongsTo(models.Cattle, {
    foreignKey: 'cattle_id',
    as: 'cattle'
  });
  
  WeightRecord.belongsTo(models.User, {
    foreignKey: 'operator_id',
    as: 'operator'
  });
};