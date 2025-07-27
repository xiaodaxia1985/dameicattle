<template>
  <el-dialog
    v-model="visible"
    :title="cattle ? '编辑牛只' : '添加牛只'"
    width="800px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      class="cattle-form"
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="耳标号" prop="ear_tag">
            <el-input v-model="form.ear_tag" placeholder="请输入耳标号" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="品种" prop="breed">
            <el-input v-model="form.breed" placeholder="请输入品种" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="性别" prop="gender">
            <el-select v-model="form.gender" placeholder="请选择性别" style="width: 100%">
              <el-option label="公牛" value="male" />
              <el-option label="母牛" value="female" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="出生日期" prop="birth_date">
            <el-date-picker
              v-model="form.birth_date"
              type="date"
              placeholder="请选择出生日期"
              style="width: 100%"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="体重(kg)" prop="weight">
            <el-input-number
              v-model="form.weight"
              :min="0"
              :max="2000"
              placeholder="请输入体重"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="健康状态" prop="health_status">
            <el-select v-model="form.health_status" placeholder="请选择健康状态" style="width: 100%">
              <el-option label="健康" value="healthy" />
              <el-option label="患病" value="sick" />
              <el-option label="治疗中" value="treatment" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="所属基地" prop="base_id">
            <el-select v-model="form.base_id" placeholder="请选择基地" style="width: 100%" @change="handleBaseChange">
              <el-option
                v-for="base in baseStore.bases"
                :key="base.id"
                :label="base.name"
                :value="base.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所在牛棚" prop="barn_id">
            <el-select v-model="form.barn_id" placeholder="请选择牛棚" style="width: 100%">
              <el-option
                v-for="barn in availableBarns"
                :key="barn.value"
                :label="barn.label"
                :value="barn.value"
                :disabled="barn.disabled"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="来源" prop="source">
            <el-select v-model="form.source" placeholder="请选择来源" style="width: 100%">
              <el-option label="出生" value="born" />
              <el-option label="采购" value="purchased" />
              <el-option label="转入" value="transferred" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12" v-if="form.source === 'purchased'">
          <el-form-item label="采购价格" prop="purchase_price">
            <el-input-number
              v-model="form.purchase_price"
              :min="0"
              placeholder="请输入采购价格"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="备注" prop="notes">
        <el-input
          v-model="form.notes"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="submitting">
        {{ cattle ? '更新' : '创建' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed, type PropType } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { useBaseStore } from '@/stores/base'
import { cattleApi, type Cattle, type CreateCattleRequest } from '@/api/cattle'
import { barnApi } from '@/api/barn'

interface Props {
  modelValue: boolean
  cattle?: Cattle | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const baseStore = useBaseStore()
const formRef = ref<FormInstance>()
const submitting = ref(false)
const availableBarns = ref<Array<{
  value: number
  label: string
  disabled: boolean
}>>([])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const form = reactive<CreateCattleRequest>({
  ear_tag: '',
  breed: '',
  gender: 'male',
  birth_date: '',
  weight: undefined,
  base_id: undefined as any,
  barn_id: undefined,
  source: 'born',
  purchase_price: undefined,
  notes: ''
})

const rules = {
  ear_tag: [
    { required: true, message: '请输入耳标号', trigger: 'blur' },
    { min: 2, max: 50, message: '耳标号长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  breed: [
    { required: true, message: '请输入品种', trigger: 'blur' },
    { min: 2, max: 50, message: '品种长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  base_id: [
    { required: true, message: '请选择所属基地', trigger: 'change' }
  ],
  source: [
    { required: true, message: '请选择来源', trigger: 'change' }
  ]
}

watch(() => props.modelValue, async (newVal) => {
  if (newVal) {
    resetForm()
    
    // 确保基地数据已加载
    if (baseStore.bases.length === 0) {
      try {
        await baseStore.fetchAllBases()
      } catch (error) {
        console.error('加载基地数据失败:', error)
        ElMessage.error('加载基地数据失败')
      }
    }
    
    if (props.cattle) {
      // 编辑模式，填充表单数据
      Object.assign(form, {
        ear_tag: props.cattle.ear_tag,
        breed: props.cattle.breed,
        gender: props.cattle.gender,
        birth_date: props.cattle.birth_date || '',
        weight: props.cattle.weight,
        base_id: props.cattle.base_id,
        barn_id: props.cattle.barn_id,
        source: props.cattle.source || 'born',
        purchase_price: props.cattle.purchase_price,
        notes: props.cattle.notes || ''
      })
      
      if (props.cattle.base_id) {
        loadBarns(props.cattle.base_id)
      }
    }
  }
})

const handleBaseChange = (baseId: number) => {
  form.barn_id = undefined
  if (baseId) {
    loadBarns(baseId)
  } else {
    availableBarns.value = []
  }
}

const loadBarns = async (baseId: number) => {
  try {
    const response = await barnApi.getBarnOptions({ base_id: baseId })
    availableBarns.value = response.data
  } catch (error) {
    console.error('加载牛棚选项失败:', error)
    ElMessage.error('加载牛棚选项失败')
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (props.cattle) {
      // 编辑模式
      await cattleApi.update(props.cattle.id, form)
      ElMessage.success('更新成功')
    } else {
      // 创建模式
      await cattleApi.create(form)
      ElMessage.success('创建成功')
    }
    
    emit('success')
    handleClose()
  } catch (error: any) {
    console.error('表单提交失败:', error)
    
    // 处理特定的错误类型
    if (error.response?.status === 409) {
      ElMessage.error('耳标号已存在，请使用其他耳标号')
    } else if (error.response?.status === 404) {
      ElMessage.error('基地或牛棚不存在，请重新选择')
    } else if (error.response?.status === 403) {
      ElMessage.error('权限不足，无法在该基地创建牛只')
    } else if (error.response?.status === 422) {
      ElMessage.error('数据验证失败，请检查输入信息')
    } else if (error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('操作失败，请稍后重试')
    }
  } finally {
    submitting.value = false
  }
}

const handleClose = () => {
  visible.value = false
  resetForm()
}

const resetForm = () => {
  Object.assign(form, {
    ear_tag: '',
    breed: '',
    gender: 'male',
    birth_date: '',
    weight: undefined,
    base_id: undefined,
    barn_id: undefined,
    source: 'born',
    purchase_price: undefined,
    notes: ''
  })
  availableBarns.value = []
  formRef.value?.clearValidate()
}
</script>

<style lang="scss" scoped>
.cattle-form {
  .el-form-item {
    margin-bottom: 20px;
  }
}
</style>