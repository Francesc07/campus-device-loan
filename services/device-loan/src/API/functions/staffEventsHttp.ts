import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { appServices } from "../../appServices";

export async function staffEventsHttp(req: HttpRequest): Promise<HttpResponseInit> {
  const events = (await req.json()) as any[];

  for (const evt of events) {
    await appServices.staffEventsProcessor.handleEvent(evt.eventType, evt.data);
  }

  return { status: 200 };
}

app.http("staffEventsHttp", {
  route: "events/staff",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: staffEventsHttp
});
