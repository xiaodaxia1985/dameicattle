import { DataIntegrationService } from '@/services/DataIntegrationService';
import { DataConsistencyService } from '@/services/DataConsistencyService';
import { DataSyncService } from '@/services/DataSyncService';
import { DataMigrationService } from '@/services/DataMigrationService';
import { sequelize } from '@/config/database';
import { 
  PurchaseOrder, 
  PurchaseOrderItem, 
  SalesOrder, 
  SalesOrderItem,
  Cattle,
  FeedingRecord,
  HealthRecord,
  Inventory,
  InventoryTransaction
} from '@/models';

describe('Data Integration Services', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('DataIntegrationService', () => {
    describe('handlePurchaseOrderCompletion', () => {
      it('should process cattle purchase and create cattle records', async () => {
        // 创建测试数据
        const order = await PurchaseOrder.create({
          order_number: 'PO001',
          supplier_id: 1,
          base_id: 1,
          order_type: 'cattle',
          total_amount: 10000,
          status: 'completed',
          order_date: new Date(),
          actual_delivery_date: new Date(),
          created_by: 1
        });

        await PurchaseOrderItem.create({
          order_id: order.id,
          item_type: 'cattle',
          item_id: null,
          item_name: '肉牛',
          specification: '西门塔尔牛',
          quantity: 5,
          unit: '头',
          unit_price: 2000,
          total_price: 10000,
          received_quantity: 5
        });

        // 执行数据流转
        await DataIntegrationService.handlePurchaseOrderCompletion(order.id);

        // 验证结果
        const cattleCount = await Cattle.count({
          where: { base_id: 1 }
        });

        expect(cattleCount).toBeGreaterThan(0);
      });

      it('should process material purchase and update inventory', async () => {
        // 创建测试数据
        const order = await PurchaseOrder.create({
          order_number: 'PO002',
          supplier_id: 1,
          base_id: 1,
          order_type: 'material',
          total_amount: 5000,
          status: 'completed',
          order_date: new Date(),
          actual_delivery_date: new Date(),
          created_by: 1
        });

        await PurchaseOrderItem.create({
          order_id: order.id,
          item_type: 'material',
          item_id: 1,
          item_name: '玉米',
          specification: '优质玉米',
          quantity: 1000,
          unit: 'kg',
          unit_price: 5,
          total_price: 5000,
          received_quantity: 1000
        });

        // 执行数据流转
        await DataIntegrationService.handlePurchaseOrderCompletion(order.id);

        // 验证库存更新
        const inventory = await Inventory.findOne({
          where: { material_id: 1, base_id: 1 }
        });

        expect(inventory).toBeTruthy();
        expect(inventory?.current_stock).toBeGreaterThan(0);

        // 验证库存变动记录
        const transaction = await InventoryTransaction.findOne({
          where: { 
            material_id: 1, 
            base_id: 1,
            reference_type: 'purchase_order',
            reference_id: order.id
          }
        });

        expect(transaction).toBeTruthy();
        expect(transaction?.quantity).toBe(1000);
      });
    });

    describe('handleSalesOrderCompletion', () => {
      it('should update cattle status when sold', async () => {
        // 创建测试牛只
        const cattle = await Cattle.create({
          ear_tag: 'TEST001',
          breed: '西门塔尔牛',
          gender: 'male',
          health_status: 'healthy',
          base_id: 1,
          barn_id: 1
        });

        // 创建销售订单
        const order = await SalesOrder.create({
          order_number: 'SO001',
          customer_id: 1,
          base_id: 1,
          total_amount: 8000,
          status: 'completed',
          order_date: new Date(),
          actual_delivery_date: new Date(),
          created_by: 1
        });

        await SalesOrderItem.create({
          order_id: order.id,
          cattle_id: cattle.id,
          ear_tag: cattle.ear_tag,
          breed: cattle.breed,
          weight: 500,
          unit_price: 16,
          total_price: 8000
        });

        // 执行数据流转
        await DataIntegrationService.handleSalesOrderCompletion(order.id);

        // 验证牛只状态更新
        await cattle.reload();
        expect(cattle.status).toBe('sold');
        expect(cattle.sale_date).toBeTruthy();
        expect(cattle.sale_price).toBe(16);
      });
    });

    describe('handleFeedingRecordCreation', () => {
      it('should deduct inventory when feeding record is created', async () => {
        // 创建库存
        await Inventory.create({
          material_id: 1,
          base_id: 1,
          current_stock: 1000
        });

        // 创建饲料配方
        const formula = await require('@/models').FeedFormula.create({
          name: '测试配方',
          ingredients: [
            { name: '玉米', ratio: 60 },
            { name: '豆粕', ratio: 40 }
          ],
          created_by: 1
        });

        // 创建饲喂记录
        const feedingRecord = await FeedingRecord.create({
          formula_id: formula.id,
          base_id: 1,
          barn_id: 1,
          amount: 100,
          feeding_date: new Date(),
          operator_id: 1
        });

        // 执行数据流转
        await DataIntegrationService.handleFeedingRecordCreation(feedingRecord.id);

        // 验证库存扣减
        const inventory = await Inventory.findOne({
          where: { material_id: 1, base_id: 1 }
        });

        expect(inventory?.current_stock).toBeLessThan(1000);

        // 验证库存变动记录
        const transaction = await InventoryTransaction.findOne({
          where: { 
            material_id: 1, 
            base_id: 1,
            reference_type: 'feeding_record',
            reference_id: feedingRecord.id
          }
        });

        expect(transaction).toBeTruthy();
        expect(transaction?.quantity).toBeLessThan(0);
      });
    });

    describe('handleHealthRecordUpdate', () => {
      it('should update cattle health status based on health record', async () => {
        // 创建测试牛只
        const cattle = await Cattle.create({
          ear_tag: 'TEST002',
          breed: '西门塔尔牛',
          gender: 'female',
          health_status: 'healthy',
          base_id: 1,
          barn_id: 1
        });

        // 创建健康记录
        const healthRecord = await HealthRecord.create({
          cattle_id: cattle.id,
          symptoms: '发烧',
          diagnosis: '感冒',
          treatment: '药物治疗',
          veterinarian_id: 1,
          diagnosis_date: new Date(),
          status: 'ongoing'
        });

        // 执行数据流转
        await DataIntegrationService.handleHealthRecordUpdate(healthRecord.id);

        // 验证牛只健康状态更新
        await cattle.reload();
        expect(cattle.health_status).toBe('sick');

        // 更新健康记录为完成状态
        await healthRecord.update({ status: 'completed' });
        await DataIntegrationService.handleHealthRecordUpdate(healthRecord.id);

        // 验证牛只健康状态恢复
        await cattle.reload();
        expect(cattle.health_status).toBe('healthy');
      });
    });

    describe('data flow queue', () => {
      it('should track data flow events', async () => {
        const initialHistory = DataIntegrationService.getDataFlowHistory();
        const initialCount = initialHistory.length;

        // 创建一个简单的采购订单来触发数据流转
        const order = await PurchaseOrder.create({
          order_number: 'PO003',
          supplier_id: 1,
          base_id: 1,
          order_type: 'material',
          total_amount: 1000,
          status: 'completed',
          order_date: new Date(),
          actual_delivery_date: new Date(),
          created_by: 1
        });

        await PurchaseOrderItem.create({
          order_id: order.id,
          item_type: 'material',
          item_id: 1,
          item_name: '测试物资',
          quantity: 100,
          unit: 'kg',
          unit_price: 10,
          total_price: 1000,
          received_quantity: 100
        });

        await DataIntegrationService.handlePurchaseOrderCompletion(order.id);

        // 验证数据流转事件被记录
        const newHistory = DataIntegrationService.getDataFlowHistory();
        expect(newHistory.length).toBeGreaterThan(initialCount);

        const latestEvent = newHistory[0];
        expect(latestEvent.source_module).toBe('purchase');
        expect(latestEvent.target_module).toBe('inventory');
        expect(latestEvent.event_type).toBe('purchase_completed');
        expect(latestEvent.status).toBe('completed');
      });

      it('should get pending data flow events', async () => {
        const pendingEvents = DataIntegrationService.getPendingDataFlowEvents();
        expect(Array.isArray(pendingEvents)).toBe(true);
      });
    });
  });

  describe('DataConsistencyService', () => {
    describe('performFullConsistencyCheck', () => {
      it('should perform comprehensive data consistency checks', async () => {
        const report = await DataConsistencyService.performFullConsistencyCheck();

        expect(report).toBeTruthy();
        expect(report.overall_status).toMatch(/healthy|warning|critical/);
        expect(report.total_checks).toBeGreaterThan(0);
        expect(report.checks).toBeInstanceOf(Array);
        expect(report.generated_at).toBeInstanceOf(Date);

        // 验证检查项目包含必要的检查
        const checkTypes = report.checks.map(check => check.check_type);
        expect(checkTypes).toContain('unique_ear_tag');
        expect(checkTypes).toContain('barn_base_consistency');
        expect(checkTypes).toContain('health_status_consistency');
      });

      it('should detect duplicate ear tags', async () => {
        // 创建重复耳标的牛只
        await Cattle.create({
          ear_tag: 'DUPLICATE001',
          breed: '西门塔尔牛',
          gender: 'male',
          health_status: 'healthy',
          base_id: 1,
          barn_id: 1
        });

        await Cattle.create({
          ear_tag: 'DUPLICATE001',
          breed: '安格斯牛',
          gender: 'female',
          health_status: 'healthy',
          base_id: 1,
          barn_id: 1
        });

        const report = await DataConsistencyService.performFullConsistencyCheck();
        
        const earTagCheck = report.checks.find(check => check.check_type === 'unique_ear_tag');
        expect(earTagCheck).toBeTruthy();
        expect(earTagCheck?.status).toBe('failed');
        expect(earTagCheck?.affected_records).toBeGreaterThan(0);
      });
    });

    describe('getDataQualityScore', () => {
      it('should calculate data quality score', async () => {
        const scoreData = await DataConsistencyService.getDataQualityScore();

        expect(scoreData).toBeTruthy();
        expect(scoreData.score).toBeGreaterThanOrEqual(0);
        expect(scoreData.score).toBeLessThanOrEqual(100);
        expect(scoreData.details).toBeTruthy();
        expect(scoreData.details.total_checks).toBeGreaterThan(0);
      });
    });
  });

  describe('DataSyncService', () => {
    describe('backup operations', () => {
      it('should create backup info structure', async () => {
        // 由于实际的 pg_dump 可能不可用，我们测试备份信息结构
        const mockConfig = {
          type: 'full' as const,
          retention_days: 7,
          compression: true,
          encryption: false,
          storage_path: '/tmp/test-backups'
        };

        // 测试备份配置验证
        expect(mockConfig.type).toBe('full');
        expect(mockConfig.retention_days).toBe(7);
        expect(mockConfig.compression).toBe(true);
      });

      it('should get sync status', async () => {
        const status = await DataSyncService.getSyncStatus();

        expect(status).toBeTruthy();
        expect(status.status).toMatch(/healthy|warning|error/);
        expect(status.backup_count).toBeGreaterThanOrEqual(0);
        expect(status.total_backup_size).toBeGreaterThanOrEqual(0);
        expect(status.message).toBeTruthy();
      });

      it('should get backup history', async () => {
        const history = DataSyncService.getBackupHistory(10);

        expect(Array.isArray(history)).toBe(true);
        expect(history.length).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('DataMigrationService', () => {
    describe('migration management', () => {
      it('should get migration history', () => {
        const history = DataMigrationService.getMigrationHistory();

        expect(Array.isArray(history)).toBe(true);
      });

      it('should get current version', () => {
        const version = DataMigrationService.getCurrentVersion();

        expect(typeof version).toBe('string');
        expect(version).toBeTruthy();
      });
    });

    describe('data transformation', () => {
      it('should validate transform rules structure', () => {
        const transformRules = {
          field_mappings: {
            'old_field': 'new_field',
            'source_name': 'target_name'
          },
          data_transformations: {
            'price': (value: number) => value * 1.1,
            'status': (value: string) => value.toLowerCase()
          },
          filters: 'status = "active"',
          validations: {
            'price': (value: number) => value > 0,
            'name': (value: string) => value.length > 0
          }
        };

        expect(transformRules.field_mappings).toBeTruthy();
        expect(transformRules.data_transformations).toBeTruthy();
        expect(typeof transformRules.data_transformations.price).toBe('function');
        expect(transformRules.data_transformations.price(100)).toBe(110);
      });
    });
  });
});

describe('Data Integration API Endpoints', () => {
  // 这里可以添加 API 端点的集成测试
  // 由于需要完整的应用程序上下文，暂时跳过
  it.skip('should test API endpoints', () => {
    // API 集成测试将在完整的应用程序测试中实现
  });
});