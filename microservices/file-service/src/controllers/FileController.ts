import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

// 上传根目录
const uploadDir = path.join(__dirname, '../../../uploads');

// 文件模型接口
interface FileInfo {
  id: string;
  filename: string;
  original_name: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
  category: string;
  cattle_id?: string;
  created_at: string;
}

export class FileController {
  // 上传单个文件
  static async uploadFile(req: Request, res: Response) {
    try {
      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: '未选择文件' });
      }

      // 获取请求参数
      const category = req.body.category || 'general';
      const cattle_id = req.body.cattle_id;

      // 生成文件ID和URL
      const fileId = Date.now().toString();
      
      // 修改文件名，包含cattle_id（如果提供）
      let filename = file.filename;
      if (cattle_id) {
        const extension = path.extname(file.filename);
        const basename = path.basename(file.filename, extension);
        filename = `${basename}_cattle${cattle_id}${extension}`;
        
        // 重命名已上传的文件
        const oldPath = file.path;
        const newPath = path.join(path.dirname(oldPath), filename);
        fs.renameSync(oldPath, newPath);
        file.path = newPath;
      }
      
      const fileUrl = `/uploads/${category}/${filename}`;

      // 构建文件信息
      const fileInfo: FileInfo = {
        id: fileId,
        filename: file.filename,
        original_name: file.originalname,
        path: file.path,
        url: fileUrl,
        size: file.size,
        mimetype: file.mimetype,
        category,
        cattle_id,  // 添加牛只ID
        created_at: new Date().toISOString()
      };

      // 如果提供了牛只ID，则添加到文件信息中
      if (cattle_id) {
        fileInfo.cattle_id = cattle_id;
      }

      logger.info(`文件上传成功: ${file.originalname}`, { fileInfo });
      
      // 返回文件信息（包括URL）
      res.status(201).json({
        success: true,
        data: fileInfo
      });
    } catch (error) {
      logger.error('文件上传失败:', error);
      res.status(500).json({ error: '上传失败' });
    }
  }

  // 批量上传文件
  static async uploadMultipleFiles(req: Request, res: Response) {
    try {
      const files = (req as any).files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: '未选择文件' });
      }

      // 获取请求参数
      const category = req.body.category || 'general';
      const cattle_id = req.body.cattle_id;

      // 处理每个文件
      const fileData: FileInfo[] = files.map((file, index) => {
        const fileId = `${Date.now()}_${index}`;
        
        // 修改文件名，包含cattle_id（如果提供）
        let filename = file.filename;
        if (cattle_id) {
          const extension = path.extname(file.filename);
          const basename = path.basename(file.filename, extension);
          filename = `${basename}_cattle${cattle_id}${extension}`;
          
          // 重命名已上传的文件
          const oldPath = file.path;
          const newPath = path.join(path.dirname(oldPath), filename);
          fs.renameSync(oldPath, newPath);
          file.path = newPath;
        }
        
        const fileUrl = `/uploads/${category}/${filename}`;
        
        const fileInfo: FileInfo = {
          id: fileId,
          filename: file.filename,
          original_name: file.originalname,
          path: file.path,
          url: fileUrl,
          size: file.size,
          mimetype: file.mimetype,
          category,
          created_at: new Date().toISOString()
        };

        if (cattle_id) {
          fileInfo.cattle_id = cattle_id;
        }

        return fileInfo;
      });

      logger.info(`批量文件上传成功: ${files.length}个文件`);
      
      res.status(201).json({
        success: true,
        data: fileData
      });
    } catch (error) {
      logger.error('批量文件上传失败:', error);
      res.status(500).json({ error: '批量上传失败' });
    }
  }

  // 获取文件列表
  static async getFiles(req: Request, res: Response) {
    try {
      // 获取查询参数
      const { category, cattle_id, limit = 20, offset = 0 } = req.query;
      
      // 由于没有数据库，我们从文件系统中读取文件
      // 这里我们返回一个示例数据，实际应用中应该从数据库查询
      const files: FileInfo[] = [];
      
      // 如果指定了分类和上传目录存在，则尝试读取文件
      if (category && fs.existsSync(path.join(uploadDir, category as string))) {
        const categoryDir = path.join(uploadDir, category as string);
        const filenames = fs.readdirSync(categoryDir);
        
        // 过滤出符合条件的文件
        const filteredFilenames = filenames.filter(filename => {
          // 如果指定了cattle_id，则只返回关联到该牛只的文件
          if (cattle_id) {
            // 检查文件名中是否包含cattle_id
            return filename.includes(`_cattle${cattle_id}`);
          }
          return true;
        });
        
        filteredFilenames.slice(Number(offset), Number(offset) + Number(limit)).forEach((filename, index) => {
          const filePath = path.join(categoryDir, filename);
          const stats = fs.statSync(filePath);
          
          // 尝试从文件名中提取原始名称（移除时间戳和cattle_id部分）
          let originalName = filename;
          // 先移除时间戳部分
          const timestampMatch = filename.match(/(.*?)_\d+\.[^.]+$/);
          if (timestampMatch) {
            originalName = timestampMatch[1];
          }
          // 再移除cattle_id部分
          const cattleMatch = originalName.match(/(.*?)_cattle\d+/);
          if (cattleMatch) {
            originalName = cattleMatch[1];
          }
          
          // 提取cattle_id
          let fileCattleId = undefined;
          const fileCattleMatch = filename.match(/_cattle(\d+)/);
          if (fileCattleMatch) {
            fileCattleId = fileCattleMatch[1];
          }
          
          files.push({
            id: `${Date.now()}_${index}`,
            filename,
            original_name: originalName,
            path: filePath,
            url: `/uploads/${category}/${filename}`,
            size: stats.size,
            mimetype: 'image/jpeg', // 简化处理，实际应用中应该根据文件扩展名判断
            category: category as string,
            cattle_id: fileCattleId,
            created_at: stats.ctime.toISOString()
          });
        });
      }

      logger.info(`获取文件列表成功: ${files.length}个文件`, { category, cattle_id });
      
      res.json({
        success: true,
        data: files,
        total: files.length
      });
    } catch (error) {
      logger.error('获取文件列表失败:', error);
      res.status(500).json({ error: '获取文件列表失败' });
    }
  }

  // 获取单个文件信息
  static async getFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // 由于没有数据库，我们返回一个示例数据
      res.json({
        success: true,
        data: {
          id,
          name: 'example.jpg',
          url: `/uploads/example.jpg`
        }
      });
    } catch (error) {
      logger.error('获取文件信息失败:', error);
      res.status(500).json({ error: '获取文件信息失败' });
    }
  }

  // 下载文件
  static async downloadFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // 注意：这里应该从数据库中查询文件路径
      // 但由于没有数据库，我们需要一种方式来查找文件
      // 在实际应用中，应该实现基于ID的文件查找逻辑
      
      // 简化处理：返回一个错误，提示需要实现完整的文件存储逻辑
      res.status(501).json({
        error: '文件下载功能需要实现完整的文件存储逻辑'
      });
    } catch (error) {
      logger.error('下载文件失败:', error);
      res.status(500).json({ error: '下载文件失败' });
    }
  }

  // 删除文件
  static async deleteFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // 注意：这里应该从数据库中查询文件路径并删除
      // 但由于没有数据库，我们无法实现完整的删除功能
      
      logger.info(`文件删除请求: ${id}`);
      res.json({
        success: true,
        message: '删除成功（模拟）'
      });
    } catch (error) {
      logger.error('删除文件失败:', error);
      res.status(500).json({ error: '删除文件失败' });
    }
  }

  // 预览文件
  static async previewFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // 同样，这里应该从数据库中查询文件信息
      res.json({
        success: true,
        data: {
          id,
          name: 'example.jpg',
          url: `/uploads/example.jpg`
        }
      });
    } catch (error) {
      logger.error('预览文件失败:', error);
      res.status(500).json({ error: '预览文件失败' });
    }
  }

  // 其他方法保持不变
  static async getFileInfo(req: Request, res: Response) {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        data: { 
          id, 
          size: 1024, 
          type: 'image/jpeg' 
        }
      });
    } catch (error) {
      res.status(500).json({ error: '获取文件信息失败' });
    }
  }

  static async updateFileInfo(req: Request, res: Response) {
    try {
      res.json({ 
        success: true,
        message: '更新成功'
      });
    } catch (error) {
      res.status(500).json({ error: '更新文件信息失败' });
    }
  }

  static async getFileStatistics(req: Request, res: Response) {
    try {
      res.json({ 
        success: true,
        data: { total: 0, size: 0 }
      });
    } catch (error) {
      res.status(500).json({ error: '获取文件统计失败' });
    }
  }

  // 路由处理器方法
  public async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await FileController.getFiles(req, res);
    } catch (error) {
      next(error);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await FileController.uploadFile(req, res);
    } catch (error) {
      next(error);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await FileController.updateFileInfo(req, res);
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await FileController.deleteFile(req, res);
    } catch (error) {
      next(error);
    }
  }

  public async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await FileController.getFile(req, res);
    } catch (error) {
      next(error);
    }
  }

  public async download(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await FileController.downloadFile(req, res);
    } catch (error) {
      next(error);
    }
  }

  public async getStatistics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await FileController.getFileStatistics(req, res);
    } catch (error) {
      next(error);
    }
  }

  // 获取单个文件（替代实例方法的静态方法）
  static async getFileById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await FileController.getFile(req, res);
    } catch (error) {
      res.status(500).json({ error: '获取文件失败' });
    }
  }

  // 获取文件分类
  static async getFileCategories(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: [{ id: 1, name: 'general' }, { id: 2, name: 'image' }, { id: 3, name: 'cattle_photo' }]
      });
    } catch (error) {
      res.status(500).json({ error: '获取文件分类失败' });
    }
  }

  // 创建文件分类
  static async createFileCategory(req: Request, res: Response) {
    try {
      const { name } = req.body;
      res.json({
        success: true,
        data: { id: Date.now(), name }
      });
    } catch (error) {
      res.status(500).json({ error: '创建文件分类失败' });
    }
  }

  // 更新文件分类
  static async updateFileCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      res.json({
        success: true,
        data: { id, name }
      });
    } catch (error) {
      res.status(500).json({ error: '更新文件分类失败' });
    }
  }

  // 删除文件分类
  static async deleteFileCategory(req: Request, res: Response) {
    try {
      res.json({
        success: true,
        message: '删除成功'
      });
    } catch (error) {
      res.status(500).json({ error: '删除文件分类失败' });
    }
  }

  // 分享文件
  static async shareFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      res.json({
        success: true,
        data: { 
          id, 
          shareToken: 'random-token', 
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() 
        }
      });
    } catch (error) {
      res.status(500).json({ error: '创建共享链接失败' });
    }
  }

  // 获取共享文件
  static async getSharedFile(req: Request, res: Response) {
    try {
      const { token } = req.params;
      res.json({
        success: true,
        data: { id: '1', name: 'shared-file.jpg' }
      });
    } catch (error) {
      res.status(500).json({ error: '获取共享文件失败' });
    }
  }
}