import { randomUUID } from "crypto";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";
import { CosmosLoanRepository } from "../../Infrastructure/Persistence/CosmosLoanRepository";
import { LoanEventPublisher } from "../../Infrastructure/EventGrid/LoanEventPublisher";

/**
 * Use Case: Create a new loan (borrow/reserve device)
 * Triggers 2-day timer for pickup/return
 * Publishes Loan.Created event
 */
export class CreateLoanHandler {
  constructor(
    private loanRepo: CosmosLoanRepository,
    private publisher: LoanEventPublisher
  ) {}

  async execute(userId: string, deviceId: string): Promise<LoanRecord> {
    const now = new Date().toISOString();

    // Create new loan with pending status
    const loan: LoanRecord = {
      id: randomUUID(),
      userId: userId,
      reservationId: "",
      deviceId: deviceId,
      startDate: "",
      dueDate: "",
      status: LoanStatus.Pending,
      createdAt: now,
      updatedAt: now,
    };

    // Save to database
    await this.loanRepo.create(loan);

    // Publish Loan.Created event (notifies Reservation + Catalog)
    await this.publisher.publishLoanCreated(loan);

    return loan;
  }
}
