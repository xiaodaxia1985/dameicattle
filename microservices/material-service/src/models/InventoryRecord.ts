import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface InventoryRecordAttributes {
  id: number;
  material_id: number;
  base_id: number;
  type: 'in' | 'out';
  quantity: number;
  unit_price?: number;
  supplier?: string;
  purpose?: string;
  recipient?: string;
  notes?: string;
  operator_id: number;
  balance_after: number;
  created_at: Date;
  updated_at: Date;
}

interface InventoryRecordCreationAttributes extends Optional<InventoryRecordAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class InventoryRecord extends Model<InventoryRecordAttributes, InventoryRecordCreationAttributes> implements InventoryRecordAttributes {
  public id!: number;
  public material_id!: number;
  public base_id!: number;
  public type!: 'in' | 'out';
  public quantity!: number;
  public unit_price?: number;
  public supplier?: string;
  public purpose?: string;
  public recipient?: string;
  public notes?: string;
  public operator_id!: number;
  public balance_after!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

InventoryRecord.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('in', 'out'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    supplier: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    purpose: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    recipient: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    operator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    balance_after: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    tableName: 'inventory_records',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['material_id'],
      },
      {
        fields: ['base_id'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['operator_id'],
      },
      {
        fields: ['created_at'],
      },
    ],
  }
);