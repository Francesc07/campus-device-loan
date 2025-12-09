"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelLoanUseCase = void 0;
const LoanStatus_1 = require("../../Domain/Enums/LoanStatus");
class CancelLoanUseCase {
    constructor(loanRepo) {
        this.loanRepo = loanRepo;
    }
    async execute(dto) {
        const loan = await this.loanRepo.getById(dto.loanId);
        if (!loan)
            throw new Error("Loan not found.");
        if (loan.userId !== dto.userId) {
            throw new Error("Unauthorized");
        }
        loan.status = LoanStatus_1.LoanStatus.Cancelled;
        loan.cancelledAt = new Date().toISOString();
        loan.updatedAt = new Date().toISOString();
        await this.loanRepo.update(loan);
        return loan;
    }
}
exports.CancelLoanUseCase = CancelLoanUseCase;
//# sourceMappingURL=CancelLoanUseCase.js.map