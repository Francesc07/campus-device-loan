import { EventGridPublisherClient, AzureKeyCredential } from "@azure/eventgrid";
import { Loan } from "../../Domain/Entities/Loan";

/**
 * Publishes loan events to Event Grid
 * Events: Loan.Created, Loan.Cancelled
 * Subscribers: Reservation Service, Catalog Service
 */
export class LoanEventPublisher {
  private client: EventGridPublisherClient<"EventGrid">;
 

  constructor() {
    const endpoint = process.env.EVENTGRID_TOPIC_ENDPOINT;
    const key = process.env.EVENTGRID_TOPIC_KEY;

    if (endpoint && key) {
      this.client = new EventGridPublisherClient(
        endpoint,
        "EventGrid",
        new AzureKeyCredential(key)
      );
      
    } else {
      console.warn("⚠️  Event Grid not configured. Events will be logged only.");
    }
  }

  async publishLoanCreated(loan: Loan): Promise<void> {
    const event = {
      eventType: "Loan.Created",
      subject: `LoanService/loans/${loan.loanId}`,
      data: {
        loanId: loan.loanId,
        userId: loan.userId,
        modelId: loan.modelId,
        status: loan.status,
        createdAt: loan.createdAt,
        dueAt: loan.dueAt
      },
      eventTime: new Date(),
      dataVersion: "1.0"
    };

    if (this.client) {
      await this.client.send([event]);
      console.log(`📢 Loan.Created published → ${loan.loanId}`);
    } else {
      console.log(`📢 [MOCK] Loan.Created → ${loan.loanId}`, event.data);
    }
  }

  async publishLoanCancelled(loan: Loan): Promise<void> {
    const event = {
      eventType: "Loan.Cancelled",
      subject: `LoanService/loans/${loan.loanId}`,
      data: {
        loanId: loan.loanId,
        userId: loan.userId,
        modelId: loan.modelId,
        status: loan.status,
        cancelledAt: loan.cancelledAt,
        createdAt: loan.createdAt
      },
      eventTime: new Date(),
      dataVersion: "1.0"
    };

    if (this.client) {
      await this.client.send([event]);
      console.log(`📢 Loan.Cancelled published → ${loan.loanId}`);
    } else {
      console.log(`📢 [MOCK] Loan.Cancelled → ${loan.loanId}`, event.data);
    }
  }
}
