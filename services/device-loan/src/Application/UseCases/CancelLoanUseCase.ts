import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { ILoanEventPublisher } from "../Interfaces/ILoanEventPublisher";
import { CancelLoanDto } from "../Dtos/CancelLoanDto";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";
import { EmailService } from "../../Infrastructure/Notifications/EmailService";

/**
 * Use case for cancelling an active or pending loan.
 * 
 * Handles loan cancellation with authorization checks, status updates,
 * and event publishing to notify downstream services.
 */
export class CancelLoanUseCase {
  constructor(
    private readonly loanRepo: ILoanRepository,
    private readonly eventPublisher: ILoanEventPublisher,
    private readonly emailService: EmailService
  ) {}

  /**
   * Cancels an existing loan.
   * 
   * @param dto - Cancellation data (loanId, userId for authorization)
   * @returns Updated loan record with Cancelled status
   * @throws Error if loan not found or user unauthorized
   */
  async execute(dto: CancelLoanDto) {
    const loan = await this.loanRepo.getById(dto.loanId);
    if (!loan) throw new Error("Loan not found.");

    if (loan.userId !== dto.userId) {
      throw new Error("Unauthorized");
    }

    loan.status = LoanStatus.Cancelled;
    loan.cancelledAt = new Date().toISOString();
    loan.updatedAt = new Date().toISOString();

    await this.loanRepo.update(loan);
    
    // Publish cancellation event with full metadata
    await this.eventPublisher.publish("Loan.Cancelled", loan);
    
    // Send email notification to user
    if (loan.userEmail) {
      console.log(`📧 Sending loan cancelled email to: ${loan.userEmail}`);
      await this.emailService.sendLoanCancelledEmail({
        userEmail: loan.userEmail,
        userName: loan.userEmail,
        deviceBrand: loan.deviceBrand || 'Device',
        deviceModel: loan.deviceModel || '',
        loanId: loan.id
      });
    }
    
    return loan;
  }
}
