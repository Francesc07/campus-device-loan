import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { CancelLoanDto } from "../Dtos/CancelLoanDto";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";

export class CancelLoanUseCase {
  constructor(private readonly loanRepo: ILoanRepository) {}

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
    return loan;
  }
}
