import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface BaseAttributes {
  id: number;
  name: string;
  code: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  area?: number;
  manager_id?: number;
  created_at: Date;
  updated_at: Date;
}

interface BaseCreationAttributes extends Optional<BaseAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Base extends Model<BaseAttributes, BaseCreationAttributes> implements BaseAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public address?: string;
  public latitude?: number;
  public longitude?: number;
  public area?: number;
  public manager_id?: number;
  public created_at!: Date;
  public updated_at!: Date;

  // Virtual fields for statistics
  public cattle_count?: number;
  public barn_count?: number;
  public healthy_cattle_count?: number;
  public sick_cattle_count?: number;
  public treatment_cattle_count?: number;

  public toJSON(): Partial<BaseAttributes> {
    const values = { ...this.get() };
    return values;
  }
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
      validate: {
        len: [2, 100],
        notEmpty: true,
      },
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 50],
        notEmpty: true,
        is: /^[A-Z0-9_-]+$/i, // Allow letters, numbers, underscore, and dash
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      validate: {
        min: -90,
        max: 90,
      },
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      validate: {
        min: -180,
        max: 180,
      },
    },
    area: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
      },
    },
    manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
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
    tableName: 'bases',
    timestamps: true,
    underscored: true,
  }
);