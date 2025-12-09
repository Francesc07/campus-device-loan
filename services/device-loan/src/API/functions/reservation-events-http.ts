import { app, HttpRequest, HttpResponseInit } from "@azure/functions";

export async function reservationEventsHttp(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const events = await req.json();

    const eventArray = Array.isArray(events) ? events : [events];

    for (const evt of eventArray) {
      // 1️⃣ VALIDATION HANDSHAKE
      if (evt.eventType === "Microsoft.EventGrid.SubscriptionValidationEvent") {
        const validationCode = evt.data.validationCode;
        return {
          status: 200,
          jsonBody: { validationResponse: validationCode }
        };
      }

      // 2️⃣ NORMAL BUSINESS EVENTS
      const { eventType, data } = evt;

      switch (eventType) {
        case "Reservation.Confirmed":
          console.log("Loan service received Reservation.Confirmed:", data);
          break;

        case "Reservation.Cancelled":
          console.log("Loan service received Reservation.Cancelled:", data);
          break;
      }
    }

    return { status: 200 };
  } catch (err: any) {
    console.error("Error in reservationEventsHttp:", err.message);
    return { status: 500, jsonBody: { error: err.message } };
  }
}

app.http("reservation-events-http", {
  route: "events/reservations",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: reservationEventsHttp
});
