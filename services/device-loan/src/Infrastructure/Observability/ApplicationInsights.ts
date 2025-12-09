// src/Infrastructure/Observability/ApplicationInsights.ts
import { InvocationContext } from "@azure/functions";

export interface CustomMetric {
    name: string;
    value: number;
    properties?: Record<string, string>;
}

export interface CustomEvent {
    name: string;
    properties?: Record<string, string>;
    measurements?: Record<string, number>;
}

export class ApplicationInsightsHelper {
    private static isEnabled(): boolean {
        return !!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
    }

    static trackMetric(metric: CustomMetric, context: InvocationContext): void {
        if (!this.isEnabled()) {
            context.log(`[METRIC] ${metric.name}: ${metric.value}`, metric.properties);
            return;
        }

        // In production with App Insights SDK, use:
        // appInsights.defaultClient.trackMetric({
        //     name: metric.name,
        //     value: metric.value,
        //     properties: {
        //         correlationId: context.invocationId,
        //         ...metric.properties
        //     }
        // });

        context.log(JSON.stringify({
            type: 'metric',
            name: metric.name,
            value: metric.value,
            correlationId: context.invocationId,
            timestamp: new Date().toISOString(),
            ...metric.properties
        }));
    }

    static trackEvent(event: CustomEvent, context: InvocationContext): void {
        if (!this.isEnabled()) {
            context.log(`[EVENT] ${event.name}`, event.properties, event.measurements);
            return;
        }

        // In production with App Insights SDK, use:
        // appInsights.defaultClient.trackEvent({
        //     name: event.name,
        //     properties: {
        //         correlationId: context.invocationId,
        //         ...event.properties
        //     },
        //     measurements: event.measurements
        // });

        context.log(JSON.stringify({
            type: 'event',
            name: event.name,
            correlationId: context.invocationId,
            timestamp: new Date().toISOString(),
            properties: event.properties,
            measurements: event.measurements
        }));
    }

    static trackDependency(
        dependencyName: string,
        dependencyType: string,
        duration: number,
        success: boolean,
        context: InvocationContext
    ): void {
        if (!this.isEnabled()) {
            context.log(`[DEPENDENCY] ${dependencyName} (${dependencyType}): ${duration}ms - ${success ? 'SUCCESS' : 'FAILURE'}`);
            return;
        }

        // In production with App Insights SDK, use:
        // appInsights.defaultClient.trackDependency({
        //     target: dependencyName,
        //     dependencyTypeName: dependencyType,
        //     duration: duration,
        //     success: success,
        //     properties: {
        //         correlationId: context.invocationId
        //     }
        // });

        context.log(JSON.stringify({
            type: 'dependency',
            target: dependencyName,
            dependencyType: dependencyType,
            duration: duration,
            success: success,
            correlationId: context.invocationId,
            timestamp: new Date().toISOString()
        }));
    }

    static trackException(error: Error, context: InvocationContext, properties?: Record<string, string>): void {
        if (!this.isEnabled()) {
            context.error(`[EXCEPTION] ${error.message}`, error.stack);
            return;
        }

        // In production with App Insights SDK, use:
        // appInsights.defaultClient.trackException({
        //     exception: error,
        //     properties: {
        //         correlationId: context.invocationId,
        //         ...properties
        //     }
        // });

        context.error(JSON.stringify({
            type: 'exception',
            message: error.message,
            stack: error.stack,
            correlationId: context.invocationId,
            timestamp: new Date().toISOString(),
            properties: properties
        }));
    }
}
