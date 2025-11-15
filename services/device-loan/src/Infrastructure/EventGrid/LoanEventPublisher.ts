import { EventGridPublisherClient, AzureKeyCredential } from "@azure/eventgrid";
import { ILoanEventPublisher } from "../../Application/Interfaces/ILoanEventPublisher";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";

export class LoanEventPublisher implements ILoanEventPublisher {
  private client: EventGridPublisherClient<any>;

  constructor() {
    const endpoint = process.env.EVENTGRID_TOPIC_ENDPOINT!;
    const key = process.env.EVENTGRID_TOPIC_KEY!;

    this.client = new EventGridPublisherClient(
      endpoint,
      "EventGrid",
      new AzureKeyCredential(key)
    );
  }

  private async send(eventType: string, data: any) {
    await this.client.send([
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
    await this.send("Loan.Created", {
      id: loan.id,
      userId: loan.userId,
      deviceId: loan.deviceId,
      status: loan.status,
      createdAt: loan.createdAt
    });
  }

  async publishLoanCancelled(loan: LoanRecord): Promise<void> {
    await this.send("Loan.Cancelled", {
      id: loan.id,
      userId: loan.userId,
      deviceId: loan.deviceId,
      status: loan.status,
      cancelledAt: loan.cancelledAt,
      notes: loan.notes
    });
  }

  async publishLoanReturned(loan: LoanRecord): Promise<void> {
    await this.send("Loan.Returned", {
      id: loan.id,
      userId: loan.userId,
      deviceId: loan.deviceId,
      reservationId: loan.reservationId,
      status: loan.status,
      returnedAt: loan.returnedAt
    });
  }
}
