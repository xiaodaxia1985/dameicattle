import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface BarnAttributes {
  id: number;
  name: string;
  code: string;
  base_id: number;
  capacity: number;
  current_count: number;
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
  public created_at!: Date;
  public updated_at!: Date;

  static async increment(field: string, options: any) {
    return sequelize.query(
      `UPDATE barns SET ${field} = ${field} + 1 WHERE id = :id`,
      {
        replacements: { id: options.where.id },
        type: sequelize.QueryTypes.UPDATE
      }
    );
  }

  static async decrement(field: string, options: any) {
    return sequelize.query(
      `UPDATE barns SET ${field} = GREATEST(${field} - 1, 0) WHERE id = :id`,
      {
        replacements: { id: options.where.id },
        type: sequelize.QueryTypes.UPDATE
      }
    );
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
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
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
    },
    current_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
  }
);