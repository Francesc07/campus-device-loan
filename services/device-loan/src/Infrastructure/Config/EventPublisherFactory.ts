/**
 * Event Publisher Configuration Factory
 * Determines whether to use Azure Event Grid or local HTTP webhooks
 * based on the environment
 */

export interface EventPublisherConfig {
  useEventGrid: boolean;
  eventGridEndpoint?: string;
  eventGridKey?: string;
  webhookEndpoints?: {
    catalogService?: string;
    reservationService?: string;
    staffService?: string;
  };
}

export class EventPublisherFactory {
  
  /**
   * Determines the event publishing strategy based on environment
   */
  static getConfig(): EventPublisherConfig {
    const environment = process.env.ENVIRONMENT || process.env.NODE_ENV || "dev";
    const eventGridEndpoint = process.env.EVENTGRID_TOPIC_ENDPOINT;
    const eventGridKey = process.env.EVENTGRID_TOPIC_KEY;

    // Use Event Grid if we're in production/test and have valid credentials
    const useEventGrid = 
      (environment === "production" || environment === "prod" || environment === "test") &&
      !!eventGridEndpoint &&
      !!eventGridKey;

    if (useEventGrid) {
      return {
        useEventGrid: true,
        eventGridEndpoint: eventGridEndpoint!,
        eventGridKey: eventGridKey!,
      };
    }

    // For local development, use HTTP webhooks
    return {
      useEventGrid: false,
      webhookEndpoints: {
        catalogService: process.env.CATALOG_WEBHOOK_URL || "http://localhost:7071/api/events/device-updates",
        reservationService: process.env.RESERVATION_WEBHOOK_URL || "http://localhost:7073/api/events/loan-updates",
        staffService: process.env.STAFF_WEBHOOK_URL || "http://localhost:7074/api/events/loan-updates",
      },
    };
  }

  /**
   * Check if we should use Event Grid for publishing
   */
  static shouldUseEventGrid(): boolean {
    return this.getConfig().useEventGrid;
  }

  /**
   * Get webhook URL for a specific service (local dev only)
   */
  static getWebhookUrl(service: "catalog" | "reservation" | "staff"): string | undefined {
    const config = this.getConfig();
    if (config.useEventGrid) {
      return undefined; // Not using webhooks in Event Grid mode
    }

    const serviceKey = `${service}Service` as keyof typeof config.webhookEndpoints;
    return config.webhookEndpoints?.[serviceKey];
  }
}
