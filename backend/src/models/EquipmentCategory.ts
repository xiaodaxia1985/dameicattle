import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface EquipmentCategoryAttributes {
  id: number;
  name: string;
  code: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface EquipmentCategoryCreationAttributes extends Optional<EquipmentCategoryAttributes, 'id' | 'created_at' | 'updated_at'> {}

class EquipmentCategory extends Model<EquipmentCategoryAttributes, EquipmentCategoryCreationAttributes> implements EquipmentCategoryAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public description?: string;
  public created_at?: Date;
  public updated_at?: Date;

  public toJSON(): any {
    const values = { ...this.get() };
    return values;
  }
}

EquipmentCategory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'equipment_categories',
    timestamps: true,
    underscored: true,
  }
);

export default EquipmentCategory;