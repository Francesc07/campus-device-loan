// src/Infrastructure/Logging/StructuredLogger.ts
import { InvocationContext } from "@azure/functions";

export interface LogMetadata {
    correlationId: string;
    userId?: string;
    loanId?: string;
    deviceId?: string;
    operation?: string;
    duration?: number;
    statusCode?: number;
    errorMessage?: string;
    errorStack?: string;
    additionalData?: Record<string, any>;
}

export class StructuredLogger {
    private context: InvocationContext;
    private baseMetadata: Partial<LogMetadata>;

    constructor(context: InvocationContext, baseMetadata?: Partial<LogMetadata>) {
        this.context = context;
        this.baseMetadata = {
            correlationId: context.invocationId,
            ...baseMetadata
        };
    }

    info(message: string, metadata?: Partial<LogMetadata>): void {
        const logEntry = this.buildLogEntry('INFO', message, metadata);
        this.context.log(JSON.stringify(logEntry));
    }

    warn(message: string, metadata?: Partial<LogMetadata>): void {
        const logEntry = this.buildLogEntry('WARN', message, metadata);
        this.context.warn(JSON.stringify(logEntry));
    }

    error(message: string, error?: Error, metadata?: Partial<LogMetadata>): void {
        const logEntry = this.buildLogEntry('ERROR', message, {
            ...metadata,
            errorMessage: error?.message,
            errorStack: error?.stack
        });
        this.context.error(JSON.stringify(logEntry));
    }

    trackPerformance(operation: string, duration: number, metadata?: Partial<LogMetadata>): void {
        const logEntry = this.buildLogEntry('PERFORMANCE', `Operation completed: ${operation}`, {
            operation,
            duration,
            ...metadata
        });
        this.context.log(JSON.stringify(logEntry));
    }

    trackBusinessEvent(eventType: string, metadata?: Partial<LogMetadata>): void {
        const logEntry = this.buildLogEntry('BUSINESS_EVENT', eventType, metadata);
        this.context.log(JSON.stringify(logEntry));
    }

    private buildLogEntry(level: string, message: string, metadata?: Partial<LogMetadata>) {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            service: 'device-loan',
            environment: process.env.ENVIRONMENT || 'unknown',
            version: process.env.npm_package_version || '1.0.0',
            ...this.baseMetadata,
            ...metadata,
            // Application Insights custom dimensions
            customDimensions: {
                ...this.baseMetadata,
                ...metadata
            }
        };
    }

    static createOperationLogger(context: InvocationContext, operation: string): StructuredLogger {
        return new StructuredLogger(context, { operation });
    }
}

export function withPerformanceTracking<T>(
    logger: StructuredLogger,
    operation: string,
    fn: () => Promise<T>
): Promise<T> {
    const start = Date.now();
    
    return fn()
        .then((result) => {
            const duration = Date.now() - start;
            logger.trackPerformance(operation, duration, { statusCode: 200 });
            return result;
        })
        .catch((error) => {
            const duration = Date.now() - start;
            logger.trackPerformance(operation, duration, { statusCode: 500 });
            throw error;
        });
}
