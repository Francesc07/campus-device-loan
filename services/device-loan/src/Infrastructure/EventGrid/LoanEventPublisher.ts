import { EventGridPublisherClient, AzureKeyCredential } from "@azure/eventgrid";
import { ILoanEventPublisher } from "../../Application/Interfaces/ILoanEventPublisher";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";
import { EventPublisherFactory } from "../Config/EventPublisherFactory";
import { WebhookEventPublisher } from "./WebhookEventPublisher";

export class LoanEventPublisher implements ILoanEventPublisher {
  private eventGridClient?: EventGridPublisherClient<any>;
  private webhookClient?: WebhookEventPublisher;
  private useEventGrid: boolean;

  constructor() {
    const config = EventPublisherFactory.getConfig();
    this.useEventGrid = config.useEventGrid;

    if (this.useEventGrid) {
      // Production/Test: Use Azure Event Grid
      console.log("📡 Using Azure Event Grid for event publishing");
      this.eventGridClient = new EventGridPublisherClient(
        config.eventGridEndpoint!,
        "EventGrid",
        new AzureKeyCredential(config.eventGridKey!)
      );
    } else {
      // Local Development: Use HTTP webhooks
      console.log("🔗 Using HTTP webhooks for local event publishing");
      console.log("  Catalog:", config.webhookEndpoints?.catalogService);
      console.log("  Reservation:", config.webhookEndpoints?.reservationService);
      console.log("  Staff:", config.webhookEndpoints?.staffService);
      this.webhookClient = new WebhookEventPublisher();
    }
  }

  private async sendEventGrid(eventType: string, data: any) {
    if (!this.eventGridClient) {
      throw new Error("Event Grid client not initialized");
    }

    await this.eventGridClient.send([
      {
        id: crypto.randomUUID(),
        eventType,
        subject: `LoanService/loans/${data.id}`,
        data,
        dataVersion: "1.0",
        eventTime: new Date().toISOString(),
      },
    ]);
  }

  async publishLoanCreated(loan: LoanRecord): Promise<void> {
    if (this.useEventGrid) {
      await this.sendEventGrid("Loan.Created", {
        id: loan.id,
        userId: loan.userId,
        deviceId: loan.deviceId,
        status: loan.status,
        createdAt: loan.createdAt
      });
    } else {
      // Send to Catalog and Reservation services via webhook
      const catalogUrl = EventPublisherFactory.getWebhookUrl("catalog");
      const reservationUrl = EventPublisherFactory.getWebhookUrl("reservation");
      
      if (catalogUrl) {
        await this.webhookClient!.publishLoanCreated(loan, catalogUrl);
      }
      if (reservationUrl) {
        await this.webhookClient!.publishLoanCreated(loan, reservationUrl);
      }
    }
  }

  async publishLoanCancelled(loan: LoanRecord): Promise<void> {
    if (this.useEventGrid) {
      await this.sendEventGrid("Loan.Cancelled", {
        id: loan.id,
        userId: loan.userId,
        deviceId: loan.deviceId,
        status: loan.status,
        cancelledAt: loan.cancelledAt,
        notes: loan.notes
      });
    } else {
      const catalogUrl = EventPublisherFactory.getWebhookUrl("catalog");
      const reservationUrl = EventPublisherFactory.getWebhookUrl("reservation");
      
      if (catalogUrl) {
        await this.webhookClient!.publishLoanCancelled(loan, catalogUrl);
      }
      if (reservationUrl) {
        await this.webhookClient!.publishLoanCancelled(loan, reservationUrl);
      }
    }
  }

  async publishLoanReturned(loan: LoanRecord): Promise<void> {
    if (this.useEventGrid) {
      await this.sendEventGrid("Loan.Returned", {
        id: loan.id,
        userId: loan.userId,
        deviceId: loan.deviceId,
        reservationId: loan.reservationId,
        status: loan.status,
        returnedAt: loan.returnedAt
      });
    } else {
      const catalogUrl = EventPublisherFactory.getWebhookUrl("catalog");
      const staffUrl = EventPublisherFactory.getWebhookUrl("staff");
      
      if (catalogUrl) {
        await this.webhookClient!.publishLoanReturned(loan, catalogUrl);
      }
      if (staffUrl) {
        await this.webhookClient!.publishLoanReturned(loan, staffUrl);
      }
    }
  }
}
