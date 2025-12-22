import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { ILoanEventPublisher } from "../Interfaces/ILoanEventPublisher";
import { CancelLoanDto } from "../Dtos/CancelLoanDto";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";

export class CancelLoanUseCase {
  constructor(
    private readonly loanRepo: ILoanRepository,
    private readonly eventPublisher: ILoanEventPublisher
  ) {}

  async execute(dto: CancelLoanDto) {
    const loan = await this.loanRepo.getById(dto.loanId);
    if (!loan) throw new Error("Loan not found.");

    if (loan.userId !== dto.userId) {
      throw new Error("Unauthorized");
    }

    loan.status = LoanStatus.Cancelled;
    loan.cancelledAt = new Date().toISOString();
    loan.updatedAt = new Date().toISOString();

    await this.loanRepo.update(loan);
    
    // Publish cancellation event with full metadata
    await this.eventPublisher.publish("Loan.Cancelled", loan);
    
    return loan;
  }
}
