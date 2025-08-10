import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SalesOrderAttributes {
  id: number;
  order_number: string;
  customer_id: number;
  base_id: number;
  cattle_ids: number[]; // Array of cattle IDs
  total_amount: number;
  order_date: Date;
  expected_delivery_date?: Date;
  actual_delivery_date?: Date;
  notes?: string;
  status: 'pending' | 'approved' | 'delivered' | 'completed' | 'cancelled';
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

interface SalesOrderCreationAttributes extends Optional<SalesOrderAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class SalesOrder extends Model<SalesOrderAttributes, SalesOrderCreationAttributes> implements SalesOrderAttributes {
  public id!: number;
  public order_number!: string;
  public customer_id!: number;
  public base_id!: number;
  public cattle_ids!: number[];
  public total_amount!: number;
  public order_date!: Date;
  public expected_delivery_date?: Date;
  public actual_delivery_date?: Date;
  public notes?: string;
  public status!: 'pending' | 'approved' | 'delivered' | 'completed' | 'cancelled';
  public created_by!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

SalesOrder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cattle_ids: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      defaultValue: [],
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    order_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expected_delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    actual_delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'delivered', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    created_by: {
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
    tableName: 'sales_orders',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['customer_id'],
      },
      {
        fields: ['base_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['order_date'],
      },
      {
        fields: ['created_by'],
      },
    ],
  }
);