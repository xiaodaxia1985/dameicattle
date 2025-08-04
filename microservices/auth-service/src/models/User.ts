import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcryptjs';

export interface UserAttributes {
  id: number;
  username: string;
  password_hash: string;
  real_name: string;
  email?: string;
  phone?: string;
  role_id?: number | null;
  base_id?: number;
  status: 'active' | 'inactive' | 'locked';
  failed_login_attempts: number;
  locked_until?: Date;
  last_login?: Date;
  password_changed_at?: Date;
  password_reset_token?: string;
  password_reset_expires?: Date;
  wechat_openid?: string;
  wechat_unionid?: string;
  created_at: Date;
  updated_at: Date;
  role?: any;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at' | 'failed_login_attempts'> {}

export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public password_hash!: string;
  public real_name!: string;
  public email?: string;
  public phone?: string;
  public role_id?: number | null;
  public base_id?: number;
  public status!: 'active' | 'inactive' | 'locked';
  public failed_login_attempts!: number;
  public locked_until?: Date;
  public last_login?: Date;
  public password_changed_at?: Date;
  public password_reset_token?: string;
  public password_reset_expires?: Date;
  public wechat_openid?: string;
  public wechat_unionid?: string;
  public created_at!: Date;
  public updated_at!: Date;
  public role?: any;

  // 实例方法
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }

  public toJSON(): Partial<UserAttributes> {
    const values = { ...this.get() } as any;
    delete values.password_hash;
    delete values.password_reset_token;
    return values;
  }

  public isAccountLocked(): boolean {
    return this.locked_until ? new Date() < this.locked_until : false;
  }

  public async incrementFailedAttempts(): Promise<void> {
    const maxAttempts = 5;
    const lockoutDuration = 30 * 60 * 1000; // 30分钟

    this.failed_login_attempts += 1;

    if (this.failed_login_attempts >= maxAttempts) {
      this.locked_until = new Date(Date.now() + lockoutDuration);
      this.status = 'locked';
    }

    await this.save();
  }

  public async resetFailedAttempts(): Promise<void> {
    this.failed_login_attempts = 0;
    this.locked_until = undefined;
    if (this.status === 'locked') {
      this.status = 'active';
    }
    this.last_login = new Date();
    await this.save();
  }

  public async generatePasswordResetToken(): Promise<string> {
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    this.password_reset_token = hashedToken;
    this.password_reset_expires = new Date(Date.now() + 10 * 60 * 1000); // 10分钟
    await this.save();
    
    return token;
  }

  public async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    if (
      this.password_reset_token !== hashedToken ||
      !this.password_reset_expires ||
      new Date() > this.password_reset_expires
    ) {
      return false;
    }

    this.password_hash = await User.hashPassword(newPassword);
    this.password_changed_at = new Date();
    this.password_reset_token = undefined;
    this.password_reset_expires = undefined;
    this.failed_login_attempts = 0;
    this.locked_until = undefined;
    if (this.status === 'locked') {
      this.status = 'active';
    }
    
    await this.save();
    return true;
  }

  // 静态方法
  public static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  public static async findByResetToken(token: string): Promise<User | null> {
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    return User.findOne({
      where: {
        password_reset_token: hashedToken,
        password_reset_expires: {
          [require('sequelize').Op.gt]: new Date(),
        },
      },
    });
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 50],
        notEmpty: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    real_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[0-9+\-\s()]+$/,
      },
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'roles',
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
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'locked'),
      allowNull: false,
      defaultValue: 'active',
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    locked_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    password_changed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    password_reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    wechat_openid: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
    },
    wechat_unionid: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
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
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password_hash) {
          user.password_hash = await User.hashPassword(user.password_hash);
          user.password_changed_at = new Date();
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password_hash')) {
          user.password_hash = await User.hashPassword(user.password_hash);
          user.password_changed_at = new Date();
        }
      },
    },
  }
);