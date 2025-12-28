import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { ILoanEventPublisher } from "../Interfaces/ILoanEventPublisher";
import { ReservationEventDTO } from "../Dtos/ReservationEventDTO";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";
import { EmailService } from "../../Infrastructure/Notifications/EmailService";

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
    private readonly eventPublisher: ILoanEventPublisher,
    private readonly emailService: EmailService
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
    
    // Send email notification to user
    if (loan.userEmail) {
      try {
        console.log(`📧 Sending loan activated email to: ${loan.userEmail}`);
        await this.emailService.sendLoanActivatedEmail({
          userEmail: loan.userEmail,
          userName: loan.userEmail,
          deviceBrand: loan.deviceBrand || 'Device',
          deviceModel: loan.deviceModel || '',
          dueDate: loan.dueDate,
          loanId: loan.id
        });
        console.log(`✅ Activation email sent successfully to: ${loan.userEmail}`);
      } catch (emailErr: any) {
        console.error(`❌ Failed to send activation email: ${emailErr.message}`);
      }
    }
    
    return loan;
  }
}
