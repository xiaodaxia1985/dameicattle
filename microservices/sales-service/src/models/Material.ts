import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface MaterialAttributes {
  id: number;
  name: string;
  category: string;
  unit: string;
  specification?: string;
  description?: string;
  baseId: number;
  baseName: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

interface MaterialCreationAttributes extends Optional<MaterialAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Material extends Model<MaterialAttributes, MaterialCreationAttributes> implements MaterialAttributes {
  public id!: number;
  public name!: string;
  public category!: string;
  public unit!: string;
  public specification?: string;
  public description?: string;
  public baseId!: number;
  public baseName!: string;
  public status!: 'active' | 'inactive';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Material.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    specification: {
      type: DataTypes.TEXT,
    },
    description: {
      type: DataTypes.TEXT,
    },
    baseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'baseId'
    },
    baseName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'baseName'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'createdAt'
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updatedAt'
    }
  },
  {
    sequelize,
    tableName: 'materials',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
);