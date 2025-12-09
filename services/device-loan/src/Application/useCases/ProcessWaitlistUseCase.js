"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessWaitlistUseCase = void 0;
const LoanStatus_1 = require("../../Domain/Enums/LoanStatus");
/**
 * ProcessWaitlistUseCase
 *
 * When a device becomes available (e.g., after a return), this use case:
 * 1. Checks if there are any waitlisted requests for that device
 * 2. Moves the first waitlisted request to Pending status
 * 3. Publishes an event to notify the user and reservation service
 */
class ProcessWaitlistUseCase {
    constructor(loanRepo, snapshotRepo, eventPublisher) {
        this.loanRepo = loanRepo;
        this.snapshotRepo = snapshotRepo;
        this.eventPublisher = eventPublisher;
    }
    async execute(deviceId) {
        // Check if device is now available
        const device = await this.snapshotRepo.getSnapshot(deviceId);
        if (!device || device.availableCount <= 0) {
            return; // No devices available, nothing to process
        }
        // Get all waitlisted loans for this device, ordered by creation date
        const waitlistedLoans = await this.loanRepo.getByDeviceAndStatus(deviceId, LoanStatus_1.LoanStatus.Waitlisted);
        if (waitlistedLoans.length === 0) {
            return; // No one waiting for this device
        }
        // Sort by creation date to get FIFO order
        waitlistedLoans.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        // Process as many waitlisted requests as we have available devices
        const loansToProcess = waitlistedLoans.slice(0, device.availableCount);
        for (const loan of loansToProcess) {
            // Update status from Waitlisted to Pending
            loan.status = LoanStatus_1.LoanStatus.Pending;
            loan.updatedAt = new Date().toISOString();
            await this.loanRepo.update(loan);
            // Notify that the device is now available for this user
            await this.eventPublisher.publish("Loan.WaitlistProcessed", {
                loanId: loan.id,
                userId: loan.userId,
                deviceId: loan.deviceId,
                message: `Device ${device.brand} ${device.model} is now available for your loan request`,
                previousStatus: LoanStatus_1.LoanStatus.Waitlisted,
                newStatus: LoanStatus_1.LoanStatus.Pending
            });
        }
    }
}
exports.ProcessWaitlistUseCase = ProcessWaitlistUseCase;
//# sourceMappingURL=ProcessWaitlistUseCase.js.map