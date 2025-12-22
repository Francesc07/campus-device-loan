import { CreateLoanUseCase } from "../UseCases/CreateLoanUseCase";
import { CreateLoanDto } from "../Dtos/CreateLoanDto";

export class CreateLoanHandler {
  constructor(private useCase: CreateLoanUseCase) {}

  async execute(dto: CreateLoanDto, accessToken?: string) {
    return this.useCase.execute(dto, accessToken);
  }
}
