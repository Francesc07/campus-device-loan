"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessWaitlistHandler = void 0;
/**
 * ProcessWaitlistHandler
 *
 * Handles processing the waitlist when a device becomes available
 */
class ProcessWaitlistHandler {
    constructor(useCase) {
        this.useCase = useCase;
    }
    async execute(deviceId) {
        await this.useCase.execute(deviceId);
    }
}
exports.ProcessWaitlistHandler = ProcessWaitlistHandler;
//# sourceMappingURL=ProcessWaitlistHandler.js.map