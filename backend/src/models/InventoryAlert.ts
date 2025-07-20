import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface InventoryAlertAttributes {
  id: number;
  material_id: number;
  base_id: number;
  alert_type: string;
  alert_level: string;
  message: string;
  is_resolved: boolean;
  resolved_at?: Date;
  created_at?: Date;
}

interface InventoryAlertCreationAttributes extends Optional<InventoryAlertAttributes, 'id' | 'alert_level' | 'is_resolved' | 'created_at'> {}

export class InventoryAlert extends Model<InventoryAlertAttributes, InventoryAlertCreationAttributes> implements InventoryAlertAttributes {
  public id!: number;
  public material_id!: number;
  public base_id!: number;
  public alert_type!: string;
  public alert_level!: string;
  public message!: string;
  public is_resolved!: boolean;
  public resolved_at?: Date;
  public readonly created_at!: Date;

  // Associations
  public material?: any;
  public base?: any;
}

InventoryAlert.init(
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
    alert_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '预警类型：低库存、过期、质量问题',
    },
    alert_level: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'medium',
      comment: '预警级别：low, medium, high',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '预警消息',
    },
    is_resolved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否已解决',
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '解决时间',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'inventory_alerts',
    timestamps: false,
    underscored: true,
    comment: '库存预警表',
  }
);