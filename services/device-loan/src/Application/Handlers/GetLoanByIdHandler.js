"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLoanByIdHandler = void 0;
class GetLoanByIdHandler {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async execute(loanId) {
        return this.useCase.execute(loanId);
    }
}
exports.GetLoanByIdHandler = GetLoanByIdHandler;
//# sourceMappingURL=GetLoanByIdHandler.js.map