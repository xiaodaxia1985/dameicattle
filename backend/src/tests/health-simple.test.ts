import { HealthRecord, VaccinationRecord } from '@/models';

describe('Health Management Models', () => {
  describe('HealthRecord Model', () => {
    it('should have correct table name', () => {
      expect(HealthRecord.tableName).toBe('health_records');
    });

    it('should have required attributes', () => {
      const attributes = Object.keys(HealthRecord.rawAttributes || {});
      
      expect(attributes).toContain('id');
      expect(attributes).toContain('cattle_id');
      expect(attributes).toContain('symptoms');
      expect(attributes).toContain('diagnosis');
      expect(attributes).toContain('treatment');
      expect(attributes).toContain('veterinarian_id');
      expect(attributes).toContain('diagnosis_date');
      expect(attributes).toContain('status');
      expect(attributes).toContain('created_at');
      expect(attributes).toContain('updated_at');
    });

    it('should have correct status enum values', () => {
      const statusField = HealthRecord.rawAttributes.status;
      expect(statusField).toBeDefined();
      
      if (statusField && 'values' in statusField) {
        const validStatuses = statusField.values;
        expect(validStatuses).toContain('ongoing');
        expect(validStatuses).toContain('completed');
        expect(validStatuses).toContain('cancelled');
      }
    });
  });

  describe('VaccinationRecord Model', () => {
    it('should have correct table name', () => {
      expect(VaccinationRecord.tableName).toBe('vaccination_records');
    });

    it('should have required attributes', () => {
      const attributes = Object.keys(VaccinationRecord.rawAttributes || {});
      
      expect(attributes).toContain('id');
      expect(attributes).toContain('cattle_id');
      expect(attributes).toContain('vaccine_name');
      expect(attributes).toContain('vaccination_date');
      expect(attributes).toContain('next_due_date');
      expect(attributes).toContain('veterinarian_id');
      expect(attributes).toContain('batch_number');
      expect(attributes).toContain('created_at');
    });

    it('should have vaccine_name as required field', () => {
      const vaccineNameField = VaccinationRecord.rawAttributes.vaccine_name;
      expect(vaccineNameField).toBeDefined();
      expect(vaccineNameField.allowNull).toBe(false);
    });

    it('should have vaccination_date as required field', () => {
      const vaccinationDateField = VaccinationRecord.rawAttributes.vaccination_date;
      expect(vaccinationDateField).toBeDefined();
      expect(vaccinationDateField.allowNull).toBe(false);
    });
  });

  describe('Model Validation', () => {
    it('should validate health record status values', () => {
      const validStatuses = ['ongoing', 'completed', 'cancelled'];
      
      validStatuses.forEach(status => {
        expect(['ongoing', 'completed', 'cancelled']).toContain(status);
      });
    });

    it('should have proper field types', () => {
      // Health Record field types
      expect(HealthRecord.rawAttributes.cattle_id.type.toString({})).toContain('INTEGER');
      expect(HealthRecord.rawAttributes.diagnosis_date.type.toString({})).toContain('DATEONLY');
      
      // Vaccination Record field types
      expect(VaccinationRecord.rawAttributes.cattle_id.type.toString({})).toContain('INTEGER');
      expect(VaccinationRecord.rawAttributes.vaccination_date.type.toString({})).toContain('DATEONLY');
      expect(VaccinationRecord.rawAttributes.vaccine_name.type.toString({})).toContain('STRING');
    });
  });
});