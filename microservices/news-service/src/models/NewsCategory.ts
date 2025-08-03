import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface NewsCategoryAttributes {
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

export class NewsCategory extends Model<NewsCategoryAttributes, NewsCategoryCreationAttributes> implements NewsCategoryAttributes {
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
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'news_categories',
    timestamps: true,
  }
);