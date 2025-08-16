const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const port = process.env.PORT || 3008;

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

// 销售订单模型
const SalesOrder = sequelize.define('SalesOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    field: 'order_number'
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'customer_id'
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'customer_name'
  },
  baseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'base_id'
  },
  baseName: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'base_name'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    field: 'total_amount'
  },
  taxAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    field: 'tax_amount'
  },
  discountAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0,
    field: 'discount_amount'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'delivered', 'completed', 'cancelled'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
    defaultValue: 'unpaid',
    field: 'payment_status'
  },
  paymentMethod: {
    type: DataTypes.STRING,
    field: 'payment_method'
  },
  orderDate: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'order_date'
  },
  expectedDeliveryDate: {
    type: DataTypes.DATE,
    field: 'delivery_date'
  },
  actualDeliveryDate: {
    type: DataTypes.DATE,
    field: 'actual_delivery_date'
  },
  contractNumber: {
    type: DataTypes.STRING,
    field: 'contract_number'
  },
  logisticsCompany: {
    type: DataTypes.STRING,
    field: 'logistics_company'
  },
  trackingNumber: {
    type: DataTypes.STRING,
    field: 'tracking_number'
  },
  remark: DataTypes.TEXT,
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by'
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    field: 'approved_by'
  },
  approvedAt: {
    type: DataTypes.DATE,
    field: 'approved_at'
  }
}, {
  tableName: 'sales_orders',
  timestamps: true,
  underscored: true
});

// 销售订单明细模型
const SalesOrderItem = sequelize.define('SalesOrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: SalesOrder,
      key: 'id'
    },
    field: 'order_id'
  },
  itemType: {
    type: DataTypes.ENUM('cattle', 'material', 'equipment'),
    allowNull: false,
    field: 'item_type'
  },
  // 牛只类字段
  cattleId: { type: DataTypes.INTEGER, field: 'cattle_id' },
  earTag: { type: DataTypes.STRING, field: 'ear_tag' },
  breed: { type: DataTypes.STRING, field: 'breed' },
  weight: { type: DataTypes.DECIMAL(8, 2), field: 'weight' },
  // 物资类字段
  materialId: { type: DataTypes.INTEGER, field: 'material_id' },
  materialName: { type: DataTypes.STRING, field: 'material_name' },
  materialUnit: { type: DataTypes.STRING, field: 'material_unit' },
  // 设备类字段
  equipmentId: { type: DataTypes.INTEGER, field: 'equipment_id' },
  equipmentName: { type: DataTypes.STRING, field: 'equipment_name' },
  equipmentUnit: { type: DataTypes.STRING, field: 'equipment_unit' },
  specification: { type: DataTypes.STRING, field: 'specification' },
  // 公共字段
  unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'unit_price' },
  quantity: { type: DataTypes.DECIMAL(10, 2), defaultValue: 1, field: 'quantity' },
  totalPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false, field: 'total_price' },
  delivered: { type: DataTypes.BOOLEAN, defaultValue: false, field: 'delivered' },
  deliveryDate: { type: DataTypes.DATE, field: 'delivery_date' },
  notes: DataTypes.TEXT,
  createdAt: { type: DataTypes.DATE, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, field: 'updated_at' }
}, {
  tableName: 'sales_order_items',
  timestamps: true
});

// 客户模型
const Customer = sequelize.define('Customer', {
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
    field: 'contact_person'
  },
  phone: {
    type: DataTypes.STRING
  },
  email: DataTypes.STRING,
  address: {
    type: DataTypes.TEXT
  },
  customerType: {
    type: DataTypes.STRING,
    field: 'customer_type'
  },
  businessLicense: {
    type: DataTypes.STRING,
    field: 'business_license'
  },
  taxNumber: {
    type: DataTypes.STRING,
    field: 'tax_number'
  },
  bankAccount: {
    type: DataTypes.STRING,
    field: 'bank_account'
  },
  creditLimit: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    field: 'credit_limit'
  },
  creditRating: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'credit_rating'
  },
  paymentTerms: {
    type: DataTypes.STRING,
    field: 'payment_terms'
  }
}, {
  tableName: 'customers',
  timestamps: true,
  underscored: true
});

// 客户回访记录模型
const CustomerVisitRecord = sequelize.define('CustomerVisitRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Customer,
      key: 'id'
    }
  },
  visitDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  visitType: {
    type: DataTypes.STRING,
    defaultValue: 'phone'
  },
  visitorId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  visitorName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  purpose: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  result: DataTypes.TEXT,
  nextVisitDate: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'completed'
  }
}, {
  tableName: 'customer_visit_records',
  timestamps: true,
  underscored: false  // 使用驼峰式字段名
});

// 设置关联关系
SalesOrder.hasMany(SalesOrderItem, {
  foreignKey: 'orderId',
  as: 'items',
  onDelete: 'CASCADE'
});

SalesOrderItem.belongsTo(SalesOrder, {
  foreignKey: 'orderId',
  as: 'order'
});

Customer.hasMany(CustomerVisitRecord, {
  foreignKey: 'customerId',
  as: 'visitRecords',
  onDelete: 'CASCADE'
});

CustomerVisitRecord.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer'
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
  
  const todayOrderCount = await SalesOrder.count({
    where: {
      createdAt: {
        [Sequelize.Op.gte]: new Date(now.getFullYear(), now.getMonth(), now.getDate())
      }
    }
  });
  
  const sequence = (todayOrderCount + 1).toString().padStart(4, '0');
  return `SO-${dateStr}-${sequence}`;
};

// Health check endpoint (direct access)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sales-service',
    name: 'Sales Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for API Gateway
app.get('/api/v1/sales/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sales-service',
    name: 'Sales Service',
    port: port,
    timestamp: new Date().toISOString()
  });
});

// Basic API endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Sales Service API',
    service: 'sales-service',
    version: '1.0.0',
    endpoints: ['/health', '/api/v1/sales/health', '/api/v1/sales/orders']
  });
});

// 获取销售订单列表
app.get('/api/v1/sales/orders', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      orderNumber,
      customerId,
      baseId,
      status,
      paymentStatus,
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

    if (customerId) {
      whereConditions.customerId = Number(customerId);
    }

    if (baseId) {
      whereConditions.baseId = Number(baseId);
    }

    if (status) {
      whereConditions.status = status;
    }

    if (paymentStatus) {
      whereConditions.paymentStatus = paymentStatus;
    }

    if (startDate && endDate) {
      whereConditions.orderDate = {
        [Sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { count, rows } = await SalesOrder.findAndCountAll({
      where: whereConditions,
      include: [{
        model: SalesOrderItem,
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
      message: '获取销售订单列表成功'
    });
  } catch (error) {
    console.error('获取销售订单列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取销售订单列表失败',
      error: error.message
    });
  }
});

// 获取销售订单详情
app.get('/api/v1/sales/orders/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const order = await SalesOrder.findByPk(id, {
      include: [{
        model: SalesOrderItem,
        as: 'items'
      }]
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '销售订单不存在',
        code: 'ORDER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { order },
      message: '获取销售订单详情成功'
    });
  } catch (error) {
    console.error('获取销售订单详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取销售订单详情失败',
      error: error.message
    });
  }
});

// 创建销售订单
app.post('/api/v1/sales/orders', authMiddleware, async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      customerId,
      customerName,
      baseId,
      baseName,
      orderDate,
      expectedDeliveryDate,
      paymentMethod,
      contractNumber,
      logisticsCompany,
      remark,
      taxAmount = 0,
      discountAmount = 0,
      items = []
    } = req.body;

    const user = req.user;

    if (!customerId || !customerName || !baseId || !baseName || !orderDate) {
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
        message: '订单必须包含至少一个牛只',
        code: 'NO_ORDER_ITEMS'
      });
    }

    const orderNumber = await generateOrderNumber();

    const subtotal = items.reduce((sum, item) => {
      return sum + (Number(item.weight) * Number(item.unitPrice));
    }, 0);
    const totalAmount = subtotal + Number(taxAmount) - Number(discountAmount);

    const order = await SalesOrder.create({
      orderNumber,
      customerId: Number(customerId),
      customerName,
      baseId: Number(baseId),
      baseName,
      orderDate: new Date(orderDate),
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      paymentMethod,
      contractNumber,
      logisticsCompany,
      remark,
      taxAmount: Number(taxAmount),
      discountAmount: Number(discountAmount),
      totalAmount,
      createdBy: user.id
    }, { transaction });

    const orderItems = items.map(item => {
      if (item.itemType === 'cattle') {
        return {
          orderId: order.id,
          itemType: 'cattle',
          cattleId: Number(item.cattleId),
          earTag: item.earTag,
          breed: item.breed,
          weight: Number(item.weight),
          unitPrice: Number(item.unitPrice),
          quantity: Number(item.quantity),
          totalPrice: Number(item.totalPrice),
          notes: item.remark
        }
      } else if (item.itemType === 'material') {
        return {
          orderId: order.id,
          itemType: 'material',
          materialId: item.materialId || null,
          materialName: item.materialName || '',
          materialUnit: item.materialUnit || '',
          unitPrice: Number(item.unitPrice),
          quantity: Number(item.quantity),
          totalPrice: Number(item.totalPrice),
          notes: item.remark
        }
      } else if (item.itemType === 'equipment') {
        return {
          orderId: order.id,
          itemType: 'equipment',
          equipmentId: item.equipmentId || null,
          equipmentName: item.equipmentName || '',
          equipmentUnit: item.equipmentUnit || '',
          specification: item.specification || '',
          unitPrice: Number(item.unitPrice),
          quantity: Number(item.quantity),
          totalPrice: Number(item.totalPrice),
          notes: item.remark
        }
      }
      return {}
    });

    await SalesOrderItem.bulkCreate(orderItems, { transaction });

    await transaction.commit();

    const createdOrder = await SalesOrder.findByPk(order.id, {
      include: [{
        model: SalesOrderItem,
        as: 'items'
      }]
    });

    res.status(201).json({
      success: true,
      data: { order: createdOrder },
      message: '创建销售订单成功'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('创建销售订单失败:', error);
    res.status(500).json({
      success: false,
      message: '创建销售订单失败',
      error: error.message
    });
  }
});

// 更新销售订单
app.put('/api/v1/sales/orders/:id', authMiddleware, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const {
      customerId,
      customerName,
      baseId,
      baseName,
      orderDate,
      expectedDeliveryDate,
      paymentMethod,
      contractNumber,
      logisticsCompany,
      remark,
      taxAmount = 0,
      discountAmount = 0,
      items = []
    } = req.body;

    const order = await SalesOrder.findByPk(id, { transaction });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: '销售订单不存在',
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
      return sum + (Number(item.weight) * Number(item.unitPrice));
    }, 0);
    const totalAmount = subtotal + Number(taxAmount) - Number(discountAmount);

    await order.update({
      customerId: Number(customerId),
      customerName,
      baseId: Number(baseId),
      baseName,
      orderDate: new Date(orderDate),
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : null,
      paymentMethod,
      contractNumber,
      logisticsCompany,
      remark,
      taxAmount: Number(taxAmount),
      discountAmount: Number(discountAmount),
      totalAmount
    }, { transaction });

    await SalesOrderItem.destroy({
      where: { orderId: order.id },
      transaction
    });

    const orderItems = items.map(item => {
      if (item.itemType === 'cattle') {
        return {
          orderId: order.id,
          itemType: 'cattle',
          cattleId: Number(item.cattleId),
          earTag: item.earTag,
          breed: item.breed,
          weight: Number(item.weight),
          unitPrice: Number(item.unitPrice),
          quantity: Number(item.quantity),
          totalPrice: Number(item.totalPrice),
          notes: item.remark
        }
      } else if (item.itemType === 'material') {
        return {
          orderId: order.id,
          itemType: 'material',
          materialId: item.materialId || null,
          materialName: item.materialName || '',
          materialUnit: item.materialUnit || '',
          unitPrice: Number(item.unitPrice),
          quantity: Number(item.quantity),
          totalPrice: Number(item.totalPrice),
          notes: item.remark
        }
      } else if (item.itemType === 'equipment') {
        return {
          orderId: order.id,
          itemType: 'equipment',
          equipmentId: item.equipmentId || null,
          equipmentName: item.equipmentName || '',
          equipmentUnit: item.equipmentUnit || '',
          specification: item.specification || '',
          unitPrice: Number(item.unitPrice),
          quantity: Number(item.quantity),
          totalPrice: Number(item.totalPrice),
          notes: item.remark
        }
      }
      return {}
    });

    await SalesOrderItem.bulkCreate(orderItems, { transaction });

    await transaction.commit();

    const updatedOrder = await SalesOrder.findByPk(order.id, {
      include: [{
        model: SalesOrderItem,
        as: 'items'
      }]
    });

    res.json({
      success: true,
      data: { order: updatedOrder },
      message: '更新销售订单成功'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('更新销售订单失败:', error);
    res.status(500).json({
      success: false,
      message: '更新销售订单失败',
      error: error.message
    });
  }
});

// 审批销售订单
app.post('/api/v1/sales/orders/:id/approve', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await SalesOrder.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '销售订单不存在',
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
      approvedAt: new Date()
    });

    const approvedOrder = await SalesOrder.findByPk(order.id, {
      include: [{
        model: SalesOrderItem,
        as: 'items'
      }]
    });

    res.json({
      success: true,
      data: { order: approvedOrder },
      message: '审批销售订单成功'
    });
  } catch (error) {
    console.error('审批销售订单失败:', error);
    res.status(500).json({
      success: false,
      message: '审批销售订单失败',
      error: error.message
    });
  }
});

// 取消销售订单
app.post('/api/v1/sales/orders/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = req.user;

    const order = await SalesOrder.findByPk(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '销售订单不存在',
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
      status: 'cancelled'
    });

    const cancelledOrder = await SalesOrder.findByPk(order.id, {
      include: [{
        model: SalesOrderItem,
        as: 'items'
      }]
    });

    res.json({
      success: true,
      data: { order: cancelledOrder },
      message: '取消销售订单成功'
    });
  } catch (error) {
    console.error('取消销售订单失败:', error);
    res.status(500).json({
      success: false,
      message: '取消销售订单失败',
      error: error.message
    });
  }
});

// 获取客户列表
app.get('/api/v1/sales/customers', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      name,
      customerType,
      status
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const whereConditions = {};

    if (name) {
      whereConditions.name = {
        [Sequelize.Op.iLike]: `%${name}%`
      };
    }

    if (customerType) {
      whereConditions.customerType = customerType;
    }

    // status字段在数据库中不存在，暂时注释掉
    // if (status) {
    //   whereConditions.status = status;
    // }

    const { count, rows } = await Customer.findAndCountAll({
      where: whereConditions,
      include: [{
        model: CustomerVisitRecord,
        as: 'visitRecords',
        required: false,
        limit: 5
      }],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        customers: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit))
        }
      },
      message: '获取客户列表成功'
    });
  } catch (error) {
    console.error('获取客户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客户列表失败',
      error: error.message
    });
  }
});

// 创建客户
app.post('/api/v1/sales/customers', authMiddleware, async (req, res) => {
  try {
    console.log('📥 创建客户请求数据:', JSON.stringify(req.body, null, 2));
    
    const {
      name,
      contactPerson,
      contact_person,
      phone,
      email,
      address,
      customerType,
      customer_type,
      businessLicense,
      business_license,
      taxNumber,
      tax_number,
      bankAccount,
      bank_account,
      creditLimit = 0,
      credit_limit = 0,
      creditRating = 5,
      credit_rating = 5,
      paymentTerms,
      payment_terms,
      remark
    } = req.body;

    const user = req.user;

    // 支持多种字段名格式
    const customerName = name || req.body.customerName;
    const customerContactPerson = contactPerson || contact_person || req.body.contactPerson;
    const customerPhone = phone || req.body.customerPhone;
    const customerAddress = address || req.body.customerAddress;

    console.log('🔍 解析后的字段值:', {
      customerName,
      customerContactPerson,
      customerPhone,
      customerAddress
    });

    // 只验证最基本的必填字段
    if (!customerName) {
      return res.status(400).json({
        success: false,
        message: '请提供客户名称',
        code: 'MISSING_CUSTOMER_NAME'
      });
    }

    const existingCustomer = await Customer.findOne({
      where: { name: customerName }
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: '客户名称已存在',
        code: 'CUSTOMER_NAME_EXISTS'
      });
    }

    // 使用解析后的字段值创建客户
    const finalCustomerType = customerType || customer_type || '加工企业';
    const finalBusinessLicense = businessLicense || business_license;
    const finalTaxNumber = taxNumber || tax_number;
    const finalBankAccount = bankAccount || bank_account;
    const finalCreditLimit = Number(creditLimit || credit_limit || 0);
    const finalCreditRating = Number(creditRating || credit_rating || 5);
    const finalPaymentTerms = paymentTerms || payment_terms;

    console.log('💾 准备创建客户，最终数据:', {
      name: customerName,
      contactPerson: customerContactPerson,
      phone: customerPhone,
      email,
      address: customerAddress,
      customerType: finalCustomerType,
      businessLicense: finalBusinessLicense,
      taxNumber: finalTaxNumber,
      bankAccount: finalBankAccount,
      creditLimit: finalCreditLimit,
      creditRating: finalCreditRating,
      paymentTerms: finalPaymentTerms,
      remark
    });

    const customer = await Customer.create({
      name: customerName,
      contactPerson: customerContactPerson,
      phone: customerPhone,
      email,
      address: customerAddress,
      customerType: finalCustomerType,
      businessLicense: finalBusinessLicense,
      taxNumber: finalTaxNumber,
      bankAccount: finalBankAccount,
      creditLimit: finalCreditLimit,
      creditRating: finalCreditRating,
      paymentTerms: finalPaymentTerms
    });

    res.status(201).json({
      success: true,
      data: { customer },
      message: '创建客户成功'
    });
  } catch (error) {
    console.error('创建客户失败:', error);
    res.status(500).json({
      success: false,
      message: '创建客户失败',
      error: error.message
    });
  }
});

// 获取客户类型列表（必须在客户详情路由之前）
app.get('/api/v1/sales/customers/types', authMiddleware, async (req, res) => {
  try {
    const customerTypes = [
      { value: '加工企业', label: '加工企业' },
      { value: '物流企业', label: '物流企业' },
      { value: '餐饮企业', label: '餐饮企业' },
      { value: '零售商', label: '零售商' },
      { value: '批发商', label: '批发商' },
      { value: '个人客户', label: '个人客户' }
    ];

    res.json({
      success: true,
      data: customerTypes,
      message: '获取客户类型列表成功'
    });
  } catch (error) {
    console.error('获取客户类型列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客户类型列表失败',
      error: error.message
    });
  }
});

// 获取客户详情
app.get('/api/v1/sales/customers/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // 验证ID参数
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: '无效的客户ID',
        code: 'INVALID_CUSTOMER_ID'
      });
    }

    const customer = await Customer.findByPk(Number(id), {
      include: [{
        model: CustomerVisitRecord,
        as: 'visitRecords',
        order: [['createdAt', 'DESC']]
      }]
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { customer },
      message: '获取客户详情成功'
    });
  } catch (error) {
    console.error('获取客户详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客户详情失败',
      error: error.message
    });
  }
});

// 更新客户
app.put('/api/v1/sales/customers/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      contactPerson,
      phone,
      email,
      address,
      customerType,
      businessLicense,
      taxNumber,
      bankAccount,
      creditLimit,
      creditRating,
      paymentTerms,
      status,
      remark
    } = req.body;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    // 检查名称是否重复（排除自己）
    if (name && name !== customer.name) {
      const existingCustomer = await Customer.findOne({
        where: { 
          name,
          id: { [Sequelize.Op.ne]: id }
        }
      });

      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: '客户名称已存在',
          code: 'CUSTOMER_NAME_EXISTS'
        });
      }
    }

    await customer.update({
      name: name || customer.name,
      contactPerson: contactPerson || customer.contactPerson,
      phone: phone || customer.phone,
      email: email || customer.email,
      address: address || customer.address,
      customerType: customerType || customer.customerType,
      businessLicense: businessLicense || customer.businessLicense,
      taxNumber: taxNumber || customer.taxNumber,
      bankAccount: bankAccount || customer.bankAccount,
      creditLimit: creditLimit !== undefined ? Number(creditLimit) : customer.creditLimit,
      creditRating: creditRating !== undefined ? Number(creditRating) : customer.creditRating,
      paymentTerms: paymentTerms || customer.paymentTerms
    });

    res.json({
      success: true,
      data: { customer },
      message: '更新客户成功'
    });
  } catch (error) {
    console.error('更新客户失败:', error);
    res.status(500).json({
      success: false,
      message: '更新客户失败',
      error: error.message
    });
  }
});

// 删除客户
app.delete('/api/v1/sales/customers/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    // 检查是否有关联的销售订单
    const orderCount = await SalesOrder.count({
      where: { customerId: id }
    });

    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: '该客户存在关联的销售订单，无法删除',
        code: 'CUSTOMER_HAS_ORDERS'
      });
    }

    await customer.destroy();

    res.json({
      success: true,
      message: '删除客户成功'
    });
  } catch (error) {
    console.error('删除客户失败:', error);
    res.status(500).json({
      success: false,
      message: '删除客户失败',
      error: error.message
    });
  }
});

// 创建客户回访记录
app.post('/api/v1/sales/customers/:id/visits', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      visitDate,
      visit_date,
      visitType,
      visit_type,
      purpose,
      content,
      result,
      nextVisitDate,
      next_visit_date
    } = req.body;

    const user = req.user;

    const customer = await Customer.findByPk(id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: '客户不存在',
        code: 'CUSTOMER_NOT_FOUND'
      });
    }

    // 处理日期字段，支持多种格式
    const finalVisitDate = visitDate || visit_date;
    const finalVisitType = visitType || visit_type || 'phone';
    const finalNextVisitDate = nextVisitDate || next_visit_date;

    // 验证必填字段
    if (!finalVisitDate) {
      return res.status(400).json({
        success: false,
        message: '回访日期不能为空',
        code: 'MISSING_VISIT_DATE'
      });
    }

    if (!purpose) {
      return res.status(400).json({
        success: false,
        message: '回访目的不能为空',
        code: 'MISSING_PURPOSE'
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        message: '回访内容不能为空',
        code: 'MISSING_CONTENT'
      });
    }

    // 安全的日期转换函数
    const parseDate = (dateValue) => {
      if (!dateValue) return null;
      
      // 如果已经是Date对象
      if (dateValue instanceof Date) {
        return isNaN(dateValue.getTime()) ? null : dateValue;
      }
      
      // 如果是字符串
      if (typeof dateValue === 'string') {
        // 处理空字符串
        if (!dateValue.trim()) return null;
        
        const parsed = new Date(dateValue);
        return isNaN(parsed.getTime()) ? null : parsed;
      }
      
      // 其他情况尝试转换
      const parsed = new Date(dateValue);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const parsedVisitDate = parseDate(finalVisitDate);
    const parsedNextVisitDate = parseDate(finalNextVisitDate);

    if (!parsedVisitDate) {
      return res.status(400).json({
        success: false,
        message: '回访日期格式无效',
        code: 'INVALID_VISIT_DATE'
      });
    }

    console.log('📅 创建回访记录，日期信息:', {
      原始visitDate: finalVisitDate,
      解析后visitDate: parsedVisitDate,
      原始nextVisitDate: finalNextVisitDate,
      解析后nextVisitDate: parsedNextVisitDate
    });

    const visitRecord = await CustomerVisitRecord.create({
      customerId: Number(id),
      visitDate: parsedVisitDate,
      visitType: finalVisitType,
      visitorId: user.id,
      visitorName: user.name,
      purpose,
      content,
      result,
      nextVisitDate: parsedNextVisitDate
    });

    res.status(201).json({
      success: true,
      data: { visitRecord },
      message: '创建回访记录成功'
    });
  } catch (error) {
    console.error('创建回访记录失败:', error);
    res.status(500).json({
      success: false,
      message: '创建回访记录失败',
      error: error.message
    });
  }
});

// 获取基地列表
app.get('/api/v1/sales/bases', authMiddleware, async (req, res) => {
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

// 获取牛只列表（用于销售订单选择）
app.get('/api/v1/sales/cattle', authMiddleware, async (req, res) => {
  try {
    const { baseId, status = 'healthy' } = req.query;

    // 模拟牛只数据
    const mockCattle = [
      {
        id: 1,
        earTag: 'C001',
        breed: '安格斯牛',
        weight: 520.5,
        age: 24,
        gender: 'male',
        status: 'healthy',
        baseId: 1,
        baseName: '主基地',
        estimatedPrice: 26000
      },
      {
        id: 2,
        earTag: 'C002',
        breed: '西门塔尔牛',
        weight: 480.0,
        age: 22,
        gender: 'female',
        status: 'healthy',
        baseId: 1,
        baseName: '主基地',
        estimatedPrice: 24000
      },
      {
        id: 3,
        earTag: 'C003',
        breed: '夏洛莱牛',
        weight: 550.0,
        age: 26,
        gender: 'male',
        status: 'healthy',
        baseId: 2,
        baseName: '分基地A',
        estimatedPrice: 27500
      }
    ];

    let filteredCattle = mockCattle.filter(cattle => cattle.status === status);

    if (baseId) {
      filteredCattle = filteredCattle.filter(cattle => cattle.baseId === Number(baseId));
    }

    res.json({
      success: true,
      data: {
        cattle: filteredCattle,
        pagination: {
          total: filteredCattle.length,
          page: 1,
          limit: 100,
          pages: 1
        }
      },
      message: '获取牛只列表成功'
    });
  } catch (error) {
    console.error('获取牛只列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取牛只列表失败',
      error: error.message
    });
  }
});

// 批量审批订单
app.post('/api/v1/sales/orders/batch-approve', authMiddleware, async (req, res) => {
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
        const order = await SalesOrder.findByPk(orderId, { transaction });
        
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

// 获取销售统计数据
app.get('/api/v1/sales/statistics', authMiddleware, async (req, res) => {
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
    const totalOrders = await SalesOrder.count({ where: whereConditions });
    const pendingOrders = await SalesOrder.count({ 
      where: { ...whereConditions, status: 'pending' } 
    });
    const approvedOrders = await SalesOrder.count({ 
      where: { ...whereConditions, status: 'approved' } 
    });
    const completedOrders = await SalesOrder.count({ 
      where: { ...whereConditions, status: 'completed' } 
    });

    const totalAmountResult = await SalesOrder.sum('totalAmount', { where: whereConditions });
    const totalAmount = totalAmountResult || 0;
    const avgOrderAmount = totalOrders > 0 ? totalAmount / totalOrders : 0;

    const activeCustomers = await Customer.count({ where: { status: 'active' } });

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        approvedOrders,
        completedOrders,
        totalAmount,
        avgOrderAmount,
        activeCustomers
      },
      message: '获取销售统计数据成功'
    });
  } catch (error) {
    console.error('获取销售统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取销售统计数据失败',
      error: error.message
    });
  }
});

// 获取销售趋势数据
app.get('/api/v1/sales/statistics/trend', authMiddleware, async (req, res) => {
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
    const monthlyStats = await SalesOrder.findAll({
      where: whereConditions,
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('order_date')), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'orderCount'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'totalAmount'],
        [Sequelize.fn('AVG', Sequelize.col('total_amount')), 'avgAmount']
      ],
      group: [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('order_date'))],
      order: [[Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('order_date')), 'ASC']]
    });

    res.json({
      success: true,
      data: { monthlyStats },
      message: '获取销售趋势数据成功'
    });
  } catch (error) {
    console.error('获取销售趋势数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取销售趋势数据失败',
      error: error.message
    });
  }
});

// 获取客户排行
app.get('/api/v1/sales/statistics/customer-ranking', authMiddleware, async (req, res) => {
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

    const customerStats = await SalesOrder.findAll({
      where: whereConditions,
      attributes: [
        'customerId',
        'customerName',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'orderCount'],
        [Sequelize.fn('SUM', Sequelize.col('total_amount')), 'totalAmount'],
        [Sequelize.fn('AVG', Sequelize.col('total_amount')), 'avgAmount']
      ],
      group: ['customerId', 'customerName'],
      order: [[Sequelize.fn('SUM', Sequelize.col('total_amount')), 'DESC']],
      limit: Number(limit)
    });

    // 获取客户评级信息
    const customerIds = customerStats.map(item => item.dataValues.customerId);
    const customers = await Customer.findAll({
      where: { id: { [Sequelize.Op.in]: customerIds } },
      attributes: ['id', 'creditRating']
    });

    const customerRatingMap = {};
    customers.forEach(customer => {
      customerRatingMap[customer.id] = customer.creditRating;
    });

    const customerRanking = customerStats.map(item => ({
      ...item.dataValues,
      creditRating: customerRatingMap[item.dataValues.customerId] || 5,
      satisfactionRate: Math.floor(Math.random() * 20) + 80 // 模拟满意度
    }));

    res.json({
      success: true,
      data: { customerRanking },
      message: '获取客户排行成功'
    });
  } catch (error) {
    console.error('获取客户排行失败:', error);
    res.status(500).json({
      success: false,
      message: '获取客户排行失败',
      error: error.message
    });
  }
});

// 数据库同步
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 同步模型到数据库
    await sequelize.sync({ alter: false });
    console.log('数据库模型同步完成');
  } catch (error) {
    console.error('数据库连接失败:', error);
  }
};

// 启动时同步数据库
syncDatabase();

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    service: 'sales-service',
    path: req.originalUrl,
    code: 'ROUTE_NOT_FOUND'
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`sales-service listening on port ${port}`);
});
