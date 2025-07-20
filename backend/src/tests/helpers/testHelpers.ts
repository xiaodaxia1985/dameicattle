import { Sequelize, DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '@/app';

let sequelize: Sequelize;

export const setupTestDatabase = async (): Promise<Sequelize> => {
  if (sequelize) {
    return sequelize;
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: ':memory:', // Use in-memory SQLite for tests
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
    },
  });

  // Define test models directly to avoid import issues
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    permissions: {
      type: DataTypes.JSON, // Use JSON instead of JSONB for SQLite
      allowNull: false,
      defaultValue: [],
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'roles',
    timestamps: false,
    underscored: true,
  });

  const Base = sequelize.define('Base', {
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
      unique: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    area: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    manager_id: {
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
  }, {
    tableName: 'bases',
    timestamps: true,
    underscored: true,
  });

  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    real_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
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
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: async (user: any) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
      },
      beforeUpdate: async (user: any) => {
        if (user.changed('password_hash')) {
          user.password_hash = await bcrypt.hash(user.password_hash, 12);
        }
      },
    },
  });

  const SecurityLog = sequelize.define('SecurityLog', {
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
      type: DataTypes.JSON, // Use JSON instead of JSONB for SQLite
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'security_logs',
    timestamps: false,
    underscored: true,
  });

  // Define associations
  User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
  Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
  
  User.belongsTo(Base, { foreignKey: 'base_id', as: 'base' });
  Base.hasMany(User, { foreignKey: 'base_id', as: 'users' });
  
  Base.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });
  User.hasOne(Base, { foreignKey: 'manager_id', as: 'managed_base' });
  
  SecurityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  User.hasMany(SecurityLog, { foreignKey: 'user_id', as: 'security_logs' });

  // Sync models
  await sequelize.sync({ force: true });

  // Create default roles
  await Role.bulkCreate([
    {
      name: 'system_admin',
      description: 'System Administrator',
      permissions: ['system:admin', 'bases:all', 'users:all', 'bases:create', 'bases:read', 'bases:update', 'bases:delete'],
    },
    {
      name: 'base_manager',
      description: 'Base Manager',
      permissions: ['bases:read', 'bases:update', 'users:read'],
    },
    {
      name: 'employee',
      description: 'Employee',
      permissions: ['bases:read'],
    },
  ]);

  return sequelize;
};

export const cleanupTestDatabase = async (): Promise<void> => {
  if (sequelize) {
    await sequelize.close();
  }
};

export const clearTestData = async (): Promise<void> => {
  if (sequelize) {
    const models = sequelize.models;
    await models.SecurityLog.destroy({ where: {}, truncate: true });
    await models.User.destroy({ where: {}, truncate: true });
    await models.Base.destroy({ where: {}, truncate: true });
    await models.Role.destroy({ where: {}, truncate: true });
  }
};

export const createTestUser = async (userData: {
  username: string;
  password: string;
  real_name: string;
  role_name: string;
  email?: string;
  phone?: string;
  base_id?: number;
}): Promise<any> => {
  const Role = sequelize.models.Role;
  const User = sequelize.models.User;

  const role = await Role.findOne({ where: { name: userData.role_name } });
  if (!role) {
    throw new Error(`Role ${userData.role_name} not found`);
  }

  return await User.create({
    username: userData.username,
    password_hash: userData.password,
    real_name: userData.real_name,
    email: userData.email,
    phone: userData.phone,
    role_id: role.id,
    base_id: userData.base_id,
    status: 'active',
  });
};

export const getAuthToken = async (username: string, password: string): Promise<string> => {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ username, password });

  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.body.error?.message || 'Unknown error'}`);
  }

  return response.body.data.token;
};

export const createTestToken = (payload: any = {}) => {
  const defaultPayload = {
    id: 1,
    username: 'testuser',
    role: 'user',
    baseId: 1,
    ...payload
  };

  return jwt.sign(defaultPayload, process.env.JWT_SECRET || 'test-secret', {
    expiresIn: '1h'
  });
};

export const createAdminToken = () => {
  return createTestToken({
    id: 1,
    username: 'admin',
    role: 'admin',
    baseId: null
  });
};

export const createManagerToken = (baseId: number = 1) => {
  return createTestToken({
    id: 2,
    username: 'manager',
    role: 'manager',
    baseId
  });
};

export const createUserToken = (baseId: number = 1) => {
  return createTestToken({
    id: 3,
    username: 'user',
    role: 'user',
    baseId
  });
};

export const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`
});

export const mockAuthMiddleware = (user: any = null) => {
  return (req: any, res: any, next: any) => {
    req.user = user || {
      id: 1,
      username: 'testuser',
      role: 'user',
      baseId: 1
    };
    next();
  };
};