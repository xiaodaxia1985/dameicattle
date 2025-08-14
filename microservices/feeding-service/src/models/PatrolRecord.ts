import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface PatrolRecordAttributes {
  id: number;
  base_id: number;
  barn_id: number;
  patrol_date: Date;
  patrol_time?: string;
  patrol_type: 'before_feeding' | 'after_feeding' | 'routine';
  total_cattle_count: number;
  lying_cattle_count: number;
  standing_cattle_count: number;
  lying_rate?: number;
  abnormal_cattle_count: number;
  abnormal_cattle_description?: string;
  feed_trough_clean?: boolean;
  feed_trough_notes?: string;
  water_trough_clean?: boolean;
  water_trough_notes?: string;
  temperature?: number;
  humidity?: number;
  environment_notes?: string;
  iot_device_id?: string;
  iot_data_source?: string;
  patrol_person_id?: number;
  patrol_person_name?: string;
  overall_notes?: string;
  images?: any[];
  patroller_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface PatrolRecordCreationAttributes extends Optional<PatrolRecordAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class PatrolRecord extends Model<PatrolRecordAttributes, PatrolRecordCreationAttributes> implements PatrolRecordAttributes {
  public id!: number;
  public base_id!: number;
  public barn_id!: number;
  public patrol_date!: Date;
  public patrol_time?: string;
  public patrol_type!: 'before_feeding' | 'after_feeding' | 'routine';
  public total_cattle_count!: number;
  public lying_cattle_count!: number;
  public standing_cattle_count!: number;
  public lying_rate?: number;
  public abnormal_cattle_count!: number;
  public abnormal_cattle_description?: string;
  public feed_trough_clean?: boolean;
  public feed_trough_notes?: string;
  public water_trough_clean?: boolean;
  public water_trough_notes?: string;
  public temperature?: number;
  public humidity?: number;
  public environment_notes?: string;
  public iot_device_id?: string;
  public iot_data_source?: string;
  public patrol_person_id?: number;
  public patrol_person_name?: string;
  public overall_notes?: string;
  public images?: any[];
  public patroller_id!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // 计算躺卧率
  public get lyingRate(): number {
    return this.total_cattle_count > 0 ? (this.lying_cattle_count / this.total_cattle_count) * 100 : 0;
  }

  // 计算异常率
  public get abnormalRate(): number {
    return this.total_cattle_count > 0 ? (this.abnormal_cattle_count / this.total_cattle_count) * 100 : 0;
  }
}

PatrolRecord.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '基地ID',
    },
    barn_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '牛棚ID',
    },
    patrol_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '巡圈日期',
    },
    patrol_time: {
      type: DataTypes.TIME,
      allowNull: true,
      comment: '巡圈时间',
    },
    patrol_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '巡圈类型',
    },
    total_cattle_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '牛只总数',
    },
    lying_cattle_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: '躺卧牛只数',
    },
    standing_cattle_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: '站立牛只数',
    },
    lying_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
      comment: '躺卧率',
    },
    abnormal_cattle_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: '异常牛只数',
    },
    abnormal_cattle_description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '异常牛只描述',
    },
    feed_trough_clean: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      comment: '饲料槽是否干净',
    },
    feed_trough_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '饲料槽备注',
    },
    water_trough_clean: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true,
      comment: '水槽是否干净',
    },
    water_trough_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '水槽备注',
    },
    temperature: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true,
      comment: '温度（摄氏度）',
    },
    humidity: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '湿度（%）',
    },
    environment_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '环境备注',
    },
    iot_device_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'IoT设备ID',
    },
    iot_data_source: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'manual',
      comment: '数据来源',
    },
    patrol_person_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '巡圈人员ID',
    },
    patrol_person_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '巡圈人员姓名',
    },
    overall_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '总体备注',
    },
    images: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: '图片',
    },
    patroller_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '巡圈员ID',
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
    tableName: 'patrol_records',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['base_id'],
      },
      {
        fields: ['barn_id'],
      },
      {
        fields: ['patrol_date'],
      },
      {
        fields: ['patrol_type'],
      },
      {
        fields: ['patroller_id'],
      },
    ],
  }
);

export default PatrolRecord;