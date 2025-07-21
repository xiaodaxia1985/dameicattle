import { Request, Response } from 'express';
import { Op, Transaction } from 'sequelize';
import { Cattle, CattleEvent, Base, Barn, sequelize } from '@/models';
import { logger } from '@/utils/logger';
import { ValidationError } from '@/utils/errors';
import * as XLSX from 'xlsx';
import { Parser } from 'json2csv';

export class CattleBatchController {
  // Batch import cattle from Excel/CSV
  static async batchImportCattle(req: Request, res: Response): Promise<Response | void> {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const user = (req as any).user;
      const file = req.file;

      if (!file) {
        throw new ValidationError('请上传文件');
      }

      // Parse Excel/CSV file
      let cattleData: any[] = [];
      
      if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheet')) {
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        cattleData = XLSX.utils.sheet_to_json(worksheet);
      } else if (file.mimetype.includes('csv')) {
        const workbook = XLSX.read(file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        cattleData = XLSX.utils.sheet_to_json(worksheet);
      } else {
        throw new ValidationError('不支持的文件格式，请上传Excel或CSV文件');
      }

      if (cattleData.length === 0) {
        throw new ValidationError('文件中没有数据');
      }

      if (cattleData.length > 100) {
        throw new ValidationError('批量导入不能超过100条数据');
      }

      // Validate and process data
      const processedData: any[] = [];
      const errors: any[] = [];
      const existingEarTags = new Set();

      // Check for existing ear tags in database
      const earTags = cattleData.map(item => item.ear_tag || item['耳标号'] || item['Ear Tag']).filter(Boolean);
      const existingCattle = await Cattle.findAll({
        where: { ear_tag: { [Op.in]: earTags } },
        attributes: ['ear_tag']
      });
      
      existingCattle.forEach(cattle => existingEarTags.add(cattle.ear_tag));

      for (let i = 0; i < cattleData.length; i++) {
        const row = cattleData[i];
        const rowIndex = i + 2; // Excel row number (starting from 2)

        try {
          // Map Chinese/English column names to database fields
          const mappedData = {
            ear_tag: row.ear_tag || row['耳标号'] || row['Ear Tag'],
            breed: row.breed || row['品种'] || row['Breed'],
            gender: row.gender || row['性别'] || row['Gender'],
            birth_date: row.birth_date || row['出生日期'] || row['Birth Date'],
            weight: row.weight || row['体重'] || row['Weight'],
            base_id: row.base_id || row['基地ID'] || row['Base ID'],
            barn_id: row.barn_id || row['牛棚ID'] || row['Barn ID'],
            source: row.source || row['来源'] || row['Source'] || 'purchased',
            purchase_price: row.purchase_price || row['采购价格'] || row['Purchase Price'],
            purchase_date: row.purchase_date || row['采购日期'] || row['Purchase Date'],
            notes: row.notes || row['备注'] || row['Notes']
          };

          // Validate required fields
          if (!mappedData.ear_tag) {
            errors.push({ row: rowIndex, field: 'ear_tag', message: '耳标号不能为空' });
            continue;
          }
          if (!mappedData.breed) {
            errors.push({ row: rowIndex, field: 'breed', message: '品种不能为空' });
            continue;
          }
          if (!mappedData.gender) {
            errors.push({ row: rowIndex, field: 'gender', message: '性别不能为空' });
            continue;
          }
          if (!mappedData.base_id) {
            errors.push({ row: rowIndex, field: 'base_id', message: '基地ID不能为空' });
            continue;
          }

          // Check for duplicate ear tags in current batch
          if (processedData.some(item => item.ear_tag === mappedData.ear_tag)) {
            errors.push({ row: rowIndex, field: 'ear_tag', message: '耳标号在当前批次中重复' });
            continue;
          }

          // Check for existing ear tags in database
          if (existingEarTags.has(mappedData.ear_tag)) {
            errors.push({ row: rowIndex, field: 'ear_tag', message: '耳标号已存在于数据库中' });
            continue;
          }

          // Normalize gender
          if (mappedData.gender) {
            const genderMap: { [key: string]: string } = {
              '公': 'male', '母': 'female', '雄': 'male', '雌': 'female',
              'male': 'male', 'female': 'female', 'M': 'male', 'F': 'female'
            };
            mappedData.gender = genderMap[mappedData.gender] || mappedData.gender;
          }

          // Parse dates
          if (mappedData.birth_date) {
            mappedData.birth_date = new Date(mappedData.birth_date);
            if (isNaN(mappedData.birth_date.getTime())) {
              errors.push({ row: rowIndex, field: 'birth_date', message: '出生日期格式无效' });
              continue;
            }
          }

          if (mappedData.purchase_date) {
            mappedData.purchase_date = new Date(mappedData.purchase_date);
            if (isNaN(mappedData.purchase_date.getTime())) {
              errors.push({ row: rowIndex, field: 'purchase_date', message: '采购日期格式无效' });
              continue;
            }
          }

          // Parse numbers
          if (mappedData.weight) {
            mappedData.weight = parseFloat(mappedData.weight);
            if (isNaN(mappedData.weight)) {
              errors.push({ row: rowIndex, field: 'weight', message: '体重必须是数字' });
              continue;
            }
          }

          if (mappedData.purchase_price) {
            mappedData.purchase_price = parseFloat(mappedData.purchase_price);
            if (isNaN(mappedData.purchase_price)) {
              errors.push({ row: rowIndex, field: 'purchase_price', message: '采购价格必须是数字' });
              continue;
            }
          }

          // Check user permissions for base access
          if (user.role?.name !== 'admin' && user.base_id && mappedData.base_id !== user.base_id) {
            errors.push({ row: rowIndex, field: 'base_id', message: '权限不足，无法访问该基地' });
            continue;
          }

          processedData.push(mappedData);
        } catch (error) {
          errors.push({ row: rowIndex, field: 'general', message: `处理数据时出错: ${error}` });
        }
      }

      if (errors.length > 0) {
        await transaction.rollback();
        return res.status(422).json({
          success: false,
          error: {
            code: 'BATCH_VALIDATION_ERROR',
            message: '批量导入数据验证失败',
            details: errors
          }
        });
      }

      // Create cattle records
      const createdCattle: any[] = [];
      const creationErrors: any[] = [];

      for (const cattleData of processedData) {
        try {
          const cattle = await Cattle.create(cattleData, { transaction });
          
          // Create initial event
          await CattleEvent.create({
            cattle_id: cattle.id,
            event_type: cattleData.source || 'purchase',
            event_date: cattleData.purchase_date || new Date(),
            description: `批量导入 - ${cattleData.source === 'born' ? '出生' : '采购'}`,
            operator_id: user.id,
            data: {
              initial_weight: cattleData.weight,
              purchase_price: cattleData.purchase_price,
              batch_import: true
            }
          }, { transaction });

          // Update barn current count if barn is specified
          if (cattleData.barn_id) {
            await Barn.increment('current_count', {
              where: { id: cattleData.barn_id },
              transaction
            });
          }

          createdCattle.push(cattle);
        } catch (error) {
          creationErrors.push({
            ear_tag: cattleData.ear_tag,
            error: error instanceof Error ? error.message : '创建失败'
          });
        }
      }

      if (creationErrors.length > 0) {
        await transaction.rollback();
        return res.status(500).json({
          success: false,
          error: {
            code: 'BATCH_CREATE_ERROR',
            message: '批量创建牛只失败',
            details: creationErrors
          }
        });
      }

      await transaction.commit();

      res.status(201).json({
        success: true,
        data: {
          imported_count: createdCattle.length,
          cattle: createdCattle
        },
        message: `成功导入${createdCattle.length}条牛只记录`
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Error in batch import cattle:', error);
      
      if (error instanceof ValidationError) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'BATCH_IMPORT_ERROR',
            message: '批量导入失败',
            details: error
          }
        });
      }
    }
  }

  // Export cattle data to Excel
  static async exportCattle(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { baseId, format = 'excel' } = req.query;

      const whereClause: any = { status: 'active' };
      
      // Apply base filter
      if (baseId) {
        whereClause.base_id = baseId;
      } else if (user.role?.name !== 'admin' && user.base_id) {
        whereClause.base_id = user.base_id;
      }

      const cattle = await Cattle.findAll({
        where: whereClause,
        include: [
          {
            model: Base,
            as: 'base',
            attributes: ['name', 'code']
          },
          {
            model: Barn,
            as: 'barn',
            attributes: ['name', 'code']
          }
        ],
        order: [['created_at', 'DESC']]
      });

      // Transform data for export
      const exportData = cattle.map(cow => ({
        '耳标号': cow.ear_tag,
        '品种': cow.breed,
        '性别': cow.gender === 'male' ? '公' : '母',
        '出生日期': cow.birth_date ? cow.birth_date.toISOString().split('T')[0] : '',
        '体重(kg)': cow.weight || '',
        '健康状态': cow.health_status === 'healthy' ? '健康' : cow.health_status === 'sick' ? '生病' : '治疗中',
        '基地名称': cow.base?.name || '',
        '基地编码': cow.base?.code || '',
        '牛棚名称': cow.barn?.name || '',
        '牛棚编码': cow.barn?.code || '',
        '来源': cow.source === 'born' ? '出生' : cow.source === 'purchased' ? '采购' : '转入',
        '采购价格': cow.purchase_price || '',
        '采购日期': cow.purchase_date ? cow.purchase_date.toISOString().split('T')[0] : '',
        '状态': cow.status === 'active' ? '在场' : cow.status === 'sold' ? '已售' : cow.status === 'dead' ? '死亡' : '转出',
        '备注': cow.notes || '',
        '创建时间': cow.created_at.toISOString().split('T')[0]
      }));

      if (format === 'csv') {
        // Export as CSV
        const parser = new Parser();
        const csv = parser.parse(exportData);
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=cattle_export_${new Date().toISOString().split('T')[0]}.csv`);
        res.send('\uFEFF' + csv); // Add BOM for proper UTF-8 encoding
      } else {
        // Export as Excel
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, '牛只数据');
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=cattle_export_${new Date().toISOString().split('T')[0]}.xlsx`);
        res.send(buffer);
      }
    } catch (error) {
      logger.error('Error exporting cattle:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: '导出失败',
          details: error
        }
      });
    }
  }

  // Generate ear tags in batch
  static async generateEarTags(req: Request, res: Response) {
    try {
      const { prefix, count, startNumber = 1 } = req.body;

      if (!prefix || !count) {
        throw new ValidationError('前缀和数量不能为空');
      }

      if (count > 100) {
        throw new ValidationError('批量生成不能超过100个耳标');
      }

      const earTags: string[] = [];
      const existingTags = new Set();

      // Check existing ear tags with the same prefix
      const existingCattle = await Cattle.findAll({
        where: {
          ear_tag: {
            [Op.like]: `${prefix}%`
          }
        },
        attributes: ['ear_tag']
      });

      existingCattle.forEach(cattle => existingTags.add(cattle.ear_tag));

      // Generate ear tags
      let currentNumber = startNumber;
      for (let i = 0; i < count; i++) {
        let earTag: string;
        do {
          earTag = `${prefix}${String(currentNumber).padStart(4, '0')}`;
          currentNumber++;
        } while (existingTags.has(earTag));
        
        earTags.push(earTag);
        existingTags.add(earTag);
      }

      res.json({
        success: true,
        data: {
          ear_tags: earTags,
          prefix,
          count: earTags.length
        }
      });
    } catch (error) {
      logger.error('Error generating ear tags:', error);
      if (error instanceof ValidationError) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'GENERATE_TAGS_ERROR',
            message: '生成耳标失败',
            details: error
          }
        });
      }
    }
  }

  // Batch transfer cattle between barns
  static async batchTransferCattle(req: Request, res: Response): Promise<Response | void> {
    const transaction: Transaction = await sequelize.transaction();
    
    try {
      const user = (req as any).user;
      const { cattle_ids, from_barn_id, to_barn_id, reason } = req.body;

      if (!cattle_ids || !Array.isArray(cattle_ids) || cattle_ids.length === 0) {
        throw new ValidationError('请选择要转移的牛只');
      }

      if (cattle_ids.length > 50) {
        throw new ValidationError('批量转移不能超过50头牛');
      }

      // Check user permissions and get cattle
      const whereClause: any = { 
        id: { [Op.in]: cattle_ids },
        status: 'active'
      };
      
      if (user.role?.name !== 'admin' && user.base_id) {
        whereClause.base_id = user.base_id;
      }

      const cattle = await Cattle.findAll({
        where: whereClause,
        transaction
      });

      if (cattle.length !== cattle_ids.length) {
        throw new ValidationError('部分牛只不存在或权限不足');
      }

      // Verify barns exist and belong to the same base
      const baseIds = [...new Set(cattle.map(cow => cow.base_id))];
      if (baseIds.length > 1) {
        throw new ValidationError('所选牛只必须属于同一个基地');
      }

      const baseId = baseIds[0];

      if (from_barn_id) {
        const fromBarn = await Barn.findOne({
          where: { id: from_barn_id, base_id: baseId },
          transaction
        });
        if (!fromBarn) {
          throw new ValidationError('源牛棚不存在或不属于该基地');
        }
      }

      if (to_barn_id) {
        const toBarn = await Barn.findOne({
          where: { id: to_barn_id, base_id: baseId },
          transaction
        });
        if (!toBarn) {
          throw new ValidationError('目标牛棚不存在或不属于该基地');
        }
      }

      // Update cattle barn assignments
      const updatedCattle: any[] = [];
      const transferErrors: any[] = [];

      for (const cow of cattle) {
        try {
          // Check if cattle is currently in the expected barn
          if (from_barn_id && cow.barn_id !== from_barn_id) {
            transferErrors.push({
              ear_tag: cow.ear_tag,
              error: `牛只当前不在指定的源牛棚中`
            });
            continue;
          }

          await cow.update({ barn_id: to_barn_id }, { transaction });

          // Create transfer event
          await CattleEvent.create({
            cattle_id: cow.id,
            event_type: 'transfer_in',
            event_date: new Date(),
            description: `批量转群 - 从${from_barn_id ? '牛棚' + from_barn_id : '无牛棚'}转至${to_barn_id ? '牛棚' + to_barn_id : '无牛棚'}`,
            operator_id: user.id,
            data: {
              from_barn_id: from_barn_id,
              to_barn_id: to_barn_id,
              reason: reason,
              batch_transfer: true
            }
          }, { transaction });

          updatedCattle.push(cow);
        } catch (error) {
          transferErrors.push({
            ear_tag: cow.ear_tag,
            error: error instanceof Error ? error.message : '转移失败'
          });
        }
      }

      if (transferErrors.length > 0) {
        await transaction.rollback();
        return res.status(500).json({
          success: false,
          error: {
            code: 'BATCH_TRANSFER_ERROR',
            message: '批量转移失败',
            details: transferErrors
          }
        });
      }

      // Update barn counts
      if (from_barn_id) {
        await Barn.decrement('current_count', {
          by: updatedCattle.length,
          where: { id: from_barn_id },
          transaction
        });
      }

      if (to_barn_id) {
        await Barn.increment('current_count', {
          by: updatedCattle.length,
          where: { id: to_barn_id },
          transaction
        });
      }

      await transaction.commit();

      res.json({
        success: true,
        data: {
          transferred_count: updatedCattle.length,
          cattle: updatedCattle
        },
        message: `成功转移${updatedCattle.length}头牛只`
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Error in batch transfer cattle:', error);
      
      if (error instanceof ValidationError) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'BATCH_TRANSFER_ERROR',
            message: '批量转移失败',
            details: error
          }
        });
      }
    }
  }

  // Get import template
  static async getImportTemplate(req: Request, res: Response) {
    try {
      const templateData = [
        {
          '耳标号': 'CN001234',
          '品种': '西门塔尔',
          '性别': '公',
          '出生日期': '2023-01-15',
          '体重': '450',
          '基地ID': '1',
          '牛棚ID': '1',
          '来源': 'purchased',
          '采购价格': '8000',
          '采购日期': '2023-06-01',
          '备注': '健康状况良好'
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '牛只导入模板');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=cattle_import_template.xlsx');
      res.send(buffer);
    } catch (error) {
      logger.error('Error generating import template:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TEMPLATE_ERROR',
          message: '生成模板失败',
          details: error
        }
      });
    }
  }
}