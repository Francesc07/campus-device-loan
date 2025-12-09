"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationEventsProcessor = void 0;
class ReservationEventsProcessor {
    constructor(activateLoanUseCase) {
        this.activateLoanUseCase = activateLoanUseCase;
    }
    /**
     * Handle Reservation.Confirmed events only
     */
    async handleConfirmed(data) {
        await this.activateLoanUseCase.execute(data);
    }
}
exports.ReservationEventsProcessor = ReservationEventsProcessor;
//# sourceMappingURL=ReservationEventsProcessor.js.map