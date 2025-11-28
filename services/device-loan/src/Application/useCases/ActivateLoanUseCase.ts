import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { ReservationEventDTO } from "../Dtos/ReservationEventDTO";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";

/**
 * Activates a loan after Reservation.Confirmed
 */
export class ActivateLoanUseCase {
  constructor(private readonly loanRepo: ILoanRepository) {}

  async execute(evt: ReservationEventDTO) {
    const loan = await this.loanRepo.getByReservation(evt.reservationId);
    if (!loan) return null;

    loan.status = LoanStatus.Active;
    loan.updatedAt = new Date().toISOString();

    await this.loanRepo.update(loan);
    return loan;
  }
}
