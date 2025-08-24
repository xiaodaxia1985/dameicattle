import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { Base } from './Base';

interface BarnAttributes {
  id: number;
  name: string;
  code: string;
  base_id: number;
  capacity: number;
  current_count: number;
  barn_type?: string;
  description?: string;
  facilities?: object;
  created_at: Date;
  updated_at: Date;
}

interface BarnCreationAttributes extends Optional<BarnAttributes, 'id' | 'current_count' | 'created_at' | 'updated_at'> {}

export class Barn extends Model<BarnAttributes, BarnCreationAttributes> implements BarnAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public base_id!: number;
  public capacity!: number;
  public current_count!: number;
  public barn_type?: string;
  public description?: string;
  public facilities?: object;
  public created_at!: Date;
  public updated_at!: Date;

  // Virtual fields for statistics
  public utilization_rate?: number;
  public available_capacity?: number;
  public equipment_count?: number;

  // Association
  public base?: Base;

  public toJSON(): any {
    const values = { ...this.get() };
    
    // Calculate virtual fields
    if (this.capacity > 0) {
      (values as any).utilization_rate = Math.round((this.current_count / this.capacity) * 100);
      (values as any).available_capacity = this.capacity - this.current_count;
    }
    
    return values;
  }
}

Barn.init(
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
      validate: {
        len: [2, 50],
        notEmpty: true,
        is: /^[A-Z0-9_-]+$/i, // Allow letters, numbers, underscore, and dash
      },
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bases',
        key: 'id',
      },
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 1000,
      },
    },
    current_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    barn_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      validate: {
        isIn: [['育肥棚', '繁殖棚', '隔离棚', '治疗棚', '其他', 'fattening', 'breeding', 'isolation', 'treatment', 'other']],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    facilities: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
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
    tableName: 'barns',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['base_id'],
      },
      {
        fields: ['code', 'base_id'],
        unique: true,
      },
    ],
  }
);