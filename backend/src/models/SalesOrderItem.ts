import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface SalesOrderItemAttributes {
  id: number;
  order_id: number;
  cattle_id: number;
  ear_tag: string;
  breed?: string;
  weight?: number;
  unit_price: number;
  total_price: number;
  quality_grade?: string;
  health_certificate?: string;
  quarantine_certificate?: string;
  delivery_status: string;
  remark?: string;
  created_at?: Date;
}

interface SalesOrderItemCreationAttributes extends Optional<SalesOrderItemAttributes, 
  'id' | 'delivery_status' | 'created_at'> {}

export class SalesOrderItem extends Model<SalesOrderItemAttributes, SalesOrderItemCreationAttributes> implements SalesOrderItemAttributes {
  public id!: number;
  public order_id!: number;
  public cattle_id!: number;
  public ear_tag!: string;
  public breed?: string;
  public weight?: number;
  public unit_price!: number;
  public total_price!: number;
  public quality_grade?: string;
  public health_certificate?: string;
  public quarantine_certificate?: string;
  public delivery_status!: string;
  public remark?: string;
  public readonly created_at!: Date;

  // Associations
  public order?: any;
  public cattle?: any;
}

SalesOrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '订单ID',
      references: {
        model: 'sales_orders',
        key: 'id',
      },
    },
    cattle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '牛只ID',
      references: {
        model: 'cattle',
        key: 'id',
      },
    },
    ear_tag: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '耳标号',
    },
    breed: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '品种',
    },
    weight: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
      comment: '重量',
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
    quality_grade: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '质量等级',
    },
    health_certificate: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '健康证明编号',
    },
    quarantine_certificate: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '检疫证明编号',
    },
    delivery_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      comment: '交付状态：pending, delivered, cancelled',
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
    tableName: 'sales_order_items',
    timestamps: false,
    underscored: true,
    comment: '销售订单明细表',
  }
);