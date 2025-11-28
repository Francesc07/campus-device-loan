// src/Infrastructure/EventGrid/ReservationEventsProcessor.ts
import { ActivateLoanUseCase } from "../../Application/UseCases/ActivateLoanUseCase";
import { ReservationEventDTO } from "../../Application/Dtos/ReservationEventDTO";

export class ReservationEventsProcessor {
  constructor(
    private readonly activateLoanUseCase: ActivateLoanUseCase
  ) {}

  /**
   * Handle Reservation.Confirmed events only
   */
  async handleConfirmed(data: ReservationEventDTO) {
    await this.activateLoanUseCase.execute(data);
  }
}
