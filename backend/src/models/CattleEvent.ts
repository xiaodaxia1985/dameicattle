import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface CattleEventAttributes {
  id: number;
  cattle_id: number;
  event_type: string;
  event_date: Date;
  description?: string;
  data?: object;
  operator_id?: number;
  created_at: Date;
  updated_at: Date;
}

interface CattleEventCreationAttributes extends Optional<CattleEventAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class CattleEvent extends Model<CattleEventAttributes, CattleEventCreationAttributes> implements CattleEventAttributes {
  public id!: number;
  public cattle_id!: number;
  public event_type!: string;
  public event_date!: Date;
  public description?: string;
  public data?: object;
  public operator_id?: number;
  public created_at!: Date;
  public updated_at!: Date;

  public toJSON(): any {
    const values = { ...this.get() };
    return values;
  }
}

CattleEvent.init(
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
    event_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [[
          'birth', 'born', 'purchase', 'purchased', 'transfer_in', 'transfer_out', 'transferred',
          'weight_record', 'health_check', 'vaccination',
          'treatment', 'breeding', 'pregnancy_check',
          'calving', 'weaning', 'sale', 'sold', 'death', 'dead', 'other'
        ]],
      },
    },
    event_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
    },
    operator_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
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
    tableName: 'cattle_events',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['cattle_id'],
      },
      {
        fields: ['event_type'],
      },
      {
        fields: ['event_date'],
      },
      {
        fields: ['operator_id'],
      },
    ],
  }
);