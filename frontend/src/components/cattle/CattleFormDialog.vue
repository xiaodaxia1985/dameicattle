<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑牛只信息' : '添加牛只'"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="120px"
      @submit.prevent
    >
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="耳标号" prop="ear_tag">
            <el-input
              v-model="form.ear_tag"
              placeholder="请输入耳标号"
              :disabled="isEdit"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="品种" prop="breed">
            <el-select v-model="form.breed" placeholder="请选择品种" style="width: 100%">
              <el-option label="西门塔尔牛" value="simmental" />
              <el-option label="安格斯牛" value="angus" />
              <el-option label="夏洛莱牛" value="charolais" />
              <el-option label="利木赞牛" value="limousin" />
              <el-option label="海福特牛" value="hereford" />
              <el-option label="荷斯坦牛" value="holstein" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="性别" prop="gender">
            <el-radio-group v-model="form.gender">
              <el-radio label="male">公牛</el-radio>
              <el-radio label="female">母牛</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="出生日期" prop="birth_date">
            <el-date-picker
              v-model="form.birth_date"
              type="date"
              placeholder="选择出生日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
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
              :precision="1"
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

      <el-row :gutter="20" class="form-row">
        <el-col :span="24" class="form-col-full">
          <el-form-item label="所属基地-牛棚" prop="cascade" class="cascade-form-item">
            <CascadeSelector
              v-model="form.cascade"
              :required="true"
              :showCattle="false"
              @change="handleCascadeChange"
            />
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
              :precision="2"
              placeholder="请输入采购价格"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20" v-if="form.source === 'purchased'">
        <el-col :span="12">
          <el-form-item label="采购日期" prop="purchase_date">
            <el-date-picker
              v-model="form.purchase_date"
              type="date"
              placeholder="选择采购日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
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
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { Cattle, CreateCattleRequest } from '@/api/cattle'
import { cattleServiceApi } from '@/api/microservices'
import { baseApi, type Base, type Barn } from '@/api/base'
import CascadeSelector from '@/components/common/CascadeSelector.vue'
import CascadeSelector from '@/components/common/CascadeSelector.vue'

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

const formRef = ref<FormInstance>()
const loading = ref(false)
const bases = ref<Base[]>([])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.cattle?.id)

const form = reactive<CreateCattleRequest>({
  ear_tag: '',
  breed: '',
  gender: 'female',
  birth_date: '',
  weight: undefined,
  base_id: 0,
  barn_id: undefined,
  source: 'born',
  purchase_price: undefined,
  purchase_date: '',
  notes: '',
  cascade: {
    baseId: undefined as number | undefined,
    barnId: undefined as number | undefined,
    cattleId: undefined
  }
  notes: '',
  cascade: {
    baseId: undefined as number | undefined,
    barnId: undefined as number | undefined,
    cattleId: undefined
  }
})

const rules: FormRules = {
  ear_tag: [
    { required: true, message: '请输入耳标号', trigger: 'blur' },
    { min: 2, max: 20, message: '耳标号长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  breed: [
    { required: true, message: '请选择品种', trigger: 'change' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  cascade: [
    { required: true, message: '请选择基地和牛棚', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (!value || !value.baseId || !value.barnId) {
          callback(new Error('请选择基地和牛棚'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  cascade: [
    { required: true, message: '请选择基地和牛棚', trigger: 'change' },
    {
      validator: (rule, value, callback) => {
        if (!value || !value.baseId || !value.barnId) {
          callback(new Error('请选择基地和牛棚'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ],
  source: [
    { required: true, message: '请选择来源', trigger: 'change' }
  ]
}

// 加载基地列表
const loadBases = async () => {
  try {
    const response = await baseApi.getBases()
    bases.value = response.data.bases || []
  } catch (error) {
    console.error('加载基地列表失败:', error)
    ElMessage.error('加载基地列表失败')
  }
}

// 处理基地-牛棚级联变更
const handleCascadeChange = () => {
  if (form.cascade && form.cascade.baseId && form.cascade.barnId) {
    form.base_id = form.cascade.baseId
    form.barn_id = form.cascade.barnId
// 处理基地-牛棚级联变更
const handleCascadeChange = () => {
  if (form.cascade && form.cascade.baseId && form.cascade.barnId) {
    form.base_id = form.cascade.baseId
    form.barn_id = form.cascade.barnId
  }
}

// 初始化表单数据
const initForm = () => {
  if (props.cattle) {
    Object.assign(form, {
      ear_tag: props.cattle.ear_tag || '',
      breed: props.cattle.breed || '',
      gender: props.cattle.gender || 'female',
      birth_date: props.cattle.birth_date || '',
      weight: props.cattle.weight,
      base_id: props.cattle.base_id || 0,
      barn_id: props.cattle.barn_id,
      source: props.cattle.source || 'born',
      purchase_price: props.cattle.purchase_price,
      purchase_date: props.cattle.purchase_date || '',
      notes: props.cattle.notes || '',
      cascade: {
        baseId: props.cattle.base_id || undefined,
        barnId: props.cattle.barn_id,
        cattleId: undefined
      }
    })
      notes: props.cattle.notes || '',
      cascade: {
        baseId: props.cattle.base_id || undefined,
        barnId: props.cattle.barn_id,
        cattleId: undefined
      }
    })
  } else {
    // 重置表单
    Object.assign(form, {
      ear_tag: '',
      breed: '',
      gender: 'female',
      birth_date: '',
      weight: undefined,
      base_id: 0,
      barn_id: undefined,
      source: 'born',
      purchase_price: undefined,
      purchase_date: '',
      notes: '',
      cascade: {
        baseId: undefined,
        barnId: undefined,
        cattleId: undefined
      }
    })
      notes: '',
      cascade: {
        baseId: undefined,
        barnId: undefined,
        cattleId: undefined
      }
    })
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    if (isEdit.value && props.cattle) {
      await cattleServiceApi.updateCattle(props.cattle.id, form)
      ElMessage.success('更新成功')
    } else {
      await cattleServiceApi.createCattle(form)
      ElMessage.success('创建成功')
    }
    
    emit('success')
    handleClose()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    loading.value = false
  }
}

// 关闭对话框
const handleClose = () => {
  formRef.value?.resetFields()
  dialogVisible.value = false
}

// 监听对话框显示状态
watch(() => props.modelValue, (visible) => {
  if (visible) {
    initForm()
  }
})

onMounted(() => {
  loadBases()
})
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}

/* 为级联选择器提供足够的空间 */
.cascade-form-item {
  width: 100%;
}

/* 确保表单行和列有足够的宽度 */
.form-row {
  width: 100%;
}

.form-col-full {
  width: 100%;
}
</style>