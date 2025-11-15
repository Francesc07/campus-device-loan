import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { appServices } from "../../appServices";

export async function reservationEventsHttp(req: HttpRequest): Promise<HttpResponseInit> {
  const events = (await req.json()) as any[];

  for (const evt of events) {
    await appServices.reservationEventsProcessor.handleEvent(evt.eventType, evt.data);
  }

  return { status: 200 };
}

app.http("reservationEventsHttp", {
  route: "events/reservations",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: reservationEventsHttp
});
