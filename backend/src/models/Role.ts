import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface RoleAttributes {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
  created_at: Date;
}

interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'created_at'> {}

export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public permissions!: string[];
  public created_at!: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [2, 50],
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
      validate: {
        isArray(value: any) {
          if (!Array.isArray(value)) {
            throw new Error('Permissions must be an array');
          }
        },
      },
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'roles',
    timestamps: false,
    underscored: true,
  }
);