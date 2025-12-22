import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { ReservationEventDTO } from "../Dtos/ReservationEventDTO";

/**
 * Updates a loan with reservationId after Reservation.Confirmed
 * This links the loan to the reservation system
 */
export class LinkReservationUseCase {
  constructor(private readonly loanRepo: ILoanRepository) {}

  async execute(evt: ReservationEventDTO) {
    // Reservation.Confirmed event should include loanId
    // WORKAROUND: If loanId is missing, use reservationId as loanId (reservation service uses same ID)
    const loanId = evt.loanId || evt.reservationId;
    
    if (!loanId) {
      throw new Error("loanId or reservationId is required in Reservation.Confirmed event");
    }

    const loan = await this.loanRepo.getById(loanId);
    if (!loan) {
      return null;
    }

    // Update loan with reservationId (keeps status as Pending)
    loan.reservationId = evt.reservationId;
    loan.updatedAt = new Date().toISOString();

    await this.loanRepo.update(loan);
    
    return loan;
  }
}
