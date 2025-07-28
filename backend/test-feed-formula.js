const { FeedFormula } = require('./src/models');

async function testFeedFormula() {
  try {
    console.log('Testing Feed Formula with new ingredients structure...');
    
    // 测试数据 - 新的成分结构
    const testIngredients = [
      {
        name: '玉米',
        weight: 50.0,
        cost: 2.5,
        energy: 13.2,
        ratio: 50.0
      },
      {
        name: '豆粕',
        weight: 30.0,
        cost: 4.2,
        energy: 12.8,
        ratio: 30.0
      },
      {
        name: '麦麸',
        weight: 20.0,
        cost: 1.8,
        energy: 11.5,
        ratio: 20.0
      }
    ];
    
    // 创建测试配方
    const formula = await FeedFormula.create({
      name: '测试配方-新结构',
      description: '这是一个测试配方，使用新的成分结构',
      ingredients: testIngredients,
      ingredients_version: 2
    });
    
    console.log('✅ 配方创建成功:', {
      id: formula.id,
      name: formula.name,
      ingredients_count: formula.ingredients.length,
      calculated_cost: formula.calculateCost(),
      calculated_energy: formula.calculateTotalEnergy()
    });
    
    // 测试获取格式化成分
    const formattedIngredients = formula.getFormattedIngredients();
    console.log('✅ 格式化成分:', formattedIngredients);
    
    // 清理测试数据
    await formula.destroy();
    console.log('✅ 测试数据已清理');
    
    console.log('🎉 所有测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error('  - 验证错误:', err.message);
      });
    }
  }
}

testFeedFormula().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('测试执行失败:', error);
  process.exit(1);
});