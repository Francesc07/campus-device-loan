// src/Application/UseCases/ListLoansUseCase.ts
import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { ListLoansDto } from "../Dtos/ListLoansDto";

export class ListLoansUseCase {
  constructor(private readonly loanRepo: ILoanRepository) {}

  async execute(dto: ListLoansDto) {
    // For now we ignore status filter and just list by user.
    return this.loanRepo.listByUser(dto.userId);
  }
}
