import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CattleAttributes {
  id: number;
  ear_tag: string;
  breed: string;
  gender: 'male' | 'female';
  health_status: 'healthy' | 'sick' | 'treatment';
  base_id: number;
  created_at: Date;
  updated_at: Date;
}

interface CattleCreationAttributes extends Optional<CattleAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Cattle extends Model<CattleAttributes, CattleCreationAttributes> implements CattleAttributes {
  public id!: number;
  public ear_tag!: string;
  public breed!: string;
  public gender!: 'male' | 'female';
  public health_status!: 'healthy' | 'sick' | 'treatment';
  public base_id!: number;
  public created_at!: Date;
  public updated_at!: Date;
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
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female'),
      allowNull: false,
    },
    health_status: {
      type: DataTypes.ENUM('healthy', 'sick', 'treatment'),
      allowNull: false,
      defaultValue: 'healthy',
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bases',
        key: 'id',
      },
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