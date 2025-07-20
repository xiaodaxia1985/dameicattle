import { EquipmentCategory, ProductionEquipment } from '../models';

describe('Equipment Models', () => {
  describe('EquipmentCategory Model', () => {
    it('should have correct table name', () => {
      expect(EquipmentCategory.tableName).toBe('equipment_categories');
    });

    it('should have required attributes', () => {
      const attributes = Object.keys(EquipmentCategory.rawAttributes || {});
      expect(attributes).toContain('id');
      expect(attributes).toContain('name');
      expect(attributes).toContain('code');
      expect(attributes).toContain('description');
      expect(attributes).toContain('created_at');
      expect(attributes).toContain('updated_at');
    });

    it('should have correct field types', () => {
      const nameField = EquipmentCategory.rawAttributes.name;
      const codeField = EquipmentCategory.rawAttributes.code;
      
      expect(nameField.allowNull).toBe(false);
      expect(codeField.allowNull).toBe(false);
      expect(codeField.unique).toBe(true);
    });
  });

  describe('ProductionEquipment Model', () => {
    it('should have correct table name', () => {
      expect(ProductionEquipment.tableName).toBe('production_equipment');
    });

    it('should have required attributes', () => {
      const attributes = Object.keys(ProductionEquipment.rawAttributes || {});
      expect(attributes).toContain('id');
      expect(attributes).toContain('name');
      expect(attributes).toContain('code');
      expect(attributes).toContain('category_id');
      expect(attributes).toContain('base_id');
      expect(attributes).toContain('status');
      expect(attributes).toContain('created_at');
      expect(attributes).toContain('updated_at');
    });

    it('should have correct field types and constraints', () => {
      const nameField = ProductionEquipment.rawAttributes.name;
      const codeField = ProductionEquipment.rawAttributes.code;
      const statusField = ProductionEquipment.rawAttributes.status;
      
      expect(nameField.allowNull).toBe(false);
      expect(codeField.allowNull).toBe(false);
      expect(codeField.unique).toBe(true);
      expect(statusField.defaultValue).toBe('normal');
    });

    it('should have correct status validation', () => {
      const statusField = ProductionEquipment.rawAttributes.status;
      const validStatuses = ['normal', 'maintenance', 'broken', 'retired'];
      
      expect(statusField.validate?.isIn).toEqual([validStatuses]);
    });
  });
});