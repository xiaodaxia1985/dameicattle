import { Sequelize, DataTypes } from 'sequelize';

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
  SecurityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  User.hasMany(SecurityLog, { foreignKey: 'user_id', as: 'security_logs' });

  // Sync models
  await sequelize.sync({ force: true });

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
    await models.Role.destroy({ where: {}, truncate: true });
  }
};