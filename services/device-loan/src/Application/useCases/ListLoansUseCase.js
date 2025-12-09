"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLoansUseCase = void 0;
class ListLoansUseCase {
    constructor(loanRepo) {
        this.loanRepo = loanRepo;
    }
    async execute(dto) {
        // For now we ignore status filter and just list by user.
        return this.loanRepo.listByUser(dto.userId);
    }
}
exports.ListLoansUseCase = ListLoansUseCase;
//# sourceMappingURL=ListLoansUseCase.js.map