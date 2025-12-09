"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateLoanUseCase = void 0;
const LoanStatus_1 = require("../../Domain/Enums/LoanStatus");
/**
 * Activates a loan after Reservation.Confirmed
 */
class ActivateLoanUseCase {
    constructor(loanRepo) {
        this.loanRepo = loanRepo;
    }
    async execute(evt) {
        const loan = await this.loanRepo.getByReservation(evt.reservationId);
        if (!loan)
            return null;
        loan.status = LoanStatus_1.LoanStatus.Active;
        loan.updatedAt = new Date().toISOString();
        await this.loanRepo.update(loan);
        return loan;
    }
}
exports.ActivateLoanUseCase = ActivateLoanUseCase;
//# sourceMappingURL=ActivateLoanUseCase.js.map