import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CustomerAttributes {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  customerType: 'individual' | 'company' | 'distributor' | 'restaurant';
  businessLicense?: string;
  taxNumber?: string;
  bankAccount?: string;
  creditLimit: number;
  creditRating: number;
  paymentTerms?: string;
  status: 'active' | 'inactive' | 'blacklisted';
  remark?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  public id!: number;
  public name!: string;
  public contactPerson!: string;
  public phone!: string;
  public email?: string;
  public address!: string;
  public customerType!: 'individual' | 'company' | 'distributor' | 'restaurant';
  public businessLicense?: string;
  public taxNumber?: string;
  public bankAccount?: string;
  public creditLimit!: number;
  public creditRating!: number;
  public paymentTerms?: string;
  public status!: 'active' | 'inactive' | 'blacklisted';
  public remark?: string;
  public createdBy!: string;
  public createdByName!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Customer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    contactPerson: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'contact_person'
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    customerType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'company',
      field: 'customer_type',
      validate: {
        isIn: [['individual', 'company', 'distributor', 'restaurant']]
      }
    },
    businessLicense: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'business_license'
    },
    taxNumber: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'tax_number'
    },
    bankAccount: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'bank_account'
    },
    creditLimit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'credit_limit'
    },
    creditRating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      field: 'credit_rating',
      validate: {
        min: 1,
        max: 10
      }
    },
    paymentTerms: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'payment_terms'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
      field: 'status',
      validate: {
        isIn: [['active', 'inactive', 'blacklisted']]
      }
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at'
    },
  },
  {
    sequelize,
    tableName: 'customers',
    timestamps: true,
    underscored: false,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
);