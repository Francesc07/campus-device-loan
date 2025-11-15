import { CreateLoanDto } from "../Dtos/CreateLoanDto";
import { CreateLoanUseCase } from "../UseCases/CreateLoanUseCase";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";

export class CreateLoanHandler {
  constructor(private readonly useCase: CreateLoanUseCase) {}

  async execute(dto: CreateLoanDto): Promise<LoanRecord> {
    return this.useCase.execute(dto);
  }
}
