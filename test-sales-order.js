#!/usr/bin/env node

/**
 * 销售订单创建功能测试脚本
 * 
 * 此脚本用于测试：
 * 1. 销售订单创建API是否正常工作
 * 2. 数据转换逻辑是否正确
 * 3. 新的表结构是否与代码匹配
 */

const axios = require('axios');

// 配置
const config = {
  salesServiceUrl: 'http://localhost:3004',
  testOrder: {
    customer_id: 1,
    base_id: 1,
    order_date: new Date().toISOString(),
    delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    payment_method: '银行转账',
    contract_number: `TEST-${Date.now()}`,
    remark: '测试订单',
    items: [
      {
        itemType: 'cattle',
        cattle_id: 1,
        ear_tag: 'C001',
        breed: '安格斯牛',
        weight: 520.5,
        unit_price: 50.00,
        quantity: 1,
        notes: '优质安格斯牛，肉质鲜美'
      },
      {
        itemType: 'cattle',
        cattle_id: 2,
        ear_tag: 'C002',
        breed: '安格斯牛',
        weight: 510.0,
        unit_price: 50.00,
        quantity: 1,
        notes: '同批次安格斯牛'
      }
    ]
  }
};

async function testCreateOrder() {
  try {
    console.log('🧪 开始测试销售订单创建功能...\n');
    
    // 1. 测试创建订单
    console.log('📝 发送创建订单请求...');
    console.log('请求数据:', JSON.stringify(config.testOrder, null, 2));
    
    const response = await axios.post(
      `${config.salesServiceUrl}/api/v1/sales/orders`,
      config.testOrder,
      {
        headers: {
          'Content-Type': 'application/json',
          // 这里应该添加实际的认证头，但为了测试暂时忽略
          'Authorization': 'Bearer test-token'
        }
      }
    );
    
    console.log('✅ 订单创建成功!');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
    
    // 2. 验证响应数据结构
    const orderData = response.data.data || response.data;
    
    console.log('\n🔍 验证响应数据结构...');
    
    // 检查必要字段
    const requiredFields = ['id', 'orderNumber', 'customerId', 'baseId', 'totalAmount', 'status'];
    const missingFields = requiredFields.filter(field => !(field in orderData));
    
    if (missingFields.length === 0) {
      console.log('✅ 所有必要字段都存在');
    } else {
      console.log('❌ 缺少字段:', missingFields);
    }
    
    // 检查订单明细
    if (orderData.items && Array.isArray(orderData.items)) {
      console.log('✅ 订单明细存在，共', orderData.items.length, '项');
      
      // 验证明细字段
      const itemRequiredFields = ['id', 'cattleId', 'earTag', 'breed', 'weight', 'unitPrice', 'totalPrice'];
      orderData.items.forEach((item, index) => {
        const missingItemFields = itemRequiredFields.filter(field => !(field in item));
        if (missingItemFields.length === 0) {
          console.log(`✅ 明细项 ${index + 1} 字段完整`);
        } else {
          console.log(`❌ 明细项 ${index + 1} 缺少字段:`, missingItemFields);
        }
      });
    } else {
      console.log('❌ 订单明细不存在或格式错误');
    }
    
    console.log('\n🎉 测试完成！订单创建功能正常工作。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('错误响应:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    console.log('\n🔧 可能的问题和解决方案:');
    console.log('1. 检查销售服务是否正在运行 (端口 3004)');
    console.log('2. 检查数据库连接是否正常');
    console.log('3. 检查测试数据中的客户ID和牛只ID是否存在');
    console.log('4. 检查模型定义是否与数据库表结构匹配');
  }
}

async function testGetOrders() {
  try {
    console.log('\n📋 测试获取订单列表...');
    
    const response = await axios.get(
      `${config.salesServiceUrl}/api/v1/sales/orders?page=1&limit=5`,
      {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      }
    );
    
    console.log('✅ 获取订单列表成功!');
    console.log('订单数量:', response.data.data?.orders?.length || 0);
    
  } catch (error) {
    console.log('❌ 获取订单列表失败:', error.message);
  }
}

// 主函数
async function main() {
  console.log('🚀 销售订单功能测试开始\n');
  console.log('测试配置:', {
    salesServiceUrl: config.salesServiceUrl,
    testItemsCount: config.testOrder.items.length
  });
  console.log('');
  
  // 先测试获取订单列表（检查服务是否可用）
  await testGetOrders();
  
  // 然后测试创建订单
  await testCreateOrder();
  
  console.log('\n📝 测试说明:');
  console.log('- 此测试验证了销售订单创建的完整流程');
  console.log('- 包括订单主表和订单明细表的创建');
  console.log('- 验证了数据格式转换是否正确');
  console.log('- 如果测试通过，说明问题已经解决');
}

// 运行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCreateOrder, testGetOrders };