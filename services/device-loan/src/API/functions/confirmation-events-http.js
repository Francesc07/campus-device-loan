"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmationEventsHttp = confirmationEventsHttp;
const functions_1 = require("@azure/functions");
const appServices_1 = require("../../appServices");
async function confirmationEventsHttp(req, context) {
    const body = await req.json();
    const events = Array.isArray(body) ? body : [body];
    // Event Grid validation handshake - check if first event is validation
    if (events[0]?.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
        const validationCode = events[0].data.validationCode;
        context.log("🔵 EventGrid validation handshake");
        return {
            status: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ validationResponse: validationCode })
        };
    }
    context.log(`📩 Loan service received ${events.length} confirmation events`);
    for (const event of events) {
        const type = event.eventType;
        const data = event.data;
        context.log(`📋 Event data received:`, JSON.stringify(data, null, 2));
        switch (type) {
            case "Confirmation.Collected":
                context.log("📦 Device collected - Activating loan:", {
                    reservationId: data.reservationId,
                    userId: data.userId,
                    deviceId: data.deviceId
                });
                // Get loan and update status from Pending to Active
                const collectionLoan = await appServices_1.appServices.loanRepo.getByReservation(data.reservationId);
                if (collectionLoan) {
                    collectionLoan.status = "Active";
                    collectionLoan.updatedAt = new Date().toISOString();
                    await appServices_1.appServices.loanRepo.update(collectionLoan);
                    context.log(`✅ Loan ${collectionLoan.id} status: Pending → Active`);
                }
                else {
                    context.warn(`⚠️ Loan not found for reservation: ${data.reservationId}`);
                }
                break;
            case "Confirmation.Returned":
                context.log("📦 Device returned - Completing loan:", {
                    reservationId: data.reservationId,
                    userId: data.userId,
                    deviceId: data.deviceId
                });
                // Get loan, update status from Active to Returned, and process waitlist
                const returnLoan = await appServices_1.appServices.loanRepo.getByReservation(data.reservationId);
                if (returnLoan) {
                    returnLoan.status = "Returned";
                    returnLoan.returnedAt = new Date().toISOString();
                    returnLoan.updatedAt = new Date().toISOString();
                    await appServices_1.appServices.loanRepo.update(returnLoan);
                    context.log(`✅ Loan ${returnLoan.id} status: Active → Returned`);
                    // Process waitlist for this device since it's now available
                    context.log(`🔄 Processing waitlist for device: ${returnLoan.deviceId}`);
                    await appServices_1.appServices.processWaitlistHandler.execute(returnLoan.deviceId);
                }
                else {
                    context.warn(`⚠️ Loan not found for reservation: ${data.reservationId}`);
                }
                break;
            default:
                context.warn(`⚠️ Unknown confirmation event type: ${type}`);
        }
    }
    return { status: 200 };
}
functions_1.app.http("confirmation-events-http", {
    route: "events/confirmation",
    methods: ["POST"],
    authLevel: "anonymous", // Event Grid must be allowed
    handler: confirmationEventsHttp
});
//# sourceMappingURL=confirmation-events-http.js.map