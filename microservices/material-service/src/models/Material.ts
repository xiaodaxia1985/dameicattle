import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface MaterialAttributes {
  id: number;
  name: string;
  code: string;
  category: string;
  specification?: string;
  unit: string;
  unit_price?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  description?: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

interface MaterialCreationAttributes extends Optional<MaterialAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Material extends Model<MaterialAttributes, MaterialCreationAttributes> implements MaterialAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public category!: string;
  public specification?: string;
  public unit!: string;
  public unit_price?: number;
  public min_stock_level?: number;
  public max_stock_level?: number;
  public description?: string;
  public status!: 'active' | 'inactive';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Material.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    specification: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    min_stock_level: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    max_stock_level: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
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
    tableName: 'materials',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['code'],
        unique: true,
      },
      {
        fields: ['category'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);