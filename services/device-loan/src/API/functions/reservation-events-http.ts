// src/API/functions/reservationEventsHttp.ts

import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { appServices } from "../../appServices";

export async function reservationEventsHttp(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const body = await req.json();
    const events = Array.isArray(body) ? body : [body];

    for (const evt of events) {
      const { eventType, data } = evt;
      await appServices.reservationEventsProcessor.handleConfirmed(data);
    }

    return { status: 200 };
  } catch (err: any) {
    return { status: 500, jsonBody: { error: err.message } };
  }
}

app.http("reservation-events-http", {
  methods: ["POST"],
  route: "events/reservations",
  authLevel: "anonymous",
  handler: reservationEventsHttp,
});
