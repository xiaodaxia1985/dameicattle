import { DataTypes, Model, Optional, Op } from 'sequelize';
import { sequelize } from '@/config/database';
import { Base } from './Base';
import { Barn } from './Barn';
import { User } from './User';

// 巡圈记录属性接口
export interface PatrolRecordAttributes {
  id: number;
  base_id: number;
  barn_id: number;
  patrol_date: string;
  patrol_time: string;
  patrol_type: 'before_feeding' | 'after_feeding' | 'routine';
  
  // 牛只状态
  total_cattle_count: number;
  standing_cattle_count?: number;
  lying_cattle_count?: number;
  lying_rate?: number;
  
  // 异常牛只
  abnormal_cattle_count?: number;
  abnormal_cattle_description?: string;
  
  // 设施检查
  feed_trough_clean?: boolean;
  feed_trough_notes?: string;
  water_trough_clean?: boolean;
  water_trough_notes?: string;
  
  // 环境数据
  temperature?: number;
  humidity?: number;
  environment_notes?: string;
  
  // 物联网设备
  iot_device_id?: string;
  iot_data_source?: 'manual' | 'iot_sensor' | 'api';
  
  // 巡圈人员
  patrol_person_id?: number;
  patrol_person_name?: string;
  overall_notes?: string;
  
  // 图片附件
  images?: string[];
  
  created_at?: Date;
  updated_at?: Date;
}

// 创建时可选的属性
export interface PatrolRecordCreationAttributes extends Optional<PatrolRecordAttributes, 
  'id' | 'standing_cattle_count' | 'lying_cattle_count' | 'lying_rate' | 
  'abnormal_cattle_count' | 'abnormal_cattle_description' |
  'feed_trough_clean' | 'feed_trough_notes' | 'water_trough_clean' | 'water_trough_notes' |
  'temperature' | 'humidity' | 'environment_notes' |
  'iot_device_id' | 'iot_data_source' |
  'patrol_person_id' | 'patrol_person_name' | 'overall_notes' |
  'images' | 'created_at' | 'updated_at'
> {}

// 巡圈记录模型
export class PatrolRecord extends Model<PatrolRecordAttributes, PatrolRecordCreationAttributes> 
  implements PatrolRecordAttributes {
  
  public id!: number;
  public base_id!: number;
  public barn_id!: number;
  public patrol_date!: string;
  public patrol_time!: string;
  public patrol_type!: 'before_feeding' | 'after_feeding' | 'routine';
  
  // 牛只状态
  public total_cattle_count!: number;
  public standing_cattle_count?: number;
  public lying_cattle_count?: number;
  public lying_rate?: number;
  
  // 异常牛只
  public abnormal_cattle_count?: number;
  public abnormal_cattle_description?: string;
  
  // 设施检查
  public feed_trough_clean?: boolean;
  public feed_trough_notes?: string;
  public water_trough_clean?: boolean;
  public water_trough_notes?: string;
  
  // 环境数据
  public temperature?: number;
  public humidity?: number;
  public environment_notes?: string;
  
  // 物联网设备
  public iot_device_id?: string;
  public iot_data_source?: 'manual' | 'iot_sensor' | 'api';
  
  // 巡圈人员
  public patrol_person_id?: number;
  public patrol_person_name?: string;
  public overall_notes?: string;
  
  // 图片附件
  public images?: string[];
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // 关联模型
  public base?: Base;
  public barn?: Barn;
  public patrol_person?: User;

  // 实例方法
  public calculateLyingRate(): number {
    if (this.total_cattle_count === 0) return 0;
    const standingCount = this.standing_cattle_count || 0;
    const lyingCount = this.total_cattle_count - standingCount;
    return Math.round((lyingCount / this.total_cattle_count) * 100 * 100) / 100; // 保留两位小数
  }

  public updateLyingRate(): void {
    this.lying_rate = this.calculateLyingRate();
  }

  // 静态方法：获取巡圈统计
  public static async getPatrolStatistics(
    baseId: number,
    startDate: string,
    endDate: string
  ): Promise<any> {
    const stats = await PatrolRecord.findAll({
      where: {
        base_id: baseId,
        patrol_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_records'],
        [sequelize.fn('AVG', sequelize.col('lying_rate')), 'avg_lying_rate'],
        [sequelize.fn('AVG', sequelize.col('temperature')), 'avg_temperature'],
        [sequelize.fn('AVG', sequelize.col('humidity')), 'avg_humidity'],
        [sequelize.fn('SUM', sequelize.col('abnormal_cattle_count')), 'total_abnormal_cattle']
      ],
      raw: true
    });

    return stats[0] || {
      total_records: 0,
      avg_lying_rate: 0,
      avg_temperature: 0,
      avg_humidity: 0,
      total_abnormal_cattle: 0
    };
  }

  // 静态方法：获取每日巡圈趋势
  public static async getDailyTrend(
    baseId: number,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    return await PatrolRecord.findAll({
      where: {
        base_id: baseId,
        patrol_date: {
          [Op.between]: [startDate, endDate]
        }
      },
      attributes: [
        'patrol_date',
        [sequelize.fn('AVG', sequelize.col('lying_rate')), 'avg_lying_rate'],
        [sequelize.fn('AVG', sequelize.col('temperature')), 'avg_temperature'],
        [sequelize.fn('AVG', sequelize.col('humidity')), 'avg_humidity'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'patrol_count']
      ],
      group: ['patrol_date'],
      order: [['patrol_date', 'ASC']],
      raw: true
    });
  }
}

// 定义模型
PatrolRecord.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'bases',
        key: 'id'
      }
    },
    barn_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'barns',
        key: 'id'
      }
    },
    patrol_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    patrol_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    patrol_type: {
      type: DataTypes.ENUM('before_feeding', 'after_feeding', 'routine'),
      allowNull: false
    },
    
    // 牛只状态
    total_cattle_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    standing_cattle_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lying_cattle_count: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lying_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0
    },
    
    // 异常牛只
    abnormal_cattle_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    abnormal_cattle_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // 设施检查
    feed_trough_clean: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    feed_trough_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    water_trough_clean: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },
    water_trough_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // 环境数据
    temperature: {
      type: DataTypes.DECIMAL(4, 1),
      allowNull: true
    },
    humidity: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    environment_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // 物联网设备
    iot_device_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    iot_data_source: {
      type: DataTypes.ENUM('manual', 'iot_sensor', 'api'),
      allowNull: true,
      defaultValue: 'manual'
    },
    
    // 巡圈人员
    patrol_person_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    patrol_person_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    overall_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    
    // 图片附件
    images: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    },
    
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'PatrolRecord',
    tableName: 'patrol_records',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['base_id', 'barn_id']
      },
      {
        fields: ['patrol_date']
      },
      {
        fields: ['patrol_type']
      },
      {
        unique: true,
        fields: ['base_id', 'barn_id', 'patrol_date', 'patrol_time', 'patrol_type']
      }
    ],
    hooks: {
      beforeSave: (record: PatrolRecord) => {
        // 自动计算躺卧牛只数和躺卧率
        if (record.total_cattle_count > 0 && record.standing_cattle_count !== undefined) {
          // 计算躺卧牛只数
          record.lying_cattle_count = record.total_cattle_count - record.standing_cattle_count;
          // 计算躺卧率
          record.updateLyingRate();
        }
      }
    }
  }
);

// 关联关系在 models/index.ts 中统一定义

export default PatrolRecord;