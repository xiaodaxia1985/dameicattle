const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const app = express();
const port = process.env.PORT || 3003;

// Database configuration
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cattle_management',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'dianxin99',
  logging: console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Define models
const Cattle = sequelize.define('Cattle', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  ear_tag: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
  breed: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  gender: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      isIn: [['male', 'female']],
    },
  },
  birth_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 9999.99,
    },
  },
  health_status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'healthy',
    validate: {
      isIn: [['healthy', 'sick', 'treatment']],
    },
  },
  base_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  barn_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  photos: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  parent_male_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  parent_female_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  source: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'purchased',
    validate: {
      isIn: [['born', 'purchased', 'transferred']],
    },
  },
  purchase_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0,
    },
  },
  purchase_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'sold', 'dead', 'transferred']],
    },
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'cattle',
  timestamps: true,
  underscored: true,
});

const CattleEvent = sequelize.define('CattleEvent', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  cattle_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  event_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: [[
        'birth', 'born', 'purchase', 'purchased', 'transfer_in', 'transfer_out', 'transferred',
        'weight_record', 'health_check', 'vaccination', 'treatment', 'breeding', 'pregnancy_check',
        'calving', 'weaning', 'sale', 'sold', 'death', 'dead', 'deleted', 'other'
      ]],
    },
  },
  event_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  data: {
    type: DataTypes.JSONB,
    defaultValue: {},
  },
  operator_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'cattle_events',
  timestamps: true,
  underscored: true,
});

// Define associations
Cattle.hasMany(CattleEvent, { as: 'events', foreignKey: 'cattle_id' });
CattleEvent.belongsTo(Cattle, { as: 'cattle', foreignKey: 'cattle_id' });

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

  res.error = (message, statusCode = 500, code = 'ERROR', details = null) => {
    res.status(statusCode).json({
      success: false,
      message,
      code,
      details
    });
  };

  next();
});

// Health check endpoint (direct access)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'cattle-service',
    name: 'Cattle Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for API Gateway
app.get('/api/v1/cattle/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'cattle-service',
    name: 'Cattle Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Cattle Service API',
    service: 'cattle-service',
    version: '1.0.0',
    endpoints: ['/health', '/api/v1/cattle/health', '/api/status']
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    service: 'cattle-service',
    status: 'running',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// API v1 cattle routes
app.get('/api/v1/cattle/status', (req, res) => {
  res.json({
    service: 'cattle-service',
    status: 'running',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// 牛只管理路由
// GET /api/v1/cattle/cattle - 获取牛只列表
app.get('/api/v1/cattle/cattle', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      base_id, 
      barn_id, 
      breed, 
      gender, 
      health_status, 
      status = 'active',
      search 
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = {};

    // 构建查询条件
    if (base_id) whereClause.base_id = base_id;
    if (barn_id) whereClause.barn_id = barn_id;
    if (breed) whereClause.breed = { [Sequelize.Op.iLike]: `%${breed}%` };
    if (gender) whereClause.gender = gender;
    if (health_status) whereClause.health_status = health_status;
    if (status) whereClause.status = status;

    // 搜索条件
    if (search) {
      whereClause[Sequelize.Op.or] = [
        { ear_tag: { [Sequelize.Op.iLike]: `%${search}%` } },
        { breed: { [Sequelize.Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: cattle } = await Cattle.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: CattleEvent,
          as: 'events',
          limit: 5,
          order: [['event_date', 'DESC']],
          required: false
        }
      ]
    });

    // 获取基地和牛棚信息（通过原始查询）
    const cattleWithDetails = await Promise.all(
      cattle.map(async (cow) => {
        const cowData = cow.toJSON();
        
        // 获取基地信息
        if (cowData.base_id) {
          const [baseInfo] = await sequelize.query(
            'SELECT id, name, code FROM bases WHERE id = :baseId',
            {
              replacements: { baseId: cowData.base_id },
              type: Sequelize.QueryTypes.SELECT,
            }
          );
          cowData.base_info = baseInfo;
        }

        // 获取牛棚信息
        if (cowData.barn_id) {
          const [barnInfo] = await sequelize.query(
            'SELECT id, name, code FROM barns WHERE id = :barnId',
            {
              replacements: { barnId: cowData.barn_id },
              type: Sequelize.QueryTypes.SELECT,
            }
          );
          cowData.barn_info = barnInfo;
        }

        return cowData;
      })
    );

    const totalPages = Math.ceil(count / limit);

    res.success({
      cattle: cattleWithDetails,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    }, '获取牛只列表成功');
  } catch (error) {
    console.error('Error fetching cattle list:', error);
    res.error('获取牛只列表失败', 500, 'FETCH_CATTLE_ERROR');
  }
});

// GET /api/v1/cattle/cattle/statistics - 获取牛只统计
app.get('/api/v1/cattle/cattle/statistics', async (req, res) => {
  try {
    const { base_id, barn_id, date_from, date_to } = req.query;

    const whereClause = { status: 'active' };
    if (base_id) whereClause.base_id = base_id;
    if (barn_id) whereClause.barn_id = barn_id;

    // 基础统计
    const [basicStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_count,
        COUNT(CASE WHEN health_status = 'sick' THEN 1 END) as sick_count,
        COUNT(CASE WHEN health_status = 'treatment' THEN 1 END) as treatment_count,
        COUNT(CASE WHEN gender = 'male' THEN 1 END) as male_count,
        COUNT(CASE WHEN gender = 'female' THEN 1 END) as female_count,
        AVG(weight) as avg_weight,
        MIN(weight) as min_weight,
        MAX(weight) as max_weight
      FROM cattle 
      WHERE status = 'active'
      ${base_id ? 'AND base_id = :baseId' : ''}
      ${barn_id ? 'AND barn_id = :barnId' : ''}
    `, {
      replacements: { baseId: base_id, barnId: barn_id },
      type: Sequelize.QueryTypes.SELECT,
    });

    // 按品种统计
    const breedStats = await sequelize.query(`
      SELECT 
        breed,
        COUNT(*) as count,
        AVG(weight) as avg_weight
      FROM cattle 
      WHERE status = 'active'
      ${base_id ? 'AND base_id = :baseId' : ''}
      ${barn_id ? 'AND barn_id = :barnId' : ''}
      GROUP BY breed
      ORDER BY count DESC
    `, {
      replacements: { baseId: base_id, barnId: barn_id },
      type: Sequelize.QueryTypes.SELECT,
    });

    // 按年龄组统计
    const [ageStats] = await sequelize.query(`
      SELECT 
        COUNT(CASE WHEN birth_date IS NULL OR birth_date > CURRENT_DATE - INTERVAL '1 year' THEN 1 END) as calf_count,
        COUNT(CASE WHEN birth_date <= CURRENT_DATE - INTERVAL '1 year' AND birth_date > CURRENT_DATE - INTERVAL '3 years' THEN 1 END) as young_count,
        COUNT(CASE WHEN birth_date <= CURRENT_DATE - INTERVAL '3 years' THEN 1 END) as adult_count
      FROM cattle 
      WHERE status = 'active'
      ${base_id ? 'AND base_id = :baseId' : ''}
      ${barn_id ? 'AND barn_id = :barnId' : ''}
    `, {
      replacements: { baseId: base_id, barnId: barn_id },
      type: Sequelize.QueryTypes.SELECT,
    });

    // 按来源统计
    const sourceStats = await sequelize.query(`
      SELECT 
        source,
        COUNT(*) as count
      FROM cattle 
      WHERE status = 'active'
      ${base_id ? 'AND base_id = :baseId' : ''}
      ${barn_id ? 'AND barn_id = :barnId' : ''}
      GROUP BY source
      ORDER BY count DESC
    `, {
      replacements: { baseId: base_id, barnId: barn_id },
      type: Sequelize.QueryTypes.SELECT,
    });

    // 最近事件统计
    const recentEvents = await sequelize.query(`
      SELECT 
        event_type,
        COUNT(*) as count
      FROM cattle_events ce
      JOIN cattle c ON ce.cattle_id = c.id
      WHERE ce.event_date >= CURRENT_DATE - INTERVAL '30 days'
      AND c.status = 'active'
      ${base_id ? 'AND c.base_id = :baseId' : ''}
      ${barn_id ? 'AND c.barn_id = :barnId' : ''}
      GROUP BY event_type
      ORDER BY count DESC
    `, {
      replacements: { baseId: base_id, barnId: barn_id },
      type: Sequelize.QueryTypes.SELECT,
    });

    const statistics = {
      overview: basicStats,
      by_breed: breedStats.reduce((acc, item) => {
        acc[item.breed] = {
          count: parseInt(item.count),
          avg_weight: parseFloat(item.avg_weight || 0)
        };
        return acc;
      }, {}),
      by_gender: {
        male: parseInt(basicStats.male_count),
        female: parseInt(basicStats.female_count)
      },
      by_age_group: {
        calf: parseInt(ageStats.calf_count),
        young: parseInt(ageStats.young_count),
        adult: parseInt(ageStats.adult_count)
      },
      by_source: sourceStats.reduce((acc, item) => {
        acc[item.source] = parseInt(item.count);
        return acc;
      }, {}),
      recent_events: recentEvents.reduce((acc, item) => {
        acc[item.event_type] = parseInt(item.count);
        return acc;
      }, {})
    };

    res.success(statistics, '获取牛只统计成功');
  } catch (error) {
    console.error('Error fetching cattle statistics:', error);
    res.error('获取牛只统计失败', 500, 'FETCH_STATISTICS_ERROR');
  }
});

// GET /api/v1/cattle/cattle/scan/:earTag - 通过耳标扫描获取牛只
app.get('/api/v1/cattle/cattle/scan/:earTag', async (req, res) => {
  try {
    const { earTag } = req.params;

    const cattle = await Cattle.findOne({
      where: { 
        ear_tag: earTag,
        status: 'active'
      },
      include: [
        {
          model: CattleEvent,
          as: 'events',
          limit: 3,
          order: [['event_date', 'DESC']],
          required: false
        }
      ]
    });

    if (!cattle) {
      return res.error('未找到该耳标的牛只', 404, 'CATTLE_NOT_FOUND');
    }

    const cattleData = cattle.toJSON();

    // 获取基地和牛棚信息
    if (cattleData.base_id) {
      const [baseInfo] = await sequelize.query(
        'SELECT id, name, code FROM bases WHERE id = :baseId',
        {
          replacements: { baseId: cattleData.base_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      cattleData.base_info = baseInfo;
    }

    if (cattleData.barn_id) {
      const [barnInfo] = await sequelize.query(
        'SELECT id, name, code FROM barns WHERE id = :barnId',
        {
          replacements: { barnId: cattleData.barn_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      cattleData.barn_info = barnInfo;
    }

    res.success(cattleData, '扫描牛只成功');
  } catch (error) {
    console.error('Error scanning cattle:', error);
    res.error('扫描牛只失败', 500, 'SCAN_CATTLE_ERROR');
  }
});

// POST /api/v1/cattle/cattle/batch - 批量操作牛只
app.post('/api/v1/cattle/cattle/batch', async (req, res) => {
  try {
    const { action, cattle_ids, data = {}, operator_id } = req.body;

    if (!action || !cattle_ids || !Array.isArray(cattle_ids)) {
      return res.error('操作类型和牛只ID列表不能为空', 400, 'MISSING_REQUIRED_FIELDS');
    }

    const results = [];
    const errors = [];

    for (const cattle_id of cattle_ids) {
      try {
        const cattle = await Cattle.findByPk(cattle_id);
        if (!cattle) {
          errors.push({ cattle_id, error: '牛只不存在' });
          continue;
        }

        switch (action) {
          case 'update_health_status':
            if (data.health_status) {
              await cattle.update({ health_status: data.health_status });
              await CattleEvent.create({
                cattle_id,
                event_type: 'health_check',
                event_date: new Date().toISOString().split('T')[0],
                description: `批量更新健康状态: ${data.health_status}`,
                data: { health_status: data.health_status },
                operator_id
              });
              results.push({ cattle_id, success: true });
            }
            break;

          case 'transfer_barn':
            if (data.barn_id) {
              await cattle.update({ barn_id: data.barn_id });
              await CattleEvent.create({
                cattle_id,
                event_type: 'transfer_in',
                event_date: new Date().toISOString().split('T')[0],
                description: `批量转移到牛棚: ${data.barn_id}`,
                data: { barn_id: data.barn_id },
                operator_id
              });
              results.push({ cattle_id, success: true });
            }
            break;

          case 'record_weight':
            if (data.weight) {
              await cattle.update({ weight: data.weight });
              await CattleEvent.create({
                cattle_id,
                event_type: 'weight_record',
                event_date: new Date().toISOString().split('T')[0],
                description: `批量称重记录: ${data.weight}kg`,
                data: { weight: data.weight },
                operator_id
              });
              results.push({ cattle_id, success: true });
            }
            break;

          default:
            errors.push({ cattle_id, error: '不支持的操作类型' });
        }
      } catch (error) {
        errors.push({ cattle_id, error: error.message });
      }
    }

    res.success({
      success_count: results.length,
      error_count: errors.length,
      results,
      errors
    }, '批量操作完成');
  } catch (error) {
    console.error('Error in batch operation:', error);
    res.error('批量操作失败', 500, 'BATCH_OPERATION_ERROR');
  }
});

// GET /api/v1/cattle/cattle/:id - 获取牛只详情
app.get('/api/v1/cattle/cattle/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const cattle = await Cattle.findByPk(id, {
      include: [
        {
          model: CattleEvent,
          as: 'events',
          order: [['event_date', 'DESC']],
          required: false
        }
      ]
    });

    if (!cattle) {
      return res.error('牛只不存在', 404, 'CATTLE_NOT_FOUND');
    }

    const cattleData = cattle.toJSON();

    // 获取基地信息
    if (cattleData.base_id) {
      const [baseInfo] = await sequelize.query(
        'SELECT id, name, code, address FROM bases WHERE id = :baseId',
        {
          replacements: { baseId: cattleData.base_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      cattleData.base_info = baseInfo;
    }

    // 获取牛棚信息
    if (cattleData.barn_id) {
      const [barnInfo] = await sequelize.query(
        'SELECT id, name, code, capacity, current_count FROM barns WHERE id = :barnId',
        {
          replacements: { barnId: cattleData.barn_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      cattleData.barn_info = barnInfo;
    }

    // 获取供应商信息
    if (cattleData.supplier_id) {
      const [supplierInfo] = await sequelize.query(
        'SELECT id, name, code, contact_person FROM suppliers WHERE id = :supplierId',
        {
          replacements: { supplierId: cattleData.supplier_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      cattleData.supplier_info = supplierInfo;
    }

    // 获取父母信息
    if (cattleData.parent_male_id) {
      const [maleParent] = await sequelize.query(
        'SELECT id, ear_tag, breed FROM cattle WHERE id = :parentId',
        {
          replacements: { parentId: cattleData.parent_male_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      cattleData.male_parent = maleParent;
    }

    if (cattleData.parent_female_id) {
      const [femaleParent] = await sequelize.query(
        'SELECT id, ear_tag, breed FROM cattle WHERE id = :parentId',
        {
          replacements: { parentId: cattleData.parent_female_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      cattleData.female_parent = femaleParent;
    }

    res.success(cattleData, '获取牛只详情成功');
  } catch (error) {
    console.error('Error fetching cattle detail:', error);
    res.error('获取牛只详情失败', 500, 'FETCH_CATTLE_DETAIL_ERROR');
  }
});

// GET /api/v1/cattle/cattle/scan/:earTag - 通过耳标扫描获取牛只
app.get('/api/v1/cattle/cattle/scan/:earTag', async (req, res) => {
  try {
    const { earTag } = req.params;

    const cattle = await Cattle.findOne({
      where: { 
        ear_tag: earTag,
        status: 'active'
      },
      include: [
        {
          model: CattleEvent,
          as: 'events',
          limit: 3,
          order: [['event_date', 'DESC']],
          required: false
        }
      ]
    });

    if (!cattle) {
      return res.error('未找到该耳标的牛只', 404, 'CATTLE_NOT_FOUND');
    }

    const cattleData = cattle.toJSON();

    // 获取基地和牛棚信息
    if (cattleData.base_id) {
      const [baseInfo] = await sequelize.query(
        'SELECT id, name, code FROM bases WHERE id = :baseId',
        {
          replacements: { baseId: cattleData.base_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      cattleData.base_info = baseInfo;
    }

    if (cattleData.barn_id) {
      const [barnInfo] = await sequelize.query(
        'SELECT id, name, code FROM barns WHERE id = :barnId',
        {
          replacements: { barnId: cattleData.barn_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      cattleData.barn_info = barnInfo;
    }

    res.success(cattleData, '扫描牛只成功');
  } catch (error) {
    console.error('Error scanning cattle:', error);
    res.error('扫描牛只失败', 500, 'SCAN_CATTLE_ERROR');
  }
});

// POST /api/v1/cattle/cattle - 创建牛只
app.post('/api/v1/cattle/cattle', async (req, res) => {
  try {
    const {
      ear_tag,
      breed,
      gender,
      birth_date,
      weight,
      health_status = 'healthy',
      base_id,
      barn_id,
      photos = [],
      parent_male_id,
      parent_female_id,
      source = 'purchased',
      purchase_price,
      purchase_date,
      supplier_id,
      notes,
      operator_id
    } = req.body;

    // 验证必填字段
    if (!ear_tag || !breed || !gender || !base_id) {
      return res.error('耳标、品种、性别和基地ID不能为空', 400, 'MISSING_REQUIRED_FIELDS');
    }

    // 检查耳标是否已存在
    const existingCattle = await Cattle.findOne({
      where: { ear_tag }
    });

    if (existingCattle) {
      return res.error('该耳标已存在', 409, 'EAR_TAG_EXISTS');
    }

    // 验证基地是否存在
    const [baseExists] = await sequelize.query(
      'SELECT id FROM bases WHERE id = :baseId',
      {
        replacements: { baseId: base_id },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (!baseExists) {
      return res.error('指定的基地不存在', 400, 'BASE_NOT_FOUND');
    }

    // 验证牛棚是否存在（如果提供了牛棚ID）
    if (barn_id) {
      const [barnExists] = await sequelize.query(
        'SELECT id, capacity, current_count FROM barns WHERE id = :barnId AND base_id = :baseId',
        {
          replacements: { barnId: barn_id, baseId: base_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (!barnExists) {
        return res.error('指定的牛棚不存在或不属于该基地', 400, 'BARN_NOT_FOUND');
      }

      // 检查牛棚容量
      if (barnExists.current_count >= barnExists.capacity) {
        return res.error('牛棚已满，无法添加更多牛只', 400, 'BARN_FULL');
      }
    }

    // 处理日期字段，确保空值或无效日期被正确处理
    const processedBirthDate = birth_date && birth_date.trim() !== '' ? birth_date : null;
    const processedPurchaseDate = purchase_date && purchase_date.trim() !== '' ? purchase_date : null;
    
    // 处理数字字段，确保空值被正确处理
    const processedWeight = weight !== undefined && weight !== '' ? weight : null;
    const processedPurchasePrice = purchase_price !== undefined && purchase_price !== '' ? purchase_price : null;

    // 创建牛只记录
    const cattle = await Cattle.create({
      ear_tag,
      breed,
      gender,
      birth_date: processedBirthDate,
      weight: processedWeight,
      health_status,
      base_id,
      barn_id,
      photos,
      parent_male_id,
      parent_female_id,
      source,
      purchase_price: processedPurchasePrice,
      purchase_date: processedPurchaseDate,
      supplier_id,
      notes
    });

    // 创建牛只事件记录
    await CattleEvent.create({
      cattle_id: cattle.id,
      event_type: source === 'born' ? 'birth' : 'purchase',
      event_date: purchase_date || new Date().toISOString().split('T')[0],
      description: `Cattle ${source === 'born' ? 'birth' : 'purchase'} record`,
      data: {
        source,
        purchase_price,
        supplier_id,
        weight,
        health_status
      },
      operator_id
    });

    // 如果分配了牛棚，更新牛棚的当前数量（通过触发器自动处理）
    console.log(`Cattle created: ${ear_tag} (${breed}) in base ${base_id}`);

    res.success(cattle.toJSON(), '创建牛只成功', 201);
  } catch (error) {
    console.error('Error creating cattle:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.error('数据验证失败', 422, 'VALIDATION_ERROR', error.errors);
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.error('耳标已存在', 409, 'EAR_TAG_EXISTS');
    }
    res.error('创建牛只失败', 500, 'CREATE_CATTLE_ERROR');
  }
});

// PUT /api/v1/cattle/cattle/:id - 更新牛只
app.put('/api/v1/cattle/cattle/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ear_tag,
      breed,
      gender,
      birth_date,
      weight,
      health_status,
      base_id,
      barn_id,
      photos,
      parent_male_id,
      parent_female_id,
      source,
      purchase_price,
      purchase_date,
      supplier_id,
      notes,
      operator_id
    } = req.body;

    // 查找牛只
    const cattle = await Cattle.findByPk(id);
    if (!cattle) {
      return res.error('牛只不存在', 404, 'CATTLE_NOT_FOUND');
    }

    // 如果更新耳标，检查是否已存在
    if (ear_tag && ear_tag !== cattle.ear_tag) {
      const existingCattle = await Cattle.findOne({
        where: { 
          ear_tag,
          id: { [Sequelize.Op.ne]: id }
        }
      });

      if (existingCattle) {
        return res.error('该耳标已存在', 409, 'EAR_TAG_EXISTS');
      }
    }

    // 如果更新基地，验证基地是否存在
    if (base_id && base_id !== cattle.base_id) {
      const [baseExists] = await sequelize.query(
        'SELECT id FROM bases WHERE id = :baseId',
        {
          replacements: { baseId: base_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (!baseExists) {
        return res.error('指定的基地不存在', 400, 'BASE_NOT_FOUND');
      }
    }

    // 如果更新牛棚，验证牛棚是否存在
    if (barn_id && barn_id !== cattle.barn_id) {
      const [barnExists] = await sequelize.query(
        'SELECT id, capacity, current_count FROM barns WHERE id = :barnId AND base_id = :baseId',
        {
          replacements: { barnId: barn_id, baseId: base_id || cattle.base_id },
          type: Sequelize.QueryTypes.SELECT,
        }
      );

      if (!barnExists) {
        return res.error('指定的牛棚不存在或不属于该基地', 400, 'BARN_NOT_FOUND');
      }

      // 检查牛棚容量（如果是转入新牛棚）
      if (barnExists.current_count >= barnExists.capacity) {
        return res.error('牛棚已满，无法转入更多牛只', 400, 'BARN_FULL');
      }
    }

    // 记录更新前的状态
    const oldData = cattle.toJSON();

    // 处理日期字段，确保空值或无效日期被正确处理
    const processedBirthDate = birth_date !== undefined ? 
      (birth_date && birth_date.trim() !== '' ? birth_date : null) : 
      cattle.birth_date;
    const processedPurchaseDate = purchase_date !== undefined ? 
      (purchase_date && purchase_date.trim() !== '' ? purchase_date : null) : 
      cattle.purchase_date;

    // 更新牛只信息
    await cattle.update({
      ear_tag: ear_tag || cattle.ear_tag,
      breed: breed || cattle.breed,
      gender: gender || cattle.gender,
      birth_date: processedBirthDate,
      weight: weight !== undefined ? weight : cattle.weight,
      health_status: health_status || cattle.health_status,
      base_id: base_id || cattle.base_id,
      barn_id: barn_id !== undefined ? barn_id : cattle.barn_id,
      photos: photos !== undefined ? photos : cattle.photos,
      parent_male_id: parent_male_id !== undefined ? parent_male_id : cattle.parent_male_id,
      parent_female_id: parent_female_id !== undefined ? parent_female_id : cattle.parent_female_id,
      source: source || cattle.source,
      purchase_price: purchase_price !== undefined ? purchase_price : cattle.purchase_price,
      purchase_date: processedPurchaseDate,
      supplier_id: supplier_id !== undefined ? supplier_id : cattle.supplier_id,
      notes: notes !== undefined ? notes : cattle.notes
    });

    // 创建更新事件记录
    const changedFields = [];
    if (weight !== undefined && weight !== oldData.weight) changedFields.push('weight');
    if (health_status && health_status !== oldData.health_status) changedFields.push('health_status');
    if (barn_id !== undefined && barn_id !== oldData.barn_id) changedFields.push('barn_id');

    if (changedFields.length > 0) {
      await CattleEvent.create({
        cattle_id: cattle.id,
        event_type: 'other',
        event_date: new Date().toISOString().split('T')[0],
        description: `牛只信息更新: ${changedFields.join(', ')}`,
        data: {
          changed_fields: changedFields,
          old_data: oldData,
          new_data: req.body
        },
        operator_id
      });
    }

    console.log(`Cattle updated: ${cattle.ear_tag} (ID: ${id})`);

    res.success(cattle.toJSON(), '更新牛只成功');
  } catch (error) {
    console.error('Error updating cattle:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.error('数据验证失败', 422, 'VALIDATION_ERROR', error.errors);
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.error('耳标已存在', 409, 'EAR_TAG_EXISTS');
    }
    res.error('更新牛只失败', 500, 'UPDATE_CATTLE_ERROR');
  }
});

// DELETE /api/v1/cattle/cattle/:id - 删除牛只
app.delete('/api/v1/cattle/cattle/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { operator_id, reason } = req.body;

    // 查找牛只
    const cattle = await Cattle.findByPk(id);
    if (!cattle) {
      return res.error('牛只不存在', 404, 'CATTLE_NOT_FOUND');
    }

    // 检查牛只状态
    if (cattle.status === 'sold' || cattle.status === 'dead') {
      return res.error('该牛只已经是非活跃状态，无法删除', 400, 'CATTLE_INACTIVE');
    }

    // 记录删除事件
    await CattleEvent.create({
      cattle_id: cattle.id,
      event_type: 'deleted',
      event_date: new Date().toISOString().split('T')[0],
      description: `牛只删除: ${reason || '未提供原因'}`,
      data: {
        reason,
        deleted_cattle: cattle.toJSON()
      },
      operator_id
    });

    // 软删除：更新状态为已删除
    await cattle.update({
      status: 'dead', // 或者可以添加 'deleted' 状态
      notes: `${cattle.notes || ''}\n删除时间: ${new Date().toISOString()}\n删除原因: ${reason || '未提供'}`
    });

    console.log(`Cattle deleted: ${cattle.ear_tag} (ID: ${id})`);

    res.success({ id: cattle.id, ear_tag: cattle.ear_tag }, '删除牛只成功');
  } catch (error) {
    console.error('Error deleting cattle:', error);
    res.error('删除牛只失败', 500, 'DELETE_CATTLE_ERROR');
  }
});

// GET /api/v1/cattle/cattle/statistics - 获取牛只统计
app.get('/api/v1/cattle/cattle/statistics', async (req, res) => {
  try {
    const { base_id, barn_id, date_from, date_to } = req.query;

    const whereClause = { status: 'active' };
    if (base_id) whereClause.base_id = base_id;
    if (barn_id) whereClause.barn_id = barn_id;

    // 基础统计
    const [basicStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_count,
        COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy_count,
        COUNT(CASE WHEN health_status = 'sick' THEN 1 END) as sick_count,
        COUNT(CASE WHEN health_status = 'treatment' THEN 1 END) as treatment_count,
        COUNT(CASE WHEN gender = 'male' THEN 1 END) as male_count,
        COUNT(CASE WHEN gender = 'female' THEN 1 END) as female_count,
        AVG(weight) as avg_weight,
        MIN(weight) as min_weight,
        MAX(weight) as max_weight
      FROM cattle 
      WHERE status = 'active'
      ${base_id ? 'AND base_id = :baseId' : ''}
      ${barn_id ? 'AND barn_id = :barnId' : ''}
    `, {
      replacements: { baseId: base_id, barnId: barn_id },
      type: Sequelize.QueryTypes.SELECT,
    });

    // 按品种统计
    const breedStats = await sequelize.query(`
      SELECT 
        breed,
        COUNT(*) as count,
        AVG(weight) as avg_weight
      FROM cattle 
      WHERE status = 'active'
      ${base_id ? 'AND base_id = :baseId' : ''}
      ${barn_id ? 'AND barn_id = :barnId' : ''}
      GROUP BY breed
      ORDER BY count DESC
    `, {
      replacements: { baseId: base_id, barnId: barn_id },
      type: Sequelize.QueryTypes.SELECT,
    });

    // 按年龄组统计
    const [ageStats] = await sequelize.query(`
      SELECT 
        COUNT(CASE WHEN birth_date IS NULL OR birth_date > CURRENT_DATE - INTERVAL '1 year' THEN 1 END) as calf_count,
        COUNT(CASE WHEN birth_date <= CURRENT_DATE - INTERVAL '1 year' AND birth_date > CURRENT_DATE - INTERVAL '3 years' THEN 1 END) as young_count,
        COUNT(CASE WHEN birth_date <= CURRENT_DATE - INTERVAL '3 years' THEN 1 END) as adult_count
      FROM cattle 
      WHERE status = 'active'
      ${base_id ? 'AND base_id = :baseId' : ''}
      ${barn_id ? 'AND barn_id = :barnId' : ''}
    `, {
      replacements: { baseId: base_id, barnId: barn_id },
      type: Sequelize.QueryTypes.SELECT,
    });

    // 按来源统计
    const sourceStats = await sequelize.query(`
      SELECT 
        source,
        COUNT(*) as count
      FROM cattle 
      WHERE status = 'active'
      ${base_id ? 'AND base_id = :baseId' : ''}
      ${barn_id ? 'AND barn_id = :barnId' : ''}
      GROUP BY source
      ORDER BY count DESC
    `, {
      replacements: { baseId: base_id, barnId: barn_id },
      type: Sequelize.QueryTypes.SELECT,
    });

    // 最近事件统计
    const recentEvents = await sequelize.query(`
      SELECT 
        event_type,
        COUNT(*) as count
      FROM cattle_events ce
      JOIN cattle c ON ce.cattle_id = c.id
      WHERE ce.event_date >= CURRENT_DATE - INTERVAL '30 days'
      AND c.status = 'active'
      ${base_id ? 'AND c.base_id = :baseId' : ''}
      ${barn_id ? 'AND c.barn_id = :barnId' : ''}
      GROUP BY event_type
      ORDER BY count DESC
    `, {
      replacements: { baseId: base_id, barnId: barn_id },
      type: Sequelize.QueryTypes.SELECT,
    });

    const statistics = {
      overview: basicStats,
      by_breed: breedStats.reduce((acc, item) => {
        acc[item.breed] = {
          count: parseInt(item.count),
          avg_weight: parseFloat(item.avg_weight || 0)
        };
        return acc;
      }, {}),
      by_gender: {
        male: parseInt(basicStats.male_count),
        female: parseInt(basicStats.female_count)
      },
      by_age_group: {
        calf: parseInt(ageStats.calf_count),
        young: parseInt(ageStats.young_count),
        adult: parseInt(ageStats.adult_count)
      },
      by_source: sourceStats.reduce((acc, item) => {
        acc[item.source] = parseInt(item.count);
        return acc;
      }, {}),
      recent_events: recentEvents.reduce((acc, item) => {
        acc[item.event_type] = parseInt(item.count);
        return acc;
      }, {})
    };

    res.success(statistics, '获取牛只统计成功');
  } catch (error) {
    console.error('Error fetching cattle statistics:', error);
    res.error('获取牛只统计失败', 500, 'FETCH_STATISTICS_ERROR');
  }
});

// POST /api/v1/cattle/cattle/:id/events - 添加牛只事件
app.post('/api/v1/cattle/cattle/:id/events', async (req, res) => {
  try {
    const { id } = req.params;
    const { event_type, event_date, description, data = {}, operator_id } = req.body;

    // 验证必填字段
    if (!event_type || !event_date) {
      return res.error('事件类型和事件日期不能为空', 400, 'MISSING_REQUIRED_FIELDS');
    }

    // 验证牛只是否存在
    const cattle = await Cattle.findByPk(id);
    if (!cattle) {
      return res.error('牛只不存在', 404, 'CATTLE_NOT_FOUND');
    }

    // 创建事件记录
    const event = await CattleEvent.create({
      cattle_id: id,
      event_type,
      event_date,
      description,
      data,
      operator_id
    });

    // 根据事件类型更新牛只状态
    if (event_type === 'weight_record' && data.weight) {
      await cattle.update({ weight: data.weight });
    } else if (event_type === 'health_check' && data.health_status) {
      await cattle.update({ health_status: data.health_status });
    } else if (event_type === 'sale' || event_type === 'sold') {
      await cattle.update({ status: 'sold' });
    } else if (event_type === 'death' || event_type === 'dead') {
      await cattle.update({ status: 'dead' });
    }

    console.log(`Event created for cattle ${cattle.ear_tag}: ${event_type}`);

    res.success(event.toJSON(), '添加牛只事件成功', 201);
  } catch (error) {
    console.error('Error creating cattle event:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.error('数据验证失败', 422, 'VALIDATION_ERROR', error.errors);
    }
    res.error('添加牛只事件失败', 500, 'CREATE_EVENT_ERROR');
  }
});

// GET /api/v1/cattle/cattle/:id/events - 获取牛只事件列表
app.get('/api/v1/cattle/cattle/:id/events', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, event_type } = req.query;

    // 验证牛只是否存在
    const cattle = await Cattle.findByPk(id);
    if (!cattle) {
      return res.error('牛只不存在', 404, 'CATTLE_NOT_FOUND');
    }

    const offset = (page - 1) * limit;
    const whereClause = { cattle_id: id };
    if (event_type) whereClause.event_type = event_type;

    const { count, rows: events } = await CattleEvent.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['event_date', 'DESC'], ['created_at', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    res.success({
      events: events.map(event => event.toJSON()),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages
      }
    }, '获取牛只事件列表成功');
  } catch (error) {
    console.error('Error fetching cattle events:', error);
    res.error('获取牛只事件列表失败', 500, 'FETCH_EVENTS_ERROR');
  }
});

// POST /api/v1/cattle/cattle/batch - 批量操作牛只
app.post('/api/v1/cattle/cattle/batch', async (req, res) => {
  try {
    const { action, cattle_ids, data = {}, operator_id } = req.body;

    if (!action || !cattle_ids || !Array.isArray(cattle_ids)) {
      return res.error('操作类型和牛只ID列表不能为空', 400, 'MISSING_REQUIRED_FIELDS');
    }

    const results = [];
    const errors = [];

    for (const cattle_id of cattle_ids) {
      try {
        const cattle = await Cattle.findByPk(cattle_id);
        if (!cattle) {
          errors.push({ cattle_id, error: '牛只不存在' });
          continue;
        }

        switch (action) {
          case 'update_health_status':
            if (data.health_status) {
              await cattle.update({ health_status: data.health_status });
              await CattleEvent.create({
                cattle_id,
                event_type: 'health_check',
                event_date: new Date().toISOString().split('T')[0],
                description: `批量更新健康状态: ${data.health_status}`,
                data: { health_status: data.health_status },
                operator_id
              });
              results.push({ cattle_id, success: true });
            }
            break;

          case 'transfer_barn':
            if (data.barn_id) {
              await cattle.update({ barn_id: data.barn_id });
              await CattleEvent.create({
                cattle_id,
                event_type: 'transfer_in',
                event_date: new Date().toISOString().split('T')[0],
                description: `批量转移到牛棚: ${data.barn_id}`,
                data: { barn_id: data.barn_id },
                operator_id
              });
              results.push({ cattle_id, success: true });
            }
            break;

          case 'record_weight':
            if (data.weight) {
              await cattle.update({ weight: data.weight });
              await CattleEvent.create({
                cattle_id,
                event_type: 'weight_record',
                event_date: new Date().toISOString().split('T')[0],
                description: `批量称重记录: ${data.weight}kg`,
                data: { weight: data.weight },
                operator_id
              });
              results.push({ cattle_id, success: true });
            }
            break;

          default:
            errors.push({ cattle_id, error: '不支持的操作类型' });
        }
      } catch (error) {
        errors.push({ cattle_id, error: error.message });
      }
    }

    res.success({
      success_count: results.length,
      error_count: errors.length,
      results,
      errors
    }, '批量操作完成');
  } catch (error) {
    console.error('Error in batch operation:', error);
    res.error('批量操作失败', 500, 'BATCH_OPERATION_ERROR');
  }
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    service: 'cattle-service',
    path: req.originalUrl
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`cattle-service listening on port ${port}`);
});
// Database connection test
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

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    service: 'cattle-service',
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

    // Sync database models (don't force in production)
    const NODE_ENV = process.env.NODE_ENV || 'development';
    if (NODE_ENV === 'development') {
      try {
        await sequelize.sync({ force: false, alter: false });
        console.log('Database models synchronized');
      } catch (error) {
        console.warn('Database sync failed:', error.message);
      }
    }

    // Start the server
    app.listen(port, () => {
      console.log(`cattle-service listening on port ${port}`);
      console.log(`Environment: ${NODE_ENV}`);
      console.log(`Database: ${process.env.DB_NAME || 'cattle_management'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();