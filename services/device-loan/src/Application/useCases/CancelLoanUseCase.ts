import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { ILoanEventPublisher } from "../Interfaces/ILoanEventPublisher";
import { CancelLoanDto } from "../Dtos/CancelLoanDto";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";

export class CancelLoanUseCase {
  constructor(
    private readonly repo: ILoanRepository,
    private readonly publisher: ILoanEventPublisher
  ) {}

  async execute(dto: CancelLoanDto) {
    const loan = await this.repo.findById(dto.loanId);
    if (!loan) throw new Error("Loan not found");

    if (loan.userId !== dto.userId) {
      throw new Error("Unauthorized: Cannot cancel another user's loan");
    }

    loan.status = LoanStatus.Cancelled;
    loan.cancelledAt = new Date().toISOString();
    loan.updatedAt = loan.cancelledAt;
    loan.notes = dto.reason;

    const updated = await this.repo.update(loan);

    await this.publisher.publishLoanCancelled(updated);

    return updated;
  }
}

