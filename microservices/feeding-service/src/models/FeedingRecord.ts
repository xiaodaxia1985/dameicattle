import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '../config/database';

export interface FeedingRecordAttributes {
  id: number;
  formula_id?: number;
  base_id: number;
  barn_id?: number;
  amount: number;
  feeding_date: Date;
  operator_id?: number;
  created_at?: Date;
}

export interface FeedingRecordCreationAttributes extends Optional<FeedingRecordAttributes, 'id' | 'created_at'> {}

export class FeedingRecord extends Model<FeedingRecordAttributes, FeedingRecordCreationAttributes> implements FeedingRecordAttributes {
  public id!: number;
  public formula_id?: number;
  public base_id!: number;
  public barn_id?: number;
  public amount!: number;
  public feeding_date!: Date;
  public operator_id?: number;
  public readonly created_at!: Date;

  // Calculate feeding cost based on formula and amount
  public async calculateFeedingCost(): Promise<number> {
    if (!this.formula_id) return 0;
    
    const { FeedFormula } = await import('./FeedFormula');
    const formula = await FeedFormula.findByPk(this.formula_id);
    
    if (!formula || !formula.cost_per_kg) return 0;
    
    return this.amount * formula.cost_per_kg;
  }

  // Get feeding efficiency metrics
  public static async getFeedingEfficiency(baseId: number, startDate: Date, endDate: Date) {
    try {
      const records = await FeedingRecord.findAll({
        where: {
          base_id: baseId,
          feeding_date: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      const totalAmount = records.reduce((sum, record) => sum + (record.amount || 0), 0);
      
      // 简单的成本估算
      const estimatedCostPerKg = 5.0;
      const totalCost = totalAmount * estimatedCostPerKg;

      return {
        totalAmount,
        totalCost,
        averageCostPerKg: estimatedCostPerKg,
        recordCount: records.length
      };
    } catch (error) {
      return {
        totalAmount: 0,
        totalCost: 0,
        averageCostPerKg: 0,
        recordCount: 0
      };
    }
  }
}

FeedingRecord.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    formula_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'feed_formulas',
        key: 'id',
      },
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bases',
        key: 'id',
      },
    },
    barn_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'barns',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    feeding_date: {
      type: DataTypes.DATEONLY,
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
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'feeding_records',
    timestamps: false,
    underscored: true,
  }
);