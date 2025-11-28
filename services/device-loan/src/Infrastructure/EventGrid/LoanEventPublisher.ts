// src/Infrastructure/EventGrid/LoanEventPublisher.ts
import { EventGridPublisherClient, AzureKeyCredential } from "@azure/eventgrid";
import { randomUUID } from "crypto";
import { ILoanEventPublisher } from "../../Application/Interfaces/ILoanEventPublisher";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";
import { EventPublisherFactory } from "../Config/EventPublisherFactory";
import { WebhookEventPublisher } from "./WebhookEventPublisher";

/**
 * LoanEventPublisher
 *  - In prod/test → publishes events to Azure Event Grid
 *  - In local dev → publishes via HTTP webhooks to other services
 *
 * **Loan Service is only responsible for:**
 *   - Loan.Created
 *   - Loan.Cancelled
 */
export class LoanEventPublisher implements ILoanEventPublisher {
  private eventGridClient?: EventGridPublisherClient<any>;
  private webhookClient?: WebhookEventPublisher;
  private useEventGrid: boolean;

  constructor() {
    const config = EventPublisherFactory.getConfig();
    this.useEventGrid = config.useEventGrid;

    if (this.useEventGrid) {
      console.log("📡 Loan Service: Using Azure Event Grid for event publishing");
      this.eventGridClient = new EventGridPublisherClient(
        config.eventGridEndpoint!,
        "EventGrid",
        new AzureKeyCredential(config.eventGridKey!)
      );
    } else {
      console.log("🔗 Loan Service: Using HTTP webhooks for local event publishing");
      console.log("  Reservation webhook:", config.webhookEndpoints?.reservationService);
      this.webhookClient = new WebhookEventPublisher();
    }
  }

  private async sendEventGrid(eventType: string, data: any) {
    if (!this.eventGridClient) {
      throw new Error("Event Grid client not initialized");
    }

    await this.eventGridClient.send([
      {
        id: randomUUID(),
        eventType,
        subject: `LoanService/loans/${data.id}`,
        data,
        dataVersion: "1.0",
        eventTime: new Date().toISOString(),
      },
    ]);
  }

  /**
   * Generic publish method used by use cases.
   * Only "Loan.Created" and "Loan.Cancelled" are emitted from this service.
   */
  async publish(eventType: string, data: LoanRecord): Promise<void> {
    if (this.useEventGrid) {
      await this.sendEventGrid(eventType, data);
      return;
    }

    // Local dev – send only to Reservation Service (the next step in pipeline).
    const reservationUrl = EventPublisherFactory.getWebhookUrl("reservation");

    if (!reservationUrl || !this.webhookClient) {
      console.warn("No reservation webhook configured; skipping local event publish.");
      return;
    }

    if (eventType === "Loan.Created") {
      await this.webhookClient.publishLoanCreated(data, reservationUrl);
    } else if (eventType === "Loan.Cancelled") {
      await this.webhookClient.publishLoanCancelled(data, reservationUrl);
    } else {
      console.log(`LoanEventPublisher: ignoring unknown eventType "${eventType}" in local mode`);
    }
  }
}
