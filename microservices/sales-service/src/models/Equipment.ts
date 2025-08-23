import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface EquipmentAttributes {
  id: number;
  name: string;
  category: string;
  model?: string;
  manufacturer?: string;
  specification?: string;
  description?: string;
  baseId: number;
  baseName: string;
  status: 'active' | 'inactive' | 'maintenance' | 'retired';
  createdAt: Date;
  updatedAt: Date;
}

interface EquipmentCreationAttributes extends Optional<EquipmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Equipment extends Model<EquipmentAttributes, EquipmentCreationAttributes> implements EquipmentAttributes {
  public id!: number;
  public name!: string;
  public category!: string;
  public model?: string;
  public manufacturer?: string;
  public specification?: string;
  public description?: string;
  public baseId!: number;
  public baseName!: string;
  public status!: 'active' | 'inactive' | 'maintenance' | 'retired';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Equipment.init(
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
    model: {
      type: DataTypes.STRING(100),
    },
    manufacturer: {
      type: DataTypes.STRING(255),
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
      type: DataTypes.ENUM('active', 'inactive', 'maintenance', 'retired'),
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
    tableName: 'equipment',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
);