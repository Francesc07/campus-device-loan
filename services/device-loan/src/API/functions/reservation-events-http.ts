import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { appServices } from "../../appServices";

export async function reservationEventsHttp(
  req: HttpRequest,
  ctx: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const events = await req.json();
    
    ctx.log("📨 Loan Service received reservation events:", JSON.stringify(events, null, 2));

    const eventArray = Array.isArray(events) ? events : [events];

    for (const evt of eventArray) {
      // 1️⃣ VALIDATION HANDSHAKE
      if (evt.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
        const validationCode = evt.data.validationCode;
        ctx.log("🔵 EventGrid validation handshake for reservation events");
        return {
          status: 200,
          jsonBody: { validationResponse: validationCode }
        };
      }

      // 2️⃣ NORMAL BUSINESS EVENTS
      const { eventType, data } = evt;
      
      ctx.log(`📋 Processing event type: ${eventType}`);
      ctx.log(`📋 Event data:`, JSON.stringify(data, null, 2));

      switch (eventType) {
        case "Reservation.Confirmed":
          ctx.log("📦 Reservation confirmed - Linking loan with reservationId:", {
            reservationId: data.reservationId,
            loanId: data.loanId || data.reservationId,
            deviceId: data.deviceId,
            userId: data.userId
          });
          
          try {
            // Link loan with reservationId (keeps status as Pending)
            const result = await appServices.linkReservationUseCase.execute({
              eventType: "Reservation.Confirmed",
              reservationId: data.reservationId,
              loanId: data.loanId,
              userId: data.userId,
              deviceId: data.deviceId
            });
            
            if (result) {
              ctx.log(`✅ Loan ${result.id} linked with reservationId: ${data.reservationId}`);
            } else {
              ctx.warn(`⚠️ Loan not found for loanId: ${data.loanId}`);
            }
          } catch (err) {
            ctx.error(`❌ Error linking loan with reservationId:`, err);
          }
          break;

        case "Reservation.Cancelled":
          ctx.log("🚫 Reservation cancelled:", data);
          // TODO: Handle reservation cancellation if needed
          break;

        default:
          ctx.warn(`⚠️ Unknown reservation event type: ${eventType}`);
      }
    }

    return { status: 200 };
  } catch (err: any) {
    ctx.error("❌ Error in reservationEventsHttp:", err.message);
    return { status: 500, jsonBody: { error: err.message } };
  }
}

app.http("reservation-events-http", {
  route: "events/reservations",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: reservationEventsHttp
});
