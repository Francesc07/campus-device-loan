import { LoanRecord } from "../../Domain/Entities/LoanRecord";

/**
 * HTTP Webhook Client for Local Development
 * Sends events to other services via HTTP POST
 */
export class WebhookEventPublisher {
  
  /**
   * Send event to a webhook endpoint
   */
  private async sendEvent(url: string, event: any): Promise<void> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([event]), // Event Grid sends as array
      });

      if (!response.ok) {
        console.error(`Webhook failed: ${response.status} ${response.statusText}`);
      } else {
        console.log(`✅ Event sent to ${url}`);
      }
    } catch (err: any) {
      console.error(`❌ Webhook error to ${url}:`, err.message);
      // Don't throw - we don't want to fail the operation if webhook fails
    }
  }

  /**
   * Publish Loan.Created event via webhook
   */
  async publishLoanCreated(loan: LoanRecord, webhookUrl: string): Promise<void> {
    const event = {
      id: `loan-created-${loan.id}`,
      eventType: "Loan.Created",
      subject: `loans/${loan.id}`,
      eventTime: new Date().toISOString(),
      data: {
        loanId: loan.id,
        userId: loan.userId,
        deviceId: loan.deviceId,
        status: loan.status,
        createdAt: loan.createdAt,
      },
    };

    await this.sendEvent(webhookUrl, event);
  }

  /**
   * Publish Loan.Cancelled event via webhook
   */
  async publishLoanCancelled(loan: LoanRecord, webhookUrl: string): Promise<void> {
    const event = {
      id: `loan-cancelled-${loan.id}`,
      eventType: "Loan.Cancelled",
      subject: `loans/${loan.id}`,
      eventTime: new Date().toISOString(),
      data: {
        loanId: loan.id,
        userId: loan.userId,
        deviceId: loan.deviceId,
        status: loan.status,
        cancelledAt: loan.cancelledAt,
      },
    };

    await this.sendEvent(webhookUrl, event);
  }

  /**
   * Publish Loan.Returned event via webhook
   */
  async publishLoanReturned(loan: LoanRecord, webhookUrl: string): Promise<void> {
    const event = {
      id: `loan-returned-${loan.id}`,
      eventType: "Loan.Returned",
      subject: `loans/${loan.id}`,
      eventTime: new Date().toISOString(),
      data: {
        loanId: loan.id,
        userId: loan.userId,
        deviceId: loan.deviceId,
        status: loan.status,
        returnedAt: loan.returnedAt,
      },
    };

    await this.sendEvent(webhookUrl, event);
  }
}
