import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface VaccinationRecordAttributes {
  id: number;
  cattle_id: number;
  vaccine_name: string;
  vaccination_date: Date;
  veterinarian_id?: number;
  batch_number?: string;
  next_vaccination_date?: Date;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

interface VaccinationRecordCreationAttributes extends Optional<VaccinationRecordAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class VaccinationRecord extends Model<VaccinationRecordAttributes, VaccinationRecordCreationAttributes> implements VaccinationRecordAttributes {
  public id!: number;
  public cattle_id!: number;
  public vaccine_name!: string;
  public vaccination_date!: Date;
  public veterinarian_id?: number;
  public batch_number?: string;
  public next_vaccination_date?: Date;
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;
}

VaccinationRecord.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    cattle_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cattle',
        key: 'id',
      },
    },
    vaccine_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    vaccination_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    veterinarian_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    batch_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    next_vaccination_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'vaccination_records',
    timestamps: true,
    underscored: true,
  }
);