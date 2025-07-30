#!/usr/bin/env node

/**
 * 前端空数据处理批量修复脚本
 * 用于自动应用空数据处理修复到Vue组件中
 */

const fs = require('fs')
const path = require('path')
const glob = require('glob')

// 配置
const config = {
  // 需要修复的文件模式
  patterns: [
    'frontend/src/views/**/*.vue',
    'frontend/src/components/**/*.vue'
  ],
  // 排除的文件
  exclude: [
    '**/node_modules/**',
    '**/dist/**',
    '**/*.d.ts'
  ],
  // 备份目录
  backupDir: 'backup/frontend-fixes',
  // 是否创建备份
  createBackup: true
}

// 修复规则
const fixRules = [
  {
    name: '添加数据验证导入',
    pattern: /import.*from\s+['"]@\/api\//g,
    replacement: (match, content) => {
      if (content.includes('validatePaginationData')) {
        return match
      }
      const apiImport = match
      const validationImport = "import { validatePaginationData, validateDataArray } from '@/utils/dataValidation'"
      return `${apiImport}\n${validationImport}`
    }
  },
  {
    name: '修复数组访问',
    pattern: /(\w+)\.value\s*=\s*response\.data\s*\|\|\s*\[\]/g,
    replacement: '$1.value = validateListData(response.data, [])'
  },
  {
    name: '修复分页数据访问',
    pattern: /(\w+)\.value\s*=\s*response\.data\.items\s*\|\|\s*\[\]/g,
    replacement: (match, varName) => {
      return `const validatedData = validatePaginationData(response.data || response)
${varName}.value = validatedData.data`
    }
  },
  {
    name: '添加安全属性访问',
    pattern: /\{\{\s*(\w+)\.(\w+)\s*\}\}/g,
    replacement: '{{ safeGet($1, \'$2\', \'-\') }}'
  },
  {
    name: '修复空状态检查',
    pattern: /v-if="(\w+)\.length\s*===\s*0"/g,
    replacement: 'v-if="!$1 || $1.length === 0"'
  }
]

// 工具函数
function createBackup(filePath) {
  if (!config.createBackup) return

  const backupPath = path.join(config.backupDir, filePath)
  const backupDir = path.dirname(backupPath)
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  
  fs.copyFileSync(filePath, backupPath)
  console.log(`✓ 备份文件: ${filePath} -> ${backupPath}`)
}

function applyFixes(content, filePath) {
  let fixedContent = content
  let appliedFixes = []

  fixRules.forEach(rule => {
    const matches = content.match(rule.pattern)
    if (matches) {
      if (typeof rule.replacement === 'function') {
        fixedContent = fixedContent.replace(rule.pattern, rule.replacement)
      } else {
        fixedContent = fixedContent.replace(rule.pattern, rule.replacement)
      }
      appliedFixes.push(rule.name)
    }
  })

  return { fixedContent, appliedFixes }
}

function addEmptyStateTemplate(content) {
  // 检查是否已经有空状态处理
  if (content.includes('el-empty') || content.includes('empty-state')) {
    return content
  }

  // 查找表格或列表组件
  const tableMatch = content.match(/<el-table[^>]*:data="([^"]+)"[^>]*>/g)
  if (!tableMatch) {
    return content
  }

  const dataVar = tableMatch[0].match(/:data="([^"]+)"/)[1]
  
  // 添加空状态模板
  const emptyStateTemplate = `
    <!-- 空状态显示 -->
    <div v-if="!${dataVar} || ${dataVar}.length === 0" class="empty-state">
      <el-empty description="暂无数据">
        <el-button type="primary" @click="handleRefresh">刷新数据</el-button>
      </el-empty>
    </div>

    <!-- 数据列表 -->
    <div v-else>`

  const closingDiv = `
    </div>`

  // 在表格前添加空状态，在表格后添加闭合标签
  let modifiedContent = content.replace(
    /<el-table/,
    `${emptyStateTemplate}\n      <el-table`
  )

  // 在分页后添加闭合标签
  modifiedContent = modifiedContent.replace(
    /(<\/el-pagination>\s*<\/div>)/,
    `$1${closingDiv}`
  )

  return modifiedContent
}

function addErrorHandling(content) {
  // 检查是否已经有错误处理
  if (content.includes('try {') && content.includes('catch')) {
    return content
  }

  // 查找API调用
  const apiCallPattern = /const\s+(\w+)\s+=\s+await\s+(\w+Api\.\w+)\(/g
  let modifiedContent = content

  modifiedContent = modifiedContent.replace(apiCallPattern, (match, varName, apiCall) => {
    return `try {
      ${match}
    } catch (error) {
      console.error('API调用失败:', error)
      ElMessage.error('数据加载失败')
      ${varName} = []
    }`
  })

  return modifiedContent
}

function processFile(filePath) {
  console.log(`\n处理文件: ${filePath}`)
  
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    
    // 创建备份
    createBackup(filePath)
    
    // 应用修复规则
    const { fixedContent, appliedFixes } = applyFixes(content, filePath)
    
    // 添加空状态模板
    let finalContent = addEmptyStateTemplate(fixedContent)
    
    // 添加错误处理
    finalContent = addErrorHandling(finalContent)
    
    // 如果内容有变化，写入文件
    if (finalContent !== content) {
      fs.writeFileSync(filePath, finalContent, 'utf8')
      console.log(`✓ 修复完成，应用了以下修复:`)
      appliedFixes.forEach(fix => console.log(`  - ${fix}`))
    } else {
      console.log(`- 无需修复`)
    }
    
  } catch (error) {
    console.error(`✗ 处理文件失败: ${filePath}`, error.message)
  }
}

function main() {
  console.log('🚀 开始批量修复前端空数据处理问题...\n')
  
  // 创建备份目录
  if (config.createBackup && !fs.existsSync(config.backupDir)) {
    fs.mkdirSync(config.backupDir, { recursive: true })
  }
  
  // 获取所有需要处理的文件
  let allFiles = []
  config.patterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore: config.exclude })
    allFiles = allFiles.concat(files)
  })
  
  // 去重
  allFiles = [...new Set(allFiles)]
  
  console.log(`找到 ${allFiles.length} 个文件需要处理\n`)
  
  // 处理每个文件
  allFiles.forEach(processFile)
  
  console.log(`\n🎉 批量修复完成！`)
  console.log(`处理了 ${allFiles.length} 个文件`)
  
  if (config.createBackup) {
    console.log(`备份文件保存在: ${config.backupDir}`)
  }
  
  console.log(`\n📝 建议接下来的步骤:`)
  console.log(`1. 检查修复后的代码`)
  console.log(`2. 运行测试确保功能正常`)
  console.log(`3. 提交代码变更`)
}

// 运行脚本
if (require.main === module) {
  main()
}

module.exports = {
  processFile,
  applyFixes,
  addEmptyStateTemplate,
  addErrorHandling
}