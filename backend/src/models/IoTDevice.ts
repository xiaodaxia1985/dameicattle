import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';
import { Base } from './Base';
import { Barn } from './Barn';

// 物联网设备属性接口
export interface IoTDeviceAttributes {
  id: number;
  device_id: string;
  device_name: string;
  device_type: string;
  base_id: number;
  barn_id?: number;
  
  // 设备配置
  api_endpoint?: string;
  api_key?: string;
  device_config?: Record<string, any>;
  
  // 设备状态
  status: 'active' | 'inactive' | 'maintenance';
  last_data_time?: Date;
  
  created_at?: Date;
  updated_at?: Date;
}

// 创建时可选的属性
export interface IoTDeviceCreationAttributes extends Optional<IoTDeviceAttributes, 
  'id' | 'barn_id' | 'api_endpoint' | 'api_key' | 'device_config' | 
  'status' | 'last_data_time' | 'created_at' | 'updated_at'
> {}

// 物联网设备模型
export class IoTDevice extends Model<IoTDeviceAttributes, IoTDeviceCreationAttributes> 
  implements IoTDeviceAttributes {
  
  public id!: number;
  public device_id!: string;
  public device_name!: string;
  public device_type!: string;
  public base_id!: number;
  public barn_id?: number;
  
  // 设备配置
  public api_endpoint?: string;
  public api_key?: string;
  public device_config?: Record<string, any>;
  
  // 设备状态
  public status!: 'active' | 'inactive' | 'maintenance';
  public last_data_time?: Date;
  
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // 关联模型
  public base?: Base;
  public barn?: Barn;

  // 实例方法：获取设备数据
  public async getLatestData(): Promise<any> {
    try {
      if (!this.api_endpoint) {
        throw new Error('设备未配置API端点');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (this.api_key) {
        headers['Authorization'] = `Bearer ${this.api_key}`;
      }

      const response = await fetch(this.api_endpoint, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();
      
      // 更新最后数据时间
      await this.update({ last_data_time: new Date() });
      
      return data;
    } catch (error) {
      console.error(`获取设备${this.device_id}数据失败:`, error);
      throw error;
    }
  }

  // 实例方法：检查设备状态
  public isOnline(): boolean {
    if (!this.last_data_time) return false;
    
    const now = new Date();
    const lastDataTime = new Date(this.last_data_time);
    const diffMinutes = (now.getTime() - lastDataTime.getTime()) / (1000 * 60);
    
    // 如果超过30分钟没有数据，认为设备离线
    return diffMinutes <= 30;
  }

  // 静态方法：获取基地的所有活跃设备
  public static async getActiveDevicesByBase(baseId: number): Promise<IoTDevice[]> {
    return await IoTDevice.findAll({
      where: {
        base_id: baseId,
        status: 'active'
      },
      include: [
        {
          model: Barn,
          as: 'barn',
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['device_name', 'ASC']]
    });
  }

  // 静态方法：获取牛棚的温湿度设备
  public static async getTemperatureHumidityDevice(barnId: number): Promise<IoTDevice | null> {
    return await IoTDevice.findOne({
      where: {
        barn_id: barnId,
        device_type: 'temperature_humidity',
        status: 'active'
      }
    });
  }
}

// 定义模型
IoTDevice.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    device_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    device_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    device_type: {
      type: DataTypes.STRING(50),
      allowNull: false
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
      allowNull: true,
      references: {
        model: 'barns',
        key: 'id'
      }
    },
    
    // 设备配置
    api_endpoint: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    api_key: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    device_config: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },
    
    // 设备状态
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
      allowNull: false,
      defaultValue: 'active'
    },
    last_data_time: {
      type: DataTypes.DATE,
      allowNull: true
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
    modelName: 'IoTDevice',
    tableName: 'iot_devices',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['barn_id']
      },
      {
        fields: ['device_type']
      },
      {
        fields: ['base_id']
      }
    ]
  }
);

// 关联关系在 models/index.ts 中统一定义

export default IoTDevice;