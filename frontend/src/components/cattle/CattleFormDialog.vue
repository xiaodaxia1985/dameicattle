<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑牛只' : '添加牛只'"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      @submit.prevent
    >
      <el-row :gutter="16">
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
            <el-input v-model="form.breed" placeholder="请输入品种" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
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

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="体重(kg)" prop="weight">
            <el-input-number
              v-model="form.weight"
              :min="0"
              :max="2000"
              :precision="2"
              placeholder="请输入体重"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="健康状态" prop="health_status">
            <el-select v-model="form.health_status" placeholder="选择健康状态" style="width: 100%">
              <el-option label="健康" value="healthy" />
              <el-option label="患病" value="sick" />
              <el-option label="治疗中" value="treatment" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="所属基地" prop="base_id">
            <el-select 
              v-model="form.base_id" 
              placeholder="选择基地" 
              style="width: 100%"
              @change="handleBaseChange"
            >
              <el-option
                v-for="base in baseStore.baseList"
                :key="base.id"
                :label="base.name"
                :value="base.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="所属牛棚" prop="barn_id">
            <el-select 
              v-model="form.barn_id" 
              placeholder="选择牛棚" 
              style="width: 100%"
              :disabled="!form.base_id"
              clearable
            >
              <el-option
                v-for="barn in availableBarns"
                :key="barn.id"
                :label="barn.name"
                :value="barn.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="来源" prop="source">
            <el-select v-model="form.source" placeholder="选择来源" style="width: 100%">
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

      <el-row :gutter="16" v-if="form.source === 'purchased'">
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

      <el-row :gutter="16" v-if="form.source === 'born'">
        <el-col :span="12">
          <el-form-item label="父牛" prop="parent_male_id">
            <el-select 
              v-model="form.parent_male_id" 
              placeholder="选择父牛" 
              style="width: 100%"
              clearable
              filterable
            >
              <el-option
                v-for="cattle in maleCattleList"
                :key="cattle.id"
                :label="`${cattle.ear_tag} - ${cattle.breed}`"
                :value="cattle.id"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="母牛" prop="parent_female_id">
            <el-select 
              v-model="form.parent_female_id" 
              placeholder="选择母牛" 
              style="width: 100%"
              clearable
              filterable
            >
              <el-option
                v-for="cattle in femaleCattleList"
                :key="cattle.id"
                :label="`${cattle.ear_tag} - ${cattle.breed}`"
                :value="cattle.id"
              />
            </el-select>
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

      <!-- 照片上传 -->
      <el-form-item label="牛只照片">
        <el-upload
          v-model:file-list="fileList"
          action="#"
          list-type="picture-card"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          accept="image/*"
        >
          <el-icon><Plus /></el-icon>
        </el-upload>
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
import { useCattleStore } from '@/stores/cattle'
import { useBaseStore } from '@/stores/base'
import { useBarnStore } from '@/stores/barn'
import type { Cattle, CreateCattleRequest, UpdateCattleRequest } from '@/api/cattle'

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

const cattleStore = useCattleStore()
const baseStore = useBaseStore()
const barnStore = useBarnStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const fileList = ref<any[]>([])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.cattle)

// 表单数据
const form = reactive<CreateCattleRequest & UpdateCattleRequest>({
  ear_tag: '',
  breed: '',
  gender: 'male',
  birth_date: '',
  weight: undefined,
  health_status: 'healthy',
  base_id: 0,
  barn_id: undefined,
  source: 'purchased',
  purchase_price: undefined,
  purchase_date: '',
  parent_male_id: undefined,
  parent_female_id: undefined,
  notes: '',
  photos: []
})

// 表单验证规则
const rules: FormRules = {
  ear_tag: [
    { required: true, message: '请输入耳标号', trigger: 'blur' },
    { min: 3, max: 50, message: '耳标号长度在 3 到 50 个字符', trigger: 'blur' }
  ],
  breed: [
    { required: true, message: '请输入品种', trigger: 'blur' },
    { min: 2, max: 100, message: '品种长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  base_id: [
    { required: true, message: '请选择基地', trigger: 'change' }
  ]
}

// 可用的牛棚列表
const availableBarns = computed(() => {
  if (!form.base_id) return []
  return barnStore.barnList.filter(barn => barn.base_id === form.base_id)
})

// 公牛列表
const maleCattleList = computed(() => {
  return cattleStore.cattleList.filter(cattle => 
    cattle.gender === 'male' && 
    cattle.status === 'active' &&
    cattle.id !== props.cattle?.id
  )
})

// 母牛列表
const femaleCattleList = computed(() => {
  return cattleStore.cattleList.filter(cattle => 
    cattle.gender === 'female' && 
    cattle.status === 'active' &&
    cattle.id !== props.cattle?.id
  )
})

// 监听对话框打开
watch(dialogVisible, (visible) => {
  if (visible) {
    initForm()
    loadData()
  }
})

const loadData = async () => {
  try {
    await Promise.all([
      baseStore.fetchBaseList(),
      barnStore.fetchBarnList(),
      cattleStore.fetchCattleList({ limit: 1000 }) // 加载所有牛只用于选择父母
    ])
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const initForm = () => {
  if (props.cattle) {
    // 编辑模式，填充现有数据
    Object.assign(form, {
      ear_tag: props.cattle.ear_tag,
      breed: props.cattle.breed,
      gender: props.cattle.gender,
      birth_date: props.cattle.birth_date || '',
      weight: props.cattle.weight,
      health_status: props.cattle.health_status,
      base_id: props.cattle.base_id,
      barn_id: props.cattle.barn_id,
      source: props.cattle.source,
      purchase_price: props.cattle.purchase_price,
      purchase_date: props.cattle.purchase_date || '',
      parent_male_id: props.cattle.parent_male_id,
      parent_female_id: props.cattle.parent_female_id,
      notes: props.cattle.notes || '',
      photos: props.cattle.photos || []
    })
    
    // 设置文件列表
    if (props.cattle.photos && props.cattle.photos.length > 0) {
      fileList.value = props.cattle.photos.map((url, index) => ({
        name: `photo-${index}`,
        url: url
      }))
    }
  } else {
    // 新增模式，重置表单
    Object.assign(form, {
      ear_tag: '',
      breed: '',
      gender: 'male',
      birth_date: '',
      weight: undefined,
      health_status: 'healthy',
      base_id: 0,
      barn_id: undefined,
      source: 'purchased',
      purchase_price: undefined,
      purchase_date: '',
      parent_male_id: undefined,
      parent_female_id: undefined,
      notes: '',
      photos: []
    })
    fileList.value = []
  }
}

const handleBaseChange = () => {
  // 基地改变时清空牛棚选择
  form.barn_id = undefined
}

const handleFileChange = (file: any) => {
  // 这里可以实现文件上传逻辑
  console.log('文件变化:', file)
}

const handleFileRemove = (file: any) => {
  console.log('移除文件:', file)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    if (isEdit.value && props.cattle) {
      // 更新牛只
      const updateData: UpdateCattleRequest = {
        breed: form.breed,
        weight: form.weight,
        health_status: form.health_status,
        barn_id: form.barn_id,
        notes: form.notes,
        photos: form.photos
      }
      await cattleStore.updateCattle(props.cattle.id, updateData)
    } else {
      // 创建牛只
      const createData: CreateCattleRequest = {
        ear_tag: form.ear_tag,
        breed: form.breed,
        gender: form.gender,
        birth_date: form.birth_date || undefined,
        weight: form.weight,
        base_id: form.base_id,
        barn_id: form.barn_id,
        source: form.source,
        purchase_price: form.purchase_price,
        purchase_date: form.purchase_date || undefined,
        parent_male_id: form.parent_male_id,
        parent_female_id: form.parent_female_id,
        notes: form.notes,
        photos: form.photos
      }
      await cattleStore.createCattle(createData)
    }
    
    emit('success')
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败，请检查输入信息')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  formRef.value?.resetFields()
  emit('update:modelValue', false)
}
</script>

<style lang="scss" scoped>
.dialog-footer {
  text-align: right;
}

:deep(.el-upload--picture-card) {
  width: 80px;
  height: 80px;
}

:deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 80px;
  height: 80px;
}
</style>