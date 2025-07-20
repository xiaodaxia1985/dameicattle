import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { 
  MaterialCategory, 
  Supplier, 
  ProductionMaterial, 
  Inventory, 
  InventoryTransaction, 
  InventoryAlert,
  Base,
  User
} from '@/models';
import { AppError } from '@/utils/errors';

export class MaterialController {
  // Material Categories
  async getMaterialCategories(req: Request, res: Response) {
    try {
      const categories = await MaterialCategory.findAll({
        include: [
          {
            model: MaterialCategory,
            as: 'parent',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: MaterialCategory,
            as: 'children',
            attributes: ['id', 'name', 'code'],
          },
        ],
        order: [['created_at', 'ASC']],
      });

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      throw new AppError('获取物资分类失败', 500);
    }
  }

  async createMaterialCategory(req: Request, res: Response) {
    try {
      const { name, code, description, parent_id } = req.body;

      // Check if code already exists
      const existingCategory = await MaterialCategory.findOne({ where: { code } });
      if (existingCategory) {
        throw new AppError('分类编码已存在', 400);
      }

      // If parent_id is provided, check if parent exists
      if (parent_id) {
        const parentCategory = await MaterialCategory.findByPk(parent_id);
        if (!parentCategory) {
          throw new AppError('父分类不存在', 400);
        }
      }

      const category = await MaterialCategory.create({
        name,
        code,
        description,
        parent_id,
      });

      res.status(201).json({
        success: true,
        data: category,
        message: '物资分类创建成功',
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('创建物资分类失败', 500);
    }
  }

  async updateMaterialCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, code, description, parent_id } = req.body;

      const category = await MaterialCategory.findByPk(id);
      if (!category) {
        throw new AppError('物资分类不存在', 404);
      }

      // Check if code already exists (excluding current category)
      if (code !== category.code) {
        const existingCategory = await MaterialCategory.findOne({ 
          where: { code, id: { [Op.ne]: id } } 
        });
        if (existingCategory) {
          throw new AppError('分类编码已存在', 400);
        }
      }

      // Prevent setting parent to self or descendant
      if (parent_id && parent_id === parseInt(id)) {
        throw new AppError('不能将分类设置为自己的父分类', 400);
      }

      await category.update({
        name,
        code,
        description,
        parent_id,
      });

      res.json({
        success: true,
        data: category,
        message: '物资分类更新成功',
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('更新物资分类失败', 500);
    }
  }

  async deleteMaterialCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const category = await MaterialCategory.findByPk(id);
      if (!category) {
        throw new AppError('物资分类不存在', 404);
      }

      // Check if category has children
      const childrenCount = await MaterialCategory.count({ where: { parent_id: id } });
      if (childrenCount > 0) {
        throw new AppError('该分类下存在子分类，无法删除', 400);
      }

      // Check if category has materials
      const materialsCount = await ProductionMaterial.count({ where: { category_id: id } });
      if (materialsCount > 0) {
        throw new AppError('该分类下存在物资，无法删除', 400);
      }

      await category.destroy();

      res.json({
        success: true,
        message: '物资分类删除成功',
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('删除物资分类失败', 500);
    }
  }

  // Suppliers
  async getSuppliers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, keyword, supplier_type, status = 'active' } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = { status };

      if (keyword) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${keyword}%` } },
          { contact_person: { [Op.iLike]: `%${keyword}%` } },
        ];
      }

      if (supplier_type) {
        whereClause.supplier_type = supplier_type;
      }

      const { count, rows: suppliers } = await Supplier.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      res.json({
        success: true,
        data: suppliers,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      throw new AppError('获取供应商列表失败', 500);
    }
  }

  async createSupplier(req: Request, res: Response) {
    try {
      const supplierData = req.body;

      const supplier = await Supplier.create(supplierData);

      res.status(201).json({
        success: true,
        data: supplier,
        message: '供应商创建成功',
      });
    } catch (error) {
      throw new AppError('创建供应商失败', 500);
    }
  }

  async updateSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const supplierData = req.body;

      const supplier = await Supplier.findByPk(id);
      if (!supplier) {
        throw new AppError('供应商不存在', 404);
      }

      await supplier.update(supplierData);

      res.json({
        success: true,
        data: supplier,
        message: '供应商更新成功',
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('更新供应商失败', 500);
    }
  }

  async deleteSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const supplier = await Supplier.findByPk(id);
      if (!supplier) {
        throw new AppError('供应商不存在', 404);
      }

      // Check if supplier has materials
      const materialsCount = await ProductionMaterial.count({ where: { supplier_id: id } });
      if (materialsCount > 0) {
        throw new AppError('该供应商下存在物资，无法删除', 400);
      }

      await supplier.destroy();

      res.json({
        success: true,
        message: '供应商删除成功',
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('删除供应商失败', 500);
    }
  }

  // Production Materials
  async getProductionMaterials(req: Request, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        category_id, 
        supplier_id, 
        status = 'active', 
        keyword 
      } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = { status };

      if (category_id) {
        whereClause.category_id = category_id;
      }

      if (supplier_id) {
        whereClause.supplier_id = supplier_id;
      }

      if (keyword) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${keyword}%` } },
          { code: { [Op.iLike]: `%${keyword}%` } },
        ];
      }

      const { count, rows: materials } = await ProductionMaterial.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: MaterialCategory,
            as: 'category',
            attributes: ['id', 'name', 'code'],
          },
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'contact_person'],
          },
        ],
        limit: Number(limit),
        offset,
        order: [['created_at', 'DESC']],
      });

      res.json({
        success: true,
        data: materials,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(count / Number(limit)),
        },
      });
    } catch (error) {
      throw new AppError('获取生产物资列表失败', 500);
    }
  }

  async createProductionMaterial(req: Request, res: Response) {
    try {
      const materialData = req.body;

      // Check if code already exists
      const existingMaterial = await ProductionMaterial.findOne({ 
        where: { code: materialData.code } 
      });
      if (existingMaterial) {
        throw new AppError('物资编码已存在', 400);
      }

      // Verify category exists
      const category = await MaterialCategory.findByPk(materialData.category_id);
      if (!category) {
        throw new AppError('物资分类不存在', 400);
      }

      // Verify supplier exists if provided
      if (materialData.supplier_id) {
        const supplier = await Supplier.findByPk(materialData.supplier_id);
        if (!supplier) {
          throw new AppError('供应商不存在', 400);
        }
      }

      const material = await ProductionMaterial.create(materialData);

      // Load associations for response
      await material.reload({
        include: [
          { model: MaterialCategory, as: 'category' },
          { model: Supplier, as: 'supplier' },
        ],
      });

      res.status(201).json({
        success: true,
        data: material,
        message: '生产物资创建成功',
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('创建生产物资失败', 500);
    }
  }

  async updateProductionMaterial(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const materialData = req.body;

      const material = await ProductionMaterial.findByPk(id);
      if (!material) {
        throw new AppError('生产物资不存在', 404);
      }

      // Check if code already exists (excluding current material)
      if (materialData.code !== material.code) {
        const existingMaterial = await ProductionMaterial.findOne({ 
          where: { code: materialData.code, id: { [Op.ne]: id } } 
        });
        if (existingMaterial) {
          throw new AppError('物资编码已存在', 400);
        }
      }

      await material.update(materialData);

      // Load associations for response
      await material.reload({
        include: [
          { model: MaterialCategory, as: 'category' },
          { model: Supplier, as: 'supplier' },
        ],
      });

      res.json({
        success: true,
        data: material,
        message: '生产物资更新成功',
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('更新生产物资失败', 500);
    }
  }

  async deleteProductionMaterial(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const material = await ProductionMaterial.findByPk(id);
      if (!material) {
        throw new AppError('生产物资不存在', 404);
      }

      // Check if material has inventory records
      const inventoryCount = await Inventory.count({ where: { material_id: id } });
      if (inventoryCount > 0) {
        throw new AppError('该物资存在库存记录，无法删除', 400);
      }

      await material.destroy();

      res.json({
        success: true,
        message: '生产物资删除成功',
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('删除生产物资失败', 500);
    }
  }

  async getProductionMaterialById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const material = await ProductionMaterial.findByPk(id, {
        include: [
          { model: MaterialCategory, as: 'category' },
          { model: Supplier, as: 'supplier' },
        ],
      });

      if (!material) {
        throw new AppError('生产物资不存在', 404);
      }

      res.json({
        success: true,
        data: material,
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('获取生产物资详情失败', 500);
    }
  }
}