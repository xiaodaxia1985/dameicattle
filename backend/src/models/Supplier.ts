import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface SupplierAttributes {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  rating: number;
  supplier_type?: string;
  business_license?: string;
  tax_number?: string;
  bank_account?: string;
  credit_limit: number;
  payment_terms?: string;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

interface SupplierCreationAttributes extends Optional<SupplierAttributes, 'id' | 'rating' | 'credit_limit' | 'status' | 'created_at' | 'updated_at'> {}

export class Supplier extends Model<SupplierAttributes, SupplierCreationAttributes> implements SupplierAttributes {
  public id!: number;
  public name!: string;
  public contact_person?: string;
  public phone?: string;
  public email?: string;
  public address?: string;
  public rating!: number;
  public supplier_type?: string;
  public business_license?: string;
  public tax_number?: string;
  public bank_account?: string;
  public credit_limit!: number;
  public payment_terms?: string;
  public status!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public materials?: any[];
  public purchase_orders?: any[];
}

Supplier.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '供应商名称',
    },
    contact_person: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '联系人',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '联系电话',
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '邮箱',
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '地址',
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '供应商评级',
    },
    supplier_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '供应商类型',
    },
    business_license: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '营业执照号',
    },
    tax_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '税号',
    },
    bank_account: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '银行账户',
    },
    credit_limit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '信用额度',
    },
    payment_terms: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '付款条件',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      comment: '状态',
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
    tableName: 'suppliers',
    timestamps: true,
    underscored: true,
    comment: '供应商表',
  }
);