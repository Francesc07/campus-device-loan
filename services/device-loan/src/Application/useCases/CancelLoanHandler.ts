import { Loan } from "../../Domain/Entities/Loan";
import { CosmosLoanRepository } from "../../Infrastructure/CosmosLoanRepository";
import { LoanEventPublisher } from "../../Infrastructure/EventGrid/LoanEventPublisher";

/**
 * Use Case: Cancel a loan before pickup
 * Publishes Loan.Cancelled event
 */
export class CancelLoanHandler {
  constructor(
    private loanRepo: CosmosLoanRepository,
    private publisher: LoanEventPublisher
  ) {}

  async execute(loanId: string): Promise<Loan | null> {
    // Find the loan
    const loan = await this.loanRepo.findById(loanId);
    
    if (!loan) {
      return null;
    }

    // Check if loan can be cancelled (not already returned or cancelled)
    if (loan.status === "cancelled") {
      throw new Error("Loan is already cancelled");
    }

    if (loan.status === "returned") {
      throw new Error("Cannot cancel a returned loan");
    }

    // Cancel the loan
    loan.status = "cancelled";
    loan.cancelledAt = new Date().toISOString();

    // Update in database
    await this.loanRepo.update(loan);

    // Publish Loan.Cancelled event
    await this.publisher.publishLoanCancelled(loan);

    return loan;
  }
}
