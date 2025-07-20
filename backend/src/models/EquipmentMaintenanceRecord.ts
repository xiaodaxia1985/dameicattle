import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface EquipmentMaintenanceRecordAttributes {
  id: number;
  equipment_id: number;
  plan_id?: number;
  maintenance_date: Date;
  maintenance_type: string;
  operator_id: number;
  duration_hours?: number;
  cost?: number;
  parts_replaced?: object;
  issues_found?: string;
  actions_taken?: string;
  next_maintenance_date?: Date;
  status: string;
  photos?: object;
  created_at?: Date;
  updated_at?: Date;
}

interface EquipmentMaintenanceRecordCreationAttributes extends Optional<EquipmentMaintenanceRecordAttributes, 'id' | 'created_at' | 'updated_at'> {}

class EquipmentMaintenanceRecord extends Model<EquipmentMaintenanceRecordAttributes, EquipmentMaintenanceRecordCreationAttributes> implements EquipmentMaintenanceRecordAttributes {
  public id!: number;
  public equipment_id!: number;
  public plan_id?: number;
  public maintenance_date!: Date;
  public maintenance_type!: string;
  public operator_id!: number;
  public duration_hours?: number;
  public cost?: number;
  public parts_replaced?: object;
  public issues_found?: string;
  public actions_taken?: string;
  public next_maintenance_date?: Date;
  public status!: string;
  public photos?: object;
  public created_at?: Date;
  public updated_at?: Date;

  public toJSON(): any {
    const values = { ...this.get() };
    return values;
  }
}

EquipmentMaintenanceRecord.init(
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
    plan_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'equipment_maintenance_plans',
        key: 'id',
      },
    },
    maintenance_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    maintenance_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    operator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    duration_hours: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    parts_replaced: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    issues_found: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    actions_taken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    next_maintenance_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'completed',
      validate: {
        isIn: [['scheduled', 'in_progress', 'completed', 'cancelled']],
      },
    },
    photos: {
      type: DataTypes.JSONB,
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
    tableName: 'equipment_maintenance_records',
    timestamps: true,
    underscored: true,
  }
);

export default EquipmentMaintenanceRecord;