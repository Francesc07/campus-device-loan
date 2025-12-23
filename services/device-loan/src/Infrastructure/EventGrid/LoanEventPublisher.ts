import { ILoanEventPublisher } from "../../Application/Interfaces/ILoanEventPublisher";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";
import crypto from "crypto";

/**
 * Azure Event Grid publisher for loan events.
 * 
 * Publishes loan lifecycle events (Created, Cancelled, Activated, etc.) to Event Grid
 * for consumption by downstream services (Reservation, Catalog, Confirmation).
 * 
 * Supports both Azure Event Grid and local console logging modes.
 */
export class LoanEventPublisher implements ILoanEventPublisher {
  private mode: "azure" | "local";
  private topicEndpoint: string;
  private topicKey: string;

  constructor() {
    this.mode = (process.env.ENVIRONMENT === "dev-cloud" ||
      process.env.ENVIRONMENT === "test-cloud" ||
      process.env.ENVIRONMENT === "prod-cloud")
      ? "azure"
      : "local";

    this.topicEndpoint = process.env.EVENTGRID_TOPIC_ENDPOINT || "";
    this.topicKey = process.env.EVENTGRID_TOPIC_KEY || "";

    if (this.mode === "azure" && (!this.topicEndpoint || !this.topicKey)) {
      throw new Error("❌ Missing Event Grid settings for Azure mode.");
    }

    console.log(`📡 LoanEventPublisher running in mode: ${this.mode}`);
  }

  /**
   * Publishes a loan event to Event Grid or logs locally.
   * 
   * @param eventType - Type of loan event (Loan.Created, Loan.Cancelled, etc.)
   * @param data - Event payload (typically a LoanRecord object)
   */
  async publish(
    eventType: "Loan.Created" | "Loan.Cancelled" | "Loan.Waitlisted" | "Loan.WaitlistProcessed",
    data: any
  ): Promise<void> {
    if (this.mode === "azure") {
      return this.publishToEventGrid(eventType, data);
    }
    return this.publishLocal(eventType, data);
  }

  /** --- INTERNAL: Publish to Azure Event Grid --- */
  private async publishToEventGrid(eventType: string, data: any): Promise<void> {
    const events = [
      {
        id: crypto.randomUUID(),
        eventType,
        subject: `loan/${eventType}`,
        eventTime: new Date().toISOString(),
        dataVersion: "1.0",
        data // The data is the LoanRecord object
      },
    ];

    const response = await fetch(this.topicEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "aeg-sas-key": this.topicKey,
      },
      body: JSON.stringify(events),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`❌ Failed to publish ${eventType}:`, err);
      throw new Error(`Event Grid error: ${response.status}`);
    }

    console.log(`✅ Event published → ${eventType}`);
  }

  /** --- INTERNAL: Local development mode (no-op) --- */
  private async publishLocal(eventType: string, data: any): Promise<void> {
    console.log(`🔄 LOCAL MODE → Event skipped: ${eventType}`);
    console.log(JSON.stringify(data, null, 2));
  }
}