import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ElMessage } from 'element-plus'
import Bases from '@/views/system/Bases.vue'
import { baseApi } from '@/api/base'

// Mock the API
vi.mock('@/api/base', () => ({
  baseApi: {
    getBases: vi.fn(),
    createBase: vi.fn(),
    updateBase: vi.fn(),
    deleteBase: vi.fn(),
    getBaseStatistics: vi.fn(),
    getBarnsByBaseId: vi.fn(),
    createBarn: vi.fn(),
    updateBarn: vi.fn(),
    deleteBarn: vi.fn()
  }
}))

// Mock Element Plus message
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    },
    ElMessageBox: {
      confirm: vi.fn()
    }
  }
})

// Mock dayjs
vi.mock('dayjs', () => ({
  default: vi.fn(() => ({
    format: vi.fn(() => '2024-01-15 10:30:00')
  }))
}))

describe('Bases.vue', () => {
  let wrapper: any
  const mockBases = [
    {
      id: 1,
      name: '测试基地1',
      code: 'BASE001',
      address: '测试地址1',
      area: 100,
      managerId: 1,
      managerName: '张三',
      latitude: 39.9042,
      longitude: 116.4074,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      name: '测试基地2',
      code: 'BASE002',
      address: '测试地址2',
      area: 200,
      managerId: 2,
      managerName: '李四',
      latitude: 40.0042,
      longitude: 116.5074,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    }
  ]

  const mockBarns = [
    {
      id: 1,
      name: '牛棚1',
      code: 'BARN001',
      baseId: 1,
      baseName: '测试基地1',
      capacity: 50,
      currentCount: 30,
      barnType: 'fattening',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z'
    }
  ]

  beforeEach(() => {
    setActivePinia(createPinia())
    
    // Setup API mocks
    vi.mocked(baseApi.getBases).mockResolvedValue({
      data: {
        data: mockBases,
        total: 2,
        page: 1,
        limit: 20
      }
    })
    
    vi.mocked(baseApi.getBaseStatistics).mockResolvedValue({
      data: { barnCount: 2, cattleCount: 50 }
    })
    
    vi.mocked(baseApi.getBarnsByBaseId).mockResolvedValue({
      data: mockBarns
    })

    wrapper = mount(Bases, {
      global: {
        stubs: {
          'el-card': true,
          'el-button': true,
          'el-form': true,
          'el-form-item': true,
          'el-input': true,
          'el-select': true,
          'el-option': true,
          'el-pagination': true,
          'el-tabs': true,
          'el-tab-pane': true,
          'el-dialog': true,
          'el-upload': true,
          'el-alert': true,
          'el-empty': true,
          'el-progress': true,
          'el-input-number': true,
          'el-row': true,
          'el-col': true,
          'el-icon': true,
          'el-breadcrumb': true,
          'el-breadcrumb-item': true
        }
      }
    })
  })

  describe('基础功能', () => {
    it('应该正确渲染基地管理页面', async () => {
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.bases-container').exists()).toBe(true)
      expect(wrapper.find('.page-header').exists()).toBe(true)
      expect(wrapper.find('.search-section').exists()).toBe(true)
      expect(wrapper.find('.content-section').exists()).toBe(true)
    })

    it('应该在组件挂载时获取基地列表', async () => {
      await wrapper.vm.$nextTick()
      
      expect(baseApi.getBases).toHaveBeenCalled()
      expect(wrapper.vm.bases).toEqual(mockBases)
    })

    it('应该正确处理搜索功能', async () => {
      await wrapper.vm.$nextTick()
      
      // 设置搜索条件
      wrapper.vm.searchForm.keyword = '测试基地1'
      
      // 触发搜索
      await wrapper.vm.handleSearch()
      
      expect(baseApi.getBases).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        keyword: '测试基地1',
        managerId: undefined
      })
    })

    it('应该正确处理分页', async () => {
      await wrapper.vm.$nextTick()
      
      // 测试页面大小变化
      await wrapper.vm.handleSizeChange(50)
      expect(wrapper.vm.pagination.limit).toBe(50)
      expect(wrapper.vm.pagination.page).toBe(1)
      
      // 测试页面变化
      await wrapper.vm.handleCurrentChange(2)
      expect(wrapper.vm.pagination.page).toBe(2)
    })
  })

  describe('基地管理功能', () => {
    it('应该正确选择基地', async () => {
      await wrapper.vm.$nextTick()
      
      const base = mockBases[0]
      await wrapper.vm.handleSelectBase(base)
      
      expect(wrapper.vm.selectedBase).toEqual(base)
      expect(wrapper.vm.activeTab).toBe('detail')
      expect(baseApi.getBarnsByBaseId).toHaveBeenCalledWith(base.id)
    })

    it('应该正确处理新增基地', async () => {
      await wrapper.vm.$nextTick()
      
      wrapper.vm.handleAddBase()
      
      expect(wrapper.vm.baseDialogVisible).toBe(true)
      expect(wrapper.vm.baseDialogTitle).toBe('新增基地')
      expect(wrapper.vm.baseForm.id).toBeUndefined()
    })

    it('应该正确处理编辑基地', async () => {
      await wrapper.vm.$nextTick()
      
      const base = mockBases[0]
      wrapper.vm.handleEditBase(base)
      
      expect(wrapper.vm.baseDialogVisible).toBe(true)
      expect(wrapper.vm.baseDialogTitle).toBe('编辑基地')
      expect(wrapper.vm.baseForm.id).toBe(base.id)
      expect(wrapper.vm.baseForm.name).toBe(base.name)
    })

    it('应该正确保存基地信息', async () => {
      await wrapper.vm.$nextTick()
      
      // Mock form validation
      wrapper.vm.baseFormRef = {
        validate: vi.fn().mockResolvedValue(true)
      }
      
      // 设置表单数据
      wrapper.vm.baseForm = {
        name: '新基地',
        code: 'NEW001',
        address: '新地址',
        area: 150,
        managerId: 1,
        latitude: 39.9042,
        longitude: 116.4074
      }
      
      vi.mocked(baseApi.createBase).mockResolvedValue({
        data: { ...wrapper.vm.baseForm, id: 3 }
      })
      
      await wrapper.vm.handleSaveBase()
      
      expect(baseApi.createBase).toHaveBeenCalledWith({
        name: '新基地',
        code: 'NEW001',
        address: '新地址',
        area: 150,
        managerId: 1,
        latitude: 39.9042,
        longitude: 116.4074
      })
      expect(ElMessage.success).toHaveBeenCalledWith('创建成功')
    })
  })

  describe('牛棚管理功能', () => {
    it('应该正确处理新增牛棚', async () => {
      await wrapper.vm.$nextTick()
      
      // 先选择一个基地
      wrapper.vm.selectedBase = mockBases[0]
      
      wrapper.vm.handleAddBarn()
      
      expect(wrapper.vm.barnDialogVisible).toBe(true)
      expect(wrapper.vm.barnDialogTitle).toBe('新增牛棚')
      expect(wrapper.vm.barnForm.baseId).toBe(mockBases[0].id)
    })

    it('应该正确处理编辑牛棚', async () => {
      await wrapper.vm.$nextTick()
      
      const barn = mockBarns[0]
      wrapper.vm.handleEditBarn(barn)
      
      expect(wrapper.vm.barnDialogVisible).toBe(true)
      expect(wrapper.vm.barnDialogTitle).toBe('编辑牛棚')
      expect(wrapper.vm.barnForm.id).toBe(barn.id)
      expect(wrapper.vm.barnForm.name).toBe(barn.name)
    })

    it('应该正确保存牛棚信息', async () => {
      await wrapper.vm.$nextTick()
      
      // Mock form validation
      wrapper.vm.barnFormRef = {
        validate: vi.fn().mockResolvedValue(true)
      }
      
      // 设置表单数据
      wrapper.vm.barnForm = {
        name: '新牛棚',
        code: 'BARN002',
        baseId: 1,
        capacity: 60,
        barnType: 'breeding'
      }
      
      vi.mocked(baseApi.createBarn).mockResolvedValue({
        data: { ...wrapper.vm.barnForm, id: 2 }
      })
      
      await wrapper.vm.handleSaveBarn()
      
      expect(baseApi.createBarn).toHaveBeenCalledWith({
        name: '新牛棚',
        code: 'BARN002',
        baseId: 1,
        capacity: 60,
        barnType: 'breeding'
      })
      expect(ElMessage.success).toHaveBeenCalledWith('创建成功')
    })
  })

  describe('数据导入导出功能', () => {
    it('应该正确处理数据导出', async () => {
      await wrapper.vm.$nextTick()
      
      // Mock URL.createObjectURL and document.createElement
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('mock-url')
      
      await wrapper.vm.handleExport()
      
      expect(baseApi.getBases).toHaveBeenCalledWith({
        keyword: '',
        managerId: undefined,
        limit: 1000
      })
      expect(mockLink.click).toHaveBeenCalled()
      expect(ElMessage.success).toHaveBeenCalledWith('导出成功')
    })

    it('应该正确处理模板下载', () => {
      // Mock URL.createObjectURL and document.createElement
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any)
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('mock-url')
      
      wrapper.vm.handleDownloadTemplate()
      
      expect(mockLink.download).toBe('基地数据导入模板.csv')
      expect(mockLink.click).toHaveBeenCalled()
    })

    it('应该正确解析CSV数据', () => {
      const csvContent = `基地名称,基地编码,详细地址,占地面积(亩),纬度,经度
测试基地,TEST001,测试地址,100,39.9042,116.4074
测试基地2,TEST002,测试地址2,200,40.0042,116.5074`
      
      const result = wrapper.vm.parseImportData(csvContent, 'test.csv')
      
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        name: '测试基地',
        code: 'TEST001',
        address: '测试地址',
        area: '100',
        latitude: '39.9042',
        longitude: '116.4074'
      })
    })

    it('应该正确验证导入数据', () => {
      const validData = [
        { name: '测试基地', code: 'TEST001', address: '测试地址', area: '100', latitude: '39.9042', longitude: '116.4074' }
      ]
      
      const invalidData = [
        { name: '', code: 'TEST001', address: '测试地址', area: '100', latitude: '39.9042', longitude: '116.4074' }
      ]
      
      expect(wrapper.vm.validateImportData(validData)).toEqual({ valid: true })
      expect(wrapper.vm.validateImportData(invalidData)).toEqual({ 
        valid: false, 
        message: '第2行：基地名称不能为空' 
      })
    })
  })

  describe('地图功能', () => {
    it('应该正确初始化基地地图', async () => {
      await wrapper.vm.$nextTick()
      
      // 设置选中的基地
      wrapper.vm.selectedBase = mockBases[0]
      
      // Mock DOM element
      const mockElement = { innerHTML: '' }
      vi.spyOn(document, 'getElementById').mockReturnValue(mockElement as any)
      
      wrapper.vm.initBaseMap()
      
      expect(mockElement.innerHTML).toContain('纬度: 39.904200')
      expect(mockElement.innerHTML).toContain('经度: 116.407400')
      expect(mockElement.innerHTML).toContain('测试基地1')
    })

    it('应该正确处理位置选择', async () => {
      await wrapper.vm.$nextTick()
      
      // 设置选中位置
      wrapper.vm.selectedLocation = { latitude: 40.0000, longitude: 116.0000 }
      
      wrapper.vm.handleConfirmLocation()
      
      expect(wrapper.vm.baseForm.latitude).toBe(40.0000)
      expect(wrapper.vm.baseForm.longitude).toBe(116.0000)
      expect(wrapper.vm.mapDialogVisible).toBe(false)
    })

    it('应该正确处理位置更新', async () => {
      await wrapper.vm.$nextTick()
      
      // 设置选中的基地和位置
      wrapper.vm.selectedBase = mockBases[0]
      wrapper.vm.selectedLocation = { latitude: 40.0000, longitude: 116.0000 }
      
      vi.mocked(baseApi.updateBase).mockResolvedValue({
        data: { ...mockBases[0], latitude: 40.0000, longitude: 116.0000 }
      })
      
      await wrapper.vm.handleSaveLocationUpdate()
      
      expect(baseApi.updateBase).toHaveBeenCalledWith(1, {
        latitude: 40.0000,
        longitude: 116.0000
      })
      expect(ElMessage.success).toHaveBeenCalledWith('位置更新成功')
    })
  })

  describe('工具函数', () => {
    it('应该正确格式化日期', () => {
      const result = wrapper.vm.formatDate('2024-01-15T10:30:00Z')
      expect(result).toBe('2024-01-15 10:30:00')
    })

    it('应该正确获取容量颜色', () => {
      expect(wrapper.vm.getCapacityColor(0.5)).toBe('#67c23a')
      expect(wrapper.vm.getCapacityColor(0.8)).toBe('#e6a23c')
      expect(wrapper.vm.getCapacityColor(0.95)).toBe('#f56c6c')
    })

    it('应该正确解析CSV行', () => {
      const line = '"测试基地","TEST001","测试地址","100","39.9042","116.4074"'
      const result = wrapper.vm.parseCSVLine(line)
      
      expect(result).toEqual(['测试基地', 'TEST001', '测试地址', '100', '39.9042', '116.4074'])
    })
  })
})