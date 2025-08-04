import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface BaseAttributes {
  id: number;
  name: string;
  code: string;
  address?: string;
  created_at: Date;
  updated_at: Date;
}

interface BaseCreationAttributes extends Optional<BaseAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Base extends Model<BaseAttributes, BaseCreationAttributes> implements BaseAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public address?: string;
  public created_at!: Date;
  public updated_at!: Date;
}

Base.init(
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
    address: {
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
    tableName: 'bases',
    timestamps: true,
    underscored: true,
  }
);