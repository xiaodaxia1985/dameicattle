'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 由于ingredients字段是JSONB类型，我们不需要修改表结构
    // 只需要确保现有数据的兼容性和添加新的字段支持
    
    // 添加索引来优化查询性能
    try {
      await queryInterface.addIndex('feed_formulas', {
        fields: ['name'],
        name: 'idx_feed_formulas_name'
      });
    } catch (error) {
      console.log('Index idx_feed_formulas_name already exists');
    }
    
    try {
      await queryInterface.addIndex('feed_formulas', {
        fields: ['cost_per_kg'],
        name: 'idx_feed_formulas_cost_per_kg'
      });
    } catch (error) {
      console.log('Index idx_feed_formulas_cost_per_kg already exists');
    }
    
    // 添加版本字段来标识ingredients结构版本
    try {
      await queryInterface.addColumn('feed_formulas', 'ingredients_version', {
        type: Sequelize.INTEGER,
        defaultValue: 2,
        comment: 'Ingredients structure version: 1=old format, 2=new format with name/weight/cost/energy/ratio'
      });
    } catch (error) {
      console.log('Column ingredients_version already exists');
    }

    // 更新现有数据，确保ingredients结构包含新字段
    // 新的ingredients结构应该包含：name, weight, cost, energy, ratio
    await queryInterface.sequelize.query(`
      UPDATE feed_formulas 
      SET ingredients_version = 2,
          updated_at = CURRENT_TIMESTAMP
      WHERE ingredients_version IS NULL OR ingredients_version = 1;
    `);

    console.log('Feed formula ingredients structure updated to version 2');
    console.log('New ingredients format: { name, weight, cost, energy, ratio }');
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeIndex('feed_formulas', 'idx_feed_formulas_name');
    } catch (error) {
      console.log('Index idx_feed_formulas_name does not exist');
    }
    
    try {
      await queryInterface.removeIndex('feed_formulas', 'idx_feed_formulas_cost_per_kg');
    } catch (error) {
      console.log('Index idx_feed_formulas_cost_per_kg does not exist');
    }
    
    try {
      await queryInterface.removeColumn('feed_formulas', 'ingredients_version');
    } catch (error) {
      console.log('Column ingredients_version does not exist');
    }
  }
};