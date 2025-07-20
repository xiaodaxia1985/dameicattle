import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface PurchaseOrderAttributes {
  id: number;
  order_number: string;
  supplier_id: number;
  base_id: number;
  order_type: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  status: string;
  order_date: Date;
  expected_delivery_date?: Date;
  actual_delivery_date?: Date;
  payment_status: string;
  payment_method?: string;
  contract_number?: string;
  remark?: string;
  created_by: number;
  approved_by?: number;
  approved_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface PurchaseOrderCreationAttributes extends Optional<PurchaseOrderAttributes, 
  'id' | 'tax_amount' | 'discount_amount' | 'status' | 'payment_status' | 'created_at' | 'updated_at'> {}

export class PurchaseOrder extends Model<PurchaseOrderAttributes, PurchaseOrderCreationAttributes> implements PurchaseOrderAttributes {
  public id!: number;
  public order_number!: string;
  public supplier_id!: number;
  public base_id!: number;
  public order_type!: string;
  public total_amount!: number;
  public tax_amount!: number;
  public discount_amount!: number;
  public status!: string;
  public order_date!: Date;
  public expected_delivery_date?: Date;
  public actual_delivery_date?: Date;
  public payment_status!: string;
  public payment_method?: string;
  public contract_number?: string;
  public remark?: string;
  public created_by!: number;
  public approved_by?: number;
  public approved_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public supplier?: any;
  public base?: any;
  public creator?: any;
  public approver?: any;
  public items?: any[];
}

PurchaseOrder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '订单编号',
    },
    supplier_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '供应商ID',
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '基地ID',
    },
    order_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '订单类型',
    },
    total_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: '订单总金额',
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '税额',
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '折扣金额',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      comment: '订单状态',
    },
    order_date: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '订单日期',
    },
    expected_delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '预期交付日期',
    },
    actual_delivery_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '实际交付日期',
    },
    payment_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'unpaid',
      comment: '付款状态',
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '付款方式',
    },
    contract_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '合同编号',
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注',
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '创建人ID',
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '审批人ID',
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '审批时间',
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
    tableName: 'purchase_orders',
    timestamps: true,
    underscored: true,
    comment: '采购订单表',
  }
);