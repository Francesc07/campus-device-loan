import { ReservationConfirmedEventDTO } from "../Dtos/ReservationEventDTO";
import { ActivateLoanUseCase } from "../UseCases/ActivateLoanUseCase";
import { LoanRecord } from "../../Domain/Entities/LoanRecord";

export class ActivateLoanHandler {
  constructor(private readonly useCase: ActivateLoanUseCase) {}

  async execute(event: ReservationConfirmedEventDTO): Promise<LoanRecord> {
    return this.useCase.execute(event);
  }
}
