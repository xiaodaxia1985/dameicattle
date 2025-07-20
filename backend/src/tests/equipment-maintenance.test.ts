import { EquipmentMaintenancePlan, EquipmentMaintenanceRecord, EquipmentFailure } from '../models';

describe('Equipment Maintenance Models', () => {
  describe('EquipmentMaintenancePlan Model', () => {
    it('should have correct table name', () => {
      expect(EquipmentMaintenancePlan.tableName).toBe('equipment_maintenance_plans');
    });

    it('should have required attributes', () => {
      const attributes = Object.keys(EquipmentMaintenancePlan.rawAttributes || {});
      expect(attributes).toContain('id');
      expect(attributes).toContain('equipment_id');
      expect(attributes).toContain('maintenance_type');
      expect(attributes).toContain('frequency_days');
      expect(attributes).toContain('description');
      expect(attributes).toContain('checklist');
      expect(attributes).toContain('is_active');
      expect(attributes).toContain('created_at');
      expect(attributes).toContain('updated_at');
    });

    it('should have correct field constraints', () => {
      const equipmentIdField = EquipmentMaintenancePlan.rawAttributes.equipment_id;
      const maintenanceTypeField = EquipmentMaintenancePlan.rawAttributes.maintenance_type;
      const frequencyDaysField = EquipmentMaintenancePlan.rawAttributes.frequency_days;
      const isActiveField = EquipmentMaintenancePlan.rawAttributes.is_active;
      
      expect(equipmentIdField.allowNull).toBe(false);
      expect(maintenanceTypeField.allowNull).toBe(false);
      expect(frequencyDaysField.allowNull).toBe(false);
      expect(isActiveField.defaultValue).toBe(true);
    });
  });

  describe('EquipmentMaintenanceRecord Model', () => {
    it('should have correct table name', () => {
      expect(EquipmentMaintenanceRecord.tableName).toBe('equipment_maintenance_records');
    });

    it('should have required attributes', () => {
      const attributes = Object.keys(EquipmentMaintenanceRecord.rawAttributes || {});
      expect(attributes).toContain('id');
      expect(attributes).toContain('equipment_id');
      expect(attributes).toContain('plan_id');
      expect(attributes).toContain('maintenance_date');
      expect(attributes).toContain('maintenance_type');
      expect(attributes).toContain('operator_id');
      expect(attributes).toContain('duration_hours');
      expect(attributes).toContain('cost');
      expect(attributes).toContain('status');
      expect(attributes).toContain('created_at');
      expect(attributes).toContain('updated_at');
    });

    it('should have correct status validation', () => {
      const statusField = EquipmentMaintenanceRecord.rawAttributes.status;
      const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
      
      expect(statusField.defaultValue).toBe('completed');
      expect(statusField.validate?.isIn).toEqual([validStatuses]);
    });
  });

  describe('EquipmentFailure Model', () => {
    it('should have correct table name', () => {
      expect(EquipmentFailure.tableName).toBe('equipment_failures');
    });

    it('should have required attributes', () => {
      const attributes = Object.keys(EquipmentFailure.rawAttributes || {});
      expect(attributes).toContain('id');
      expect(attributes).toContain('equipment_id');
      expect(attributes).toContain('failure_date');
      expect(attributes).toContain('reported_by');
      expect(attributes).toContain('failure_type');
      expect(attributes).toContain('severity');
      expect(attributes).toContain('description');
      expect(attributes).toContain('status');
      expect(attributes).toContain('created_at');
      expect(attributes).toContain('updated_at');
    });

    it('should have correct severity and status validation', () => {
      const severityField = EquipmentFailure.rawAttributes.severity;
      const statusField = EquipmentFailure.rawAttributes.status;
      
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      const validStatuses = ['reported', 'in_repair', 'resolved', 'closed'];
      
      expect(severityField.defaultValue).toBe('medium');
      expect(severityField.validate?.isIn).toEqual([validSeverities]);
      expect(statusField.defaultValue).toBe('reported');
      expect(statusField.validate?.isIn).toEqual([validStatuses]);
    });
  });
});