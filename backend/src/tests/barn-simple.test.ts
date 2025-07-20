import { Barn } from '@/models/Barn';

describe('Barn Model Tests', () => {
  describe('Barn Model Structure', () => {
    it('should have correct model structure', () => {
      // Test that the Barn model is properly defined
      expect(Barn).toBeDefined();
      expect(typeof Barn.init).toBe('function');
      expect(typeof Barn.create).toBe('function');
      expect(typeof Barn.findAll).toBe('function');
      expect(typeof Barn.findByPk).toBe('function');
    });

    it('should have correct table name', () => {
      expect(Barn.tableName).toBe('barns');
    });

    it('should have correct attributes', () => {
      const attributes = Barn.getTableName ? Object.keys(Barn.rawAttributes || {}) : [];
      
      // Check for essential attributes
      const expectedAttributes = [
        'id', 'name', 'code', 'base_id', 'capacity', 
        'current_count', 'barn_type', 'description', 
        'facilities', 'created_at', 'updated_at'
      ];
      
      expectedAttributes.forEach(attr => {
        expect(Barn.rawAttributes).toHaveProperty(attr);
      });
    });
  });

  describe('Barn Model Validation', () => {
    it('should validate barn type enum values', () => {
      const barnTypeField = Barn.rawAttributes.barn_type;
      expect(barnTypeField).toBeDefined();
      
      // Check if validation exists
      if (barnTypeField.validate && barnTypeField.validate.isIn) {
        const validTypes = barnTypeField.validate.isIn[0];
        expect(validTypes).toContain('育肥棚');
        expect(validTypes).toContain('繁殖棚');
        expect(validTypes).toContain('隔离棚');
        expect(validTypes).toContain('治疗棚');
        expect(validTypes).toContain('其他');
      }
    });

    it('should have capacity validation', () => {
      const capacityField = Barn.rawAttributes.capacity;
      expect(capacityField).toBeDefined();
      expect(capacityField.allowNull).toBe(false);
      
      if (capacityField.validate) {
        expect(capacityField.validate.min).toBe(1);
        expect(capacityField.validate.max).toBe(1000);
      }
    });

    it('should have name validation', () => {
      const nameField = Barn.rawAttributes.name;
      expect(nameField).toBeDefined();
      expect(nameField.allowNull).toBe(false);
      
      if (nameField.validate) {
        expect(nameField.validate.len).toEqual([2, 100]);
        expect(nameField.validate.notEmpty).toBe(true);
      }
    });

    it('should have code validation', () => {
      const codeField = Barn.rawAttributes.code;
      expect(codeField).toBeDefined();
      expect(codeField.allowNull).toBe(false);
      
      if (codeField.validate) {
        expect(codeField.validate.len).toEqual([2, 50]);
        expect(codeField.validate.notEmpty).toBe(true);
        expect(codeField.validate.is).toBeDefined();
      }
    });
  });

  describe('Barn Model Methods', () => {
    it('should have toJSON method that calculates virtual fields', () => {
      // Create a mock barn instance
      const mockBarn = {
        id: 1,
        name: '测试牛棚',
        code: 'BARN001',
        base_id: 1,
        capacity: 50,
        current_count: 30,
        barn_type: '育肥棚',
        get: function() {
          return {
            id: this.id,
            name: this.name,
            code: this.code,
            base_id: this.base_id,
            capacity: this.capacity,
            current_count: this.current_count,
            barn_type: this.barn_type,
          };
        }
      };

      // Apply the toJSON method
      const result = Barn.prototype.toJSON.call(mockBarn);
      
      expect(result).toBeDefined();
      expect(result.utilization_rate).toBe(60); // 30/50 * 100
      expect(result.available_capacity).toBe(20); // 50 - 30
    });

    it('should handle zero capacity in toJSON', () => {
      const mockBarn = {
        id: 1,
        name: '测试牛棚',
        capacity: 0,
        current_count: 0,
        get: function() {
          return {
            id: this.id,
            name: this.name,
            capacity: this.capacity,
            current_count: this.current_count,
          };
        }
      };

      const result = Barn.prototype.toJSON.call(mockBarn);
      expect(result.utilization_rate).toBeUndefined();
      expect(result.available_capacity).toBeUndefined();
    });
  });

  describe('Barn Model Indexes', () => {
    it('should have proper indexes defined', () => {
      const options = Barn.options;
      expect(options.indexes).toBeDefined();
      expect(Array.isArray(options.indexes)).toBe(true);
      
      // Check for base_id index
      const baseIdIndex = options.indexes?.find((index: any) => 
        Array.isArray(index.fields) && index.fields.includes('base_id')
      );
      expect(baseIdIndex).toBeDefined();
      
      // Check for unique compound index
      const uniqueIndex = options.indexes?.find((index: any) => 
        index.unique && Array.isArray(index.fields) && 
        index.fields.includes('code') && index.fields.includes('base_id')
      );
      expect(uniqueIndex).toBeDefined();
    });
  });
});