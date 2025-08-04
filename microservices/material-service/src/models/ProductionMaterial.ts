import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProductionMaterialAttributes {
  id: number;
  name: string;
  code: string;
  category_id?: number;
  unit: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

interface ProductionMaterialCreationAttributes extends Optional<ProductionMaterialAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class ProductionMaterial extends Model<ProductionMaterialAttributes, ProductionMaterialCreationAttributes> implements ProductionMaterialAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public category_id?: number;
  public unit!: string;
  public description?: string;
  public status!: 'active' | 'inactive';
  public created_at!: Date;
  public updated_at!: Date;
}

ProductionMaterial.init(
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
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'material_categories',
        key: 'id',
      },
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
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
    tableName: 'production_materials',
    timestamps: true,
    underscored: true,
  }
);