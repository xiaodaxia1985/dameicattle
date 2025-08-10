const express = require('express');
const { Sequelize, DataTypes, Op } = require('sequelize');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Database configuration
const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_NAME = 'cattle_management',
  DB_USER = 'postgres',
  DB_PASSWORD = 'dianxin99',
  NODE_ENV = 'development',
} = process.env;

// Initialize Sequelize
const sequelize = new Sequelize({
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
  dialect: 'postgres',
  logging: NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
  timezone: '+08:00',
});

// Define Base model
const Base = sequelize.define('Base', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100],
      notEmpty: true,
    },
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [2, 50],
      notEmpty: true,
    },
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    validate: {
      min: -90,
      max: 90,
    },
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    validate: {
      min: -180,
      max: 180,
    },
  },
  area: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  manager_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'bases',
  timestamps: true,
  underscored: true,
});

// Define User model (simplified for manager relationship)
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  real_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

// Define Barn model
const Barn = sequelize.define('Barn', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      len: [2, 100],
      notEmpty: true,
    },
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      len: [2, 50],
      notEmpty: true,
    },
  },
  base_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'bases',
      key: 'id',
    },
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  current_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
  barn_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'dairy',
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
}, {
  tableName: 'barns',
  timestamps: true,
  underscored: true,
});

// Define associations
Base.belongsTo(User, { as: 'manager', foreignKey: 'manager_id' });
User.hasOne(Base, { as: 'managedBase', foreignKey: 'manager_id' });

Base.hasMany(Barn, { as: 'barns', foreignKey: 'base_id' });
Barn.belongsTo(Base, { as: 'base', foreignKey: 'base_id' });

// Middleware
app.use(express.json());

// Response wrapper middleware
app.use((req, res, next) => {
  res.success = (data, message = 'Success', statusCode = 200) => {
    res.status(statusCode).json({
      success: true,
      data,
      message
    });
  };

  res.error = (message = 'Error', statusCode = 500, code = 'INTERNAL_ERROR', details = null) => {
    res.status(statusCode).json({
      success: false,
      message,
      code,
      details
    });
  };

  next();
});

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'base-service',
    name: 'Base Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/base/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'base-service',
    name: 'Base Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Basic endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Base Service API',
    service: 'base-service',
    version: '1.0.0',
    endpoints: ['/health', '/api/v1/base/health', '/api/v1/base/bases']
  });
});

// Business API endpoints

// GET /api/v1/base/bases - 获取基地列表
app.get('/api/v1/base/bases', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, manager_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (manager_id) {
      whereClause.manager_id = manager_id;
    }

    const { count, rows } = await Base.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'real_name', 'username', 'phone', 'email'],
          required: false,
        }
      ],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.success({
      bases: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    }, '获取基地列表成功');
  } catch (error) {
    console.error('Error fetching bases:', error);
    res.error('获取基地列表失败', 500, 'FETCH_BASES_ERROR');
  }
});

// GET /api/v1/base/bases/all - 获取所有基地（不分页）
app.get('/api/v1/base/bases/all', async (req, res) => {
  try {
    const bases = await Base.findAll({
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'real_name', 'username', 'phone', 'email'],
          required: false,
        }
      ],
      order: [['name', 'ASC']],
    });

    res.success(bases, '获取基地列表成功');
  } catch (error) {
    console.error('Error fetching all bases:', error);
    res.error('获取基地列表失败', 500, 'FETCH_ALL_BASES_ERROR');
  }
});

// GET /api/v1/base/bases/:id - 获取基地详情
app.get('/api/v1/base/bases/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Handle special case where 'all' is passed as ID
    if (id === 'all') {
      return res.error('无效的基地ID，请使用数字ID', 400, 'INVALID_BASE_ID');
    }

    // Validate that ID is a number
    const baseId = parseInt(id, 10);
    if (isNaN(baseId)) {
      return res.error('基地ID必须是数字', 400, 'INVALID_BASE_ID');
    }

    const base = await Base.findByPk(baseId, {
      include: [
        {
          model: User,
          as: 'manager',
          attributes: ['id', 'real_name', 'username', 'phone', 'email'],
          required: false,
        }
      ],
    });

    if (!base) {
      return res.error('基地不存在', 404, 'BASE_NOT_FOUND');
    }

    res.success({ base: base.toJSON() }, '获取基地详情成功');
  } catch (error) {
    console.error('Error fetching base:', error);
    res.error('获取基地详情失败', 500, 'FETCH_BASE_ERROR');
  }
});

// POST /api/v1/base/bases - 创建基地
app.post('/api/v1/base/bases', async (req, res) => {
  try {
    const { name, code, address, latitude, longitude, area, manager_id } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.error('基地名称和编码不能为空', 400, 'MISSING_REQUIRED_FIELDS');
    }

    // Check if code already exists
    const existingBase = await Base.findOne({ where: { code } });
    if (existingBase) {
      return res.error('基地编码已存在', 409, 'BASE_CODE_EXISTS');
    }

    // Check if manager exists and is not already managing another base
    if (manager_id) {
      const manager = await User.findByPk(manager_id);
      if (!manager) {
        return res.error('指定的管理员不存在', 400, 'MANAGER_NOT_FOUND');
      }

      const existingManagedBase = await Base.findOne({ where: { manager_id } });
      if (existingManagedBase) {
        return res.error('该管理员已经管理其他基地', 400, 'MANAGER_ALREADY_ASSIGNED');
      }
    }

    const base = await Base.create({
      name,
      code,
      address,
      latitude,
      longitude,
      area,
      manager_id,
    });

    console.log(`Base created: ${name} (${code})`);

    res.success({ base: base.toJSON() }, '基地创建成功', 201);
  } catch (error) {
    console.error('Error creating base:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.error('数据验证失败', 422, 'VALIDATION_ERROR', error.errors);
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.error('基地编码已存在', 409, 'BASE_CODE_EXISTS');
    }
    res.error('创建基地失败', 500, 'CREATE_BASE_ERROR');
  }
});

// PUT /api/v1/base/bases/:id - 更新基地
app.put('/api/v1/base/bases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, address, latitude, longitude, area, manager_id } = req.body;

    const base = await Base.findByPk(id);
    if (!base) {
      return res.error('基地不存在', 404, 'BASE_NOT_FOUND');
    }

    // Check if code already exists (excluding current base)
    if (code && code !== base.code) {
      const existingBase = await Base.findOne({
        where: {
          code,
          id: { [Op.ne]: id }
        }
      });
      if (existingBase) {
        return res.error('基地编码已存在', 409, 'BASE_CODE_EXISTS');
      }
    }

    // Check if manager exists and is not already managing another base
    if (manager_id && manager_id !== base.manager_id) {
      const manager = await User.findByPk(manager_id);
      if (!manager) {
        return res.error('指定的管理员不存在', 400, 'MANAGER_NOT_FOUND');
      }

      const existingManagedBase = await Base.findOne({
        where: {
          manager_id,
          id: { [Op.ne]: id }
        }
      });
      if (existingManagedBase) {
        return res.error('该管理员已经管理其他基地', 400, 'MANAGER_ALREADY_ASSIGNED');
      }
    }

    await base.update({
      name,
      code,
      address,
      latitude,
      longitude,
      area,
      manager_id,
    });

    console.log(`Base updated: ${base.name} (${base.code})`);

    res.success({ base: base.toJSON() }, '基地更新成功');
  } catch (error) {
    console.error('Error updating base:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.error('数据验证失败', 422, 'VALIDATION_ERROR', error.errors);
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.error('基地编码已存在', 409, 'BASE_CODE_EXISTS');
    }
    res.error('更新基地失败', 500, 'UPDATE_BASE_ERROR');
  }
});

// DELETE /api/v1/base/bases/:id - 删除基地
app.delete('/api/v1/base/bases/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const base = await Base.findByPk(id);
    if (!base) {
      return res.error('基地不存在', 404, 'BASE_NOT_FOUND');
    }

    // Check if base has associated data (users, barns, cattle, etc.)
    try {
      const associatedUsers = await User.count({ where: { base_id: id } });
      if (associatedUsers > 0) {
        return res.error('基地下还有用户，无法删除', 400, 'BASE_HAS_USERS', { userCount: associatedUsers });
      }

      // Check for barns (if barn table exists)
      const [barnCount] = await sequelize.query(
        'SELECT COUNT(*) as count FROM barns WHERE base_id = :baseId',
        {
          replacements: { baseId: id },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (barnCount && barnCount.count > 0) {
        return res.error('基地下还有牛棚，无法删除', 400, 'BASE_HAS_BARNS', { barnCount: barnCount.count });
      }
    } catch (error) {
      // If related tables don't exist yet, continue with deletion
      console.warn('Could not check for related data:', error.message);
    }

    await base.destroy();

    console.log(`Base deleted: ${base.name} (${base.code})`);

    res.success(null, '基地删除成功');
  } catch (error) {
    console.error('Error deleting base:', error);
    res.error('删除基地失败', 500, 'DELETE_BASE_ERROR');
  }
});

// GET /api/v1/base/bases/:id/statistics - 获取基地统计信息
app.get('/api/v1/base/bases/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;

    const base = await Base.findByPk(id);
    if (!base) {
      return res.error('基地不存在', 404, 'BASE_NOT_FOUND');
    }

    // Get statistics using raw queries since not all models may exist yet
    const statistics = {
      base_info: base.toJSON(),
      user_count: 0,
      barn_count: 0,
      cattle_count: 0,
      healthy_cattle_count: 0,
      sick_cattle_count: 0,
      treatment_cattle_count: 0,
      feeding_records_count: 0,
      health_records_count: 0,
    };

    try {
      // User count
      const userCount = await User.count({ where: { base_id: id } });
      statistics.user_count = userCount;

      // Barn count
      const [barnResult] = await sequelize.query(
        'SELECT COUNT(*) as count FROM barns WHERE base_id = :baseId',
        {
          replacements: { baseId: id },
          type: sequelize.QueryTypes.SELECT,
        }
      );
      statistics.barn_count = barnResult?.count || 0;

      // Cattle statistics
      const [cattleResult] = await sequelize.query(
        `SELECT 
          COUNT(*) as total_count,
          COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_count,
          COUNT(CASE WHEN health_status = 'sick' THEN 1 END) as sick_count,
          COUNT(CASE WHEN health_status = 'treatment' THEN 1 END) as treatment_count
         FROM cattle WHERE base_id = :baseId`,
        {
          replacements: { baseId: id },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (cattleResult) {
        statistics.cattle_count = cattleResult.total_count || 0;
        statistics.healthy_cattle_count = cattleResult.healthy_count || 0;
        statistics.sick_cattle_count = cattleResult.sick_count || 0;
        statistics.treatment_cattle_count = cattleResult.treatment_count || 0;
      }

      // Feeding records count (last 30 days)
      const [feedingResult] = await sequelize.query(
        `SELECT COUNT(*) as count FROM feeding_records 
         WHERE base_id = :baseId AND feeding_date >= CURRENT_DATE - INTERVAL '30 days'`,
        {
          replacements: { baseId: id },
          type: sequelize.QueryTypes.SELECT,
        }
      );
      statistics.feeding_records_count = feedingResult?.count || 0;

      // Health records count (last 30 days)
      const [healthResult] = await sequelize.query(
        `SELECT COUNT(*) as count FROM health_records hr
         JOIN cattle c ON hr.cattle_id = c.id
         WHERE c.base_id = :baseId AND hr.diagnosis_date >= CURRENT_DATE - INTERVAL '30 days'`,
        {
          replacements: { baseId: id },
          type: sequelize.QueryTypes.SELECT,
        }
      );
      statistics.health_records_count = healthResult?.count || 0;

    } catch (error) {
      // If some tables don't exist yet, continue with available data
      console.warn('Some statistics could not be calculated due to missing tables:', error.message);
    }

    res.success({ statistics }, '获取基地统计信息成功');
  } catch (error) {
    console.error('Error fetching base statistics:', error);
    res.error('获取基地统计信息失败', 500, 'FETCH_BASE_STATISTICS_ERROR');
  }
});

// GET /api/v1/base/managers/available - 获取可用管理员列表
app.get('/api/v1/base/managers/available', async (req, res) => {
  try {
    // Get users who are not already managing a base
    const managedBaseIds = await Base.findAll({
      attributes: ['manager_id'],
      where: {
        manager_id: { [Op.ne]: null }
      }
    });

    const managedUserIds = managedBaseIds.map(base => base.manager_id).filter(id => id !== null);

    const availableManagers = await User.findAll({
      where: {
        id: { [Op.notIn]: managedUserIds.length > 0 ? managedUserIds : [-1] },
        // status: 'active', // Uncomment if you have a status field
      },
      attributes: ['id', 'real_name', 'username', 'phone', 'email'],
      order: [['real_name', 'ASC']],
    });

    res.success({ managers: availableManagers }, '获取可用管理员列表成功');
  } catch (error) {
    console.error('Error fetching available managers:', error);
    res.error('获取可用管理员列表失败', 500, 'FETCH_MANAGERS_ERROR');
  }
});

// ==================== 牛棚管理 API ====================

// GET /api/v1/base/barns - 获取牛棚列表
app.get('/api/v1/base/barns', async (req, res) => {
  try {
    const { page = 1, limit = 20, base_id, barn_type, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereClause = {};

    if (base_id) {
      whereClause.base_id = base_id;
    }

    if (barn_type) {
      whereClause.barn_type = barn_type;
    }

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { code: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Barn.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Base,
          as: 'base',
          attributes: ['id', 'name', 'code'],
          required: false,
        }
      ],
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
    });

    res.success({
      barns: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    }, '获取牛棚列表成功');
  } catch (error) {
    console.error('Error fetching barns:', error);
    res.error('获取牛棚列表失败', 500, 'FETCH_BARNS_ERROR');
  }
});

// GET /api/v1/base/bases/:id/barns - 获取指定基地的牛棚列表
app.get('/api/v1/base/bases/:id/barns', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate base exists
    const base = await Base.findByPk(id);
    if (!base) {
      return res.error('基地不存在', 404, 'BASE_NOT_FOUND');
    }

    // Use raw query to get barns
    const barns = await sequelize.query(
      'SELECT * FROM barns WHERE base_id = :baseId ORDER BY created_at DESC',
      {
        replacements: { baseId: id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log('Raw barns query result:', barns);
    console.log('Barns type:', typeof barns);
    console.log('Barns is array:', Array.isArray(barns));
    console.log('Barns length:', barns ? barns.length : 'null');

    res.success({
      barns: barns || [],
      base_info: base.toJSON(),
      pagination: {
        total: barns ? barns.length : 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    }, '获取基地牛棚列表成功');
  } catch (error) {
    console.error('Error fetching barns by base:', error);
    res.error('获取基地牛棚列表失败', 500, 'FETCH_BASE_BARNS_ERROR');
  }
});

// GET /api/v1/base/barns/statistics - 获取牛棚统计信息
app.get('/api/v1/base/barns/statistics', async (req, res) => {
  try {
    const { base_id } = req.query;

    const whereClause = {};
    if (base_id) {
      whereClause.base_id = base_id;
    }

    // Get barn statistics
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_barns,
        SUM(capacity) as total_capacity,
        SUM(current_count) as total_current,
        AVG(capacity) as avg_capacity,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_barns,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_barns,
        COUNT(CASE WHEN current_count >= capacity THEN 1 END) as full_barns,
        COUNT(CASE WHEN current_count = 0 THEN 1 END) as empty_barns
      FROM barns 
      ${base_id ? 'WHERE base_id = :baseId' : ''}
    `, {
      replacements: { baseId: base_id },
      type: sequelize.QueryTypes.SELECT,
    });

    // Get barn type distribution
    const [typeStats] = await sequelize.query(`
      SELECT 
        barn_type,
        COUNT(*) as count,
        SUM(capacity) as total_capacity,
        SUM(current_count) as current_count
      FROM barns 
      ${base_id ? 'WHERE base_id = :baseId' : ''}
      GROUP BY barn_type
      ORDER BY count DESC
    `, {
      replacements: { baseId: base_id },
      type: sequelize.QueryTypes.SELECT,
    });

    res.success({
      overview: stats,
      by_type: typeStats,
    }, '获取牛棚统计信息成功');
  } catch (error) {
    console.error('Error fetching barn statistics:', error);
    res.error('获取牛棚统计信息失败', 500, 'FETCH_BARN_STATISTICS_ERROR');
  }
});

// GET /api/v1/base/barns/options - 获取牛棚选项（用于下拉选择）
app.get('/api/v1/base/barns/options', async (req, res) => {
  try {
    const { base_id } = req.query;

    const whereClause = { status: 'active' };
    if (base_id) {
      whereClause.base_id = base_id;
    }

    const barns = await Barn.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'code', 'base_id', 'capacity', 'current_count'],
      include: [
        {
          model: Base,
          as: 'base',
          attributes: ['id', 'name', 'code'],
          required: false,
        }
      ],
      order: [['name', 'ASC']],
    });

    const options = barns.map(barn => ({
      id: barn.id,
      name: barn.name,
      code: barn.code,
      base_id: barn.base_id,
      base_name: barn.base?.name,
      capacity: barn.capacity,
      current_count: barn.current_count,
      available_space: barn.capacity ? barn.capacity - barn.current_count : null
    }));

    res.success(options, '获取牛棚选项成功');
  } catch (error) {
    console.error('Error fetching barn options:', error);
    res.error('获取牛棚选项失败', 500, 'FETCH_BARN_OPTIONS_ERROR');
  }
});

// GET /api/v1/base/barns/:id - 获取牛棚详情
app.get('/api/v1/base/barns/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const barn = await Barn.findByPk(id, {
      include: [
        {
          model: Base,
          as: 'base',
          attributes: ['id', 'name', 'code', 'address'],
          required: false,
        }
      ],
    });

    if (!barn) {
      return res.error('牛棚不存在', 404, 'BARN_NOT_FOUND');
    }

    res.success({ barn: barn.toJSON() }, '获取牛棚详情成功');
  } catch (error) {
    console.error('Error fetching barn:', error);
    res.error('获取牛棚详情失败', 500, 'FETCH_BARN_ERROR');
  }
});

// POST /api/v1/base/barns - 创建牛棚
app.post('/api/v1/base/barns', async (req, res) => {
  try {
    const { name, code, base_id, capacity, barn_type, status, description } = req.body;

    // Validate required fields
    if (!name || !code || !base_id) {
      return res.error('牛棚名称、编码和基地ID不能为空', 400, 'MISSING_REQUIRED_FIELDS');
    }

    // Validate base exists
    const base = await Base.findByPk(base_id);
    if (!base) {
      return res.error('指定的基地不存在', 400, 'BASE_NOT_FOUND');
    }

    // Check if code already exists within the same base
    const existingBarn = await Barn.findOne({
      where: {
        code,
        base_id
      }
    });
    if (existingBarn) {
      return res.error('该基地下牛棚编码已存在', 409, 'BARN_CODE_EXISTS');
    }

    const barn = await Barn.create({
      name,
      code,
      base_id,
      capacity,
      barn_type: barn_type || 'dairy',
      status: status || 'active',
      description,
    });

    console.log(`Barn created: ${name} (${code}) in base ${base_id}`);

    // Fetch the created barn with associations
    const createdBarn = await Barn.findByPk(barn.id, {
      include: [
        {
          model: Base,
          as: 'base',
          attributes: ['id', 'name', 'code'],
          required: false,
        }
      ],
    });

    res.success({ barn: createdBarn.toJSON() }, '牛棚创建成功', 201);
  } catch (error) {
    console.error('Error creating barn:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.error('数据验证失败', 422, 'VALIDATION_ERROR', error.errors);
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.error('牛棚编码已存在', 409, 'BARN_CODE_EXISTS');
    }
    res.error('创建牛棚失败', 500, 'CREATE_BARN_ERROR');
  }
});

// PUT /api/v1/base/barns/:id - 更新牛棚
app.put('/api/v1/base/barns/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, base_id, capacity, barn_type, status, description } = req.body;

    const barn = await Barn.findByPk(id);
    if (!barn) {
      return res.error('牛棚不存在', 404, 'BARN_NOT_FOUND');
    }

    // Validate base exists if base_id is being changed
    if (base_id && base_id !== barn.base_id) {
      const base = await Base.findByPk(base_id);
      if (!base) {
        return res.error('指定的基地不存在', 400, 'BASE_NOT_FOUND');
      }
    }

    // Check if code already exists within the same base (excluding current barn)
    if (code && (code !== barn.code || base_id !== barn.base_id)) {
      const existingBarn = await Barn.findOne({
        where: {
          code,
          base_id: base_id || barn.base_id,
          id: { [Op.ne]: id }
        }
      });
      if (existingBarn) {
        return res.error('该基地下牛棚编码已存在', 409, 'BARN_CODE_EXISTS');
      }
    }

    await barn.update({
      name,
      code,
      base_id,
      capacity,
      barn_type,
      status,
      description,
    });

    console.log(`Barn updated: ${barn.name} (${barn.code})`);

    // Fetch updated barn with associations
    const updatedBarn = await Barn.findByPk(barn.id, {
      include: [
        {
          model: Base,
          as: 'base',
          attributes: ['id', 'name', 'code'],
          required: false,
        }
      ],
    });

    res.success({ barn: updatedBarn.toJSON() }, '牛棚更新成功');
  } catch (error) {
    console.error('Error updating barn:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.error('数据验证失败', 422, 'VALIDATION_ERROR', error.errors);
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.error('牛棚编码已存在', 409, 'BARN_CODE_EXISTS');
    }
    res.error('更新牛棚失败', 500, 'UPDATE_BARN_ERROR');
  }
});

// DELETE /api/v1/base/barns/:id - 删除牛棚
app.delete('/api/v1/base/barns/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const barn = await Barn.findByPk(id);
    if (!barn) {
      return res.error('牛棚不存在', 404, 'BARN_NOT_FOUND');
    }

    // Check if barn has cattle
    if (barn.current_count > 0) {
      return res.error('牛棚内还有牛只，无法删除', 400, 'BARN_HAS_CATTLE', { cattleCount: barn.current_count });
    }

    // Additional check for cattle in database (if cattle table exists)
    try {
      const [cattleResult] = await sequelize.query(
        'SELECT COUNT(*) as count FROM cattle WHERE barn_id = :barnId',
        {
          replacements: { barnId: id },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (cattleResult && cattleResult.count > 0) {
        return res.error('牛棚内还有牛只，无法删除', 400, 'BARN_HAS_CATTLE', { cattleCount: cattleResult.count });
      }
    } catch (error) {
      // If cattle table doesn't exist yet, continue with deletion
      console.warn('Could not check for cattle in barn:', error.message);
    }

    await barn.destroy();

    console.log(`Barn deleted: ${barn.name} (${barn.code})`);

    res.success(null, '牛棚删除成功');
  } catch (error) {
    console.error('Error deleting barn:', error);
    res.error('删除牛棚失败', 500, 'DELETE_BARN_ERROR');
  }
});



// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    service: 'base-service',
    path: req.originalUrl
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('Failed to connect to database');
      process.exit(1);
    }

    // Sync database models (development only)
    if (NODE_ENV === 'development') {
      try {
        await sequelize.sync({ force: false, alter: false });
        console.log('Database models synchronized');
      } catch (error) {
        console.warn('Database sync failed:', error.message);
      }
    }

    app.listen(port, '0.0.0.0', () => {
      console.log(`base-service listening on port ${port}`);
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`Database: ${DB_NAME}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  try {
    await sequelize.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  try {
    await sequelize.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
  process.exit(0);
});

startServer();