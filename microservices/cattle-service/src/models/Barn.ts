import { DataTypes, Model, Optional, QueryTypes } from 'sequelize';
import { sequelize } from '../config/database';

interface BarnAttributes {
  id: number;
  name: string;
  base_id: number;
  capacity?: number;
  current_count?: number;
  barn_type?: string;
  location?: string;
  status: 'active' | 'inactive' | 'maintenance';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

interface BarnCreationAttributes extends Optional<BarnAttributes, 'id' | 'created_at' | 'updated_at'> {}

export class Barn extends Model<BarnAttributes, BarnCreationAttributes> implements BarnAttributes {
  public id!: number;
  public name!: string;
  public base_id!: number;
  public capacity?: number;
  public current_count?: number;
  public barn_type?: string;
  public location?: string;
  public status!: 'active' | 'inactive' | 'maintenance';
  public notes?: string;
  public created_at!: Date;
  public updated_at!: Date;

  // 静态方法修复
  static async getCattleCountByBarn(barnId: number): Promise<number> {
    const result = await sequelize.query(
      'SELECT COUNT(*) as count FROM cattle WHERE barn_id = :barnId AND status = :status',
      {
        replacements: { barnId, status: 'active' },
        type: QueryTypes.SELECT
      }
    );
    return (result[0] as any).count || 0;
  }

  static async getAvailableCapacity(barnId: number): Promise<number> {
    const result = await sequelize.query(
      'SELECT capacity, (SELECT COUNT(*) FROM cattle WHERE barn_id = :barnId AND status = :status) as current_count FROM barns WHERE id = :barnId',
      {
        replacements: { barnId, status: 'active' },
        type: QueryTypes.SELECT
      }
    );
    const barn = result[0] as any;
    return (barn?.capacity || 0) - (barn?.current_count || 0);
  }
}

Barn.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  base_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  current_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  barn_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'maintenance'),
    allowNull: false,
    defaultValue: 'active',
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
}, {
  sequelize,
  tableName: 'barns',
  timestamps: true,
  underscored: true,
});