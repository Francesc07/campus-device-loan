import { CancelLoanUseCase } from "../UseCases/CancelLoanUseCase";
import { CancelLoanDto } from "../Dtos/CancelLoanDto";

export class CancelLoanHandler {
  constructor(private useCase: CancelLoanUseCase) {}

  async execute(dto: CancelLoanDto) {
    return this.useCase.execute(dto);
  }
}
