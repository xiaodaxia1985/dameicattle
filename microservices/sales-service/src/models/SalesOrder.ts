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
      field: 'orderNumber'
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'customerId'
    },
    customerName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'customerName'
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
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'totalAmount'
    },
    taxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'taxAmount'
    },
    discountAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: 'discountAmount'
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'delivered', 'completed', 'cancelled'),
      defaultValue: 'pending'
    },
    paymentStatus: {
      type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
      defaultValue: 'unpaid',
      field: 'paymentStatus'
    },
    paymentMethod: {
      type: DataTypes.STRING(100),
      field: 'paymentMethod'
    },
    orderDate: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'orderDate'
    },
    expectedDeliveryDate: {
      type: DataTypes.DATE,
      field: 'expectedDeliveryDate'
    },
    actualDeliveryDate: {
      type: DataTypes.DATE,
      field: 'actualDeliveryDate'
    },
    contractNumber: {
      type: DataTypes.STRING(100),
      field: 'contractNumber'
    },
    logisticsCompany: {
      type: DataTypes.STRING(255),
      field: 'logisticsCompany'
    },
    trackingNumber: {
      type: DataTypes.STRING(100),
      field: 'trackingNumber'
    },
    remark: {
      type: DataTypes.TEXT
    },
    createdBy: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'createdBy'
    },
    createdByName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'createdByName'
    },
    approvedBy: {
      type: DataTypes.STRING(50),
      field: 'approvedBy'
    },
    approvedByName: {
      type: DataTypes.STRING(100),
      field: 'approvedByName'
    },
    approvedAt: {
      type: DataTypes.DATE,
      field: 'approvedAt'
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
    tableName: 'sales_orders',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
);