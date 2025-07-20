import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface MaterialCategoryAttributes {
  id: number;
  name: string;
  code: string;
  description?: string;
  parent_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface MaterialCategoryCreationAttributes extends Optional<MaterialCategoryAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class MaterialCategory extends Model<MaterialCategoryAttributes, MaterialCategoryCreationAttributes> implements MaterialCategoryAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public description?: string;
  public parent_id?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public parent?: MaterialCategory;
  public children?: MaterialCategory[];
  public materials?: any[];
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
      comment: '分类名称',
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '分类编码',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '分类描述',
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'material_categories',
        key: 'id',
      },
      comment: '父分类ID',
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
    comment: '物资分类表',
  }
);