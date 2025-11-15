import { CancelLoanDto } from "../Dtos/CancelLoanDto";
import { CancelLoanUseCase } from "../UseCases/CancelLoanUseCase";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";

export class CancelLoanHandler {
  constructor(private readonly useCase: CancelLoanUseCase) {}

  async execute(dto: CancelLoanDto): Promise<LoanRecord | null> {
    return this.useCase.execute(dto);
  }
}
