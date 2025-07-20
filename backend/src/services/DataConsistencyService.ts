import { Op, QueryTypes } from 'sequelize';
import { sequelize } from '@/config/database';
import { 
  Cattle, 
  HealthRecord, 
  VaccinationRecord, 
  FeedingRecord, 
  Inventory,
  InventoryTransaction,
  PurchaseOrder,
  PurchaseOrderItem,
  SalesOrder,
  SalesOrderItem,
  ProductionMaterial,
  Base,
  Barn
} from '@/models';
import { logger } from '@/utils/logger';

export interface DataConsistencyCheck {
  module: string;
  table: string;
  check_type: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  affected_records?: number;
  details?: any;
  checked_at: Date;
}

export interface DataConsistencyReport {
  overall_status: 'healthy' | 'warning' | 'critical';
  total_checks: number;
  passed_checks: number;
  warning_checks: number;
  failed_checks: number;
  checks: DataConsistencyCheck[];
  generated_at: Date;
}

export class DataConsistencyService {
  /**
   * 执行完整的数据一致性检查
   */
  static async performFullConsistencyCheck(): Promise<DataConsistencyReport> {
    const checks: DataConsistencyCheck[] = [];
    
    try {
      // 执行各种一致性检查
      const checkResults = await Promise.all([
        this.checkCattleDataConsistency(),
        this.checkHealthRecordConsistency(),
        this.checkInventoryConsistency(),
        this.checkOrderConsistency(),
        this.checkReferentialIntegrity(),
        this.checkBusinessRuleConsistency()
      ]);

      // 合并所有检查结果
      checkResults.forEach(result => {
        checks.push(...result);
      });

      // 计算统计信息
      const passedChecks = checks.filter(c => c.status === 'passed').length;
      const warningChecks = checks.filter(c => c.status === 'warning').length;
      const failedChecks = checks.filter(c => c.status === 'failed').length;

      // 确定整体状态
      let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (failedChecks > 0) {
        overallStatus = 'critical';
      } else if (warningChecks > 0) {
        overallStatus = 'warning';
      }

      const report: DataConsistencyReport = {
        overall_status: overallStatus,
        total_checks: checks.length,
        passed_checks: passedChecks,
        warning_checks: warningChecks,
        failed_checks: failedChecks,
        checks: checks.sort((a, b) => {
          const statusOrder = { 'failed': 0, 'warning': 1, 'passed': 2 };
          return statusOrder[a.status] - statusOrder[b.status];
        }),
        generated_at: new Date()
      };

      logger.info('数据一致性检查完成', {
        totalChecks: report.total_checks,
        overallStatus: report.overall_status,
        failedChecks: report.failed_checks,
        warningChecks: report.warning_checks
      });

      return report;
    } catch (error) {
      logger.error('数据一致性检查失败:', error);
      throw error;
    }
  }

  /**
   * 检查牛只数据一致性
   */
  private static async checkCattleDataConsistency(): Promise<DataConsistencyCheck[]> {
    const checks: DataConsistencyCheck[] = [];

    try {
      // 检查牛只耳标唯一性
      const duplicateEarTags = await sequelize.query(`
        SELECT ear_tag, COUNT(*) as count
        FROM cattle
        WHERE ear_tag IS NOT NULL
        GROUP BY ear_tag
        HAVING COUNT(*) > 1
      `, { type: QueryTypes.SELECT }) as any[];

      checks.push({
        module: 'cattle',
        table: 'cattle',
        check_type: 'unique_ear_tag',
        status: duplicateEarTags.length === 0 ? 'passed' : 'failed',
        message: duplicateEarTags.length === 0 
          ? '牛只耳标唯一性检查通过' 
          : `发现 ${duplicateEarTags.length} 个重复的耳标`,
        affected_records: duplicateEarTags.length,
        details: duplicateEarTags,
        checked_at: new Date()
      });

      // 检查牛只基地和牛棚关联一致性
      const inconsistentBarnBase = await sequelize.query(`
        SELECT c.id, c.ear_tag, c.base_id as cattle_base_id, b.base_id as barn_base_id
        FROM cattle c
        JOIN barns b ON c.barn_id = b.id
        WHERE c.base_id != b.base_id
      `, { type: QueryTypes.SELECT }) as any[];

      checks.push({
        module: 'cattle',
        table: 'cattle',
        check_type: 'barn_base_consistency',
        status: inconsistentBarnBase.length === 0 ? 'passed' : 'failed',
        message: inconsistentBarnBase.length === 0 
          ? '牛只基地和牛棚关联一致性检查通过' 
          : `发现 ${inconsistentBarnBase.length} 头牛只的基地和牛棚不匹配`,
        affected_records: inconsistentBarnBase.length,
        details: inconsistentBarnBase,
        checked_at: new Date()
      });

      // 检查牛只健康状态与健康记录一致性
      const healthStatusInconsistency = await sequelize.query(`
        SELECT c.id, c.ear_tag, c.health_status, 
               COUNT(hr.id) as ongoing_health_records
        FROM cattle c
        LEFT JOIN health_records hr ON c.id = hr.cattle_id AND hr.status = 'ongoing'
        GROUP BY c.id, c.ear_tag, c.health_status
        HAVING (c.health_status = 'sick' AND COUNT(hr.id) = 0) 
            OR (c.health_status = 'healthy' AND COUNT(hr.id) > 0)
      `, { type: QueryTypes.SELECT }) as any[];

      checks.push({
        module: 'cattle',
        table: 'cattle',
        check_type: 'health_status_consistency',
        status: healthStatusInconsistency.length === 0 ? 'passed' : 'warning',
        message: healthStatusInconsistency.length === 0 
          ? '牛只健康状态与健康记录一致性检查通过' 
          : `发现 ${healthStatusInconsistency.length} 头牛只的健康状态与健康记录不一致`,
        affected_records: healthStatusInconsistency.length,
        details: healthStatusInconsistency,
        checked_at: new Date()
      });

      // 检查牛棚容量与实际牛只数量
      const barnCapacityCheck = await sequelize.query(`
        SELECT b.id, b.name, b.capacity, b.current_count, 
               COUNT(c.id) as actual_count
        FROM barns b
        LEFT JOIN cattle c ON b.id = c.barn_id
        GROUP BY b.id, b.name, b.capacity, b.current_count
        HAVING b.current_count != COUNT(c.id) OR COUNT(c.id) > b.capacity
      `, { type: QueryTypes.SELECT }) as any[];

      checks.push({
        module: 'cattle',
        table: 'barns',
        check_type: 'barn_capacity_consistency',
        status: barnCapacityCheck.length === 0 ? 'passed' : 'warning',
        message: barnCapacityCheck.length === 0 
          ? '牛棚容量与实际牛只数量一致性检查通过' 
          : `发现 ${barnCapacityCheck.length} 个牛棚的容量记录与实际不符`,
        affected_records: barnCapacityCheck.length,
        details: barnCapacityCheck,
        checked_at: new Date()
      });

    } catch (error) {
      logger.error('牛只数据一致性检查失败:', error);
      checks.push({
        module: 'cattle',
        table: 'cattle',
        check_type: 'general_check',
        status: 'failed',
        message: `牛只数据一致性检查失败: ${error instanceof Error ? error.message : String(error)}`,
        checked_at: new Date()
      });
    }

    return checks;
  }

  /**
   * 检查健康记录一致性
   */
  private static async checkHealthRecordConsistency(): Promise<DataConsistencyCheck[]> {
    const checks: DataConsistencyCheck[] = [];

    try {
      // 检查健康记录是否有对应的牛只
      const orphanedHealthRecords = await sequelize.query(`
        SELECT hr.id, hr.cattle_id
        FROM health_records hr
        LEFT JOIN cattle c ON hr.cattle_id = c.id
        WHERE c.id IS NULL
      `, { type: QueryTypes.SELECT }) as any[];

      checks.push({
        module: 'health',
        table: 'health_records',
        check_type: 'orphaned_records',
        status: orphanedHealthRecords.length === 0 ? 'passed' : 'failed',
        message: orphanedHealthRecords.length === 0 
          ? '健康记录关联牛只检查通过' 
          : `发现 ${orphanedHealthRecords.length} 条健康记录没有对应的牛只`,
        affected_records: orphanedHealthRecords.length,
        details: orphanedHealthRecords,
        checked_at: new Date()
      });

      // 检查疫苗记录是否有对应的牛只
      const orphanedVaccineRecords = await sequelize.query(`
        SELECT vr.id, vr.cattle_id
        FROM vaccination_records vr
        LEFT JOIN cattle c ON vr.cattle_id = c.id
        WHERE c.id IS NULL
      `, { type: QueryTypes.SELECT }) as any[];

      checks.push({
        module: 'health',
        table: 'vaccination_records',
        check_type: 'orphaned_records',
        status: orphanedVaccineRecords.length === 0 ? 'passed' : 'failed',
        message: orphanedVaccineRecords.length === 0 
          ? '疫苗记录关联牛只检查通过' 
          : `发现 ${orphanedVaccineRecords.length} 条疫苗记录没有对应的牛只`,
        affected_records: orphanedVaccineRecords.length,
        details: orphanedVaccineRecords,
        checked_at: new Date()
      });

      // 检查过期的疫苗记录
      const overdueVaccines = await sequelize.query(`
        SELECT vr.id, vr.cattle_id, c.ear_tag, vr.vaccine_name, vr.next_due_date
        FROM vaccination_records vr
        JOIN cattle c ON vr.cattle_id = c.id
        WHERE vr.next_due_date < CURRENT_DATE
      `, { type: QueryTypes.SELECT }) as any[];

      checks.push({
        module: 'health',
        table: 'vaccination_records',
        check_type: 'overdue_vaccines',
        status: overdueVaccines.length === 0 ? 'passed' : 'warning',
        message: overdueVaccines.length === 0 
          ? '疫苗到期检查通过' 
          : `发现 ${overdueVaccines.length} 条过期的疫苗记录`,
        affected_records: overdueVaccines.length,
        details: overdueVaccines,
        checked_at: new Date()
      });

    } catch (error) {
      logger.error('健康记录一致性检查失败:', error);
      checks.push({
        module: 'health',
        table: 'health_records',
        check_type: 'general_check',
        status: 'failed',
        message: `健康记录一致性检查失败: ${error instanceof Error ? error.message : String(error)}`,
        checked_at: new Date()
      });
    }

    return checks;
  }

  /**
   * 检查库存一致性
   */
  private static async checkInventoryConsistency(): Promise<DataConsistencyCheck[]> {
    const checks: DataConsistencyCheck[] = [];

    try {
      // 检查库存表与库存变动记录的一致性
      const inventoryInconsistency = await sequelize.query(`
        SELECT 
          i.material_id,
          i.base_id,
          i.current_stock,
          COALESCE(SUM(it.quantity), 0) as calculated_stock
        FROM inventory i
        LEFT JOIN inventory_transactions it ON i.material_id = it.material_id AND i.base_id = it.base_id
        GROUP BY i.material_id, i.base_id, i.current_stock
        HAVING ABS(i.current_stock - COALESCE(SUM(it.quantity), 0)) > 0.01
      `, { type: QueryTypes.SELECT }) as any[];

      checks.push({
        module: 'inventory',
        table: 'inventory',
        check_type: 'stock_calculation_consistency',
        status: inventoryInconsistency.length === 0 ? 'passed' : 'failed',
        message: inventoryInconsistency.length === 0 
          ? '库存计算一致性检查通过' 
          : `发现 ${inventoryInconsistency.length} 个库存记录与变动记录不一致`,
        affected_records: inventoryInconsistency.length,
        details: inventoryInconsistency,
        checked_at: new Date()
      });

      // 检查负库存
      const negativeStock = await sequelize.query(`
        SELECT i.material_id, i.base_id, i.current_stock, pm.name as material_name, b.name as base_name
        FROM inventory i
        JOIN production_materials pm ON i.material_id = pm.id
        JOIN bases b ON i.base_id = b.id
        WHERE i.current_stock < 0
      `, { type: QueryTypes.SELECT }) as any[];

      checks.push({
        module: 'inventory',
        table: 'inventory',
        check_type: 'negative_stock',
        status: negativeStock.length === 0 ? 'passed' : 'warning',
        message: negativeStock.length === 0 
          ? '负库存检查通过' 
          : `发现 ${negativeStock.length} 个负库存记录`,
        affected_records: negativeStock.length,
        details: negativeStock,
        checked_at: new Date()
      });

      // 检查库存预警
      const lowStock = await sequelize.query(`
        SELECT i.material_id, i.base_id, i.current_stock, pm.safety_stock, 
               pm.name as material_name, b.name as base_name
        FROM inventory i
        JOIN production_materials pm ON i.material_id = pm.id
        JOIN bases b ON i.base_id = b.id
        WHERE i.current_stock <= pm.safety_stock AND pm.safety_stock > 0
      `, { type: QueryTypes.SELECT }) as any[];

      checks.push({
        module: 'inventory',
        table: 'inventory',
        check_type: 'low_stock_alert',
        status: lowStock.length === 0 ? 'passed' : 'warning',
        message: lowStock.length === 0 
          ? '库存预警检查通过' 
          : `发现 ${lowStock.length} 个低库存预警`,
        affected_records: lowStock.length,
        details: lowStock,
        checked_at: new Date()
      });

    } catch (error) {
      logger.error('库存一致性检查失败:', error);
      checks.push({
        module: 'inventory',
        table: 'inventory',
        check_type: 'general_check',
        status: 'failed',
        message: `库存一致性检查失败: ${error instanceof Error ? error.message : String(error)}`,
        checked_at: new Date()
      });
    }

    return checks;
  }

  /**
   * 检查订单一致性
   */
  private static async checkOrderConsistency(): Promise<DataConsistencyCheck[]> {
    const checks: DataConsistencyCheck[] = [];

    try {
      // 检查采购订单金额一致性
      const purchaseOrderAmountInconsistency = await sequelize.query(`
        SELECT 
          po.id,
          po.order_number,
          po.total_amount,
          COALESCE(SUM(poi.total_price), 0) as calculated_amount
        FROM purchase_orders po
        LEFT JOIN purchase_order_items poi ON po.id = poi.order_id
        GROUP BY po.id, po.order_number, po.total_amount
        HAVING ABS(po.total_amount - COALESCE(SUM(poi.total_price), 0)) > 0.01
      `, { type: QueryTypes.SELECT }) as any[];

      checks.push({
        module: 'purchase',
        table: 'purchase_orders',
        check_type: 'order_amount_consistency',
        status: purchaseOrderAmountInconsistency.length === 0 ? 'passed' : 'failed',
        message: purchaseOrderAmountInconsistency.length === 0 
          ? '采购订单金额一致性检查通过' 
          : `发现 ${purchaseOrderAmountInconsistency.length} 个采购订单金额不一致`,
        affected_records: purchaseOrderAmountInconsistency.length,
        details: purchaseOrderAmountInconsistency,
        checked_at: new Date()
      });

      // 检查销售订单金额一致性
      const salesOrderAmountInconsistency = await sequelize.query(`
        SELECT 
          so.id,
          so.order_number,
          so.total_amount,
          COALESCE(SUM(soi.total_price), 0) as calculated_amount
        FROM sales_orders so
        LEFT JOIN sales_order_items soi ON so.id = soi.order_id
        GROUP BY so.id, so.order_number, so.total_amount
        HAVING ABS(so.total_amount - COALESCE(SUM(soi.total_price), 0)) > 0.01
      `, { type: QueryTypes.SELECT }) as any[];

      checks.push({
        module: 'sales',
        table: 'sales_orders',
        check_type: 'order_amount_consistency',
        status: salesOrderAmountInconsistency.length === 0 ? 'passed' : 'failed',
        message: salesOrderAmountInconsistency.length === 0 
          ? '销售订单金额一致性检查通过' 
          : `发现 ${salesOrderAmountInconsistency.length} 个销售订单金额不一致`,
        affected_records: salesOrderAmountInconsistency.length,
        details: salesOrderAmountInconsistency,
        checked_at: new Date()
      });

      // 检查已完成订单的交付日期
      const ordersWithoutDeliveryDate = await sequelize.query(`
        SELECT id, order_number, status, actual_delivery_date
        FROM purchase_orders
        WHERE status = 'completed' AND actual_delivery_date IS NULL
        UNION ALL
        SELECT id, order_number, status, actual_delivery_date
        FROM sales_orders
        WHERE status = 'completed' AND actual_delivery_date IS NULL
      `, { type: QueryTypes.SELECT }) as any[];

      checks.push({
        module: 'orders',
        table: 'orders',
        check_type: 'delivery_date_consistency',
        status: ordersWithoutDeliveryDate.length === 0 ? 'passed' : 'warning',
        message: ordersWithoutDeliveryDate.length === 0 
          ? '订单交付日期一致性检查通过' 
          : `发现 ${ordersWithoutDeliveryDate.length} 个已完成订单缺少交付日期`,
        affected_records: ordersWithoutDeliveryDate.length,
        details: ordersWithoutDeliveryDate,
        checked_at: new Date()
      });

    } catch (error) {
      logger.error('订单一致性检查失败:', error);
      checks.push({
        module: 'orders',
        table: 'orders',
        check_type: 'general_check',
        status: 'failed',
        message: `订单一致性检查失败: ${error instanceof Error ? error.message : String(error)}`,
        checked_at: new Date()
      });
    }

    return checks;
  }

  /**
   * 检查引用完整性
   */
  private static async checkReferentialIntegrity(): Promise<DataConsistencyCheck[]> {
    const checks: DataConsistencyCheck[] = [];

    try {
      // 检查外键引用完整性的示例检查
      const referentialChecks = [
        {
          name: '牛只基地引用',
          query: `
            SELECT c.id, c.ear_tag, c.base_id
            FROM cattle c
            LEFT JOIN bases b ON c.base_id = b.id
            WHERE c.base_id IS NOT NULL AND b.id IS NULL
          `
        },
        {
          name: '饲喂记录配方引用',
          query: `
            SELECT fr.id, fr.formula_id
            FROM feeding_records fr
            LEFT JOIN feed_formulas ff ON fr.formula_id = ff.id
            WHERE fr.formula_id IS NOT NULL AND ff.id IS NULL
          `
        },
        {
          name: '库存变动物资引用',
          query: `
            SELECT it.id, it.material_id
            FROM inventory_transactions it
            LEFT JOIN production_materials pm ON it.material_id = pm.id
            WHERE it.material_id IS NOT NULL AND pm.id IS NULL
          `
        }
      ];

      for (const check of referentialChecks) {
        const results = await sequelize.query(check.query, { type: QueryTypes.SELECT }) as any[];
        
        checks.push({
          module: 'system',
          table: 'referential_integrity',
          check_type: check.name,
          status: results.length === 0 ? 'passed' : 'failed',
          message: results.length === 0 
            ? `${check.name}引用完整性检查通过` 
            : `${check.name}发现 ${results.length} 个引用完整性问题`,
          affected_records: results.length,
          details: results,
          checked_at: new Date()
        });
      }

    } catch (error) {
      logger.error('引用完整性检查失败:', error);
      checks.push({
        module: 'system',
        table: 'referential_integrity',
        check_type: 'general_check',
        status: 'failed',
        message: `引用完整性检查失败: ${error instanceof Error ? error.message : String(error)}`,
        checked_at: new Date()
      });
    }

    return checks;
  }

  /**
   * 检查业务规则一致性
   */
  private static async checkBusinessRuleConsistency(): Promise<DataConsistencyCheck[]> {
    const checks: DataConsistencyCheck[] = [];

    try {
      // 检查销售的牛只是否存在
      const soldCattleCheck = await sequelize.query(`
        SELECT soi.id, soi.cattle_id, soi.ear_tag, c.id as actual_cattle_id
        FROM sales_order_items soi
        LEFT JOIN cattle c ON soi.cattle_id = c.id
        WHERE soi.cattle_id IS NOT NULL AND c.id IS NULL
      `, { type: QueryTypes.SELECT }) as any[];

      checks.push({
        module: 'business_rules',
        table: 'sales_order_items',
        check_type: 'sold_cattle_existence',
        status: soldCattleCheck.length === 0 ? 'passed' : 'failed',
        message: soldCattleCheck.length === 0 
          ? '销售牛只存在性检查通过' 
          : `发现 ${soldCattleCheck.length} 个销售项目引用了不存在的牛只`,
        affected_records: soldCattleCheck.length,
        details: soldCattleCheck,
        checked_at: new Date()
      });

      // 检查重复销售的牛只
      const duplicateSoldCattle = await sequelize.query(`
        SELECT soi.cattle_id, c.ear_tag, COUNT(*) as sale_count
        FROM sales_order_items soi
        JOIN cattle c ON soi.cattle_id = c.id
        JOIN sales_orders so ON soi.order_id = so.id
        WHERE so.status = 'completed'
        GROUP BY soi.cattle_id, c.ear_tag
        HAVING COUNT(*) > 1
      `, { type: QueryTypes.SELECT }) as any[];

      checks.push({
        module: 'business_rules',
        table: 'sales_order_items',
        check_type: 'duplicate_cattle_sales',
        status: duplicateSoldCattle.length === 0 ? 'passed' : 'failed',
        message: duplicateSoldCattle.length === 0 
          ? '重复销售牛只检查通过' 
          : `发现 ${duplicateSoldCattle.length} 头牛只被重复销售`,
        affected_records: duplicateSoldCattle.length,
        details: duplicateSoldCattle,
        checked_at: new Date()
      });

      // 检查饲喂记录的日期合理性
      const futureFeedingRecords = await sequelize.query(`
        SELECT id, feeding_date
        FROM feeding_records
        WHERE feeding_date > CURRENT_DATE
      `, { type: QueryTypes.SELECT }) as any[];

      checks.push({
        module: 'business_rules',
        table: 'feeding_records',
        check_type: 'future_feeding_dates',
        status: futureFeedingRecords.length === 0 ? 'passed' : 'warning',
        message: futureFeedingRecords.length === 0 
          ? '饲喂记录日期合理性检查通过' 
          : `发现 ${futureFeedingRecords.length} 条未来日期的饲喂记录`,
        affected_records: futureFeedingRecords.length,
        details: futureFeedingRecords,
        checked_at: new Date()
      });

    } catch (error) {
      logger.error('业务规则一致性检查失败:', error);
      checks.push({
        module: 'business_rules',
        table: 'business_rules',
        check_type: 'general_check',
        status: 'failed',
        message: `业务规则一致性检查失败: ${error instanceof Error ? error.message : String(error)}`,
        checked_at: new Date()
      });
    }

    return checks;
  }

  /**
   * 修复数据一致性问题
   */
  static async fixDataInconsistencies(checkIds: string[]): Promise<{ fixed: number; failed: number; details: any[] }> {
    const results = { fixed: 0, failed: 0, details: [] as any[] };

    try {
      // 这里可以实现具体的修复逻辑
      // 例如：修复牛棚容量计数、更新库存计算等
      
      logger.info('数据一致性问题修复完成', results);
      return results;
    } catch (error) {
      logger.error('数据一致性问题修复失败:', error);
      throw error;
    }
  }

  /**
   * 获取数据质量评分
   */
  static async getDataQualityScore(): Promise<{ score: number; details: any }> {
    try {
      const report = await this.performFullConsistencyCheck();
      
      // 计算质量评分 (0-100)
      const totalChecks = report.total_checks;
      const passedChecks = report.passed_checks;
      const warningChecks = report.warning_checks;
      const failedChecks = report.failed_checks;

      // 权重：通过=1分，警告=0.5分，失败=0分
      const weightedScore = (passedChecks * 1 + warningChecks * 0.5 + failedChecks * 0) / totalChecks;
      const score = Math.round(weightedScore * 100);

      return {
        score,
        details: {
          total_checks: totalChecks,
          passed_checks: passedChecks,
          warning_checks: warningChecks,
          failed_checks: failedChecks,
          overall_status: report.overall_status
        }
      };
    } catch (error) {
      logger.error('获取数据质量评分失败:', error);
      return { score: 0, details: { error: error instanceof Error ? error.message : String(error) } };
    }
  }
}