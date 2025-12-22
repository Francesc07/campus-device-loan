import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { ILoanEventPublisher } from "../Interfaces/ILoanEventPublisher";
import { ReservationEventDTO } from "../Dtos/ReservationEventDTO";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";

/**
 * Activates a loan when device is collected (CONFIRMATION_COLLECTED event)
 * Changes status from Pending → Active
 * Requires loan to have a reservationId already set
 */
export class ActivateLoanUseCase {
  constructor(
    private readonly loanRepo: ILoanRepository,
    private readonly eventPublisher: ILoanEventPublisher
  ) {}

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
