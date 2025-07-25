import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '@/utils/logger';

// MIME type mappings
const MIME_TYPES: Record<string, string> = {
  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  
  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  
  // Text files
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.json': 'application/json',
  '.xml': 'application/xml',
  
  // Archives
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.7z': 'application/x-7z-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  
  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  
  // Video
  '.mp4': 'video/mp4',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.wmv': 'video/x-ms-wmv',
  
  // Web files
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf'
};

// Get MIME type from file extension
const getMimeType = (filePath: string): string => {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
};

// Security headers for different file types
const getSecurityHeaders = (mimeType: string): Record<string, string> => {
  const headers: Record<string, string> = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  };

  // Additional headers for images
  if (mimeType.startsWith('image/')) {
    headers['Cache-Control'] = 'public, max-age=31536000'; // 1 year cache
  }

  // Additional headers for documents
  if (mimeType.includes('pdf') || mimeType.includes('document')) {
    headers['Content-Disposition'] = 'inline';
    headers['Cache-Control'] = 'private, max-age=3600'; // 1 hour cache
  }

  return headers;
};

// File serving options
interface StaticFileOptions {
  maxAge?: number;
  etag?: boolean;
  lastModified?: boolean;
  index?: boolean;
  dotfiles?: 'allow' | 'deny' | 'ignore';
  fallthrough?: boolean;
  redirect?: boolean;
  setHeaders?: (res: Response, path: string, stat: fs.Stats) => void;
}

// Enhanced static file middleware
export const createStaticFileMiddleware = (
  root: string,
  options: StaticFileOptions = {}
) => {
  const defaultOptions: StaticFileOptions = {
    maxAge: 0,
    etag: true,
    lastModified: true,
    index: false,
    dotfiles: 'ignore',
    fallthrough: true,
    redirect: false,
    ...options
  };

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Decode and sanitize the requested path
      let requestedPath = decodeURIComponent(req.path);
      
      // Remove query parameters
      requestedPath = requestedPath.split('?')[0];
      
      // Prevent directory traversal attacks
      if (requestedPath.includes('..') || requestedPath.includes('~')) {
        logger.warn('Directory traversal attempt detected:', {
          path: requestedPath,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
        return res.status(403).json({
          success: false,
          message: 'Access denied',
          code: 'DIRECTORY_TRAVERSAL_DENIED'
        });
      }

      // Construct full file path
      const fullPath = path.join(root, requestedPath);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        if (defaultOptions.fallthrough) {
          return next();
        } else {
          return res.status(404).json({
            success: false,
            message: 'File not found',
            code: 'FILE_NOT_FOUND'
          });
        }
      }

      // Get file stats
      const stats = fs.statSync(fullPath);
      
      // Don't serve directories
      if (stats.isDirectory()) {
        if (defaultOptions.fallthrough) {
          return next();
        } else {
          return res.status(403).json({
            success: false,
            message: 'Directory access denied',
            code: 'DIRECTORY_ACCESS_DENIED'
          });
        }
      }

      // Handle dotfiles
      const basename = path.basename(fullPath);
      if (basename.startsWith('.')) {
        if (defaultOptions.dotfiles === 'deny') {
          return res.status(403).json({
            success: false,
            message: 'Access to dotfiles denied',
            code: 'DOTFILE_ACCESS_DENIED'
          });
        } else if (defaultOptions.dotfiles === 'ignore') {
          if (defaultOptions.fallthrough) {
            return next();
          } else {
            return res.status(404).json({
              success: false,
              message: 'File not found',
              code: 'FILE_NOT_FOUND'
            });
          }
        }
      }

      // Get MIME type
      const mimeType = getMimeType(fullPath);
      
      // Set content type
      res.setHeader('Content-Type', mimeType);
      
      // Set security headers
      const securityHeaders = getSecurityHeaders(mimeType);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Set ETag if enabled
      if (defaultOptions.etag) {
        const etag = `"${stats.size}-${stats.mtime.getTime()}"`;
        res.setHeader('ETag', etag);
        
        // Check if client has cached version
        const clientETag = req.get('If-None-Match');
        if (clientETag === etag) {
          return res.status(304).end();
        }
      }

      // Set Last-Modified if enabled
      if (defaultOptions.lastModified) {
        res.setHeader('Last-Modified', stats.mtime.toUTCString());
        
        // Check if client has cached version
        const clientLastModified = req.get('If-Modified-Since');
        if (clientLastModified && new Date(clientLastModified) >= stats.mtime) {
          return res.status(304).end();
        }
      }

      // Set Cache-Control
      if (defaultOptions.maxAge && defaultOptions.maxAge > 0) {
        res.setHeader('Cache-Control', `public, max-age=${defaultOptions.maxAge}`);
      }

      // Set Content-Length
      res.setHeader('Content-Length', stats.size);

      // Call custom setHeaders function if provided
      if (defaultOptions.setHeaders) {
        defaultOptions.setHeaders(res, fullPath, stats);
      }

      // Handle range requests for large files
      const range = req.get('Range');
      if (range && stats.size > 1024 * 1024) { // Only for files > 1MB
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;
        
        if (start >= 0 && end < stats.size && start <= end) {
          const chunkSize = (end - start) + 1;
          res.status(206);
          res.setHeader('Content-Range', `bytes ${start}-${end}/${stats.size}`);
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Content-Length', chunkSize);
          
          const stream = fs.createReadStream(fullPath, { start, end });
          return stream.pipe(res);
        }
      }

      // Log file access
      logger.info('Static file served:', {
        path: requestedPath,
        size: stats.size,
        mimeType,
        ip: req.ip
      });

      // Stream the file
      const stream = fs.createReadStream(fullPath);
      
      stream.on('error', (error) => {
        logger.error('Error streaming file:', error);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error reading file',
            code: 'FILE_READ_ERROR'
          });
        }
      });

      stream.pipe(res);

    } catch (error) {
      logger.error('Static file middleware error:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Internal server error',
          code: 'STATIC_FILE_ERROR'
        });
      }
    }
  };
};

// Middleware for serving uploaded files
export const serveUploads = createStaticFileMiddleware(
  path.join(process.cwd(), 'uploads'),
  {
    maxAge: 3600, // 1 hour cache
    etag: true,
    lastModified: true,
    dotfiles: 'deny',
    setHeaders: (res, filePath, stats) => {
      // Add additional security headers for uploads
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      
      // Prevent execution of uploaded scripts
      const ext = path.extname(filePath).toLowerCase();
      if (['.js', '.html', '.htm', '.php', '.asp', '.jsp'].includes(ext)) {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }
    }
  }
);

// Health check for static file serving
export const staticFileHealthCheck = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  details: any;
}> => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Check if uploads directory exists and is accessible
    const stats = fs.statSync(uploadsDir);
    
    if (!stats.isDirectory()) {
      return {
        status: 'unhealthy',
        details: { error: 'Uploads directory is not a directory' }
      };
    }

    // Check write permissions by creating a test file
    const testFile = path.join(uploadsDir, '.health-check');
    fs.writeFileSync(testFile, 'health check');
    fs.unlinkSync(testFile);

    return {
      status: 'healthy',
      details: {
        uploadsDirectory: uploadsDir,
        accessible: true,
        writable: true
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      details: { error: (error as Error).message }
    };
  }
};