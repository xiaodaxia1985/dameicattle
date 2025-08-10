import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CattleAttributes {
  id: number;
  ear_tag: string;
  breed?: string;
  gender: 'male' | 'female';
  base_id: number;
  status: 'active' | 'sold' | 'dead' | 'transferred';
  created_at: Date;
  updated_at: Date;
}

interface CattleCreationAttributes extends Optional<CattleAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Cattle extends Model<CattleAttributes, CattleCreationAttributes> implements CattleAttributes {
  public id!: number;
  public ear_tag!: string;
  public breed?: string;
  public gender!: 'male' | 'female';
  public base_id!: number;
  public status!: 'active' | 'sold' | 'dead' | 'transferred';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Cattle.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ear_tag: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    breed: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: false,
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'sold', 'dead', 'transferred'),
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
    tableName: 'cattle',
    timestamps: true,
    underscored: true,
  }
);