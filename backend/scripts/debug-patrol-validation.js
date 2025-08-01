const { validationResult } = require('express-validator');
const { updatePatrolRecordValidator } = require('../src/validators/patrol');

// 模拟一个更新请求的数据
const mockUpdateData = {
  base_id: 1,
  barn_id: 2,
  patrol_date: '2025-08-02',
  patrol_time: '20:19',
  patrol_type: 'before_feeding',
  total_cattle_count: 80,
  standing_cattle_count: 7,
  lying_cattle_count: 73,
  abnormal_cattle_count: 0,
  abnormal_cattle_description: '',
  feed_trough_clean: true,
  feed_trough_notes: '',
  water_trough_clean: true,
  water_trough_notes: '',
  temperature: null,
  humidity: null,
  environment_notes: '',
  iot_device_id: null,
  iot_data_source: 'manual',
  overall_notes: '',
  images: []
};

// 模拟Express请求对象
const mockReq = {
  params: { id: '1' },
  body: mockUpdateData
};

const mockRes = {};
const mockNext = () => {};

console.log('🧪 测试巡圈记录更新验证...');
console.log('📝 测试数据:', JSON.stringify(mockUpdateData, null, 2));

// 运行验证器
async function runValidation() {
  try {
    // 依次运行所有验证器
    for (const validator of updatePatrolRecordValidator) {
      await validator(mockReq, mockRes, mockNext);
    }
    
    // 检查验证结果
    const errors = validationResult(mockReq);
    
    if (errors.isEmpty()) {
      console.log('✅ 验证通过！');
    } else {
      console.log('❌ 验证失败，错误详情:');
      errors.array().forEach(error => {
        console.log(`  - ${error.param}: ${error.msg}`);
      });
    }
  } catch (error) {
    console.error('❌ 验证过程出错:', error.message);
  }
}

runValidation();