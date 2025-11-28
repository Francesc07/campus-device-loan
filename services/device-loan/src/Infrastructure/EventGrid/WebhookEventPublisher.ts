// src/Infrastructure/EventGrid/WebhookEventPublisher.ts
import { LoanRecord } from "../../Domain/Entities/LoanRecord";

/**
 * Local-dev HTTP webhook publisher.
 * In real prod, you’ll use Event Grid instead.
 */
export class WebhookEventPublisher {
  // Minimal generic webhook sender for local dev.
  private async post(url: string, eventType: string, data: any): Promise<void> {
    try {
      // Azure Functions (Node 18) has global fetch.
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          {
            eventType,
            data,
          },
        ]),
      });
      console.log(`Webhook POST → ${url} (${eventType})`);
    } catch (err) {
      console.error(`Webhook POST failed → ${url} (${eventType})`, err);
    }
  }

  async publishLoanCreated(loan: LoanRecord, url: string): Promise<void> {
    await this.post(url, "Loan.Created", {
      id: loan.id,
      userId: loan.userId,
      deviceId: loan.deviceId,
      reservationId: loan.reservationId,
      status: loan.status,
      createdAt: loan.createdAt,
    });
  }

  async publishLoanCancelled(loan: LoanRecord, url: string): Promise<void> {
    await this.post(url, "Loan.Cancelled", {
      id: loan.id,
      userId: loan.userId,
      deviceId: loan.deviceId,
      reservationId: loan.reservationId,
      status: loan.status,
      cancelledAt: loan.cancelledAt,
      notes: loan.notes,
    });
  }
}
