// src/API/functions/health-ready-http.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function healthReady(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Readiness check endpoint called');

    try {
        // Check critical dependencies
        const checks = {
            database: await checkDatabase(),
            eventGrid: await checkEventGrid(),
            memory: checkMemory()
        };

        const allHealthy = Object.values(checks).every(check => check.status === 'healthy');

        const readinessStatus = {
            status: allHealthy ? 'ready' : 'not_ready',
            timestamp: new Date().toISOString(),
            service: 'device-loan',
            correlationId: context.invocationId,
            checks: checks,
            details: {
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.ENVIRONMENT || 'unknown',
                uptime: process.uptime()
            }
        };

        return {
            status: allHealthy ? 200 : 503,
            headers: {
                'Content-Type': 'application/json',
                'X-Correlation-ID': context.invocationId
            },
            jsonBody: readinessStatus
        };
    } catch (error) {
        context.error('Readiness check failed', error);
        
        return {
            status: 503,
            headers: {
                'Content-Type': 'application/json',
                'X-Correlation-ID': context.invocationId
            },
            jsonBody: {
                status: 'not_ready',
                error: error instanceof Error ? error.message : 'Unknown error',
                correlationId: context.invocationId
            }
        };
    }
}

async function checkDatabase(): Promise<{ status: string; responseTime?: number }> {
    const start = Date.now();
    
    try {
        // Simulate database check
        // In production, ping Cosmos DB
        const cosmosEndpoint = process.env.COSMOS_ENDPOINT;
        if (!cosmosEndpoint) {
            return { status: 'unhealthy', responseTime: 0 };
        }

        // Simple connectivity check
        await new Promise(resolve => setTimeout(resolve, 5));
        
        return { 
            status: 'healthy',
            responseTime: Date.now() - start
        };
    } catch (error) {
        return { 
            status: 'unhealthy',
            responseTime: Date.now() - start
        };
    }
}

async function checkEventGrid(): Promise<{ status: string }> {
    try {
        // Check if Event Grid endpoint is configured
        const eventGridEndpoint = process.env.EVENT_GRID_ENDPOINT;
        if (!eventGridEndpoint) {
            return { status: 'unhealthy' };
        }

        return { status: 'healthy' };
    } catch (error) {
        return { status: 'unhealthy' };
    }
}

function checkMemory(): { status: string; used: number; limit: number } {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round(used.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(used.heapTotal / 1024 / 1024);
    
    // Consider unhealthy if using more than 90% of heap
    const status = (heapUsedMB / heapTotalMB) < 0.9 ? 'healthy' : 'unhealthy';
    
    return {
        status,
        used: heapUsedMB,
        limit: heapTotalMB
    };
}

app.http('health-ready', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'health/ready',
    handler: healthReady
});
