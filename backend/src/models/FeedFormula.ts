import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

// Define ingredient interface
export interface IngredientItem {
  name: string;
  weight: number;    // 重量 (kg)
  cost: number;      // 成本 (元/kg)
  energy: number;    // 能量 (MJ/kg)
  ratio: number;     // 所占比重 (%)
}

// Define the attributes interface
export interface FeedFormulaAttributes {
  id: number;
  name: string;
  description?: string;
  ingredients: IngredientItem[]; // 成分列表
  cost_per_kg?: number;
  ingredients_version?: number;
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
  public ingredients!: IngredientItem[];
  public cost_per_kg?: number;
  public ingredients_version?: number;
  public created_by?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Calculate total cost based on ingredients
  public calculateCost(): number {
    if (!this.ingredients || !Array.isArray(this.ingredients)) return 0;
    
    let totalCost = 0;
    for (const ingredient of this.ingredients) {
      if (ingredient && typeof ingredient === 'object') {
        const ratio = parseFloat(ingredient.ratio?.toString() || '0') / 100; // Convert percentage to decimal
        const cost = parseFloat(ingredient.cost?.toString() || '0');
        totalCost += ratio * cost;
      }
    }
    return Math.round(totalCost * 100) / 100; // Round to 2 decimal places
  }

  // Calculate total energy based on ingredients
  public calculateTotalEnergy(): number {
    if (!this.ingredients || !Array.isArray(this.ingredients)) return 0;
    
    let totalEnergy = 0;
    for (const ingredient of this.ingredients) {
      if (ingredient && typeof ingredient === 'object') {
        const ratio = parseFloat(ingredient.ratio?.toString() || '0') / 100; // Convert percentage to decimal
        const energy = parseFloat(ingredient.energy?.toString() || '0');
        totalEnergy += ratio * energy;
      }
    }
    return Math.round(totalEnergy * 100) / 100; // Round to 2 decimal places
  }

  // Get ingredient list with details (for backward compatibility)
  public getIngredientsList(): IngredientItem[] {
    if (!this.ingredients || !Array.isArray(this.ingredients)) return [];
    
    return this.ingredients.map(ingredient => ({
      name: ingredient.name || '',
      weight: parseFloat(ingredient.weight?.toString() || '0'),
      cost: parseFloat(ingredient.cost?.toString() || '0'),
      energy: parseFloat(ingredient.energy?.toString() || '0'),
      ratio: parseFloat(ingredient.ratio?.toString() || '0')
    }));
  }

  // Get formatted ingredients for display
  public getFormattedIngredients(): Array<{
    name: string;
    weight: string;
    cost: string;
    energy: string;
    ratio: string;
  }> {
    const ingredients = this.getIngredientsList();
    return ingredients.map(ingredient => ({
      name: ingredient.name,
      weight: `${ingredient.weight} kg`,
      cost: `¥${ingredient.cost.toFixed(2)}/kg`,
      energy: `${ingredient.energy} MJ/kg`,
      ratio: `${ingredient.ratio.toFixed(1)}%`
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
          if (!value || !Array.isArray(value)) {
            throw new Error('配方成分必须是有效的数组');
          }
          
          if (value.length === 0) {
            throw new Error('至少需要一种配方成分');
          }
          
          let totalRatio = 0;
          for (let i = 0; i < value.length; i++) {
            const ingredient = value[i];
            if (!ingredient || typeof ingredient !== 'object') {
              throw new Error(`第${i + 1}个配方成分格式不正确`);
            }
            
            // 检查必要字段
            const requiredFields = ['name', 'weight', 'cost', 'energy', 'ratio'];
            for (const field of requiredFields) {
              if (!(field in ingredient)) {
                throw new Error(`第${i + 1}个配方成分缺少必要字段: ${field}`);
              }
            }
            
            // 验证名称
            if (!ingredient.name || typeof ingredient.name !== 'string' || ingredient.name.trim() === '') {
              throw new Error(`第${i + 1}个配方成分的名称不能为空`);
            }
            
            // 验证重量
            const weight = parseFloat(ingredient.weight);
            if (isNaN(weight) || weight <= 0) {
              throw new Error(`第${i + 1}个配方成分的重量必须大于0`);
            }
            
            // 验证成本
            const cost = parseFloat(ingredient.cost);
            if (isNaN(cost) || cost < 0) {
              throw new Error(`第${i + 1}个配方成分的成本必须大于等于0`);
            }
            
            // 验证能量
            const energy = parseFloat(ingredient.energy);
            if (isNaN(energy) || energy < 0) {
              throw new Error(`第${i + 1}个配方成分的能量必须大于等于0`);
            }
            
            // 验证比重
            const ratio = parseFloat(ingredient.ratio);
            if (isNaN(ratio) || ratio <= 0 || ratio > 100) {
              throw new Error(`第${i + 1}个配方成分的比重必须在0-100之间`);
            }
            
            totalRatio += ratio;
          }
          
          // 验证比重总和
          if (Math.abs(totalRatio - 100) > 0.01) {
            throw new Error(`配方成分比重总和必须等于100%，当前为 ${totalRatio.toFixed(2)}%`);
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
    ingredients_version: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 2,
      comment: 'Ingredients structure version: 1=old format, 2=new format with name/weight/cost/energy/ratio',
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