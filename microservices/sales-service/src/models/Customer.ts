import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CustomerAttributes {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  business_license?: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: Date;
  updated_at: Date;
}

interface CustomerCreationAttributes extends Optional<CustomerAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Customer extends Model<CustomerAttributes, CustomerCreationAttributes> implements CustomerAttributes {
  public id!: number;
  public name!: string;
  public contact_person?: string;
  public phone?: string;
  public email?: string;
  public address?: string;
  public business_license?: string;
  public notes?: string;
  public status!: 'active' | 'inactive';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
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
      unique: true,
    },
    contact_person: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    business_license: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
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
    indexes: [
      {
        fields: ['name'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['phone'],
      },
      {
        fields: ['email'],
      },
    ],
  }
);