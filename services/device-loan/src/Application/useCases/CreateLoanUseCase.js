"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateLoanUseCase = void 0;
const LoanStatus_1 = require("../../Domain/Enums/LoanStatus");
const uuid_1 = require("uuid");
class CreateLoanUseCase {
    constructor(loanRepo, snapshotRepo, eventPublisher) {
        this.loanRepo = loanRepo;
        this.snapshotRepo = snapshotRepo;
        this.eventPublisher = eventPublisher;
    }
    async execute(dto) {
        const device = await this.snapshotRepo.getSnapshot(dto.deviceId);
        if (!device) {
            throw new Error("Device not found.");
        }
        const now = new Date();
        const due = new Date();
        due.setDate(due.getDate() + 2); // standard 2-day loan
        // Check if device is available
        const isAvailable = device.availableCount > 0;
        const status = isAvailable ? LoanStatus_1.LoanStatus.Pending : LoanStatus_1.LoanStatus.Waitlisted;
        const loan = {
            id: (0, uuid_1.v4)(),
            userId: dto.userId,
            reservationId: dto.reservationId,
            deviceId: dto.deviceId,
            startDate: now.toISOString(),
            dueDate: due.toISOString(),
            status: status,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString()
        };
        await this.loanRepo.create(loan);
        // Publish appropriate event based on status
        if (isAvailable) {
            await this.eventPublisher.publish("Loan.Created", loan);
        }
        else {
            await this.eventPublisher.publish("Loan.Waitlisted", {
                ...loan,
                message: `Device ${device.brand} ${device.model} is currently unavailable. Request added to waitlist.`
            });
        }
        return loan;
    }
}
exports.CreateLoanUseCase = CreateLoanUseCase;
//# sourceMappingURL=CreateLoanUseCase.js.map