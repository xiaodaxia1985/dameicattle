import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SalesOrderAttributes {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  baseId: number;
  baseName: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  status: 'pending' | 'approved' | 'delivered' | 'completed' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paymentMethod?: string;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  contractNumber?: string;
  logisticsCompany?: string;
  trackingNumber?: string;
  remark?: string;
  createdBy: string;
  createdByName: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface SalesOrderCreationAttributes extends Optional<SalesOrderAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class SalesOrder extends Model<SalesOrderAttributes, SalesOrderCreationAttributes> implements SalesOrderAttributes {
  public id!: number;
  public orderNumber!: string;
  public customerId!: number;
  public customerName!: string;
  public baseId!: number;
  public baseName!: string;
  public totalAmount!: number;
  public taxAmount!: number;
  public discountAmount!: number;
  public status!: 'pending' | 'approved' | 'delivered' | 'completed' | 'cancelled';
  public paymentStatus!: 'unpaid' | 'partial' | 'paid';
  public paymentMethod?: string;
  public orderDate!: Date;
  public expectedDeliveryDate?: Date;
  public actualDeliveryDate?: Date;
  public contractNumber?: string;
  public logisticsCompany?: string;
  public trackingNumber?: string;
  public remark?: string;
  public createdBy!: string;
  public createdByName!: string;
  public approvedBy?: string;
  public approvedByName?: string;
  public approvedAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SalesOrder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: 'order_number'
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'customer_id'
    },
    customerName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'customer_name'
    },
    baseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'base_id'
    },
    baseName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'base_name'
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'total_amount'
    },
    taxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'tax_amount'
    },
    discountAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'discount_amount'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'delivered', 'completed', 'cancelled'),
      defaultValue: 'pending',
      field: 'status'
    },
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
      defaultValue: 'unpaid',
      field: 'payment_status'
    },
    paymentMethod: {
      type: DataTypes.STRING(100),
      field: 'payment_method'
    },
    orderDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'order_date'
    },
    expectedDeliveryDate: {
      type: DataTypes.DATE,
      field: 'expected_delivery_date'
    },
    actualDeliveryDate: {
      type: DataTypes.DATE,
      field: 'actual_delivery_date'
    },
    contractNumber: {
      type: DataTypes.STRING(100),
      field: 'contract_number'
    },
    logisticsCompany: {
      type: DataTypes.STRING(255),
      field: 'logistics_company'
    },
    trackingNumber: {
      type: DataTypes.STRING(100),
      field: 'tracking_number'
    },
    remark: {
      type: DataTypes.TEXT
    },
    createdBy: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'created_by'
    },
    createdByName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'created_by_name'
    },
    approvedBy: {
      type: DataTypes.STRING(50),
      field: 'approved_by'
    },
    approvedByName: {
      type: DataTypes.STRING(100),
      field: 'approved_by_name'
    },
    approvedAt: {
      type: DataTypes.DATE,
      field: 'approved_at'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    }
  },
  {
    sequelize,
    tableName: 'sales_orders',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
);