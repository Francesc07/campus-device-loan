"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLoanByIdUseCase = void 0;
class GetLoanByIdUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(loanId) {
        const loan = await this.repo.getById(loanId);
        if (!loan) {
            throw new Error(`Loan with id ${loanId} not found`);
        }
        return {
            id: loan.id,
            userId: loan.userId,
            deviceId: loan.deviceId,
            reservationId: loan.reservationId ?? null,
            startDate: loan.startDate,
            dueDate: loan.dueDate,
            status: loan.status,
            createdAt: loan.createdAt,
            updatedAt: loan.updatedAt,
        };
    }
}
exports.GetLoanByIdUseCase = GetLoanByIdUseCase;
//# sourceMappingURL=GetLoanByIdUseCase.js.map