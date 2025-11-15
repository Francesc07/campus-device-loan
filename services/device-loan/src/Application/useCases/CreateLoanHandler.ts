import { randomUUID } from "crypto";
import { Loan } from "../../Domain/Entities/Loan";
import { CosmosLoanRepository } from "../../Infrastructure/CosmosLoanRepository";
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

  async execute(userId: string, modelId: string): Promise<Loan> {
    const loanId = randomUUID();

    // Create new loan with 2-day timer
    const loan = new Loan(loanId, userId, modelId, "pending");

    // Save to database
    await this.loanRepo.create(loan);

    // Publish Loan.Created event (notifies Reservation + Catalog)
    await this.publisher.publishLoanCreated(loan);

    return loan;
  }
}
