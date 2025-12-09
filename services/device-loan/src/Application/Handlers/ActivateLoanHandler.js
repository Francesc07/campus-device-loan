"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateLoanHandler = void 0;
class ActivateLoanHandler {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async execute(dto) {
        return this.useCase.execute(dto);
    }
}
exports.ActivateLoanHandler = ActivateLoanHandler;
//# sourceMappingURL=ActivateLoanHandler.js.map