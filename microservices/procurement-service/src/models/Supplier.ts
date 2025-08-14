import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database'

// 供应商属性接口
export interface SupplierAttributes {
  id: number
  name: string
  contactPerson: string
  phone: string
  email?: string
  address: string
  supplierType: 'cattle' | 'material' | 'equipment' | 'mixed'
  businessLicense?: string
  taxNumber?: string
  bankAccount?: string
  creditLimit: number
  paymentTerms?: string
  rating: number
  status: 'active' | 'inactive' | 'blacklisted'
  remark?: string
  createdBy: string
  createdByName: string
  createdAt: Date
  updatedAt: Date
}

// 创建时的可选属性
export interface SupplierCreationAttributes extends Optional<SupplierAttributes, 
  'id' | 'creditLimit' | 'rating' | 'status' | 'createdAt' | 'updatedAt'> {}

// 供应商模型
export class Supplier extends Model<SupplierAttributes, SupplierCreationAttributes> 
  implements SupplierAttributes {
  public id!: number
  public name!: string
  public contactPerson!: string
  public phone!: string
  public email?: string
  public address!: string
  public supplierType!: 'cattle' | 'material' | 'equipment' | 'mixed'
  public businessLicense?: string
  public taxNumber?: string
  public bankAccount?: string
  public creditLimit!: number
  public paymentTerms?: string
  public rating!: number
  public status!: 'active' | 'inactive' | 'blacklisted'
  public remark?: string
  public createdBy!: string
  public createdByName!: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

// 初始化模型
Supplier.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '供应商名称'
  },
  contactPerson: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '联系人'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '联系电话'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    },
    comment: '邮箱'
  },
  address: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '地址'
  },
  supplierType: {
    type: DataTypes.ENUM('cattle', 'material', 'equipment', 'mixed'),
    allowNull: false,
    defaultValue: 'material',
    comment: '供应商类型'
  },
  businessLicense: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '营业执照号'
  },
  taxNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '税号'
  },
  bankAccount: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '银行账户'
  },
  creditLimit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '信用额度'
  },
  paymentTerms: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '付款条件'
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: {
      min: 1,
      max: 10
    },
    comment: '评级(1-10)'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'blacklisted'),
    allowNull: false,
    defaultValue: 'active',
    comment: '状态'
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注'
  },
  createdBy: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '创建人ID'
  },
  createdByName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '创建人姓名'
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  tableName: 'suppliers',
  timestamps: true,
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['supplierType']
    },
    {
      fields: ['status']
    },
    {
      fields: ['createdBy']
    }
  ]
})

