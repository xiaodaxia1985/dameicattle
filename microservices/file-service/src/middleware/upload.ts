import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer存储引擎
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    // 从请求参数中获取分类
    const category = req.body.category || 'general';
    const categoryDir = path.join(uploadDir, category);
    
    // 确保分类目录存在
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    
    cb(null, categoryDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    // 生成唯一文件名
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const basename = path.basename(file.originalname, extension);
    const filename = `${basename}_${timestamp}${extension}`;
    
    cb(null, filename);
  }
});

// 文件过滤函数
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 允许所有文件类型，但在控制器中可以进一步验证
  cb(null, true);
};

// 创建multer实例
const multerInstance = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  }
});

// 导出中间件函数
export const upload = {
  single: (fieldName: string) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      multerInstance.single(fieldName)(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
          logger.error(`文件上传错误: ${err.message}`);
          return res.status(400).json({ error: err.message });
        } else if (err) {
          logger.error(`未知上传错误: ${err.message}`);
          return res.status(500).json({ error: '上传失败' });
        }
        next();
      });
    };
  },
  array: (fieldName: string, maxCount?: number) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      multerInstance.array(fieldName, maxCount)(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
          logger.error(`批量文件上传错误: ${err.message}`);
          return res.status(400).json({ error: err.message });
        } else if (err) {
          logger.error(`未知批量上传错误: ${err.message}`);
          return res.status(500).json({ error: '批量上传失败' });
        }
        next();
      });
    };
  }
};

export const uploadMiddleware = upload;