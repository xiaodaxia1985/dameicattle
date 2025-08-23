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
      field: 'contactPerson'
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
      field: 'customerType',
      validate: {
        isIn: [['individual', 'company', 'distributor', 'restaurant']]
      }
    },
    businessLicense: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'businessLicense'
    },
    taxNumber: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'taxNumber'
    },
    bankAccount: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'bankAccount'
    },
    creditLimit: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'creditLimit'
    },
    creditRating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      field: 'creditRating',
      validate: {
        min: 1,
        max: 10
      }
    },
    paymentTerms: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'paymentTerms'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
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
      field: 'createdBy'
    },
    createdByName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'createdByName'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'createdAt'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updatedAt'
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