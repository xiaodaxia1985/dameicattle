import { EventBus, EventData } from '../eventBus/EventBus';
import { createLogger } from '../logger';

const logger = createLogger('saga-orchestrator');

export interface SagaStep {
  stepId: string;
  service: string;
  action: string;
  payload: any;
  compensationAction?: string;
  compensationPayload?: any;
}

export interface SagaDefinition {
  sagaId: string;
  steps: SagaStep[];
  timeout?: number;
}

export interface SagaExecution {
  sagaId: string;
  correlationId: string;
  status: 'pending' | 'completed' | 'failed' | 'compensating' | 'compensated';
  currentStep: number;
  completedSteps: string[];
  failedStep?: string;
  error?: any;
  startTime: number;
  endTime?: number;
}

export class SagaOrchestrator {
  private executions: Map<string, SagaExecution> = new Map();
  private definitions: Map<string, SagaDefinition> = new Map();

  constructor(private eventBus: EventBus) {
    this.setupEventHandlers();
  }

  // 注册Saga定义
  registerSaga(definition: SagaDefinition): void {
    this.definitions.set(definition.sagaId, definition);
    logger.info(`Saga定义已注册: ${definition.sagaId}`);
  }

  // 开始执行Saga
  async startSaga(sagaId: string, correlationId: string, initialPayload?: any): Promise<void> {
    const definition = this.definitions.get(sagaId);
    if (!definition) {
      throw new Error(`未找到Saga定义: ${sagaId}`);
    }

    const execution: SagaExecution = {
      sagaId,
      correlationId,
      status: 'pending',
      currentStep: 0,
      completedSteps: [],
      startTime: Date.now()
    };

    this.executions.set(correlationId, execution);
    logger.info(`开始执行Saga: ${sagaId}`, { correlationId });

    // 执行第一步
    await this.executeNextStep(correlationId, initialPayload);
  }

  // 执行下一步
  private async executeNextStep(correlationId: string, payload?: any): Promise<void> {
    const execution = this.executions.get(correlationId);
    if (!execution) {
      logger.error(`未找到Saga执行: ${correlationId}`);
      return;
    }

    const definition = this.definitions.get(execution.sagaId);
    if (!definition) {
      logger.error(`未找到Saga定义: ${execution.sagaId}`);
      return;
    }

    if (execution.currentStep >= definition.steps.length) {
      // 所有步骤完成
      execution.status = 'completed';
      execution.endTime = Date.now();
      logger.info(`Saga执行完成: ${execution.sagaId}`, { correlationId });
      
      // 发布完成事件
      await this.eventBus.publish(
        'saga.completed',
        { sagaId: execution.sagaId, correlationId },
        'saga-orchestrator',
        correlationId
      );
      return;
    }

    const step = definition.steps[execution.currentStep];
    
    try {
      // 发布步骤执行事件
      await this.eventBus.publish(
        `${step.service}.${step.action}`,
        payload || step.payload,
        'saga-orchestrator',
        correlationId
      );

      logger.debug(`Saga步骤执行: ${step.stepId}`, { 
        sagaId: execution.sagaId, 
        correlationId,
        service: step.service,
        action: step.action
      });
    } catch (error) {
      logger.error(`Saga步骤执行失败: ${step.stepId}`, error);
      await this.handleStepFailure(correlationId, step.stepId, error);
    }
  }

  // 处理步骤成功
  private async handleStepSuccess(correlationId: string, stepId: string, result?: any): Promise<void> {
    const execution = this.executions.get(correlationId);
    if (!execution) {
      return;
    }

    execution.completedSteps.push(stepId);
    execution.currentStep++;

    logger.debug(`Saga步骤成功: ${stepId}`, { 
      sagaId: execution.sagaId, 
      correlationId 
    });

    // 执行下一步
    await this.executeNextStep(correlationId, result);
  }

  // 处理步骤失败
  private async handleStepFailure(correlationId: string, stepId: string, error: any): Promise<void> {
    const execution = this.executions.get(correlationId);
    if (!execution) {
      return;
    }

    execution.status = 'failed';
    execution.failedStep = stepId;
    execution.error = error;
    execution.endTime = Date.now();

    logger.error(`Saga步骤失败: ${stepId}`, { 
      sagaId: execution.sagaId, 
      correlationId,
      error 
    });

    // 开始补偿
    await this.startCompensation(correlationId);
  }

  // 开始补偿
  private async startCompensation(correlationId: string): Promise<void> {
    const execution = this.executions.get(correlationId);
    if (!execution) {
      return;
    }

    const definition = this.definitions.get(execution.sagaId);
    if (!definition) {
      return;
    }

    execution.status = 'compensating';
    logger.info(`开始Saga补偿: ${execution.sagaId}`, { correlationId });

    // 逆序执行已完成步骤的补偿操作
    for (let i = execution.completedSteps.length - 1; i >= 0; i--) {
      const stepId = execution.completedSteps[i];
      const step = definition.steps.find(s => s.stepId === stepId);
      
      if (step && step.compensationAction) {
        try {
          await this.eventBus.publish(
            `${step.service}.${step.compensationAction}`,
            step.compensationPayload || step.payload,
            'saga-orchestrator',
            correlationId
          );

          logger.debug(`Saga补偿步骤: ${stepId}`, { 
            sagaId: execution.sagaId, 
            correlationId 
          });
        } catch (error) {
          logger.error(`Saga补偿失败: ${stepId}`, error);
        }
      }
    }

    execution.status = 'compensated';
    execution.endTime = Date.now();
    
    // 发布补偿完成事件
    await this.eventBus.publish(
      'saga.compensated',
      { sagaId: execution.sagaId, correlationId, error: execution.error },
      'saga-orchestrator',
      correlationId
    );

    logger.info(`Saga补偿完成: ${execution.sagaId}`, { correlationId });
  }

  // 设置事件处理器
  private setupEventHandlers(): void {
    // 监听步骤成功事件
    this.eventBus.subscribe('saga.step.success', async (data: EventData) => {
      const { correlationId, stepId, result } = data.payload;
      await this.handleStepSuccess(correlationId, stepId, result);
    });

    // 监听步骤失败事件
    this.eventBus.subscribe('saga.step.failure', async (data: EventData) => {
      const { correlationId, stepId, error } = data.payload;
      await this.handleStepFailure(correlationId, stepId, error);
    });
  }

  // 获取Saga执行状态
  getSagaExecution(correlationId: string): SagaExecution | undefined {
    return this.executions.get(correlationId);
  }

  // 获取所有执行中的Saga
  getActiveSagas(): SagaExecution[] {
    return Array.from(this.executions.values()).filter(
      execution => execution.status === 'pending' || execution.status === 'compensating'
    );
  }

  // 清理完成的Saga
  cleanupCompletedSagas(olderThanMs: number = 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - olderThanMs;
    
    for (const [correlationId, execution] of this.executions.entries()) {
      if (
        (execution.status === 'completed' || execution.status === 'compensated') &&
        execution.endTime &&
        execution.endTime < cutoffTime
      ) {
        this.executions.delete(correlationId);
        logger.debug(`清理已完成的Saga: ${execution.sagaId}`, { correlationId });
      }
    }
  }
}

// 预定义的Saga模式

// 牛只转移Saga
export const CattleTransferSaga: SagaDefinition = {
  sagaId: 'cattle-transfer',
  steps: [
    {
      stepId: 'validate-cattle',
      service: 'cattle-service',
      action: 'validate-transfer',
      payload: {},
      compensationAction: 'rollback-validation'
    },
    {
      stepId: 'update-barn-capacity',
      service: 'base-service',
      action: 'update-barn-capacity',
      payload: {},
      compensationAction: 'rollback-barn-capacity'
    },
    {
      stepId: 'transfer-cattle',
      service: 'cattle-service',
      action: 'execute-transfer',
      payload: {},
      compensationAction: 'rollback-transfer'
    },
    {
      stepId: 'create-transfer-record',
      service: 'cattle-service',
      action: 'create-transfer-record',
      payload: {},
      compensationAction: 'delete-transfer-record'
    }
  ],
  timeout: 30000
};

// 采购订单处理Saga
export const PurchaseOrderSaga: SagaDefinition = {
  sagaId: 'purchase-order-processing',
  steps: [
    {
      stepId: 'validate-order',
      service: 'procurement-service',
      action: 'validate-order',
      payload: {},
      compensationAction: 'cancel-order'
    },
    {
      stepId: 'reserve-inventory',
      service: 'material-service',
      action: 'reserve-inventory',
      payload: {},
      compensationAction: 'release-reservation'
    },
    {
      stepId: 'process-payment',
      service: 'procurement-service',
      action: 'process-payment',
      payload: {},
      compensationAction: 'refund-payment'
    },
    {
      stepId: 'update-inventory',
      service: 'material-service',
      action: 'update-inventory',
      payload: {},
      compensationAction: 'rollback-inventory'
    },
    {
      stepId: 'complete-order',
      service: 'procurement-service',
      action: 'complete-order',
      payload: {}
    }
  ],
  timeout: 60000
};