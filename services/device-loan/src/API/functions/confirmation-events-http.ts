import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";
import { LoanStatus } from "../../Domain/Enums/LoanStatus";

export async function confirmationEventsHttp(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {

  const body = await req.json() as any;
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
    // Accept both eventType and actionType for compatibility
    const type = event.eventType || event.actionType;
    // Some events use data, some put all fields at root
    const data = event.data || event;

    context.log(`📋 Event data received:`, JSON.stringify(data, null, 2));

    // Defensive: require reservationId for all status updates
    const reservationId = data.reservationId;
    if (!reservationId) {
      context.warn(`⚠️ Event missing reservationId, skipping. Data: ${JSON.stringify(data)}`);
      continue;
    }

    // Normalize event type for both legacy and new events
    switch (type) {
      case "Confirmation.Collected":
      case "CONFIRMATION_COLLECTED":
        context.log("📦 Device collected - Activating loan:", {
          reservationId: data.reservationId,
          userId: data.userId,
          deviceId: data.deviceId
        });

        // Get loan and update status from Pending to Active
        try {
          const collectionLoan = await appServices.loanRepo.getByReservation(reservationId);
          if (collectionLoan) {
            collectionLoan.status = LoanStatus.Active;
            collectionLoan.updatedAt = new Date().toISOString();
            await appServices.loanRepo.update(collectionLoan);
            context.log(`✅ Loan ${collectionLoan.id} status: Pending → Active`);
          } else {
            context.warn(`⚠️ Loan not found for reservation: ${reservationId}`);
          }
        } catch (err) {
          context.error(`❌ Error updating loan to Active for reservation: ${reservationId}`, err);
        }
        break;

      case "Confirmation.Returned":
      case "CONFIRMATION_RETURNED":
        context.log("📦 Device returned - Completing loan:", {
          reservationId: data.reservationId,
          userId: data.userId,
          deviceId: data.deviceId
        });

        // Get loan, update status from Active/Overdue to Returned, and process waitlist
        try {
          const returnLoan = await appServices.loanRepo.getByReservation(reservationId);
          if (returnLoan) {
            const previousStatus = returnLoan.status;
            const now = new Date();
            const returnedAt = now.toISOString();

            // Check if loan was overdue when returned
            const dueDate = new Date(returnLoan.dueDate);
            const wasOverdue = now > dueDate && previousStatus === LoanStatus.Active;

            if (wasOverdue) {
              context.warn(`⚠️ Loan ${returnLoan.id} was overdue (due: ${returnLoan.dueDate}, returned: ${returnedAt})`);
            }

            // Always set final status to Returned when device is physically returned
            returnLoan.status = LoanStatus.Returned;
            returnLoan.returnedAt = returnedAt;
            returnLoan.updatedAt = returnedAt;

            await appServices.loanRepo.update(returnLoan);
            context.log(`✅ Loan ${returnLoan.id} status: ${previousStatus} → Returned${wasOverdue ? ' (was overdue)' : ''}`);

            // Send email notification to user
            if (returnLoan.userEmail) {
              context.log(`📧 Sending loan returned email to: ${returnLoan.userEmail}`);
              await appServices.emailService.sendLoanReturnedEmail({
                userEmail: returnLoan.userEmail,
                userName: returnLoan.userEmail,
                deviceBrand: returnLoan.deviceBrand || 'Device',
                deviceModel: returnLoan.deviceModel || '',
                loanId: returnLoan.id,
                wasLate: wasOverdue
              });
            }

            // Process waitlist for this device since it's now available
            context.log(`🔄 Processing waitlist for device: ${returnLoan.deviceId}`);
            await appServices.processWaitlistHandler.execute(returnLoan.deviceId);
          } else {
            context.warn(`⚠️ Loan not found for reservation: ${reservationId}`);
          }
        } catch (err) {
          context.error(`❌ Error updating loan to Returned for reservation: ${reservationId}`, err);
        }
        break;

      default:
        context.warn(`⚠️ Unknown confirmation event type: ${type}`);
    }
  }

  return { status: 200 };
}

app.http("confirmation-events-http", {
  route: "events/confirmation",
  methods: ["POST"],
  authLevel: "anonymous", // Event Grid must be allowed
  handler: confirmationEventsHttp
});
