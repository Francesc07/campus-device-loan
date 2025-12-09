import { ILoanRepository } from "../Interfaces/ILoanRepository";
import { IDeviceSnapshotRepository } from "../Interfaces/IDeviceSnapshotRepository";
import { ILoanEventPublisher } from "../Interfaces/ILoanEventPublisher";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";

/**
 * ProcessWaitlistUseCase
 * 
 * When a device becomes available (e.g., after a return), this use case:
 * 1. Checks if there are any waitlisted requests for that device
 * 2. Moves the first waitlisted request to Pending status
 * 3. Publishes an event to notify the user and reservation service
 */
export class ProcessWaitlistUseCase {
  constructor(
    private loanRepo: ILoanRepository,
    private snapshotRepo: IDeviceSnapshotRepository,
    private eventPublisher: ILoanEventPublisher
  ) {}

  async execute(deviceId: string): Promise<void> {
    // Check if device is now available
    const device = await this.snapshotRepo.getSnapshot(deviceId);
    
    if (!device || device.availableCount <= 0) {
      return; // No devices available, nothing to process
    }

    // Get all waitlisted loans for this device, ordered by creation date
    const waitlistedLoans = await this.loanRepo.getByDeviceAndStatus(
      deviceId,
      LoanStatus.Waitlisted
    );

    if (waitlistedLoans.length === 0) {
      return; // No one waiting for this device
    }

    // Sort by creation date to get FIFO order
    waitlistedLoans.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Process as many waitlisted requests as we have available devices
    const loansToProcess = waitlistedLoans.slice(0, device.availableCount);

    for (const loan of loansToProcess) {
      // Update status from Waitlisted to Pending
      loan.status = LoanStatus.Pending;
      loan.updatedAt = new Date().toISOString();

      await this.loanRepo.update(loan);

      // Notify that the device is now available for this user
      await this.eventPublisher.publish("Loan.WaitlistProcessed", {
        loanId: loan.id,
        userId: loan.userId,
        deviceId: loan.deviceId,
        message: `Device ${device.brand} ${device.model} is now available for your loan request`,
        previousStatus: LoanStatus.Waitlisted,
        newStatus: LoanStatus.Pending
      });
    }
  }
}
