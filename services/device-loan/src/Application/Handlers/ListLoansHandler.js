"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLoansHandler = void 0;
class ListLoansHandler {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async execute(filter) {
        return this.useCase.execute(filter);
    }
}
exports.ListLoansHandler = ListLoansHandler;
//# sourceMappingURL=ListLoansHandler.js.map