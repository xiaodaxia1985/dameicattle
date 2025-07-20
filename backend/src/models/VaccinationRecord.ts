import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface VaccinationRecordAttributes {
  id: number;
  cattle_id: number;
  vaccine_name: string;
  vaccination_date: Date;
  next_due_date?: Date;
  veterinarian_id?: number;
  batch_number?: string;
  created_at: Date;
}

interface VaccinationRecordCreationAttributes extends Optional<VaccinationRecordAttributes, 'id' | 'created_at'> {}

class VaccinationRecord extends Model<VaccinationRecordAttributes, VaccinationRecordCreationAttributes> implements VaccinationRecordAttributes {
  public id!: number;
  public cattle_id!: number;
  public vaccine_name!: string;
  public vaccination_date!: Date;
  public next_due_date?: Date;
  public veterinarian_id?: number;
  public batch_number?: string;
  public created_at!: Date;

  // Associations
  public cattle?: any;
  public veterinarian?: any;
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
    next_due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
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
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'vaccination_records',
    timestamps: false,
    underscored: true,
  }
);

export { VaccinationRecord };