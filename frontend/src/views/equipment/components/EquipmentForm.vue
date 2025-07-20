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
          <el-select v-model="form.base_id" placeholder="请选择基地" style="width: 100%">
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
        <el-form-item label="安装位置">
          <el-input v-model="form.location" placeholder="请输入安装位置" />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="采购日期">
          <el-date-picker
            v-model="form.purchase_date"
            type="date"
            placeholder="请选择采购日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="采购价格">
          <el-input-number
            v-model="form.purchase_price"
            :min="0"
            :precision="2"
            placeholder="请输入采购价格"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="保修期(月)">
          <el-input-number
            v-model="form.warranty_period"
            :min="0"
            placeholder="请输入保修期"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="安装日期">
          <el-date-picker
            v-model="form.installation_date"
            type="date"
            placeholder="请选择安装日期"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="技术规格">
      <el-input
        v-model="specificationsText"
        type="textarea"
        :rows="4"
        placeholder="请输入技术规格，格式：功率:5kw,电压:380V"
      />
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        {{ equipment ? '更新' : '添加' }}
      </el-button>
      <el-button @click="handleCancel">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { baseApi } from '@/api/base'
import { barnApi } from '@/api/barn'

interface Props {
  equipment?: any
  categories: any[]
}

interface Emits {
  (e: 'submit', data: any): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const submitting = ref(false)
const bases = ref([])
const barns = ref([])

// 表单数据
const form = reactive({
  name: '',
  code: '',
  category_id: '',
  base_id: '',
  barn_id: '',
  brand: '',
  model: '',
  serial_number: '',
  purchase_date: '',
  purchase_price: null,
  warranty_period: null,
  installation_date: '',
  status: 'normal',
  location: '',
  specifications: {},
})

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

// 监听基地变化，加载对应牛棚
watch(() => form.base_id, (newBaseId) => {
  if (newBaseId) {
    loadBarns(newBaseId)
  } else {
    barns.value = []
  }
  form.barn_id = ''
})

// 监听技术规格文本变化
watch(specificationsText, (newText) => {
  if (newText) {
    try {
      const specs = {}
      newText.split(',').forEach(item => {
        const [key, value] = item.split(':')
        if (key && value) {
          specs[key.trim()] = value.trim()
        }
      })
      form.specifications = specs
    } catch (error) {
      console.error('解析技术规格失败:', error)
    }
  } else {
    form.specifications = {}
  }
})

// 加载基地列表
const loadBases = async () => {
  try {
    const response = await baseApi.getBases()
    bases.value = response.data || []
  } catch (error) {
    console.error('加载基地列表失败:', error)
  }
}

// 加载牛棚列表
const loadBarns = async (baseId: string) => {
  try {
    const response = await barnApi.getBarns({ baseId })
    barns.value = response.data || []
  } catch (error) {
    console.error('加载牛棚列表失败:', error)
  }
}

// 初始化表单数据
const initForm = () => {
  if (props.equipment) {
    Object.assign(form, {
      ...props.equipment,
      purchase_date: props.equipment.purchase_date ? new Date(props.equipment.purchase_date) : '',
      installation_date: props.equipment.installation_date ? new Date(props.equipment.installation_date) : '',
    })
    
    // 初始化技术规格文本
    if (props.equipment.specifications) {
      specificationsText.value = Object.entries(props.equipment.specifications)
        .map(([key, value]) => `${key}:${value}`)
        .join(',')
    }
    
    // 加载对应基地的牛棚
    if (props.equipment.base_id) {
      loadBarns(props.equipment.base_id)
    }
  }
}

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const submitData = {
      ...form,
      purchase_date: form.purchase_date ? new Date(form.purchase_date).toISOString().split('T')[0] : null,
      installation_date: form.installation_date ? new Date(form.installation_date).toISOString().split('T')[0] : null,
    }
    
    emit('submit', submitData)
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
}

// 处理取消
const handleCancel = () => {
  emit('cancel')
}

// 初始化
onMounted(() => {
  loadBases()
  initForm()
})
</script>

<style scoped>
.el-form {
  max-width: 800px;
}
</style>