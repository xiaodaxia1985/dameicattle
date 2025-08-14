import { DataTypes, Model, Optional, QueryTypes } from 'sequelize';
import { sequelize } from '../config/database';

interface BarnAttributes {
  id: number;
  name: string;
  code: string;
  base_id: number;
  capacity: number;
  current_count: number;
  barn_type?: string;
  status?: string;
  description?: string;
  facilities?: object;
  created_at: Date;
  updated_at: Date;
}

interface BarnCreationAttributes extends Optional<BarnAttributes, 'id' | 'current_count' | 'created_at' | 'updated_at'> {}

export class Barn extends Model<BarnAttributes, BarnCreationAttributes> implements BarnAttributes {
  public id!: number;
  public name!: string;
  public code!: string;
  public base_id!: number;
  public capacity!: number;
  public current_count!: number;
  public barn_type?: string;
  public status?: string;
  public description?: string;
  public facilities?: object;
  public created_at!: Date;
  public updated_at!: Date;

  // 获取实际牛只数量（从cattle表查询）
  public async getActualCattleCount(): Promise<number> {
    const result = await sequelize.query(
      'SELECT COUNT(*) as count FROM cattle WHERE barn_id = :barn_id AND status = \'active\'',
      {
        replacements: { barn_id: this.id },
        type: QueryTypes.SELECT
      }
    );
    return parseInt((result[0] as any).count) || 0;
  }
}

Barn.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    base_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    current_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    barn_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    facilities: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {},
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
    tableName: 'barns',
    timestamps: true,
    underscored: true,
  }
);

export default Barn;