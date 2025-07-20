import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface EquipmentMaintenancePlanAttributes {
  id: number;
  equipment_id: number;
  maintenance_type: string;
  frequency_days: number;
  description?: string;
  checklist?: object;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface EquipmentMaintenancePlanCreationAttributes extends Optional<EquipmentMaintenancePlanAttributes, 'id' | 'created_at' | 'updated_at'> {}

class EquipmentMaintenancePlan extends Model<EquipmentMaintenancePlanAttributes, EquipmentMaintenancePlanCreationAttributes> implements EquipmentMaintenancePlanAttributes {
  public id!: number;
  public equipment_id!: number;
  public maintenance_type!: string;
  public frequency_days!: number;
  public description?: string;
  public checklist?: object;
  public is_active!: boolean;
  public created_at?: Date;
  public updated_at?: Date;

  public toJSON(): any {
    const values = { ...this.get() };
    return values;
  }
}

EquipmentMaintenancePlan.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    equipment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'production_equipment',
        key: 'id',
      },
    },
    maintenance_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    frequency_days: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    checklist: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'equipment_maintenance_plans',
    timestamps: true,
    underscored: true,
  }
);

export default EquipmentMaintenancePlan;