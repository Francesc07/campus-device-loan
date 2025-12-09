"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffEventsProcessor = void 0;
class StaffEventsProcessor {
    constructor(loanRepository) {
        this.loanRepository = loanRepository;
    }
    async handleEvent(eventType, data) {
        switch (eventType) {
            case "Staff.DeviceReturned":
                await this.handleDeviceReturned(data.loanId);
                break;
            default:
                // No other staff events for loan service
                break;
        }
    }
    async handleDeviceReturned(loanId) {
        const loan = await this.loanRepository.getById(loanId);
        if (!loan)
            return;
        // Use LoanStatus enum for type safety
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { LoanStatus } = require("../../Domain/Enums/LoanStatus");
        loan.status = LoanStatus.Returned;
        loan.returnedAt = new Date().toISOString();
        await this.loanRepository.update(loan);
    }
}
exports.StaffEventsProcessor = StaffEventsProcessor;
//# sourceMappingURL=StaffEventsProcessor.js.map