import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface HealthRecordAttributes {
  id: number;
  cattle_id: number;
  base_id?: number;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  veterinarian_id?: number;
  diagnosis_date: Date;
  status: 'ongoing' | 'completed' | 'cancelled';
  created_at: Date;
  updated_at: Date;
}

interface HealthRecordCreationAttributes extends Optional<HealthRecordAttributes, 'id' | 'created_at' | 'updated_at'> {}

class HealthRecord extends Model<HealthRecordAttributes, HealthRecordCreationAttributes> implements HealthRecordAttributes {
  public id!: number;
  public cattle_id!: number;
  public base_id?: number;
  public symptoms?: string;
  public diagnosis?: string;
  public treatment?: string;
  public veterinarian_id?: number;
  public diagnosis_date!: Date;
  public status!: 'ongoing' | 'completed' | 'cancelled';
  public created_at!: Date;
  public updated_at!: Date;

  // Associations
  public cattle?: any;
  public veterinarian?: any;
  public base?: any;
}

HealthRecord.init(
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
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'bases',
        key: 'id',
      },
    },
    symptoms: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    treatment: {
      type: DataTypes.TEXT,
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
    diagnosis_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('ongoing', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'ongoing',
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
    tableName: 'health_records',
    timestamps: true,
    underscored: true,
  }
);

export { HealthRecord };