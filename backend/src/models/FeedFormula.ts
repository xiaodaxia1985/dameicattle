import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

// Define the attributes interface
export interface FeedFormulaAttributes {
  id: number;
  name: string;
  description?: string;
  ingredients: Record<string, any>; // JSONB field for ingredients
  cost_per_kg?: number;
  created_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

// Define creation attributes (optional fields for creation)
export interface FeedFormulaCreationAttributes extends Optional<FeedFormulaAttributes, 'id' | 'created_at' | 'updated_at'> {}

// Define the model class
export class FeedFormula extends Model<FeedFormulaAttributes, FeedFormulaCreationAttributes> implements FeedFormulaAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public ingredients!: Record<string, any>;
  public cost_per_kg?: number;
  public created_by?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Calculate total cost based on ingredients
  public calculateCost(): number {
    if (!this.ingredients) return 0;
    
    let totalCost = 0;
    for (const [ingredient, details] of Object.entries(this.ingredients)) {
      if (details && typeof details === 'object' && 'ratio' in details && 'cost' in details) {
        const ratio = parseFloat(details.ratio) / 100; // Convert percentage to decimal
        const cost = parseFloat(details.cost);
        totalCost += ratio * cost;
      }
    }
    return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
  }

  // Get ingredient list with details
  public getIngredientsList(): Array<{name: string, ratio: number, unit: string, cost: number}> {
    if (!this.ingredients) return [];
    
    return Object.entries(this.ingredients).map(([name, details]) => ({
      name,
      ratio: details.ratio || 0,
      unit: details.unit || '%',
      cost: details.cost || 0
    }));
  }
}

// Initialize the model
FeedFormula.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ingredients: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        notEmpty: true,
        isValidIngredients(value: any) {
          if (!value || typeof value !== 'object') {
            throw new Error('配方成分必须是有效的对象');
          }
          
          let totalRatio = 0;
          for (const [ingredient, details] of Object.entries(value)) {
            if (!details || typeof details !== 'object') {
              throw new Error(`配方成分 ${ingredient} 的详情格式不正确`);
            }
            
            if (!('ratio' in details) || !('unit' in details) || !('cost' in details)) {
              throw new Error(`配方成分 ${ingredient} 缺少必要字段 (ratio, unit, cost)`);
            }
            
            const ratio = parseFloat(details.ratio);
            if (isNaN(ratio) || ratio <= 0 || ratio > 100) {
              throw new Error(`配方成分 ${ingredient} 的比例必须在 0-100 之间`);
            }
            
            totalRatio += ratio;
          }
          
          if (Math.abs(totalRatio - 100) > 0.01) {
            throw new Error(`配方成分比例总和必须等于100%，当前为 ${totalRatio}%`);
          }
        },
      },
    },
    cost_per_kg: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    created_by: {
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
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'feed_formulas',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeSave: (formula: FeedFormula) => {
        // Auto-calculate cost if not provided
        if (!formula.cost_per_kg && formula.ingredients) {
          formula.cost_per_kg = formula.calculateCost();
        }
      },
    },
  }
);