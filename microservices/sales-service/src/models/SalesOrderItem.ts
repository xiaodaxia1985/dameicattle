import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface SalesOrderItemAttributes {
  id: number;
  orderId: number;
  cattleId: number;
  earTag: string;
  breed?: string;
  weight: number;
  unitPrice: number;
  totalPrice: number;
  qualityGrade?: string;
  healthCertificate?: string;
  quarantineCertificate?: string;
  deliveryStatus: 'pending' | 'delivered' | 'received';
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SalesOrderItemCreationAttributes extends Optional<SalesOrderItemAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class SalesOrderItem extends Model<SalesOrderItemAttributes, SalesOrderItemCreationAttributes> implements SalesOrderItemAttributes {
  public id!: number;
  public orderId!: number;
  public cattleId!: number;
  public earTag!: string;
  public breed?: string;
  public weight!: number;
  public unitPrice!: number;
  public totalPrice!: number;
  public qualityGrade?: string;
  public healthCertificate?: string;
  public quarantineCertificate?: string;
  public deliveryStatus!: 'pending' | 'delivered' | 'received';
  public remark?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

SalesOrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'orderId',
      references: {
        model: 'sales_orders',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    cattleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'cattleId'
    },
    earTag: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'earTag'
    },
    breed: {
      type: DataTypes.STRING(100),
      field: 'breed'
    },
    weight: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: false,
      field: 'weight'
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'unitPrice'
    },
    totalPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: 'totalPrice'
    },
    qualityGrade: {
      type: DataTypes.STRING(50),
      field: 'qualityGrade'
    },
    healthCertificate: {
      type: DataTypes.STRING(255),
      field: 'healthCertificate'
    },
    quarantineCertificate: {
      type: DataTypes.STRING(255),
      field: 'quarantineCertificate'
    },
    deliveryStatus: {
      type: DataTypes.ENUM('pending', 'delivered', 'received'),
      defaultValue: 'pending',
      field: 'deliveryStatus'
    },
    remark: {
      type: DataTypes.TEXT
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
    tableName: 'sales_order_items',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
);