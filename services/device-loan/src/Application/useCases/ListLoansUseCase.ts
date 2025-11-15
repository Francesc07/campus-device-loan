import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { ListLoansFilter } from "../Dtos/ListLoansDto";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";

export class ListLoansUseCase {
  constructor(private readonly repo: ILoanRepository) {}

  async execute(filter: ListLoansFilter): Promise<LoanRecord[]> {
    if (filter.loanId) {
      const loan = await this.repo.findById(filter.loanId);
      return loan ? [loan] : [];
    }

    if (filter.userId) {
      return this.repo.findByUserId(filter.userId);
    }

    if (filter.status) {
      return this.repo.listByStatus(filter.status as any);
    }

    return this.repo.listAll();
  }
}
