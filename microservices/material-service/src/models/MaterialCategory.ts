import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface MaterialCategoryAttributes {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}

interface MaterialCategoryCreationAttributes extends Optional<MaterialCategoryAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class MaterialCategory extends Model<MaterialCategoryAttributes, MaterialCategoryCreationAttributes> implements MaterialCategoryAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public created_at!: Date;
  public updated_at!: Date;
}

MaterialCategory.init(
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
    tableName: 'material_categories',
    timestamps: true,
    underscored: true,
  }
);