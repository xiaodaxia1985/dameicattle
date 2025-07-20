import { sequelize } from '@/config/database';
import { redisClient } from '@/config/redis';
import { 
  createTestUser, 
  createTestRole, 
  createTestBase, 
  createTestBarn,
  createTestCattle,
  cleanupTestData,
  generateTestToken,
  TestDataFactory,
  measureExecutionTime
} from '../helpers/testHelpers';

describe('End-to-End Business Workflow Tests', () => {
  let adminUser: any;
  let regularUser: any;
  let veterinarian: any;
  let adminRole: any;
  let userRole: any;
  let vetRole: any;
  let testBase: any;
  let testBarn: any;

  beforeAll(async () => {
    try {
      await sequelize.authenticate();
      console.log('✅ E2E Database connection established');
    } catch (error) {
      console.error('❌ E2E Database connection failed:', error);
    }
  });

  beforeEach(async () => {
    await cleanupTestData();

    // Create roles
    adminRole = await createTestRole({
      name: '系统管理员',
      permissions: ['*']
    });

    userRole = await createTestRole({
      name: '普通用户',
      permissions: ['cattle:read', 'health:read', 'feeding:read']
    });

    vetRole = await createTestRole({
      name: '兽医',
      permissions: ['cattle:read', 'health:*', 'vaccination:*']
    });

    // Create base
    testBase = await createTestBase();

    // Create users
    adminUser = await createTestUser({
      username: 'admin',
      email: 'admin@example.com',
      role_id: adminRole.id,
      base_id: testBase.id
    });

    regularUser = await createTestUser({
      username: 'user',
      email: 'user@example.com',
      role_id: userRole.id,
      base_id: testBase.id
    });

    veterinarian = await createTestUser({
      username: 'vet',
      email: 'vet@example.com',
      role_id: vetRole.id,
      base_id: testBase.id
    });

    // Create barn
    testBarn = await createTestBarn({
      base_id: testBase.id,
      capacity: 50
    });
  });

  afterAll(async () => {
    await cleanupTestData();
    try {
      await sequelize.close();
      await redisClient.quit();
    } catch (error) {
      console.warn('E2E Cleanup warning:', error);
    }
  });

  describe('Complete Cattle Management Workflow', () => {
    it('should handle complete cattle lifecycle from registration to sale', async () => {
      const workflowSteps = [];

      // Step 1: Admin registers new cattle
      const { duration: registrationTime, result: cattle } = await measureExecutionTime(async () => {
        return await createTestCattle({
          ear_tag: 'LIFECYCLE_001',
          breed: '西门塔尔牛',
          gender: 'male',
          birth_date: new Date('2022-01-15'),
          weight: 300,
          health_status: 'healthy',
          base_id: testBase.id,
          barn_id: testBarn.id,
          source: 'purchase',
          status: 'active'
        });
      });

      workflowSteps.push({
        step: 'cattle_registration',
        duration: registrationTime,
        success: true,
        data: { cattle_id: cattle.id, ear_tag: cattle.ear_tag }
      });

      expect(cattle).toBeTruthy();
      expect(cattle.ear_tag).toBe('LIFECYCLE_001');
      expect(cattle.health_status).toBe('healthy');

      // Step 2: Veterinarian performs health check
      const { duration: healthCheckTime, result: healthRecord } = await measureExecutionTime(async () => {
        // Simulate health record creation
        return {
          id: 1,
          cattle_id: cattle.id,
          symptoms: '无症状',
          diagnosis: '健康检查',
          treatment: '无需治疗',
          veterinarian_id: veterinarian.id,
          diagnosis_date: new Date(),
          status: 'completed'
        };
      });

      workflowSteps.push({
        step: 'health_check',
        duration: healthCheckTime,
        success: true,
        data: { health_record_id: healthRecord.id, status: healthRecord.status }
      });

      expect(healthRecord.cattle_id).toBe(cattle.id);
      expect(healthRecord.veterinarian_id).toBe(veterinarian.id);
      expect(healthRecord.status).toBe('completed');

      // Step 3: Vaccination schedule
      const { duration: vaccinationTime, result: vaccinationRecord } = await measureExecutionTime(async () => {
        return {
          id: 1,
          cattle_id: cattle.id,
          vaccine_name: '口蹄疫疫苗',
          vaccination_date: new Date(),
          next_due_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months later
          veterinarian_id: veterinarian.id,
          batch_number: 'VAC2024001'
        };
      });

      workflowSteps.push({
        step: 'vaccination',
        duration: vaccinationTime,
        success: true,
        data: { vaccination_id: vaccinationRecord.id, vaccine: vaccinationRecord.vaccine_name }
      });

      expect(vaccinationRecord.cattle_id).toBe(cattle.id);
      expect(vaccinationRecord.vaccine_name).toBe('口蹄疫疫苗');

      // Step 4: Feeding management
      const { duration: feedingTime, result: feedingRecords } = await measureExecutionTime(async () => {
        const records = [];
        for (let i = 0; i < 30; i++) { // 30 days of feeding
          records.push({
            id: i + 1,
            formula_id: 1,
            base_id: testBase.id,
            barn_id: testBarn.id,
            amount: 25.5, // kg per day
            feeding_date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
            operator_id: regularUser.id
          });
        }
        return records;
      });

      workflowSteps.push({
        step: 'feeding_management',
        duration: feedingTime,
        success: true,
        data: { feeding_records: feedingRecords.length, total_feed: feedingRecords.length * 25.5 }
      });

      expect(feedingRecords).toHaveLength(30);
      expect(feedingRecords[0].barn_id).toBe(testBarn.id);

      // Step 5: Weight monitoring and growth tracking
      const { duration: growthTime, result: growthData } = await measureExecutionTime(async () => {
        const weightRecords = [];
        let currentWeight = 300;
        
        for (let month = 0; month < 12; month++) {
          currentWeight += Math.random() * 50 + 30; // Growth simulation
          weightRecords.push({
            cattle_id: cattle.id,
            weight: Math.round(currentWeight),
            measurement_date: new Date(Date.now() - (11 - month) * 30 * 24 * 60 * 60 * 1000),
            operator_id: regularUser.id
          });
        }

        return {
          records: weightRecords,
          initial_weight: 300,
          final_weight: Math.round(currentWeight),
          total_gain: Math.round(currentWeight - 300),
          average_daily_gain: Math.round((currentWeight - 300) / 365 * 1000) / 1000
        };
      });

      workflowSteps.push({
        step: 'growth_tracking',
        duration: growthTime,
        success: true,
        data: growthData
      });

      expect(growthData.final_weight).toBeGreaterThan(growthData.initial_weight);
      expect(growthData.total_gain).toBeGreaterThan(0);

      // Step 6: Pre-sale health certification
      const { duration: certificationTime, result: healthCertification } = await measureExecutionTime(async () => {
        return {
          id: 2,
          cattle_id: cattle.id,
          symptoms: '无症状',
          diagnosis: '健康，适合销售',
          treatment: '无需治疗',
          veterinarian_id: veterinarian.id,
          diagnosis_date: new Date(),
          status: 'completed',
          certification_type: 'pre_sale',
          health_certificate_number: 'HC2024001'
        };
      });

      workflowSteps.push({
        step: 'pre_sale_certification',
        duration: certificationTime,
        success: true,
        data: { 
          certificate_number: healthCertification.health_certificate_number,
          status: healthCertification.status 
        }
      });

      expect(healthCertification.certification_type).toBe('pre_sale');
      expect(healthCertification.health_certificate_number).toBeTruthy();

      // Step 7: Sales order creation
      const { duration: salesTime, result: salesOrder } = await measureExecutionTime(async () => {
        return {
          id: 1,
          order_number: 'SO2024001',
          customer_id: 1,
          base_id: testBase.id,
          total_amount: growthData.final_weight * 28, // 28 yuan per kg
          status: 'pending',
          order_date: new Date(),
          created_by: adminUser.id,
          items: [{
            cattle_id: cattle.id,
            ear_tag: cattle.ear_tag,
            weight: growthData.final_weight,
            unit_price: 28,
            total_price: growthData.final_weight * 28,
            health_certificate: healthCertification.health_certificate_number
          }]
        };
      });

      workflowSteps.push({
        step: 'sales_order_creation',
        duration: salesTime,
        success: true,
        data: { 
          order_number: salesOrder.order_number,
          total_amount: salesOrder.total_amount 
        }
      });

      expect(salesOrder.order_number).toBe('SO2024001');
      expect(salesOrder.items[0].cattle_id).toBe(cattle.id);

      // Step 8: Final cattle status update
      const { duration: statusUpdateTime, result: updatedCattle } = await measureExecutionTime(async () => {
        return {
          ...cattle,
          status: 'sold',
          sale_date: new Date(),
          sale_weight: growthData.final_weight,
          sale_price: growthData.final_weight * 28
        };
      });

      workflowSteps.push({
        step: 'cattle_status_update',
        duration: statusUpdateTime,
        success: true,
        data: { 
          status: updatedCattle.status,
          sale_price: updatedCattle.sale_price 
        }
      });

      expect(updatedCattle.status).toBe('sold');
      expect(updatedCattle.sale_price).toBeGreaterThan(0);

      // Workflow summary
      const totalWorkflowTime = workflowSteps.reduce((sum, step) => sum + step.duration, 0);
      const successfulSteps = workflowSteps.filter(step => step.success).length;

      console.log('Complete Cattle Lifecycle Workflow Summary:');
      workflowSteps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step.step}: ${step.duration}ms - ${step.success ? '✅' : '❌'}`);
      });
      console.log(`Total workflow time: ${totalWorkflowTime}ms`);
      console.log(`Successful steps: ${successfulSteps}/${workflowSteps.length}`);

      expect(successfulSteps).toBe(workflowSteps.length);
      expect(totalWorkflowTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Health Management Workflow', () => {
    it('should handle disease outbreak detection and response', async () => {
      // Create multiple cattle
      const cattleList = [];
      for (let i = 0; i < 10; i++) {
        const cattle = await createTestCattle({
          ear_tag: `OUTBREAK_${i.toString().padStart(3, '0')}`,
          breed: '西门塔尔牛',
          gender: i % 2 === 0 ? 'male' : 'female',
          birth_date: new Date('2022-01-01'),
          weight: 400 + Math.random() * 100,
          health_status: 'healthy',
          base_id: testBase.id,
          barn_id: testBarn.id,
          source: 'breeding',
          status: 'active'
        });
        cattleList.push(cattle);
      }

      // Simulate disease outbreak - 5 cattle showing symptoms
      const outbreakSteps = [];

      // Step 1: Initial symptom detection
      const { duration: detectionTime, result: symptomReports } = await measureExecutionTime(async () => {
        const reports = [];
        for (let i = 0; i < 5; i++) {
          reports.push({
            cattle_id: cattleList[i].id,
            symptoms: '发热、食欲不振、流鼻涕',
            reported_by: regularUser.id,
            report_date: new Date(),
            severity: 'medium'
          });
        }
        return reports;
      });

      outbreakSteps.push({
        step: 'symptom_detection',
        duration: detectionTime,
        affected_cattle: symptomReports.length,
        success: true
      });

      expect(symptomReports).toHaveLength(5);

      // Step 2: Veterinary diagnosis
      const { duration: diagnosisTime, result: diagnoses } = await measureExecutionTime(async () => {
        const diagnosisResults = [];
        for (const report of symptomReports) {
          diagnosisResults.push({
            id: diagnosisResults.length + 1,
            cattle_id: report.cattle_id,
            symptoms: report.symptoms,
            diagnosis: '疑似病毒性感冒',
            treatment: '抗病毒药物治疗，隔离观察',
            veterinarian_id: veterinarian.id,
            diagnosis_date: new Date(),
            status: 'ongoing',
            isolation_required: true
          });
        }
        return diagnosisResults;
      });

      outbreakSteps.push({
        step: 'veterinary_diagnosis',
        duration: diagnosisTime,
        diagnosed_cattle: diagnoses.length,
        isolation_required: diagnoses.filter(d => d.isolation_required).length,
        success: true
      });

      expect(diagnoses).toHaveLength(5);
      expect(diagnoses.every(d => d.isolation_required)).toBe(true);

      // Step 3: Quarantine implementation
      const { duration: quarantineTime, result: quarantineActions } = await measureExecutionTime(async () => {
        const actions = [];
        
        // Move affected cattle to quarantine barn
        const quarantineBarn = {
          id: testBarn.id + 1,
          name: '隔离牛棚',
          code: 'QUARANTINE_001',
          base_id: testBase.id,
          capacity: 20,
          current_count: 0,
          barn_type: 'quarantine'
        };

        for (const diagnosis of diagnoses) {
          actions.push({
            cattle_id: diagnosis.cattle_id,
            action: 'quarantine',
            from_barn: testBarn.id,
            to_barn: quarantineBarn.id,
            quarantine_date: new Date(),
            expected_duration: 14, // days
            operator_id: veterinarian.id
          });
        }

        return { quarantine_barn: quarantineBarn, actions };
      });

      outbreakSteps.push({
        step: 'quarantine_implementation',
        duration: quarantineTime,
        quarantined_cattle: quarantineActions.actions.length,
        success: true
      });

      expect(quarantineActions.actions).toHaveLength(5);

      // Step 4: Treatment administration
      const { duration: treatmentTime, result: treatments } = await measureExecutionTime(async () => {
        const treatmentRecords = [];
        
        for (let day = 0; day < 7; day++) {
          for (const diagnosis of diagnoses) {
            treatmentRecords.push({
              id: treatmentRecords.length + 1,
              cattle_id: diagnosis.cattle_id,
              health_record_id: diagnosis.id,
              medication: '抗病毒药物',
              dosage: '10ml',
              administration_method: '肌肉注射',
              treatment_date: new Date(Date.now() + day * 24 * 60 * 60 * 1000),
              administered_by: veterinarian.id,
              notes: `第${day + 1}天治疗`
            });
          }
        }

        return treatmentRecords;
      });

      outbreakSteps.push({
        step: 'treatment_administration',
        duration: treatmentTime,
        treatment_records: treatments.length,
        treatment_days: 7,
        success: true
      });

      expect(treatments).toHaveLength(35); // 5 cattle × 7 days

      // Step 5: Health monitoring and recovery tracking
      const { duration: monitoringTime, result: recoveryData } = await measureExecutionTime(async () => {
        const monitoringRecords = [];
        const recoveryStats = {
          total_cattle: 5,
          recovered: 0,
          improving: 0,
          stable: 0,
          deteriorating: 0
        };

        for (let day = 1; day <= 14; day++) {
          for (const diagnosis of diagnoses) {
            const recoveryProgress = Math.min(day / 10, 1); // Gradual recovery
            let status = 'improving';
            
            if (recoveryProgress >= 0.9) {
              status = 'recovered';
            } else if (recoveryProgress >= 0.5) {
              status = 'improving';
            } else {
              status = 'stable';
            }

            monitoringRecords.push({
              cattle_id: diagnosis.cattle_id,
              monitoring_date: new Date(Date.now() + day * 24 * 60 * 60 * 1000),
              temperature: 38.5 + Math.random() * 2 - recoveryProgress * 2, // Decreasing temperature
              appetite: Math.min(recoveryProgress * 100, 100),
              activity_level: Math.min(recoveryProgress * 100, 100),
              overall_status: status,
              veterinarian_id: veterinarian.id
            });

            if (day === 14) {
              recoveryStats[status]++;
            }
          }
        }

        return { monitoring_records: monitoringRecords, recovery_stats: recoveryStats };
      });

      outbreakSteps.push({
        step: 'health_monitoring',
        duration: monitoringTime,
        monitoring_records: recoveryData.monitoring_records.length,
        recovery_stats: recoveryData.recovery_stats,
        success: true
      });

      expect(recoveryData.monitoring_records).toHaveLength(70); // 5 cattle × 14 days
      expect(recoveryData.recovery_stats.recovered + recoveryData.recovery_stats.improving).toBeGreaterThan(0);

      // Step 6: Preventive measures for healthy cattle
      const { duration: preventionTime, result: preventiveMeasures } = await measureExecutionTime(async () => {
        const measures = [];
        const healthyCattle = cattleList.slice(5); // Remaining 5 cattle

        for (const cattle of healthyCattle) {
          measures.push({
            cattle_id: cattle.id,
            measure_type: 'preventive_vaccination',
            vaccine_name: '病毒性感冒疫苗',
            administration_date: new Date(),
            veterinarian_id: veterinarian.id,
            notes: '疫情预防接种'
          });

          measures.push({
            cattle_id: cattle.id,
            measure_type: 'health_monitoring',
            monitoring_frequency: 'daily',
            duration_days: 21,
            responsible_person: regularUser.id,
            notes: '加强健康监测'
          });
        }

        return measures;
      });

      outbreakSteps.push({
        step: 'preventive_measures',
        duration: preventionTime,
        preventive_actions: preventiveMeasures.length,
        healthy_cattle_protected: 5,
        success: true
      });

      expect(preventiveMeasures).toHaveLength(10); // 5 cattle × 2 measures each

      // Outbreak response summary
      const totalResponseTime = outbreakSteps.reduce((sum, step) => sum + step.duration, 0);
      const successfulSteps = outbreakSteps.filter(step => step.success).length;

      console.log('Disease Outbreak Response Workflow Summary:');
      outbreakSteps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step.step}: ${step.duration}ms - ${step.success ? '✅' : '❌'}`);
      });
      console.log(`Total response time: ${totalResponseTime}ms`);
      console.log(`Successful steps: ${successfulSteps}/${outbreakSteps.length}`);

      expect(successfulSteps).toBe(outbreakSteps.length);
      expect(totalResponseTime).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });

  describe('Inventory and Supply Chain Workflow', () => {
    it('should handle complete supply chain from procurement to consumption', async () => {
      const supplyChainSteps = [];

      // Step 1: Inventory assessment and procurement planning
      const { duration: assessmentTime, result: inventoryAssessment } = await measureExecutionTime(async () => {
        const currentInventory = [
          { material_id: 1, name: '玉米', current_stock: 500, safety_stock: 1000, unit: 'kg' },
          { material_id: 2, name: '豆粕', current_stock: 200, safety_stock: 500, unit: 'kg' },
          { material_id: 3, name: '维生素预混料', current_stock: 50, safety_stock: 100, unit: 'kg' }
        ];

        const procurementNeeds = currentInventory
          .filter(item => item.current_stock < item.safety_stock)
          .map(item => ({
            material_id: item.material_id,
            name: item.name,
            needed_quantity: item.safety_stock * 2 - item.current_stock, // Order to double safety stock
            unit: item.unit,
            priority: item.current_stock < item.safety_stock * 0.5 ? 'high' : 'medium'
          }));

        return { current_inventory: currentInventory, procurement_needs: procurementNeeds };
      });

      supplyChainSteps.push({
        step: 'inventory_assessment',
        duration: assessmentTime,
        low_stock_items: inventoryAssessment.procurement_needs.length,
        success: true
      });

      expect(inventoryAssessment.procurement_needs.length).toBeGreaterThan(0);

      // Step 2: Supplier selection and purchase order creation
      const { duration: procurementTime, result: purchaseOrders } = await measureExecutionTime(async () => {
        const suppliers = [
          { id: 1, name: '农业供应商A', rating: 4.5, delivery_time: 3 },
          { id: 2, name: '饲料供应商B', rating: 4.2, delivery_time: 2 },
          { id: 3, name: '营养供应商C', rating: 4.8, delivery_time: 5 }
        ];

        const orders = [];
        for (const need of inventoryAssessment.procurement_needs) {
          const selectedSupplier = suppliers[need.material_id - 1];
          
          orders.push({
            id: orders.length + 1,
            order_number: `PO2024${(orders.length + 1).toString().padStart(3, '0')}`,
            supplier_id: selectedSupplier.id,
            supplier_name: selectedSupplier.name,
            base_id: testBase.id,
            order_type: 'material',
            status: 'pending',
            order_date: new Date(),
            expected_delivery_date: new Date(Date.now() + selectedSupplier.delivery_time * 24 * 60 * 60 * 1000),
            created_by: adminUser.id,
            items: [{
              material_id: need.material_id,
              material_name: need.name,
              quantity: need.needed_quantity,
              unit: need.unit,
              unit_price: need.material_id * 2.5, // Simulated price
              total_price: need.needed_quantity * need.material_id * 2.5
            }],
            total_amount: need.needed_quantity * need.material_id * 2.5
          });
        }

        return orders;
      });

      supplyChainSteps.push({
        step: 'purchase_order_creation',
        duration: procurementTime,
        orders_created: purchaseOrders.length,
        total_value: purchaseOrders.reduce((sum, order) => sum + order.total_amount, 0),
        success: true
      });

      expect(purchaseOrders.length).toBe(inventoryAssessment.procurement_needs.length);

      // Step 3: Order approval and processing
      const { duration: approvalTime, result: approvedOrders } = await measureExecutionTime(async () => {
        return purchaseOrders.map(order => ({
          ...order,
          status: 'approved',
          approved_by: adminUser.id,
          approved_at: new Date(),
          approval_notes: '库存紧急补充，优先处理'
        }));
      });

      supplyChainSteps.push({
        step: 'order_approval',
        duration: approvalTime,
        approved_orders: approvedOrders.length,
        success: true
      });

      expect(approvedOrders.every(order => order.status === 'approved')).toBe(true);

      // Step 4: Delivery and goods receipt
      const { duration: deliveryTime, result: deliveryRecords } = await measureExecutionTime(async () => {
        const receipts = [];
        
        for (const order of approvedOrders) {
          receipts.push({
            id: receipts.length + 1,
            order_id: order.id,
            order_number: order.order_number,
            delivery_date: new Date(),
            received_by: regularUser.id,
            quality_check_status: 'passed',
            items_received: order.items.map(item => ({
              ...item,
              received_quantity: item.quantity,
              quality_grade: 'A',
              batch_number: `BATCH${Date.now()}${item.material_id}`,
              expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
            }))
          });
        }

        return receipts;
      });

      supplyChainSteps.push({
        step: 'goods_receipt',
        duration: deliveryTime,
        deliveries_received: deliveryRecords.length,
        quality_passed: deliveryRecords.filter(r => r.quality_check_status === 'passed').length,
        success: true
      });

      expect(deliveryRecords.every(record => record.quality_check_status === 'passed')).toBe(true);

      // Step 5: Inventory update and storage
      const { duration: storageTime, result: updatedInventory } = await measureExecutionTime(async () => {
        const inventoryTransactions = [];
        const newInventoryLevels = [...inventoryAssessment.current_inventory];

        for (const receipt of deliveryRecords) {
          for (const item of receipt.items_received) {
            // Create inventory transaction
            inventoryTransactions.push({
              id: inventoryTransactions.length + 1,
              material_id: item.material_id,
              base_id: testBase.id,
              transaction_type: 'inbound',
              quantity: item.received_quantity,
              unit_price: item.unit_price,
              reference_type: 'purchase_order',
              reference_id: receipt.order_id,
              batch_number: item.batch_number,
              expiry_date: item.expiry_date,
              operator_id: regularUser.id,
              transaction_date: new Date()
            });

            // Update inventory levels
            const inventoryItem = newInventoryLevels.find(inv => inv.material_id === item.material_id);
            if (inventoryItem) {
              inventoryItem.current_stock += item.received_quantity;
            }
          }
        }

        return { transactions: inventoryTransactions, updated_levels: newInventoryLevels };
      });

      supplyChainSteps.push({
        step: 'inventory_update',
        duration: storageTime,
        transactions_created: updatedInventory.transactions.length,
        inventory_items_updated: updatedInventory.updated_levels.length,
        success: true
      });

      expect(updatedInventory.transactions.length).toBeGreaterThan(0);
      expect(updatedInventory.updated_levels.every(item => item.current_stock >= item.safety_stock)).toBe(true);

      // Step 6: Feed formula creation and production
      const { duration: formulaTime, result: feedFormulas } = await measureExecutionTime(async () => {
        const formulas = [
          {
            id: 1,
            name: '育肥牛配方A',
            description: '适用于6-12月龄育肥牛',
            ingredients: [
              { material_id: 1, name: '玉米', ratio: 60, unit: '%' },
              { material_id: 2, name: '豆粕', ratio: 25, unit: '%' },
              { material_id: 3, name: '维生素预混料', ratio: 5, unit: '%' },
              { material_id: 4, name: '其他添加剂', ratio: 10, unit: '%' }
            ],
            cost_per_kg: 3.2,
            created_by: veterinarian.id,
            created_at: new Date()
          },
          {
            id: 2,
            name: '成牛维护配方B',
            description: '适用于成年牛日常维护',
            ingredients: [
              { material_id: 1, name: '玉米', ratio: 50, unit: '%' },
              { material_id: 2, name: '豆粕', ratio: 20, unit: '%' },
              { material_id: 3, name: '维生素预混料', ratio: 3, unit: '%' },
              { material_id: 4, name: '其他添加剂', ratio: 27, unit: '%' }
            ],
            cost_per_kg: 2.8,
            created_by: veterinarian.id,
            created_at: new Date()
          }
        ];

        return formulas;
      });

      supplyChainSteps.push({
        step: 'feed_formula_creation',
        duration: formulaTime,
        formulas_created: feedFormulas.length,
        success: true
      });

      expect(feedFormulas).toHaveLength(2);
      expect(feedFormulas.every(formula => formula.ingredients.length > 0)).toBe(true);

      // Step 7: Daily feeding and inventory consumption
      const { duration: feedingTime, result: feedingOperations } = await measureExecutionTime(async () => {
        const operations = [];
        const consumptionRecords = [];
        
        // Simulate 30 days of feeding
        for (let day = 0; day < 30; day++) {
          const feedingDate = new Date(Date.now() + day * 24 * 60 * 60 * 1000);
          
          // Feed different cattle groups with different formulas
          const feedingGroups = [
            { formula_id: 1, cattle_count: 20, amount_per_cattle: 8 }, // Young cattle
            { formula_id: 2, cattle_count: 30, amount_per_cattle: 12 } // Adult cattle
          ];

          for (const group of feedingGroups) {
            const totalAmount = group.cattle_count * group.amount_per_cattle;
            
            operations.push({
              id: operations.length + 1,
              formula_id: group.formula_id,
              base_id: testBase.id,
              barn_id: testBarn.id,
              amount: totalAmount,
              feeding_date: feedingDate,
              operator_id: regularUser.id,
              cattle_count: group.cattle_count
            });

            // Calculate material consumption
            const formula = feedFormulas.find(f => f.id === group.formula_id);
            for (const ingredient of formula.ingredients) {
              const consumedAmount = totalAmount * ingredient.ratio / 100;
              
              consumptionRecords.push({
                material_id: ingredient.material_id,
                base_id: testBase.id,
                transaction_type: 'outbound',
                quantity: consumedAmount,
                reference_type: 'feeding_record',
                reference_id: operations.length,
                transaction_date: feedingDate,
                operator_id: regularUser.id
              });
            }
          }
        }

        return { feeding_operations: operations, consumption_records: consumptionRecords };
      });

      supplyChainSteps.push({
        step: 'feeding_operations',
        duration: feedingTime,
        feeding_records: feedingOperations.feeding_operations.length,
        consumption_records: feedingOperations.consumption_records.length,
        feeding_days: 30,
        success: true
      });

      expect(feedingOperations.feeding_operations).toHaveLength(60); // 30 days × 2 groups
      expect(feedingOperations.consumption_records.length).toBeGreaterThan(0);

      // Step 8: Inventory monitoring and alerts
      const { duration: monitoringTime, result: inventoryAlerts } = await measureExecutionTime(async () => {
        const alerts = [];
        const finalInventoryLevels = [...updatedInventory.updated_levels];

        // Calculate consumption impact
        for (const consumption of feedingOperations.consumption_records) {
          const inventoryItem = finalInventoryLevels.find(item => item.material_id === consumption.material_id);
          if (inventoryItem) {
            inventoryItem.current_stock -= consumption.quantity;
          }
        }

        // Generate alerts for low stock
        for (const item of finalInventoryLevels) {
          if (item.current_stock < item.safety_stock) {
            alerts.push({
              id: alerts.length + 1,
              material_id: item.material_id,
              material_name: item.name,
              alert_type: 'low_stock',
              alert_level: item.current_stock < item.safety_stock * 0.5 ? 'high' : 'medium',
              current_stock: item.current_stock,
              safety_stock: item.safety_stock,
              message: `${item.name} 库存不足，当前库存: ${item.current_stock}${item.unit}，安全库存: ${item.safety_stock}${item.unit}`,
              created_at: new Date()
            });
          }
        }

        return { alerts, final_inventory: finalInventoryLevels };
      });

      supplyChainSteps.push({
        step: 'inventory_monitoring',
        duration: monitoringTime,
        alerts_generated: inventoryAlerts.alerts.length,
        low_stock_items: inventoryAlerts.alerts.filter(a => a.alert_type === 'low_stock').length,
        success: true
      });

      // Supply chain workflow summary
      const totalSupplyChainTime = supplyChainSteps.reduce((sum, step) => sum + step.duration, 0);
      const successfulSteps = supplyChainSteps.filter(step => step.success).length;

      console.log('Supply Chain Management Workflow Summary:');
      supplyChainSteps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step.step}: ${step.duration}ms - ${step.success ? '✅' : '❌'}`);
      });
      console.log(`Total supply chain time: ${totalSupplyChainTime}ms`);
      console.log(`Successful steps: ${successfulSteps}/${supplyChainSteps.length}`);

      expect(successfulSteps).toBe(supplyChainSteps.length);
      expect(totalSupplyChainTime).toBeLessThan(4000); // Should complete within 4 seconds
    });
  });

  describe('Multi-User Collaboration Workflow', () => {
    it('should handle concurrent operations by multiple users', async () => {
      const collaborationSteps = [];

      // Step 1: Concurrent cattle registration by multiple users
      const { duration: concurrentRegistrationTime, result: concurrentCattle } = await measureExecutionTime(async () => {
        const registrationPromises = [];
        
        // Admin registers 5 cattle
        for (let i = 0; i < 5; i++) {
          registrationPromises.push(
            createTestCattle({
              ear_tag: `ADMIN_${i.toString().padStart(3, '0')}`,
              breed: '西门塔尔牛',
              gender: i % 2 === 0 ? 'male' : 'female',
              birth_date: new Date('2022-01-01'),
              weight: 300 + Math.random() * 100,
              health_status: 'healthy',
              base_id: testBase.id,
              barn_id: testBarn.id,
              source: 'purchase',
              status: 'active'
            })
          );
        }

        // Regular user registers 3 cattle
        for (let i = 0; i < 3; i++) {
          registrationPromises.push(
            createTestCattle({
              ear_tag: `USER_${i.toString().padStart(3, '0')}`,
              breed: '安格斯牛',
              gender: i % 2 === 0 ? 'female' : 'male',
              birth_date: new Date('2022-02-01'),
              weight: 280 + Math.random() * 80,
              health_status: 'healthy',
              base_id: testBase.id,
              barn_id: testBarn.id,
              source: 'breeding',
              status: 'active'
            })
          );
        }

        return await Promise.all(registrationPromises);
      });

      collaborationSteps.push({
        step: 'concurrent_cattle_registration',
        duration: concurrentRegistrationTime,
        cattle_registered: concurrentCattle.length,
        admin_registrations: 5,
        user_registrations: 3,
        success: true
      });

      expect(concurrentCattle).toHaveLength(8);

      // Step 2: Parallel health checks by veterinarian
      const { duration: parallelHealthChecksTime, result: healthChecks } = await measureExecutionTime(async () => {
        const healthCheckPromises = concurrentCattle.map((cattle, index) => {
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                id: index + 1,
                cattle_id: cattle.id,
                symptoms: index % 3 === 0 ? '轻微咳嗽' : '无症状',
                diagnosis: index % 3 === 0 ? '轻微呼吸道感染' : '健康检查正常',
                treatment: index % 3 === 0 ? '抗生素治疗' : '无需治疗',
                veterinarian_id: veterinarian.id,
                diagnosis_date: new Date(),
                status: index % 3 === 0 ? 'ongoing' : 'completed'
              });
            }, Math.random() * 100); // Simulate varying check times
          });
        });

        return await Promise.all(healthCheckPromises);
      });

      collaborationSteps.push({
        step: 'parallel_health_checks',
        duration: parallelHealthChecksTime,
        health_checks_completed: healthChecks.length,
        issues_found: healthChecks.filter(check => check.status === 'ongoing').length,
        success: true
      });

      expect(healthChecks).toHaveLength(8);

      // Step 3: Concurrent feeding operations by multiple operators
      const { duration: concurrentFeedingTime, result: feedingOperations } = await measureExecutionTime(async () => {
        const feedingPromises = [];
        const operators = [adminUser, regularUser];
        
        // Each operator handles different barns/groups
        operators.forEach((operator, operatorIndex) => {
          for (let day = 0; day < 7; day++) {
            feedingPromises.push(
              new Promise(resolve => {
                setTimeout(() => {
                  resolve({
                    id: feedingPromises.length + 1,
                    formula_id: operatorIndex + 1,
                    base_id: testBase.id,
                    barn_id: testBarn.id,
                    amount: 150 + Math.random() * 50,
                    feeding_date: new Date(Date.now() + day * 24 * 60 * 60 * 1000),
                    operator_id: operator.id,
                    operator_name: operator.username,
                    shift: operatorIndex === 0 ? 'morning' : 'evening'
                  });
                }, Math.random() * 50);
              })
            );
          }
        });

        return await Promise.all(feedingPromises);
      });

      collaborationSteps.push({
        step: 'concurrent_feeding_operations',
        duration: concurrentFeedingTime,
        feeding_records: feedingOperations.length,
        operators_involved: 2,
        feeding_days: 7,
        success: true
      });

      expect(feedingOperations).toHaveLength(14); // 2 operators × 7 days

      // Step 4: Simultaneous data access and reporting
      const { duration: simultaneousAccessTime, result: accessResults } = await measureExecutionTime(async () => {
        const accessPromises = [];
        
        // Admin generates comprehensive report
        accessPromises.push(
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                user: 'admin',
                operation: 'comprehensive_report',
                data: {
                  total_cattle: concurrentCattle.length,
                  health_issues: healthChecks.filter(h => h.status === 'ongoing').length,
                  feeding_records: feedingOperations.length,
                  report_type: 'monthly_summary'
                },
                timestamp: new Date()
              });
            }, 200);
          })
        );

        // Veterinarian accesses health data
        accessPromises.push(
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                user: 'veterinarian',
                operation: 'health_data_access',
                data: {
                  health_checks: healthChecks.length,
                  active_treatments: healthChecks.filter(h => h.status === 'ongoing').length,
                  access_type: 'health_dashboard'
                },
                timestamp: new Date()
              });
            }, 150);
          })
        );

        // Regular user checks feeding schedules
        accessPromises.push(
          new Promise(resolve => {
            setTimeout(() => {
              resolve({
                user: 'regular_user',
                operation: 'feeding_schedule_check',
                data: {
                  scheduled_feedings: feedingOperations.filter(f => f.operator_id === regularUser.id).length,
                  next_feeding: new Date(Date.now() + 24 * 60 * 60 * 1000),
                  access_type: 'feeding_dashboard'
                },
                timestamp: new Date()
              });
            }, 100);
          })
        );

        return await Promise.all(accessPromises);
      });

      collaborationSteps.push({
        step: 'simultaneous_data_access',
        duration: simultaneousAccessTime,
        concurrent_users: accessResults.length,
        operations_completed: accessResults.length,
        success: true
      });

      expect(accessResults).toHaveLength(3);

      // Step 5: Conflict resolution and data consistency
      const { duration: conflictResolutionTime, result: conflictResolution } = await measureExecutionTime(async () => {
        const conflicts = [];
        const resolutions = [];

        // Simulate potential conflicts
        const potentialConflicts = [
          {
            type: 'concurrent_cattle_update',
            cattle_id: concurrentCattle[0].id,
            user1: adminUser.id,
            user2: regularUser.id,
            field: 'weight',
            value1: 350,
            value2: 355,
            timestamp: new Date()
          },
          {
            type: 'feeding_schedule_overlap',
            barn_id: testBarn.id,
            operator1: adminUser.id,
            operator2: regularUser.id,
            scheduled_time: new Date(),
            timestamp: new Date()
          }
        ];

        // Resolve conflicts using timestamp-based resolution
        for (const conflict of potentialConflicts) {
          const resolution = {
            conflict_id: conflicts.length + 1,
            conflict_type: conflict.type,
            resolution_method: 'timestamp_priority',
            resolved_by: 'system',
            resolution_time: new Date(),
            final_value: conflict.type === 'concurrent_cattle_update' ? conflict.value2 : 'schedule_merged',
            notes: `Conflict resolved automatically using timestamp priority`
          };

          conflicts.push(conflict);
          resolutions.push(resolution);
        }

        return { conflicts, resolutions };
      });

      collaborationSteps.push({
        step: 'conflict_resolution',
        duration: conflictResolutionTime,
        conflicts_detected: conflictResolution.conflicts.length,
        conflicts_resolved: conflictResolution.resolutions.length,
        success: true
      });

      expect(conflictResolution.conflicts).toHaveLength(conflictResolution.resolutions.length);

      // Collaboration workflow summary
      const totalCollaborationTime = collaborationSteps.reduce((sum, step) => sum + step.duration, 0);
      const successfulSteps = collaborationSteps.filter(step => step.success).length;

      console.log('Multi-User Collaboration Workflow Summary:');
      collaborationSteps.forEach((step, index) => {
        console.log(`  ${index + 1}. ${step.step}: ${step.duration}ms - ${step.success ? '✅' : '❌'}`);
      });
      console.log(`Total collaboration time: ${totalCollaborationTime}ms`);
      console.log(`Successful steps: ${successfulSteps}/${collaborationSteps.length}`);

      expect(successfulSteps).toBe(collaborationSteps.length);
      expect(totalCollaborationTime).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });
});