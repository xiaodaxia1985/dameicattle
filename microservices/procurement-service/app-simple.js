const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const port = process.env.PORT || 3007;

// 中间件
app.use(cors());
app.use(express.json());

// 数据库连接
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cattle_management',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'dianxin99',
  logging: false
});

// 采购订单模型
const ProcurementOrder = sequelize.define('ProcurementOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  supplierName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  baseId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  baseName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  orderType: {
    type: DataTypes.ENUM('cattle', 'material', 'equipment'),
    defaultValue: 'material'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  taxAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  discountAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'delivered', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
    defaultValue: 'unpaid'
  },
  paymentMethod: DataTypes.STRING,
  orderDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  expectedDeliveryDate: DataTypes.DATE,
  actualDeliveryDate: DataTypes.DATE,
  contractNumber: DataTypes.STRING,
  remark: DataTypes.TEXT,
  createdBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdByName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  approvedBy: DataTypes.STRING,
  approvedByName: DataTypes.STRING,
  approvedAt: DataTypes.DATE,
  deliveredBy: DataTypes.STRING,
  deliveredByName: DataTypes.STRING,
  deliveredAt: DataTypes.DATE,
  deliveryNote: DataTypes.TEXT,
  paidBy: DataTypes.STRING,
  paidByName: DataTypes.STRING,
  paidAt: DataTypes.DATE,
  paidAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  paymentNote: DataTypes.TEXT,
  completedBy: DataTypes.STRING,
  completedByName: DataTypes.STRING,
  completedAt: DataTypes.DATE,
  completionNote: DataTypes.TEXT,
  cancelledBy: DataTypes.STRING,
  cancelledByName: DataTypes.STRING,
  cancelledAt: DataTypes.DATE,
  cancelReason: DataTypes.TEXT
}, {
  tableName: 'procurement_orders',
  timestamps: true
});

// 采购订单明细模型
const ProcurementOrderItem = sequelize.define('ProcurementOrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: ProcurementOrder,
      key: 'id'
    }
  },
  itemName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  specification: DataTypes.STRING,
  quantity: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  unit: {
    type: DataTypes.STRING,
    allowNull: false
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  totalPrice: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false
  },
  remark: DataTypes.TEXT
}, {
  tableName: 'procurement_order_items',
  timestamps: true
});

// 供应商模型
const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  contactPerson: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: DataTypes.STRING,
  address: {
    type: DataTypes.STRING,
    allowNull: false
  },
  supplierType: {
    type: DataTypes.ENUM('cattle', 'material', 'equipment', 'mixed'),
    defaultValue: 'material'
  },
  businessLicense: DataTypes.STRING,
  taxNumber: DataTypes.STRING,
  bankAccount: DataTypes.STRING,
  creditLimit: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0
  },
  paymentTerms: DataTypes.STRING,
  rating: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'blacklisted'),
    defaultValue: 'active'
  },
  remark: DataTypes.TEXT,
  createdBy: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdByName: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: 'suppliers',
  timestamps: true
});

// 设置关联关系
ProcurementOrder.hasMany(ProcurementOrderItem, {
  foreignKey: 'orderId',
  as: 'items',
  onDelete: 'CASCADE'
});

ProcurementOrderItem.belongsTo(ProcurementOrder, {
  foreignKey: 'orderId',
  as: 'order'
});

// 简单的认证中间件
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '无效的访问令牌',
      code: 'INVALID_TOKEN'
    });
  }
  
  // 模拟用户信息
  req.user = {
    id: 'admin',
    name: '管理员',
    role: 'admin'
  };
  
  next();
};

// 生成订单号
const generateOrderNumber = async () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  
  const todayOrderCount = await ProcurementOrder.count({
    where: {
      createdAt: {
        [Sequelize.Op.gte]: new Date(now.getFullYear(), now.getMonth(), now.getDate())
      }
    }
  });
  
  const sequence = (todayOrderCount + 1).toString().padStart(4, '0');
  return `PO-${dateStr}-${sequence}`;
};

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'procurement-service',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/procurement/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'procurement-service',
    timestamp: new Date().toISOString()
  });
});

// 获取采购订单列表
app.get('/api/v1/procurement/orders', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      orderNumber,
      supplierId,
      baseId,
      orderType,
      status,
      startDate,
      endDate
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const whereConditions = {};

    if (orderNumber) {
      whereConditions.orderNumber = {
        [Sequelize.Op.iLike]: `%${orderNumber}%`
      };
    }

    if (supplierId) {
      whereConditions.supplierId = Number(supplierId);
    }

    if (baseId) {
      whereConditions.baseId = Number(baseId);
    }

    if (orderType) {
      whereConditions.orderType = orderType;
    }

    if (status) {
      whereConditions.status = status;
    }

    if (startDate && endDate) {
      whereConditions.orderDate = {
        [Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { count, rows } = await ProcurementOrder.findAndCountAll({
      where: whereConditions,
      include: [{
        model: ProcurementOrderItem,
        as: 'items',
        required: false
      }],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        orders: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      },
      message: '获取采购订单列表成功'
    });
  } catch (error) {
    console.error('获取采购订单列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取采购订单列表失败',
      error: error.message
    });
  }
});

// 获取采购订单详情
app.get('/api/v1/procurement/orders/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await ProcurementOrder.findByPk(id, {
      include: [{
        model: ProcurementOrderItem,
        as: 'items'
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在',
        code: 'ORDER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { order },
      message: '获取采购订单详情成功'
    });
  } catch (error) {
    console.error('获取采购订单详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取采购订单详情失败',
      error: error.message
    });
  }
});

// 创建采购订单
app.post('/api/v1/procurement/orders', authMiddleware, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      supplierId,
      supplierName,
      baseId,
      baseName,
      orderType,
      orderDate,
      expectedDeliveryDate,
      paymentMethod,
      contractNumber,
      remark,
      taxAmount = 0,
      discountAmount = 0,
      items = []
    } = req.body;

    const user = req.user;

    if (!supplierId || !supplierName || !baseId || !baseName || !orderType || !orderDate) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '请提供必要的订单信息',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '订单必须包含至少一个商品',
        code: 'NO_ORDER_ITEMS'
      });
    }

    const orderNumber = await generateOrderNumber();

    const subtotal = items.reduce((sum, item) => {
      return sum + (Number(item.quantity) * Number(item.unitPrice));
    }, 0);
    const totalAmount = subtotal + Number(taxAmount) - Number(discountAmount);

    const order = await ProcurementOrder.create({
      orderNumber,
      supplierId: Number(supplierId),
      supplierName,
      baseId: Number(baseId),
      baseName,
      orderType,
      orderDate: new Date(orderDate),
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      paymentMethod,
      contractNumber,
      remark,
      taxAmount: Number(taxAmount),
      discountAmount: Number(discountAmount),
      totalAmount,
      createdBy: user.id,
      createdByName: user.name
    }, { transaction });

    const orderItems = items.map(item => ({
      orderId: order.id,
      itemName: item.itemName,
      specification: item.specification,
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.quantity) * Number(item.unitPrice),
      remark: item.remark
    }));

    await ProcurementOrderItem.bulkCreate(orderItems, { transaction });

    await transaction.commit();

    const createdOrder = await ProcurementOrder.findByPk(order.id, {
      include: [{
        model: ProcurementOrderItem,
        as: 'items'
      }]
    });

    res.status(201).json({
      success: true,
      data: { order: createdOrder },
      message: '创建采购订单成功'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('创建采购订单失败:', error);
    res.status(500).json({
      success: false,
      message: '创建采购订单失败',
      error: error.message
    });
  }
});

// 更新采购订单
app.put('/api/v1/procurement/orders/:id', authMiddleware, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const {
      supplierId,
      supplierName,
      baseId,
      baseName,
      orderType,
      orderDate,
      expectedDeliveryDate,
      paymentMethod,
      contractNumber,
      remark,
      taxAmount = 0,
      discountAmount = 0,
      items = []
    } = req.body;

    const order = await ProcurementOrder.findByPk(id, { transaction });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '采购订单不存在',
        code: 'ORDER_NOT_FOUND'
      });
    }

    if (order.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '只有待审批状态的订单才能编辑',
        code: 'ORDER_NOT_EDITABLE'
      });
    }

    const subtotal = items.reduce((sum, item) => {
      return sum + (Number(item.quantity) * Number(item.unitPrice));
    }, 0);
    const totalAmount = subtotal + Number(taxAmount) - Number(discountAmount);

    await order.update({
      supplierId: Number(supplierId),
      supplierName,
      baseId: Number(baseId),
      baseName,
      orderType,
      orderDate: new Date(orderDate),
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      paymentMethod,
      contractNumber,
      remark,
      taxAmount: Number(taxAmount),
      discountAmount: Number(discountAmount),
      totalAmount
    }, { transaction });

    await ProcurementOrderItem.destroy({
      where: { orderId: order.id },
      transaction
    });

    const orderItems = items.map(item => ({
      orderId: order.id,
      itemName: item.itemName,
      specification: item.specification,
      quantity: Number(item.quantity),
      unit: item.unit,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.quantity) * Number(item.unitPrice),
      remark: item.remark
    }));

    await ProcurementOrderItem.bulkCreate(orderItems, { transaction });

    await transaction.commit();

    const updatedOrder = await ProcurementOrder.findByPk(order.id, {
      include: [{
        model: ProcurementOrderItem,
        as: 'items'
      }]
    });

    res.json({
      success: true,
      data: { order: updatedOrder },
      message: '更新采购订单成功'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('更新采购订单失败:', error);
    res.status(500).json({
      success: false,
      message: '更新采购订单失败',
      error: error.message
    });
  }
});

// 审批采购订单
app.post('/api/v1/procurement/orders/:id/approve', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await ProcurementOrder.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在',
        code: 'ORDER_NOT_FOUND'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '只有待审批状态的订单才能审批',
        code: 'ORDER_NOT_APPROVABLE'
      });
    }

    await order.update({
      status: 'approved',
      approvedBy: user.id,
      approvedByName: user.name,
      approvedAt: new Date()
    });

    const approvedOrder = await ProcurementOrder.findByPk(order.id, {
      include: [{
        model: ProcurementOrderItem,
        as: 'items'
      }]
    });

    res.json({
      success: true,
      data: { order: approvedOrder },
      message: '审批采购订单成功'
    });
  } catch (error) {
    console.error('审批采购订单失败:', error);
    res.status(500).json({
      success: false,
      message: '审批采购订单失败',
      error: error.message
    });
  }
});

// 取消采购订单
app.post('/api/v1/procurement/orders/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user;

    const order = await ProcurementOrder.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在',
        code: 'ORDER_NOT_FOUND'
      });
    }

    if (!['pending', 'approved'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: '只有待审批或已审批状态的订单才能取消',
        code: 'ORDER_NOT_CANCELLABLE'
      });
    }

    await order.update({
      status: 'cancelled',
      cancelReason: reason || '用户手动取消',
      cancelledBy: user.id,
      cancelledByName: user.name,
      cancelledAt: new Date()
    });

    const cancelledOrder = await ProcurementOrder.findByPk(order.id, {
      include: [{
        model: ProcurementOrderItem,
        as: 'items'
      }]
    });

    res.json({
      success: true,
      data: { order: cancelledOrder },
      message: '取消采购订单成功'
    });
  } catch (error) {
    console.error('取消采购订单失败:', error);
    res.status(500).json({
      success: false,
      message: '取消采购订单失败',
      error: error.message
    });
  }
});

// 批量审批订单
app.post('/api/v1/procurement/orders/batch-approve', authMiddleware, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { orderIds } = req.body;
    const user = req.user;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: '请提供要审批的订单ID列表',
        code: 'INVALID_INPUT'
      });
    }

    const approvedOrders = [];
    const errors = [];

    for (const orderId of orderIds) {
      try {
        const order = await ProcurementOrder.findByPk(orderId, { transaction });
        
        if (!order) {
          errors.push({ orderId, message: '订单不存在' });
          continue;
        }

        if (order.status !== 'pending') {
          errors.push({ orderId, message: '订单状态不允许审批' });
          continue;
        }

        await order.update({
          status: 'approved',
          approvedBy: user.id,
          approvedByName: user.name,
          approvedAt: new Date()
        }, { transaction });

        approvedOrders.push(order);
      } catch (error) {
        errors.push({ orderId, message: '审批失败' });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      data: {
        approvedOrders,
        errors,
        summary: {
          total: orderIds.length,
          approved: approvedOrders.length,
          failed: errors.length
        }
      },
      message: `批量审批完成，成功 ${approvedOrders.length} 个，失败 ${errors.length} 个`
    });
  } catch (error) {
    await transaction.rollback();
    console.error('批量审批订单失败:', error);
    res.status(500).json({
      success: false,
      message: '批量审批订单失败',
      error: error.message
    });
  }
});

// 获取供应商列表
app.get('/api/v1/procurement/suppliers', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      name,
      supplierType,
      status
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const whereConditions = {};

    if (name) {
      whereConditions.name = {
        [Sequelize.Op.iLike]: `%${name}%`
      };
    }

    if (supplierType) {
      whereConditions.supplierType = supplierType;
    }

    if (status) {
      whereConditions.status = status;
    }

    const { count, rows } = await Supplier.findAndCountAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        suppliers: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      },
      message: '获取供应商列表成功'
    });
  } catch (error) {
    console.error('获取供应商列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取供应商列表失败',
      error: error.message
    });
  }
});

// 创建供应商
app.post('/api/v1/procurement/suppliers', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      contactPerson,
      phone,
      email,
      address,
      supplierType,
      businessLicense,
      taxNumber,
      bankAccount,
      creditLimit = 0,
      paymentTerms,
      rating = 5,
      remark
    } = req.body;

    const user = req.user;

    if (!name || !contactPerson || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: '请提供必要的供应商信息',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const existingSupplier = await Supplier.findOne({
      where: { name }
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: '供应商名称已存在',
        code: 'SUPPLIER_NAME_EXISTS'
      });
    }

    const supplier = await Supplier.create({
      name,
      contactPerson,
      phone,
      email,
      address,
      supplierType: supplierType || 'material',
      businessLicense,
      taxNumber,
      bankAccount,
      creditLimit: Number(creditLimit),
      paymentTerms,
      rating: Number(rating),
      remark,
      createdBy: user.id,
      createdByName: user.name
    });

    res.status(201).json({
      success: true,
      data: { supplier },
      message: '创建供应商成功'
    });
  } catch (error) {
    console.error('创建供应商失败:', error);
    res.status(500).json({
      success: false,
      message: '创建供应商失败',
      error: error.message
    });
  }
});

// 获取基地列表
app.get('/api/v1/procurement/bases', authMiddleware, async (req, res) => {
  try {
    const mockBases = [
      {
        id: 1,
        name: '主基地',
        address: '北京市朝阳区农业园区1号',
        status: 'active',
        manager: '张经理',
        phone: '13800138001'
      },
      {
        id: 2,
        name: '分基地A',
        address: '河北省廊坊市农业园区2号',
        status: 'active',
        manager: '李经理',
        phone: '13800138002'
      },
      {
        id: 3,
        name: '分基地B',
        address: '天津市武清区农业园区3号',
        status: 'active',
        manager: '王经理',
        phone: '13800138003'
      }
    ];

    const activeBases = mockBases.filter(base => base.status === 'active');

    res.json({
      success: true,
      data: {
        bases: activeBases,
        pagination: {
          total: activeBases.length,
          page: 1,
          limit: 20,
          pages: 1
        }
      },
      message: '获取基地列表成功'
    });
  } catch (error) {
    console.error('获取基地列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取基地列表失败',
      error: error.message
    });
  }
});

// 获取采购统计数据
app.get('/api/v1/procurement/statistics', authMiddleware, async (req, res) => {
  try {
    const { baseId, startDate, endDate } = req.query;

    const whereConditions = {};
    if (baseId) {
      whereConditions.baseId = Number(baseId);
    }
    if (startDate && endDate) {
      whereConditions.orderDate = {
        [Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // 基础统计
    const totalOrders = await ProcurementOrder.count({ where: whereConditions });
    const pendingOrders = await ProcurementOrder.count({ 
      where: { ...whereConditions, status: 'pending' } 
    });
    const approvedOrders = await ProcurementOrder.count({ 
      where: { ...whereConditions, status: 'approved' } 
    });
    const completedOrders = await ProcurementOrder.count({ 
      where: { ...whereConditions, status: 'completed' } 
    });

    const totalAmountResult = await ProcurementOrder.sum('totalAmount', { where: whereConditions });
    const totalAmount = totalAmountResult || 0;
    const avgOrderAmount = totalOrders > 0 ? totalAmount / totalOrders : 0;

    const activeSuppliers = await Supplier.count({ where: { status: 'active' } });

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        approvedOrders,
        completedOrders,
        totalAmount,
        avgOrderAmount,
        activeSuppliers
      },
      message: '获取采购统计数据成功'
    });
  } catch (error) {
    console.error('获取采购统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取采购统计数据失败',
      error: error.message
    });
  }
});

// 获取采购趋势数据
app.get('/api/v1/procurement/statistics/trend', authMiddleware, async (req, res) => {
  try {
    const { baseId, months = 6 } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - Number(months));

    const whereConditions = {
      orderDate: {
        [Sequelize.Op.between]: [startDate, endDate]
      }
    };
    
    if (baseId) {
      whereConditions.baseId = Number(baseId);
    }

    // 按月统计
    const monthlyStats = await ProcurementOrder.findAll({
      where: whereConditions,
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('orderDate')), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'orderCount'],
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalAmount'],
        [Sequelize.fn('AVG', Sequelize.col('totalAmount')), 'avgAmount']
      ],
      group: [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('orderDate'))],
      order: [[Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('orderDate')), 'ASC']]
    });

    res.json({
      success: true,
      data: { monthlyStats },
      message: '获取采购趋势数据成功'
    });
  } catch (error) {
    console.error('获取采购趋势数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取采购趋势数据失败',
      error: error.message
    });
  }
});

// 获取采购类型分布
app.get('/api/v1/procurement/statistics/type-distribution', authMiddleware, async (req, res) => {
  try {
    const { baseId, startDate, endDate } = req.query;

    const whereConditions = {};
    if (baseId) {
      whereConditions.baseId = Number(baseId);
    }
    if (startDate && endDate) {
      whereConditions.orderDate = {
        [Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const typeStats = await ProcurementOrder.findAll({
      where: whereConditions,
      attributes: [
        'orderType',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'orderCount'],
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalAmount'],
        [Sequelize.fn('AVG', Sequelize.col('totalAmount')), 'avgAmount']
      ],
      group: ['orderType'],
      order: [[Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'DESC']]
    });

    // 计算百分比
    const totalAmount = typeStats.reduce((sum, item) => sum + Number(item.dataValues.totalAmount || 0), 0);
    const typeDistribution = typeStats.map(item => ({
      ...item.dataValues,
      percentage: totalAmount > 0 ? ((Number(item.dataValues.totalAmount) / totalAmount) * 100).toFixed(1) : 0
    }));

    res.json({
      success: true,
      data: { typeDistribution },
      message: '获取采购类型分布成功'
    });
  } catch (error) {
    console.error('获取采购类型分布失败:', error);
    res.status(500).json({
      success: false,
      message: '获取采购类型分布失败',
      error: error.message
    });
  }
});

// 获取供应商排行
app.get('/api/v1/procurement/statistics/supplier-ranking', authMiddleware, async (req, res) => {
  try {
    const { baseId, startDate, endDate, limit = 10 } = req.query;

    const whereConditions = {};
    if (baseId) {
      whereConditions.baseId = Number(baseId);
    }
    if (startDate && endDate) {
      whereConditions.orderDate = {
        [Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const supplierStats = await ProcurementOrder.findAll({
      where: whereConditions,
      attributes: [
        'supplierId',
        'supplierName',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'orderCount'],
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalAmount'],
        [Sequelize.fn('AVG', Sequelize.col('totalAmount')), 'avgAmount']
      ],
      group: ['supplierId', 'supplierName'],
      order: [[Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'DESC']],
      limit: Number(limit)
    });

    // 获取供应商评级信息
    const supplierIds = supplierStats.map(item => item.dataValues.supplierId);
    const suppliers = await Supplier.findAll({
      where: { id: { [Sequelize.Op.in]: supplierIds } },
      attributes: ['id', 'rating']
    });

    const supplierRatingMap = {};
    suppliers.forEach(supplier => {
      supplierRatingMap[supplier.id] = supplier.rating;
    });

    const supplierRanking = supplierStats.map(item => ({
      ...item.dataValues,
      rating: supplierRatingMap[item.dataValues.supplierId] || 5,
      onTimeRate: Math.floor(Math.random() * 20) + 80 // 模拟准时交付率
    }));

    res.json({
      success: true,
      data: { supplierRanking },
      message: '获取供应商排行成功'
    });
  } catch (error) {
    console.error('获取供应商排行失败:', error);
    res.status(500).json({
      success: false,
      message: '获取供应商排行失败',
      error: error.message
    });
  }
});

// 获取订单状态分布
app.get('/api/v1/procurement/statistics/status-distribution', authMiddleware, async (req, res) => {
  try {
    const { baseId, startDate, endDate } = req.query;

    const whereConditions = {};
    if (baseId) {
      whereConditions.baseId = Number(baseId);
    }
    if (startDate && endDate) {
      whereConditions.orderDate = {
        [Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const statusStats = await ProcurementOrder.findAll({
      where: whereConditions,
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    res.json({
      success: true,
      data: { statusDistribution: statusStats },
      message: '获取订单状态分布成功'
    });
  } catch (error) {
    console.error('获取订单状态分布失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单状态分布失败',
      error: error.message
    });
  }
});

// 获取月度统计详情
app.get('/api/v1/procurement/statistics/monthly', authMiddleware, async (req, res) => {
  try {
    const { baseId, months = 12 } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - Number(months));

    const whereConditions = {
      orderDate: {
        [Sequelize.Op.between]: [startDate, endDate]
      }
    };
    
    if (baseId) {
      whereConditions.baseId = Number(baseId);
    }

    // 按月和类型统计
    const monthlyDetailStats = await ProcurementOrder.findAll({
      where: whereConditions,
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('orderDate')), 'month'],
        'orderType',
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalAmount']
      ],
      group: [
        Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('orderDate')),
        'orderType',
        'status'
      ],
      order: [[Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('orderDate')), 'ASC']]
    });

    // 处理数据格式
    const monthlyData = {};
    monthlyDetailStats.forEach(item => {
      const month = item.dataValues.month.toISOString().slice(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          orderCount: 0,
          totalAmount: 0,
          cattleOrders: 0,
          materialOrders: 0,
          equipmentOrders: 0,
          completedOrders: 0
        };
      }
      
      monthlyData[month].orderCount += Number(item.dataValues.count);
      monthlyData[month].totalAmount += Number(item.dataValues.totalAmount || 0);
      
      if (item.dataValues.orderType === 'cattle') {
        monthlyData[month].cattleOrders += Number(item.dataValues.count);
      } else if (item.dataValues.orderType === 'material') {
        monthlyData[month].materialOrders += Number(item.dataValues.count);
      } else if (item.dataValues.orderType === 'equipment') {
        monthlyData[month].equipmentOrders += Number(item.dataValues.count);
      }
      
      if (item.dataValues.status === 'completed') {
        monthlyData[month].completedOrders += Number(item.dataValues.count);
      }
    });

    // 计算完成率和平均金额
    const monthlyArray = Object.values(monthlyData).map(item => ({
      ...item,
      avgAmount: item.orderCount > 0 ? item.totalAmount / item.orderCount : 0,
      completionRate: item.orderCount > 0 ? Math.round((item.completedOrders / item.orderCount) * 100) : 0
    }));

    res.json({
      success: true,
      data: { monthlyData: monthlyArray },
      message: '获取月度统计详情成功'
    });
  } catch (error) {
    console.error('获取月度统计详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取月度统计详情失败',
      error: error.message
    });
  }
});

// 订单状态流转 - 交付确认
app.post('/api/v1/procurement/orders/:id/deliver', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { actualDeliveryDate, deliveryNote } = req.body;
    const user = req.user;

    const order = await ProcurementOrder.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在',
        code: 'ORDER_NOT_FOUND'
      });
    }

    if (order.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: '只有已审批状态的订单才能确认交付',
        code: 'ORDER_NOT_DELIVERABLE'
      });
    }

    await order.update({
      status: 'delivered',
      actualDeliveryDate: actualDeliveryDate ? new Date(actualDeliveryDate) : new Date(),
      deliveryNote: deliveryNote || '',
      deliveredBy: user.id,
      deliveredByName: user.name,
      deliveredAt: new Date()
    });

    const deliveredOrder = await ProcurementOrder.findByPk(order.id, {
      include: [{
        model: ProcurementOrderItem,
        as: 'items'
      }]
    });

    res.json({
      success: true,
      data: { order: deliveredOrder },
      message: '确认交付成功'
    });
  } catch (error) {
    console.error('确认交付失败:', error);
    res.status(500).json({
      success: false,
      message: '确认交付失败',
      error: error.message
    });
  }
});

// 订单状态流转 - 付款确认
app.post('/api/v1/procurement/orders/:id/pay', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentAmount, paymentMethod, paymentNote } = req.body;
    const user = req.user;

    const order = await ProcurementOrder.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在',
        code: 'ORDER_NOT_FOUND'
      });
    }

    if (!['approved', 'delivered'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: '只有已审批或已交付状态的订单才能付款',
        code: 'ORDER_NOT_PAYABLE'
      });
    }

    const paidAmount = Number(paymentAmount) || order.totalAmount;
    let paymentStatus = 'paid';
    
    // 判断付款状态
    if (paidAmount < order.totalAmount) {
      paymentStatus = 'partial';
    }

    await order.update({
      paymentStatus,
      paymentMethod: paymentMethod || order.paymentMethod,
      paidAmount: paidAmount,
      paymentNote: paymentNote || '',
      paidBy: user.id,
      paidByName: user.name,
      paidAt: new Date()
    });

    const paidOrder = await ProcurementOrder.findByPk(order.id, {
      include: [{
        model: ProcurementOrderItem,
        as: 'items'
      }]
    });

    res.json({
      success: true,
      data: { order: paidOrder },
      message: '付款确认成功'
    });
  } catch (error) {
    console.error('付款确认失败:', error);
    res.status(500).json({
      success: false,
      message: '付款确认失败',
      error: error.message
    });
  }
});

// 订单状态流转 - 完成订单
app.post('/api/v1/procurement/orders/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { completionNote } = req.body;
    const user = req.user;

    const order = await ProcurementOrder.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在',
        code: 'ORDER_NOT_FOUND'
      });
    }

    if (order.status !== 'delivered' || order.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: '只有已交付且已付款的订单才能完成',
        code: 'ORDER_NOT_COMPLETABLE'
      });
    }

    await order.update({
      status: 'completed',
      completionNote: completionNote || '',
      completedBy: user.id,
      completedByName: user.name,
      completedAt: new Date()
    });

    const completedOrder = await ProcurementOrder.findByPk(order.id, {
      include: [{
        model: ProcurementOrderItem,
        as: 'items'
      }]
    });

    res.json({
      success: true,
      data: { order: completedOrder },
      message: '订单完成成功'
    });
  } catch (error) {
    console.error('订单完成失败:', error);
    res.status(500).json({
      success: false,
      message: '订单完成失败',
      error: error.message
    });
  }
});

// 获取订单状态流转历史
app.get('/api/v1/procurement/orders/:id/timeline', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await ProcurementOrder.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '采购订单不存在',
        code: 'ORDER_NOT_FOUND'
      });
    }

    // 构建时间线数据
    const timeline = [];

    // 创建时间
    timeline.push({
      status: 'created',
      title: '订单创建',
      description: `订单 ${order.orderNumber} 创建成功`,
      operator: order.createdByName,
      operatorId: order.createdBy,
      timestamp: order.createdAt,
      type: 'success'
    });

    // 审批时间
    if (order.approvedAt) {
      timeline.push({
        status: 'approved',
        title: '订单审批',
        description: '订单审批通过',
        operator: order.approvedByName,
        operatorId: order.approvedBy,
        timestamp: order.approvedAt,
        type: 'success'
      });
    }

    // 交付时间
    if (order.deliveredAt) {
      timeline.push({
        status: 'delivered',
        title: '确认交付',
        description: `实际交付日期: ${order.actualDeliveryDate ? new Date(order.actualDeliveryDate).toLocaleDateString() : ''}`,
        operator: order.deliveredByName,
        operatorId: order.deliveredBy,
        timestamp: order.deliveredAt,
        type: 'success'
      });
    }

    // 付款时间
    if (order.paidAt) {
      timeline.push({
        status: 'paid',
        title: '付款确认',
        description: `付款金额: ¥${order.paidAmount?.toLocaleString() || 0}`,
        operator: order.paidByName,
        operatorId: order.paidBy,
        timestamp: order.paidAt,
        type: 'success'
      });
    }

    // 完成时间
    if (order.completedAt) {
      timeline.push({
        status: 'completed',
        title: '订单完成',
        description: '订单已完成',
        operator: order.completedByName,
        operatorId: order.completedBy,
        timestamp: order.completedAt,
        type: 'success'
      });
    }

    // 取消时间
    if (order.cancelledAt) {
      timeline.push({
        status: 'cancelled',
        title: '订单取消',
        description: order.cancelReason || '订单已取消',
        operator: order.cancelledByName,
        operatorId: order.cancelledBy,
        timestamp: order.cancelledAt,
        type: 'danger'
      });
    }

    // 按时间排序
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      success: true,
      data: { timeline },
      message: '获取订单时间线成功'
    });
  } catch (error) {
    console.error('获取订单时间线失败:', error);
    res.status(500).json({
      success: false,
      message: '获取订单时间线失败',
      error: error.message
    });
  }
});

// 删除供应商
app.delete('/api/v1/procurement/suppliers/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`尝试删除供应商 ID: ${id}`);

    const supplier = await Supplier.findByPk(id);

    if (!supplier) {
      console.log(`供应商 ID ${id} 不存在`);
      return res.status(404).json({
        success: false,
        message: '供应商不存在',
        code: 'SUPPLIER_NOT_FOUND'
      });
    }

    // 检查是否有关联的采购订单
    const orderCount = await ProcurementOrder.count({
      where: { supplierId: Number(id) }
    });

    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `该供应商有 ${orderCount} 个关联的采购订单，无法删除`,
        code: 'SUPPLIER_HAS_ORDERS'
      });
    }

    await supplier.destroy();
    console.log(`供应商 ID ${id} 删除成功`);

    res.json({
      success: true,
      message: '删除供应商成功'
    });
  } catch (error) {
    console.error('删除供应商失败:', error);
    res.status(500).json({
      success: false,
      message: '删除供应商失败',
      error: error.message
    });
  }
});

// 更新供应商
app.put('/api/v1/procurement/suppliers/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      contactPerson,
      phone,
      email,
      address,
      supplierType,
      businessLicense,
      taxNumber,
      bankAccount,
      creditLimit,
      paymentTerms,
      rating,
      status,
      remark
    } = req.body;

    const supplier = await Supplier.findByPk(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: '供应商不存在',
        code: 'SUPPLIER_NOT_FOUND'
      });
    }

    // 如果更新名称，检查是否与其他供应商重复
    if (name && name !== supplier.name) {
      const existingSupplier = await Supplier.findOne({
        where: { 
          name,
          id: { [Sequelize.Op.ne]: id }
        }
      });

      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          message: '供应商名称已存在',
          code: 'SUPPLIER_NAME_EXISTS'
        });
      }
    }

    // 更新供应商信息
    await supplier.update({
      name: name || supplier.name,
      contactPerson: contactPerson || supplier.contactPerson,
      phone: phone || supplier.phone,
      email: email !== undefined ? email : supplier.email,
      address: address || supplier.address,
      supplierType: supplierType || supplier.supplierType,
      businessLicense: businessLicense !== undefined ? businessLicense : supplier.businessLicense,
      taxNumber: taxNumber !== undefined ? taxNumber : supplier.taxNumber,
      bankAccount: bankAccount !== undefined ? bankAccount : supplier.bankAccount,
      creditLimit: creditLimit !== undefined ? Number(creditLimit) : supplier.creditLimit,
      paymentTerms: paymentTerms !== undefined ? paymentTerms : supplier.paymentTerms,
      rating: rating !== undefined ? Number(rating) : supplier.rating,
      status: status || supplier.status,
      remark: remark !== undefined ? remark : supplier.remark
    });

    res.json({
      success: true,
      data: { supplier },
      message: '更新供应商成功'
    });
  } catch (error) {
    console.error('更新供应商失败:', error);
    res.status(500).json({
      success: false,
      message: '更新供应商失败',
      error: error.message
    });
  }
});

// 获取供应商详情
app.get('/api/v1/procurement/suppliers/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findByPk(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: '供应商不存在',
        code: 'SUPPLIER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { supplier },
      message: '获取供应商详情成功'
    });
  } catch (error) {
    console.error('获取供应商详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取供应商详情失败',
      error: error.message
    });
  }
});

// 404处理
app.use('*', (req, res) => {
  console.log(`404 - 接口不存在: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: '接口不存在',
    code: 'ENDPOINT_NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功');

    // 同步数据库模型 - 不强制重建表，保持现有数据
    await sequelize.sync({ alter: true });
    console.log('数据库模型同步完成 (更新表结构)');

    app.listen(port, () => {
      console.log(`procurement-service listening on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    console.error('服务启动失败:', error);
    process.exit(1);
  }
};

startServer();