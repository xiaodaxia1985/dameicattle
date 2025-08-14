import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../config/database'

// 采购订单属性接口
export interface ProcurementOrderAttributes {
  id: number
  orderNumber: string
  supplierId: number
  supplierName: string
  baseId: number
  baseName: string
  orderType: 'cattle' | 'material' | 'equipment'
  totalAmount: number
  taxAmount: number
  discountAmount: number
  status: 'pending' | 'approved' | 'delivered' | 'completed' | 'cancelled'
  paymentStatus: 'unpaid' | 'partial' | 'paid'
  paymentMethod?: string
  orderDate: Date
  expectedDeliveryDate?: Date
  actualDeliveryDate?: Date
  contractNumber?: string
  remark?: string
  createdBy: string
  createdByName: string
  approvedBy?: string
  approvedByName?: string
  approvedAt?: Date
  cancelledBy?: string
  cancelledByName?: string
  cancelledAt?: Date
  cancelReason?: string
  createdAt: Date
  updatedAt: Date
}

// 创建时的可选属性
export interface ProcurementOrderCreationAttributes extends Optional<ProcurementOrderAttributes, 
  'id' | 'orderNumber' | 'status' | 'paymentStatus' | 'createdAt' | 'updatedAt'> {}

// 采购订单模型
export class ProcurementOrder extends Model<ProcurementOrderAttributes, ProcurementOrderCreationAttributes> 
  implements ProcurementOrderAttributes {
  public id!: number
  public orderNumber!: string
  public supplierId!: number
  public supplierName!: string
  public baseId!: number
  public baseName!: string
  public orderType!: 'cattle' | 'material' | 'equipment'
  public totalAmount!: number
  public taxAmount!: number
  public discountAmount!: number
  public status!: 'pending' | 'approved' | 'delivered' | 'completed' | 'cancelled'
  public paymentStatus!: 'unpaid' | 'partial' | 'paid'
  public paymentMethod?: string
  public orderDate!: Date
  public expectedDeliveryDate?: Date
  public actualDeliveryDate?: Date
  public contractNumber?: string
  public remark?: string
  public createdBy!: string
  public createdByName!: string
  public approvedBy?: string
  public approvedByName?: string
  public approvedAt?: Date
  public cancelledBy?: string
  public cancelledByName?: string
  public cancelledAt?: Date
  public cancelReason?: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date

  // 关联属性
  public readonly items?: ProcurementOrderItem[]
}

// 初始化模型
ProcurementOrder.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '订单号'
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '供应商ID'
  },
  supplierName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '供应商名称'
  },
  baseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '基地ID'
  },
  baseName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '基地名称'
  },
  orderType: {
    type: DataTypes.ENUM('cattle', 'material', 'equipment'),
    allowNull: false,
    defaultValue: 'material',
    comment: '订单类型'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '订单总金额'
  },
  taxAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '税额'
  },
  discountAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '折扣金额'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'delivered', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
    comment: '订单状态'
  },
  paymentStatus: {
    type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
    allowNull: false,
    defaultValue: 'unpaid',
    comment: '付款状态'
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '付款方式'
  },
  orderDate: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '订单日期'
  },
  expectedDeliveryDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '预计交付日期'
  },
  actualDeliveryDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '实际交付日期'
  },
  contractNumber: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '合同编号'
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
  approvedBy: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '审批人ID'
  },
  approvedByName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '审批人姓名'
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '审批时间'
  },
  cancelledBy: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '取消人ID'
  },
  cancelledByName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '取消人姓名'
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '取消时间'
  },
  cancelReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '取消原因'
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
  tableName: 'procurement_orders',
  timestamps: true,
  indexes: [
    {
      fields: ['orderNumber']
    },
    {
      fields: ['supplierId']
    },
    {
      fields: ['baseId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['orderDate']
    },
    {
      fields: ['createdBy']
    }
  ]
})

// 采购订单明细属性接口
export interface ProcurementOrderItemAttributes {
  id: number
  orderId: number
  itemName: string
  specification?: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  remark?: string
  createdAt: Date
  updatedAt: Date
}

export interface ProcurementOrderItemCreationAttributes extends Optional<ProcurementOrderItemAttributes, 
  'id' | 'createdAt' | 'updatedAt'> {}

// 采购订单明细模型
export class ProcurementOrderItem extends Model<ProcurementOrderItemAttributes, ProcurementOrderItemCreationAttributes> 
  implements ProcurementOrderItemAttributes {
  public id!: number
  public orderId!: number
  public itemName!: string
  public specification?: string
  public quantity!: number
  public unit!: string
  public unitPrice!: number
  public totalPrice!: number
  public remark?: string
  public readonly createdAt!: Date
  public readonly updatedAt!: Date
}

// 初始化订单明细模型
ProcurementOrderItem.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ProcurementOrder,
      key: 'id'
    },
    comment: '采购订单ID'
  },
  itemName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '商品名称'
  },
  specification: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '规格'
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '数量'
  },
  unit: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '单位'
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '单价'
  },
  totalPrice: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    comment: '小计'
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注'
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
  tableName: 'procurement_order_items',
  timestamps: true,
  indexes: [
    {
      fields: ['orderId']
    }
  ]
})

// 设置关联关系
ProcurementOrder.hasMany(ProcurementOrderItem, {
  foreignKey: 'orderId',
  as: 'items',
  onDelete: 'CASCADE'
})

ProcurementOrderItem.belongsTo(ProcurementOrder, {
  foreignKey: 'orderId',
  as: 'order'
})