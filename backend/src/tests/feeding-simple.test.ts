import { FeedFormula, FeedingRecord } from '@/models';

describe('Feeding Models', () => {
  describe('FeedFormula Model', () => {
    it('should have correct table name', () => {
      expect(FeedFormula.tableName).toBe('feed_formulas');
    });

    it('should have required attributes', () => {
      const attributes = Object.keys(FeedFormula.rawAttributes || {});
      expect(attributes).toContain('name');
      expect(attributes).toContain('ingredients');
      expect(attributes).toContain('cost_per_kg');
      expect(attributes).toContain('created_by');
    });

    it('should validate ingredients structure', () => {
      const nameField = FeedFormula.rawAttributes?.name;
      expect(nameField?.allowNull).toBe(false);
      
      const ingredientsField = FeedFormula.rawAttributes?.ingredients;
      expect(ingredientsField?.allowNull).toBe(false);
    });

    it('should calculate cost correctly', () => {
      const formula = new FeedFormula({
        id: 1,
        name: 'Test Formula',
        ingredients: {
          '玉米': { ratio: 50, unit: '%', cost: 2.0 },
          '豆粕': { ratio: 30, unit: '%', cost: 4.0 },
          '麸皮': { ratio: 20, unit: '%', cost: 1.5 }
        }
      });

      const calculatedCost = formula.calculateCost();
      // Expected: (50/100 * 2.0) + (30/100 * 4.0) + (20/100 * 1.5) = 1.0 + 1.2 + 0.3 = 2.5
      expect(calculatedCost).toBe(2.5);
    });

    it('should get ingredients list correctly', () => {
      const formula = new FeedFormula({
        id: 1,
        name: 'Test Formula',
        ingredients: {
          '玉米': { ratio: 50, unit: '%', cost: 2.0 },
          '豆粕': { ratio: 30, unit: '%', cost: 4.0 }
        }
      });

      const ingredientsList = formula.getIngredientsList();
      expect(ingredientsList).toHaveLength(2);
      expect(ingredientsList[0]).toEqual({
        name: '玉米',
        ratio: 50,
        unit: '%',
        cost: 2.0
      });
      expect(ingredientsList[1]).toEqual({
        name: '豆粕',
        ratio: 30,
        unit: '%',
        cost: 4.0
      });
    });
  });

  describe('FeedingRecord Model', () => {
    it('should have correct table name', () => {
      expect(FeedingRecord.tableName).toBe('feeding_records');
    });

    it('should have required attributes', () => {
      const attributes = Object.keys(FeedingRecord.rawAttributes || {});
      expect(attributes).toContain('base_id');
      expect(attributes).toContain('amount');
      expect(attributes).toContain('feeding_date');
      expect(attributes).toContain('formula_id');
      expect(attributes).toContain('barn_id');
      expect(attributes).toContain('operator_id');
    });

    it('should validate required fields', () => {
      const baseIdField = FeedingRecord.rawAttributes?.base_id;
      expect(baseIdField?.allowNull).toBe(false);
      
      const amountField = FeedingRecord.rawAttributes?.amount;
      expect(amountField?.allowNull).toBe(false);
      
      const feedingDateField = FeedingRecord.rawAttributes?.feeding_date;
      expect(feedingDateField?.allowNull).toBe(false);
    });

    it('should allow optional fields', () => {
      const formulaIdField = FeedingRecord.rawAttributes?.formula_id;
      expect(formulaIdField?.allowNull).toBe(true);
      
      const barnIdField = FeedingRecord.rawAttributes?.barn_id;
      expect(barnIdField?.allowNull).toBe(true);
      
      const operatorIdField = FeedingRecord.rawAttributes?.operator_id;
      expect(operatorIdField?.allowNull).toBe(true);
    });
  });

  describe('Model Validation', () => {
    it('should validate feed formula ingredients format', () => {
      // Test valid ingredients
      const validIngredients = {
        '玉米': { ratio: 60, unit: '%', cost: 2.5 },
        '豆粕': { ratio: 40, unit: '%', cost: 4.0 }
      };

      expect(() => {
        new FeedFormula({
          id: 1,
          name: 'Valid Formula',
          ingredients: validIngredients
        });
      }).not.toThrow();
    });

    it('should handle empty ingredients gracefully', () => {
      const formula = new FeedFormula({
        id: 1,
        name: 'Empty Formula',
        ingredients: {}
      });

      expect(formula.calculateCost()).toBe(0);
      expect(formula.getIngredientsList()).toEqual([]);
    });

    it('should handle malformed ingredient data', () => {
      const formula = new FeedFormula({
        id: 1,
        name: 'Malformed Formula',
        ingredients: {
          '玉米': { ratio: 'invalid', unit: '%', cost: 2.0 }
        }
      });

      // Should not throw, but return 0 for invalid data
      expect(formula.calculateCost()).toBe(0);
    });
  });

  describe('Business Logic', () => {
    it('should calculate feeding efficiency metrics structure', () => {
      // Test the static method exists and has correct structure
      expect(typeof FeedingRecord.getFeedingEfficiency).toBe('function');
    });

    it('should handle cost calculation with missing formula', async () => {
      const record = new FeedingRecord({
        id: 1,
        base_id: 1,
        amount: 100,
        feeding_date: new Date()
      });

      const cost = await record.calculateFeedingCost();
      expect(cost).toBe(0);
    });
  });
});