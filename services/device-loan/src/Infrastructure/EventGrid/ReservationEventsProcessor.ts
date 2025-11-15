import { ActivateLoanHandler } from "../../Application/Handlers/ActivateLoanHandler";
import { CancelLoanHandler } from "../../Application/Handlers/CancelLoanHandler";
import { ReservationConfirmedEventDTO, ReservationCancelledEventDTO } from "../../Application/Dtos/ReservationEventDTO";

export class ReservationEventsProcessor {
  constructor(
    private readonly activateHandler: ActivateLoanHandler,
    private readonly cancelHandler: CancelLoanHandler
  ) {}

  async handleEvent(eventType: string, data: any) {
    switch (eventType) {
      case "Reservation.Confirmed":
        return this.activateHandler.execute(data as ReservationConfirmedEventDTO);

      case "Reservation.Cancelled":
        return this.cancelHandler.execute({
          loanId: data.loanId,
          userId: data.userId || "",
          reason: data.reason || "Cancelled by reservation service"
        });

      default:
        return;
    }
  }
}
