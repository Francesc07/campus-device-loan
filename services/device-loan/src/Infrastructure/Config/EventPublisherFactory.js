"use strict";
// src/Infrastructure/Config/EventPublisherFactory.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventPublisherFactory = void 0;
class EventPublisherFactory {
    /**
     * Determines the event publishing strategy based on environment.
     */
    static getConfig() {
        const environment = process.env.ENVIRONMENT || process.env.NODE_ENV || "dev";
        const eventGridEndpoint = process.env.EVENTGRID_TOPIC_ENDPOINT;
        const eventGridKey = process.env.EVENTGRID_TOPIC_KEY;
        // Use Event Grid if we're in production/test and have valid credentials
        const useEventGrid = (environment === "production" ||
            environment === "prod" ||
            environment === "test") &&
            !!eventGridEndpoint &&
            !!eventGridKey;
        if (useEventGrid) {
            return {
                useEventGrid: true,
                eventGridEndpoint: eventGridEndpoint,
                eventGridKey: eventGridKey,
            };
        }
        // For local development, use HTTP webhooks
        return {
            useEventGrid: false,
            webhookEndpoints: {
                catalogService: process.env.CATALOG_WEBHOOK_URL ||
                    "http://localhost:7071/api/events/device-updates",
                reservationService: process.env.RESERVATION_WEBHOOK_URL ||
                    "http://localhost:7073/api/events/loan-updates",
                staffService: process.env.STAFF_WEBHOOK_URL ||
                    "http://localhost:7074/api/events/loan-updates",
            },
        };
    }
    /**
     * Check if we should use Event Grid for publishing.
     */
    static shouldUseEventGrid() {
        return this.getConfig().useEventGrid;
    }
    /**
     * Get webhook URL for a specific service (local dev only).
     */
    static getWebhookUrl(service) {
        const config = this.getConfig();
        if (config.useEventGrid) {
            return undefined; // Not using webhooks in Event Grid mode
        }
        const serviceKey = `${service}Service`;
        return config.webhookEndpoints?.[serviceKey];
    }
}
exports.EventPublisherFactory = EventPublisherFactory;
//# sourceMappingURL=EventPublisherFactory.js.map