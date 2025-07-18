import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface SecurityLogAttributes {
  id: number;
  user_id?: number;
  username?: string;
  event_type: 'login_success' | 'login_failed' | 'logout' | 'password_reset' | 'account_locked' | 'token_refresh';
  ip_address: string;
  user_agent?: string;
  details?: object;
  created_at: Date;
}

interface SecurityLogCreationAttributes extends Optional<SecurityLogAttributes, 'id' | 'created_at'> {}

export class SecurityLog extends Model<SecurityLogAttributes, SecurityLogCreationAttributes> implements SecurityLogAttributes {
  public id!: number;
  public user_id?: number;
  public username?: string;
  public event_type!: 'login_success' | 'login_failed' | 'logout' | 'password_reset' | 'account_locked' | 'token_refresh';
  public ip_address!: string;
  public user_agent?: string;
  public details?: object;
  public created_at!: Date;

  // Static method to log security events
  public static async logEvent(data: SecurityLogCreationAttributes): Promise<SecurityLog> {
    return SecurityLog.create(data);
  }
}

SecurityLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    event_type: {
      type: DataTypes.ENUM('login_success', 'login_failed', 'logout', 'password_reset', 'account_locked', 'token_refresh'),
      allowNull: false,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    details: {
      type: DataTypes.JSONB,
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
    tableName: 'security_logs',
    timestamps: false,
    underscored: true,
  }
);