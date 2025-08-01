<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="120px"
    @submit.prevent="handleSubmit"
  >
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="设备名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入设备名称" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="设备编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入设备编码" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="设备分类" prop="category_id">
          <el-select v-model="form.category_id" placeholder="请选择设备分类" style="width: 100%">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="所属基地" prop="base_id">
          <el-select v-model="form.base_id" placeholder="请选择基地" style="width: 100%" @change="handleBaseChange">
            <el-option
              v-for="base in bases"
              :key="base.id"
              :label="base.name"
              :value="base.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="所属牛棚">
          <el-select v-model="form.barn_id" placeholder="请选择牛棚" style="width: 100%" clearable>
            <el-option
              v-for="barn in barns"
              :key="barn.id"
              :label="barn.name"
              :value="barn.id"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="设备状态">
          <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="正常" value="normal" />
            <el-option label="维护中" value="maintenance" />
            <el-option label="故障" value="broken" />
            <el-option label="已退役" value="retired" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="品牌">
          <el-input v-model="form.brand" placeholder="请输入品牌" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="型号">
          <el-input v-model="form.model" placeholder="请输入型号" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="序列号">
          <el-input v-model="form.serial_number" placeholder="请输入序列号" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="购买日期">
          <el-date-picker
            v-model="form.purchase_date"
            type="date"
            placeholder="请选择购买日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="保修期至">
          <el-date-picker
            v-model="form.warranty_until"
            type="date"
            placeholder="请选择保修期"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="购买价格">
          <el-input-number
            v-model="form.purchase_price"
            :min="0"
            :precision="2"
            placeholder="请输入购买价格"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="供应商">
          <el-input v-model="form.supplier" placeholder="请输入供应商" />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="负责人">
          <el-input v-model="form.responsible_person" placeholder="请输入负责人" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="24">
        <el-form-item label="技术规格">
          <el-input
            v-model="specificationsText"
            type="textarea"
            :rows="4"
            placeholder="请输入技术规格，格式：功率:5kw,电压:380V"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="24">
        <el-form-item label="备注">
          <el-input
            v-model="form.notes"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="24" style="text-align: right">
        <el-button @click="$emit('cancel')">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ props.equipment ? '更新' : '创建' }}
        </el-button>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { equipmentApi } from '@/api/equipment'
import { baseApi } from '@/api/base'
import { barnApi } from '@/api/barn'

interface Equipment {
  id?: number
  name: string
  code: string
  category_id: string
  base_id: string
  barn_id?: string
  status: string
  brand?: string
  model?: string
  serial_number?: string
  purchase_date?: string
  warranty_until?: string
  purchase_price?: number
  supplier?: string
  responsible_person?: string
  specifications?: Record<string, any>
  notes?: string
}

interface Props {
  equipment?: Equipment
  visible: boolean
}

interface Emits {
  (e: 'success'): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const bases = ref<Array<{ id: number; name: string }>>([])
const barns = ref<Array<{ id: number; name: string }>>([])

// 表单数据
const form = reactive({
  name: '',
  code: '',
  category_id: '',
  base_id: '',
  barn_id: '',
  status: 'normal',
  brand: '',
  model: '',
  serial_number: '',
  purchase_date: '',
  warranty_until: '',
  purchase_price: undefined as number | undefined,
  supplier: '',
  responsible_person: '',
  specifications: {} as Record<string, any>,
  notes: ''
})

// 设备分类选项
const categories = ref([
  { id: 'feeding', name: '饲喂设备' },
  { id: 'monitoring', name: '监控设备' },
  { id: 'cleaning', name: '清洁设备' },
  { id: 'medical', name: '医疗设备' },
  { id: 'other', name: '其他设备' }
])

// 技术规格文本
const specificationsText = ref('')

// 表单验证规则
const rules: FormRules = {
  name: [
    { required: true, message: '请输入设备名称', trigger: 'blur' },
    { max: 100, message: '设备名称不能超过100个字符', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入设备编码', trigger: 'blur' },
    { max: 50, message: '设备编码不能超过50个字符', trigger: 'blur' },
  ],
  category_id: [
    { required: true, message: '请选择设备分类', trigger: 'change' },
  ],
  base_id: [
    { required: true, message: '请选择所属基地', trigger: 'change' },
  ],
}

// 监听技术规格文本变化
watch(specificationsText, (newVal) => {
  if (newVal) {
    const specs: Record<string, any> = {}
    newVal.split(',').forEach(item => {
      const [key, value] = item.split(':')
      if (key && value) {
        specs[key.trim()] = value.trim()
      }
    })
    form.specifications = specs
  } else {
    form.specifications = {}
  }
})

// 监听设备数据变化
watch(() => props.equipment, (equipment) => {
  if (equipment) {
    Object.assign(form, equipment)
    if (equipment.specifications) {
      specificationsText.value = Object.entries(equipment.specifications)
        .map(([key, value]) => `${key}:${value}`)
        .join(',')
    }
  } else {
    resetForm()
  }
}, { immediate: true })

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    name: '',
    code: '',
    category_id: '',
    base_id: '',
    barn_id: '',
    status: 'normal',
    brand: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    warranty_until: '',
    purchase_price: undefined,
    supplier: '',
    responsible_person: '',
    specifications: {},
    notes: ''
  })
  specificationsText.value = ''
  formRef.value?.clearValidate()
}

// 加载基地列表
const loadBases = async () => {
  try {
    const response = await baseApi.getAllBases()
    bases.value = response.data
  } catch (error) {
    console.error('加载基地列表失败:', error)
  }
}

// 加载牛棚列表
const loadBarns = async (baseId?: string) => {
  if (!baseId) {
    barns.value = []
    return
  }
  
  try {
    const response = await barnApi.getBarns({ 
      page: 1, 
      limit: 100, 
      base_id: parseInt(baseId)
    })
    barns.value = response.data.barns || []
  } catch (error) {
    console.error('加载牛棚列表失败:', error)
  }
}

// 基地变化处理
const handleBaseChange = (baseId: string) => {
  form.barn_id = ''
  loadBarns(baseId)
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const data = { ...form }
    
    if (props.equipment?.id) {
      await equipmentApi.updateEquipment(props.equipment.id, data)
      ElMessage.success('设备更新成功')
    } else {
      await equipmentApi.createEquipment(data)
      ElMessage.success('设备创建成功')
    }
    
    emit('success')
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败，请重试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadBases()
})
</script>