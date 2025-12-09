// src/Application/UseCases/GetLoanByIdUseCase.ts
import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { LoanResponseDto } from "../Dtos/LoanResponseDto";

export class GetLoanByIdUseCase {
  constructor(private readonly repo: ILoanRepository) {}

  async execute(loanId: string): Promise<LoanResponseDto> {
    const loan = await this.repo.getById(loanId);

    if (!loan) {
      throw new Error(`Loan with id ${loanId} not found`);
    }

    return {
      id: loan.id,
      userId: loan.userId,
      deviceId: loan.deviceId,
      reservationId: loan.reservationId ?? null,
      startDate: loan.startDate,
      dueDate: loan.dueDate,
      status: loan.status,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
    };
  }
}
