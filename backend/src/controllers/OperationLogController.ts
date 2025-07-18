import { Request, Response, NextFunction } from 'express';
import { getOperationLogs } from '@/middleware/operationLog';

export class OperationLogController {
    public async getOperationLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                user_id,
                operation,
                resource,
                start_date,
                end_date,
                page = 1,
                limit = 50,
            } = req.query;

            const filters: any = {
                page: Number(page),
                limit: Number(limit),
            };

            if (user_id) {
                filters.user_id = Number(user_id);
            }

            if (operation) {
                filters.operation = operation as string;
            }

            if (resource) {
                filters.resource = resource as string;
            }

            if (start_date) {
                filters.start_date = new Date(start_date as string);
            }

            if (end_date) {
                filters.end_date = new Date(end_date as string);
            }

            const result = getOperationLogs(filters);

            res.json({
                success: true,
                data: {
                    logs: result.logs,
                    pagination: {
                        total: result.total,
                        page: result.page,
                        limit: result.limit,
                        totalPages: result.totalPages,
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }

    public async getOperationStatistics(req: Request, res: Response, next: NextFunction) {
        try {
            const { start_date, end_date } = req.query;

            const filters: any = {};

            if (start_date) {
                filters.start_date = new Date(start_date as string);
            }

            if (end_date) {
                filters.end_date = new Date(end_date as string);
            }

            const result = getOperationLogs(filters);
            const logs = result.logs;

            // Calculate statistics
            const statistics = {
                total_operations: logs.length,
                operations_by_type: {} as Record<string, number>,
                operations_by_resource: {} as Record<string, number>,
                operations_by_user: {} as Record<string, number>,
                operations_by_status: {} as Record<string, number>,
                average_duration: 0,
                success_rate: 0,
            };

            let totalDuration = 0;
            let successCount = 0;

            logs.forEach(log => {
                // Count by operation type
                statistics.operations_by_type[log.operation] =
                    (statistics.operations_by_type[log.operation] || 0) + 1;

                // Count by resource
                statistics.operations_by_resource[log.resource] =
                    (statistics.operations_by_resource[log.resource] || 0) + 1;

                // Count by user
                const username = log.username || 'Unknown';
                statistics.operations_by_user[username] =
                    (statistics.operations_by_user[username] || 0) + 1;

                // Count by status
                const statusGroup = log.response_status && log.response_status < 400 ? 'success' : 'error';
                statistics.operations_by_status[statusGroup] =
                    (statistics.operations_by_status[statusGroup] || 0) + 1;

                // Calculate duration and success rate
                if (log.duration) {
                    totalDuration += log.duration;
                }

                if (log.response_status && log.response_status < 400) {
                    successCount++;
                }
            });

            statistics.average_duration = logs.length > 0 ? Math.round(totalDuration / logs.length) : 0;
            statistics.success_rate = logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0;

            res.json({
                success: true,
                data: {
                    statistics,
                },
            });
        } catch (error) {
            next(error);
        }
    }
}