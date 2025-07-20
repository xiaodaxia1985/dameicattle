import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface NewsCategoryAttributes {
  id: number;
  name: string;
  code: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface NewsCategoryCreationAttributes extends Optional<NewsCategoryAttributes, 'id' | 'description' | 'sortOrder' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class NewsCategory extends Model<NewsCategoryAttributes, NewsCategoryCreationAttributes> implements NewsCategoryAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public description?: string;
  public sortOrder!: number;
  public isActive!: boolean;
  public createdAt!: Date;
  public updatedAt!: Date;
}

NewsCategory.init(
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
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'news_categories',
    timestamps: true,
    underscored: true,
  }
);

export { NewsCategory, NewsCategoryAttributes, NewsCategoryCreationAttributes };