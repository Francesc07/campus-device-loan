import { ActivateLoanUseCase } from "../UseCases/ActivateLoanUseCase";
import { ReservationEventDTO } from "../Dtos/ReservationEventDTO";

export class ActivateLoanHandler {
  constructor(private readonly useCase: ActivateLoanUseCase) {}

  async execute(dto: ReservationEventDTO) {
    return this.useCase.execute(dto);
  }
}
