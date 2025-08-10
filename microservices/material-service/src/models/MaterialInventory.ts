import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface MaterialInventoryAttributes {
  id: number;
  material_id: number;
  base_id: number;
  current_stock: number;
  total_in: number;
  total_out: number;
  created_at: Date;
  updated_at: Date;
}

interface MaterialInventoryCreationAttributes extends Optional<MaterialInventoryAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class MaterialInventory extends Model<MaterialInventoryAttributes, MaterialInventoryCreationAttributes> implements MaterialInventoryAttributes {
  public id!: number;
  public material_id!: number;
  public base_id!: number;
  public current_stock!: number;
  public total_in!: number;
  public total_out!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

MaterialInventory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    current_stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    total_in: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    total_out: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'material_inventory',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['material_id', 'base_id'],
        unique: true,
      },
      {
        fields: ['base_id'],
      },
    ],
  }
);