import fs from 'fs';
import path from 'path';
import { logger } from '@/utils/logger';

export interface ImportFix {
  file: string;
  oldImport: string;
  newImport: string;
  fixed: boolean;
  error?: string;
}

export class RouteImportFixer {
  private routesDirectory: string;
  private fixes: ImportFix[] = [];

  constructor(routesDirectory: string = path.join(__dirname, '../routes')) {
    this.routesDirectory = routesDirectory;
  }

  /**
   * Fix all import issues in route files
   */
  async fixAllImports(): Promise<ImportFix[]> {
    this.fixes = [];
    
    try {
      const files = fs.readdirSync(this.routesDirectory);
      const routeFiles = files.filter(file => 
        file.endsWith('.ts') && 
        !file.endsWith('.test.ts')
      );

      for (const file of routeFiles) {
        await this.fixFileImports(path.join(this.routesDirectory, file));
      }

      logger.info(`Fixed imports in ${routeFiles.length} route files`);
    } catch (error) {
      logger.error('Error fixing route imports:', error);
      throw error;
    }

    return this.fixes;
  }

  /**
   * Fix imports in a single file
   */
  private async fixFileImports(filePath: string): Promise<void> {
    try {
      const fileName = path.basename(filePath);
      let content = fs.readFileSync(filePath, 'utf-8');
      let modified = false;

      // Define import fixes
      const importFixes = [
        // Auth middleware fixes
        {
          pattern: /import\s*{\s*authenticate\s*}\s*from\s*['"`]\.\.\/middleware\/auth['"`]/g,
          replacement: "import { auth as authenticate } from '@/middleware/auth'"
        },
        {
          pattern: /import\s*{\s*authMiddleware\s*}\s*from\s*['"`]\.\.\/middleware\/auth['"`]/g,
          replacement: "import { authMiddleware } from '@/middleware/auth'"
        },
        {
          pattern: /import\s*{\s*auth\s*}\s*from\s*['"`]\.\.\/middleware\/auth['"`]/g,
          replacement: "import { auth } from '@/middleware/auth'"
        },
        
        // Permission middleware fixes
        {
          pattern: /import\s*{\s*authorize\s*}\s*from\s*['"`]\.\.\/middleware\/permission['"`]/g,
          replacement: "import { authorize } from '@/middleware/permission'"
        },
        {
          pattern: /import\s*{\s*permission\s*}\s*from\s*['"`]\.\.\/middleware\/permission['"`]/g,
          replacement: "import { permission } from '@/middleware/permission'"
        },
        
        // Data permission middleware fixes
        {
          pattern: /import\s*{\s*dataPermission\s*}\s*from\s*['"`]\.\.\/middleware\/dataPermission['"`]/g,
          replacement: "import { dataPermissionMiddleware as dataPermission } from '@/middleware/dataPermission'"
        },
        {
          pattern: /import\s*{\s*dataPermissionMiddleware\s*}\s*from\s*['"`]\.\.\/middleware\/dataPermission['"`]/g,
          replacement: "import { dataPermissionMiddleware } from '@/middleware/dataPermission'"
        },
        
        // Validation middleware fixes
        {
          pattern: /import\s*{\s*validate\s*}\s*from\s*['"`]\.\.\/middleware\/validation['"`]/g,
          replacement: "import { validate } from '@/middleware/validation'"
        },
        {
          pattern: /import\s*{\s*validateRequest\s*}\s*from\s*['"`]\.\.\/middleware\/validation['"`]/g,
          replacement: "import { validateRequest } from '@/middleware/validation'"
        },
        
        // Controller fixes
        {
          pattern: /import\s*{\s*(\w+Controller)\s*}\s*from\s*['"`]\.\.\/controllers\/(\w+Controller)['"`]/g,
          replacement: "import { $1 } from '@/controllers/$2'"
        },
        
        // Validator fixes
        {
          pattern: /import\s*{\s*([^}]+)\s*}\s*from\s*['"`]\.\.\/validators\/(\w+)['"`]/g,
          replacement: "import { $1 } from '@/validators/$2'"
        },
        
        // General relative import fixes
        {
          pattern: /from\s*['"`]\.\.\/([^'"`]+)['"`]/g,
          replacement: "from '@/$1'"
        }
      ];

      // Apply fixes
      for (const fix of importFixes) {
        const oldContent = content;
        content = content.replace(fix.pattern, fix.replacement);
        
        if (content !== oldContent) {
          modified = true;
          this.fixes.push({
            file: fileName,
            oldImport: 'Pattern matched',
            newImport: fix.replacement,
            fixed: true
          });
        }
      }

      // Write back if modified
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf-8');
        logger.info(`Fixed imports in ${fileName}`);
      }

    } catch (error) {
      const fileName = path.basename(filePath);
      this.fixes.push({
        file: fileName,
        oldImport: 'Error occurred',
        newImport: 'N/A',
        fixed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      logger.error(`Error fixing imports in ${fileName}:`, error);
    }
  }

  /**
   * Validate that all imports are correct
   */
  async validateImports(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      const files = fs.readdirSync(this.routesDirectory);
      const routeFiles = files.filter(file => 
        file.endsWith('.ts') && 
        !file.endsWith('.test.ts')
      );

      for (const file of routeFiles) {
        const filePath = path.join(this.routesDirectory, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for relative imports that should be absolute
        const relativeImports = content.match(/from\s*['"`]\.\.\/[^'"`]+['"`]/g);
        if (relativeImports) {
          issues.push(`${file}: Found relative imports: ${relativeImports.join(', ')}`);
        }
        
        // Check for missing auth middleware on protected routes
        if (content.includes("router.") && 
            !content.includes("/public") && 
            !content.includes("/auth") &&
            !content.includes("auth") && 
            !content.includes("requirePermission")) {
          issues.push(`${file}: May be missing authentication middleware`);
        }
      }
    } catch (error) {
      issues.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Get fix results
   */
  getFixes(): ImportFix[] {
    return this.fixes;
  }
}

// Export singleton instance
export const routeImportFixer = new RouteImportFixer();