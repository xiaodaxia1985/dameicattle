import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface CustomerAttributes {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  credit_rating: number;
  customer_type?: string;
  business_license?: string;
  tax_number?: string;
  bank_account?: string;
  credit_limit: number;
  payment_terms?: string;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'credit_rating' | 'credit_limit' | 'status' | 'created_at' | 'updated_at'> {}

export class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  public id!: number;
  public name!: string;
  public contact_person?: string;
  public phone?: string;
  public email?: string;
  public address?: string;
  public credit_rating!: number;
  public customer_type?: string;
  public business_license?: string;
  public tax_number?: string;
  public bank_account?: string;
  public credit_limit!: number;
  public payment_terms?: string;
  public status!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public sales_orders?: any[];
  public visit_records?: any[];
}

Customer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '客户名称',
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
    credit_rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '信用评级',
    },
    customer_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '客户类型：个人、企业、经销商',
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
    tableName: 'customers',
    timestamps: true,
    underscored: true,
    comment: '客户表',
  }
);