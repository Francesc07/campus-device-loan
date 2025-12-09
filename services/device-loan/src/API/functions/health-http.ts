// src/API/functions/health-http.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function health(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log('Health check endpoint called');

    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'device-loan',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.ENVIRONMENT || 'unknown',
        uptime: process.uptime(),
        correlationId: context.invocationId
    };

    return {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'X-Correlation-ID': context.invocationId
        },
        jsonBody: healthStatus
    };
}

app.http('health', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'health',
    handler: health
});
