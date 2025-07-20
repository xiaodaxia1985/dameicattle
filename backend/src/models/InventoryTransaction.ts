import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface InventoryTransactionAttributes {
  id: number;
  material_id: number;
  base_id: number;
  transaction_type: string;
  quantity: number;
  unit_price?: number;
  reference_type?: string;
  reference_id?: number;
  batch_number?: string;
  expiry_date?: Date;
  operator_id: number;
  remark?: string;
  transaction_date?: Date;
}

interface InventoryTransactionCreationAttributes extends Optional<InventoryTransactionAttributes, 'id' | 'transaction_date'> {}

export class InventoryTransaction extends Model<InventoryTransactionAttributes, InventoryTransactionCreationAttributes> implements InventoryTransactionAttributes {
  public id!: number;
  public material_id!: number;
  public base_id!: number;
  public transaction_type!: string;
  public quantity!: number;
  public unit_price?: number;
  public reference_type?: string;
  public reference_id?: number;
  public batch_number?: string;
  public expiry_date?: Date;
  public operator_id!: number;
  public remark?: string;
  public readonly transaction_date!: Date;

  // Associations
  public material?: any;
  public base?: any;
  public operator?: any;
}

InventoryTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'production_materials',
        key: 'id',
      },
      comment: '物资ID',
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bases',
        key: 'id',
      },
      comment: '基地ID',
    },
    transaction_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '交易类型：入库、出库、调拨、盘点',
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '数量',
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '单价',
    },
    reference_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '关联单据类型',
    },
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '关联单据ID',
    },
    batch_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '批次号',
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '过期日期',
    },
    operator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: '操作员ID',
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注',
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '交易时间',
    },
  },
  {
    sequelize,
    tableName: 'inventory_transactions',
    timestamps: false,
    underscored: true,
    comment: '库存变动记录表',
  }
);