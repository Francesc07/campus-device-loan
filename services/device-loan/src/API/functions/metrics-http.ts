// src/API/functions/metrics-http.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

// In-memory metrics store (in production, use Application Insights)
const metrics = {
    loansCreated: 0,
    loansCancelled: 0,
    loansActivated: 0,
    requestCount: 0,
    errorCount: 0,
    lastReset: new Date().toISOString()
};

export function incrementMetric(metricName: keyof typeof metrics): void {
    if (metricName in metrics && typeof metrics[metricName] === 'number') {
        (metrics[metricName] as number)++;
    }
}

export async function getMetrics(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Metrics endpoint called');

    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    const metricsData = {
        timestamp: new Date().toISOString(),
        correlationId: context.invocationId,
        businessMetrics: {
            ...metrics,
            loansPerMinute: calculateRate(metrics.loansCreated),
            errorRate: metrics.requestCount > 0 
                ? ((metrics.errorCount / metrics.requestCount) * 100).toFixed(2) + '%'
                : '0%'
        },
        systemMetrics: {
            memory: {
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
                rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB'
            },
            cpu: {
                user: Math.round(cpuUsage.user / 1000) + ' ms',
                system: Math.round(cpuUsage.system / 1000) + ' ms'
            },
            uptime: Math.round(process.uptime()) + ' seconds',
            nodeVersion: process.version
        },
        environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
            environment: process.env.ENVIRONMENT || 'unknown',
            version: process.env.npm_package_version || '1.0.0'
        }
    };

    return {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': context.invocationId,
            'Cache-Control': 'no-cache'
        },
        jsonBody: metricsData
    };
}

function calculateRate(count: number): string {
    const uptimeMinutes = process.uptime() / 60;
    if (uptimeMinutes < 1) return '0';
    return (count / uptimeMinutes).toFixed(2);
}

export function resetMetrics(): void {
    metrics.loansCreated = 0;
    metrics.loansCancelled = 0;
    metrics.loansActivated = 0;
    metrics.requestCount = 0;
    metrics.errorCount = 0;
    metrics.lastReset = new Date().toISOString();
}

app.http('metrics', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'metrics',
    handler: getMetrics
});
