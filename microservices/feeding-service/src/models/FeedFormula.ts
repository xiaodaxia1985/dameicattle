import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface FeedFormulaAttributes {
  id: number;
  name: string;
  description?: string;
  ingredients: object;
  cost_per_kg?: number;
  ingredients_version: number;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

interface FeedFormulaCreationAttributes extends Optional<FeedFormulaAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class FeedFormula extends Model<FeedFormulaAttributes, FeedFormulaCreationAttributes> implements FeedFormulaAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public ingredients!: object;
  public cost_per_kg?: number;
  public ingredients_version!: number;
  public created_by?: number;
  public created_at!: Date;
  public updated_at!: Date;
}

FeedFormula.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ingredients: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    cost_per_kg: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    ingredients_version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
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
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'feed_formulas',
    timestamps: true,
    underscored: true,
  }
);