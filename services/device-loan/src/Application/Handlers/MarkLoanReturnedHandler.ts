import { StaffReturnConfirmedEventDTO } from "../Dtos/StaffEventDTO";
import { MarkLoanReturnedUseCase } from "../UseCases/MarkLoanReturnedUseCase";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";

export class MarkLoanReturnedHandler {
  constructor(private readonly useCase: MarkLoanReturnedUseCase) {}

  async execute(event: StaffReturnConfirmedEventDTO): Promise<LoanRecord> {
    return this.useCase.execute(event);
  }
}
