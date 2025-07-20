import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface PurchaseOrderItemAttributes {
  id: number;
  order_id: number;
  item_type: string;
  item_id?: number;
  item_name: string;
  specification?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  received_quantity: number;
  quality_status: string;
  remark?: string;
  created_at?: Date;
}

interface PurchaseOrderItemCreationAttributes extends Optional<PurchaseOrderItemAttributes, 
  'id' | 'received_quantity' | 'quality_status' | 'created_at'> {}

export class PurchaseOrderItem extends Model<PurchaseOrderItemAttributes, PurchaseOrderItemCreationAttributes> implements PurchaseOrderItemAttributes {
  public id!: number;
  public order_id!: number;
  public item_type!: string;
  public item_id?: number;
  public item_name!: string;
  public specification?: string;
  public quantity!: number;
  public unit!: string;
  public unit_price!: number;
  public total_price!: number;
  public received_quantity!: number;
  public quality_status!: string;
  public remark?: string;
  public readonly created_at!: Date;

  // Associations
  public order?: any;
}

PurchaseOrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '采购订单ID',
    },
    item_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '物品类型',
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '物品ID',
    },
    item_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '物品名称',
    },
    specification: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '规格说明',
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '数量',
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '单位',
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '单价',
    },
    total_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      comment: '总价',
    },
    received_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '已收货数量',
    },
    quality_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      comment: '质量状态',
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'purchase_order_items',
    timestamps: false,
    underscored: true,
    comment: '采购订单明细表',
  }
);