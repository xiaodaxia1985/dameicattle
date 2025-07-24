import { Router } from 'express';
import { requirePermission } from '@/middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 上传图片
router.post('/image', 
  requirePermission('upload:image'),
  upload.single('file'),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '没有上传文件'
        });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      
      return res.json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        },
        message: '图片上传成功'
      });
    } catch (error) {
      console.error('图片上传失败:', error);
      return res.status(500).json({
        success: false,
        message: '图片上传失败'
      });
    }
  }
);

// 上传文件
router.post('/file',
  requirePermission('upload:file'),
  upload.single('file'),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '没有上传文件'
        });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      
      return res.json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        },
        message: '文件上传成功'
      });
    } catch (error) {
      console.error('文件上传失败:', error);
      return res.status(500).json({
        success: false,
        message: '文件上传失败'
      });
    }
  }
);

// 上传头像
router.post('/avatar',
  requirePermission('upload:avatar'),
  upload.single('file'),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '没有上传文件'
        });
      }

      // 验证是否为图片文件
      const imageTypes = /jpeg|jpg|png|gif/;
      const extname = imageTypes.test(path.extname(req.file.originalname).toLowerCase());
      const mimetype = imageTypes.test(req.file.mimetype);

      if (!mimetype || !extname) {
        // 删除已上传的文件
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: '头像只支持图片格式'
        });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      
      return res.json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        },
        message: '头像上传成功'
      });
    } catch (error) {
      console.error('头像上传失败:', error);
      return res.status(500).json({
        success: false,
        message: '头像上传失败'
      });
    }
  }
);

// 批量上传
router.post('/batch',
  requirePermission('upload:batch'),
  upload.array('files', 10), // 最多10个文件
  (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({
          success: false,
          message: '没有上传文件'
        });
      }

      const uploadedFiles = files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      }));

      return res.json({
        success: true,
        data: {
          files: uploadedFiles,
          count: uploadedFiles.length
        },
        message: `成功上传 ${uploadedFiles.length} 个文件`
      });
    } catch (error) {
      console.error('批量上传失败:', error);
      return res.status(500).json({
        success: false,
        message: '批量上传失败'
      });
    }
  }
);

// 删除文件
router.delete('/:filename',
  requirePermission('upload:delete'),
  (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'uploads', filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return res.json({
          success: true,
          message: '文件删除成功'
        });
      } else {
        return res.status(404).json({
          success: false,
          message: '文件不存在'
        });
      }
    } catch (error) {
      console.error('文件删除失败:', error);
      return res.status(500).json({
        success: false,
        message: '文件删除失败'
      });
    }
  }
);

export default router;