import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

// Define the attributes interface
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

// Define creation attributes (optional fields for creation)
export interface FeedingRecordCreationAttributes extends Optional<FeedingRecordAttributes, 'id' | 'created_at'> {}

// Define the model class
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
    const records = await FeedingRecord.findAll({
      where: {
        base_id: baseId,
        feeding_date: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          association: 'formula',
          attributes: ['name', 'cost_per_kg']
        },
        {
          association: 'base',
          attributes: ['name']
        },
        {
          association: 'barn',
          attributes: ['name', 'current_count']
        }
      ]
    });

    const totalAmount = records.reduce((sum, record) => sum + record.amount, 0);
    const totalCost = await Promise.all(
      records.map(record => record.calculateFeedingCost())
    ).then(costs => costs.reduce((sum, cost) => sum + cost, 0));

    return {
      totalAmount,
      totalCost,
      averageCostPerKg: totalAmount > 0 ? totalCost / totalAmount : 0,
      recordCount: records.length
    };
  }
}

// Initialize the model
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
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        max: 99999.99,
      },
    },
    feeding_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        notEmpty: true,
      },
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
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'feeding_records',
    timestamps: false, // Only created_at, no updated_at
    underscored: true,
    indexes: [
      {
        fields: ['base_id']
      },
      {
        fields: ['barn_id']
      },
      {
        fields: ['feeding_date']
      },
      {
        fields: ['formula_id', 'feeding_date']
      }
    ]
  }
);