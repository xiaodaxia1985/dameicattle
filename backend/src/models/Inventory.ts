import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface InventoryAttributes {
  id: number;
  material_id: number;
  base_id: number;
  current_stock: number;
  reserved_stock: number;
  last_updated?: Date;
}

interface InventoryCreationAttributes extends Optional<InventoryAttributes, 'id' | 'current_stock' | 'reserved_stock' | 'last_updated'> {}

export class Inventory extends Model<InventoryAttributes, InventoryCreationAttributes> implements InventoryAttributes {
  public id!: number;
  public material_id!: number;
  public base_id!: number;
  public current_stock!: number;
  public reserved_stock!: number;
  public readonly last_updated!: Date;

  // Associations
  public material?: any;
  public base?: any;
  public transactions?: any[];
  public alerts?: any[];
}

Inventory.init(
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
    current_stock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '当前库存',
    },
    reserved_stock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '预留库存',
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: '最后更新时间',
    },
  },
  {
    sequelize,
    tableName: 'inventory',
    timestamps: false,
    underscored: true,
    comment: '库存表',
    indexes: [
      {
        unique: true,
        fields: ['material_id', 'base_id'],
      },
    ],
  }
);