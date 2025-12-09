"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateLoanHandler = void 0;
class CreateLoanHandler {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async execute(dto) {
        return this.useCase.execute(dto);
    }
}
exports.CreateLoanHandler = CreateLoanHandler;
//# sourceMappingURL=CreateLoanHandler.js.map