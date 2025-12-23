import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { ILoanEventPublisher } from "../Interfaces/ILoanEventPublisher";
import { ReservationEventDTO } from "../Dtos/ReservationEventDTO";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";

/**
 * Use case for activating a loan when device is collected.
 * 
 * Transitions loan from Pending to Active status when the Confirmation Service
 * reports a device has been collected (CONFIRMATION_COLLECTED event).
 * Requires loan to have a reservationId already set.
 */
export class ActivateLoanUseCase {
  constructor(
    private readonly loanRepo: ILoanRepository,
    private readonly eventPublisher: ILoanEventPublisher
  ) {}

  /**
   * Activates a loan based on reservation confirmation.
   * 
   * @param evt - Reservation event containing reservationId
   * @returns Updated loan record with Active status, or null if reservation not found
   */
  async execute(evt: ReservationEventDTO) {
    const loan = await this.loanRepo.getByReservation(evt.reservationId);
    if (!loan) return null;

    loan.status = LoanStatus.Active;
    loan.updatedAt = new Date().toISOString();

    await this.loanRepo.update(loan);
    
    // Publish activation event with full metadata for confirmation service
    await this.eventPublisher.publish("Loan.Activated", loan);
    
    return loan;
  }
}
