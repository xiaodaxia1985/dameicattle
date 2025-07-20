import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface SalesOrderAttributes {
  id: number;
  order_number: string;
  customer_id: number;
  base_id: number;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  status: string;
  order_date: Date;
  delivery_date?: Date;
  actual_delivery_date?: Date;
  payment_status: string;
  payment_method?: string;
  contract_number?: string;
  logistics_company?: string;
  tracking_number?: string;
  remark?: string;
  created_by: number;
  approved_by?: number;
  approved_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface SalesOrderCreationAttributes extends Optional<SalesOrderAttributes, 
  'id' | 'tax_amount' | 'discount_amount' | 'status' | 'payment_status' | 
  'approved_by' | 'approved_at' | 'created_at' | 'updated_at'> {}

export class SalesOrder extends Model<SalesOrderAttributes, SalesOrderCreationAttributes> implements SalesOrderAttributes {
  public id!: number;
  public order_number!: string;
  public customer_id!: number;
  public base_id!: number;
  public total_amount!: number;
  public tax_amount!: number;
  public discount_amount!: number;
  public status!: string;
  public order_date!: Date;
  public delivery_date?: Date;
  public actual_delivery_date?: Date;
  public payment_status!: string;
  public payment_method?: string;
  public contract_number?: string;
  public logistics_company?: string;
  public tracking_number?: string;
  public remark?: string;
  public created_by!: number;
  public approved_by?: number;
  public approved_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public customer?: any;
  public base?: any;
  public creator?: any;
  public approver?: any;
  public items?: any[];
}

SalesOrder.init(
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
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '客户ID',
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '基地ID',
      references: {
        model: 'bases',
        key: 'id',
      },
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
      comment: '订单状态：pending, approved, delivered, completed, cancelled',
    },
    order_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '订单日期',
    },
    delivery_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '预计交付日期',
    },
    actual_delivery_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '实际交付日期',
    },
    payment_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'unpaid',
      comment: '付款状态：unpaid, partial, paid',
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
    logistics_company: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '物流公司',
    },
    tracking_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '物流单号',
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
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '审批人ID',
      references: {
        model: 'users',
        key: 'id',
      },
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
    tableName: 'sales_orders',
    timestamps: true,
    underscored: true,
    comment: '销售订单表',
  }
);