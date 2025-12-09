"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CancelLoanHandler = void 0;
class CancelLoanHandler {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async execute(dto) {
        return this.useCase.execute(dto);
    }
}
exports.CancelLoanHandler = CancelLoanHandler;
//# sourceMappingURL=CancelLoanHandler.js.map