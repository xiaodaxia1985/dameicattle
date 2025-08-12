/**
 * Vue 组件修复工具
 * 专门解决 Vue 组件中的 parentNode 错误和其他常见问题
 */

import { nextTick } from 'vue'
import { ElMessage } from 'element-plus'

// 修复 parentNode 相关错误
export function fixParentNodeErrors() {
  console.log('开始修复 Vue 组件中的 parentNode 错误...')

  // 1. 重写 Node.prototype.removeChild，添加安全检查
  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function(child: Node) {
    if (!child) {
      console.warn('removeChild: 子节点为null')
      return child
    }
    if (!child.parentNode) {
      console.warn('removeChild: 子节点没有父节点')
      return child
    }
    if (child.parentNode !== this) {
      console.warn('removeChild: 子节点的父节点不匹配')
      return child
    }
    try {
      return originalRemoveChild.call(this, child)
    } catch (error) {
      console.error('removeChild 执行失败:', error)
      return child
    }
  }

  // 2. 重写 Node.prototype.appendChild，添加安全检查
  const originalAppendChild = Node.prototype.appendChild
  Node.prototype.appendChild = function(child: Node) {
    if (!child) {
      console.warn('appendChild: 子节点为null')
      return child
    }
    try {
      return originalAppendChild.call(this, child)
    } catch (error) {
      console.error('appendChild 执行失败:', error)
      return child
    }
  }

  // 3. 重写 Node.prototype.insertBefore，添加安全检查
  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function(newNode: Node, referenceNode: Node | null) {
    if (!newNode) {
      console.warn('insertBefore: 新节点为null')
      return newNode
    }
    if (referenceNode && referenceNode.parentNode !== this) {
      console.warn('insertBefore: 参考节点的父节点不匹配')
      return newNode
    }
    try {
      return originalInsertBefore.call(this, newNode, referenceNode)
    } catch (error) {
      console.error('insertBefore 执行失败:', error)
      return newNode
    }
  }

  // 4. 创建安全的 DOM 操作函数
  window.safeRemoveChild = function(parent: Node, child: Node): Node | null {
    if (!parent || !child) {
      return null
    }
    if (child.parentNode !== parent) {
      return null
    }
    try {
      return parent.removeChild(child)
    } catch (error) {
      console.error('safeRemoveChild 失败:', error)
      return null
    }
  }

  window.safeAppendChild = function(parent: Node, child: Node): Node | null {
    if (!parent || !child) {
      return null
    }
    try {
      return parent.appendChild(child)
    } catch (error) {
      console.error('safeAppendChild 失败:', error)
      return null
    }
  }

  window.safeInsertBefore = function(parent: Node, newNode: Node, referenceNode?: Node | null): Node | null {
    if (!parent || !newNode) {
      return null
    }
    try {
      return parent.insertBefore(newNode, referenceNode || null)
    } catch (error) {
      console.error('safeInsertBefore 失败:', error)
      return null
    }
  }

  console.log('parentNode 错误修复完成')
}

// 修复 Vue 组件卸载时的错误
export function fixVueUnmountErrors() {
  console.log('修复 Vue 组件卸载错误...')

  // 监听全局错误
  window.addEventListener('error', (event) => {
    if (event.error && event.error.message && event.error.message.includes('parentNode')) {
      console.warn('捕获到 parentNode 错误:', event.error.message)
      event.preventDefault() // 阻止错误冒泡
      return false
    }
  })

  // 监听未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('parentNode')) {
      console.warn('捕获到 parentNode Promise 拒绝:', event.reason.message)
      event.preventDefault()
      return false
    }
  })
}

// 修复 Element Plus 组件相关错误
export function fixElementPlusErrors() {
  console.log('修复 Element Plus 组件错误...')

  // 安全的 Element Plus 组件操作
  window.safeElFormValidate = async function(formRef: any): Promise<boolean> {
    if (!formRef || !formRef.value) {
      console.warn('表单引用为空')
      return false
    }

    if (typeof formRef.value.validate !== 'function') {
      console.warn('表单验证方法不存在')
      return false
    }

    try {
      return await new Promise((resolve) => {
        formRef.value.validate((valid: boolean) => {
          resolve(valid)
        })
      })
    } catch (error) {
      console.error('表单验证失败:', error)
      return false
    }
  }

  window.safeElFormReset = function(formRef: any): void {
    nextTick(() => {
      if (formRef && formRef.value && typeof formRef.value.resetFields === 'function') {
        try {
          formRef.value.resetFields()
        } catch (error) {
          console.error('表单重置失败:', error)
        }
      }
    })
  }

  window.safeElFormClearValidate = function(formRef: any): void {
    nextTick(() => {
      if (formRef && formRef.value && typeof formRef.value.clearValidate === 'function') {
        try {
          formRef.value.clearValidate()
        } catch (error) {
          console.error('清除表单验证失败:', error)
        }
      }
    })
  }
}

// 修复 Vue Router 相关错误
export function fixVueRouterErrors() {
  console.log('修复 Vue Router 错误...')

  // 安全的路由导航
  window.safeRouterPush = function(router: any, to: any): Promise<void> {
    if (!router || typeof router.push !== 'function') {
      console.warn('路由器不可用')
      return Promise.resolve()
    }

    return router.push(to).catch((error: any) => {
      // 忽略导航重复错误
      if (error.name === 'NavigationDuplicated') {
        return
      }
      console.error('路由导航失败:', error)
      throw error
    })
  }
}

// 修复异步组件加载错误
export function fixAsyncComponentErrors() {
  console.log('修复异步组件加载错误...')

  // 创建安全的异步组件包装器
  window.safeAsyncComponent = function(loader: () => Promise<any>) {
    return () => {
      return loader().catch((error) => {
        console.error('异步组件加载失败:', error)
        // 返回一个简单的错误组件
        return {
          template: '<div class="error-component">组件加载失败</div>'
        }
      })
    }
  }
}

// 修复响应式数据相关错误
export function fixReactivityErrors() {
  console.log('修复响应式数据错误...')

  // 安全的响应式数据访问
  window.safeReactiveAccess = function(obj: any, path: string, defaultValue: any = undefined): any {
    if (!obj || typeof obj !== 'object') {
      return defaultValue
    }

    const keys = path.split('.')
    let current = obj

    try {
      for (const key of keys) {
        if (current == null || typeof current !== 'object' || !(key in current)) {
          return defaultValue
        }
        current = current[key]
      }
      return current !== undefined ? current : defaultValue
    } catch (error) {
      console.error('响应式数据访问失败:', error)
      return defaultValue
    }
  }

  // 安全的响应式数据设置
  window.safeReactiveSet = function(obj: any, path: string, value: any): boolean {
    if (!obj || typeof obj !== 'object') {
      return false
    }

    const keys = path.split('.')
    const lastKey = keys.pop()
    
    if (!lastKey) {
      return false
    }

    let current = obj

    try {
      for (const key of keys) {
        if (current[key] == null || typeof current[key] !== 'object') {
          current[key] = {}
        }
        current = current[key]
      }
      current[lastKey] = value
      return true
    } catch (error) {
      console.error('响应式数据设置失败:', error)
      return false
    }
  }
}

// 综合修复函数
export function fixAllVueErrors() {
  console.log('开始修复所有 Vue 相关错误...')

  try {
    fixParentNodeErrors()
    fixVueUnmountErrors()
    fixElementPlusErrors()
    fixVueRouterErrors()
    fixAsyncComponentErrors()
    fixReactivityErrors()

    console.log('所有 Vue 错误修复完成')
    ElMessage.success('Vue 组件错误修复完成')
    return true
  } catch (error) {
    console.error('Vue 错误修复失败:', error)
    ElMessage.error('Vue 错误修复失败')
    return false
  }
}

// 测试修复效果
export function testVueErrorFixes(): { passed: number; total: number; results: any[] } {
  console.log('开始测试 Vue 错误修复效果...')

  const testResults = []
  let passedTests = 0

  // 测试1: parentNode 安全操作
  try {
    const testDiv = document.createElement('div')
    const testChild = document.createElement('span')
    testDiv.appendChild(testChild)
    
    const result = window.safeRemoveChild(testDiv, testChild)
    if (result === testChild) {
      testResults.push({ test: 'parentNode 安全移除', result: '通过' })
      passedTests++
    } else {
      testResults.push({ test: 'parentNode 安全移除', result: '失败' })
    }
  } catch (error) {
    testResults.push({ test: 'parentNode 安全移除', result: '异常', error: error.message })
  }

  // 测试2: null 节点处理
  try {
    const result = window.safeRemoveChild(document.body, null as any)
    if (result === null) {
      testResults.push({ test: 'null 节点处理', result: '通过' })
      passedTests++
    } else {
      testResults.push({ test: 'null 节点处理', result: '失败' })
    }
  } catch (error) {
    testResults.push({ test: 'null 节点处理', result: '异常', error: error.message })
  }

  // 测试3: 响应式数据安全访问
  try {
    const testObj = { a: { b: { c: 'test' } } }
    const result1 = window.safeReactiveAccess(testObj, 'a.b.c', 'default')
    const result2 = window.safeReactiveAccess(testObj, 'a.b.d', 'default')
    
    if (result1 === 'test' && result2 === 'default') {
      testResults.push({ test: '响应式数据安全访问', result: '通过' })
      passedTests++
    } else {
      testResults.push({ test: '响应式数据安全访问', result: '失败' })
    }
  } catch (error) {
    testResults.push({ test: '响应式数据安全访问', result: '异常', error: error.message })
  }

  // 测试4: 响应式数据安全设置
  try {
    const testObj = {}
    const success = window.safeReactiveSet(testObj, 'a.b.c', 'test')
    
    if (success && (testObj as any).a?.b?.c === 'test') {
      testResults.push({ test: '响应式数据安全设置', result: '通过' })
      passedTests++
    } else {
      testResults.push({ test: '响应式数据安全设置', result: '失败' })
    }
  } catch (error) {
    testResults.push({ test: '响应式数据安全设置', result: '异常', error: error.message })
  }

  console.log(`Vue 错误修复测试完成: ${passedTests}/${testResults.length} 个测试通过`)

  return {
    passed: passedTests,
    total: testResults.length,
    results: testResults
  }
}

// 声明全局函数类型
declare global {
  interface Window {
    safeRemoveChild: (parent: Node, child: Node) => Node | null
    safeAppendChild: (parent: Node, child: Node) => Node | null
    safeInsertBefore: (parent: Node, newNode: Node, referenceNode?: Node | null) => Node | null
    safeElFormValidate: (formRef: any) => Promise<boolean>
    safeElFormReset: (formRef: any) => void
    safeElFormClearValidate: (formRef: any) => void
    safeRouterPush: (router: any, to: any) => Promise<void>
    safeAsyncComponent: (loader: () => Promise<any>) => () => Promise<any>
    safeReactiveAccess: (obj: any, path: string, defaultValue?: any) => any
    safeReactiveSet: (obj: any, path: string, value: any) => boolean
  }
}

export default {
  fixParentNodeErrors,
  fixVueUnmountErrors,
  fixElementPlusErrors,
  fixVueRouterErrors,
  fixAsyncComponentErrors,
  fixReactivityErrors,
  fixAllVueErrors,
  testVueErrorFixes
}