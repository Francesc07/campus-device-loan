// src/Application/Handlers/GetLoanByIdHandler.ts
import { GetLoanByIdUseCase } from "../UseCases/GetLoanByIdUseCase";
import { LoanResponseDto } from "../Dtos/LoanResponseDto";

export class GetLoanByIdHandler {
  constructor(private readonly useCase: GetLoanByIdUseCase) {}

  async execute(loanId: string): Promise<LoanResponseDto> {
    return this.useCase.execute(loanId);
  }
}
