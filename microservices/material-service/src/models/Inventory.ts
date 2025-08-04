import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface InventoryAttributes {
  id: number;
  material_id: number;
  base_id: number;
  current_stock: number;
  min_stock: number;
  max_stock?: number;
  unit_price?: number;
  last_updated: Date;
  created_at: Date;
  updated_at: Date;
}

interface InventoryCreationAttributes extends Optional<InventoryAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Inventory extends Model<InventoryAttributes, InventoryCreationAttributes> implements InventoryAttributes {
  public id!: number;
  public material_id!: number;
  public base_id!: number;
  public current_stock!: number;
  public min_stock!: number;
  public max_stock?: number;
  public unit_price?: number;
  public last_updated!: Date;
  public created_at!: Date;
  public updated_at!: Date;
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
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bases',
        key: 'id',
      },
    },
    current_stock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    min_stock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    max_stock: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    last_updated: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
    tableName: 'inventories',
    timestamps: true,
    underscored: true,
  }
);