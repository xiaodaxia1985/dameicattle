import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface EquipmentFailureAttributes {
  id: number;
  equipment_id: number;
  failure_date: Date;
  reported_by: number;
  failure_type?: string;
  severity: string;
  description: string;
  impact_description?: string;
  repair_start_time?: Date;
  repair_end_time?: Date;
  repair_cost?: number;
  repaired_by?: number;
  repair_description?: string;
  parts_replaced?: object;
  status: string;
  created_at?: Date;
  updated_at?: Date;
}

interface EquipmentFailureCreationAttributes extends Optional<EquipmentFailureAttributes, 'id' | 'created_at' | 'updated_at'> {}

class EquipmentFailure extends Model<EquipmentFailureAttributes, EquipmentFailureCreationAttributes> implements EquipmentFailureAttributes {
  public id!: number;
  public equipment_id!: number;
  public failure_date!: Date;
  public reported_by!: number;
  public failure_type?: string;
  public severity!: string;
  public description!: string;
  public impact_description?: string;
  public repair_start_time?: Date;
  public repair_end_time?: Date;
  public repair_cost?: number;
  public repaired_by?: number;
  public repair_description?: string;
  public parts_replaced?: object;
  public status!: string;
  public created_at?: Date;
  public updated_at?: Date;

  public toJSON(): any {
    const values = { ...this.get() };
    return values;
  }
}

EquipmentFailure.init(
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
    failure_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    reported_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    failure_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    severity: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'medium',
      validate: {
        isIn: [['low', 'medium', 'high', 'critical']],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    impact_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    repair_start_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    repair_end_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    repair_cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    repaired_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    repair_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    parts_replaced: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'reported',
      validate: {
        isIn: [['reported', 'in_repair', 'resolved', 'closed']],
      },
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
    tableName: 'equipment_failures',
    timestamps: true,
    underscored: true,
  }
);

export default EquipmentFailure;